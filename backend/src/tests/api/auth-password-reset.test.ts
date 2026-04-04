/**
 * A15 — Auth: Password Reset Flow (Complete)
 * Tests for forgot password and reset password endpoints
 */

import request from 'supertest';
import { createApp } from '../../app';
import { User } from '../../modules/users/user.model';
import { Otp, OtpType } from '../../modules/auth/otp.model';
import bcrypt from 'bcrypt';
import { assertSuccessEnvelope, assertErrorEnvelope, extractCsrfToken } from '../helpers';

const app = createApp();

describe('Auth Password Reset API', () => {
  let csrfToken: string;

  beforeEach(async () => {
    const res = await request(app).get('/health');
    csrfToken = extractCsrfToken(res);
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+911234567890',
        passwordHash: await bcrypt.hash('OldPassword@123', 10),
        isVerified: true,
      });
    });

    it('should send OTP for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'test@example.com',
        });

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.message).toContain('Password reset OTP');

      const otp = await Otp.findOne({ identifier: 'test@example.com', purpose: 'RESET' });
      expect(otp).toBeTruthy();
    });

    it('should send OTP for valid phone', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: '+911234567890',
        });

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'nonexistent@example.com',
        });

      expect(response.status).toBe(404);
      assertErrorEnvelope(response);
    });

    it('should return 422 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'not-an-email',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+911234567890',
        passwordHash: await bcrypt.hash('OldPassword@123', 10),
        isVerified: true,
      });

      await Otp.create({
        identifier: 'test@example.com',
        type: OtpType.EMAIL,
        otp: await bcrypt.hash('123456', 10),
        purpose: 'RESET',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
    });

    it('should reset password with valid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'test@example.com',
          otp: '123456',
          newPassword: 'NewPassword@123',
        });

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.message).toContain('Password reset successful');

      // Verify password was changed
      const user = await User.findOne({ email: 'test@example.com' }).select('+passwordHash');
      const isNewPassword = await bcrypt.compare('NewPassword@123', user!.passwordHash);
      expect(isNewPassword).toBe(true);

      // Verify old password no longer works
      const isOldPassword = await bcrypt.compare('OldPassword@123', user!.passwordHash);
      expect(isOldPassword).toBe(false);
    });

    it('should return 400 for invalid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'test@example.com',
          otp: '000000',
          newPassword: 'NewPassword@123',
        });

      expect(response.status).toBe(400);
      assertErrorEnvelope(response);
    });

    it('should return 422 for weak new password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'test@example.com',
          otp: '123456',
          newPassword: 'weak',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should clear refresh token after password reset', async () => {
      // First, set a refresh token
      const user = await User.findOne({ email: 'test@example.com' });
      user!.refreshToken = 'some-refresh-token';
      await user!.save();

      // Reset password
      await request(app)
        .post('/api/auth/reset-password')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'test@example.com',
          otp: '123456',
          newPassword: 'NewPassword@123',
        });

      // Verify refresh token was cleared
      const updatedUser = await User.findOne({ email: 'test@example.com' }).select('+refreshToken');
      expect(updatedUser!.refreshToken).toBeUndefined();
    });
  });
});
