const bcrypt = require('bcrypt');
const { User, IUser, UserRole, UserStatus  } = require('./user.model');
const { UpdateProfileInput  } = require('./user.schema');
const { paginate, PaginationOptions, PaginationResult  } = require('../../utils/paginate');
const { uploadToCloudinary, deleteFromCloudinary  } = require('../../config/cloudinary');
const { logger  } = require('../../utils/logger');
const { invalidateUserCache  } = require('../../utils/userCache');
const { NotFoundError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
 } = require('../../middleware/errorHandler');

export interface GetUsersOptions extends PaginationOptions {
  search: string;
  role: UserRole;
  status: UserStatus;
}

/**
 * Get all users with pagination, search, and filters (ADMIN)
 * NOTE: Regex search is a collection scan — upgrade to Atlas Search for datasets > 100k users
 */
const getAllUsers = async (
  options: GetUsersOptions
)=> {
  const filter= {};

  if (options.search) {
    const regex = new RegExp(options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name, { email: regex }];
  }

  if (options.role) filter.role = options.role;
  if (options.status) filter.status = options.status;

  return paginate(User, filter, options);
};

/**
 * Get user by ID (ADMIN) - Section 1.3) for read-only queries
 */
const getUserById = async (userId)=> {
  const user = await User.findById(userId)
    .select('name email phone role status isVerified profileImage lastLogin createdAt')
    .lean();
  if (!user) throw new NotFoundError('User not found');
  return user;
};

/**
 * Admin directly creates a user (pre-verified, no OTP required)
 */
const adminCreateUser = async (data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
})=> {
  if (await User.findOne({ email)) {
    throw new ConflictError('Email already registered');
  }
  if (await User.findOne({ phone)) {
    throw new ConflictError('Phone number already registered');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await User.create({
    name,
    email,
    phone,
    passwordHash,
    role,
    status,
    isVerified,
  });

  logger.info(`Admin created user: ${user.email} [${user.role}]`);
  return user;
};

/**
 * Update user role — prevents self-demotion and removing last admin
 * Section 3.1: Invalidates user cache after role change
 */
const updateUserRole = async (
  userId,
  role,
  currentUserId: string
)=> {
  if (userId === currentUserId) {
    throw new ForbiddenError('You cannot change your own role');
  }

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (user.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
    const adminCount = await User.countDocuments({
      role,
      status,
    });
    if (adminCount <= 1) {
      throw new ForbiddenError('Cannot demote the last active admin');
    }
  }

  user.role = role;
  await user.save();

  // Invalidate cache after role change
  invalidateUserCache(userId);

  logger.info(`User role updated: ${user.email} -> ${role}`);
  return user;
};

/**
 * Update user status — prevents self-deactivation and deactivating last admin
 * Section 3.1: Invalidates user cache after status change
 */
const updateUserStatus = async (
  userId,
  status,
  currentUserId: string
)=> {
  if (userId === currentUserId) {
    throw new ForbiddenError('You cannot change your own status');
  }

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (user.role === UserRole.ADMIN && status === UserStatus.INACTIVE) {
    const activeAdminCount = await User.countDocuments({
      role,
      status,
    });
    if (activeAdminCount <= 1) {
      throw new ForbiddenError('Cannot deactivate the last active admin');
    }
  }

  user.status = status;
  await user.save();

  // Invalidate cache after status change
  invalidateUserCache(userId);

  logger.info(`User status updated: ${user.email} -> ${status}`);
  return user;
};

/**
 * Soft-delete user (sets status INACTIVE). Cannot delete self or last admin.
 * Section 3.1: Invalidates user cache after deletion
 */
const softDeleteUser = async (
  userId,
  currentUserId: string
)=> {
  if (userId === currentUserId) {
    throw new ForbiddenError('You cannot delete your own account');
  }

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (user.role === UserRole.ADMIN) {
    const activeAdminCount = await User.countDocuments({
      role,
      status,
    });
    if (activeAdminCount <= 1) {
      throw new ForbiddenError('Cannot delete the last active admin');
    }
  }

  user.status = UserStatus.INACTIVE;
  await user.save();

  // Invalidate cache after deletion
  invalidateUserCache(userId);

  logger.info(`User soft-deleted: ${user.email}`);
};

/**
 * Get current user profile - Section 1.3) for read-only queries
 */
const getMyProfile = async (userId)=> {
  const user = await User.findById(userId)
    .select('name email phone role status isVerified profileImage lastLogin createdAt')
    .lean();
  if (!user) throw new NotFoundError('User not found');
  return user;
};

/**
 * Update current user profile
 * Section 3.1: Invalidates user cache after profile update
 */
const updateMyProfile = async (
  userId,
  data: UpdateProfileInput
)=> {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (data.email && data.email !== user.email) {
    if (await User.findOne({ email)) {
      throw new ConflictError('Email already in use');
    }
    user.email = data.email;
  }

  if (data.phone && data.phone !== user.phone) {
    if (await User.findOne({ phone)) {
      throw new ConflictError('Phone number already in use');
    }
    user.phone = data.phone;
  }

  if (data.name) user.name = data.name;

  await user.save();
  
  // Invalidate cache after profile update
  invalidateUserCache(userId);
  
  logger.info(`Profile updated: ${user.email}`);
  return user;
};

/**
 * Upload user avatar
 */
const uploadAvatar = async (userId, buffer)=> {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (user.profileImagePublicId) {
    try {
      await deleteFromCloudinary(user.profileImagePublicId);
    } catch (error) {
      logger.warn('Failed to delete old avatar, error);
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
const changePassword = async (
  userId,
  currentPassword,
  newPassword: string
)=> {
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

/**
 * Change password with OTP verification for authenticated user
 */
const changePasswordWithOtp = async (
  userId,
  currentPassword,
  newPassword,
  otp: string
)=> {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw new NotFoundError('User not found');

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Verify OTP first
  const { verifyOtp } = await import('../auth/otp.service');
  const { OtpPurpose } = await import('../auth/otp.model');
  await verifyOtp(user.email, otp, OtpPurpose.CHANGE_PASSWORD);

  // Hash and save new password
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  logger.info(`Password changed with OTP for user: ${user.email}`);
};
