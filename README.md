# Finance App Improved

This repository contains a full-stack finance dashboard with role-based access, OTP login flow, and analytics features.

## Overview Docs

- [PROJECT-OVERVIEW.md](./PROJECT-OVERVIEW.md)
- [SETUP-OVERVIEW.md](./SETUP-OVERVIEW.md)
- [DEPLOYMENT-OVERVIEW.md](./DEPLOYMENT-OVERVIEW.md)
- [APP-LOGIN-GUIDE.md](./APP-LOGIN-GUIDE.md)

## Live Endpoints

- Frontend: https://finance-app-one-zeta.vercel.app
- Backend API: https://finance-app-ddaf.onrender.com/api
- Backend Health: https://finance-app-ddaf.onrender.com/api/health

## Project Structure

- `backend/` - API server, auth, records, users, dashboard, middleware
- `frontend/` - React app, routes, pages, API client, state management
- `render.yaml` - backend deploy config
- `vercel.json` - frontend deploy config

## Core Capabilities

- OTP-based authentication
- Role-based permissions (Admin, Analyst, Viewer)
- Dashboard analytics and records management
- File upload integration and environment-driven configuration

## Quick Start

1. Install dependencies:

```bash
npm install
npm run install:all
```

2. Configure environment files:

- backend/.env (from backend/.env.example)
- frontend/.env (set VITE_API_BASE_URL)

3. Start both apps:

```bash
npm run dev
```

4. Open local apps:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- API Docs: http://localhost:8000/api/docs

5. Sign in using role accounts from [APP-LOGIN-GUIDE.md](./APP-LOGIN-GUIDE.md).

## Common Commands

```bash
# Root
npm run dev
npm run dev:backend
npm run dev:frontend
npm run build:backend
npm run build:frontend
npm run seed

# Backend only
cd backend
npm run dev
npm run build
npm start

# Frontend only
cd frontend
npm run dev
npm run build
npm run preview
```

For exact setup and deployment details, use the overview docs linked above.
