# Quick Start Guide - Finance Dashboard

## 🚀 Get Started in 5 Minutes

### 1. Clone & Install

```bash
git clone https://github.com/Devanshprabhakar24/Finance-app.git
cd Finance-app-improved
npm install && npm run install:all
```

### 2. Environment Setup

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL

# Frontend
cp frontend/.env.example frontend/.env
# Default settings work for local development
```

### 3. Start Development

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000/api
- API Docs: http://localhost:8000/api/docs

### 4. Login with Demo Accounts

Choose any role to test different permissions:

| Role        | Email                 | Password     | OTP      |
| ----------- | --------------------- | ------------ | -------- |
| **Admin**   | `admin@finance.com`   | `admin123`   | `123456` |
| **Analyst** | `analyst@finance.dev` | `Demo@12345` | `123456` |
| **Viewer**  | `viewer@finance.dev`  | `Demo@12345` | `123456` |

**📋 Role Details**: See [TEST-CREDENTIALS.md](./TEST-CREDENTIALS.md) for permissions and testing scenarios.

## 🎯 Live Demo

- **App**: https://finance-103y771kv-devansh-prabhakars-projects.vercel.app
- **API**: https://finance-app-ddaf.onrender.com/api

## 📚 Need More Help?

- **Complete Setup**: [SETUP.md](./SETUP.md)
- **API Reference**: [API.md](./API.md)
- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Full Documentation**: [README.md](./README.md)

## 🔧 Essential Commands

```bash
# Development
npm run dev              # Start both frontend & backend
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only

# Production
npm run build           # Build both applications
npm run seed            # Seed database with sample data

# Individual services
cd backend && npm run dev    # Backend development
cd frontend && npm run dev   # Frontend development
```

## 🔑 Environment Variables (Minimum Required)

### Backend (.env)

```env
MONGODB_URI=mongodb://localhost:27017/finance-dashboard
JWT_ACCESS_SECRET=your-minimum-32-character-secret-key
JWT_REFRESH_SECRET=your-minimum-32-character-refresh-key
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## ✅ Verify Setup

1. **Backend Health**: http://localhost:8000/api/health
2. **Frontend Loading**: http://localhost:3000
3. **Login Works**: Use demo credentials above
4. **API Docs**: http://localhost:8000/api/docs

---

**That's it! You're ready to start developing. 🎉**
