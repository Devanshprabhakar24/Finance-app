import { z } from 'zod';

const phoneRegex = /^\+[1-9]\d{1,14}$/;

export const otpPurposeEnum = z.enum(['REGISTER', 'LOGIN', 'RESET']);

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or phone is required')
    .transform((val) => val.trim()),
  password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
  identifier: z.union([
    z.string().email('Invalid email format'),
    z.string().regex(phoneRegex, 'Invalid phone format (E.164 required)'),
  ]),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
  purpose: otpPurposeEnum,
});

export const resendOtpSchema = z.object({
  identifier: z.union([
    z.string().email('Invalid email format'),
    z.string().regex(phoneRegex, 'Invalid phone format (E.164 required)'),
  ]),
  purpose: otpPurposeEnum,
});

export const refreshTokenSchema = z.object({});

export const forgotPasswordSchema = z.object({
  identifier: z.union([
    z.string().email('Invalid email format'),
    z.string().regex(phoneRegex, 'Invalid phone format (E.164 required)'),
  ]),
});

export const resetPasswordSchema = z.object({
  identifier: z.union([
    z.string().email('Invalid email format'),
    z.string().regex(phoneRegex, 'Invalid phone format (E.164 required)'),
  ]),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
      'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'
    ),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type OtpPurpose = z.infer<typeof otpPurposeEnum>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
