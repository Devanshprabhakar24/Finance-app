const bcrypt = require('bcrypt');
const { Otp, OtpType, OtpPurpose  } = require('./otp.model');
const { generateOtp  } = require('../../utils/generateOtp');
const { sendOtpEmail  } = require('../../config/mailer');
const { sendOtpSms  } = require('../../config/twilio');
const { env  } = require('../../config/env');
const { logger  } = require('../../utils/logger');
const { ValidationError  } = require('../../middleware/errorHandler');

/**
 * Determine if identifier is email or phone
 */
const getIdentifierType = (identifier)=> {
  return identifier.includes('@') ? OtpType.EMAIL : OtpType.SMS;
};

/**
 * Generate and send OTP to user
 * @param identifier - Email or phone number
 * @param purpose - Purpose of OTP
 * @returns Promise<void>
 */
const generateAndSendOtp = async (
  identifier,
  purpose: OtpPurpose
)=> {
  try {
    // Invalidate previous OTPs for same identifier and purpose
    await Otp.updateMany(
      { identifier, purpose, isUsed,
      { isUsed: true }
    );

    // Generate new OTP
    const type = getIdentifierType(identifier);
    const isEmailTestMode = type === OtpType.EMAIL && env.otp.emailTestMode;
    const isSmsTestMode = type === OtpType.SMS && env.otp.smsTestMode;
    const rawOtp = (isEmailTestMode || isSmsTestMode) ? env.otp.testCode);
    const hashedOtp = await bcrypt.hash(rawOtp, 10);

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + env.otp.expiryMinutes);

    // Store OTP in database
    await Otp.create({
      identifier,
      type,
      otp,
      purpose,
      expiresAt,
      attempts,
      isUsed,
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
    logger.error('Error generating and sending OTP, error);
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
const verifyOtp = async (
  identifier,
  rawOtp,
  purpose: OtpPurpose
)=> {
  try {
    // Find latest unused OTP for identifier and purpose
    const otpRecord = await Otp.findOne({
      identifier,
      purpose,
      isUsed,
    }).sort({ createdAt);

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

    // Mark OTP
    otpRecord.isUsed = true;
    await otpRecord.save();

    logger.info(`OTP verified successfully for ${identifier}`);
    return true;
  } catch (error) {
    logger.error('Error verifying OTP, error);
    throw error;
  }
};
