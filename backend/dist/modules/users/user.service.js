"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordWithOtp = exports.changePassword = exports.uploadAvatar = exports.updateMyProfile = exports.getMyProfile = exports.softDeleteUser = exports.updateUserStatus = exports.updateUserRole = exports.adminCreateUser = exports.getUserById = exports.getAllUsers = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_model_1 = require("./user.model");
const paginate_1 = require("../../utils/paginate");
const cloudinary_1 = require("../../config/cloudinary");
const logger_1 = require("../../utils/logger");
const userCache_1 = require("../../utils/userCache");
const errorHandler_1 = require("../../middleware/errorHandler");
/**
 * Get all users with pagination, search, and filters (ADMIN)
 * NOTE: Regex search is a collection scan — upgrade to Atlas Search for datasets > 100k users
 */
const getAllUsers = async (options) => {
    const filter = {};
    if (options.search) {
        const regex = new RegExp(options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ name: regex }, { email: regex }];
    }
    if (options.role)
        filter.role = options.role;
    if (options.status)
        filter.status = options.status;
    return (0, paginate_1.paginate)(user_model_1.User, filter, options);
};
exports.getAllUsers = getAllUsers;
/**
 * Get user by ID (ADMIN) - Section 1.3: uses lean() for read-only queries
 */
const getUserById = async (userId) => {
    const user = await user_model_1.User.findById(userId)
        .select('name email phone role status isVerified profileImage lastLogin createdAt')
        .lean();
    if (!user)
        throw new errorHandler_1.NotFoundError('User not found');
    return user;
};
exports.getUserById = getUserById;
/**
 * Admin directly creates a user (pre-verified, no OTP required)
 */
const adminCreateUser = async (data) => {
    if (await user_model_1.User.findOne({ email: data.email })) {
        throw new errorHandler_1.ConflictError('Email already registered');
    }
    if (await user_model_1.User.findOne({ phone: data.phone })) {
        throw new errorHandler_1.ConflictError('Phone number already registered');
    }
    const passwordHash = await bcrypt_1.default.hash(data.password, 10);
    const user = await user_model_1.User.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: data.role ?? user_model_1.UserRole.VIEWER,
        status: user_model_1.UserStatus.ACTIVE,
        isVerified: true,
    });
    logger_1.logger.info(`Admin created user: ${user.email} [${user.role}]`);
    return user;
};
exports.adminCreateUser = adminCreateUser;
/**
 * Update user role — prevents self-demotion and removing last admin
 * Section 3.1: Invalidates user cache after role change
 */
const updateUserRole = async (userId, role, currentUserId) => {
    if (userId === currentUserId) {
        throw new errorHandler_1.ForbiddenError('You cannot change your own role');
    }
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new errorHandler_1.NotFoundError('User not found');
    if (user.role === user_model_1.UserRole.ADMIN && role !== user_model_1.UserRole.ADMIN) {
        const adminCount = await user_model_1.User.countDocuments({
            role: user_model_1.UserRole.ADMIN,
            status: user_model_1.UserStatus.ACTIVE,
        });
        if (adminCount <= 1) {
            throw new errorHandler_1.ForbiddenError('Cannot demote the last active admin');
        }
    }
    user.role = role;
    await user.save();
    // Invalidate cache after role change
    (0, userCache_1.invalidateUserCache)(userId);
    logger_1.logger.info(`User role updated: ${user.email} -> ${role}`);
    return user;
};
exports.updateUserRole = updateUserRole;
/**
 * Update user status — prevents self-deactivation and deactivating last admin
 * Section 3.1: Invalidates user cache after status change
 */
const updateUserStatus = async (userId, status, currentUserId) => {
    if (userId === currentUserId) {
        throw new errorHandler_1.ForbiddenError('You cannot change your own status');
    }
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new errorHandler_1.NotFoundError('User not found');
    if (user.role === user_model_1.UserRole.ADMIN && status === user_model_1.UserStatus.INACTIVE) {
        const activeAdminCount = await user_model_1.User.countDocuments({
            role: user_model_1.UserRole.ADMIN,
            status: user_model_1.UserStatus.ACTIVE,
        });
        if (activeAdminCount <= 1) {
            throw new errorHandler_1.ForbiddenError('Cannot deactivate the last active admin');
        }
    }
    user.status = status;
    await user.save();
    // Invalidate cache after status change
    (0, userCache_1.invalidateUserCache)(userId);
    logger_1.logger.info(`User status updated: ${user.email} -> ${status}`);
    return user;
};
exports.updateUserStatus = updateUserStatus;
/**
 * Soft-delete user (sets status INACTIVE). Cannot delete self or last admin.
 * Section 3.1: Invalidates user cache after deletion
 */
const softDeleteUser = async (userId, currentUserId) => {
    if (userId === currentUserId) {
        throw new errorHandler_1.ForbiddenError('You cannot delete your own account');
    }
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new errorHandler_1.NotFoundError('User not found');
    if (user.role === user_model_1.UserRole.ADMIN) {
        const activeAdminCount = await user_model_1.User.countDocuments({
            role: user_model_1.UserRole.ADMIN,
            status: user_model_1.UserStatus.ACTIVE,
        });
        if (activeAdminCount <= 1) {
            throw new errorHandler_1.ForbiddenError('Cannot delete the last active admin');
        }
    }
    user.status = user_model_1.UserStatus.INACTIVE;
    await user.save();
    // Invalidate cache after deletion
    (0, userCache_1.invalidateUserCache)(userId);
    logger_1.logger.info(`User soft-deleted: ${user.email}`);
};
exports.softDeleteUser = softDeleteUser;
/**
 * Get current user profile - Section 1.3: uses lean() for read-only queries
 */
const getMyProfile = async (userId) => {
    const user = await user_model_1.User.findById(userId)
        .select('name email phone role status isVerified profileImage lastLogin createdAt')
        .lean();
    if (!user)
        throw new errorHandler_1.NotFoundError('User not found');
    return user;
};
exports.getMyProfile = getMyProfile;
/**
 * Update current user profile
 * Section 3.1: Invalidates user cache after profile update
 */
const updateMyProfile = async (userId, data) => {
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new errorHandler_1.NotFoundError('User not found');
    if (data.email && data.email !== user.email) {
        if (await user_model_1.User.findOne({ email: data.email })) {
            throw new errorHandler_1.ConflictError('Email already in use');
        }
        user.email = data.email;
    }
    if (data.phone && data.phone !== user.phone) {
        if (await user_model_1.User.findOne({ phone: data.phone })) {
            throw new errorHandler_1.ConflictError('Phone number already in use');
        }
        user.phone = data.phone;
    }
    if (data.name)
        user.name = data.name;
    await user.save();
    // Invalidate cache after profile update
    (0, userCache_1.invalidateUserCache)(userId);
    logger_1.logger.info(`Profile updated: ${user.email}`);
    return user;
};
exports.updateMyProfile = updateMyProfile;
/**
 * Upload user avatar
 */
const uploadAvatar = async (userId, buffer) => {
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new errorHandler_1.NotFoundError('User not found');
    if (user.profileImagePublicId) {
        try {
            await (0, cloudinary_1.deleteFromCloudinary)(user.profileImagePublicId);
        }
        catch (error) {
            logger_1.logger.warn('Failed to delete old avatar:', error);
        }
    }
    const result = await (0, cloudinary_1.uploadToCloudinary)(buffer, 'finance-dashboard/avatars', 'image');
    user.profileImage = result.url;
    user.profileImagePublicId = result.publicId;
    await user.save();
    logger_1.logger.info(`Avatar uploaded for user: ${user.email}`);
    return user;
};
exports.uploadAvatar = uploadAvatar;
/**
 * Change password for authenticated user
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await user_model_1.User.findById(userId).select('+passwordHash');
    if (!user)
        throw new errorHandler_1.NotFoundError('User not found');
    // Verify current password
    const isPasswordValid = await bcrypt_1.default.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
        throw new errorHandler_1.UnauthorizedError('Current password is incorrect');
    }
    // Hash and save new password
    user.passwordHash = await bcrypt_1.default.hash(newPassword, 10);
    await user.save();
    logger_1.logger.info(`Password changed for user: ${user.email}`);
};
exports.changePassword = changePassword;
/**
 * Change password with OTP verification for authenticated user
 */
const changePasswordWithOtp = async (userId, currentPassword, newPassword, otp) => {
    const user = await user_model_1.User.findById(userId).select('+passwordHash');
    if (!user)
        throw new errorHandler_1.NotFoundError('User not found');
    // Verify current password
    const isPasswordValid = await bcrypt_1.default.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
        throw new errorHandler_1.UnauthorizedError('Current password is incorrect');
    }
    // Verify OTP first
    const { verifyOtp } = await Promise.resolve().then(() => __importStar(require('../auth/otp.service')));
    const { OtpPurpose } = await Promise.resolve().then(() => __importStar(require('../auth/otp.model')));
    await verifyOtp(user.email, otp, OtpPurpose.CHANGE_PASSWORD);
    // Hash and save new password
    user.passwordHash = await bcrypt_1.default.hash(newPassword, 10);
    await user.save();
    logger_1.logger.info(`Password changed with OTP for user: ${user.email}`);
};
exports.changePasswordWithOtp = changePasswordWithOtp;
