/**
 * Test Helper Functions
 * Reusable assertions and utilities for testing
 */

import { Response } from 'supertest';

/**
 * Assert response follows success envelope pattern
 */
export const assertSuccessEnvelope = (res: Response) => {
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('message');
  expect(typeof res.body.message).toBe('string');
  // data is optional for some success responses
};

/**
 * Assert response follows error envelope pattern
 */
export const assertErrorEnvelope = (res: Response) => {
  expect(res.body).toHaveProperty('success', false);
  expect(res.body).toHaveProperty('message');
  expect(typeof res.body.message).toBe('string');
  expect(res.body).toHaveProperty('error');
  expect(res.body.error).toHaveProperty('code');
  expect(typeof res.body.error.code).toBe('string');
  expect(res.body.error.code).toMatch(/^[A-Z_]+$/); // SCREAMING_SNAKE_CASE
};

/**
 * Recursively check object for sensitive fields
 */
export const assertNoSensitiveFields = (obj: any, path = '') => {
  const sensitiveFields = ['passwordHash', 'refreshToken', '__v'];
  
  if (obj === null || obj === undefined) return;
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => assertNoSensitiveFields(item, `${path}[${index}]`));
    return;
  }
  
  if (typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      const fullPath = path ? `${path}.${key}` : key;
      
      if (sensitiveFields.includes(key)) {
        throw new Error(`Sensitive field '${key}' found at path: ${fullPath}`);
      }
      
      assertNoSensitiveFields(obj[key], fullPath);
    });
  }
};

/**
 * Assert pagination metadata is correct
 */
export const assertPaginationMeta = (
  meta: any,
  expectedPage: number,
  expectedLimit: number
) => {
  expect(meta).toHaveProperty('page', expectedPage);
  expect(meta).toHaveProperty('limit', expectedLimit);
  expect(meta).toHaveProperty('totalCount');
  expect(meta).toHaveProperty('totalPages');
  
  expect(typeof meta.totalCount).toBe('number');
  expect(meta.totalCount).toBeGreaterThanOrEqual(0);
  
  expect(typeof meta.totalPages).toBe('number');
  expect(meta.totalPages).toBe(Math.ceil(meta.totalCount / meta.limit));
};

/**
 * Assert data array length respects limit
 */
export const assertDataRespectsPagination = (data: any[], meta: any) => {
  expect(data.length).toBeLessThanOrEqual(meta.limit);
};

/**
 * Get CSRF token from response
 */
export const extractCsrfToken = (res: Response): string => {
  const cookies = res.headers['set-cookie'];
  if (cookies && Array.isArray(cookies)) {
    const csrfCookie = cookies.find((cookie: string) => cookie.startsWith('csrfToken='));
    if (csrfCookie) {
      const match = csrfCookie.match(/csrfToken=([^;]+)/);
      return match ? match[1] : '';
    }
  }
  return '';
};

/**
 * Create authenticated request headers
 */
export const authHeaders = (token: string, csrfToken?: string) => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  return headers;
};

/**
 * Wait for a specified time (for rate limit tests)
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
