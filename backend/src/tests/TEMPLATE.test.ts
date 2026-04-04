/**
 * Test Template
 * Copy this file and modify for your feature
 * 
 * Usage:
 * 1. Copy this file to appropriate location (e.g., src/tests/api/my-feature.test.ts)
 * 2. Replace "Feature Name" with your feature name
 * 3. Update imports as needed
 * 4. Write your tests following the patterns below
 * 5. Run: npm test -- my-feature
 */

import request from 'supertest';
import { createApp } from '../../app';
import { User, UserRole, UserStatus } from '../../modules/users/user.model';
import { Otp, OtpType } from '../../modules/auth/otp.model';
import bcrypt from 'bcrypt';
import {
  extractCsrfToken,
  assertSuccessEnvelope,
  assertErrorEnvelope,
  assertPaginationMeta,
} from '../helpers';
import {
  createTestUser,
  createTestOTP,
  generateUniqueEmail,
  generateUniquePhone,
} from '../test-utils';

const app = createApp();

describe('Feature Name', () => {
  let csrfToken: string;
  let adminToken: string;
  let analystToken: string;
  let viewerToken: string;
  let adminId: string;

  beforeEach(async () => {
    // Get CSRF token
    const res = await request(app).get('/health');
    csrfToken = extractCsrfToken(res);

    // Create admin user
    const { user: admin, email: adminEmail, password: adminPassword } = await createTestUser(
      UserRole.ADMIN
    );
    adminId = admin._id.toString();

    // Create OTP for admin
    await createTestOTP(adminEmail, 'LOGIN');

    // Login as admin
    await request(app)
      .post('/api/auth/login')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({ identifier: adminEmail, password: adminPassword });

    const adminVerify = await request(app)
      .post('/api/auth/verify-otp')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({ identifier: adminEmail, otp: '123456', purpose: 'LOGIN' });
    adminToken = adminVerify.body.data.accessToken;

    // Create analyst user
    const { user: analyst, email: analystEmail, password: analystPassword } = await createTestUser(
      UserRole.ANALYST
    );

    await createTestOTP(analystEmail, 'LOGIN');

    await request(app)
      .post('/api/auth/login')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({ identifier: analystEmail, password: analystPassword });

    const analystVerify = await request(app)
      .post('/api/auth/verify-otp')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({ identifier: analystEmail, otp: '123456', purpose: 'LOGIN' });
    analystToken = analystVerify.body.data.accessToken;

    // Create viewer user
    const { user: viewer, email: viewerEmail, password: viewerPassword } = await createTestUser(
      UserRole.VIEWER
    );

    await createTestOTP(viewerEmail, 'LOGIN');

    await request(app)
      .post('/api/auth/login')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({ identifier: viewerEmail, password: viewerPassword });

    const viewerVerify = await request(app)
      .post('/api/auth/verify-otp')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({ identifier: viewerEmail, otp: '123456', purpose: 'LOGIN' });
    viewerToken = viewerVerify.body.data.accessToken;
  });

  // ============================================================================
  // GET Endpoint Tests
  // ============================================================================

  describe('GET /api/endpoint', () => {
    it('should return success for admin', async () => {
      const response = await request(app)
        .get('/api/endpoint')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data).toBeDefined();
    });

    it('should return success for analyst', async () => {
      const response = await request(app)
        .get('/api/endpoint')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should deny viewer access', async () => {
      const response = await request(app)
        .get('/api/endpoint')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app).get('/api/endpoint');

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/endpoint?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      assertPaginationMeta(response.body.meta);
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/endpoint?search=test')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should support filtering', async () => {
      const response = await request(app)
        .get('/api/endpoint?filter=value')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get('/api/endpoint?sortBy=createdAt&sortOrder=desc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });
  });

  // ============================================================================
  // POST Endpoint Tests
  // ============================================================================

  describe('POST /api/endpoint', () => {
    it('should create resource with valid data', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field1: 'value1',
          field2: 'value2',
        });

      expect(response.status).toBe(201);
      assertSuccessEnvelope(response);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.field1).toBe('value1');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should validate field formats', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field1: 'invalid-format',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should prevent duplicate entries', async () => {
      const data = {
        field1: 'unique-value',
        field2: 'value2',
      };

      // First request should succeed
      await request(app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      // Second request should fail
      const response = await request(app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect(response.status).toBe(409);
      assertErrorEnvelope(response);
    });

    it('should deny analyst from creating', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          field1: 'value1',
        });

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .send({
          field1: 'value1',
        });

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });
  });

  // ============================================================================
  // PATCH Endpoint Tests
  // ============================================================================

  describe('PATCH /api/endpoint/:id', () => {
    let resourceId: string;

    beforeEach(async () => {
      // Create a resource to update
      const createResponse = await request(app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field1: 'value1',
        });
      resourceId = createResponse.body.data.id;
    });

    it('should update resource with valid data', async () => {
      const response = await request(app)
        .patch(`/api/endpoint/${resourceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field1: 'updated-value',
        });

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data.field1).toBe('updated-value');
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .patch(`/api/endpoint/${resourceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field1: 'invalid-format',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .patch('/api/endpoint/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field1: 'value',
        });

      expect(response.status).toBe(404);
      assertErrorEnvelope(response);
    });

    it('should deny analyst from updating', async () => {
      const response = await request(app)
        .patch(`/api/endpoint/${resourceId}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          field1: 'value',
        });

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });
  });

  // ============================================================================
  // DELETE Endpoint Tests
  // ============================================================================

  describe('DELETE /api/endpoint/:id', () => {
    let resourceId: string;

    beforeEach(async () => {
      // Create a resource to delete
      const createResponse = await request(app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field1: 'value1',
        });
      resourceId = createResponse.body.data.id;
    });

    it('should delete resource', async () => {
      const response = await request(app)
        .delete(`/api/endpoint/${resourceId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .delete('/api/endpoint/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      assertErrorEnvelope(response);
    });

    it('should deny analyst from deleting', async () => {
      const response = await request(app)
        .delete(`/api/endpoint/${resourceId}`)
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should soft-delete (not hard delete)', async () => {
      await request(app)
        .delete(`/api/endpoint/${resourceId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Resource should still exist in database but marked as deleted
      // Add your verification logic here
    });
  });

  // ============================================================================
  // Edge Cases and Error Scenarios
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle invalid ID format', async () => {
      const response = await request(app)
        .get('/api/endpoint/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      assertErrorEnvelope(response);
    });

    it('should handle malformed request body', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid-json');

      expect(response.status).toBe(400);
    });

    it('should handle XSS attempts', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field1: '<script>alert("XSS")</script>',
        });

      // Should either reject or sanitize
      expect([400, 422]).toContain(response.status);
    });

    it('should handle SQL injection attempts', async () => {
      const response = await request(app)
        .get("/api/endpoint?search='; DROP TABLE users; --")
        .set('Authorization', `Bearer ${adminToken}`);

      // Should handle safely
      expect([200, 400, 422]).toContain(response.status);
    });
  });
});
