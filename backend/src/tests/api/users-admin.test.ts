/**
 * A8 — Users: Admin CRUD Operations
 * Tests for admin user management endpoints
 */

import request from 'supertest';
import { createApp } from '../../app';
import { User, UserRole, UserStatus } from '../../modules/users/user.model';
import { Otp, OtpType } from '../../modules/auth/otp.model';
import bcrypt from 'bcrypt';
import { assertSuccessEnvelope, assertErrorEnvelope, assertNoSensitiveFields, assertPaginationMeta, extractCsrfToken } from '../helpers';

const app = createApp();

describe('Users Admin CRUD API', () => {
  let csrfToken: string;
  let adminToken: string;
  let analystToken: string;
  let viewerToken: string;

  beforeEach(async () => {
    // Get CSRF token
    const res = await request(app).get('/health');
    csrfToken = extractCsrfToken(res);

    // Create admin user
    await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      phone: '+911111111111',
      passwordHash: await bcrypt.hash('Admin@123', 10),
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isVerified: true,
    });

    // Create OTP for admin login
    await Otp.create({
      identifier: 'admin@test.com',
      type: OtpType.EMAIL,
      otp: await bcrypt.hash('123456', 10),
      purpose: 'LOGIN',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      isUsed: false,
    });

    // Login admin with password
    await request(app)
      .post('/api/auth/login')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({
        identifier: 'admin@test.com',
        password: 'Admin@123',
      });

    // Verify OTP to get token
    const adminVerify = await request(app)
      .post('/api/auth/verify-otp')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({
        identifier: 'admin@test.com',
        otp: '123456',
        purpose: 'LOGIN',
      });
    adminToken = adminVerify.body.data.accessToken;

    // Create analyst user
    await User.create({
      name: 'Analyst User',
      email: 'analyst@test.com',
      phone: '+912222222222',
      passwordHash: await bcrypt.hash('Analyst@123', 10),
      role: UserRole.ANALYST,
      status: UserStatus.ACTIVE,
      isVerified: true,
    });

    // Create OTP for analyst login
    await Otp.create({
      identifier: 'analyst@test.com',
      type: OtpType.EMAIL,
      otp: await bcrypt.hash('123456', 10),
      purpose: 'LOGIN',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      isUsed: false,
    });

    // Login analyst
    await request(app)
      .post('/api/auth/login')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({
        identifier: 'analyst@test.com',
        password: 'Analyst@123',
      });

    const analystVerify = await request(app)
      .post('/api/auth/verify-otp')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({
        identifier: 'analyst@test.com',
        otp: '123456',
        purpose: 'LOGIN',
      });
    analystToken = analystVerify.body.data.accessToken;

    // Create viewer user
    await User.create({
      name: 'Viewer User',
      email: 'viewer@test.com',
      phone: '+913333333333',
      passwordHash: await bcrypt.hash('Viewer@123', 10),
      role: UserRole.VIEWER,
      status: UserStatus.ACTIVE,
      isVerified: true,
    });

    // Create OTP for viewer login
    await Otp.create({
      identifier: 'viewer@test.com',
      type: OtpType.EMAIL,
      otp: await bcrypt.hash('123456', 10),
      purpose: 'LOGIN',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      isUsed: false,
    });

    // Login viewer
    await request(app)
      .post('/api/auth/login')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({
        identifier: 'viewer@test.com',
        password: 'Viewer@123',
      });

    const viewerVerify = await request(app)
      .post('/api/auth/verify-otp')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({
        identifier: 'viewer@test.com',
        otp: '123456',
        purpose: 'LOGIN',
      });
    viewerToken = viewerVerify.body.data.accessToken;
  });

  describe('GET /api/users', () => {
    it('should allow admin to list all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      
      // Check pagination meta exists
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.totalCount).toBeGreaterThanOrEqual(3);
      
      // Check no sensitive fields
      response.body.data.forEach((user: any) => {
        assertNoSensitiveFields(user);
      });
    });

    it('should deny analyst from listing users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should deny viewer from listing users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      assertPaginationMeta(response.body.meta, 1, 2);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(2);
    });

    it('should support search by name', async () => {
      const response = await request(app)
        .get('/api/users?search=Admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].name).toContain('Admin');
    });

    it('should support filter by role', async () => {
      const response = await request(app)
        .get('/api/users?role=ADMIN')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      response.body.data.forEach((user: any) => {
        expect(user.role).toBe('ADMIN');
      });
    });

    it('should support filter by status', async () => {
      const response = await request(app)
        .get('/api/users?status=ACTIVE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      response.body.data.forEach((user: any) => {
        expect(user.status).toBe('ACTIVE');
      });
    });
  });

  describe('GET /api/users/:id', () => {
    it('should allow admin to get user by ID', async () => {
      const user = await User.findOne({ email: 'analyst@test.com' });
      
      const response = await request(app)
        .get(`/api/users/${user!._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data.email).toBe('analyst@test.com');
      assertNoSensitiveFields(response.body.data);
    });

    it('should deny analyst from getting user by ID', async () => {
      const user = await User.findOne({ email: 'viewer@test.com' });
      
      const response = await request(app)
        .get(`/api/users/${user!._id}`)
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      assertErrorEnvelope(response);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid user ID format', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      assertErrorEnvelope(response);
    });
  });

  describe('POST /api/users', () => {
    it('should allow admin to create new user', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: 'New User',
          email: 'newuser@test.com',
          phone: '+914444444444',
          password: 'NewUser@123',
          role: 'ANALYST',
        });

      expect(response.status).toBe(201);
      assertSuccessEnvelope(response);
      expect(response.body.data.email).toBe('newuser@test.com');
      expect(response.body.data.role).toBe('ANALYST');
      expect(response.body.data.isVerified).toBe(true); // Admin-created users are pre-verified
      assertNoSensitiveFields(response.body.data);
    });

    it('should deny analyst from creating user', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${analystToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: 'New User',
          email: 'newuser2@test.com',
          phone: '+915555555555',
          password: 'NewUser@123',
          role: 'VIEWER',
        });

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: 'Incomplete User',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: 'Invalid Email User',
          email: 'not-an-email',
          phone: '+916666666666',
          password: 'Test@123',
          role: 'VIEWER',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should validate phone format (E.164)', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: 'Invalid Phone User',
          email: 'invalidphone@test.com',
          phone: '1234567890', // Missing +
          password: 'Test@123',
          role: 'VIEWER',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should prevent duplicate email', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: 'Duplicate Email',
          email: 'admin@test.com', // Already exists
          phone: '+917777777777',
          password: 'Test@123',
          role: 'VIEWER',
        });

      expect(response.status).toBe(409);
      assertErrorEnvelope(response);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('PATCH /api/users/:id/role', () => {
    it('should allow admin to update user role', async () => {
      const user = await User.findOne({ email: 'viewer@test.com' });
      
      const response = await request(app)
        .patch(`/api/users/${user!._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          role: 'ANALYST',
        });

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data.role).toBe('ANALYST');
    });

    it('should deny analyst from updating user role', async () => {
      const user = await User.findOne({ email: 'viewer@test.com' });
      
      const response = await request(app)
        .patch(`/api/users/${user!._id}/role`)
        .set('Authorization', `Bearer ${analystToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          role: 'ADMIN',
        });

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .patch('/api/users/507f1f77bcf86cd799439011/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          role: 'ANALYST',
        });

      expect(response.status).toBe(404);
      assertErrorEnvelope(response);
    });

    it('should prevent admin from changing own role', async () => {
      const admin = await User.findOne({ email: 'admin@test.com' });
      
      const response = await request(app)
        .patch(`/api/users/${admin!._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          role: 'VIEWER',
        });

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('PATCH /api/users/:id/status', () => {
    it('should allow admin to update user status', async () => {
      const user = await User.findOne({ email: 'viewer@test.com' });
      
      const response = await request(app)
        .patch(`/api/users/${user!._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          status: 'INACTIVE',
        });

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data.status).toBe('INACTIVE');
    });

    it('should deny analyst from updating user status', async () => {
      const user = await User.findOne({ email: 'viewer@test.com' });
      
      const response = await request(app)
        .patch(`/api/users/${user!._id}/status`)
        .set('Authorization', `Bearer ${analystToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          status: 'INACTIVE',
        });

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .patch('/api/users/507f1f77bcf86cd799439011/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          status: 'INACTIVE',
        });

      expect(response.status).toBe(404);
      assertErrorEnvelope(response);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should allow admin to soft-delete user (set status to INACTIVE)', async () => {
      const user = await User.findOne({ email: 'viewer@test.com' });
      
      const response = await request(app)
        .delete(`/api/users/${user!._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.message).toContain('deleted');

      // Verify user is soft-deleted (status set to INACTIVE, not removed from DB)
      const deletedUser = await User.findById(user!._id);
      expect(deletedUser).not.toBeNull();
      expect(deletedUser!.status).toBe('INACTIVE');
    });

    it('should deny analyst from deleting user', async () => {
      const user = await User.findOne({ email: 'viewer@test.com' });
      
      const response = await request(app)
        .delete(`/api/users/${user!._id}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken);

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken);

      expect(response.status).toBe(404);
      assertErrorEnvelope(response);
    });

    it('should prevent admin from deleting themselves', async () => {
      const admin = await User.findOne({ email: 'admin@test.com' });
      
      const response = await request(app)
        .delete(`/api/users/${admin!._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken);

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
});
