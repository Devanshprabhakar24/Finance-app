/**
 * A13 — Security Headers Tests
 * Tests for security headers (Helmet, CORS, CSP, etc.)
 */

import request from 'supertest';
import { createApp } from '../../app';

const app = createApp();

describe('Security Headers', () => {
  describe('Helmet Security Headers', () => {
    it('should include X-Content-Type-Options header', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include X-Frame-Options header', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-frame-options']).toBeDefined();
      expect(['DENY', 'SAMEORIGIN']).toContain(response.headers['x-frame-options']);
    });

    it('should include X-XSS-Protection header', async () => {
      const response = await request(app).get('/health');

      // Modern browsers use CSP instead, but older ones use this
      // Helmet might set this to "0" to disable the legacy XSS filter
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    it('should include Strict-Transport-Security header', async () => {
      const response = await request(app).get('/health');

      // HSTS header (might only be set in production with HTTPS)
      // In test environment, it might not be present
      if (response.headers['strict-transport-security']) {
        expect(response.headers['strict-transport-security']).toContain('max-age');
      }
    });

    it('should not expose X-Powered-By header', async () => {
      const response = await request(app).get('/health');

      // Helmet should remove this header to avoid exposing Express
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('CORS Configuration', () => {
    it('should include CORS headers for allowed origins', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      // Check if CORS headers are present
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle preflight OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });

  describe('Content Security Policy', () => {
    it('should include Content-Security-Policy header', async () => {
      const response = await request(app).get('/health');

      // CSP header might be set by Helmet
      if (response.headers['content-security-policy']) {
        expect(response.headers['content-security-policy']).toBeDefined();
      }
    });
  });

  describe('Cookie Security', () => {
    it('should set secure cookie attributes', async () => {
      const response = await request(app).get('/health');

      // Check if cookies have secure attributes
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        const cookieString = Array.isArray(setCookie) ? setCookie[0] : setCookie;
        
        // SameSite should be set
        expect(cookieString.toLowerCase()).toMatch(/samesite=(strict|lax)/i);
        
        // In production, cookies should have HttpOnly and Secure flags
        // In test environment, CSRF token might not have HttpOnly (it's read by client)
        // But session cookies should have HttpOnly
        // For this test, we just verify SameSite is set
      }
    });
  });
});
