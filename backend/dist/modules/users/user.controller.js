const { Request, Response  } = require('express');
const { asyncHandler  } = require('../../utils/asyncHandler');
const { sendSuccess  } = require('../../utils/response');
const userService = require('./user.service');
const { UpdateProfileInput, UpdateRoleInput, UpdateStatusInput, ChangePasswordInput  } = require('./user.schema');
const { UserRole, UserStatus  } = require('./user.model');
const { ValidationError  } = require('../../middleware/errorHandler');

/**
 * GET /api/users
 * List all users with optional search/filter (ADMIN)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, sortBy, order, search, role, status } = req.query;

  const result = await userService.getAllUsers({
    page) : undefined,
    limit) : undefined,
    sortBy,
    order,
    search,
    role,
    status,
  });

  sendSuccess(res, 'Users retrieved successfully', result.data, result.meta);
});

/**
 * GET /api/users/:id
 * Get single user by ID (ADMIN)
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  sendSuccess(res, 'User retrieved successfully', user);
});

/**
 * POST /api/users
 * Admin creates a user directly (ADMIN)
 */
const adminCreateUser = asyncHandler(async (req, res) => {
  const user = await userService.adminCreateUser(req.body);
  sendSuccess(res, 'User created successfully', user, undefined, 201);
});

/**
 * PATCH /api/users/:id/role
 * Update user role (ADMIN)
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { role }: UpdateRoleInput = req.body;
  const user = await userService.updateUserRole(
    req.params.id,
    role,
    req.user!._id.toString()
  );
  sendSuccess(res, 'User role updated successfully', user);
});

/**
 * PATCH /api/users/:id/status
 * Update user status (ADMIN)
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { status }: UpdateStatusInput = req.body;
  const user = await userService.updateUserStatus(
    req.params.id,
    status,
    req.user!._id.toString()
  );
  sendSuccess(res, 'User status updated successfully', user);
});

/**
 * DELETE /api/users/:id
 * Soft-delete a user (sets status to INACTIVE) (ADMIN)
 */
const deleteUser = asyncHandler(async (req, res) => {
  await userService.softDeleteUser(req.params.id, req.user!._id.toString());
  sendSuccess(res, 'User deleted successfully');
});

/**
 * GET /api/users/me
 * Get own profile (all roles)
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.getMyProfile(req.user!._id.toString());
  sendSuccess(res, 'Profile retrieved successfully', user);
});

/**
 * PATCH /api/users/me
 * Update own profile (all roles)
 */
const updateMyProfile = asyncHandler(async (req, res) => {
  const data= req.body;
  const user = await userService.updateMyProfile(req.user!._id.toString(), data);
  sendSuccess(res, 'Profile updated successfully', user);
});

/**
 * POST /api/users/me/avatar
 * Upload avatar (all roles)
 */
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }
  const user = await userService.uploadAvatar(req.user!._id.toString(), req.file.buffer);
  sendSuccess(res, 'Avatar uploaded successfully', { profileImage);
});

/**
 * PATCH /api/users/me/change-password
 * Change password for authenticated user (all roles)
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword }: ChangePasswordInput = req.body;
  await userService.changePassword(req.user!._id.toString(), currentPassword, newPassword);
  sendSuccess(res, 'Password changed successfully');
});

/**
 * POST /api/users/me/request-password-change-otp
 * Request OTP for password change
 */
const requestPasswordChangeOtp = asyncHandler(async (req, res) => {
  const { generateAndSendOtp } = await import('../auth/otp.service');
  const { OtpPurpose } = await import('../auth/otp.model');
  
  await generateAndSendOtp(req.user!.email, OtpPurpose.CHANGE_PASSWORD);
  sendSuccess(res, 'OTP sent to your email for password change verification');
});

/**
 * PATCH /api/users/me/change-password-with-otp
 * Change password with OTP verification for authenticated user (all roles)
 */
const changePasswordWithOtp = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, otp } = req.body;
  await userService.changePasswordWithOtp(
    req.user!._id.toString(), 
    currentPassword, 
    newPassword, 
    otp
  );
  sendSuccess(res, 'Password changed successfully');
});
