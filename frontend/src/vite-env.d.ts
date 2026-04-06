/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_BASE_URL: string;
  
  // App Branding
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_DESCRIPTION: string;
  readonly VITE_APP_TAGLINE: string;
  
  // Company Information
  readonly VITE_COMPANY_NAME: string;
  readonly VITE_SUPPORT_EMAIL: string;
  readonly VITE_COMPANY_WEBSITE: string;
  
  // URLs
  readonly VITE_FRONTEND_URL: string;
  readonly VITE_DOCS_URL: string;
  readonly VITE_REPOSITORY_URL: string;
  
  // Feature Flags
  readonly VITE_REGISTRATION_ENABLED: string;
  readonly VITE_DEMO_MODE: string;
  readonly VITE_ANALYTICS_ENABLED: string;
  readonly VITE_FILE_UPLOAD_ENABLED: string;
  
  // Theme
  readonly VITE_PRIMARY_COLOR: string;
  readonly VITE_SECONDARY_COLOR: string;
  readonly VITE_LOGO_URL: string;
  
  // Demo Credentials
  readonly VITE_DEMO_ADMIN_EMAIL: string;
  readonly VITE_DEMO_ADMIN_PASSWORD: string;
  readonly VITE_DEMO_ANALYST_EMAIL: string;
  readonly VITE_DEMO_ANALYST_PASSWORD: string;
  readonly VITE_DEMO_VIEWER_EMAIL: string;
  readonly VITE_DEMO_VIEWER_PASSWORD: string;
  
  // Third-party Services
  readonly VITE_CLOUDINARY_CLOUD_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
