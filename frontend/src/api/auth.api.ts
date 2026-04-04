import apiClient from './axios';
import type { User } from '../types/index';

/**
 * Authentication API calls
 */

// Response types
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    identifier: string;
    expiresAt: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    identifier: string;
    expiresAt: string;
  };
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
  };
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginPayload {
  identifier: string; // email or phone
  password: string;
}

export interface VerifyOtpPayload {
  identifier: string;
  otp: string;
  purpose: 'REGISTER' | 'LOGIN' | 'RESET';
}

/**
 * Register new user
 * Sends OTP to email and phone
 */
export async function register(data: RegisterPayload): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>('/auth/register', data);
  return response.data;
}

/**
 * Login user
 * Sends OTP to email and phone
 */
export async function login(data: LoginPayload): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  return response.data;
}

/**
 * Verify OTP
 * Returns user data and tokens
 */
export async function verifyOtp(data: VerifyOtpPayload): Promise<VerifyOtpResponse> {
  const response = await apiClient.post<VerifyOtpResponse>('/auth/verify-otp', data);
  return response.data;
}

/**
 * Resend OTP
 */
export async function resendOtp(identifier: string, purpose: 'REGISTER' | 'LOGIN' | 'RESET'): Promise<void> {
  await apiClient.post('/auth/resend-otp', { identifier, purpose });
}

/**
 * Refresh access token
 * Uses httpOnly refresh token cookie
 */
export async function refreshToken(): Promise<RefreshTokenResponse> {
  const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh');
  return response.data;
}

/**
 * Logout user
 * Clears refresh token cookie
 */
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

/**
 * Get current user profile
 */
export async function getMe() {
  const response = await apiClient.get('/auth/me');
  return response.data;
}
