import { z } from 'zod';
import { PASSWORD_REQUIREMENTS } from '@/utils/constants';

/**
 * User Schemas - Mirror backend validation
 */

// Phone regex for E.164 format
const phoneRegex = /^\+[1-9]\d{1,14}$/;

// Password regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

/**
 * Update Profile Schema
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces')
    .optional(),
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .optional(),
  phone: z
    .string()
    .regex(phoneRegex, 'Phone must be in E.164 format')
    .optional(),
  profileImage: z
    .string()
    .url('Invalid profile image URL')
    .optional(),
});

/**
 * Change Password Schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(PASSWORD_REQUIREMENTS.MIN_LENGTH, `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters`)
    .regex(
      passwordRegex,
      'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

/**
 * Update User Role Schema (Admin only)
 */
export const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'ANALYST', 'USER'], {
    errorMap: () => ({ message: 'Role must be ADMIN, ANALYST, or USER' }),
  }),
});

/**
 * Update User Status Schema (Admin only)
 */
export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    errorMap: () => ({ message: 'Status must be ACTIVE or INACTIVE' }),
  }),
});

/**
 * User Filter Schema
 */
export const userFilterSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'ANALYST', 'USER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

/**
 * Type exports
 */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type UserFilterInput = z.infer<typeof userFilterSchema>;
