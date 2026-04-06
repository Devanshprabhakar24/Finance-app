"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtp = exports.generateAndSendOtp = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const otp_model_1 = require("./otp.model");
const generateOtp_1 = require("../../utils/generateOtp");
const mailer_1 = require("../../config/mailer");
const twilio_1 = require("../../config/twilio");
const env_1 = require("../../config/env");
const logger_1 = require("../../utils/logger");
const errorHandler_1 = require("../../middleware/errorHandler");
/**
 * Determine if identifier is email or phone
 */
const getIdentifierType = (identifier) => {
    return identifier.includes('@') ? otp_model_1.OtpType.EMAIL : otp_model_1.OtpType.SMS;
};
/**
 * Generate and send OTP to user
 * @param identifier - Email or phone number
 * @param purpose - Purpose of OTP
 * @returns Promise<void>
 */
const generateAndSendOtp = async (identifier, purpose) => {
    try {
        // Invalidate previous OTPs for same identifier and purpose
        await otp_model_1.Otp.updateMany({ identifier, purpose, isUsed: false }, { isUsed: true });
        // Generate new OTP
        const type = getIdentifierType(identifier);
        const isEmailTestMode = type === otp_model_1.OtpType.EMAIL && env_1.env.otp.emailTestMode;
        const isSmsTestMode = type === otp_model_1.OtpType.SMS && env_1.env.otp.smsTestMode;
        const rawOtp = (isEmailTestMode || isSmsTestMode) ? env_1.env.otp.testCode : (0, generateOtp_1.generateOtp)();
        const hashedOtp = await bcrypt_1.default.hash(rawOtp, 10);
        // Calculate expiry time
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + env_1.env.otp.expiryMinutes);
        // Store OTP in database
        await otp_model_1.Otp.create({
            identifier,
            type,
            otp: hashedOtp,
            purpose,
            expiresAt,
            attempts: 0,
            isUsed: false,
        });
        // Send OTP via appropriate channel
        if (type === otp_model_1.OtpType.EMAIL) {
            await (0, mailer_1.sendOtpEmail)(identifier, rawOtp, purpose);
            if (isEmailTestMode) {
                logger_1.logger.info(`🧪 EMAIL TEST MODE: OTP for ${identifier} is: ${rawOtp}`);
            }
        }
        else {
            await (0, twilio_1.sendOtpSms)(identifier, rawOtp);
            if (isSmsTestMode) {
                logger_1.logger.info(`🧪 SMS TEST MODE: OTP for ${identifier} is: ${rawOtp}`);
            }
        }
        logger_1.logger.info(`OTP generated and sent to ${identifier} for ${purpose} (Email Test: ${isEmailTestMode}, SMS Test: ${isSmsTestMode})`);
    }
    catch (error) {
        logger_1.logger.error('Error generating and sending OTP:', error);
        throw error;
    }
};
exports.generateAndSendOtp = generateAndSendOtp;
/**
 * Verify OTP
 * @param identifier - Email or phone number
 * @param rawOtp - Plain OTP entered by user
 * @param purpose - Purpose of OTP
 * @returns Promise<boolean>
 */
const verifyOtp = async (identifier, rawOtp, purpose) => {
    try {
        // Find latest unused OTP for identifier and purpose
        const otpRecord = await otp_model_1.Otp.findOne({
            identifier,
            purpose,
            isUsed: false,
        }).sort({ createdAt: -1 });
        if (!otpRecord) {
            throw new errorHandler_1.ValidationError('Invalid or expired OTP');
        }
        // Check if OTP has expired
        if (new Date() > otpRecord.expiresAt) {
            throw new errorHandler_1.ValidationError('OTP has expired');
        }
        // Verify OTP
        const isValid = await bcrypt_1.default.compare(rawOtp, otpRecord.otp);
        if (!isValid) {
            // Just increment attempts but don't lock
            otpRecord.attempts += 1;
            await otpRecord.save();
            throw new errorHandler_1.ValidationError('Invalid OTP. Please try again.');
        }
        // Mark OTP as used
        otpRecord.isUsed = true;
        await otpRecord.save();
        logger_1.logger.info(`OTP verified successfully for ${identifier}`);
        return true;
    }
    catch (error) {
        logger_1.logger.error('Error verifying OTP:', error);
        throw error;
    }
};
exports.verifyOtp = verifyOtp;
