"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transporter = exports.sendOtpEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
/**
 * Create nodemailer transporter based on email service
 */
const createTransporter = () => {
    if (env_1.env.email.service === 'brevo' && env_1.env.email.brevo.apiKey) {
        // Brevo SMTP configuration
        return nodemailer_1.default.createTransport({
            host: 'smtp-relay.brevo.com',
            port: 587,
            secure: false,
            auth: {
                user: env_1.env.email.brevo.fromEmail,
                pass: env_1.env.email.brevo.apiKey,
            },
        });
    }
    // Gmail SMTP configuration (fallback)
    return nodemailer_1.default.createTransport({
        host: env_1.env.email.host,
        port: env_1.env.email.port,
        secure: env_1.env.email.port === 465,
        auth: {
            user: env_1.env.email.user,
            pass: env_1.env.email.pass,
        },
    });
};
const transporter = createTransporter();
exports.transporter = transporter;
/**
 * Send OTP email
 * @param to - Recipient email address
 * @param otp - OTP code
 * @param purpose - Purpose of OTP (REGISTER, LOGIN, RESET)
 * @returns Promise<void>
 */
const sendOtpEmail = async (to, otp, purpose) => {
    try {
        // Skip actual email in test mode
        if (env_1.env.otp.emailTestMode) {
            logger_1.logger.info(`🧪 EMAIL TEST MODE: Skipping email to ${to}. OTP: ${otp}`);
            return;
        }
        const fromEmail = env_1.env.email.service === 'brevo' && env_1.env.email.brevo.fromEmail
            ? env_1.env.email.brevo.fromEmail
            : env_1.env.email.from;
        logger_1.logger.info(`📧 Sending OTP email to ${to} via ${env_1.env.email.service} from ${fromEmail}`);
        const subject = `Your Finance Dashboard OTP - ${purpose}`;
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; 
                       text-align: center; font-size: 32px; font-weight: bold; 
                       letter-spacing: 8px; margin: 20px 0; border-radius: 8px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; 
                       padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Finance Dashboard</h1>
            </div>
            <div class="content">
              <h2>Your OTP Code</h2>
              <p>You requested an OTP for <strong>${purpose}</strong>.</p>
              <div class="otp-box">${otp}</div>
              <p>This OTP will expire in <strong>${env_1.env.otp.expiryMinutes} minutes</strong>.</p>
              <div class="warning">
                <strong>⚠️ Security Warning:</strong><br>
                Never share this OTP with anyone. Our team will never ask for your OTP.
              </div>
              <p>If you didn't request this OTP, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Finance Dashboard. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        const result = await transporter.sendMail({
            from: fromEmail,
            to,
            subject,
            html,
        });
        logger_1.logger.info(`✅ OTP email sent successfully to ${to} via ${env_1.env.email.service}. MessageId: ${result.messageId}`);
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to send OTP email:', error);
        throw new Error('Failed to send OTP email');
    }
};
exports.sendOtpEmail = sendOtpEmail;
