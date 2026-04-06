"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordWithOtpSchema = exports.changePasswordSchema = exports.updateStatusSchema = exports.updateRoleSchema = exports.updateProfileSchema = exports.adminCreateUserSchema = exports.userRegistrationSchema = void 0;
const zod_1 = require("zod");
const phoneRegex = /^\+[1-9]\d{1,14}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
exports.userRegistrationSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must not exceed 50 characters')
        .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces')
        .transform((val) => val.trim()),
    email: zod_1.z
        .string()
        .email('Invalid email format')
        .toLowerCase()
        .transform((val) => val.trim()),
    phone: zod_1.z
        .string()
        .regex(phoneRegex, 'Phone must be in E.164 format (e.g., +911234567890)')
        .transform((val) => val.trim()),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(passwordRegex, 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'),
});
/**
 * Schema for admin directly creating a user (role is assignable)
 */
exports.adminCreateUserSchema = exports.userRegistrationSchema.extend({
    role: zod_1.z
        .enum(['ADMIN', 'ANALYST', 'VIEWER'], {
        errorMap: () => ({ message: 'Role must be ADMIN, ANALYST, or VIEWER' }),
    })
        .optional(),
});
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must not exceed 50 characters')
        .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces')
        .transform((val) => val.trim())
        .optional(),
    email: zod_1.z
        .string()
        .email('Invalid email format')
        .toLowerCase()
        .transform((val) => val.trim())
        .optional(),
    phone: zod_1.z
        .string()
        .regex(phoneRegex, 'Phone must be in E.164 format')
        .transform((val) => val.trim())
        .optional(),
});
exports.updateRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(['ADMIN', 'ANALYST', 'VIEWER'], {
        errorMap: () => ({ message: 'Role must be ADMIN, ANALYST, or VIEWER' }),
    }),
});
exports.updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE'], {
        errorMap: () => ({ message: 'Status must be ACTIVE or INACTIVE' }),
    }),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z
        .string()
        .min(8, 'New password must be at least 8 characters')
        .regex(passwordRegex, 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'),
});
exports.changePasswordWithOtpSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z
        .string()
        .min(8, 'New password must be at least 8 characters')
        .regex(passwordRegex, 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'),
    otp: zod_1.z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});
