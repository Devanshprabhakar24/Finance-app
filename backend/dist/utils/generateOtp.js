const crypto = require('crypto');

/**
 * Generate a secure 6-digit OTP
 * @returns 6-digit OTP string
 */
const generateOtp = ()=> {
  return crypto.randomInt(100000, 999999).toString();
};
