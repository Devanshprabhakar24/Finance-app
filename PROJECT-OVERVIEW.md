# Project Overview

## What This App Is

Finance App Improved is a full-stack financial management platform built with TypeScript.

It provides:

- Authentication with OTP verification
- Role-based access control
- Financial record tracking
- Analytics and dashboard views

## Tech Snapshot

- Frontend: React, TypeScript, Vite, React Query, Zustand
- Backend: Node.js, Express, TypeScript, Mongoose, Zod
- Infrastructure: Vercel (frontend), Render (backend), MongoDB Atlas

## Main Components

### Frontend

- React + Vite + TypeScript
- API layer in `frontend/src/api`
- Page routing and guarded routes
- State management and token handling

### Backend

- Node.js + Express + TypeScript
- Modules for auth, users, records, dashboard
- Middleware for auth, validation, errors, rate limit, CSRF
- Config for DB, mail, twilio, cloudinary, redis

## Role Model

- Admin: full control, user management
- Analyst: analytics-focused operational access
- Viewer: limited/read-focused access

See login behavior and OTP notes in [APP-LOGIN-GUIDE.md](./APP-LOGIN-GUIDE.md).

## Typical Flow

1. User enters credentials.
2. OTP verification completes sign-in.
3. Access token is used for protected APIs.
4. Refresh flow keeps session active.
5. Permissions control route and action visibility.

## Session and Security Notes

- Access token is attached to authorized requests.
- Refresh token path is cookie-based.
- CSRF token is applied for mutating requests.
- Middleware enforces auth and permission checks.

## Where to Go Next

- Setup and local run: [SETUP-OVERVIEW.md](./SETUP-OVERVIEW.md)
- Production rollout: [DEPLOYMENT-OVERVIEW.md](./DEPLOYMENT-OVERVIEW.md)
- Login and role usage: [APP-LOGIN-GUIDE.md](./APP-LOGIN-GUIDE.md)
