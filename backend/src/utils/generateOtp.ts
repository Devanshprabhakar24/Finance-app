import crypto from 'crypto';

/**
 * Generate a secure 6-digit OTP
 * @returns 6-digit OTP string
 */
export const generateOtp = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};
