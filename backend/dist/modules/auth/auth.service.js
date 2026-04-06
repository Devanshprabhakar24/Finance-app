"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.logoutUser = exports.refreshAccessToken = exports.sendRegistrationOtp = exports.resendOtp = exports.loginUser = exports.verifyOtpAndAuthenticate = exports.checkAvailability = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../users/user.model");
const otp_service_1 = require("./otp.service");
const otp_model_1 = require("./otp.model");
const env_1 = require("../../config/env");
const logger_1 = require("../../utils/logger");
const userCache_1 = require("../../utils/userCache");
const errorHandler_1 = require("../../middleware/errorHandler");
/**
 * Generate JWT access token
 */
const generateAccessToken = (user) => {
    const payload = {
        userId: user._id,
        email: user.email,
        role: user.role,
    };
    return jsonwebtoken_1.default.sign(payload, env_1.env.jwt.accessSecret, { expiresIn: env_1.env.jwt.accessExpires });
};
/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (user) => {
    const payload = {
        userId: user._id,
    };
    return jsonwebtoken_1.default.sign(payload, env_1.env.jwt.refreshSecret, { expiresIn: env_1.env.jwt.refreshExpires });
};
/**
 * Register new user
 * @param data - User registration data
 * @returns Promise<void>
 */
const registerUser = async (data) => {
    try {
        // Check if email already exists
        const existingEmail = await user_model_1.User.findOne({ email: data.email });
        if (existingEmail) {
            throw new errorHandler_1.ConflictError('Email already registered');
        }
        // Check if phone already exists
        const existingPhone = await user_model_1.User.findOne({ phone: data.phone });
        if (existingPhone) {
            throw new errorHandler_1.ConflictError('Phone number already registered');
        }
        // Hash password
        const passwordHash = await bcrypt_1.default.hash(data.password, 10);
        // Create user
        const user = await user_model_1.User.create({
            name: data.name,
            email: data.email,
            phone: data.phone,
            passwordHash,
            isVerified: false,
        });
        // Generate and send OTP to both email and phone
        await Promise.all([
            (0, otp_service_1.generateAndSendOtp)(user.email, otp_model_1.OtpPurpose.REGISTER),
            (0, otp_service_1.generateAndSendOtp)(user.phone, otp_model_1.OtpPurpose.REGISTER),
        ]);
        logger_1.logger.info(`User registered: ${user.email}`);
    }
    catch (error) {
        logger_1.logger.error('Registration error:', error);
        throw error;
    }
};
exports.registerUser = registerUser;
/**
 * Check email and phone availability
 * @param email - Email to check
 * @param phone - Phone to check
 * @returns Availability status
 */
const checkAvailability = async (email, phone) => {
    try {
        const checks = [];
        if (email) {
            checks.push(user_model_1.User.findOne({ email }).select('_id'));
        }
        if (phone) {
            checks.push(user_model_1.User.findOne({ phone }).select('_id'));
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
    }
    catch (error) {
        logger_1.logger.error('Availability check error:', error);
        throw error;
    }
};
exports.checkAvailability = checkAvailability;
/**
 * Verify OTP and complete registration
 * @param identifier - Email or phone
 * @param otp - OTP code
 * @param purpose - OTP purpose
 * @returns User data with tokens
 */
const verifyOtpAndAuthenticate = async (identifier, otp, purpose) => {
    try {
        // Verify OTP
        await (0, otp_service_1.verifyOtp)(identifier, otp, purpose);
        // Find user by email or phone
        const user = await user_model_1.User.findOne({
            $or: [{ email: identifier }, { phone: identifier }],
        }).select('-passwordHash');
        if (!user) {
            throw new errorHandler_1.NotFoundError('User not found');
        }
        // Mark user as verified if registering
        if (purpose === otp_model_1.OtpPurpose.REGISTER && !user.isVerified) {
            user.isVerified = true;
            await user.save();
        }
        // Update last login and store refresh token for logout invalidation
        user.lastLogin = new Date();
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        user.refreshToken = refreshToken;
        await user.save();
        logger_1.logger.info(`User authenticated: ${user.email}`);
        return { user, accessToken, refreshToken };
    }
    catch (error) {
        logger_1.logger.error('OTP verification error:', error);
        throw error;
    }
};
exports.verifyOtpAndAuthenticate = verifyOtpAndAuthenticate;
/**
 * Login user with password
 * @param identifier - Email or phone
 * @param password - User password
 * @returns Promise<void>
 */
const loginUser = async (identifier, password) => {
    try {
        // Find user by email or phone
        const user = await user_model_1.User.findOne({
            $or: [{ email: identifier }, { phone: identifier }],
        }).select('+passwordHash');
        if (!user) {
            throw new errorHandler_1.UnauthorizedError('Invalid credentials');
        }
        // Verify password
        const isPasswordValid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new errorHandler_1.UnauthorizedError('Invalid credentials');
        }
        // Check if user is verified
        if (!user.isVerified) {
            throw new errorHandler_1.ValidationError('Account not verified. Please verify your OTP first.');
        }
        // Check if user is active
        if (user.status !== 'ACTIVE') {
            throw new errorHandler_1.UnauthorizedError('Account is inactive');
        }
        // Generate and send OTP to both email and phone
        await Promise.all([
            (0, otp_service_1.generateAndSendOtp)(user.email, otp_model_1.OtpPurpose.LOGIN),
            (0, otp_service_1.generateAndSendOtp)(user.phone, otp_model_1.OtpPurpose.LOGIN),
        ]);
        logger_1.logger.info(`Login OTP sent to: ${user.email}`);
    }
    catch (error) {
        logger_1.logger.error('Login error:', error);
        throw error;
    }
};
exports.loginUser = loginUser;
/**
 * Resend OTP
 * @param identifier - Email or phone
 * @param purpose - OTP purpose
 * @returns Promise<void>
 */
const resendOtp = async (identifier, purpose) => {
    try {
        // Find user
        const user = await user_model_1.User.findOne({
            $or: [{ email: identifier }, { phone: identifier }],
        });
        if (!user) {
            throw new errorHandler_1.NotFoundError('User not found');
        }
        // Generate and send new OTP
        await (0, otp_service_1.generateAndSendOtp)(identifier, purpose);
        logger_1.logger.info(`OTP resent to: ${identifier}`);
    }
    catch (error) {
        logger_1.logger.error('Resend OTP error:', error);
        throw error;
    }
};
exports.resendOtp = resendOtp;
/**
 * Send OTP for registration (without checking if user exists)
 * @param identifier - Email or phone
 * @returns Promise<void>
 */
const sendRegistrationOtp = async (identifier) => {
    try {
        // Check if email/phone already exists
        const existingUser = await user_model_1.User.findOne({
            $or: [{ email: identifier }, { phone: identifier }],
        });
        if (existingUser) {
            throw new errorHandler_1.ConflictError('Email or phone already registered');
        }
        // Generate and send OTP
        await (0, otp_service_1.generateAndSendOtp)(identifier, otp_model_1.OtpPurpose.REGISTER);
        logger_1.logger.info(`Registration OTP sent to: ${identifier}`);
    }
    catch (error) {
        logger_1.logger.error('Send registration OTP error:', error);
        throw error;
    }
};
exports.sendRegistrationOtp = sendRegistrationOtp;
/**
 * Refresh access token with refresh token rotation
 * @param refreshToken - Refresh token
 * @returns New access token and new refresh token
 */
const refreshAccessToken = async (refreshToken) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.env.jwt.refreshSecret);
        const user = await user_model_1.User.findById(decoded.userId).select('+refreshToken -passwordHash');
        if (!user) {
            throw new errorHandler_1.UnauthorizedError('User not found');
        }
        if (user.status !== 'ACTIVE') {
            throw new errorHandler_1.UnauthorizedError('Account is inactive');
        }
        // Verify the token matches the stored token (prevents reuse after logout)
        if (!user.refreshToken || user.refreshToken !== refreshToken) {
            throw new errorHandler_1.UnauthorizedError('Refresh token has been invalidated');
        }
        // Generate new tokens (refresh token rotation)
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        // Store new refresh token and invalidate old one
        user.refreshToken = newRefreshToken;
        await user.save();
        logger_1.logger.info(`Tokens refreshed for: ${user.email}`);
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }
    catch (error) {
        logger_1.logger.error('Token refresh error:', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errorHandler_1.UnauthorizedError('Invalid refresh token');
        }
        throw error;
    }
};
exports.refreshAccessToken = refreshAccessToken;
/**
 * Logout user — clears stored refresh token so it cannot be reused
 * Section 3.1: Invalidates user cache on logout
 * @param userId - User ID
 */
const logoutUser = async (userId) => {
    await user_model_1.User.findByIdAndUpdate(userId, { $unset: { refreshToken: '' } });
    // Invalidate cache on logout
    (0, userCache_1.invalidateUserCache)(userId);
    logger_1.logger.info(`User logged out: ${userId}`);
};
exports.logoutUser = logoutUser;
/**
 * Forgot password - send OTP for password reset
 * @param identifier - Email or phone
 */
const forgotPassword = async (identifier) => {
    try {
        // Find user
        const user = await user_model_1.User.findOne({
            $or: [{ email: identifier }, { phone: identifier }],
        });
        if (!user) {
            throw new errorHandler_1.NotFoundError('User not found');
        }
        // Generate and send OTP for password reset
        await (0, otp_service_1.generateAndSendOtp)(identifier, otp_model_1.OtpPurpose.RESET);
        logger_1.logger.info(`Password reset OTP sent to: ${identifier}`);
    }
    catch (error) {
        logger_1.logger.error('Forgot password error:', error);
        throw error;
    }
};
exports.forgotPassword = forgotPassword;
/**
 * Reset password with OTP verification
 * @param identifier - Email or phone
 * @param otp - OTP code
 * @param newPassword - New password
 */
const resetPassword = async (identifier, otp, newPassword) => {
    try {
        // Verify OTP
        await (0, otp_service_1.verifyOtp)(identifier, otp, otp_model_1.OtpPurpose.RESET);
        // Find user
        const user = await user_model_1.User.findOne({
            $or: [{ email: identifier }, { phone: identifier }],
        }).select('+passwordHash');
        if (!user) {
            throw new errorHandler_1.NotFoundError('User not found');
        }
        // Hash and save new password
        user.passwordHash = await bcrypt_1.default.hash(newPassword, 10);
        // Clear refresh token to force re-login
        user.refreshToken = undefined;
        await user.save();
        logger_1.logger.info(`Password reset successful for: ${user.email}`);
    }
    catch (error) {
        logger_1.logger.error('Reset password error:', error);
        throw error;
    }
};
exports.resetPassword = resetPassword;
