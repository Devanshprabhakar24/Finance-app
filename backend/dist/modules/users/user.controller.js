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
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordWithOtp = exports.requestPasswordChangeOtp = exports.changePassword = exports.uploadAvatar = exports.updateMyProfile = exports.getMyProfile = exports.deleteUser = exports.updateUserStatus = exports.updateUserRole = exports.adminCreateUser = exports.getUserById = exports.getAllUsers = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_1 = require("../../utils/response");
const userService = __importStar(require("./user.service"));
const errorHandler_1 = require("../../middleware/errorHandler");
/**
 * GET /api/users
 * List all users with optional search/filter (ADMIN)
 */
exports.getAllUsers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, sortBy, order, search, role, status } = req.query;
    const result = await userService.getAllUsers({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        sortBy: sortBy,
        order: order,
        search: search,
        role: role,
        status: status,
    });
    (0, response_1.sendSuccess)(res, 'Users retrieved successfully', result.data, result.meta);
});
/**
 * GET /api/users/:id
 * Get single user by ID (ADMIN)
 */
exports.getUserById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    (0, response_1.sendSuccess)(res, 'User retrieved successfully', user);
});
/**
 * POST /api/users
 * Admin creates a user directly (ADMIN)
 */
exports.adminCreateUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = await userService.adminCreateUser(req.body);
    (0, response_1.sendSuccess)(res, 'User created successfully', user, undefined, 201);
});
/**
 * PATCH /api/users/:id/role
 * Update user role (ADMIN)
 */
exports.updateUserRole = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { role } = req.body;
    const user = await userService.updateUserRole(req.params.id, role, req.user._id.toString());
    (0, response_1.sendSuccess)(res, 'User role updated successfully', user);
});
/**
 * PATCH /api/users/:id/status
 * Update user status (ADMIN)
 */
exports.updateUserStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { status } = req.body;
    const user = await userService.updateUserStatus(req.params.id, status, req.user._id.toString());
    (0, response_1.sendSuccess)(res, 'User status updated successfully', user);
});
/**
 * DELETE /api/users/:id
 * Soft-delete a user (sets status to INACTIVE) (ADMIN)
 */
exports.deleteUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await userService.softDeleteUser(req.params.id, req.user._id.toString());
    (0, response_1.sendSuccess)(res, 'User deleted successfully');
});
/**
 * GET /api/users/me
 * Get own profile (all roles)
 */
exports.getMyProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = await userService.getMyProfile(req.user._id.toString());
    (0, response_1.sendSuccess)(res, 'Profile retrieved successfully', user);
});
/**
 * PATCH /api/users/me
 * Update own profile (all roles)
 */
exports.updateMyProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const user = await userService.updateMyProfile(req.user._id.toString(), data);
    (0, response_1.sendSuccess)(res, 'Profile updated successfully', user);
});
/**
 * POST /api/users/me/avatar
 * Upload avatar (all roles)
 */
exports.uploadAvatar = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        throw new errorHandler_1.ValidationError('No file uploaded');
    }
    const user = await userService.uploadAvatar(req.user._id.toString(), req.file.buffer);
    (0, response_1.sendSuccess)(res, 'Avatar uploaded successfully', { profileImage: user.profileImage });
});
/**
 * PATCH /api/users/me/change-password
 * Change password for authenticated user (all roles)
 */
exports.changePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await userService.changePassword(req.user._id.toString(), currentPassword, newPassword);
    (0, response_1.sendSuccess)(res, 'Password changed successfully');
});
/**
 * POST /api/users/me/request-password-change-otp
 * Request OTP for password change
 */
exports.requestPasswordChangeOtp = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { generateAndSendOtp } = await Promise.resolve().then(() => __importStar(require('../auth/otp.service')));
    const { OtpPurpose } = await Promise.resolve().then(() => __importStar(require('../auth/otp.model')));
    await generateAndSendOtp(req.user.email, OtpPurpose.CHANGE_PASSWORD);
    (0, response_1.sendSuccess)(res, 'OTP sent to your email for password change verification');
});
/**
 * PATCH /api/users/me/change-password-with-otp
 * Change password with OTP verification for authenticated user (all roles)
 */
exports.changePasswordWithOtp = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword, otp } = req.body;
    await userService.changePasswordWithOtp(req.user._id.toString(), currentPassword, newPassword, otp);
    (0, response_1.sendSuccess)(res, 'Password changed successfully');
});
