/**
 * A10 — Records: Full CRUD Operations
 * Tests for financial records management
 */

import request from 'supertest';
import { createApp } from '../../app';
import { User, UserRole, UserStatus } from '../../modules/users/user.model';
import { FinancialRecord, RecordType } from '../../modules/records/record.model';
import { Otp, OtpType } from '../../modules/auth/otp.model';
import bcrypt from 'bcrypt';
import { assertSuccessEnvelope, assertErrorEnvelope, extractCsrfToken } from '../helpers';

const app = createApp();

describe('Records CRUD API', () => {
  let csrfToken: string;
  let adminToken: string;
  let analystToken: string;
  let viewerToken: string;
  let adminId: string;
  let analystId: string;

  beforeEach(async () => {
    // Get CSRF token
    const res = await request(app).get('/health');
    csrfToken = extractCsrfToken(res);

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      phone: '+911111111111',
      passwordHash: await bcrypt.hash('Admin@123', 10),
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isVerified: true,
    });
    adminId = admin._id.toString();

    // Login admin
    await Otp.create({
      identifier: 'admin@test.com',
      type: OtpType.EMAIL,
      otp: await bcrypt.hash('123456', 10),
      purpose: 'LOGIN',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      isUsed: false,
    });

    await request(app)
      .post('/api/auth/login')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({ identifier: 'admin@test.com', password: 'Admin@123' });

    const adminVerify = await request(app)
      .post('/api/auth/verify-otp')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({ identifier: 'admin@test.com', otp: '123456', purpose: 'LOGIN' });
    adminToken = adminVerify.body.data.accessToken;

    // Create analyst user
    const analyst = await User.create({
      name: 'Analyst User',
      email: 'analyst@test.com',
      phone: '+912222222222',
      passwordHash: await bcrypt.hash('Analyst@123', 10),
      role: UserRole.ANALYST,
      status: UserStatus.ACTIVE,
      isVerified: true,
    });
    analystId = analyst._id.toString();

    await Otp.create({
      identifier: 'analyst@test.com',
      type: OtpType.EMAIL,
      otp: await bcrypt.hash('123456', 10),
      purpose: 'LOGIN',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      isUsed: false,
    });

    await request(app)
      .post('/api/auth/login')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({ identifier: 'analyst@test.com', password: 'Analyst@123' });

    const analystVerify = await request(app)
      .post('/api/auth/verify-otp')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({ identifier: 'analyst@test.com', otp: '123456', purpose: 'LOGIN' });
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

    await Otp.create({
      identifier: 'viewer@test.com',
      type: OtpType.EMAIL,
      otp: await bcrypt.hash('123456', 10),
      purpose: 'LOGIN',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      isUsed: false,
    });

    await request(app)
      .post('/api/auth/login')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({ identifier: 'viewer@test.com', password: 'Viewer@123' });

    const viewerVerify = await request(app)
      .post('/api/auth/verify-otp')
      .set('Cookie', [`csrfToken=${csrfToken}`])
      .set('X-CSRF-Token', csrfToken)
      .send({ identifier: 'viewer@test.com', otp: '123456', purpose: 'LOGIN' });
    viewerToken = viewerVerify.body.data.accessToken;
  });

  describe('POST /api/records', () => {
    it('should allow admin to create income record', async () => {
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          title: 'Monthly Salary',
          amount: 5000,
          type: 'INCOME',
          category: 'Salary',
          date: '2026-04-01T00:00:00.000Z',
          notes: 'April salary',
        });

      expect(response.status).toBe(201);
      assertSuccessEnvelope(response);
      expect(response.body.data.title).toBe('Monthly Salary');
      expect(response.body.data.amount).toBe(5000);
      expect(response.body.data.type).toBe('INCOME');
      expect(response.body.data.category).toBe('Salary');
    });

    it('should allow admin to create expense record', async () => {
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          title: 'Office Supplies',
          amount: 150.50,
          type: 'EXPENSE',
          category: 'Office',
          date: '2026-04-02T00:00:00.000Z',
        });

      expect(response.status).toBe(201);
      assertSuccessEnvelope(response);
      expect(response.body.data.type).toBe('EXPENSE');
      expect(response.body.data.amount).toBe(150.50);
    });

    it('should deny analyst from creating record (ADMIN only)', async () => {
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          title: 'Client Payment',
          amount: 2000,
          type: 'INCOME',
          category: 'Revenue',
          date: '2026-04-03T00:00:00.000Z',
        });

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should deny viewer from creating record', async () => {
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          title: 'Test Record',
          amount: 100,
          type: 'INCOME',
          category: 'Test',
          date: '2026-04-04T00:00:00.000Z',
        });

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          title: 'Incomplete Record',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should validate amount is positive', async () => {
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          title: 'Invalid Amount',
          amount: -100,
          type: 'INCOME',
          category: 'Test',
          date: '2026-04-04T00:00:00.000Z',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should validate record type', async () => {
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          title: 'Invalid Type',
          amount: 100,
          type: 'INVALID',
          category: 'Test',
          date: '2026-04-04T00:00:00.000Z',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });
  });

  describe('GET /api/records', () => {
    beforeEach(async () => {
      // Create test records
      await FinancialRecord.create([
        {
          title: 'Salary March',
          amount: 5000,
          type: RecordType.INCOME,
          category: 'Salary',
          date: new Date('2026-03-01'),
          createdBy: adminId,
        },
        {
          title: 'Rent Payment',
          amount: 1500,
          type: RecordType.EXPENSE,
          category: 'Rent',
          date: new Date('2026-03-05'),
          createdBy: adminId,
        },
        {
          title: 'Freelance Project',
          amount: 2000,
          type: RecordType.INCOME,
          category: 'Freelance',
          date: new Date('2026-03-10'),
          createdBy: analystId,
        },
      ]);
    });

    it('should allow admin to list all records', async () => {
      const response = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      expect(response.body.meta).toBeDefined();
    });

    it('should allow analyst to list records', async () => {
      const response = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should deny viewer from listing records (ANALYST/ADMIN only)', async () => {
      const response = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/records?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(2);
    });

    it('should support search by title', async () => {
      const response = await request(app)
        .get('/api/records?search=Salary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].title).toContain('Salary');
    });

    it('should filter by type', async () => {
      const response = await request(app)
        .get('/api/records?type=INCOME')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      response.body.data.forEach((record: any) => {
        expect(record.type).toBe('INCOME');
      });
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/records?category=Salary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      response.body.data.forEach((record: any) => {
        expect(record.category).toBe('Salary');
      });
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/api/records?fromDate=2026-03-01&toDate=2026-03-06')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app).get('/api/records');

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });
  });

  describe('GET /api/records/:id', () => {
    let recordId: string;

    beforeEach(async () => {
      const record = await FinancialRecord.create({
        title: 'Test Record',
        amount: 1000,
        type: RecordType.INCOME,
        category: 'Test',
        date: new Date('2026-04-01'),
        createdBy: adminId,
      });
      recordId = record._id.toString();
    });

    it('should allow admin to get record by ID', async () => {
      const response = await request(app)
        .get(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data.title).toBe('Test Record');
    });

    it('should allow analyst to get record by ID', async () => {
      const response = await request(app)
        .get(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should deny viewer from getting record by ID (ANALYST/ADMIN only)', async () => {
      const response = await request(app)
        .get(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should return 404 for non-existent record', async () => {
      const response = await request(app)
        .get('/api/records/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      assertErrorEnvelope(response);
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/records/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      assertErrorEnvelope(response);
    });
  });

  describe('PATCH /api/records/:id', () => {
    let recordId: string;

    beforeEach(async () => {
      const record = await FinancialRecord.create({
        title: 'Original Title',
        amount: 1000,
        type: RecordType.INCOME,
        category: 'Original',
        date: new Date('2026-04-01'),
        createdBy: adminId,
      });
      recordId = record._id.toString();
    });

    it('should allow admin to update record', async () => {
      const response = await request(app)
        .patch(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          title: 'Updated Title',
          amount: 1500,
        });

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.amount).toBe(1500);
    });

    it('should deny analyst from updating record (ADMIN only)', async () => {
      const response = await request(app)
        .patch(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          notes: 'Updated by analyst',
        });

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should deny viewer from updating record', async () => {
      const response = await request(app)
        .patch(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          title: 'Hacked Title',
        });

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should return 404 for non-existent record', async () => {
      const response = await request(app)
        .patch('/api/records/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          title: 'Updated',
        });

      expect(response.status).toBe(404);
      assertErrorEnvelope(response);
    });

    it('should validate amount if provided', async () => {
      const response = await request(app)
        .patch(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          amount: -100,
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });
  });

  describe('DELETE /api/records/:id', () => {
    let recordId: string;

    beforeEach(async () => {
      const record = await FinancialRecord.create({
        title: 'To Delete',
        amount: 1000,
        type: RecordType.EXPENSE,
        category: 'Test',
        date: new Date('2026-04-01'),
        createdBy: adminId,
      });
      recordId = record._id.toString();
    });

    it('should allow admin to soft-delete record', async () => {
      const response = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);

      // Verify soft-delete
      const record = await FinancialRecord.findById(recordId);
      expect(record).not.toBeNull();
      expect(record!.isDeleted).toBe(true);
    });

    it('should deny analyst from soft-deleting record (ADMIN only)', async () => {
      const response = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken);

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should deny viewer from deleting record', async () => {
      const response = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken);

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should return 404 for non-existent record', async () => {
      const response = await request(app)
        .delete('/api/records/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken);

      expect(response.status).toBe(404);
      assertErrorEnvelope(response);
    });
  });
});
