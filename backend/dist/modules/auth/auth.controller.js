const { Request, Response  } = require('express');
const { asyncHandler  } = require('../../utils/asyncHandler');
const { sendSuccess  } = require('../../utils/response');
const { UnauthorizedError  } = require('../../middleware/errorHandler');
const authService = require('./auth.service');
const { OtpPurpose  } = require('./otp.model');
const { LoginInput,
  VerifyOtpInput,
  ResendOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
 } = require('./auth.schema');
const { UserRegistrationInput  } = require('../users/user.schema');

/**
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const data= req.body;
  await authService.registerUser(data);
  sendSuccess(res, 'Registration successful. OTP sent to email and phone.', null, undefined, 201);
});

/**
 * POST /api/auth/check-availability
 */
const checkAvailability = asyncHandler(async (req, res) => {
  const { email, phone } = req.body;
  const result = await authService.checkAvailability(email, phone);
  sendSuccess(res, 'Availability checked', result);
});

/**
 * POST /api/auth/verify-otp
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const { identifier, otp, purpose }: VerifyOtpInput = req.body;
  const result = await authService.verifyOtpAndAuthenticate(identifier, otp, purpose);
  
  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly,
    secure: process.env.NODE_ENV === 'production',
    sameSite,
    maxAge, // 7 days
    path,
  });
  
  // Only return accessToken in response body (not refreshToken)
  sendSuccess(res, 'OTP verified successfully', {
    user,
    accessToken,
  });
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { identifier, password }: LoginInput = req.body;
  await authService.loginUser(identifier, password);
  sendSuccess(res, 'OTP sent to email and phone. Please verify to complete login.');
});

/**
 * POST /api/auth/resend-otp
 */
const resendOtp = asyncHandler(async (req, res) => {
  const { identifier, purpose }: ResendOtpInput = req.body;
  await authService.resendOtp(identifier, purpose);
  sendSuccess(res, 'OTP resent successfully');
});

/**
 * POST /api/auth/send-registration-otp
 */
const sendRegistrationOtp = asyncHandler(async (req, res) => {
  const { identifier } = req.body;
  await authService.sendRegistrationOtp(identifier);
  sendSuccess(res, 'OTP sent successfully');
});

/**
 * POST /api/auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
  // Get refresh token from httpOnly cookie
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    throw new UnauthorizedError('No refresh token provided');
  }
  
  const tokens = await authService.refreshAccessToken(refreshToken);
  
  // Set new refresh token in httpOnly cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly,
    secure: process.env.NODE_ENV === 'production',
    sameSite,
    maxAge, // 7 days
    path,
  });
  
  sendSuccess(res, 'Access token refreshed successfully', { accessToken);
});

/**
 * POST /api/auth/logout
 * Clears the stored refresh token so it cannot be reused.
 */
const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user!._id.toString());
  
  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly,
    secure: process.env.NODE_ENV === 'production',
    sameSite,
    path,
  });
  
  sendSuccess(res, 'Logged out successfully');
});

/**
 * POST /api/auth/forgot-password
 * Send OTP for password reset
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { identifier }: ForgotPasswordInput = req.body;
  await authService.forgotPassword(identifier);
  sendSuccess(res, 'Password reset OTP sent to your email and phone');
});

/**
 * POST /api/auth/reset-password
 * Reset password with OTP verification
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { identifier, otp, newPassword }: ResetPasswordInput = req.body;
  await authService.resetPassword(identifier, otp, newPassword);
  sendSuccess(res, 'Password reset successfully. Please login with your new password.');
});

/**
 * POST /api/auth/test-email
 * Test email functionality (development only)
 */
const testEmail = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message);
  }
  
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message);
  }

  const { sendOtpEmail } = await import('../../config/mailer');
  await sendOtpEmail(email, '123456', 'TEST');
  return sendSuccess(res, 'Test email sent successfully');
});
