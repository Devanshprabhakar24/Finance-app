import { FilterQuery, Types } from 'mongoose';
import { FinancialRecord, IFinancialRecord } from './record.model';
import { CreateRecordInput, UpdateRecordInput, RecordFilterInput } from './record.schema';
import { paginate, PaginationResult } from '../../utils/paginate';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary';
import { logger } from '../../utils/logger';
import { NotFoundError, ForbiddenError } from '../../middleware/errorHandler';
import { UserRole } from '../users/user.model';

/**
 * Create financial record with RBAC
 * - Admin: can create for any user (uses targetUserId)
 * - Analyst: forbidden
 * - User: creates for themselves only
 */
export const createRecord = async (
  data: CreateRecordInput,
  targetUserId: string,
  requestingUserRole: UserRole,
  requestingUserId: string
): Promise<IFinancialRecord> => {
  // Analyst cannot create records
  if (requestingUserRole === UserRole.ANALYST) {
    throw new ForbiddenError('Analysts have read-only access');
  }

  // Determine which user this record belongs to
  let recordUserId: string;
  if (requestingUserRole === UserRole.ADMIN && targetUserId) {
    // Admin can create for any user
    recordUserId = targetUserId;
  } else {
    // Regular user creates for themselves
    recordUserId = requestingUserId;
  }

  const record = await FinancialRecord.create({
    ...data,
    userId: recordUserId,
    createdBy: requestingUserId,
    lastModifiedBy: requestingUserId,
  });

  logger.info(`Financial record created: ${record._id} by user ${requestingUserId} for user ${recordUserId}`);
  return record;
};

/**
 * Get all records with filters, search, and pagination
 * - Admin with no targetUserId: returns ALL records with user info
 * - Admin with targetUserId: returns records for that specific user
 * - Analyst with no targetUserId: returns ALL records with user info (read only)
 * - Analyst with targetUserId: returns records for that specific user (read only)
 * - User: returns only their own records
 */
export const getAllRecords = async (
  filters: RecordFilterInput,
  targetUserId: string | undefined,
  requestingUserRole: UserRole
): Promise<PaginationResult<IFinancialRecord>> => {
  const query: FilterQuery<IFinancialRecord> = { isDeleted: false };

  // Apply userId filter based on role
  if (requestingUserRole === UserRole.ADMIN) {
    // Admin with targetUserId filters to that user, otherwise sees all
    if (targetUserId) {
      query.userId = new Types.ObjectId(targetUserId);
    }
    // No userId filter = admin sees all records
  } else if (requestingUserRole === UserRole.ANALYST) {
    // Analyst can see all records or filter by specific user
    if (targetUserId) {
      query.userId = new Types.ObjectId(targetUserId);
    }
    // No userId filter = analyst sees all records (read-only)
  } else {
    // Regular user sees only their own records
    query.userId = new Types.ObjectId(targetUserId);
  }

  if (filters.type) query.type = filters.type;
  if (filters.category) query.category = new RegExp(filters.category, 'i');

  if (filters.from || filters.to) {
    query.date = {};
    if (filters.from) query.date.$gte = new Date(filters.from);
    if (filters.to) query.date.$lte = new Date(filters.to);
  }

  // Full-text search across title, notes, and category (Section 1.2)
  // Uses $text operator with the text index for better performance
  if (filters.search) {
    // NOTE: Collection scan on regex — upgrade to Atlas Search for datasets > 100k records
    query.$text = { $search: filters.search };
  }

  const populateFields = (requestingUserRole === UserRole.ADMIN || requestingUserRole === UserRole.ANALYST) 
    ? 'createdBy userId' 
    : 'createdBy';

  return paginate(
    FinancialRecord,
    query,
    {
      page: filters.page,
      limit: filters.limit,
      sortBy: filters.sortBy || 'date',
      order: filters.order || 'desc',
      allowedSortFields: ['date', 'amount', 'title', 'category', 'createdAt', 'updatedAt'],
    },
    populateFields
  );
};

/**
 * Get record by ID with RBAC check
 */
export const getRecordById = async (
  recordId: string,
  requestingUserId: string,
  requestingUserRole: UserRole
): Promise<IFinancialRecord> => {
  const record = await FinancialRecord.findOne({
    _id: recordId,
    isDeleted: false,
  })
    .populate('createdBy', 'name email')
    .populate('userId', 'name email')
    .lean();

  if (!record) throw new NotFoundError('Financial record not found');

  // Check access: admin can see all, others only their own
  if (requestingUserRole !== UserRole.ADMIN && requestingUserRole !== UserRole.ANALYST) {
    if (record.userId.toString() !== requestingUserId) {
      throw new ForbiddenError('You can only view your own records');
    }
  }

  return record as unknown as IFinancialRecord;
};

/**
 * Update record with RBAC
 * - Admin: can update any record
 * - Analyst: forbidden
 * - User: can only update their own records
 */
export const updateRecord = async (
  recordId: string,
  data: UpdateRecordInput,
  requestingUserId: string,
  requestingUserRole: UserRole
): Promise<IFinancialRecord> => {
  // Analyst cannot update records
  if (requestingUserRole === UserRole.ANALYST) {
    throw new ForbiddenError('Analysts have read-only access');
  }

  const record = await FinancialRecord.findOne({ _id: recordId, isDeleted: false });
  if (!record) throw new NotFoundError('Financial record not found');

  // Check ownership for non-admin users
  if (requestingUserRole !== UserRole.ADMIN) {
    if (record.userId.toString() !== requestingUserId) {
      throw new ForbiddenError('You can only update your own records');
    }
  }

  Object.assign(record, data);
  record.lastModifiedBy = new Types.ObjectId(requestingUserId);
  await record.save();

  logger.info(`Financial record updated: ${recordId} by user ${requestingUserId}`);
  return record;
};

/**
 * Soft delete record with RBAC and Cloudinary cleanup
 * - Admin: can delete any record
 * - Analyst: forbidden
 * - User: can only delete their own records
 */
export const deleteRecord = async (
  recordId: string,
  requestingUserId: string,
  requestingUserRole: UserRole
): Promise<IFinancialRecord> => {
  // Analyst cannot delete records
  if (requestingUserRole === UserRole.ANALYST) {
    throw new ForbiddenError('Analysts have read-only access');
  }

  const record = await FinancialRecord.findOne({ _id: recordId, isDeleted: false });
  if (!record) throw new NotFoundError('Financial record not found');

  // Check ownership for non-admin users
  if (requestingUserRole !== UserRole.ADMIN) {
    if (record.userId.toString() !== requestingUserId) {
      throw new ForbiddenError('You can only delete your own records');
    }
  }

  record.isDeleted = true;
  record.deletedAt = new Date();
  record.lastModifiedBy = new Types.ObjectId(requestingUserId);
  
  // Clean up Cloudinary attachment if exists (fire-and-forget)
  if (record.attachmentPublicId) {
    deleteFromCloudinary(record.attachmentPublicId)
      .then(() => {
        logger.info(`Cloudinary attachment deleted: ${record.attachmentPublicId}`);
        // Null out attachment fields after successful deletion
        FinancialRecord.updateOne(
          { _id: recordId },
          { $unset: { attachmentUrl: '', attachmentPublicId: '' } }
        ).catch(err => logger.error('Failed to clear attachment fields:', err));
      })
      .catch(error => {
        logger.error(`Failed to delete Cloudinary attachment ${record.attachmentPublicId}:`, error);
      });
  }
  
  await record.save();

  logger.info(`Financial record soft-deleted: ${recordId} by user ${requestingUserId}`);
  return record;
};

/**
 * Upload attachment to record
 */
export const uploadAttachment = async (
  recordId: string,
  buffer: Buffer,
  resourceType: 'image' | 'raw' = 'image'
): Promise<IFinancialRecord> => {
  const record = await FinancialRecord.findOne({ _id: recordId, isDeleted: false });
  if (!record) throw new NotFoundError('Financial record not found');

  if (record.attachmentPublicId) {
    try {
      await deleteFromCloudinary(record.attachmentPublicId);
    } catch (error) {
      logger.warn('Failed to delete old attachment:', error);
    }
  }

  const result = await uploadToCloudinary(buffer, 'finance-dashboard/attachments', resourceType);
  record.attachmentUrl = result.url;
  record.attachmentPublicId = result.publicId;
  await record.save();

  logger.info(`Attachment uploaded for record: ${recordId}`);
  return record;
};
