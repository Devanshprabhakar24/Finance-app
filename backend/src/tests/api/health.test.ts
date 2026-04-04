/**
 * A1 — Health Check Tests
 */

import request from 'supertest';
import { createApp } from '../../app';

const app = createApp();

describe('Health Check API', () => {
  describe('GET /health', () => {
    it('should return 200 with status and timestamp', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return valid ISO-8601 timestamp', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      const timestamp = response.body.timestamp;
      
      // Verify it's a valid ISO-8601 date string
      expect(typeof timestamp).toBe('string');
      const date = new Date(timestamp);
      expect(date.toISOString()).toBe(timestamp);
      expect(isNaN(date.getTime())).toBe(false);
    });
  });
});
