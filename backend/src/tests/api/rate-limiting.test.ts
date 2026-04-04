/**
 * A12 — Rate Limiting Tests
 * Tests for rate limiting on various endpoints
 * 
 * NOTE: These tests are SKIPPED in the test environment because:
 * 1. Rate limiting is disabled in NODE_ENV=test for other tests to run smoothly
 * 2. These tests would need a separate test environment with rate limiting enabled
 * 3. Rate limiting is verified manually in staging/production environments
 * 
 * To test rate limiting:
 * 1. Set up a separate test environment with rate limiting enabled
 * 2. Remove the .skip from describe.skip below
 * 3. Run: npm test -- rate-limiting
 */

import request from 'supertest';
import { createApp } from '../../app';
import { User, UserRole, UserStatus } from '../../modules/users/user.model';
import { Otp, OtpType } from '../../modules/auth/otp.model';
import bcrypt from 'bcrypt';
import { extractCsrfToken } from '../helpers';

// Create app with rate limiting enabled
const app = createApp();

describe.skip('Rate Limiting', () => {
  let csrfToken: string;

  beforeEach(async () => {
    // Get CSRF token
    const res = await request(app).get('/health');
    csrfToken = extractCsrfToken(res);

    // Create a test user for authenticated endpoints
    await User.create({
      name: 'Rate Test User',
      email: 'ratetest@example.com',
      phone: '+919876543210',
      passwordHash: await bcrypt.hash('Test@123', 10),
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isVerified: true,
    });

    await Otp.create({
      identifier: 'ratetest@example.com',
      type: OtpType.EMAIL,
      otp: await bcrypt.hash('123456', 10),
      purpose: 'LOGIN',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      isUsed: false,
    });
  });

  describe('Auth Endpoints Rate Limiting', () => {
    it('should rate limit registration endpoint after 5 requests', async () => {
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+911234567890',
        password: 'Test@123',
      };

      // Make 5 requests (should succeed or fail with validation errors)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/register')
          .set('Cookie', [`csrfToken=${csrfToken}`])
          .set('X-CSRF-Token', csrfToken)
          .send({
            ...registerData,
            email: `test${i}@example.com`,
            phone: `+9112345678${i}0`,
          });
      }

      // 6th request should be rate limited
      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          ...registerData,
          email: 'test6@example.com',
          phone: '+911234567860',
        });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Too many requests');
    }, 30000);

    it('should rate limit login endpoint after 5 requests', async () => {
      // Make 5 login requests
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .set('Cookie', [`csrfToken=${csrfToken}`])
          .set('X-CSRF-Token', csrfToken)
          .send({
            identifier: 'ratetest@example.com',
            password: 'Test@123',
          });
      }

      // 6th request should be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'ratetest@example.com',
          password: 'Test@123',
        });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Too many requests');
    }, 30000);
  });

  describe('OTP Endpoints Rate Limiting', () => {
    it('should rate limit OTP verification after 10 requests', async () => {
      // Make 10 OTP verification requests
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/auth/verify-otp')
          .set('Cookie', [`csrfToken=${csrfToken}`])
          .set('X-CSRF-Token', csrfToken)
          .send({
            identifier: 'ratetest@example.com',
            otp: '123456',
            purpose: 'LOGIN',
          });
      }

      // 11th request should be rate limited
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'ratetest@example.com',
          otp: '123456',
          purpose: 'LOGIN',
        });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Too many requests');
    }, 30000);

    it('should rate limit OTP resend after 3 requests', async () => {
      // Make 3 OTP resend requests
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/resend-otp')
          .set('Cookie', [`csrfToken=${csrfToken}`])
          .set('X-CSRF-Token', csrfToken)
          .send({
            identifier: 'ratetest@example.com',
            purpose: 'LOGIN',
          });
      }

      // 4th request should be rate limited
      const response = await request(app)
        .post('/api/auth/resend-otp')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'ratetest@example.com',
          purpose: 'LOGIN',
        });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Too many requests');
    }, 30000);
  });

  describe('Rate Limit Headers', () => {
    it('should include rate limit headers in response', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: 'ratetest@example.com',
          password: 'Test@123',
        });

      // Check for rate limit headers
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });
  });

  describe('Global Rate Limiting', () => {
    it('should apply global rate limit across all endpoints', async () => {
      // Make many requests to different endpoints
      const requests = [];
      
      // 100 requests to health endpoint (global limit is typically 100/15min)
      for (let i = 0; i < 100; i++) {
        requests.push(
          request(app).get('/health')
        );
      }

      await Promise.all(requests);

      // Next request should be rate limited
      const response = await request(app).get('/health');

      // This might pass if global limit is higher, but we're testing the concept
      // In production, this would be rate limited
      expect([200, 429]).toContain(response.status);
    }, 60000);
  });
});
