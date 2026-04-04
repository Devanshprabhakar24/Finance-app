import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import * as authService from './auth.service';
import {
  LoginInput,
  VerifyOtpInput,
  ResendOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.schema';
import { UserRegistrationInput } from '../users/user.schema';

/**
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const data: UserRegistrationInput = req.body;
  await authService.registerUser(data);
  sendSuccess(res, 'Registration successful. OTP sent to email and phone.', null, undefined, 201);
});

/**
 * POST /api/auth/verify-otp
 */
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, otp, purpose }: VerifyOtpInput = req.body;
  const result = await authService.verifyOtpAndAuthenticate(identifier, otp, purpose as any);
  
  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  // Only return accessToken in response body (not refreshToken)
  sendSuccess(res, 'OTP verified successfully', {
    user: result.user,
    accessToken: result.accessToken,
  });
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password }: LoginInput = req.body;
  await authService.loginUser(identifier, password);
  sendSuccess(res, 'OTP sent to email and phone. Please verify to complete login.');
});

/**
 * POST /api/auth/resend-otp
 */
export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, purpose }: ResendOtpInput = req.body;
  await authService.resendOtp(identifier, purpose as any);
  sendSuccess(res, 'OTP resent successfully');
});

/**
 * POST /api/auth/send-registration-otp
 */
export const sendRegistrationOtp = asyncHandler(async (req: Request, res: Response) => {
  const { identifier } = req.body;
  await authService.sendRegistrationOtp(identifier);
  sendSuccess(res, 'OTP sent successfully');
});

/**
 * POST /api/auth/refresh-token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  // Get refresh token from httpOnly cookie
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    res.status(401).json({ 
      success: false, 
      message: 'No refresh token provided',
      error: {
        code: 'UNAUTHORIZED'
      }
    });
    return;
  }
  
  const tokens = await authService.refreshAccessToken(refreshToken);
  
  // Set new refresh token in httpOnly cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  sendSuccess(res, 'Access token refreshed successfully', { accessToken: tokens.accessToken });
});

/**
 * POST /api/auth/logout
 * Clears the stored refresh token so it cannot be reused.
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logoutUser(req.user!._id.toString());
  
  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  
  sendSuccess(res, 'Logged out successfully');
});

/**
 * POST /api/auth/forgot-password
 * Send OTP for password reset
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { identifier }: ForgotPasswordInput = req.body;
  await authService.forgotPassword(identifier);
  sendSuccess(res, 'Password reset OTP sent to your email and phone');
});

/**
 * POST /api/auth/reset-password
 * Reset password with OTP verification
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, otp, newPassword }: ResetPasswordInput = req.body;
  await authService.resetPassword(identifier, otp, newPassword);
  sendSuccess(res, 'Password reset successfully. Please login with your new password.');
});
