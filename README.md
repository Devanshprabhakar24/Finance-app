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

| Role    | Email           | Password      | Access                                  |
| ------- | --------------- | ------------- | --------------------------------------- |
| Admin   | admin@fin.com   | Admin@123     | Full access — users, records, analytics |
| Analyst | analyst@fin.dev | Analyst123@   | Records + analytics, no user management |
| Viewer  | Register to see   | Register to see | Read-only dashboard                     |

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

---

## Environment Variables

### Backend (`backend/.env`)

| Variable                | Required | Description                                        | Example                            |
| ----------------------- | -------- | -------------------------------------------------- | ---------------------------------- |
| `PORT`                  | yes      | Server port                                        | `8000`                             |
| `NODE_ENV`              | yes      | Environment                                        | `development` / `production`       |
| `MONGODB_URI`           | yes      | MongoDB connection string                          | `mongodb+srv://...`                |
| `JWT_ACCESS_SECRET`     | yes      | JWT signing secret (min 32 chars)                  | random string                      |
| `JWT_REFRESH_SECRET`    | yes      | JWT refresh secret (min 32 chars)                  | random string                      |
| `JWT_ACCESS_EXPIRES`    | no       | Access token TTL                                   | `24h`                              |
| `JWT_REFRESH_EXPIRES`   | no       | Refresh token TTL                                  | `30d`                              |
| `OTP_EMAIL_TEST_MODE`   | no       | Use test OTP instead of real email                 | `true` / `false`                   |
| `OTP_SMS_TEST_MODE`     | no       | Use test OTP instead of real SMS                   | `true` / `false`                   |
| `OTP_TEST_CODE`         | no       | Fixed OTP used in test mode                        | `123456`                           |
| `OTP_EXPIRY_MINUTES`    | no       | OTP validity window                                | `10`                               |
| `OTP_MAX_ATTEMPTS`      | no       | Max OTP attempts before lockout                    | `5`                                |
| `EMAIL_SERVICE`         | yes      | Email provider                                     | `gmail` / `brevo`                  |
| `SMTP_HOST`             | yes      | SMTP server host                                   | `smtp.gmail.com`                   |
| `SMTP_PORT`             | yes      | SMTP port                                          | `587`                              |
| `SMTP_USER`             | yes      | SMTP login email                                   | `you@gmail.com`                    |
| `SMTP_PASS`             | yes      | SMTP app password                                  | Gmail app password                 |
| `EMAIL_FROM`            | yes      | From address in emails                             | `Finance Dashboard <no-reply@...>` |
| `BREVO_API_KEY`         | if Brevo | Brevo transactional email API key                  | `xkeysib-...`                      |
| `BREVO_FROM_EMAIL`      | if Brevo | Sender email for Brevo                             | `you@domain.com`                   |
| `TWILIO_ACCOUNT_SID`    | yes      | Twilio account SID                                 | `ACxxxxxxxx`                       |
| `TWILIO_AUTH_TOKEN`     | yes      | Twilio auth token                                  | `xxxxxxxx`                         |
| `TWILIO_PHONE_NUMBER`   | yes      | Twilio SMS number (E.164)                          | `+1XXXXXXXXXX`                     |
| `CLOUDINARY_CLOUD_NAME` | yes      | Cloudinary cloud name                              | `dq9fmg62v`                        |
| `CLOUDINARY_API_KEY`    | yes      | Cloudinary API key                                 | `598977...`                        |
| `CLOUDINARY_API_SECRET` | yes      | Cloudinary API secret                              | `OexyFd...`                        |
| `ALLOWED_ORIGINS`       | yes      | Comma-separated allowed CORS origins               | `https://yourapp.vercel.app`       |
| `REDIS_URL`             | no       | Redis URL for rate limiting (falls back to memory) | `redis://...`                      |
| `ADMIN_EMAIL`           | no       | Admin account email (for initial setup)            | `admin@fin.com`                |
| `ADMIN_PASSWORD`        | no       | Admin account password                             | `Admin@123`                        |
| `ADMIN_PHONE`           | no       | Admin phone in E.164 format                        | `+919999999999`                    |
| `ADMIN_FULL_NAME`       | no       | Admin display name                                 | `System Administrator`             |

### Frontend (`frontend/.env`)

| Variable                     | Required | Description                          | Example                                     |
| ---------------------------- | -------- | ------------------------------------ | ------------------------------------------- |
| `VITE_API_BASE_URL`          | yes      | Backend API base URL                 | `https://finance-app-ddaf.onrender.com/api` |
| `VITE_APP_NAME`              | no       | App name shown in UI                 | `Finance Dashboard`                         |
| `VITE_APP_DESCRIPTION`       | no       | App description for meta tags        | `Secure Financial Systems`                  |
| `VITE_APP_TAGLINE`           | no       | Landing page tagline                 | `Enterprise-Grade Financial Platform`       |
| `VITE_COMPANY_NAME`          | no       | Company name in footer/legal         | `Finance Dashboard`                         |
| `VITE_SUPPORT_EMAIL`         | no       | Support email shown in UI            | `support@finance-dashboard.dev`             |
| `VITE_COMPANY_WEBSITE`       | no       | Company website link                 | `https://finance-dashboard.dev`             |
| `VITE_FRONTEND_URL`          | no       | Frontend URL (for redirects)         | `https://finance-app-one-zeta.vercel.app`   |
| `VITE_DOCS_URL`              | no       | API docs URL                         | `https://.../api/docs`                      |
| `VITE_REPOSITORY_URL`        | no       | GitHub repo URL                      | `https://github.com/...`                    |
| `VITE_REGISTRATION_ENABLED`  | no       | Enable/disable user registration     | `true` / `false`                            |
| `VITE_DEMO_MODE`             | no       | Show demo credentials on login page  | `true` / `false`                            |
| `VITE_ANALYTICS_ENABLED`     | no       | Enable analytics tracking            | `true` / `false`                            |
| `VITE_FILE_UPLOAD_ENABLED`   | no       | Enable file upload features          | `true` / `false`                            |
| `VITE_PRIMARY_COLOR`         | no       | Primary brand color (hex)            | `#6366f1`                                   |
| `VITE_SECONDARY_COLOR`       | no       | Secondary brand color (hex)          | `#8b5cf6`                                   |
| `VITE_LOGO_URL`              | no       | Custom logo URL                      | leave empty for text logo                   |
| `VITE_CLOUDINARY_CLOUD_NAME` | no       | Cloudinary cloud name (for uploads)  | `dq9fmg62v`                                 |
| `VITE_DEMO_ADMIN_EMAIL`      | no       | Demo admin email shown on login      | `admin@finance.com`                         |
| `VITE_DEMO_ADMIN_PASSWORD`   | no       | Demo admin password shown on login   | `admin123`                                  |
| `VITE_DEMO_ANALYST_EMAIL`    | no       | Demo analyst email shown on login    | `analyst@finance.dev`                       |
| `VITE_DEMO_ANALYST_PASSWORD` | no       | Demo analyst password shown on login | `Demo@12345`                                |
| `VITE_DEMO_VIEWER_EMAIL`     | no       | Demo viewer email shown on login     | `viewer@finance.dev`                        |
| `VITE_DEMO_VIEWER_PASSWORD`  | no       | Demo viewer password shown on login  | `Demo@12345`                                |

> Copy `backend/.env.example` and `frontend/.env.example` as starting points.
