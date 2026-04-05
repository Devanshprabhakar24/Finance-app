import { Router } from 'express';
import multer from 'multer';
import * as userController from './user.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';
import { validateBody } from '../../middleware/validate';
import { UserRole } from './user.model';
import {
  adminCreateUserSchema,
  updateProfileSchema,
  updateRoleSchema,
  updateStatusSchema,
  changePasswordSchema,
  changePasswordWithOtpSchema,
} from './user.schema';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

// ── Own profile (all roles) ─────────────────────────────────────────────────
router.get('/me', userController.getMyProfile);
router.patch('/me', validateBody(updateProfileSchema), userController.updateMyProfile);
router.post('/me/avatar', upload.single('avatar'), userController.uploadAvatar);
router.patch('/me/change-password', validateBody(changePasswordSchema), userController.changePassword);

// Password change with OTP
router.post('/me/request-password-change-otp', userController.requestPasswordChangeOtp);
router.patch('/me/change-password-with-otp', validateBody(changePasswordWithOtpSchema), userController.changePasswordWithOtp);

// ── Admin-only user management ──────────────────────────────────────────────

// List all users (supports ?search=&role=&status= query params)
router.get('/', requireRole(UserRole.ADMIN), userController.getAllUsers);

// Admin creates a user directly (no OTP required)
router.post(
  '/',
  requireRole(UserRole.ADMIN),
  validateBody(adminCreateUserSchema),
  userController.adminCreateUser
);

// Get single user
router.get('/:id', requireRole(UserRole.ADMIN), userController.getUserById);

// Update role
router.patch(
  '/:id/role',
  requireRole(UserRole.ADMIN),
  validateBody(updateRoleSchema),
  userController.updateUserRole
);

// Update status (activate/deactivate)
router.patch(
  '/:id/status',
  requireRole(UserRole.ADMIN),
  validateBody(updateStatusSchema),
  userController.updateUserStatus
);

// Soft-delete user (marks as INACTIVE)
router.delete('/:id', requireRole(UserRole.ADMIN), userController.deleteUser);

export default router;
