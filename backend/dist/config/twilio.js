"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twilioClient = exports.sendOtpSms = void 0;
const twilio_1 = __importDefault(require("twilio"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
/**
 * Create Twilio client (only if not in SMS test mode)
 */
const twilioClient = env_1.env.otp.smsTestMode
    ? null
    : (0, twilio_1.default)(env_1.env.twilio.accountSid, env_1.env.twilio.authToken);
exports.twilioClient = twilioClient;
/**
 * Send OTP via SMS
 * @param to - Recipient phone number (E.164 format)
 * @param otp - OTP code
 * @returns Promise<void>
 */
const sendOtpSms = async (to, otp) => {
    try {
        // Skip actual SMS in test mode
        if (env_1.env.otp.smsTestMode) {
            logger_1.logger.info(`🧪 SMS TEST MODE: Skipping SMS to ${to}. OTP: ${otp}`);
            return;
        }
        if (!twilioClient) {
            throw new Error('Twilio client not initialized');
        }
        const message = `Your Finance Dashboard OTP is: ${otp}. Valid for ${env_1.env.otp.expiryMinutes} minutes. Do not share this code with anyone.`;
        await twilioClient.messages.create({
            body: message,
            from: env_1.env.twilio.phoneNumber,
            to,
        });
        logger_1.logger.info(`OTP SMS sent to ${to}`);
    }
    catch (error) {
        logger_1.logger.error('Failed to send OTP SMS:', error);
        throw new Error('Failed to send OTP SMS');
    }
};
exports.sendOtpSms = sendOtpSms;
