"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const stream_1 = require("stream");
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
/**
 * Configure Cloudinary
 */
cloudinary_1.v2.config({
    cloud_name: env_1.env.cloudinary.cloudName,
    api_key: env_1.env.cloudinary.apiKey,
    api_secret: env_1.env.cloudinary.apiSecret,
});
/**
 * Upload file buffer to Cloudinary with streaming (Section 2.4)
 * Streams the buffer to avoid additional memory allocation
 * @param buffer - File buffer
 * @param folder - Cloudinary folder path
 * @param resourceType - Resource type (image, raw, video, auto)
 * @returns Upload result with url, publicId, format, size
 */
const uploadToCloudinary = (buffer, folder, resourceType = 'auto') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder,
            resource_type: resourceType,
            allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
            max_file_size: 5 * 1024 * 1024, // 5MB
            timeout: 60000,
        }, (error, result) => {
            if (error) {
                logger_1.logger.error('Cloudinary upload error:', error);
                reject(error);
            }
            else if (result) {
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    format: result.format,
                    size: result.bytes,
                });
            }
        });
        // Convert Buffer to Readable stream — avoids second memory allocation
        const readable = new stream_1.Readable();
        readable.push(buffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
/**
 * Delete file from Cloudinary
 * @param publicId - Cloudinary public ID
 * @returns Deletion result
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary_1.v2.uploader.destroy(publicId);
        logger_1.logger.info(`Deleted file from Cloudinary: ${publicId}`);
    }
    catch (error) {
        logger_1.logger.error('Cloudinary deletion error:', error);
        throw error;
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
