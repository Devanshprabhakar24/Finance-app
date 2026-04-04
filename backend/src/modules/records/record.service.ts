import { FilterQuery } from 'mongoose';
import { FinancialRecord, IFinancialRecord } from './record.model';
import { CreateRecordInput, UpdateRecordInput, RecordFilterInput } from './record.schema';
import { paginate, PaginationResult } from '../../utils/paginate';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary';
import { logger } from '../../utils/logger';
import { NotFoundError } from '../../middleware/errorHandler';

/**
 * Create financial record
 */
export const createRecord = async (
  data: CreateRecordInput,
  userId: string
): Promise<IFinancialRecord> => {
  const record = await FinancialRecord.create({
    ...data,
    createdBy: userId,
    lastModifiedBy: userId,
  });

  logger.info(`Financial record created: ${record._id} by user ${userId}`);
  return record;
};

/**
 * Get all records with filters, search, and pagination
 */
export const getAllRecords = async (
  filters: RecordFilterInput
): Promise<PaginationResult<IFinancialRecord>> => {
  const query: FilterQuery<IFinancialRecord> = { isDeleted: false };

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
    (query as any).$text = { $search: filters.search };
  }

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
    'createdBy'
  );
};

/**
 * Get record by ID (Section 1.3 - uses lean() for read-only queries)
 */
export const getRecordById = async (recordId: string): Promise<IFinancialRecord> => {
  const record = await FinancialRecord.findOne({
    _id: recordId,
    isDeleted: false,
  })
    .populate('createdBy', 'name email')
    .lean();

  if (!record) throw new NotFoundError('Financial record not found');
  return record as IFinancialRecord;
};

/**
 * Update record — tracks lastModifiedBy
 */
export const updateRecord = async (
  recordId: string,
  data: UpdateRecordInput,
  userId: string
): Promise<IFinancialRecord> => {
  const record = await FinancialRecord.findOne({ _id: recordId, isDeleted: false });
  if (!record) throw new NotFoundError('Financial record not found');

  Object.assign(record, data);
  record.lastModifiedBy = userId as any; // Convert string to ObjectId
  await record.save();

  logger.info(`Financial record updated: ${recordId} by user ${userId}`);
  return record;
};

/**
 * Soft delete record with Cloudinary cleanup
 */
export const deleteRecord = async (
  recordId: string,
  userId: string
): Promise<IFinancialRecord> => {
  const record = await FinancialRecord.findOne({ _id: recordId, isDeleted: false });
  if (!record) throw new NotFoundError('Financial record not found');

  record.isDeleted = true;
  record.deletedAt = new Date();
  record.lastModifiedBy = userId as any; // Convert string to ObjectId
  
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

  logger.info(`Financial record soft-deleted: ${recordId} by user ${userId}`);
  return record;
};

/**
 * Upload attachment to record
 */
export const uploadAttachment = async (
  recordId: string,
  buffer: Buffer
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

  const result = await uploadToCloudinary(buffer, 'finance-dashboard/attachments', 'auto');
  record.attachmentUrl = result.url;
  record.attachmentPublicId = result.publicId;
  await record.save();

  logger.info(`Attachment uploaded for record: ${recordId}`);
  return record;
};
