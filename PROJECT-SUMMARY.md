# Finance Dashboard - Project Summary

## 🎯 Project Overview

A modern, full-stack financial management application built with TypeScript, featuring secure OTP-based authentication, real-time analytics, and comprehensive financial tracking capabilities.

## 🚀 Live Application

- **Frontend**: https://finance-103y771kv-devansh-prabhakars-projects.vercel.app
- **Backend API**: https://finance-app-ddaf.onrender.com/api
- **API Documentation**: https://finance-app-ddaf.onrender.com/api/docs

## ⚡ Quick Start

```bash
# Clone and setup
git clone https://github.com/Devanshprabhakar24/Finance-app.git
cd Finance-app-improved
npm install && npm run install:all

# Configure environment (copy .env.example files)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start development servers
npm run dev
```

**Access**: Frontend at http://localhost:3000, Backend at http://localhost:8000

## 🔑 Demo Credentials

### Test Accounts (Multiple Roles)

| Role        | Email                 | Password     | OTP      |
| ----------- | --------------------- | ------------ | -------- |
| **Admin**   | `admin@finance.com`   | `admin123`   | `123456` |
| **Analyst** | `analyst@finance.dev` | `Demo@12345` | `123456` |
| **Viewer**  | `viewer@finance.dev`  | `Demo@12345` | `123456` |

**Role Permissions**:

- **Admin**: Full system access, user management, all operations
- **Analyst**: Data analysis, reporting, create/read records
- **Viewer**: Read-only access to personal data

**📋 Complete Testing Guide**: [TEST-CREDENTIALS.md](./TEST-CREDENTIALS.md)

## 📁 Key Files & Documentation

### 📚 Documentation

- **[README.md](./README.md)** - Complete project overview and features
- **[SETUP.md](./SETUP.md)** - Detailed setup and configuration guide
- **[API.md](./API.md)** - Complete API reference with examples
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and roadmap

### ⚙️ Configuration

- **[package.json](./package.json)** - Monorepo scripts and dependencies
- **[vercel.json](./vercel.json)** - Frontend deployment configuration
- **[render.yaml](./render.yaml)** - Backend deployment configuration

### 🏗️ Architecture

```
Finance-app-improved/
├── backend/          # Node.js/Express API (TypeScript)
├── frontend/         # React SPA (TypeScript + Vite)
├── *.md             # Comprehensive documentation
└── *.json/*.yaml    # Deployment configurations
```

## 🛠️ Tech Stack

### Frontend

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **Lucide Icons**
- **React Query** + **Zustand** + **React Hook Form**
- **PWA** capabilities with offline support

### Backend

- **Node.js** + **Express.js** + **TypeScript**
- **MongoDB** + **Redis** + **JWT Authentication**
- **OTP-based** login with email/SMS verification
- **Comprehensive security** (CORS, rate limiting, validation)

### Deployment

- **Frontend**: Vercel (automatic deployments)
- **Backend**: Render (Docker containerized)
- **Database**: MongoDB Atlas (cloud)
- **CDN**: Cloudinary (file uploads)

## ✨ Key Features

### 🔐 Security First

- OTP-based authentication (email + SMS)
- JWT tokens with refresh mechanism
- Role-based access control (Admin/Analyst/Viewer)
- Rate limiting and CSRF protection

### 💰 Financial Management

- Income/expense tracking with categories
- Real-time dashboard with analytics
- Data visualization and reporting
- Export/import functionality

### 🎨 Modern UX

- Responsive design (mobile-first)
- Dark/light theme support
- Real-time notifications
- Skeleton loading states

## 🚀 Development Workflow

### Local Development

```bash
npm run dev              # Start both frontend and backend
npm run dev:backend      # Backend only (port 8000)
npm run dev:frontend     # Frontend only (port 3000)
```

### Production Build

```bash
npm run build           # Build both applications
npm run build:backend   # Backend TypeScript compilation
npm run build:frontend  # Frontend Vite build
```

### Database Operations

```bash
npm run seed           # Seed database with sample data
```

## 🔧 Environment Configuration

### Required Environment Variables

#### Backend (.env)

```env
MONGODB_URI=mongodb://localhost:27017/finance-dashboard
JWT_ACCESS_SECRET=your-32-char-secret-key
JWT_REFRESH_SECRET=your-32-char-refresh-key
ADMIN_EMAIL=admin@finance.com
ADMIN_PASSWORD=admin123
```

#### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=Finance Dashboard
```

## 📊 API Endpoints

### Authentication

- `POST /api/auth/login` - Login with credentials (sends OTP)
- `POST /api/auth/verify-otp` - Verify OTP and get tokens
- `GET /api/auth/me` - Get current user info

### Financial Records

- `GET /api/records` - Get user's financial records
- `POST /api/records` - Create new record
- `PUT /api/records/:id` - Update record
- `DELETE /api/records/:id` - Delete record

### Dashboard

- `GET /api/dashboard/stats` - Get analytics and statistics

**Full API documentation**: Visit `/api/docs` endpoint

## 🔍 Testing & Verification

### Health Checks

```bash
# Backend health
curl https://finance-app-ddaf.onrender.com/api/health

# Frontend accessibility
curl https://finance-103y771kv-devansh-prabhakars-projects.vercel.app
```

### API Testing

```bash
# Login flow
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@finance.com","password":"admin123"}'
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Errors**: Check Node.js version (18+) and dependencies
2. **Database Connection**: Verify MongoDB URI and network access
3. **CORS Errors**: Update ALLOWED_ORIGINS in backend environment
4. **Authentication Issues**: Check JWT secrets and OTP configuration

### Debug Commands

```bash
# Check environment variables
cd backend && node -e "console.log(process.env)"

# Test database connection
cd backend && npm run seed

# View logs
# Render: Dashboard logs
# Vercel: Function logs
```

## 📈 Performance & Security

### Optimizations

- **Code splitting** with React.lazy()
- **Redis caching** for frequently accessed data
- **Database indexing** for query optimization
- **Asset compression** and minification

### Security Measures

- **Input validation** with Zod schemas
- **Rate limiting** (100 req/15min general, 5 req/15min auth)
- **CSRF protection** for state-changing operations
- **Secure headers** with Helmet.js

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Devanshprabhakar24/Finance-app/issues)
- **Documentation**: Check the comprehensive docs in this repository
- **API Reference**: Interactive docs at `/api/docs`

## 🎯 Next Steps

### For Developers

1. **Read [SETUP.md](./SETUP.md)** for detailed setup instructions
2. **Check [API.md](./API.md)** for complete API reference
3. **Review [DEPLOYMENT.md](./DEPLOYMENT.md)** for production deployment

### For Users

1. **Visit the live application** to explore features
2. **Use demo credentials** to test functionality
3. **Check [README.md](./README.md)** for comprehensive feature overview

---

**🚀 Finance Dashboard - Built with modern web technologies for secure, scalable financial management**

_Last updated: April 5, 2026_
