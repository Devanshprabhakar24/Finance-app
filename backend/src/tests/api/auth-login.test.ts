/**
 * A4 — Auth: Login + OTP (Complete)
 * A5 — Auth: Refresh Token
 * A6 — Auth: Logout
 */

import request from 'supertest';
import { createApp } from '../../app';
import { User } from '../../modules/users/user.model';
import { Otp, OtpType } from '../../modules/auth/otp.model';
import bcrypt from 'bcrypt';
import { assertSuccessEnvelope, assertErrorEnvelope, extractCsrfToken } from '../helpers';

const app = createApp();

describe('Auth Login & Token Management API', () => {
  let csrfToken: string;

  beforeEach(async () => {
    const res = await request(app).get('/health');
    csrfToken = extractCsrfToken(res);
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+911234567890',
        passwordHash: await bcrypt.hash('Password@123', 10),
        isVerified: true,
        status: 'ACTIVE',
      });
    });

    it('should send OTP for valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'test@example.com',
          password: 'Password@123',
        });

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.message).toContain('OTP sent');

      const otp = await Otp.findOne({ identifier: 'test@example.com' });
      expect(otp).toBeTruthy();
      expect(otp?.purpose).toBe('LOGIN');
    });

    it('should return 401 for wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'test@example.com',
          password: 'WrongPassword@123',
        });

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 400 for unverified user', async () => {
      await User.create({
        name: 'Unverified User',
        email: 'unverified@example.com',
        phone: '+919999999999',
        passwordHash: await bcrypt.hash('Password@123', 10),
        isVerified: false,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'unverified@example.com',
          password: 'Password@123',
        });

      expect(response.status).toBe(400);
      assertErrorEnvelope(response);
      expect(response.body.message).toContain('not verified');
    });

    it('should return 401 for inactive account', async () => {
      await User.create({
        name: 'Inactive User',
        email: 'inactive@example.com',
        phone: '+918888888888',
        passwordHash: await bcrypt.hash('Password@123', 10),
        isVerified: true,
        status: 'INACTIVE',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'inactive@example.com',
          password: 'Password@123',
        });

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
      expect(response.body.message).toContain('Account is inactive');
    });

    it('should return 401 for non-existent user (no enumeration)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'nonexistent@example.com',
          password: 'Password@123',
        });

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
      expect(response.body.message).toContain('Invalid credentials');
      expect(response.body.message).not.toContain('not found');
      expect(response.body.message).not.toContain('does not exist');
    });

    it('should accept phone number as identifier', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: '+911234567890',
          password: 'Password@123',
        });

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let refreshToken: string;
    let accessToken: string;

    beforeEach(async () => {
      // Create and login user to get refresh token
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+911234567890',
        passwordHash: await bcrypt.hash('Password@123', 10),
        isVerified: true,
      });

      await Otp.create({
        identifier: 'test@example.com',
        type: OtpType.EMAIL,
        otp: await bcrypt.hash('123456', 10),
        purpose: 'LOGIN',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      await request(app)
        .post('/api/auth/login')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'test@example.com',
          password: 'Password@123',
        });

      const verifyRes = await request(app)
        .post('/api/auth/verify-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'test@example.com',
          otp: '123456',
          purpose: 'LOGIN',
        });

      accessToken = verifyRes.body.data.accessToken;
      const cookies = verifyRes.headers['set-cookie'];
      if (cookies && Array.isArray(cookies)) {
        const refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
        if (refreshCookie) {
          refreshToken = refreshCookie.split(';')[0].split('=')[1];
        }
      }
    });

    it('should return new access token for valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', [`refreshToken=${refreshToken}`, `csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send();

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', [`refreshToken=garbage`, `csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send();

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });

    it('should return 401 for token after logout', async () => {
      // Logout first
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', [`refreshToken=${refreshToken}`, `csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send();

      // Try to use refresh token
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', [`refreshToken=${refreshToken}`, `csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send();

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });

    it('should return 401 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send();

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Create and login user
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+911234567890',
        passwordHash: await bcrypt.hash('Password@123', 10),
        isVerified: true,
      });

      await Otp.create({
        identifier: 'test@example.com',
        type: OtpType.EMAIL,
        otp: await bcrypt.hash('123456', 10),
        purpose: 'LOGIN',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      await request(app)
        .post('/api/auth/login')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'test@example.com',
          password: 'Password@123',
        });

      const verifyRes = await request(app)
        .post('/api/auth/verify-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'test@example.com',
          otp: '123456',
          purpose: 'LOGIN',
        });

      accessToken = verifyRes.body.data.accessToken;
      const cookies = verifyRes.headers['set-cookie'];
      if (cookies && Array.isArray(cookies)) {
        const refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
        if (refreshCookie) {
          refreshToken = refreshCookie.split(';')[0].split('=')[1];
        }
      }
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send();

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send();

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });

    it('should invalidate refresh token after logout', async () => {
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', [`refreshToken=${refreshToken}`, `csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send();

      // Try to use refresh token
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', [`refreshToken=${refreshToken}`, `csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send();

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });
  });
});
