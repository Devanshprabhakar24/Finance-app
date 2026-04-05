// Verification script to check if the build is correct
const fs = require('fs');

console.log('=== Build Verification ===');

// Set minimal env vars to avoid validation errors
process.env.MONGODB_URI = 'test';
process.env.JWT_ACCESS_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-at-least-32-characters-long';
process.env.TWILIO_ACCOUNT_SID = 'test';
process.env.TWILIO_AUTH_TOKEN = 'test';
process.env.TWILIO_PHONE_NUMBER = 'test';
process.env.SMTP_HOST = 'test';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test';
process.env.EMAIL_FROM = 'test@test.com';
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';

// Check if dist folder exists
if (!fs.existsSync('dist')) {
    console.error('❌ dist/ folder does not exist');
    process.exit(1);
}

// Check if logger.js exists and has correct syntax
if (!fs.existsSync('dist/utils/logger.js')) {
    console.error('❌ dist/utils/logger.js does not exist');
    process.exit(1);
}

const loggerContent = fs.readFileSync('dist/utils/logger.js', 'utf8');

// Check for the specific syntax error
if (loggerContent.includes('winston.format.errors({ stack),')) {
    console.error('❌ logger.js still contains syntax error: winston.format.errors({ stack),');
    console.error('This indicates the build process is not working correctly');
    process.exit(1);
}

// Check for correct syntax
if (!loggerContent.includes('winston.format.errors({ stack: true })')) {
    console.error('❌ logger.js does not contain correct syntax: winston.format.errors({ stack: true })');
    process.exit(1);
}

console.log('✅ logger.js syntax is correct');

// Test syntax by requiring the files
try {
    require('./dist/utils/logger');
    console.log('✅ logger.js can be required without errors');
} catch (error) {
    console.error('❌ logger.js has runtime errors:', error.message);
    process.exit(1);
}

try {
    require('./dist/config/env');
    console.log('✅ env.js can be required without errors');
} catch (error) {
    console.error('❌ env.js has runtime errors:', error.message);
    process.exit(1);
}

console.log('✅ Build verification passed - all files are syntactically correct');