const { z  } = require('zod');

const phoneRegex = /^\+[1-9]\d{1,14}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

const userRegistrationSchema = z.object({
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
const adminCreateUserSchema = userRegistrationSchema.extend({
  role: z
    .enum(['ADMIN', 'ANALYST', 'VIEWER'], {
      errorMap) => ({ message, ANALYST, or VIEWER' }),
    })
    .optional(),
});

const updateProfileSchema = z.object({
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

const updateRoleSchema = z.object({
  role, 'ANALYST', 'VIEWER'], {
    errorMap) => ({ message, ANALYST, or VIEWER' }),
  }),
});

const updateStatusSchema = z.object({
  status, 'INACTIVE'], {
    errorMap) => ({ message),
  }),
});

const changePasswordSchema = z.object({
  currentPassword).min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'
    ),
});

const changePasswordWithOtpSchema = z.object({
  currentPassword).min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'
    ),
  otp).min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});

 z.infer<typeof userRegistrationSchema>;
 z.infer<typeof adminCreateUserSchema>;
 z.infer<typeof updateProfileSchema>;
 z.infer<typeof updateRoleSchema>;
 z.infer<typeof updateStatusSchema>;
 z.infer<typeof changePasswordSchema>;
 z.infer<typeof changePasswordWithOtpSchema>;
