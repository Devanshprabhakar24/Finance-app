import request from 'supertest';
import { createApp } from '../../app';
import { User } from '../users/user.model';
import { Otp } from './otp.model';
import bcrypt from 'bcrypt';

const app = createApp();

describe('Auth Module - Expanded Coverage', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+911234567890',
          password: 'Password@123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('OTP sent');

      const user = await User.findOne({ email: 'john@example.com' });
      expect(user).toBeTruthy();
      expect(user?.isVerified).toBe(false);
      expect(user?.status).toBe('ACTIVE');
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
        .send({
          name: 'New User',
          email: 'existing@example.com',
          phone: '+911111111111',
          password: 'Password@123',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
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
        .send({
          name: 'New User',
          email: 'new@example.com',
          phone: '+919876543210',
          password: 'Password@123',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should return 422 for invalid phone format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          password: 'Password@123',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should return 422 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+911234567890',
          password: 'weak',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should return 422 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          phone: '+911234567890',
          password: 'Password@123',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should create OTP record after registration', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+911234567890',
          password: 'Password@123',
        });

      const otp = await Otp.findOne({ identifier: 'john@example.com' });
      expect(otp).toBeTruthy();
      expect(otp?.purpose).toBe('REGISTER');
      expect(otp?.isUsed).toBe(false);
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    beforeEach(async () => {
      // Create unverified user
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+911234567890',
        passwordHash: await bcrypt.hash('Password@123', 10),
        isVerified: false,
      });

      // Create OTP
      await Otp.create({
        identifier: 'test@example.com',
        otp: '123456',
        purpose: 'REGISTER',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
    });

    it('should verify OTP and return tokens', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          identifier: 'test@example.com',
          otp: '123456',
          purpose: 'REGISTER',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeTruthy();
      expect(response.body.data.user).toBeTruthy();
      expect(response.headers['set-cookie']).toBeTruthy();

      const user = await User.findOne({ email: 'test@example.com' });
      expect(user?.isVerified).toBe(true);
    });

    it('should return 400 for invalid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          identifier: 'test@example.com',
          otp: '999999',
          purpose: 'REGISTER',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for expired OTP', async () => {
      await Otp.updateOne(
        { identifier: 'test@example.com' },
        { expiresAt: new Date(Date.now() - 1000) }
      );

      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          identifier: 'test@example.com',
          otp: '123456',
          purpose: 'REGISTER',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should lock account after 3 failed attempts', async () => {
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/verify-otp')
          .send({
            identifier: 'test@example.com',
            otp: '999999',
            purpose: 'REGISTER',
          });
      }

      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          identifier: 'test@example.com',
          otp: '123456',
          purpose: 'REGISTER',
        });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.headers['retry-after']).toBeTruthy();
    });

    it('should mark OTP as used after verification', async () => {
      await request(app)
        .post('/api/auth/verify-otp')
        .send({
          identifier: 'test@example.com',
          otp: '123456',
          purpose: 'REGISTER',
        });

      const otp = await Otp.findOne({ identifier: 'test@example.com' });
      expect(otp?.isUsed).toBe(true);
    });
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
        .send({
          identifier: 'test@example.com',
          password: 'Password@123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('OTP sent');

      const otp = await Otp.findOne({ identifier: 'test@example.com' });
      expect(otp).toBeTruthy();
      expect(otp?.purpose).toBe('LOGIN');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'WrongPassword@123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'nonexistent@example.com',
          password: 'Password@123',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unverified user', async () => {
      await User.create({
        name: 'Unverified User',
        email: 'unverified@example.com',
        phone: '+919999999999',
        passwordHash: await bcrypt.hash('Password@123', 10),
        isVerified: false,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'unverified@example.com',
          password: 'Password@123',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for suspended user', async () => {
      await User.create({
        name: 'Suspended User',
        email: 'suspended@example.com',
        phone: '+918888888888',
        passwordHash: await bcrypt.hash('Password@123', 10),
        isVerified: true,
        status: 'SUSPENDED',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'suspended@example.com',
          password: 'Password@123',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should accept phone number as identifier', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: '+911234567890',
          password: 'Password@123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+911234567890',
        passwordHash: await bcrypt.hash('Password@123', 10),
        isVerified: true,
      });
    });

    it('should send reset OTP for valid user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          identifier: 'test@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('OTP sent');

      const otp = await Otp.findOne({ identifier: 'test@example.com' });
      expect(otp).toBeTruthy();
      expect(otp?.purpose).toBe('RESET_PASSWORD');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          identifier: 'nonexistent@example.com',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+911234567890',
        passwordHash: await bcrypt.hash('OldPassword@123', 10),
        isVerified: true,
      });

      await Otp.create({
        identifier: 'test@example.com',
        otp: '123456',
        purpose: 'RESET_PASSWORD',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
    });

    it('should reset password with valid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          identifier: 'test@example.com',
          otp: '123456',
          newPassword: 'NewPassword@123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const user = await User.findOne({ email: 'test@example.com' });
      const isPasswordValid = await bcrypt.compare('NewPassword@123', user!.passwordHash);
      expect(isPasswordValid).toBe(true);
    });

    it('should return 400 for invalid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          identifier: 'test@example.com',
          otp: '999999',
          newPassword: 'NewPassword@123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 422 for weak new password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          identifier: 'test@example.com',
          otp: '123456',
          newPassword: 'weak',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/resend-otp', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+911234567890',
        passwordHash: await bcrypt.hash('Password@123', 10),
        isVerified: false,
      });
    });

    it('should resend OTP for valid user', async () => {
      const response = await request(app)
        .post('/api/auth/resend-otp')
        .send({
          identifier: 'test@example.com',
          purpose: 'REGISTER',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const otp = await Otp.findOne({ identifier: 'test@example.com' });
      expect(otp).toBeTruthy();
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/resend-otp')
        .send({
          identifier: 'nonexistent@example.com',
          purpose: 'REGISTER',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear refresh token cookie', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', ['refreshToken=sometoken']);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.headers['set-cookie']).toBeTruthy();
    });
  });
});
