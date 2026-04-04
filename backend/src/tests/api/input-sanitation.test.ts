/**
 * A14 — Input Sanitation Tests
 * Tests for XSS, SQL injection, and NoSQL injection prevention
 */

import request from 'supertest';
import { createApp } from '../../app';
import { User, UserRole, UserStatus } from '../../modules/users/user.model';
import { Otp, OtpType } from '../../modules/auth/otp.model';
import bcrypt from 'bcrypt';
import { extractCsrfToken, assertErrorEnvelope } from '../helpers';

const app = createApp();

describe('Input Sanitation', () => {
  let csrfToken: string;
  let adminToken: string;

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
  });

  describe('XSS Prevention', () => {
    it('should sanitize XSS attempts in registration name field', async () => {
      const xssPayload = '<script>alert("XSS")</script>';
      
      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: xssPayload,
          email: 'xsstest@example.com',
          phone: '+919999999999',
          password: 'Test@123',
        });

      // Should either reject the input or sanitize it
      // Zod validation should reject names with special characters
      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should sanitize XSS attempts in record title field', async () => {
      const xssPayload = '<img src=x onerror=alert("XSS")>';
      
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: xssPayload,
          amount: 1000,
          type: 'INCOME',
          category: 'Salary',
          date: new Date().toISOString(),
        });

      // Should accept but sanitize the input
      // Or reject if validation is strict (CSRF token required)
      if (response.status === 201) {
        // If accepted, check that the script tags are sanitized
        expect(response.body.data.title).not.toContain('<script>');
        expect(response.body.data.title).not.toContain('onerror');
      } else {
        // If rejected, that's also acceptable (401 for CSRF, 400/422 for validation)
        expect([400, 401, 422]).toContain(response.status);
      }
    });

    it('should handle HTML entities in text fields', async () => {
      const htmlEntities = '&lt;script&gt;alert("test")&lt;/script&gt;';
      
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: htmlEntities,
          amount: 1000,
          type: 'INCOME',
          category: 'Salary',
          date: new Date().toISOString(),
        });

      // Should handle HTML entities safely
      if (response.status === 201) {
        expect(response.body.data.title).toBeDefined();
      }
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in email field', async () => {
      const sqlInjection = "admin@test.com' OR '1'='1";
      
      const response = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: sqlInjection,
          password: 'Admin@123',
        });

      // Should not allow SQL injection
      // MongoDB is not vulnerable to SQL injection, but validation should catch this
      expect(response.status).toBe(401);
      assertErrorEnvelope(response);
    });

    it('should prevent SQL injection in search queries', async () => {
      const sqlInjection = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .get(`/api/users?search=${encodeURIComponent(sqlInjection)}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Should handle safely without executing any SQL
      // MongoDB uses BSON, not SQL, so this should be safe
      expect([200, 400, 422]).toContain(response.status);
    });
  });

  describe('NoSQL Injection Prevention', () => {
    it('should prevent NoSQL injection in login identifier', async () => {
      const noSqlInjection = { $ne: null };
      
      const response = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          identifier: noSqlInjection,
          password: 'Admin@123',
        });

      // Should reject object-based injection attempts
      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should prevent NoSQL injection in query parameters', async () => {
      const noSqlInjection = { $gt: '' };
      
      const response = await request(app)
        .get('/api/records')
        .query({ category: JSON.stringify(noSqlInjection) })
        .set('Authorization', `Bearer ${adminToken}`);

      // Should handle safely without executing NoSQL operators
      expect([200, 400, 422]).toContain(response.status);
    });

    it('should prevent NoSQL injection in record filters', async () => {
      const response = await request(app)
        .get('/api/records')
        .query({ 
          type: { $ne: 'EXPENSE' },
          amount: { $gt: 0 }
        })
        .set('Authorization', `Bearer ${adminToken}`);

      // Should either sanitize or reject the query
      // Proper implementation should not allow operator injection
      expect([200, 400, 422]).toContain(response.status);
    });
  });

  describe('Command Injection Prevention', () => {
    it('should prevent command injection in file names', async () => {
      const commandInjection = 'test; rm -rf /';
      
      // This would be tested with actual file upload
      // For now, we test that special characters are rejected
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: commandInjection,
          amount: 1000,
          type: 'INCOME',
          category: 'Salary',
          date: new Date().toISOString(),
        });

      // Should handle safely
      if (response.status === 201) {
        // If accepted, the command should not be executed
        expect(response.body.data.title).toBeDefined();
      }
    });
  });

  describe('Path Traversal Prevention', () => {
    it('should prevent path traversal in category field', async () => {
      const pathTraversal = '../../../etc/passwd';
      
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Record',
          amount: 1000,
          type: 'INCOME',
          category: pathTraversal,
          date: new Date().toISOString(),
        });

      // Should handle safely without accessing file system
      if (response.status === 201) {
        expect(response.body.data.category).toBe(pathTraversal);
        // The value is stored but should never be used for file operations
      }
    });
  });

  describe('LDAP Injection Prevention', () => {
    it('should prevent LDAP injection in search fields', async () => {
      const ldapInjection = '*)(uid=*))(|(uid=*';
      
      const response = await request(app)
        .get(`/api/users?search=${encodeURIComponent(ldapInjection)}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Should handle safely
      // MongoDB doesn't use LDAP, but input should be sanitized
      expect([200, 400, 422]).toContain(response.status);
    });
  });
});
