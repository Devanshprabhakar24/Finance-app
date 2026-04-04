/**
 * A3 — Auth: OTP Verify (Complete)
 */

import request from 'supertest';
import { createApp } from '../../app';
import { User } from '../../modules/users/user.model';
import { Otp, OtpType } from '../../modules/auth/otp.model';
import bcrypt from 'bcrypt';
import { assertSuccessEnvelope, assertErrorEnvelope, extractCsrfToken, assertNoSensitiveFields } from '../helpers';

const app = createApp();

describe('Auth OTP Verification API', () => {
  let csrfToken: string;
  let testCounter = 0;

  beforeEach(async () => {
    testCounter++;
    const res = await request(app).get('/health');
    csrfToken = extractCsrfToken(res);

    // Create unverified user with unique email for each test
    await User.create({
      name: 'Test User',
      email: `test${testCounter}@example.com`,
      phone: `+9112345678${String(testCounter).padStart(2, '0')}`,
      passwordHash: await bcrypt.hash('Password@123', 10),
      isVerified: false,
    });

    // Create valid OTP (hashed, as the service does)
    await Otp.create({
      identifier: `test${testCounter}@example.com`,
      type: OtpType.EMAIL,
      otp: await bcrypt.hash('123456', 10),
      purpose: 'REGISTER',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('should verify valid OTP and return tokens', async () => {
      const identifier = `test${testCounter}@example.com`;
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier,
          otp: '123456',
          purpose: 'REGISTER',
        });

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.headers['set-cookie']).toBeTruthy();

      // Verify no sensitive fields
      assertNoSensitiveFields(response.body.data.user);

      // Verify user is now verified
      const user = await User.findOne({ email: identifier });
      expect(user?.isVerified).toBe(true);

      // Verify OTP is marked as used
      const otp = await Otp.findOne({ identifier });
      expect(otp?.isUsed).toBe(true);
    });

    it('should return 400 for wrong OTP', async () => {
      const identifier = `test${testCounter}@example.com`;
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier,
          otp: '000000',
          purpose: 'REGISTER',
        });

      expect(response.status).toBe(400);
      assertErrorEnvelope(response);
      expect(response.body.message).toContain('Invalid OTP');
    });

    it('should lock account after max attempts', async () => {
      const identifier = `test${testCounter}@example.com`;
      const maxAttempts = 3;

      // Make max attempts with wrong OTP
      for (let i = 0; i < maxAttempts; i++) {
        await request(app)
          .post('/api/auth/verify-otp')
          .set('Cookie', [`csrfToken=${csrfToken}`])
          .set('X-CSRF-Token', csrfToken)
          .send({
            identifier,
            otp: '000000',
            purpose: 'REGISTER',
          });
      }

      // Next attempt should be locked
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier,
          otp: '123456', // Even correct OTP should be rejected
          purpose: 'REGISTER',
        });

      expect(response.status).toBe(429);
      assertErrorEnvelope(response);
      expect(response.body.error.code).toBe('TOO_MANY_ATTEMPTS');
      expect(response.headers['retry-after']).toBeTruthy();
    });

    it('should return 400 for expired OTP', async () => {
      const identifier = `test${testCounter}@example.com`;
      // Update OTP to be expired
      await Otp.updateOne(
        { identifier },
        { expiresAt: new Date(Date.now() - 1000) }
      );

      const response = await request(app)
        .post('/api/auth/verify-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier,
          otp: '123456',
          purpose: 'REGISTER',
        });

      expect(response.status).toBe(400);
      assertErrorEnvelope(response);
      expect(response.body.message).toContain('expired');
    });

    it('should return 400 for already used OTP', async () => {
      const identifier = `test${testCounter}@example.com`;
      // First verification
      await request(app)
        .post('/api/auth/verify-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier,
          otp: '123456',
          purpose: 'REGISTER',
        });

      // Create a new OTP for second attempt (since first one is used)
      await Otp.create({
        identifier,
        type: OtpType.EMAIL,
        otp: await bcrypt.hash('123456', 10),
        purpose: 'REGISTER',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        isUsed: true,
      });

      // Second attempt with used OTP
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier,
          otp: '123456',
          purpose: 'REGISTER',
        });

      expect(response.status).toBe(400);
      assertErrorEnvelope(response);
      expect(response.body.message).toContain('Invalid or expired OTP');
    });

    it('should return 400 for non-existent identifier', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'nonexistent@example.com',
          otp: '123456',
          purpose: 'REGISTER',
        });

      expect(response.status).toBe(400);
      assertErrorEnvelope(response);
    });

    it('should return 422 for OTP length not 6', async () => {
      const identifier = `test${testCounter}@example.com`;
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier,
          otp: '12345',
          purpose: 'REGISTER',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should return 422 for non-numeric OTP', async () => {
      const identifier = `test${testCounter}@example.com`;
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier,
          otp: 'abcdef',
          purpose: 'REGISTER',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should return 422 for invalid purpose', async () => {
      const identifier = `test${testCounter}@example.com`;
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier,
          otp: '123456',
          purpose: 'INVALID',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });
  });
});
