import { z } from 'zod';

const phoneRegex = /^\+[1-9]\d{1,14}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

export const userRegistrationSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces')
    .transform((val) => val.trim()),
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .transform((val) => val.trim()),
  phone: z
    .string()
    .regex(phoneRegex, 'Phone must be in E.164 format (e.g., +911234567890)')
    .transform((val) => val.trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'
    ),
});

/**
 * Schema for admin directly creating a user (role is assignable)
 */
export const adminCreateUserSchema = userRegistrationSchema.extend({
  role: z
    .enum(['ADMIN', 'ANALYST', 'VIEWER'], {
      errorMap: () => ({ message: 'Role must be ADMIN, ANALYST, or VIEWER' }),
    })
    .optional(),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces')
    .transform((val) => val.trim())
    .optional(),
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .transform((val) => val.trim())
    .optional(),
  phone: z
    .string()
    .regex(phoneRegex, 'Phone must be in E.164 format')
    .transform((val) => val.trim())
    .optional(),
});

export const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'ANALYST', 'VIEWER'], {
    errorMap: () => ({ message: 'Role must be ADMIN, ANALYST, or VIEWER' }),
  }),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    errorMap: () => ({ message: 'Status must be ACTIVE or INACTIVE' }),
  }),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'
    ),
});

export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
