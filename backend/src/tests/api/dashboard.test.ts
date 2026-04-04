/**
 * A11 — Dashboard: Analytics & Reporting
 * Tests for dashboard endpoints
 */

import request from 'supertest';
import { createApp } from '../../app';
import { User, UserRole, UserStatus } from '../../modules/users/user.model';
import { FinancialRecord, RecordType } from '../../modules/records/record.model';
import { Otp, OtpType } from '../../modules/auth/otp.model';
import bcrypt from 'bcrypt';
import { assertSuccessEnvelope, assertErrorEnvelope, extractCsrfToken } from '../helpers';

const app = createApp();

describe('Dashboard API', () => {
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
    await User.create({
      name: 'Analyst User',
      email: 'analyst@test.com',
      phone: '+912222222222',
      passwordHash: await bcrypt.hash('Analyst@123', 10),
      role: UserRole.ANALYST,
      status: UserStatus.ACTIVE,
      isVerified: true,
    });

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

    // Create test records
    await FinancialRecord.create([
      {
        title: 'Salary March',
        amount: 5000,
        type: RecordType.INCOME,
        category: 'Salary',
        date: new Date('2026-03-15'),
        createdBy: adminId,
      },
      {
        title: 'Freelance Project',
        amount: 2000,
        type: RecordType.INCOME,
        category: 'Freelance',
        date: new Date('2026-03-20'),
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
        title: 'Groceries',
        amount: 300,
        type: RecordType.EXPENSE,
        category: 'Food',
        date: new Date('2026-03-10'),
        createdBy: adminId,
      },
      {
        title: 'Utilities',
        amount: 200,
        type: RecordType.EXPENSE,
        category: 'Utilities',
        date: new Date('2026-03-12'),
        createdBy: adminId,
      },
    ]);
  });

  describe('GET /api/dashboard/summary', () => {
    it('should allow admin to get summary', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data).toHaveProperty('totalIncome');
      expect(response.body.data).toHaveProperty('totalExpense');
      expect(response.body.data).toHaveProperty('netBalance');
      expect(response.body.data).toHaveProperty('recordCount');
      expect(response.body.data.totalIncome).toBe(7000);
      expect(response.body.data.totalExpense).toBe(2000);
      expect(response.body.data.netBalance).toBe(5000);
    });

    it('should allow analyst to get summary', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should allow viewer to get summary', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should support date range filtering', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary?from=2026-03-01&to=2026-03-10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      // Should only include records from March 1-10
      expect(response.body.data.totalExpense).toBe(1800); // Rent + Groceries
    });

    it('should handle empty date range', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary?from=2026-01-01&to=2026-01-31')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(response.body.data.totalIncome).toBe(0);
      expect(response.body.data.totalExpense).toBe(0);
      expect(response.body.data.netBalance).toBe(0);
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app).get('/api/dashboard/summary');

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });
  });

  describe('GET /api/dashboard/recent', () => {
    it('should allow admin to get recent records', async () => {
      const response = await request(app)
        .get('/api/dashboard/recent')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.length).toBeLessThanOrEqual(10); // Default limit
    });

    it('should allow analyst to get recent records', async () => {
      const response = await request(app)
        .get('/api/dashboard/recent')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should allow viewer to get recent records', async () => {
      const response = await request(app)
        .get('/api/dashboard/recent')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should return records sorted by date (newest first)', async () => {
      const response = await request(app)
        .get('/api/dashboard/recent')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const records = response.body.data;
      if (records.length > 1) {
        const firstDate = new Date(records[0].date);
        const secondDate = new Date(records[1].date);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app).get('/api/dashboard/recent');

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });
  });

  describe('GET /api/dashboard/by-category', () => {
    it('should allow admin to get breakdown by category', async () => {
      const response = await request(app)
        .get('/api/dashboard/by-category')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Check structure
      const firstCategory = response.body.data[0];
      expect(firstCategory).toHaveProperty('category');
      expect(firstCategory).toHaveProperty('type');
      expect(firstCategory).toHaveProperty('total');
      expect(firstCategory).toHaveProperty('count');
      expect(firstCategory).toHaveProperty('percentage');
    });

    it('should allow analyst to get breakdown by category', async () => {
      const response = await request(app)
        .get('/api/dashboard/by-category')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should deny viewer from getting breakdown (ANALYST/ADMIN only)', async () => {
      const response = await request(app)
        .get('/api/dashboard/by-category')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should support date range filtering', async () => {
      const response = await request(app)
        .get('/api/dashboard/by-category?from=2026-03-01&to=2026-03-10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app).get('/api/dashboard/by-category');

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });
  });

  describe('GET /api/dashboard/trends', () => {
    it('should allow admin to get monthly trends', async () => {
      const response = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        const firstTrend = response.body.data[0];
        expect(firstTrend).toHaveProperty('month');
        expect(firstTrend).toHaveProperty('income');
        expect(firstTrend).toHaveProperty('expense');
      }
    });

    it('should allow analyst to get monthly trends', async () => {
      const response = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should deny viewer from getting trends (ANALYST/ADMIN only)', async () => {
      const response = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should support date range filtering', async () => {
      const response = await request(app)
        .get('/api/dashboard/trends?year=2026')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app).get('/api/dashboard/trends');

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });
  });

  describe('GET /api/dashboard/top-categories', () => {
    it('should allow admin to get top categories', async () => {
      const response = await request(app)
        .get('/api/dashboard/top-categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        const firstCategory = response.body.data[0];
        expect(firstCategory).toHaveProperty('rank');
        expect(firstCategory).toHaveProperty('category');
        expect(firstCategory).toHaveProperty('total');
        expect(firstCategory).toHaveProperty('percentage');
      }
    });

    it('should allow analyst to get top categories', async () => {
      const response = await request(app)
        .get('/api/dashboard/top-categories')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should deny viewer from getting top categories (ANALYST/ADMIN only)', async () => {
      const response = await request(app)
        .get('/api/dashboard/top-categories')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
      assertErrorEnvelope(response);
    });

    it('should return categories sorted by amount (highest first)', async () => {
      const response = await request(app)
        .get('/api/dashboard/top-categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const categories = response.body.data;
      if (categories.length > 1) {
        expect(categories[0].total).toBeGreaterThanOrEqual(categories[1].total);
      }
    });

    it('should support date range filtering', async () => {
      const response = await request(app)
        .get('/api/dashboard/top-categories?from=2026-03-01&to=2026-03-31')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      assertSuccessEnvelope(response);
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app).get('/api/dashboard/top-categories');

      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });
  });
});
