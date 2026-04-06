# Deployment Overview

## Target Platforms

- Frontend: Vercel
- Backend: Render

## Current Production URLs

- Frontend: https://finance-app-one-zeta.vercel.app
- Backend API: https://finance-app-ddaf.onrender.com/api
- Health: https://finance-app-ddaf.onrender.com/api/health

## Backend Deployment Notes

- Use `backend` as app root in deployment config.
- Ensure all required env variables are set in Render.
- Confirm CORS origins include the frontend production URL.
- Verify OTP mode values for production behavior.

Build/start commands used in deployment:

- Build: cd backend && npm ci && npm run build
- Start: cd backend && node dist/server.js

Important backend production env values:

- NODE_ENV=production
- PORT=8000
- MONGODB_URI set
- JWT secrets set
- OTP_EMAIL_TEST_MODE=false
- OTP_SMS_TEST_MODE=false
- ALLOWED_ORIGINS includes frontend domain

## Frontend Deployment Notes

- Use production API base URL.
- Set build-time env variables in Vercel.
- Redeploy after changing any `VITE_` variable.

Build command and output:

- Build: npm run build
- Output directory: dist

## Post-Deploy Checks

1. Health endpoint returns success.
2. Login flow works (credentials + OTP).
3. Protected pages load for each role.
4. Token refresh works without unexpected logout.
5. Create/read flows for records and dashboard are functional.
6. CSRF cookie is set before state-changing requests.

## Troubleshooting Direction

If issues occur, check:

- Environment variables mismatch
- CORS and cookie settings
- Backend logs for auth/OTP errors
- Frontend network calls for failed API requests
