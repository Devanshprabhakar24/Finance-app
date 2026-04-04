import bcrypt from 'bcrypt';
import { Otp, OtpType, OtpPurpose } from './otp.model';
import { generateOtp } from '../../utils/generateOtp';
import { sendOtpEmail } from '../../config/mailer';
import { sendOtpSms } from '../../config/twilio';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { TooManyAttemptsError, ValidationError } from '../../middleware/errorHandler';

/**
 * Determine if identifier is email or phone
 */
const getIdentifierType = (identifier: string): OtpType => {
  return identifier.includes('@') ? OtpType.EMAIL : OtpType.SMS;
};

/**
 * Generate and send OTP to user
 * @param identifier - Email or phone number
 * @param purpose - Purpose of OTP
 * @returns Promise<void>
 */
export const generateAndSendOtp = async (
  identifier: string,
  purpose: OtpPurpose
): Promise<void> => {
  try {
    // Invalidate previous OTPs for same identifier and purpose
    await Otp.updateMany(
      { identifier, purpose, isUsed: false },
      { isUsed: true }
    );

    // Generate new OTP
    const type = getIdentifierType(identifier);
    const isEmailTestMode = type === OtpType.EMAIL && env.otp.emailTestMode;
    const isSmsTestMode = type === OtpType.SMS && env.otp.smsTestMode;
    const rawOtp = (isEmailTestMode || isSmsTestMode) ? env.otp.testCode : generateOtp();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + env.otp.expiryMinutes);

    // Store OTP in database
    await Otp.create({
      identifier,
      type,
      otp: hashedOtp,
      purpose,
      expiresAt,
      attempts: 0,
      isUsed: false,
    });

    // Send OTP via appropriate channel
    if (type === OtpType.EMAIL) {
      await sendOtpEmail(identifier, rawOtp, purpose);
      if (isEmailTestMode) {
        logger.info(`🧪 EMAIL TEST MODE: OTP for ${identifier} is: ${rawOtp}`);
      }
    } else {
      await sendOtpSms(identifier, rawOtp);
      if (isSmsTestMode) {
        logger.info(`🧪 SMS TEST MODE: OTP for ${identifier} is: ${rawOtp}`);
      }
    }

    logger.info(`OTP generated and sent to ${identifier} for ${purpose} (Email Test: ${isEmailTestMode}, SMS Test: ${isSmsTestMode})`);
  } catch (error) {
    logger.error('Error generating and sending OTP:', error);
    throw error;
  }
};

/**
 * Verify OTP
 * @param identifier - Email or phone number
 * @param rawOtp - Plain OTP entered by user
 * @param purpose - Purpose of OTP
 * @returns Promise<boolean>
 */
export const verifyOtp = async (
  identifier: string,
  rawOtp: string,
  purpose: OtpPurpose
): Promise<boolean> => {
  try {
    // Find latest unused OTP for identifier and purpose
    const otpRecord = await Otp.findOne({
      identifier,
      purpose,
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      throw new ValidationError('Invalid or expired OTP');
    }

    // Check if OTP is locked due to too many failed attempts
    if (otpRecord.lockedUntil && new Date() < otpRecord.lockedUntil) {
      const retryAfterSeconds = Math.ceil((otpRecord.lockedUntil.getTime() - Date.now()) / 1000);
      throw new TooManyAttemptsError(
        `OTP is locked due to too many failed attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minutes`,
        retryAfterSeconds
      );
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      throw new ValidationError('OTP has expired');
    }

    // Check if max attempts exceeded (should be caught by lockedUntil, but double-check)
    if (otpRecord.attempts >= env.otp.maxAttempts) {
      throw new TooManyAttemptsError(
        `Maximum OTP verification attempts (${env.otp.maxAttempts}) exceeded`
      );
    }

    // Verify OTP
    const isValid = await bcrypt.compare(rawOtp, otpRecord.otp);

    if (!isValid) {
      // Increment attempts
      otpRecord.attempts += 1;

      // Lock OTP after 3 failed attempts for 30 minutes
      if (otpRecord.attempts >= 3) {
        otpRecord.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await otpRecord.save();
        throw new TooManyAttemptsError(
          'Too many failed attempts. OTP locked for 30 minutes',
          30 * 60 // 30 minutes in seconds
        );
      }

      await otpRecord.save();
      throw new ValidationError(
        `Invalid OTP. ${env.otp.maxAttempts - otpRecord.attempts} attempts remaining`
      );
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    logger.info(`OTP verified successfully for ${identifier}`);
    return true;
  } catch (error) {
    logger.error('Error verifying OTP:', error);
    throw error;
  }
};
