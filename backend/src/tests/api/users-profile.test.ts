/**
 * A9 — Users: Own Profile Management
 * Tests for user profile endpoints (all roles)
 */

import request from 'supertest';
import { createApp } from '../../app';
import { User, UserRole, UserStatus } from '../../modules/users/user.model';
import { Otp, OtpType } from '../../modules/auth/otp.model';
import bcrypt from 'bcrypt';
import { assertSuccessEnvelope, assertErrorEnvelope, assertNoSensitiveFields, extractCsrfToken } from '../helpers';

const app = createApp();

describe('Users Profile API', () => {
  let csrfToken: string;
  let userToken: string;
  let userId: string;

  beforeEach(async () => {
    // Get CSRF token
    const res = await request(app).get('/health');
    csrfToken = extractCsrfToken(res);

    // Create test user
    const user = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      phone: '+919876543210',
      passwordHash: await bcrypt.hash('Test@123', 10),
      role: UserRole.VIEWER,
      status: UserStatus.ACTIVE,
      isVerified: true,
    });
    userId = user._id.toString();

    // Create OTP for login
    await Otp.create({
      identifier: 'testuser@example.com',
      type: OtpType.EMAIL,
      otp: await bcrypt.hash('123456', 10),
      purpose: 'LOGIN',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      isUsed: false,
    });

    // Login user
    await request(app)
      .post('/api/auth/login')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({
        identifier: 'testuser@example.com',
        password: 'Test@123',
      });

    const verifyRes = await request(app)
      .post('/api/auth/verify-otp')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({
        identifier: 'testuser@example.com',
        otp: '123456',
        purpose: 'LOGIN',
      });
    userToken = verifyRes.body.data.accessToken;
  });

  describe('GET /api/users/me', () => {
    it('should return current user profile', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data.email).toBe('testuser@example.com');
      expect(response.body.data.name).toBe('Test User');
      expect(response.body.data.role).toBe('VIEWER');
      assertNoSensitiveFields(response.body.data);
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app).get('/api/users/me');

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });

    it('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });
  });

  describe('PATCH /api/users/me', () => {
    it('should allow user to update their name', async () => {
      const response = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should allow user to update their email', async () => {
      const response = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          email: 'newemail@example.com',
        });

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data.email).toBe('newemail@example.com');
    });

    it('should allow user to update their phone', async () => {
      const response = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          phone: '+911234567890',
        });

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data.phone).toBe('+911234567890');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          email: 'invalid-email',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should validate phone format (E.164)', async () => {
      const response = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          phone: '1234567890', // Missing +
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should prevent duplicate email', async () => {
      // Create another user
      await User.create({
        name: 'Other User',
        email: 'other@example.com',
        phone: '+910000000000',
        passwordHash: await bcrypt.hash('Test@123', 10),
        role: UserRole.VIEWER,
        status: UserStatus.ACTIVE,
        isVerified: true,
      });

      const response = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          email: 'other@example.com',
        });

      expect(response.status).toBe(409);
      assertErrorEnvelope(response);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should prevent duplicate phone', async () => {
      // Create another user
      await User.create({
        name: 'Other User',
        email: 'other2@example.com',
        phone: '+910000000001',
        passwordHash: await bcrypt.hash('Test@123', 10),
        role: UserRole.VIEWER,
        status: UserStatus.ACTIVE,
        isVerified: true,
      });

      const response = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          phone: '+910000000001',
        });

      expect(response.status).toBe(409);
      assertErrorEnvelope(response);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app)
        .patch('/api/users/me')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: 'Hacked Name',
        });

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });
  });

  describe('PATCH /api/users/me/change-password', () => {
    it('should allow user to change password', async () => {
      const response = await request(app)
        .patch('/api/users/me/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          currentPassword: 'Test@123',
          newPassword: 'NewTest@123',
        });

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.message).toContain('Password changed');

      // Verify new password works
      const user = await User.findById(userId).select('+passwordHash');
      const isValid = await bcrypt.compare('NewTest@123', user!.passwordHash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect current password', async () => {
      const response = await request(app)
        .patch('/api/users/me/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          currentPassword: 'WrongPassword@123',
          newPassword: 'NewTest@123',
        });

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should validate new password strength', async () => {
      const response = await request(app)
        .patch('/api/users/me/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          currentPassword: 'Test@123',
          newPassword: 'weak',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should require both current and new password', async () => {
      const response = await request(app)
        .patch('/api/users/me/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          currentPassword: 'Test@123',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app)
        .patch('/api/users/me/change-password')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          currentPassword: 'Test@123',
          newPassword: 'NewTest@123',
        });

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });
  });

  describe('POST /api/users/me/avatar', () => {
    it('should reject request without file', async () => {
      const response = await request(app)
        .post('/api/users/me/avatar')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken);

      expect(response.status).toBe(400);
      assertErrorEnvelope(response);
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app)
        .post('/api/users/me/avatar')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken);

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });

    // Note: Full file upload tests would require mocking Cloudinary
    // or using actual file buffers. Skipping detailed upload tests
    // as they require additional setup.
  });
});
