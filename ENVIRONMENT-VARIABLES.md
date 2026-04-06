# Environment Variables Guide

This document provides detailed explanations for all environment variables used in the Finance Dashboard application.

## Overview

The application uses environment variables to configure various aspects of the system, from API endpoints to branding and feature flags. This approach allows for easy customization and deployment across different environments without code changes.

## Variable Categories

### 🔗 API Configuration

#### `VITE_API_BASE_URL`

- **Purpose**: Backend API base URL for all HTTP requests
- **Used by**: `axios.ts`, all API calls throughout the application
- **Examples**:
  - Development: `http://localhost:8000/api`
  - Production: `https://finance-app-ddaf.onrender.com/api`
- **Required**: Yes
- **Default**: `http://localhost:8000/api`

---

### 🎨 Application Branding

#### `VITE_APP_NAME`

- **Purpose**: Main application name displayed throughout the UI
- **Used by**:
  - Page titles (`<title>` tags)
  - Navigation headers
  - Sidebar branding
  - Email templates
  - Error messages
- **Examples**: `Finance Dashboard`, `MyFinance Pro`, `Corporate Finance`
- **Required**: Yes
- **Default**: `Finance Dashboard`

#### `VITE_APP_DESCRIPTION`

- **Purpose**: Application description for SEO and about sections
- **Used by**:
  - HTML meta description tags
  - Landing page descriptions
  - About sections
  - Social media sharing
- **Examples**: `Secure, Compliant & Intelligent Financial Systems`
- **Required**: Yes
- **Default**: `Secure, Compliant & Intelligent Financial Systems`

#### `VITE_APP_TAGLINE`

- **Purpose**: Marketing tagline for promotional content
- **Used by**:
  - Landing page hero section
  - Marketing materials
  - Footer text
- **Examples**: `Enterprise-Grade Financial Platform`
- **Required**: Yes
- **Default**: `Enterprise-Grade Financial Platform`

---

### 🏢 Company Information

#### `VITE_COMPANY_NAME`

- **Purpose**: Legal company name for official references
- **Used by**:
  - Footer copyright notices
  - Contact forms
  - Legal pages
  - Support references
- **Examples**: `Finance Dashboard Inc`, `Acme Corporation`
- **Required**: Yes
- **Default**: `Finance Dashboard`

#### `VITE_SUPPORT_EMAIL`

- **Purpose**: Customer support email address
- **Used by**:
  - Contact forms
  - Error message support links
  - Help sections
  - Footer contact information
- **Examples**: `support@finance-dashboard.dev`, `help@mycompany.com`
- **Required**: Yes
- **Default**: `support@finance-dashboard.dev`

#### `VITE_COMPANY_WEBSITE`

- **Purpose**: Company website URL for external references
- **Used by**:
  - Footer links
  - About sections
  - External navigation
- **Examples**: `https://finance-dashboard.dev`, `https://mycompany.com`
- **Required**: Yes
- **Default**: `https://finance-dashboard.dev`

---

### 🌐 Application URLs

#### `VITE_FRONTEND_URL`

- **Purpose**: Frontend application URL for redirects and CORS
- **Used by**:
  - Backend CORS configuration
  - Email template links
  - OAuth redirects
  - Social sharing URLs
- **Examples**:
  - Development: `http://localhost:3000`
  - Production: `https://finance-app-one-zeta.vercel.app`
- **Required**: Yes
- **Default**: `http://localhost:3000`

#### `VITE_DOCS_URL`

- **Purpose**: API documentation URL (Swagger/OpenAPI)
- **Used by**:
  - Help sections
  - Developer resources
  - API reference links
  - Navigation menus
- **Examples**: `https://finance-app-ddaf.onrender.com/api/docs`
- **Required**: No
- **Default**: `http://localhost:8000/api/docs`

#### `VITE_REPOSITORY_URL`

- **Purpose**: Source code repository URL
- **Used by**:
  - About page
  - Developer information
  - Contribution links
  - Footer links
- **Examples**: `https://github.com/Devanshprabhakar24/Finance-app`
- **Required**: No
- **Default**: `https://github.com/Devanshprabhakar24/Finance-app`

---

### 🚩 Feature Flags

#### `VITE_REGISTRATION_ENABLED`

- **Purpose**: Enable/disable user registration functionality
- **Used by**:
  - Registration forms
  - Navigation links
  - Authentication flow
  - Landing page CTAs
- **Values**: `true` | `false`
- **Default**: `true`
- **Use Cases**:
  - Set to `false` for invite-only systems
  - Temporarily disable during maintenance
  - Control access during beta phases

#### `VITE_DEMO_MODE`

- **Purpose**: Enable demo mode with visible test credentials
- **Used by**:
  - Login page (shows demo credentials)
  - Development environments
  - Sales demonstrations
- **Values**: `true` | `false`
- **Default**: `false`
- **Security Note**: Always set to `false` in production unless intentionally providing demo access

#### `VITE_ANALYTICS_ENABLED`

- **Purpose**: Enable analytics tracking and monitoring
- **Used by**:
  - Analytics components
  - Tracking scripts
  - Performance monitoring
- **Values**: `true` | `false`
- **Default**: `true`
- **Privacy Note**: Respect user privacy preferences and GDPR requirements

#### `VITE_FILE_UPLOAD_ENABLED`

- **Purpose**: Enable file upload functionality
- **Used by**:
  - File upload components
  - Attachment features
  - Profile picture uploads
  - Document management
- **Values**: `true` | `false`
- **Default**: `true`
- **Use Cases**:
  - Disable for storage cost control
  - Security restrictions
  - Compliance requirements

---

### 🎨 Theme Configuration

#### `VITE_PRIMARY_COLOR`

- **Purpose**: Primary brand color for UI elements
- **Used by**:
  - Buttons and CTAs
  - Links and navigation
  - Progress indicators
  - Brand accents
- **Format**: CSS hex color (e.g., `#6366f1`)
- **Default**: `#6366f1` (Indigo)
- **Examples**: `#ff6b6b` (Red), `#4ecdc4` (Teal), `#45b7d1` (Blue)

#### `VITE_SECONDARY_COLOR`

- **Purpose**: Secondary brand color for accent elements
- **Used by**:
  - Secondary buttons
  - Highlights and badges
  - Chart colors
  - Decorative elements
- **Format**: CSS hex color (e.g., `#8b5cf6`)
- **Default**: `#8b5cf6` (Purple)
- **Examples**: `#feca57` (Yellow), `#ff9ff3` (Pink), `#54a0ff` (Light Blue)

#### `VITE_LOGO_URL`

- **Purpose**: Custom logo URL for branding
- **Used by**:
  - Navigation header
  - Login/register pages
  - Email templates
  - Favicon generation
- **Format**: Full URL to image file
- **Default**: Empty (uses text-based logo)
- **Examples**: `https://cdn.mycompany.com/logo.png`
- **Supported Formats**: PNG, JPG, SVG
- **Recommended Size**: 200x50px for header use

---

### 🧪 Demo Credentials

These variables are only used when `VITE_DEMO_MODE=true` and provide quick access to test accounts with different permission levels.

#### `VITE_DEMO_ADMIN_EMAIL` / `VITE_DEMO_ADMIN_PASSWORD`

- **Purpose**: Demo admin account credentials
- **Role**: Full administrative access
- **Permissions**:
  - User management
  - System configuration
  - All financial data access
  - Analytics and reporting
- **Default**: `admin@finance.com` / `admin123`

#### `VITE_DEMO_ANALYST_EMAIL` / `VITE_DEMO_ANALYST_PASSWORD`

- **Purpose**: Demo analyst account credentials
- **Role**: Data analysis and reporting access
- **Permissions**:
  - View financial data
  - Generate reports
  - Export data
  - Limited user management
- **Default**: `analyst@finance.dev` / `Demo@12345`

#### `VITE_DEMO_VIEWER_EMAIL` / `VITE_DEMO_VIEWER_PASSWORD`

- **Purpose**: Demo viewer account credentials
- **Role**: Read-only access to financial data
- **Permissions**:
  - View dashboards
  - Basic reporting
  - No data modification
- **Default**: `viewer@finance.dev` / `Demo@12345`

**Security Warning**: These credentials are visible in the UI when demo mode is enabled. Never use real user credentials for demo accounts.

---

### 🔧 Third-Party Services

#### `VITE_CLOUDINARY_CLOUD_NAME`

- **Purpose**: Cloudinary cloud name for file uploads and image processing
- **Used by**:
  - File upload components
  - Image processing and optimization
  - Avatar uploads
  - Document attachments
- **Required for**:
  - Profile picture functionality
  - Document attachment features
  - Image optimization
- **Setup**: Get from [Cloudinary Dashboard](https://cloudinary.com/console)
- **Example**: `dq9fmg62v`
- **Required**: Yes (if file uploads are enabled)

---

## Environment-Specific Configurations

### Development Environment (`.env`)

```bash
# Local development settings
VITE_API_BASE_URL=http://localhost:8000/api
VITE_FRONTEND_URL=http://localhost:3000
VITE_DEMO_MODE=true
VITE_ANALYTICS_ENABLED=false
```

### Production Environment (`.env.production`)

```bash
# Production deployment settings
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_FRONTEND_URL=https://your-app-domain.com
VITE_DEMO_MODE=false
VITE_ANALYTICS_ENABLED=true
```

### Staging Environment

```bash
# Staging/testing settings
VITE_API_BASE_URL=https://staging-api.your-domain.com/api
VITE_FRONTEND_URL=https://staging.your-domain.com
VITE_DEMO_MODE=true
VITE_ANALYTICS_ENABLED=false
```

---

## Best Practices

### 🔒 Security

- Never commit `.env` files with real credentials
- Use platform-specific environment variable management (Vercel, Netlify, etc.)
- Rotate demo credentials regularly
- Set `VITE_DEMO_MODE=false` in production

### 🏗️ Development

- Always provide defaults in `app.config.ts`
- Document all variables in `.env.example`
- Use TypeScript declarations in `vite-env.d.ts`
- Test with different configurations

### 🚀 Deployment

- Validate all required variables before deployment
- Use different configurations for different environments
- Monitor for missing or incorrect variables
- Document environment-specific requirements

### 🎨 Branding

- Test color combinations for accessibility
- Ensure logo URLs are reliable and fast-loading
- Provide fallbacks for missing branding assets
- Consider dark mode compatibility

---

## Troubleshooting

### Common Issues

#### Missing Environment Variables

```bash
# Error: Cannot read property of undefined
# Solution: Check if variable is defined in .env and vite-env.d.ts
```

#### CORS Errors

```bash
# Error: CORS policy blocks request
# Solution: Ensure VITE_FRONTEND_URL matches your actual domain
```

#### File Upload Failures

```bash
# Error: Upload failed
# Solution: Verify VITE_CLOUDINARY_CLOUD_NAME is correct
```

#### Demo Mode Not Working

```bash
# Error: Demo credentials not showing
# Solution: Set VITE_DEMO_MODE=true and restart dev server
```

### Validation Checklist

- [ ] All required variables are defined
- [ ] URLs are valid and accessible
- [ ] Colors are valid hex codes
- [ ] Feature flags are boolean strings
- [ ] Demo credentials work in test environment
- [ ] Cloudinary configuration is correct
- [ ] TypeScript declarations match actual variables

---

## Migration Guide

### From Hardcoded Values

1. Identify hardcoded values in components
2. Add corresponding environment variables
3. Update `app.config.ts` to use new variables
4. Add TypeScript declarations
5. Test in all environments

### Adding New Variables

1. Add to `.env.example` with documentation
2. Add to `vite-env.d.ts` for TypeScript support
3. Add to `app.config.ts` with defaults
4. Update this documentation
5. Test in development and production

---

## Support

For questions about environment configuration:

- Check this documentation first
- Review `.env.example` for examples
- Test with minimal configuration
- Contact support at the configured `VITE_SUPPORT_EMAIL`
