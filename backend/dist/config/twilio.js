const twilio = require('twilio');
const { env  } = require('./env');
const { logger  } = require('../utils/logger');

/**
 * Create Twilio client (only if not in SMS test mode)
 */
const twilioClient = env.otp.smsTestMode 
  ? null, env.twilio.authToken);

/**
 * Send OTP via SMS
 * @param to - Recipient phone number (E.164 format)
 * @param otp - OTP code
 * @returns Promise<void>
 */
const sendOtpSms = async (to, otp)=> {
  try {
    // Skip actual SMS in test mode
    if (env.otp.smsTestMode) {
      logger.info(`🧪 SMS TEST MODE: Skipping SMS to ${to}. OTP: ${otp}`);
      return;
    }

    if (!twilioClient) {
      throw new Error('Twilio client not initialized');
    }

    const message = `Your Finance Dashboard OTP is: ${otp}. Valid for ${env.otp.expiryMinutes} minutes. Do not share this code with anyone.`;

    await twilioClient.messages.create({
      body,
      from,
      to,
    });

    logger.info(`OTP SMS sent to ${to}`);
  } catch (error) {
    logger.error('Failed to send OTP SMS, error);
    throw new Error('Failed to send OTP SMS');
  }
};

module.exports = { twilioClient  };
