# Finance Dashboard

A full-stack finance management platform with OTP-based authentication, role-based access control, analytics, and file uploads.

## Live App

| Service      | URL                                              |
| ------------ | ------------------------------------------------ |
| Frontend     | https://finance-app-one-zeta.vercel.app          |
| Backend API  | https://finance-app-ddaf.onrender.com/api        |
| Health Check | https://finance-app-ddaf.onrender.com/api/health |

---

## Login

Go to https://finance-app-one-zeta.vercel.app and sign in with one of the demo accounts below.

### Demo Accounts

| Role    | Email               | Password   | Access                                  |
| ------- | ------------------- | ---------- | --------------------------------------- |
| Admin   | admin@fin.com   | Admin@123   | Full access — users, records, analytics |
| Analyst | analyst@finance.dev | Analyst123@ | Records + analytics, no user management |
| Viewer  | create by own  | create by own| Read-only dashboard                     |

### OTP Step

After entering your email and password, you'll be asked for a 6-digit OTP.

- The app is in **test mode** — use `123456` as the OTP every time.
- In real production mode the OTP is sent to your email and phone.

### Login Flow

1. Enter email + password → click **Sign In**
2. Enter OTP `123456` → click verify (or it auto-submits)
3. You land on the dashboard

---

## Roles & Permissions

| Feature                        | Admin | Analyst | Viewer |
| ------------------------------ | ----- | ------- | ------ |
| View dashboard                 | ✅    | ✅      | ✅     |
| View records                   | ✅    | ✅      | ✅     |
| Create / edit / delete records | ✅    | ❌      | ❌     |
| View analytics                 | ✅    | ✅      | ❌     |
| Manage users                   | ✅    | ❌      | ❌     |
| Upload files / avatars         | ✅    | ❌      | ❌     |

---

## Project Structure

```
Finance-app-improved/
├── backend/          # Express API — auth, records, users, dashboard
├── frontend/         # React + Vite — pages, components, state
├── render.yaml       # Render backend deploy config
└── vercel.json       # Vercel frontend deploy config
```

---

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Setup

```bash
# Install all dependencies
cd backend && npm install
cd ../frontend && npm install
```

```bash
# Configure environment
cp backend/.env.example backend/.env   # fill in your values
cp frontend/.env.example frontend/.env # set VITE_API_BASE_URL=http://localhost:8000/api
```

```bash
# Start backend (port 8000)
cd backend && npm run dev

# Start frontend (port 3000)
cd frontend && npm run dev
```

Open http://localhost:3000 — use OTP `123456` in dev mode.

### Useful Commands

```bash
# Backend
npm run dev      # dev server with hot reload
npm run build    # compile TypeScript
npm start        # run compiled build

# Frontend
npm run dev      # Vite dev server
npm run build    # production build
npm run preview  # preview production build
```

---

## Tech Stack

**Frontend** — React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Query, React Hook Form, Zod, Recharts

**Backend** — Node.js, Express, TypeScript, MongoDB + Mongoose, JWT, Nodemailer, Twilio, Cloudinary, Winston

**Infrastructure** — Vercel (frontend), Render (backend), MongoDB Atlas

---

## Key Features

- OTP-based login (email + SMS, test mode uses `123456`)
- Role-based access control (Admin / Analyst / Viewer)
- Financial records with CRUD, search, filters, pagination
- Dashboard analytics with charts
- File attachments on records (Cloudinary)
- Profile picture upload
- Dark mode UI
- Rate limiting, JWT refresh rotation, request correlation IDs
