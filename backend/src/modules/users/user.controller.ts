import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import * as userService from './user.service';
import { UpdateProfileInput, UpdateRoleInput, UpdateStatusInput, ChangePasswordInput } from './user.schema';
import { UserRole, UserStatus } from './user.model';
import { ValidationError } from '../../middleware/errorHandler';

/**
 * GET /api/users
 * List all users with optional search/filter (ADMIN)
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, sortBy, order, search, role, status } = req.query;

  const result = await userService.getAllUsers({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    sortBy: sortBy as string,
    order: order as 'asc' | 'desc',
    search: search as string | undefined,
    role: role as UserRole | undefined,
    status: status as UserStatus | undefined,
  });

  sendSuccess(res, 'Users retrieved successfully', result.data, result.meta);
});

/**
 * GET /api/users/:id
 * Get single user by ID (ADMIN)
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  sendSuccess(res, 'User retrieved successfully', user);
});

/**
 * POST /api/users
 * Admin creates a user directly (ADMIN)
 */
export const adminCreateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.adminCreateUser(req.body);
  sendSuccess(res, 'User created successfully', user, undefined, 201);
});

/**
 * PATCH /api/users/:id/role
 * Update user role (ADMIN)
 */
export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { role }: UpdateRoleInput = req.body;
  const user = await userService.updateUserRole(
    req.params.id,
    role as UserRole,
    req.user!._id.toString()
  );
  sendSuccess(res, 'User role updated successfully', user);
});

/**
 * PATCH /api/users/:id/status
 * Update user status (ADMIN)
 */
export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status }: UpdateStatusInput = req.body;
  const user = await userService.updateUserStatus(
    req.params.id,
    status as UserStatus,
    req.user!._id.toString()
  );
  sendSuccess(res, 'User status updated successfully', user);
});

/**
 * DELETE /api/users/:id
 * Soft-delete a user (sets status to INACTIVE) (ADMIN)
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await userService.softDeleteUser(req.params.id, req.user!._id.toString());
  sendSuccess(res, 'User deleted successfully');
});

/**
 * GET /api/users/me
 * Get own profile (all roles)
 */
export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getMyProfile(req.user!._id.toString());
  sendSuccess(res, 'Profile retrieved successfully', user);
});

/**
 * PATCH /api/users/me
 * Update own profile (all roles)
 */
export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const data: UpdateProfileInput = req.body;
  const user = await userService.updateMyProfile(req.user!._id.toString(), data);
  sendSuccess(res, 'Profile updated successfully', user);
});

/**
 * POST /api/users/me/avatar
 * Upload avatar (all roles)
 */
export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }
  const user = await userService.uploadAvatar(req.user!._id.toString(), req.file.buffer);
  sendSuccess(res, 'Avatar uploaded successfully', { profileImage: user.profileImage });
});

/**
 * PATCH /api/users/me/change-password
 * Change password for authenticated user (all roles)
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword }: ChangePasswordInput = req.body;
  await userService.changePassword(req.user!._id.toString(), currentPassword, newPassword);
  sendSuccess(res, 'Password changed successfully');
});

/**
 * POST /api/users/me/request-password-change-otp
 * Request OTP for password change
 */
export const requestPasswordChangeOtp = asyncHandler(async (req: Request, res: Response) => {
  const { generateAndSendOtp } = await import('../auth/otp.service');
  const { OtpPurpose } = await import('../auth/otp.model');
  
  await generateAndSendOtp(req.user!.email, OtpPurpose.CHANGE_PASSWORD);
  sendSuccess(res, 'OTP sent to your email for password change verification');
});

/**
 * PATCH /api/users/me/change-password-with-otp
 * Change password with OTP verification for authenticated user (all roles)
 */
export const changePasswordWithOtp = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword, otp } = req.body;
  await userService.changePasswordWithOtp(
    req.user!._id.toString(), 
    currentPassword, 
    newPassword, 
    otp
  );
  sendSuccess(res, 'Password changed successfully');
});
