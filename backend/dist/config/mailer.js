import nodemailer, { Transporter } from 'nodemailer';
const { env  } = require('./env');
const { logger  } = require('../utils/logger');

/**
 * Create nodemailer transporter based on email service
 */
const createTransporter = ()=> {
  if (env.email.service === 'brevo' && env.email.brevo.apiKey) {
    // Brevo SMTP configuration
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  // Gmail SMTP configuration (fallback)
  return nodemailer.createTransport({
    host,
    port,
    secure: env.email.port === 465,
    auth: {
      user,
      pass,
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
const sendOtpEmail = async (
  to,
  otp,
  purpose: string
)=> {
  try {
    // Skip actual email in test mode
    if (env.otp.emailTestMode) {
      logger.info(`🧪 EMAIL TEST MODE: Skipping email to ${to}. OTP: ${otp}`);
      return;
    }

    const fromEmail = env.email.service === 'brevo' && env.email.brevo.fromEmail
      ? env.email.brevo.fromEmail
      : env.email.from;

    logger.info(`📧 Sending OTP email to ${to} via ${env.email.service} from ${fromEmail}`);

    const subject = `Your Finance Dashboard OTP - ${purpose}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background, #667eea 0%, #764ba2 100%); 
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

    const result = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    logger.info(`✅ OTP email sent successfully to ${to} via ${env.email.service}. MessageId: ${result.messageId}`);
  } catch (error) {
    logger.error('❌ Failed to send OTP email, error);
    throw new Error('Failed to send OTP email');
  }
};

module.exports = { transporter  };
