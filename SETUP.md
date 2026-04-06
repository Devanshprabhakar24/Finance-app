# Setup Guide - Finance Dashboard

Complete step-by-step setup guide for local development and production deployment.

## 📋 Prerequisites

### Required Software

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Git** 2.30.0 or higher
- **MongoDB** 6.0.0 or higher (local or cloud)

### Optional Software

- **Redis** 7.0.0 or higher (for caching)
- **Docker** 20.10.0 or higher (for containerization)

### External Services

- **MongoDB Atlas** (cloud database)
- **Cloudinary** (file uploads)
- **Twilio** (SMS notifications)
- **Gmail/SMTP** (email notifications)

## 🚀 Local Development Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/Devanshprabhakar24/Finance-app.git
cd Finance-app-improved
```

### Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Install all project dependencies
npm run install:all
```

### Step 3: Database Setup

#### Option A: Local MongoDB

```bash
# Install MongoDB locally
# macOS
brew install mongodb-community

# Ubuntu
sudo apt-get install mongodb

# Start MongoDB service
mongod --dbpath /path/to/your/db
```

#### Option B: MongoDB Atlas (Recommended)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create new cluster
3. Get connection string
4. Whitelist your IP address

### Step 4: Environment Configuration

#### Backend Environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finance-dashboard

# JWT Secrets (Generate strong secrets)
JWT_ACCESS_SECRET=your-32-char-secret-key-here-min
JWT_REFRESH_SECRET=your-32-char-refresh-key-here-min

# Admin User
ADMIN_EMAIL=admin@finance.com
ADMIN_PASSWORD=admin123
ADMIN_PHONE=+1234567890

# Email Configuration (Gmail)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Finance Dashboard <noreply@finance.com>

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Twilio (Optional)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Frontend Environment

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=Finance Dashboard
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

### Step 5: Generate JWT Secrets

```bash
# Generate secure random strings (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 6: Setup External Services

#### Gmail App Password

1. Enable 2-factor authentication
2. Go to Google Account settings
3. Generate App Password
4. Use in `SMTP_PASS`

#### Cloudinary Setup

1. Create account at [Cloudinary](https://cloudinary.com)
2. Get cloud name, API key, and secret
3. Add to environment variables

#### Twilio Setup

1. Create account at [Twilio](https://www.twilio.com)
2. Get Account SID and Auth Token
3. Purchase phone number
4. Add to environment variables

### Step 7: Database Seeding

```bash
cd backend
npm run seed
```

### Step 8: Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:backend  # http://localhost:8000
npm run dev:frontend # http://localhost:3000
```

### Step 9: Verify Setup

1. **Backend Health**: http://localhost:8000/api/health
2. **API Docs**: http://localhost:8000/api/docs
3. **Frontend**: http://localhost:3000
4. **Test Login**: Use admin credentials

## 🔧 Configuration Details

### Environment Variables Reference

#### Backend Required Variables

```env
NODE_ENV=development
PORT=8000
MONGODB_URI=mongodb://localhost:27017/finance-dashboard
JWT_ACCESS_SECRET=minimum-32-characters-secret
JWT_REFRESH_SECRET=minimum-32-characters-secret
```

#### Backend Optional Variables

```env
# Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@finance.com
ADMIN_PHONE=+1234567890
ADMIN_FULL_NAME=Admin User

# JWT Configuration
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_EMAIL_TEST_MODE=true
OTP_SMS_TEST_MODE=true
OTP_TEST_CODE=123456

# Email Service
EMAIL_SERVICE=gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Finance Dashboard <noreply@finance.com>

# Alternative: Brevo (SendinBlue)
EMAIL_SERVICE=brevo
BREVO_API_KEY=your-brevo-api-key
BREVO_FROM_EMAIL=noreply@finance.com

# SMS Service
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# File Upload
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Caching (Optional)
REDIS_URL=redis://localhost:6379
```

#### Frontend Variables

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=Finance Dashboard
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

### Database Configuration

#### MongoDB Connection String Formats

```bash
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/finance-dashboard

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finance-dashboard

# MongoDB with authentication
MONGODB_URI=mongodb://username:password@localhost:27017/finance-dashboard

# MongoDB replica set
MONGODB_URI=mongodb://host1:27017,host2:27017,host3:27017/finance-dashboard?replicaSet=rs0
```

#### Redis Configuration

```bash
# Local Redis
REDIS_URL=redis://localhost:6379

# Redis with password
REDIS_URL=redis://:password@localhost:6379

# Redis Cloud
REDIS_URL=redis://username:password@host:port
```

## 🐳 Docker Setup

### Development with Docker

```bash
# Backend
cd backend
docker build -t finance-backend-dev .
docker run -p 8000:8000 --env-file .env finance-backend-dev

# Frontend
cd frontend
docker build -t finance-frontend-dev .
docker run -p 3000:3000 finance-frontend-dev
```

### Docker Compose (Full Stack)

Create `docker-compose.dev.yml`:

```yaml
version: "3.8"
services:
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: finance-dashboard

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/finance-dashboard
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_BASE_URL=http://localhost:8000/api
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  mongodb_data:
```

Run with:

```bash
docker-compose -f docker-compose.dev.yml up
```

## 🚀 Production Deployment

### Backend Deployment (Render)

1. **Create Render Account**
2. **Connect GitHub Repository**
3. **Configure Service**:
   - **Type**: Web Service
   - **Environment**: Node
   - **Build Command**: `cd backend && npm ci --include=dev && npm run build`
   - **Start Command**: `cd backend && node dist/server.js`

4. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=8000
   MONGODB_URI=your-production-mongodb-uri
   JWT_ACCESS_SECRET=your-production-secret
   JWT_REFRESH_SECRET=your-production-secret
   # ... other production variables
   ```

### Frontend Deployment (Vercel)

1. **Create Vercel Account**
2. **Import GitHub Repository**
3. **Configure Project**:
   - **Framework**: Vite
   - **Build Command**: `npm run build:frontend`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install && npm run install:all`

4. **Environment Variables**:
   ```env
   VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
   VITE_APP_NAME=Finance Dashboard
   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
   ```

### Production Environment Setup

#### Security Considerations

```env
# Use strong, unique secrets
JWT_ACCESS_SECRET=64-character-random-string
JWT_REFRESH_SECRET=64-character-random-string

# Disable test modes
OTP_EMAIL_TEST_MODE=false
OTP_SMS_TEST_MODE=false

# Configure proper CORS
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app

# Use production database
MONGODB_URI=mongodb+srv://prod-user:strong-password@prod-cluster.mongodb.net/finance-dashboard
```

#### Performance Optimization

```env
# Enable Redis caching
REDIS_URL=redis://your-redis-instance:6379

# Configure email service
EMAIL_SERVICE=brevo  # More reliable for production
BREVO_API_KEY=your-production-api-key
```

## 🔍 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed

```bash
# Check connection string
echo $MONGODB_URI

# Test connection
mongosh "mongodb+srv://cluster.mongodb.net/finance-dashboard" --username your-username

# Common fixes:
# - Whitelist IP address in MongoDB Atlas
# - Check username/password
# - Verify database name
```

#### 2. JWT Secret Too Short

```bash
# Generate proper secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Error: JWT_ACCESS_SECRET must be at least 32 characters
# Solution: Use generated secret above
```

#### 3. CORS Errors

```bash
# Update ALLOWED_ORIGINS in backend/.env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://your-domain.vercel.app
```

#### 4. Email/SMS Not Working

```bash
# Check test mode settings
OTP_EMAIL_TEST_MODE=true  # For development
OTP_SMS_TEST_MODE=true    # For development

# Verify credentials
# Gmail: Use App Password, not regular password
# Twilio: Check Account SID and Auth Token
```

#### 5. Build Failures

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Backend TypeScript errors
cd backend
npm run build

# Frontend build errors
cd frontend
npm run build
```

### Debug Commands

```bash
# Check environment variables
cd backend && node -e "console.log(process.env)"

# Test database connection
cd backend && node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('DB Connected'))
  .catch(err => console.error('DB Error:', err));
"

# Test API endpoints
curl http://localhost:8000/api/health
curl http://localhost:8000/api/docs
```

### Logs and Monitoring

```bash
# Backend logs
cd backend && npm run dev  # Development logs
tail -f logs/all.log       # Production logs

# Frontend logs
cd frontend && npm run dev  # Development console

# Production logs
# Render: Check dashboard logs
# Vercel: Check function logs
```

## 📞 Support

If you encounter issues:

1. **Check this guide** for common solutions
2. **Review error logs** for specific error messages
3. **Verify environment variables** are correctly set
4. **Test external services** (MongoDB, Cloudinary, etc.)
5. **Create GitHub issue** with detailed error information

---

**Happy coding! 🚀**
