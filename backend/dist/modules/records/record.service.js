"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAttachment = exports.deleteRecord = exports.updateRecord = exports.getRecordById = exports.getAllRecords = exports.createRecord = void 0;
const mongoose_1 = require("mongoose");
const record_model_1 = require("./record.model");
const paginate_1 = require("../../utils/paginate");
const cloudinary_1 = require("../../config/cloudinary");
const logger_1 = require("../../utils/logger");
const errorHandler_1 = require("../../middleware/errorHandler");
/**
 * Create financial record
 */
const createRecord = async (data, userId) => {
    const record = await record_model_1.FinancialRecord.create({
        ...data,
        createdBy: userId,
        lastModifiedBy: userId,
    });
    logger_1.logger.info(`Financial record created: ${record._id} by user ${userId}`);
    return record;
};
exports.createRecord = createRecord;
/**
 * Get all records with filters, search, and pagination
 */
const getAllRecords = async (filters) => {
    const query = { isDeleted: false };
    if (filters.type)
        query.type = filters.type;
    if (filters.category)
        query.category = new RegExp(filters.category, 'i');
    if (filters.from || filters.to) {
        query.date = {};
        if (filters.from)
            query.date.$gte = new Date(filters.from);
        if (filters.to)
            query.date.$lte = new Date(filters.to);
    }
    // Full-text search across title, notes, and category (Section 1.2)
    // Uses $text operator with the text index for better performance
    if (filters.search) {
        // NOTE: Collection scan on regex — upgrade to Atlas Search for datasets > 100k records
        query.$text = { $search: filters.search };
    }
    return (0, paginate_1.paginate)(record_model_1.FinancialRecord, query, {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy || 'date',
        order: filters.order || 'desc',
        allowedSortFields: ['date', 'amount', 'title', 'category', 'createdAt', 'updatedAt'],
    }, 'createdBy');
};
exports.getAllRecords = getAllRecords;
/**
 * Get record by ID (Section 1.3 - uses lean() for read-only queries)
 */
const getRecordById = async (recordId) => {
    const record = await record_model_1.FinancialRecord.findOne({
        _id: recordId,
        isDeleted: false,
    })
        .populate('createdBy', 'name email')
        .lean();
    if (!record)
        throw new errorHandler_1.NotFoundError('Financial record not found');
    return record;
};
exports.getRecordById = getRecordById;
/**
 * Update record — tracks lastModifiedBy
 */
const updateRecord = async (recordId, data, userId) => {
    const record = await record_model_1.FinancialRecord.findOne({ _id: recordId, isDeleted: false });
    if (!record)
        throw new errorHandler_1.NotFoundError('Financial record not found');
    Object.assign(record, data);
    record.lastModifiedBy = new mongoose_1.Types.ObjectId(userId);
    await record.save();
    logger_1.logger.info(`Financial record updated: ${recordId} by user ${userId}`);
    return record;
};
exports.updateRecord = updateRecord;
/**
 * Soft delete record with Cloudinary cleanup
 */
const deleteRecord = async (recordId, userId) => {
    const record = await record_model_1.FinancialRecord.findOne({ _id: recordId, isDeleted: false });
    if (!record)
        throw new errorHandler_1.NotFoundError('Financial record not found');
    record.isDeleted = true;
    record.deletedAt = new Date();
    record.lastModifiedBy = new mongoose_1.Types.ObjectId(userId);
    // Clean up Cloudinary attachment if exists (fire-and-forget)
    if (record.attachmentPublicId) {
        (0, cloudinary_1.deleteFromCloudinary)(record.attachmentPublicId)
            .then(() => {
            logger_1.logger.info(`Cloudinary attachment deleted: ${record.attachmentPublicId}`);
            // Null out attachment fields after successful deletion
            record_model_1.FinancialRecord.updateOne({ _id: recordId }, { $unset: { attachmentUrl: '', attachmentPublicId: '' } }).catch(err => logger_1.logger.error('Failed to clear attachment fields:', err));
        })
            .catch(error => {
            logger_1.logger.error(`Failed to delete Cloudinary attachment ${record.attachmentPublicId}:`, error);
        });
    }
    await record.save();
    logger_1.logger.info(`Financial record soft-deleted: ${recordId} by user ${userId}`);
    return record;
};
exports.deleteRecord = deleteRecord;
/**
 * Upload attachment to record
 */
const uploadAttachment = async (recordId, buffer) => {
    const record = await record_model_1.FinancialRecord.findOne({ _id: recordId, isDeleted: false });
    if (!record)
        throw new errorHandler_1.NotFoundError('Financial record not found');
    if (record.attachmentPublicId) {
        try {
            await (0, cloudinary_1.deleteFromCloudinary)(record.attachmentPublicId);
        }
        catch (error) {
            logger_1.logger.warn('Failed to delete old attachment:', error);
        }
    }
    const result = await (0, cloudinary_1.uploadToCloudinary)(buffer, 'finance-dashboard/attachments', 'auto');
    record.attachmentUrl = result.url;
    record.attachmentPublicId = result.publicId;
    await record.save();
    logger_1.logger.info(`Attachment uploaded for record: ${recordId}`);
    return record;
};
exports.uploadAttachment = uploadAttachment;
