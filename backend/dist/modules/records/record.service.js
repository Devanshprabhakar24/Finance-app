const { FilterQuery, Types  } = require('mongoose');
const { FinancialRecord, IFinancialRecord  } = require('./record.model');
const { CreateRecordInput, UpdateRecordInput, RecordFilterInput  } = require('./record.schema');
const { paginate, PaginationResult  } = require('../../utils/paginate');
const { uploadToCloudinary, deleteFromCloudinary  } = require('../../config/cloudinary');
const { logger  } = require('../../utils/logger');
const { NotFoundError  } = require('../../middleware/errorHandler');

/**
 * Create financial record
 */
const createRecord = async (
  data,
  userId: string
)=> {
  const record = await FinancialRecord.create({
    ...data,
    createdBy,
    lastModifiedBy,
  });

  logger.info(`Financial record created: ${record._id} by user ${userId}`);
  return record;
};

/**
 * Get all records with filters, search, and pagination
 */
const getAllRecords = async (
  filters: RecordFilterInput
)=> {
  const query= { isDeleted: false };

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

  return paginate(
    FinancialRecord,
    query,
    {
      page,
      limit,
      sortBy,
      order,
      allowedSortFields, 'amount', 'title', 'category', 'createdAt', 'updatedAt'],
    },
    'createdBy'
  );
};

/**
 * Get record by ID (Section 1.3 - uses lean() for read-only queries)
 */
const getRecordById = async (recordId)=> {
  const record = await FinancialRecord.findOne({
    _id,
    isDeleted,
  })
    .populate('createdBy', 'name email')
    .lean();

  if (!record) throw new NotFoundError('Financial record not found');
  return record;
};

/**
 * Update record — tracks lastModifiedBy
 */
const updateRecord = async (
  recordId,
  data,
  userId: string
)=> {
  const record = await FinancialRecord.findOne({ _id, isDeleted);
  if (!record) throw new NotFoundError('Financial record not found');

  Object.assign(record, data);
  record.lastModifiedBy = new Types.ObjectId(userId);
  await record.save();

  logger.info(`Financial record updated: ${recordId} by user ${userId}`);
  return record;
};

/**
 * Soft delete record with Cloudinary cleanup
 */
const deleteRecord = async (
  recordId,
  userId: string
)=> {
  const record = await FinancialRecord.findOne({ _id, isDeleted);
  if (!record) throw new NotFoundError('Financial record not found');

  record.isDeleted = true;
  record.deletedAt = new Date();
  record.lastModifiedBy = new Types.ObjectId(userId);
  
  // Clean up Cloudinary attachment if exists (fire-and-forget)
  if (record.attachmentPublicId) {
    deleteFromCloudinary(record.attachmentPublicId)
      .then(() => {
        logger.info(`Cloudinary attachment deleted: ${record.attachmentPublicId}`);
        // Null out attachment fields after successful deletion
        FinancialRecord.updateOne(
          { _id,
          { $unset: { attachmentUrl, attachmentPublicId: '' } }
        ).catch(err => logger.error('Failed to clear attachment fields, err));
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
const uploadAttachment = async (
  recordId,
  buffer: Buffer
)=> {
  const record = await FinancialRecord.findOne({ _id, isDeleted);
  if (!record) throw new NotFoundError('Financial record not found');

  if (record.attachmentPublicId) {
    try {
      await deleteFromCloudinary(record.attachmentPublicId);
    } catch (error) {
      logger.warn('Failed to delete old attachment, error);
    }
  }

  const result = await uploadToCloudinary(buffer, 'finance-dashboard/attachments', 'auto');
  record.attachmentUrl = result.url;
  record.attachmentPublicId = result.publicId;
  await record.save();

  logger.info(`Attachment uploaded for record: ${recordId}`);
  return record;
};
