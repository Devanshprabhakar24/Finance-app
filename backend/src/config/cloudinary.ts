import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';
import { logger } from '../utils/logger';

/**
 * Configure Cloudinary
 */
cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

/**
 * Upload file buffer to Cloudinary
 * @param buffer - File buffer
 * @param folder - Cloudinary folder path
 * @param resourceType - Resource type (image, raw, video, auto)
 * @returns Upload result with url, publicId, format, size
 */
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string,
  resourceType: 'image' | 'raw' | 'video' | 'auto' = 'auto'
): Promise<{
  url: string;
  publicId: string;
  format: string;
  size: number;
}> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
        max_file_size: 5 * 1024 * 1024, // 5MB
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            size: result.bytes,
          });
        }
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Delete file from Cloudinary
 * @param publicId - Cloudinary public ID
 * @returns Deletion result
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info(`Deleted file from Cloudinary: ${publicId}`);
  } catch (error) {
    logger.error('Cloudinary deletion error:', error);
    throw error;
  }
};

export { cloudinary };
