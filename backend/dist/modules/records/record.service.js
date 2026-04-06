"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAttachment = exports.deleteRecord = exports.updateRecord = exports.getRecordById = exports.getAllRecords = exports.createRecord = void 0;
const mongoose_1 = require("mongoose");
const record_model_1 = require("./record.model");
const paginate_1 = require("../../utils/paginate");
const cloudinary_1 = require("../../config/cloudinary");
const logger_1 = require("../../utils/logger");
const errorHandler_1 = require("../../middleware/errorHandler");
const user_model_1 = require("../users/user.model");
/**
 * Create financial record with RBAC
 * - Admin: can create for any user (uses targetUserId)
 * - Analyst: forbidden
 * - User: creates for themselves only
 */
const createRecord = async (data, targetUserId, requestingUserRole, requestingUserId) => {
    // Analyst cannot create records
    if (requestingUserRole === user_model_1.UserRole.ANALYST) {
        throw new errorHandler_1.ForbiddenError('Analysts have read-only access');
    }
    // Determine which user this record belongs to
    let recordUserId;
    if (requestingUserRole === user_model_1.UserRole.ADMIN && targetUserId) {
        // Admin can create for any user
        recordUserId = targetUserId;
    }
    else {
        // Regular user creates for themselves
        recordUserId = requestingUserId;
    }
    const record = await record_model_1.FinancialRecord.create({
        ...data,
        userId: recordUserId,
        createdBy: requestingUserId,
        lastModifiedBy: requestingUserId,
    });
    logger_1.logger.info(`Financial record created: ${record._id} by user ${requestingUserId} for user ${recordUserId}`);
    return record;
};
exports.createRecord = createRecord;
/**
 * Get all records with filters, search, and pagination
 * - Admin with no targetUserId: returns ALL records with user info
 * - Admin with targetUserId: returns records for that specific user
 * - Analyst with no targetUserId: returns ALL records with user info (read only)
 * - Analyst with targetUserId: returns records for that specific user (read only)
 * - User: returns only their own records (STRICT - no exceptions)
 */
const getAllRecords = async (filters, targetUserId, requestingUserRole) => {
    const query = { isDeleted: false };
    // 🔒 SECURITY: Apply userId filter based on role
    if (requestingUserRole === user_model_1.UserRole.ADMIN) {
        // Admin with targetUserId filters to that user, otherwise sees all
        if (targetUserId) {
            query.userId = new mongoose_1.Types.ObjectId(targetUserId);
        }
        // No userId filter = admin sees all records
    }
    else if (requestingUserRole === user_model_1.UserRole.ANALYST) {
        // Analyst can see all records or filter by specific user
        if (targetUserId) {
            query.userId = new mongoose_1.Types.ObjectId(targetUserId);
        }
        // No userId filter = analyst sees all records (read-only)
    }
    else {
        // 🚨 CRITICAL: Regular user MUST only see their own records
        // Validate targetUserId exists to prevent data leakage
        if (!targetUserId) {
            throw new errorHandler_1.ForbiddenError('User ID is required for data access');
        }
        // STRICT filter: only records belonging to this specific user
        query.userId = new mongoose_1.Types.ObjectId(targetUserId);
        // 🔒 ADDITIONAL SECURITY: Also filter by createdBy as fallback
        // This ensures even if userId is missing on old records, they won't leak
        query.$or = [
            { userId: new mongoose_1.Types.ObjectId(targetUserId) },
            {
                userId: { $exists: false },
                createdBy: new mongoose_1.Types.ObjectId(targetUserId)
            }
        ];
    }
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
    const populateFields = (requestingUserRole === user_model_1.UserRole.ADMIN || requestingUserRole === user_model_1.UserRole.ANALYST)
        ? 'createdBy userId'
        : 'createdBy';
    return (0, paginate_1.paginate)(record_model_1.FinancialRecord, query, {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy || 'date',
        order: filters.order || 'desc',
        allowedSortFields: ['date', 'amount', 'title', 'category', 'createdAt', 'updatedAt'],
    }, populateFields);
};
exports.getAllRecords = getAllRecords;
/**
 * Get record by ID with RBAC check
 * 🔒 SECURITY: Enforces strict ownership validation
 */
const getRecordById = async (recordId, requestingUserId, requestingUserRole) => {
    const record = await record_model_1.FinancialRecord.findOne({
        _id: recordId,
        isDeleted: false,
    })
        .populate('createdBy', 'name email')
        .populate('userId', 'name email')
        .lean();
    if (!record)
        throw new errorHandler_1.NotFoundError('Financial record not found');
    // 🔒 SECURITY: Check access based on role
    if (requestingUserRole === user_model_1.UserRole.ADMIN || requestingUserRole === user_model_1.UserRole.ANALYST) {
        // Admin and Analyst can view any record
        return record;
    }
    // 🚨 CRITICAL: Regular users can ONLY view their own records
    // Check both userId and createdBy for backwards compatibility
    const recordOwnerId = record.userId?.toString() || record.createdBy?.toString();
    if (recordOwnerId !== requestingUserId) {
        throw new errorHandler_1.ForbiddenError('Access denied. You can only view your own records');
    }
    return record;
};
exports.getRecordById = getRecordById;
/**
 * Update record with RBAC
 * - Admin: can update any record
 * - Analyst: forbidden
 * - User: can only update their own records
 * 🔒 SECURITY: Strict ownership validation
 */
const updateRecord = async (recordId, data, requestingUserId, requestingUserRole) => {
    // Analyst cannot update records
    if (requestingUserRole === user_model_1.UserRole.ANALYST) {
        throw new errorHandler_1.ForbiddenError('Analysts have read-only access');
    }
    const record = await record_model_1.FinancialRecord.findOne({ _id: recordId, isDeleted: false });
    if (!record)
        throw new errorHandler_1.NotFoundError('Financial record not found');
    // 🔒 SECURITY: Check ownership for non-admin users
    if (requestingUserRole !== user_model_1.UserRole.ADMIN) {
        const recordOwnerId = record.userId?.toString() || record.createdBy?.toString();
        if (recordOwnerId !== requestingUserId) {
            throw new errorHandler_1.ForbiddenError('Access denied. You can only update your own records');
        }
    }
    Object.assign(record, data);
    record.lastModifiedBy = new mongoose_1.Types.ObjectId(requestingUserId);
    await record.save();
    logger_1.logger.info(`Financial record updated: ${recordId} by user ${requestingUserId}`);
    return record;
};
exports.updateRecord = updateRecord;
/**
 * Soft delete record with RBAC and Cloudinary cleanup
 * - Admin: can delete any record
 * - Analyst: forbidden
 * - User: can only delete their own records
 * 🔒 SECURITY: Strict ownership validation
 */
const deleteRecord = async (recordId, requestingUserId, requestingUserRole) => {
    // Analyst cannot delete records
    if (requestingUserRole === user_model_1.UserRole.ANALYST) {
        throw new errorHandler_1.ForbiddenError('Analysts have read-only access');
    }
    const record = await record_model_1.FinancialRecord.findOne({ _id: recordId, isDeleted: false });
    if (!record)
        throw new errorHandler_1.NotFoundError('Financial record not found');
    // 🔒 SECURITY: Check ownership for non-admin users
    if (requestingUserRole !== user_model_1.UserRole.ADMIN) {
        const recordOwnerId = record.userId?.toString() || record.createdBy?.toString();
        if (recordOwnerId !== requestingUserId) {
            throw new errorHandler_1.ForbiddenError('Access denied. You can only delete your own records');
        }
    }
    record.isDeleted = true;
    record.deletedAt = new Date();
    record.lastModifiedBy = new mongoose_1.Types.ObjectId(requestingUserId);
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
    logger_1.logger.info(`Financial record soft-deleted: ${recordId} by user ${requestingUserId}`);
    return record;
};
exports.deleteRecord = deleteRecord;
/**
 * Upload attachment to record
 * 🔒 SECURITY: Only record owner can upload attachments
 */
const uploadAttachment = async (recordId, buffer, resourceType = 'image', requestingUserId, requestingUserRole) => {
    const record = await record_model_1.FinancialRecord.findOne({ _id: recordId, isDeleted: false });
    if (!record)
        throw new errorHandler_1.NotFoundError('Financial record not found');
    // 🔒 SECURITY: Validate ownership (if user info provided)
    if (requestingUserId && requestingUserRole !== user_model_1.UserRole.ADMIN) {
        const recordOwnerId = record.userId?.toString() || record.createdBy?.toString();
        if (recordOwnerId !== requestingUserId) {
            throw new errorHandler_1.ForbiddenError('Access denied. You can only upload attachments to your own records');
        }
    }
    if (record.attachmentPublicId) {
        try {
            await (0, cloudinary_1.deleteFromCloudinary)(record.attachmentPublicId);
        }
        catch (error) {
            logger_1.logger.warn('Failed to delete old attachment:', error);
        }
    }
    const result = await (0, cloudinary_1.uploadToCloudinary)(buffer, 'finance-dashboard/attachments', resourceType);
    record.attachmentUrl = result.url;
    record.attachmentPublicId = result.publicId;
    await record.save();
    logger_1.logger.info(`Attachment uploaded for record: ${recordId}`);
    return record;
};
exports.uploadAttachment = uploadAttachment;
