const { v2;
import { Readable  } = require('stream');
const { env  } = require('./env');
const { logger  } = require('../utils/logger');

/**
 * Configure Cloudinary
 */
cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
});

/**
 * Upload file buffer to Cloudinary with streaming (Section 2.4)
 * Streams the buffer to avoid additional memory allocation
 * @param buffer - File buffer
 * @param folder - Cloudinary folder path
 * @param resourceType - Resource type (image, raw, video, auto)
 * @returns Upload result with url, publicId, format, size
 */
const uploadToCloudinary = (
  buffer,
  folder,
  resourceType: 'image' | 'raw' | 'video' | 'auto' = 'auto'
){
  url: string;
  publicId: string;
  format: string;
  size: number;
}> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type,
        allowed_formats, 'jpeg', 'png', 'pdf', 'webp'],
        max_file_size, // 5MB
        timeout,  // Add explicit timeout
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error, error);
          reject(error);
        } else if (result) {
          resolve({
            url,
            publicId,
            format,
            size,
          });
        }
      }
    );

    // Convert Buffer to Readable stream — avoids second memory allocation
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

/**
 * Delete file from Cloudinary
 * @param publicId - Cloudinary ID
 * @returns Deletion result
 */
const deleteFromCloudinary = async (publicId)=> {
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info(`Deleted file from Cloudinary: ${publicId}`);
  } catch (error) {
    logger.error('Cloudinary deletion error, error);
    throw error;
  }
};

module.exports = { cloudinary  };
