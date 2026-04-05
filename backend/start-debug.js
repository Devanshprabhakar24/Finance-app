// Debug startup script for Render
console.log('=== Render Debug Startup ===');
console.log('Current working directory:', process.cwd());
console.log('Node.js version:', process.version);
console.log('Environment variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);

const fs = require('fs');
const path = require('path');

console.log('\n=== Checking file structure ===');
try {
    const distExists = fs.existsSync('dist');
    console.log('dist/ directory exists:', distExists);

    if (distExists) {
        const distFiles = fs.readdirSync('dist');
        console.log('dist/ contents:', distFiles);

        const loggerExists = fs.existsSync('dist/utils/logger.js');
        console.log('dist/utils/logger.js exists:', loggerExists);

        if (loggerExists) {
            const loggerContent = fs.readFileSync('dist/utils/logger.js', 'utf8');
            const lines = loggerContent.split('\n');
            console.log('logger.js line 25:', lines[24] || 'LINE NOT FOUND');
            console.log('logger.js contains "stack: true":', loggerContent.includes('stack: true'));
            console.log('logger.js contains "stack),":', loggerContent.includes('stack),'));
        }
    }
} catch (error) {
    console.error('Error checking files:', error.message);
}

console.log('\n=== Attempting to load modules ===');
try {
    console.log('Loading logger...');
    const { logger } = require('./dist/utils/logger');
    console.log('✅ Logger loaded successfully');

    console.log('Loading env...');
    const { env } = require('./dist/config/env');
    console.log('✅ Env loaded successfully');

    console.log('Starting actual server...');
    require('./dist/cluster');
} catch (error) {
    console.error('❌ Error loading modules:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}