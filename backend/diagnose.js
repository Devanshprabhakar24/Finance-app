#!/usr/bin/env node

/**
 * Simple diagnostic script to test backend startup issues
 * Run with: node diagnose.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('🔍 Finance Dashboard Backend Diagnostics');
console.log('==========================================');

// Check critical environment variables
const criticalEnvs = [
    'MONGODB_URI',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
];

console.log('\n📋 Environment Variables Check:');
criticalEnvs.forEach(env => {
    const value = process.env[env];
    console.log(`  ${env}: ${value ? '✅ SET' : '❌ NOT SET'}`);
});

// Test MongoDB connection
async function testMongoDB() {
    console.log('\n🍃 Testing MongoDB Connection...');

    if (!process.env.MONGODB_URI) {
        console.log('❌ MONGODB_URI not set');
        return false;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connection successful');

        // Test ping
        await mongoose.connection.db.admin().ping();
        console.log('✅ MongoDB ping successful');

        await mongoose.connection.close();
        return true;
    } catch (error) {
        console.log('❌ MongoDB connection failed:', error.message);
        return false;
    }
}

// Test Cloudinary
async function testCloudinary() {
    console.log('\n☁️ Testing Cloudinary Connection...');

    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        console.log('❌ Cloudinary credentials not set');
        return false;
    }

    try {
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
            cloud_name: CLOUDINARY_CLOUD_NAME,
            api_key: CLOUDINARY_API_KEY,
            api_secret: CLOUDINARY_API_SECRET,
        });

        await cloudinary.api.ping();
        console.log('✅ Cloudinary connection successful');
        return true;
    } catch (error) {
        console.log('❌ Cloudinary connection failed:', error.message);
        return false;
    }
}

// Run all tests
async function runDiagnostics() {
    console.log(`\n🌍 Node.js Version: ${process.version}`);
    console.log(`📦 Platform: ${process.platform}`);
    console.log(`🏠 Working Directory: ${process.cwd()}`);

    const mongoOk = await testMongoDB();
    const cloudinaryOk = await testCloudinary();

    console.log('\n📊 Summary:');
    console.log(`  MongoDB: ${mongoOk ? '✅' : '❌'}`);
    console.log(`  Cloudinary: ${cloudinaryOk ? '✅' : '❌'}`);

    if (mongoOk && cloudinaryOk) {
        console.log('\n🎉 All services healthy! Backend should start successfully.');
    } else {
        console.log('\n⚠️ Some services failed. Check the errors above.');
    }

    process.exit(0);
}

runDiagnostics().catch(error => {
    console.error('\n💥 Diagnostic script failed:', error);
    process.exit(1);
});