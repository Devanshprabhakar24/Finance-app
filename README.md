# Finance Dashboard - Full Stack Application

A modern, secure, and scalable financial management platform built with TypeScript, React, and Node.js.

## 🚀 Live Demo

- **Frontend**: [https://finance-103y771kv-devansh-prabhakars-projects.vercel.app](https://finance-103y771kv-devansh-prabhakars-projects.vercel.app)
- **Backend API**: [https://finance-app-ddaf.onrender.com/api](https://finance-app-ddaf.onrender.com/api)
- **API Documentation**: [https://finance-app-ddaf.onrender.com/api/docs](https://finance-app-ddaf.onrender.com/api/docs)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Demo Credentials](#demo-credentials)
- [Test Credentials Guide](./TEST-CREDENTIALS.md)
- [User Account Creation](./USER-ACCOUNT-CREATION.md)

## ✨ Features

### 🔐 Authentication & Security

- **OTP-based Authentication** - Email and SMS verification
- **JWT Token Management** - Access and refresh tokens
- **Role-based Access Control** - Admin, Analyst, Viewer roles
- **CSRF Protection** - Cross-site request forgery prevention
- **Rate Limiting** - API abuse prevention
- **Input Validation** - Zod schema validation

### 💰 Financial Management

- **Transaction Records** - Income and expense tracking
- **Category Management** - Organize transactions by categories
- **Dashboard Analytics** - Visual charts and statistics
- **Real-time Updates** - Live data synchronization
- **Export/Import** - Data backup and restore

### 🎨 User Experience

- **Responsive Design** - Mobile-first approach
- **Dark/Light Theme** - User preference support
- **Progressive Web App** - Offline functionality
- **Real-time Notifications** - Toast messages and alerts
- **Skeleton Loading** - Smooth loading states

### 🛠️ Technical Features

- **TypeScript** - Full type safety
- **Microservices Architecture** - Scalable backend design
- **Database Optimization** - MongoDB with indexing
- **Caching Layer** - Redis for performance
- **File Upload** - Cloudinary integration
- **Email/SMS** - Automated notifications
- **Monitoring** - Health checks and metrics

## 🛠️ Tech Stack

### Frontend

- **React 18** - UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Recharts** - Data visualization
- **Lucide React** - Icon library

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type-safe development
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **Redis** - Caching and sessions
- **JWT** - Authentication tokens
- **Winston** - Logging system
- **Zod** - Input validation
- **Bcrypt** - Password hashing

### DevOps & Deployment

- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **MongoDB Atlas** - Cloud database
- **Cloudinary** - Media management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB database
- Redis server (optional)
- Git

### 1. Clone Repository

```bash
git clone https://github.com/Devanshprabhakar24/Finance-app.git
cd Finance-app-improved
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all project dependencies
npm run install:all
```

### 3. Environment Setup

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

### 4. Configure Environment Variables

See [Environment Setup](#environment-setup) section for detailed configuration.

### 5. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:backend  # Backend on http://localhost:8000
npm run dev:frontend # Frontend on http://localhost:3000
```

### 6. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **API Docs**: http://localhost:8000/api/docs

## 📁 Project Structure

```
Finance-app-improved/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Database, Redis, external services
│   │   ├── middleware/     # Auth, validation, security
│   │   ├── modules/        # Feature modules (auth, records, users)
│   │   ├── utils/          # Helper functions and utilities
│   │   ├── types/          # TypeScript type definitions
│   │   └── server.ts       # Application entry point
│   ├── scripts/            # Database seeding scripts
│   ├── Dockerfile          # Docker configuration
│   ├── package.json        # Dependencies and scripts
│   └── tsconfig.json       # TypeScript configuration
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # State management (Zustand)
│   │   ├── api/            # API client and endpoints
│   │   ├── types/          # TypeScript interfaces
│   │   ├── utils/          # Helper functions
│   │   └── styles/         # Global styles and themes
│   ├── public/             # Static assets
│   ├── package.json        # Dependencies and scripts
│   └── vite.config.ts      # Vite configuration
├── render.yaml             # Backend deployment config
├── vercel.json             # Frontend deployment config
└── package.json            # Monorepo scripts
```

## 🔧 Environment Setup

### Backend Environment Variables

Create `backend/.env` file:

```env
# Server Configuration
NODE_ENV=development
PORT=8000

# Database
MONGODB_URI=mongodb://localhost:27017/finance-dashboard

# JWT Secrets
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Admin User (Optional)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@finance.com
ADMIN_PHONE=+1234567890
ADMIN_FULL_NAME=Admin User

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_EMAIL_TEST_MODE=true
OTP_SMS_TEST_MODE=true
OTP_TEST_CODE=123456

# Email Service (Choose one)
EMAIL_SERVICE=gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Finance Dashboard <noreply@finance.com>

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Redis (Optional)
REDIS_URL=redis://localhost:6379
```

### Frontend Environment Variables

Create `frontend/.env` file:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api

# Application
VITE_APP_NAME=Finance Dashboard

# Cloudinary (for file uploads)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

## 💻 Development

### Available Scripts

#### Root Level

```bash
npm run install:all     # Install all dependencies
npm run dev            # Start both frontend and backend
npm run build          # Build both applications
npm run dev:backend    # Start backend only
npm run dev:frontend   # Start frontend only
npm run build:backend  # Build backend only
npm run build:frontend # Build frontend only
```

#### Backend Scripts

```bash
cd backend
npm run dev           # Start development server with hot reload
npm run build         # Compile TypeScript to JavaScript
npm start            # Start production server
npm run seed         # Seed database with sample data
```

#### Frontend Scripts

```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Development Workflow

1. **Start Development Environment**

   ```bash
   npm run dev
   ```

2. **Make Changes**
   - Backend changes auto-reload with ts-node-dev
   - Frontend changes auto-reload with Vite HMR

3. **Test API Endpoints**
   - Use API documentation at http://localhost:8000/api/docs
   - Test with tools like Postman or curl

4. **Database Operations**
   ```bash
   # Seed database with sample data
   cd backend && npm run seed
   ```

## 🚀 Deployment

### Backend Deployment (Render)

1. **Connect Repository** to Render
2. **Configure Build Settings**:
   - Build Command: `cd backend && npm ci --include=dev && npm run build`
   - Start Command: `cd backend && node dist/server.js`
   - Environment: Node.js

3. **Set Environment Variables** in Render dashboard
4. **Deploy** - Automatic on git push

### Frontend Deployment (Vercel)

1. **Connect Repository** to Vercel
2. **Configure Project Settings**:
   - Framework: Vite
   - Build Command: `npm run build:frontend`
   - Output Directory: `frontend/dist`

3. **Set Environment Variables** in Vercel dashboard
4. **Deploy** - Automatic on git push

### Docker Deployment

```bash
# Build and run backend
cd backend
docker build -t finance-backend .
docker run -p 8000:8000 --env-file .env finance-backend

# Build and run frontend
cd frontend
docker build -t finance-frontend .
docker run -p 3000:3000 finance-frontend
```

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/login

Login with email/phone and password, receives OTP.

**Request:**

```json
{
  "identifier": "admin@finance.com",
  "password": "admin123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent to your email and phone",
  "data": {
    "identifier": "admin@finance.com",
    "expiresAt": "2024-01-01T12:10:00.000Z"
  }
}
```

#### POST /api/auth/verify-otp

Verify OTP and receive authentication tokens.

**Request:**

```json
{
  "identifier": "admin@finance.com",
  "otp": "123456",
  "purpose": "LOGIN"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "user": {
      "id": "user-id",
      "email": "admin@finance.com",
      "name": "Admin User",
      "role": "admin"
    },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### Records Endpoints

#### GET /api/records

Get user's financial records (requires authentication).

#### POST /api/records

Create new financial record (requires authentication).

**Request:**

```json
{
  "type": "income",
  "amount": 1000,
  "description": "Salary payment",
  "category": "salary",
  "date": "2024-01-01T00:00:00.000Z"
}
```

### Dashboard Endpoints

#### GET /api/dashboard/stats

Get dashboard statistics and analytics (requires authentication).

**Response:**

```json
{
  "success": true,
  "data": {
    "totalIncome": 5000,
    "totalExpenses": 3000,
    "balance": 2000,
    "totalRecords": 25,
    "categoryBreakdown": {...},
    "recentRecords": [...]
  }
}
```

## 🔑 Demo Credentials

### Test Accounts (Multiple Roles)

| Role        | Email                 | Password     | OTP      |
| ----------- | --------------------- | ------------ | -------- |
| **Admin**   | `admin@finance.com`   | `admin123`   | `123456` |
| **Analyst** | `analyst@finance.dev` | `Demo@12345` | `123456` |
| **Viewer**  | `viewer@finance.dev`  | `Demo@12345` | `123456` |

**📋 Complete Test Guide**: See [TEST-CREDENTIALS.md](./TEST-CREDENTIALS.md) for detailed role permissions and testing scenarios.

### API Testing

```bash
# Health check
curl https://finance-app-ddaf.onrender.com/api/health

# Login request
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@finance.com","password":"admin123"}'

# Verify OTP
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@finance.com","otp":"123456","purpose":"LOGIN"}'
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/Devanshprabhakar24/Finance-app/issues)
- **Documentation**: Check the `/docs` folder for detailed guides
- **API Reference**: Visit `/api/docs` endpoint for interactive documentation

---

**Built with ❤️ using modern web technologies**
