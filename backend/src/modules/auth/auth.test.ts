import request from 'supertest';
import { createApp } from '../../app';
import { User } from '../users/user.model';

const app = createApp();

// Helper to get CSRF token
const getCsrfToken = async () => {
  const response = await request(app).get('/health');
  const cookies = response.headers['set-cookie'];
  if (cookies && Array.isArray(cookies)) {
    const csrfCookie = cookies.find((cookie: string) => cookie.startsWith('csrfToken='));
    if (csrfCookie) {
      const match = csrfCookie.match(/csrfToken=([^;]+)/);
      return match ? match[1] : '';
    }
  }
  return '';
};

describe('Auth Module', () => {
  let csrfToken: string;

  beforeEach(async () => {
    csrfToken = await getCsrfToken();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
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
          name: 'New User',
          email: 'existing@example.com',
          phone: '+911111111111',
          password: 'Password@123',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should return 422 for invalid phone format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890', // Invalid format
          password: 'Password@123',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should return 422 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', [`csrfToken=${csrfToken}`])
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+911234567890',
          password: 'weak', // Too weak
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });
});
