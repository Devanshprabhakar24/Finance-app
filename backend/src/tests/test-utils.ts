/**
 * Test Utilities
 * Additional helper functions for testing
 */

import { User, UserRole, UserStatus } from '../modules/users/user.model';
import { Otp, OtpType } from '../modules/auth/otp.model';
import { FinancialRecord, RecordType } from '../modules/records/record.model';
import bcrypt from 'bcrypt';

/**
 * Generate unique email for testing
 */
export const generateUniqueEmail = (prefix: string = 'test'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
};

/**
 * Generate unique phone number for testing
 */
export const generateUniquePhone = (): string => {
  const random = Math.floor(Math.random() * 9000000000) + 1000000000;
  return `+91${random}`;
};

/**
 * Create a test user with specified role
 */
export const createTestUser = async (
  role: UserRole = UserRole.VIEWER,
  overrides: Partial<{
    name: string;
    email: string;
    phone: string;
    password: string;
    isVerified: boolean;
    status: UserStatus;
  }> = {}
) => {
  const defaultPassword = 'Test@123';
  const email = overrides.email || generateUniqueEmail(role.toLowerCase());
  const phone = overrides.phone || generateUniquePhone();

  const user = await User.create({
    name: overrides.name || `${role} User`,
    email,
    phone,
    passwordHash: await bcrypt.hash(overrides.password || defaultPassword, 10),
    role,
    status: overrides.status || UserStatus.ACTIVE,
    isVerified: overrides.isVerified !== undefined ? overrides.isVerified : true,
  });

  return {
    user,
    email,
    phone,
    password: overrides.password || defaultPassword,
  };
};

/**
 * Create OTP for a user
 */
export const createTestOTP = async (
  identifier: string,
  purpose: 'REGISTER' | 'LOGIN' | 'RESET' = 'LOGIN',
  overrides: Partial<{
    otp: string;
    type: OtpType;
    expiresAt: Date;
    isUsed: boolean;
  }> = {}
) => {
  const otp = overrides.otp || '123456';
  
  return await Otp.create({
    identifier,
    type: overrides.type || OtpType.EMAIL,
    otp: await bcrypt.hash(otp, 10),
    purpose,
    expiresAt: overrides.expiresAt || new Date(Date.now() + 10 * 60 * 1000),
    isUsed: overrides.isUsed || false,
  });
};

/**
 * Create test financial record
 */
export const createTestRecord = async (
  createdBy: string,
  overrides: Partial<{
    title: string;
    amount: number;
    type: RecordType;
    category: string;
    date: Date;
    description: string;
    tags: string[];
  }> = {}
) => {
  return await FinancialRecord.create({
    title: overrides.title || 'Test Record',
    amount: overrides.amount || 1000,
    type: overrides.type || RecordType.INCOME,
    category: overrides.category || 'Test Category',
    date: overrides.date || new Date(),
    description: overrides.description,
    tags: overrides.tags,
    createdBy,
  });
};

/**
 * Create multiple test records
 */
export const createTestRecords = async (
  createdBy: string,
  count: number,
  overrides: Partial<{
    type: RecordType;
    category: string;
    startDate: Date;
  }> = {}
) => {
  const records = [];
  const startDate = overrides.startDate || new Date();

  for (let i = 0; i < count; i++) {
    const record = await createTestRecord(createdBy, {
      title: `Test Record ${i + 1}`,
      amount: Math.floor(Math.random() * 10000) + 100,
      type: overrides.type || (i % 2 === 0 ? RecordType.INCOME : RecordType.EXPENSE),
      category: overrides.category || `Category ${(i % 5) + 1}`,
      date: new Date(startDate.getTime() - i * 24 * 60 * 60 * 1000), // Each day earlier
    });
    records.push(record);
  }

  return records;
};

/**
 * Wait for a specified time (useful for testing time-based features)
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Generate random string
 */
export const randomString = (length: number = 10): string => {
  return Math.random().toString(36).substring(2, 2 + length);
};

/**
 * Generate random number in range
 */
export const randomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Create test data for dashboard
 */
export const createDashboardTestData = async (userId: string) => {
  const currentDate = new Date();
  const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  // Create income records
  const incomeRecords = await Promise.all([
    createTestRecord(userId, {
      title: 'Salary',
      amount: 5000,
      type: RecordType.INCOME,
      category: 'Salary',
      date: thisMonth,
    }),
    createTestRecord(userId, {
      title: 'Freelance',
      amount: 2000,
      type: RecordType.INCOME,
      category: 'Freelance',
      date: thisMonth,
    }),
    createTestRecord(userId, {
      title: 'Last Month Salary',
      amount: 5000,
      type: RecordType.INCOME,
      category: 'Salary',
      date: lastMonth,
    }),
  ]);

  // Create expense records
  const expenseRecords = await Promise.all([
    createTestRecord(userId, {
      title: 'Rent',
      amount: 1500,
      type: RecordType.EXPENSE,
      category: 'Rent',
      date: thisMonth,
    }),
    createTestRecord(userId, {
      title: 'Groceries',
      amount: 300,
      type: RecordType.EXPENSE,
      category: 'Food',
      date: thisMonth,
    }),
    createTestRecord(userId, {
      title: 'Utilities',
      amount: 200,
      type: RecordType.EXPENSE,
      category: 'Utilities',
      date: thisMonth,
    }),
    createTestRecord(userId, {
      title: 'Last Month Rent',
      amount: 1500,
      type: RecordType.EXPENSE,
      category: 'Rent',
      date: lastMonth,
    }),
  ]);

  return {
    income: incomeRecords,
    expense: expenseRecords,
    all: [...incomeRecords, ...expenseRecords],
  };
};

/**
 * Clean up test data (useful for manual cleanup)
 */
export const cleanupTestData = async () => {
  await User.deleteMany({});
  await Otp.deleteMany({});
  await FinancialRecord.deleteMany({});
};

/**
 * Assert that a value is defined (TypeScript helper)
 */
export const assertDefined = <T>(value: T | undefined | null, message?: string): T => {
  if (value === undefined || value === null) {
    throw new Error(message || 'Value is undefined or null');
  }
  return value;
};

/**
 * Create test date range
 */
export const createDateRange = (daysAgo: number = 30) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  return {
    startDate,
    endDate,
    startDateISO: startDate.toISOString(),
    endDateISO: endDate.toISOString(),
  };
};

/**
 * Mock Cloudinary upload response
 */
export const mockCloudinaryResponse = (overrides: Partial<{
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
}> = {}) => {
  return {
    public_id: overrides.public_id || `test-${Date.now()}`,
    secure_url: overrides.secure_url || 'https://res.cloudinary.com/test/image/upload/test.jpg',
    format: overrides.format || 'jpg',
    width: overrides.width || 800,
    height: overrides.height || 600,
    resource_type: 'image',
    created_at: new Date().toISOString(),
    bytes: 102400,
  };
};

/**
 * Create test pagination params
 */
export const createPaginationParams = (overrides: Partial<{
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}> = {}) => {
  return {
    page: overrides.page || 1,
    limit: overrides.limit || 10,
    sortBy: overrides.sortBy || 'createdAt',
    sortOrder: overrides.sortOrder || 'desc',
  };
};

/**
 * Validate pagination response
 */
export const validatePaginationResponse = (meta: any, expectedTotal?: number) => {
  expect(meta).toHaveProperty('page');
  expect(meta).toHaveProperty('limit');
  expect(meta).toHaveProperty('total');
  expect(meta).toHaveProperty('totalPages');
  
  expect(typeof meta.page).toBe('number');
  expect(typeof meta.limit).toBe('number');
  expect(typeof meta.total).toBe('number');
  expect(typeof meta.totalPages).toBe('number');
  
  expect(meta.page).toBeGreaterThanOrEqual(1);
  expect(meta.limit).toBeGreaterThanOrEqual(1);
  expect(meta.total).toBeGreaterThanOrEqual(0);
  expect(meta.totalPages).toBeGreaterThanOrEqual(0);
  
  if (expectedTotal !== undefined) {
    expect(meta.total).toBe(expectedTotal);
  }
};

/**
 * Create test error scenarios
 */
export const createErrorScenarios = () => {
  return {
    invalidEmail: 'invalid-email',
    invalidPhone: '1234567890',
    weakPassword: 'weak',
    sqlInjection: "'; DROP TABLE users; --",
    xssPayload: '<script>alert("XSS")</script>',
    noSqlInjection: { $ne: null },
    pathTraversal: '../../../etc/passwd',
    commandInjection: '; rm -rf /',
    ldapInjection: '*)(uid=*))(|(uid=*',
  };
};

/**
 * Test data generators
 */
export const generators = {
  email: generateUniqueEmail,
  phone: generateUniquePhone,
  string: randomString,
  number: randomNumber,
  user: createTestUser,
  otp: createTestOTP,
  record: createTestRecord,
  records: createTestRecords,
  dashboardData: createDashboardTestData,
  dateRange: createDateRange,
  pagination: createPaginationParams,
  errors: createErrorScenarios,
};

/**
 * Export all utilities
 */
export default {
  generateUniqueEmail,
  generateUniquePhone,
  createTestUser,
  createTestOTP,
  createTestRecord,
  createTestRecords,
  createDashboardTestData,
  wait,
  randomString,
  randomNumber,
  cleanupTestData,
  assertDefined,
  createDateRange,
  mockCloudinaryResponse,
  createPaginationParams,
  validatePaginationResponse,
  createErrorScenarios,
  generators,
};
