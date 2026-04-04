import bcrypt from 'bcrypt';
import { User, IUser, UserRole, UserStatus } from './user.model';
import { UpdateProfileInput } from './user.schema';
import { paginate, PaginationOptions, PaginationResult } from '../../utils/paginate';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary';
import { logger } from '../../utils/logger';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from '../../middleware/errorHandler';

export interface GetUsersOptions extends PaginationOptions {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

/**
 * Get all users with pagination, search, and filters (ADMIN)
 */
export const getAllUsers = async (
  options: GetUsersOptions
): Promise<PaginationResult<IUser>> => {
  const filter: Record<string, unknown> = {};

  if (options.search) {
    const regex = new RegExp(options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  if (options.role) filter.role = options.role;
  if (options.status) filter.status = options.status;

  return paginate(User, filter, options);
};

/**
 * Get user by ID (ADMIN)
 */
export const getUserById = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) throw new NotFoundError('User not found');
  return user;
};

/**
 * Admin directly creates a user (pre-verified, no OTP required)
 */
export const adminCreateUser = async (data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
}): Promise<IUser> => {
  if (await User.findOne({ email: data.email })) {
    throw new ConflictError('Email already registered');
  }
  if (await User.findOne({ phone: data.phone })) {
    throw new ConflictError('Phone number already registered');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await User.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    passwordHash,
    role: data.role ?? UserRole.VIEWER,
    status: UserStatus.ACTIVE,
    isVerified: true,
  });

  logger.info(`Admin created user: ${user.email} [${user.role}]`);
  return user;
};

/**
 * Update user role — prevents self-demotion and removing last admin
 */
export const updateUserRole = async (
  userId: string,
  role: UserRole,
  currentUserId: string
): Promise<IUser> => {
  if (userId === currentUserId) {
    throw new ForbiddenError('You cannot change your own role');
  }

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (user.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
    const adminCount = await User.countDocuments({
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    if (adminCount <= 1) {
      throw new ForbiddenError('Cannot demote the last active admin');
    }
  }

  user.role = role;
  await user.save();

  logger.info(`User role updated: ${user.email} -> ${role}`);
  return user;
};

/**
 * Update user status — prevents self-deactivation and deactivating last admin
 */
export const updateUserStatus = async (
  userId: string,
  status: UserStatus,
  currentUserId: string
): Promise<IUser> => {
  if (userId === currentUserId) {
    throw new ForbiddenError('You cannot change your own status');
  }

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (user.role === UserRole.ADMIN && status === UserStatus.INACTIVE) {
    const activeAdminCount = await User.countDocuments({
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    if (activeAdminCount <= 1) {
      throw new ForbiddenError('Cannot deactivate the last active admin');
    }
  }

  user.status = status;
  await user.save();

  logger.info(`User status updated: ${user.email} -> ${status}`);
  return user;
};

/**
 * Soft-delete user (sets status INACTIVE). Cannot delete self or last admin.
 */
export const softDeleteUser = async (
  userId: string,
  currentUserId: string
): Promise<void> => {
  if (userId === currentUserId) {
    throw new ForbiddenError('You cannot delete your own account');
  }

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (user.role === UserRole.ADMIN) {
    const activeAdminCount = await User.countDocuments({
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    if (activeAdminCount <= 1) {
      throw new ForbiddenError('Cannot delete the last active admin');
    }
  }

  user.status = UserStatus.INACTIVE;
  await user.save();

  logger.info(`User soft-deleted: ${user.email}`);
};

/**
 * Get current user profile
 */
export const getMyProfile = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) throw new NotFoundError('User not found');
  return user;
};

/**
 * Update current user profile
 */
export const updateMyProfile = async (
  userId: string,
  data: UpdateProfileInput
): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (data.email && data.email !== user.email) {
    if (await User.findOne({ email: data.email })) {
      throw new ConflictError('Email already in use');
    }
    user.email = data.email;
  }

  if (data.phone && data.phone !== user.phone) {
    if (await User.findOne({ phone: data.phone })) {
      throw new ConflictError('Phone number already in use');
    }
    user.phone = data.phone;
  }

  if (data.name) user.name = data.name;

  await user.save();
  logger.info(`Profile updated: ${user.email}`);
  return user;
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (userId: string, buffer: Buffer): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (user.profileImagePublicId) {
    try {
      await deleteFromCloudinary(user.profileImagePublicId);
    } catch (error) {
      logger.warn('Failed to delete old avatar:', error);
    }
  }

  const result = await uploadToCloudinary(buffer, 'finance-dashboard/avatars', 'image');
  user.profileImage = result.url;
  user.profileImagePublicId = result.publicId;
  await user.save();

  logger.info(`Avatar uploaded for user: ${user.email}`);
  return user;
};

/**
 * Change password for authenticated user
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw new NotFoundError('User not found');

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Hash and save new password
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  logger.info(`Password changed for user: ${user.email}`);
};
