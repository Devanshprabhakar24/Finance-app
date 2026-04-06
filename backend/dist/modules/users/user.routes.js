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
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const userController = __importStar(require("./user.controller"));
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const validate_1 = require("../../middleware/validate");
const user_model_1 = require("./user.model");
const user_schema_1 = require("./user.schema");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
        }
    },
});
// All routes require authentication
router.use(authenticate_1.authenticate);
// ── Own profile (all roles) ─────────────────────────────────────────────────
router.get('/me', userController.getMyProfile);
router.patch('/me', (0, validate_1.validateBody)(user_schema_1.updateProfileSchema), userController.updateMyProfile);
router.post('/me/avatar', upload.single('avatar'), userController.uploadAvatar);
router.patch('/me/change-password', (0, validate_1.validateBody)(user_schema_1.changePasswordSchema), userController.changePassword);
// Password change with OTP
router.post('/me/request-password-change-otp', userController.requestPasswordChangeOtp);
router.patch('/me/change-password-with-otp', (0, validate_1.validateBody)(user_schema_1.changePasswordWithOtpSchema), userController.changePasswordWithOtp);
// ── Admin-only user management ──────────────────────────────────────────────
// List all users (supports ?search=&role=&status= query params)
router.get('/', (0, authorize_1.requireRole)(user_model_1.UserRole.ADMIN), userController.getAllUsers);
// Admin creates a user directly (no OTP required)
router.post('/', (0, authorize_1.requireRole)(user_model_1.UserRole.ADMIN), (0, validate_1.validateBody)(user_schema_1.adminCreateUserSchema), userController.adminCreateUser);
// Get single user
router.get('/:id', (0, authorize_1.requireRole)(user_model_1.UserRole.ADMIN), userController.getUserById);
// Update role
router.patch('/:id/role', (0, authorize_1.requireRole)(user_model_1.UserRole.ADMIN), (0, validate_1.validateBody)(user_schema_1.updateRoleSchema), userController.updateUserRole);
// Update status (activate/deactivate)
router.patch('/:id/status', (0, authorize_1.requireRole)(user_model_1.UserRole.ADMIN), (0, validate_1.validateBody)(user_schema_1.updateStatusSchema), userController.updateUserStatus);
// Soft-delete user (marks as INACTIVE)
router.delete('/:id', (0, authorize_1.requireRole)(user_model_1.UserRole.ADMIN), userController.deleteUser);
exports.default = router;
