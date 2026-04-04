import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../users/user.model';
import { UserRegistrationInput } from '../users/user.schema';
import { generateAndSendOtp, verifyOtp } from './otp.service';
import { OtpPurpose } from './otp.model';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
  NotFoundError,
} from '../../middleware/errorHandler';

/**
 * Generate JWT access token
 */
const generateAccessToken = (user: IUser): string => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpires } as any);
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (user: IUser): string => {
  const payload = {
    userId: user._id,
  };
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpires } as any);
};

/**
 * Register new user
 * @param data - User registration data
 * @returns Promise<void>
 */
export const registerUser = async (data: UserRegistrationInput): Promise<void> => {
  try {
    // Check if email already exists
    const existingEmail = await User.findOne({ email: data.email });
    if (existingEmail) {
      throw new ConflictError('Email already registered');
    }

    // Check if phone already exists
    const existingPhone = await User.findOne({ phone: data.phone });
    if (existingPhone) {
      throw new ConflictError('Phone number already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await User.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
      isVerified: false,
    });

    // Generate and send OTP to both email and phone
    await Promise.all([
      generateAndSendOtp(user.email, OtpPurpose.REGISTER),
      generateAndSendOtp(user.phone, OtpPurpose.REGISTER),
    ]);

    logger.info(`User registered: ${user.email}`);
  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
};

/**
 * Verify OTP and complete registration
 * @param identifier - Email or phone
 * @param otp - OTP code
 * @param purpose - OTP purpose
 * @returns User data with tokens
 */
export const verifyOtpAndAuthenticate = async (
  identifier: string,
  otp: string,
  purpose: OtpPurpose
): Promise<{ user: IUser; accessToken: string; refreshToken: string }> => {
  try {
    // Verify OTP
    await verifyOtp(identifier, otp, purpose);

    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    }).select('-passwordHash');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Mark user as verified if registering
    if (purpose === OtpPurpose.REGISTER && !user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    // Update last login and store refresh token for logout invalidation
    user.lastLogin = new Date();
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    (user as any).refreshToken = refreshToken;
    await user.save();

    logger.info(`User authenticated: ${user.email}`);

    return { user, accessToken, refreshToken };
  } catch (error) {
    logger.error('OTP verification error:', error);
    throw error;
  }
};

/**
 * Login user with password
 * @param identifier - Email or phone
 * @param password - User password
 * @returns Promise<void>
 */
export const loginUser = async (identifier: string, password: string): Promise<void> => {
  try {
    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    }).select('+passwordHash');

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new ValidationError('Account not verified. Please verify your OTP first.');
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is inactive');
    }

    // Generate and send OTP to both email and phone
    await Promise.all([
      generateAndSendOtp(user.email, OtpPurpose.LOGIN),
      generateAndSendOtp(user.phone, OtpPurpose.LOGIN),
    ]);

    logger.info(`Login OTP sent to: ${user.email}`);
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
};

/**
 * Resend OTP
 * @param identifier - Email or phone
 * @param purpose - OTP purpose
 * @returns Promise<void>
 */
export const resendOtp = async (identifier: string, purpose: OtpPurpose): Promise<void> => {
  try {
    // Find user
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate and send new OTP
    await generateAndSendOtp(identifier, purpose);

    logger.info(`OTP resent to: ${identifier}`);
  } catch (error) {
    logger.error('Resend OTP error:', error);
    throw error;
  }
};

/**
 * Send OTP for registration (without checking if user exists)
 * @param identifier - Email or phone
 * @returns Promise<void>
 */
export const sendRegistrationOtp = async (identifier: string): Promise<void> => {
  try {
    // Check if email/phone already exists
    const existingUser = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (existingUser) {
      throw new ConflictError('Email or phone already registered');
    }

    // Generate and send OTP
    await generateAndSendOtp(identifier, OtpPurpose.REGISTER);

    logger.info(`Registration OTP sent to: ${identifier}`);
  } catch (error) {
    logger.error('Send registration OTP error:', error);
    throw error;
  }
};

/**
 * Refresh access token with refresh token rotation
 * @param refreshToken - Refresh token
 * @returns New access token and new refresh token
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const decoded = jwt.verify(refreshToken, env.jwt.refreshSecret) as { userId: string };

    const user = await User.findById(decoded.userId).select('+refreshToken -passwordHash');

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is inactive');
    }

    // Verify the token matches the stored token (prevents reuse after logout)
    if (!user.refreshToken || user.refreshToken !== refreshToken) {
      throw new UnauthorizedError('Refresh token has been invalidated');
    }

    // Generate new tokens (refresh token rotation)
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Store new refresh token and invalidate old one
    user.refreshToken = newRefreshToken;
    await user.save();

    logger.info(`Tokens refreshed for: ${user.email}`);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    logger.error('Token refresh error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Logout user — clears stored refresh token so it cannot be reused
 * @param userId - User ID
 */
export const logoutUser = async (userId: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: '' } });
  logger.info(`User logged out: ${userId}`);
};

/**
 * Forgot password - send OTP for password reset
 * @param identifier - Email or phone
 */
export const forgotPassword = async (identifier: string): Promise<void> => {
  try {
    // Find user
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate and send OTP for password reset
    await generateAndSendOtp(identifier, OtpPurpose.RESET);

    logger.info(`Password reset OTP sent to: ${identifier}`);
  } catch (error) {
    logger.error('Forgot password error:', error);
    throw error;
  }
};

/**
 * Reset password with OTP verification
 * @param identifier - Email or phone
 * @param otp - OTP code
 * @param newPassword - New password
 */
export const resetPassword = async (
  identifier: string,
  otp: string,
  newPassword: string
): Promise<void> => {
  try {
    // Verify OTP
    await verifyOtp(identifier, otp, OtpPurpose.RESET);

    // Find user
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    }).select('+passwordHash');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Hash and save new password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Clear refresh token to force re-login
    user.refreshToken = undefined;
    
    await user.save();

    logger.info(`Password reset successful for: ${user.email}`);
  } catch (error) {
    logger.error('Reset password error:', error);
    throw error;
  }
};
