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
exports.testEmail = exports.resetPassword = exports.forgotPassword = exports.logout = exports.refreshToken = exports.sendRegistrationOtp = exports.resendOtp = exports.login = exports.verifyOtp = exports.checkAvailability = exports.register = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_1 = require("../../utils/response");
const errorHandler_1 = require("../../middleware/errorHandler");
const authService = __importStar(require("./auth.service"));
/**
 * POST /api/auth/register
 */
exports.register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    await authService.registerUser(data);
    (0, response_1.sendSuccess)(res, 'Registration successful. OTP sent to email and phone.', null, undefined, 201);
});
/**
 * POST /api/auth/check-availability
 */
exports.checkAvailability = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, phone } = req.body;
    const result = await authService.checkAvailability(email, phone);
    (0, response_1.sendSuccess)(res, 'Availability checked', result);
});
/**
 * POST /api/auth/verify-otp
 */
exports.verifyOtp = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { identifier, otp, purpose } = req.body;
    const result = await authService.verifyOtpAndAuthenticate(identifier, otp, purpose);
    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
    });
    // Only return accessToken in response body (not refreshToken)
    (0, response_1.sendSuccess)(res, 'OTP verified successfully', {
        user: result.user,
        accessToken: result.accessToken,
    });
});
/**
 * POST /api/auth/login
 */
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { identifier, password } = req.body;
    await authService.loginUser(identifier, password);
    (0, response_1.sendSuccess)(res, 'OTP sent to email and phone. Please verify to complete login.');
});
/**
 * POST /api/auth/resend-otp
 */
exports.resendOtp = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { identifier, purpose } = req.body;
    await authService.resendOtp(identifier, purpose);
    (0, response_1.sendSuccess)(res, 'OTP resent successfully');
});
/**
 * POST /api/auth/send-registration-otp
 */
exports.sendRegistrationOtp = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { identifier } = req.body;
    await authService.sendRegistrationOtp(identifier);
    (0, response_1.sendSuccess)(res, 'OTP sent successfully');
});
/**
 * POST /api/auth/refresh
 */
exports.refreshToken = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Get refresh token from httpOnly cookie
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new errorHandler_1.UnauthorizedError('No refresh token provided');
    }
    const tokens = await authService.refreshAccessToken(refreshToken);
    // Set new refresh token in httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
    });
    (0, response_1.sendSuccess)(res, 'Access token refreshed successfully', { accessToken: tokens.accessToken });
});
/**
 * POST /api/auth/logout
 * Clears the stored refresh token so it cannot be reused.
 */
exports.logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await authService.logoutUser(req.user._id.toString());
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    });
    (0, response_1.sendSuccess)(res, 'Logged out successfully');
});
/**
 * POST /api/auth/forgot-password
 * Send OTP for password reset
 */
exports.forgotPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { identifier } = req.body;
    await authService.forgotPassword(identifier);
    (0, response_1.sendSuccess)(res, 'Password reset OTP sent to your email and phone');
});
/**
 * POST /api/auth/reset-password
 * Reset password with OTP verification
 */
exports.resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { identifier, otp, newPassword } = req.body;
    await authService.resetPassword(identifier, otp, newPassword);
    (0, response_1.sendSuccess)(res, 'Password reset successfully. Please login with your new password.');
});
/**
 * POST /api/auth/test-email
 * Test email functionality (development only)
 */
exports.testEmail = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ message: 'Not found' });
    }
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    const { sendOtpEmail } = await Promise.resolve().then(() => __importStar(require('../../config/mailer')));
    await sendOtpEmail(email, '123456', 'TEST');
    return (0, response_1.sendSuccess)(res, 'Test email sent successfully');
});
