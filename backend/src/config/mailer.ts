import nodemailer, { Transporter } from 'nodemailer';
import { env } from './env';
import { logger } from '../utils/logger';

/**
 * Create nodemailer transporter based on email service
 */
const createTransporter = (): Transporter => {
  if (env.email.service === 'brevo' && env.email.brevo.apiKey) {
    // Brevo SMTP configuration
    return nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: env.email.brevo.fromEmail,
        pass: env.email.brevo.apiKey,
      },
    });
  }

  // Gmail SMTP configuration (fallback)
  return nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.port === 465,
    auth: {
      user: env.email.user,
      pass: env.email.pass,
    },
  });
};

const transporter = createTransporter();

/**
 * Send OTP email
 * @param to - Recipient email address
 * @param otp - OTP code
 * @param purpose - Purpose of OTP (REGISTER, LOGIN, RESET)
 * @returns Promise<void>
 */
export const sendOtpEmail = async (
  to: string,
  otp: string,
  purpose: string
): Promise<void> => {
  try {
    // Skip actual email in test mode
    if (env.otp.emailTestMode) {
      logger.info(`🧪 EMAIL TEST MODE: Skipping email to ${to}. OTP: ${otp}`);
      return;
    }

    const fromEmail = env.email.service === 'brevo' && env.email.brevo.fromEmail
      ? env.email.brevo.fromEmail
      : env.email.from;

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
              <p>This OTP will expire in <strong>${env.otp.expiryMinutes} minutes</strong>.</p>
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

    await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html,
    });

    logger.info(`OTP email sent to ${to} via ${env.email.service}`);
  } catch (error) {
    logger.error('Failed to send OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

export { transporter };
