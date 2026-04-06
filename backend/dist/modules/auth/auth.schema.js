"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.refreshTokenSchema = exports.resendOtpSchema = exports.verifyOtpSchema = exports.loginSchema = exports.otpPurposeEnum = void 0;
const zod_1 = require("zod");
const phoneRegex = /^\+[1-9]\d{1,14}$/;
exports.otpPurposeEnum = zod_1.z.enum(['REGISTER', 'LOGIN', 'RESET']);
exports.loginSchema = zod_1.z.object({
    identifier: zod_1.z
        .string()
        .min(1, 'Email or phone is required')
        .transform((val) => val.trim()),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.verifyOtpSchema = zod_1.z.object({
    identifier: zod_1.z.union([
        zod_1.z.string().email('Invalid email format'),
        zod_1.z.string().regex(phoneRegex, 'Invalid phone format (E.164 required)'),
    ]),
    otp: zod_1.z
        .string()
        .length(6, 'OTP must be exactly 6 digits')
        .regex(/^\d{6}$/, 'OTP must contain only digits'),
    purpose: exports.otpPurposeEnum,
});
exports.resendOtpSchema = zod_1.z.object({
    identifier: zod_1.z.union([
        zod_1.z.string().email('Invalid email format'),
        zod_1.z.string().regex(phoneRegex, 'Invalid phone format (E.164 required)'),
    ]),
    purpose: exports.otpPurposeEnum,
});
exports.refreshTokenSchema = zod_1.z.object({});
exports.forgotPasswordSchema = zod_1.z.object({
    identifier: zod_1.z.union([
        zod_1.z.string().email('Invalid email format'),
        zod_1.z.string().regex(phoneRegex, 'Invalid phone format (E.164 required)'),
    ]),
});
exports.resetPasswordSchema = zod_1.z.object({
    identifier: zod_1.z.union([
        zod_1.z.string().email('Invalid email format'),
        zod_1.z.string().regex(phoneRegex, 'Invalid phone format (E.164 required)'),
    ]),
    otp: zod_1.z
        .string()
        .length(6, 'OTP must be exactly 6 digits')
        .regex(/^\d{6}$/, 'OTP must contain only digits'),
    newPassword: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/, 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'),
});
