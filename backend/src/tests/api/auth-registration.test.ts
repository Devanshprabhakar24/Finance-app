/**
 * A2 — Auth: Registration Flow (Complete)
 */

import request from 'supertest';
import { createApp } from '../../app';
import { User } from '../../modules/users/user.model';
import { Otp } from '../../modules/auth/otp.model';
import { assertSuccessEnvelope, assertErrorEnvelope, extractCsrfToken } from '../helpers';

const app = createApp();

describe('Auth Registration API', () => {
  let csrfToken: string;

  beforeEach(async () => {
    const res = await request(app).get('/health');
    csrfToken = extractCsrfToken(res);
  });

  describe('POST /api/auth/register', () => {
    const validPayload = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+911234567890',
      password: 'Password@123',
    };

    it('should register user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send(validPayload);

      expect(response.status).toBe(201);
      assertSuccessEnvelope(response);
      expect(response.body.message).toContain('OTP sent');

      const user = await User.findOne({ email: validPayload.email });
      expect(user).toBeTruthy();
      expect(user?.isVerified).toBe(false);
      expect(user?.status).toBe('ACTIVE');

      const otp = await Otp.findOne({ identifier: validPayload.email });
      expect(otp).toBeTruthy();
      expect(otp?.purpose).toBe('REGISTER');
    });

    it('should return 409 for duplicate email', async () => {
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        phone: '+919876543210',
        passwordHash: 'hashedpassword',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          ...validPayload,
          email: 'existing@example.com',
        });

      expect(response.status).toBe(409);
      assertErrorEnvelope(response);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should return 409 for duplicate phone', async () => {
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        phone: '+919876543210',
        passwordHash: 'hashedpassword',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          ...validPayload,
          phone: '+919876543210',
        });

      expect(response.status).toBe(409);
      assertErrorEnvelope(response);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should return 422 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          ...validPayload,
          email: 'not-an-email',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(JSON.stringify(response.body.error.details)).toContain('email');
    });

    it('should return 422 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          ...validPayload,
          password: 'password',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
      expect(JSON.stringify(response.body.error.details)).toContain('password');
    });

    it('should return 422 for phone not in E.164 format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          ...validPayload,
          phone: '0987654321',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
      expect(JSON.stringify(response.body.error.details)).toContain('phone');
    });

    it('should return 422 for missing required field', async () => {
      const { name, ...payloadWithoutName } = validPayload;

      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send(payloadWithoutName);

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
    });

    it('should return 422 for name too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          ...validPayload,
          name: 'A',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
      expect(JSON.stringify(response.body.error.details)).toContain('name');
    });

    it('should return 422 for name with digits', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          ...validPayload,
          name: 'John123',
        });

      expect(response.status).toBe(422);
      assertErrorEnvelope(response);
      expect(JSON.stringify(response.body.error.details)).toContain('name');
    });
  });
});
