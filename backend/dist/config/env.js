"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    // Server
    PORT: zod_1.z.string().default('5000'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    // Admin Configuration
    ADMIN_USERNAME: zod_1.z.string().min(3, 'Admin username must be at least 3 characters').optional(),
    ADMIN_PASSWORD: zod_1.z.string().min(6, 'Admin password must be at least 6 characters').optional(),
    ADMIN_EMAIL: zod_1.z.string().email('Valid admin email is required').optional(),
    ADMIN_PHONE: zod_1.z.string().regex(/^\+[1-9]\d{1,14}$/, 'Admin phone must be in E.164 format').optional(),
    ADMIN_FULL_NAME: zod_1.z.string().min(2, 'Admin full name must be at least 2 characters').optional(),
    // MongoDB
    MONGODB_URI: zod_1.z.string().min(1, 'MongoDB URI is required'),
    // JWT
    JWT_ACCESS_SECRET: zod_1.z.string().min(32, 'JWT access secret must be at least 32 characters'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
    JWT_ACCESS_EXPIRES: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES: zod_1.z.string().default('7d'),
    // OTP
    OTP_EXPIRY_MINUTES: zod_1.z.string().default('10'),
    OTP_MAX_ATTEMPTS: zod_1.z.string().default('5'),
    OTP_EMAIL_TEST_MODE: zod_1.z.string().transform((val) => val === 'true').default('false'),
    OTP_SMS_TEST_MODE: zod_1.z.string().transform((val) => val === 'true').default('true'),
    OTP_TEST_CODE: zod_1.z.string().default('123456'),
    // Twilio
    TWILIO_ACCOUNT_SID: zod_1.z.string().min(1, 'Twilio Account SID is required'),
    TWILIO_AUTH_TOKEN: zod_1.z.string().min(1, 'Twilio Auth Token is required'),
    TWILIO_PHONE_NUMBER: zod_1.z.string().min(1, 'Twilio Phone Number is required'),
    // Email
    EMAIL_SERVICE: zod_1.z.enum(['brevo', 'gmail']).default('gmail'),
    BREVO_API_KEY: zod_1.z.string().optional(),
    BREVO_FROM_EMAIL: zod_1.z.string().email().optional(),
    SMTP_HOST: zod_1.z.string().min(1, 'SMTP host is required'),
    SMTP_PORT: zod_1.z.string().default('587'),
    SMTP_USER: zod_1.z.string().email('Valid SMTP user email is required'),
    SMTP_PASS: zod_1.z.string().min(1, 'SMTP password is required'),
    EMAIL_FROM: zod_1.z.string().min(1, 'Email from address is required'),
    // Cloudinary
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().min(1, 'Cloudinary cloud name is required'),
    CLOUDINARY_API_KEY: zod_1.z.string().min(1, 'Cloudinary API key is required'),
    CLOUDINARY_API_SECRET: zod_1.z.string().min(1, 'Cloudinary API secret is required'),
    // CORS
    ALLOWED_ORIGINS: zod_1.z.string().default('http://localhost:3000,http://localhost:5173'),
    // Redis (Section 5.1 - optional, gracefully degrades if not configured)
    REDIS_URL: zod_1.z.string().url().optional(),
});
const parseEnv = () => {
    try {
        const parsed = envSchema.parse(process.env);
        return {
            port: parseInt(parsed.PORT, 10),
            nodeEnv: parsed.NODE_ENV,
            admin: {
                username: parsed.ADMIN_USERNAME,
                password: parsed.ADMIN_PASSWORD,
                email: parsed.ADMIN_EMAIL,
                phone: parsed.ADMIN_PHONE,
                fullName: parsed.ADMIN_FULL_NAME,
            },
            mongodbUri: parsed.MONGODB_URI,
            jwt: {
                accessSecret: parsed.JWT_ACCESS_SECRET,
                refreshSecret: parsed.JWT_REFRESH_SECRET,
                accessExpires: parsed.JWT_ACCESS_EXPIRES,
                refreshExpires: parsed.JWT_REFRESH_EXPIRES,
            },
            otp: {
                expiryMinutes: parseInt(parsed.OTP_EXPIRY_MINUTES, 10),
                maxAttempts: parseInt(parsed.OTP_MAX_ATTEMPTS, 10),
                emailTestMode: parsed.OTP_EMAIL_TEST_MODE,
                smsTestMode: parsed.OTP_SMS_TEST_MODE,
                testCode: parsed.OTP_TEST_CODE,
            },
            twilio: {
                accountSid: parsed.TWILIO_ACCOUNT_SID,
                authToken: parsed.TWILIO_AUTH_TOKEN,
                phoneNumber: parsed.TWILIO_PHONE_NUMBER,
            },
            email: {
                service: parsed.EMAIL_SERVICE,
                brevo: {
                    apiKey: parsed.BREVO_API_KEY,
                    fromEmail: parsed.BREVO_FROM_EMAIL,
                },
                host: parsed.SMTP_HOST,
                port: parseInt(parsed.SMTP_PORT, 10),
                user: parsed.SMTP_USER,
                pass: parsed.SMTP_PASS,
                from: parsed.EMAIL_FROM,
            },
            cloudinary: {
                cloudName: parsed.CLOUDINARY_CLOUD_NAME,
                apiKey: parsed.CLOUDINARY_API_KEY,
                apiSecret: parsed.CLOUDINARY_API_SECRET,
            },
            allowedOrigins: parsed.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
            redisUrl: parsed.REDIS_URL,
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            console.error('❌ Environment validation failed:');
            error.errors.forEach((err) => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`);
            });
            process.exit(1);
        }
        throw error;
    }
};
exports.env = parseEnv();
