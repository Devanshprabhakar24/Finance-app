# Dynamic Configuration System

This document outlines the dynamic configuration system implemented to replace hardcoded values throughout the application.

## Overview

All hardcoded values have been replaced with a centralized configuration system that allows for easy customization through environment variables.

## Configuration Files

### Frontend Configuration

#### `frontend/src/config/app.config.ts`

Central configuration file that reads from environment variables and provides defaults.

**Key Features:**

- App branding (name, description, tagline)
- Company information
- URLs and endpoints
- Feature flags
- Theme configuration
- Demo credentials

#### Environment Variables

All configuration is controlled through environment variables in `.env` files:

```bash
# App Branding
VITE_APP_NAME=Zorvyn
VITE_APP_DESCRIPTION=Secure, Compliant & Intelligent Financial Systems
VITE_APP_TAGLINE=Enterprise-Grade Financial Platform

# Company Information
VITE_COMPANY_NAME=Zorvyn
VITE_SUPPORT_EMAIL=support@zorvyn.com
VITE_COMPANY_WEBSITE=https://zorvyn.com

# URLs
VITE_FRONTEND_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:8000/api
VITE_DOCS_URL=http://localhost:8000/api/docs
VITE_REPOSITORY_URL=https://github.com/Devanshprabhakar24/Finance-app

# Feature Flags
VITE_REGISTRATION_ENABLED=true
VITE_DEMO_MODE=false
VITE_ANALYTICS_ENABLED=true
VITE_FILE_UPLOAD_ENABLED=true

# Theme Configuration
VITE_PRIMARY_COLOR=#6366f1
VITE_SECONDARY_COLOR=#8b5cf6
VITE_LOGO_URL=

# Demo Credentials
VITE_DEMO_ADMIN_EMAIL=admin@finance.com
VITE_DEMO_ADMIN_PASSWORD=admin123
VITE_DEMO_ANALYST_EMAIL=analyst@finance.dev
VITE_DEMO_ANALYST_PASSWORD=Demo@12345
VITE_DEMO_VIEWER_EMAIL=viewer@finance.dev
VITE_DEMO_VIEWER_PASSWORD=Demo@12345
```

### Backend Configuration

#### `backend/src/config/env.ts`

Enhanced with dynamic configuration options:

```typescript
// Application Configuration
APP_NAME: z.string().default('Finance Dashboard API'),
SUPPORT_EMAIL: z.string().email().default('support@finance-dashboard.dev'),

// Dynamic CORS based on environment
ALLOWED_ORIGINS: z.string().default(
  process.env.NODE_ENV === 'production'
    ? 'https://finance-app-one-zeta.vercel.app'
    : 'http://localhost:3000,http://localhost:5173'
),
```

## Updated Components

### 1. Landing Page (`LandingPage.tsx`)

- App name: `{APP_CONFIG.NAME}`
- Description: `{APP_CONFIG.DESCRIPTION}`
- Company references: Dynamic

### 2. Sidebar (`Sidebar.tsx`)

- App name in logo: `{APP_CONFIG.NAME}`

### 3. API Configuration (`axios.ts`)

- Base URL: `APP_CONFIG.URLS.BACKEND`

### 4. Vite Configuration (`vite.config.ts`)

- Dynamic proxy target based on environment
- Configurable API base URL

## Benefits

### 1. **Easy Rebranding**

Change app name, colors, and branding through environment variables without code changes.

### 2. **Environment-Specific Configuration**

Different settings for development, staging, and production environments.

### 3. **Feature Flags**

Enable/disable features without code deployment:

- Registration
- Demo mode
- Analytics
- File uploads

### 4. **Deployment Flexibility**

Easy configuration for different deployment targets and domains.

### 5. **White-Label Ready**

The application can be easily customized for different clients or brands.

## Usage Examples

### Rebranding the Application

1. **Change App Name:**

   ```bash
   VITE_APP_NAME="MyFinance Pro"
   ```

2. **Update Company Information:**

   ```bash
   VITE_COMPANY_NAME="MyCompany Inc"
   VITE_SUPPORT_EMAIL="support@mycompany.com"
   ```

3. **Customize Theme:**
   ```bash
   VITE_PRIMARY_COLOR="#ff6b6b"
   VITE_SECONDARY_COLOR="#4ecdc4"
   ```

### Environment-Specific Deployment

1. **Development:**

   ```bash
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_DEMO_MODE=true
   ```

2. **Production:**
   ```bash
   VITE_API_BASE_URL=https://api.mycompany.com
   VITE_DEMO_MODE=false
   ```

### Feature Management

1. **Disable Registration:**

   ```bash
   VITE_REGISTRATION_ENABLED=false
   ```

2. **Enable Demo Mode:**
   ```bash
   VITE_DEMO_MODE=true
   ```

## Migration from Hardcoded Values

### Before (Hardcoded)

```tsx
<span>Zorvyn</span>
<p>Zorvyn delivers cutting-edge...</p>
const baseURL = 'http://localhost:8000/api';
```

### After (Dynamic)

```tsx
<span>{APP_CONFIG.NAME}</span>
<p>{APP_CONFIG.NAME} delivers cutting-edge...</p>
const baseURL = APP_CONFIG.URLS.BACKEND;
```

## Environment Files

- `.env.example` - Template with all available variables
- `.env` - Local development (not committed)
- `.env.production` - Production configuration

## Type Safety

All environment variables are properly typed in `vite-env.d.ts` to ensure type safety and IDE support.

## Best Practices

1. **Always provide defaults** in the configuration
2. **Use feature flags** for optional functionality
3. **Validate environment variables** at startup
4. **Document all variables** in `.env.example`
5. **Use semantic naming** for configuration keys

## Future Enhancements

1. **Runtime Configuration API** - Allow configuration changes without redeployment
2. **Configuration UI** - Admin interface for configuration management
3. **Multi-tenant Support** - Per-tenant configuration
4. **Configuration Validation** - Enhanced validation and error reporting
