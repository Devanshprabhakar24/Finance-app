/**
 * A7 — Auth: OTP Resend (Complete)
 * Tests for OTP resend functionality
 */

import request from 'supertest';
import { createApp } from '../../app';
import { User } from '../../modules/users/user.model';
import { Otp, OtpType } from '../../modules/auth/otp.model';
import bcrypt from 'bcrypt';
import { assertSuccessEnvelope, assertErrorEnvelope, extractCsrfToken } from '../helpers';

const app = createApp();

describe('Auth OTP Resend API', () => {
  let csrfToken: string;

  beforeEach(async () => {
    const res = await request(app).get('/health');
    csrfToken = extractCsrfToken(res);

    // Create unverified user
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+911234567890',
      passwordHash: await bcrypt.hash('Password@123', 10),
      isVerified: false,
    });
  });

  describe('POST /api/auth/resend-otp', () => {
    it('should resend OTP for valid identifier', async () => {
      const response = await request(app)
        .post('/api/auth/resend-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'test@example.com',
          purpose: 'REGISTER',
        });

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.message).toContain('OTP resent');

      // Verify new OTP was created
      const otp = await Otp.findOne({ 
        identifier: 'test@example.com', 
        purpose: 'REGISTER',
        isUsed: false 
      });
      expect(otp).toBeTruthy();
    });

    it('should invalidate previous OTP when resending', async () => {
      // Create initial OTP
      await Otp.create({
        identifier: 'test@example.com',
        type: OtpType.EMAIL,
        otp: await bcrypt.hash('111111', 10),
        purpose: 'REGISTER',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        isUsed: false,
      });

      // Resend OTP
      await request(app)
        .post('/api/auth/resend-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'test@example.com',
          purpose: 'REGISTER',
        });

      // Verify there's only one unused OTP (old one was invalidated)
      const unusedOtps = await Otp.find({ 
        identifier: 'test@example.com',
        purpose: 'REGISTER',
        isUsed: false 
      });
      expect(unusedOtps.length).toBe(1);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/resend-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'nonexistent@example.com',
          purpose: 'REGISTER',
        });

      expect(response.status).toBe(404);
      assertErrorEnvelope(response);
    });

    it('should return 422 for invalid purpose', async () => {
      const response = await request(app)
        .post('/api/auth/resend-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'test@example.com',
          purpose: 'INVALID',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should work with phone number identifier', async () => {
      const response = await request(app)
        .post('/api/auth/resend-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: '+911234567890',
          purpose: 'REGISTER',
        });

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should work for LOGIN purpose', async () => {
      // Update user to be verified
      await User.updateOne({ email: 'test@example.com' }, { isVerified: true });

      const response = await request(app)
        .post('/api/auth/resend-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'test@example.com',
          purpose: 'LOGIN',
        });

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should work for RESET purpose', async () => {
      const response = await request(app)
        .post('/api/auth/resend-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'test@example.com',
          purpose: 'RESET',
        });

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });
  });
});
