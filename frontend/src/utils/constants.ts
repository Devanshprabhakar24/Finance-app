/**
 * Application Constants
 * Centralized configuration for roles, routes, categories, etc.
 */

// User Roles
export const ROLES = {
  ADMIN: 'ADMIN',
  ANALYST: 'ANALYST',
  VIEWER: 'VIEWER',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Role Permissions Map
export const PERMISSIONS = {
  [ROLES.ADMIN]: [
    'view:dashboard',
    'view:records',
    'create:records',
    'edit:records',
    'delete:records',
    'view:analytics',
    'view:users',
    'manage:users',
    'view:profile',
    'edit:profile',
  ],
  [ROLES.ANALYST]: [
    'view:dashboard',
    'view:records',
    'view:analytics',
    'view:profile',
    'edit:profile',
  ],
  [ROLES.VIEWER]: [
    'view:dashboard',
    'view:profile',
    'edit:profile',
  ],
} as const;

// Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_OTP: '/verify-otp',
  DASHBOARD: '/dashboard',
  RECORDS: '/dashboard/records',
  RECORD_DETAIL: '/dashboard/records/:id',
  ANALYTICS: '/dashboard/analytics',
  USERS: '/dashboard/users',
  PROFILE: '/dashboard/profile',
  NOT_FOUND: '/404',
  FORBIDDEN: '/403',
} as const;

// Financial Record Types
export const RECORD_TYPES = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
} as const;

export type RecordType = typeof RECORD_TYPES[keyof typeof RECORD_TYPES];

// Financial Categories
export const CATEGORIES = {
  INCOME: [
    'Salary',
    'Freelance',
    'Investment',
    'Business',
    'Gift',
    'Other Income',
  ],
  EXPENSE: [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Insurance',
    'Rent',
    'Other Expense',
  ],
} as const;

// OTP Configuration
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 5,
  RESEND_COOLDOWN_SECONDS: 60,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 25, 50, 100],
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  INPUT: 'yyyy-MM-dd',
  API: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Currency
export const CURRENCY = {
  CODE: 'INR',
  SYMBOL: '₹',
  LOCALE: 'en-IN',
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf'],
} as const;

// Toast Duration (milliseconds)
export const TOAST_DURATION = {
  SUCCESS: 4000,
  ERROR: 6000,
  WARNING: 5000,
  INFO: 4000,
} as const;

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 15000, // 15 seconds
  RETRY_ATTEMPTS: 1,
  STALE_TIME: {
    DEFAULT: 60000, // 1 minute
    RECORDS: 30000, // 30 seconds
    DASHBOARD: 2 * 60 * 1000, // 2 minutes
    TRENDS: 5 * 60 * 1000, // 5 minutes
    USERS: 60000, // 1 minute
  },
} as const;

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Animation Durations (milliseconds)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Password Requirements
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
  SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const;

// Chart Colors
export const CHART_COLORS = {
  INCOME: '#10b981', // emerald-500
  EXPENSE: '#f43f5e', // rose-500
  PRIMARY: '#6366f1', // indigo-500
  SECONDARY: '#8b5cf6', // violet-500
  TERTIARY: '#ec4899', // pink-500
  CATEGORIES: [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#f43f5e', // rose
    '#14b8a6', // teal
    '#f97316', // orange
    '#a855f7', // purple
  ],
} as const;

// User Status
export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'finance-dashboard-theme',
  SIDEBAR_COLLAPSED: 'finance-dashboard-sidebar-collapsed',
  FILTER_PREFERENCES: 'finance-dashboard-filter-preferences',
  AUTH: 'auth-storage',
} as const;
