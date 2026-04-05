const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, IUser  } = require('../users/user.model');
const { UserRegistrationInput  } = require('../users/user.schema');
const { generateAndSendOtp, verifyOtp  } = require('./otp.service');
const { OtpPurpose  } = require('./otp.model');
const { env  } = require('../../config/env');
const { logger  } = require('../../utils/logger');
const { invalidateUserCache  } = require('../../utils/userCache');
const { ConflictError,
  UnauthorizedError,
  ValidationError,
  NotFoundError,
 } = require('../../middleware/errorHandler');

/**
 * Generate JWT access token
 */
const generateAccessToken = (user)=> {
  const payload = {
    userId,
    email,
    role,
  };
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn);
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (user)=> {
  const payload = {
    userId,
  };
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn);
};

/**
 * Register new user
 * @param data - User registration data
 * @returns Promise<void>
 */
const registerUser = async (data)=> {
  try {
    // Check if email already exists
    const existingEmail = await User.findOne({ email);
    if (existingEmail) {
      throw new ConflictError('Email already registered');
    }

    // Check if phone already exists
    const existingPhone = await User.findOne({ phone);
    if (existingPhone) {
      throw new ConflictError('Phone number already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      isVerified,
    });

    // Generate and send OTP to both email and phone
    await Promise.all([
      generateAndSendOtp(user.email, OtpPurpose.REGISTER),
      generateAndSendOtp(user.phone, OtpPurpose.REGISTER),
    ]);

    logger.info(`User registered: ${user.email}`);
  } catch (error) {
    logger.error('Registration error, error);
    throw error;
  }
};

/**
 * Check email and phone availability
 * @param email - Email to check
 * @param phone - Phone to check
 * @returns Availability status
 */
const checkAvailability = async (
  email: string, 
  phone: string
){ emailAvailable: boolean; phoneAvailable: boolean }> => {
  try {
    const checks = [];
    
    if (email) {
      checks.push(User.findOne({ email }).select('_id'));
    }
    
    if (phone) {
      checks.push(User.findOne({ phone }).select('_id'));
    }

    const results = await Promise.all(checks);
    
    let emailAvailable = true;
    let phoneAvailable = true;
    
    if (email && results[0]) {
      emailAvailable = false;
    }
    
    if (phone) {
      const phoneIndex = email ? 1 : 0;
      if (results[phoneIndex]) {
        phoneAvailable = false;
      }
    }

    return { emailAvailable, phoneAvailable };
  } catch (error) {
    logger.error('Availability check error, error);
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
const verifyOtpAndAuthenticate = async (
  identifier,
  otp,
  purpose: OtpPurpose
){ user: IUser; accessToken: string; refreshToken: string }> => {
  try {
    // Verify OTP
    await verifyOtp(identifier, otp, purpose);

    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email, { phone,
    }).select('-passwordHash');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Mark user
    if (purpose === OtpPurpose.REGISTER && !user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    // Update last login and store refresh token for logout invalidation
    user.lastLogin = new Date();
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    logger.info(`User authenticated: ${user.email}`);

    return { user, accessToken, refreshToken };
  } catch (error) {
    logger.error('OTP verification error, error);
    throw error;
  }
};

/**
 * Login user with password
 * @param identifier - Email or phone
 * @param password - User password
 * @returns Promise<void>
 */
const loginUser = async (identifier, password)=> {
  try {
    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email, { phone,
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
    logger.error('Login error, error);
    throw error;
  }
};

/**
 * Resend OTP
 * @param identifier - Email or phone
 * @param purpose - OTP purpose
 * @returns Promise<void>
 */
const resendOtp = async (identifier, purpose)=> {
  try {
    // Find user
    const user = await User.findOne({
      $or: [{ email, { phone,
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate and send new OTP
    await generateAndSendOtp(identifier, purpose);

    logger.info(`OTP resent to: ${identifier}`);
  } catch (error) {
    logger.error('Resend OTP error, error);
    throw error;
  }
};

/**
 * Send OTP for registration (without checking if user exists)
 * @param identifier - Email or phone
 * @returns Promise<void>
 */
const sendRegistrationOtp = async (identifier)=> {
  try {
    // Check if email/phone already exists
    const existingUser = await User.findOne({
      $or: [{ email, { phone,
    });

    if (existingUser) {
      throw new ConflictError('Email or phone already registered');
    }

    // Generate and send OTP
    await generateAndSendOtp(identifier, OtpPurpose.REGISTER);

    logger.info(`Registration OTP sent to: ${identifier}`);
  } catch (error) {
    logger.error('Send registration OTP error, error);
    throw error;
  }
};

/**
 * Refresh access token with refresh token rotation
 * @param refreshToken - Refresh token
 * @returns New access token and new refresh token
 */
const refreshAccessToken = async (
  refreshToken: string
){ accessToken: string; refreshToken: string }> => {
  try {
    const decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);

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

    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    logger.error('Token refresh error, error);
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Logout user — clears stored refresh token so it cannot be reused
 * Section 3.1: Invalidates user cache on logout
 * @param userId - User ID
 */
const logoutUser = async (userId)=> {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken);
  
  // Invalidate cache on logout
  invalidateUserCache(userId);
  
  logger.info(`User logged out: ${userId}`);
};

/**
 * Forgot password - send OTP for password reset
 * @param identifier - Email or phone
 */
const forgotPassword = async (identifier)=> {
  try {
    // Find user
    const user = await User.findOne({
      $or: [{ email, { phone,
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate and send OTP for password reset
    await generateAndSendOtp(identifier, OtpPurpose.RESET);

    logger.info(`Password reset OTP sent to: ${identifier}`);
  } catch (error) {
    logger.error('Forgot password error, error);
    throw error;
  }
};

/**
 * Reset password with OTP verification
 * @param identifier - Email or phone
 * @param otp - OTP code
 * @param newPassword - New password
 */
const resetPassword = async (
  identifier,
  otp,
  newPassword: string
)=> {
  try {
    // Verify OTP
    await verifyOtp(identifier, otp, OtpPurpose.RESET);

    // Find user
    const user = await User.findOne({
      $or: [{ email, { phone,
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
    logger.error('Reset password error, error);
    throw error;
  }
};
