# Setup Overview

## Requirements

- Node.js and npm
- MongoDB connection
- Optional: Redis
- Email/SMS provider configuration for OTP

## Install

From repository root:

```bash
npm install
npm run install:all
```

## Backend Setup

1. Create backend/.env from backend/.env.example.
2. Fill required values:

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- OTP/email/sms provider fields
- CORS origins

Recommended local values:

- NODE_ENV=development
- PORT=8000
- ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

## Frontend Setup

1. Configure frontend env file.
2. Set API base URL to backend API path.
3. Set app flags such as demo mode based on environment.

Minimum frontend env value:

- VITE_API_BASE_URL=http://localhost:8000/api

## Run Locally

From repository root:

1. Start backend and frontend dev servers:

```bash
npm run dev
```

2. Open frontend and backend endpoints:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- API Docs: http://localhost:8000/api/docs
- Health: http://localhost:8000/api/health

3. Optional run modes:

```bash
npm run dev:backend
npm run dev:frontend
```

4. Seed sample data (if needed):

```bash
npm run seed
```

## Common Validation Checklist

- Backend starts without env validation errors.
- Frontend can call backend login endpoint.
- OTP path works according to test/production mode.
- Authenticated routes load after sign-in.
- Refresh token flow works without forced logout.
