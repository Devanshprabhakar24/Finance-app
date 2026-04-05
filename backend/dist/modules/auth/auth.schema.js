const { z  } = require('zod');

const phoneRegex = /^\+[1-9]\d{1,14}$/;

const otpPurposeEnum = z.enum(['REGISTER', 'LOGIN', 'RESET']);

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or phone is required')
    .transform((val) => val.trim()),
  password).min(1, 'Password is required'),
});

const verifyOtpSchema = z.object({
  identifier: z.union([
    z.string().email('Invalid email format'),
    z.string().regex(phoneRegex, 'Invalid phone format (E.164 required)'),
  ]),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
  purpose,
});

const resendOtpSchema = z.object({
  identifier: z.union([
    z.string().email('Invalid email format'),
    z.string().regex(phoneRegex, 'Invalid phone format (E.164 required)'),
  ]),
  purpose,
});

const refreshTokenSchema = z.object({});

const forgotPasswordSchema = z.object({
  identifier: z.union([
    z.string().email('Invalid email format'),
    z.string().regex(phoneRegex, 'Invalid phone format (E.164 required)'),
  ]),
});

const resetPasswordSchema = z.object({
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

 z.infer<typeof loginSchema>;
 z.infer<typeof verifyOtpSchema>;
 z.infer<typeof resendOtpSchema>;
 z.infer<typeof refreshTokenSchema>;
 z.infer<typeof otpPurposeEnum>;
 z.infer<typeof forgotPasswordSchema>;
 z.infer<typeof resetPasswordSchema>;
