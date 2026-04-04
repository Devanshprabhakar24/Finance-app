# Zorvyn - Quick Setup Guide

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Gmail account (for email OTP)
- Cloudinary account (for file uploads)

---

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT Secrets (generate strong random strings)
JWT_ACCESS_SECRET=your_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars

# Email (Gmail)
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="Zorvyn <your_gmail@gmail.com>"

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# OTP Configuration
OTP_EMAIL_TEST_MODE=false
OTP_SMS_TEST_MODE=true
OTP_TEST_CODE=123456
```

### 3. Seed Database (Optional)

```bash
npm run seed
```

Creates:

- Admin: admin@wombto18.com / admin123 / +919999999999
- Analyst: analyst@finance.dev / admin123 / +912222222222
- Viewer: viewer@finance.dev / admin123 / +913333333333

### 4. Start Server

```bash
npm run dev
```

Server runs on http://localhost:5000

API Docs: http://localhost:5000/api/docs

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Zorvyn
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### 3. Start Development Server

```bash
npm run dev
```

App runs on http://localhost:3000

---

## Test Credentials

### Admin Account

- Email: admin@wombto18.com
- Password: admin123
- Phone: +919999999999
- SMS OTP: 123456 (test mode)

### Analyst Account

- Email: analyst@finance.dev
- Password: admin123
- Phone: +912222222222

### Viewer Account

- Email: viewer@finance.dev
- Password: admin123
- Phone: +913333333333

---

## OTP Configuration

### Email OTP

- Real emails sent via Gmail
- Check inbox for verification code
- Set `OTP_EMAIL_TEST_MODE=false` in backend .env

### SMS OTP

- Test mode enabled by default
- Use code: 123456
- Set `OTP_SMS_TEST_MODE=true` in backend .env

---

## Quick Commands

### Backend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run seed         # Seed database
npm test             # Run tests
```

### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## Troubleshooting

### MongoDB Connection Issues

- Verify MONGODB_URI is correct
- Check IP whitelist in MongoDB Atlas
- Ensure network connectivity

### Email Not Sending

- Verify Gmail App Password is correct
- Check SMTP_USER and SMTP_PASS
- Enable "Less secure app access" if needed

### Port Already in Use

```bash
# Backend (port 5000)
lsof -ti:5000 | xargs kill -9

# Frontend (port 3000)
lsof -ti:3000 | xargs kill -9
```

---

## Next Steps

1. Review API documentation: http://localhost:5000/api/docs
2. Read main README.md for detailed architecture
3. Check ARCHITECTURE.md for system design
4. Review CONTRIBUTING.md for development guidelines

---

**Zorvyn - Secure, Compliant & Intelligent Financial Systems**
