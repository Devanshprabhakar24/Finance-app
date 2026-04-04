import { z } from 'zod';
import { PASSWORD_REQUIREMENTS } from '@/utils/constants';

/**
 * Auth Schemas - Mirror backend validation
 */

// Phone regex for E.164 format
const phoneRegex = /^\+[1-9]\d{1,14}$/;

// Password regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

/**
 * Register Schema
 */
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase(),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .regex(phoneRegex, 'Phone must be in E.164 format (e.g., +911234567890)'),
  password: z
    .string()
    .min(PASSWORD_REQUIREMENTS.MIN_LENGTH, `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters`)
    .regex(
      passwordRegex,
      'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'
    ),
});

/**
 * Login Schema
 */
export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or phone is required'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

/**
 * OTP Purpose Enum
 */
export const otpPurposeEnum = z.enum(['REGISTER', 'LOGIN', 'RESET']);

/**
 * Verify OTP Schema
 */
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

/**
 * Resend OTP Schema
 */
export const resendOtpSchema = z.object({
  identifier: z.union([
    z.string().email('Invalid email format'),
    z.string().regex(phoneRegex, 'Invalid phone format (E.164 required)'),
  ]),
  purpose: otpPurposeEnum,
});

/**
 * Password Strength Checker
 */
export function checkPasswordStrength(password: string): {
  score: number; // 0-4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
} {
  const checks = {
    length: password.length >= PASSWORD_REQUIREMENTS.MIN_LENGTH,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: new RegExp(`[${PASSWORD_REQUIREMENTS.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  let label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  if (score <= 1) label = 'Weak';
  else if (score === 2) label = 'Fair';
  else if (score === 3) label = 'Good';
  else if (score === 4) label = 'Strong';
  else label = 'Very Strong';

  return { score, label, checks };
}

/**
 * Type exports
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type OtpPurpose = z.infer<typeof otpPurposeEnum>;
