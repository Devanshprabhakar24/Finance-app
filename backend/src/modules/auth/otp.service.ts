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

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      throw new ValidationError('OTP has expired');
    }

    // Verify OTP
    const isValid = await bcrypt.compare(rawOtp, otpRecord.otp);

    if (!isValid) {
      // Just increment attempts but don't lock
      otpRecord.attempts += 1;
      await otpRecord.save();
      
      throw new ValidationError('Invalid OTP. Please try again.');
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
