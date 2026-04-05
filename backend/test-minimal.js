// Minimal test to verify the build works
process.env.NODE_ENV = 'production';
process.env.PORT = '8000';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.JWT_ACCESS_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-at-least-32-characters-long';
process.env.TWILIO_ACCOUNT_SID = 'test';
process.env.TWILIO_AUTH_TOKEN = 'test';
process.env.TWILIO_PHONE_NUMBER = 'test';
process.env.SMTP_HOST = 'smtp.gmail.com';
process.env.SMTP_USER = 'test@gmail.com';
process.env.SMTP_PASS = 'test';
process.env.EMAIL_FROM = 'test@gmail.com';
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';

try {
    console.log('Testing environment configuration...');
    const { env } = require('./dist/config/env');
    console.log('✅ Environment configuration loaded successfully');
    console.log('Port:', env.port);
    console.log('Node Environment:', env.nodeEnv);

    console.log('Testing logger...');
    const { logger } = require('./dist/utils/logger');
    logger.info('✅ Logger working correctly');

    console.log('✅ All core modules loaded successfully!');
    console.log('The build is working correctly.');
} catch (error) {
    console.error('❌ Error testing build:', error.message);
    process.exit(1);
}