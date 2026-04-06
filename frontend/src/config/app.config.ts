/**
 * Application Configuration
 * Centralized configuration for app branding, URLs, and settings
 */

// App Branding Configuration
export const APP_CONFIG = {
  // App Identity
  NAME: import.meta.env.VITE_APP_NAME || 'Zorvyn',
  DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION || 'Secure, Compliant & Intelligent Financial Systems',
  TAGLINE: import.meta.env.VITE_APP_TAGLINE || 'Enterprise-Grade Financial Platform',
  
  // Company Information
  COMPANY: {
    NAME: import.meta.env.VITE_COMPANY_NAME || 'Zorvyn',
    SUPPORT_EMAIL: import.meta.env.VITE_SUPPORT_EMAIL || 'support@zorvyn.com',
    WEBSITE: import.meta.env.VITE_COMPANY_WEBSITE || 'https://zorvyn.com',
  },
  
  // URLs and Links
  URLS: {
    FRONTEND: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000',
    BACKEND: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
    DOCS: import.meta.env.VITE_DOCS_URL || 'http://localhost:8000/api/docs',
    REPOSITORY: import.meta.env.VITE_REPOSITORY_URL || 'https://github.com/Devanshprabhakar24/Finance-app',
  },
  
  // Feature Flags
  FEATURES: {
    REGISTRATION_ENABLED: import.meta.env.VITE_REGISTRATION_ENABLED !== 'false',
    DEMO_MODE: import.meta.env.VITE_DEMO_MODE === 'true',
    ANALYTICS_ENABLED: import.meta.env.VITE_ANALYTICS_ENABLED !== 'false',
    FILE_UPLOAD_ENABLED: import.meta.env.VITE_FILE_UPLOAD_ENABLED !== 'false',
  },
  
  // Theme Configuration
  THEME: {
    PRIMARY_COLOR: import.meta.env.VITE_PRIMARY_COLOR || '#6366f1',
    SECONDARY_COLOR: import.meta.env.VITE_SECONDARY_COLOR || '#8b5cf6',
    LOGO_URL: import.meta.env.VITE_LOGO_URL || null,
  },
  
  // Default User Credentials (for demo/development)
  DEMO_CREDENTIALS: {
    ADMIN: {
      EMAIL: import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@finance.com',
      PASSWORD: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'admin123',
    },
    ANALYST: {
      EMAIL: import.meta.env.VITE_DEMO_ANALYST_EMAIL || 'analyst@finance.dev',
      PASSWORD: import.meta.env.VITE_DEMO_ANALYST_PASSWORD || 'Demo@12345',
    },
    USER: {
      EMAIL: import.meta.env.VITE_DEMO_USER_EMAIL || 'user@finance.dev',
      PASSWORD: import.meta.env.VITE_DEMO_USER_PASSWORD || 'Demo@12345',
    },
  },
} as const;

// Environment-specific configurations
export const ENV_CONFIG = {
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  NODE_ENV: import.meta.env.MODE,
} as const;

// Export individual configs for convenience
export const { NAME: APP_NAME, DESCRIPTION: APP_DESCRIPTION } = APP_CONFIG;
export const { FRONTEND_URL, BACKEND_URL, DOCS_URL } = APP_CONFIG.URLS;
export const { COMPANY } = APP_CONFIG;