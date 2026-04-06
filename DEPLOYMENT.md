# Deployment Guide - Finance Dashboard

Complete deployment guide for production environments including Vercel, Render, Docker, and other platforms.

## 🚀 Deployment Overview

### Architecture

- **Frontend**: React SPA deployed on Vercel
- **Backend**: Node.js API deployed on Render
- **Database**: MongoDB Atlas (cloud)
- **Cache**: Redis Cloud (optional)
- **CDN**: Cloudinary for file uploads

### Live URLs

- **Frontend**: https://finance-103y771kv-devansh-prabhakars-projects.vercel.app
- **Backend**: https://finance-app-ddaf.onrender.com/api
- **API Docs**: https://finance-app-ddaf.onrender.com/api/docs

## 📋 Pre-deployment Checklist

### Environment Setup

- [ ] MongoDB Atlas cluster created
- [ ] Cloudinary account configured
- [ ] Twilio account setup (for SMS)
- [ ] Email service configured (Gmail/Brevo)
- [ ] Domain names registered (optional)
- [ ] SSL certificates ready (handled by platforms)

### Code Preparation

- [ ] All environment variables documented
- [ ] Production builds tested locally
- [ ] Database migrations/seeding scripts ready
- [ ] Error handling and logging configured
- [ ] Security configurations reviewed

## 🎯 Frontend Deployment (Vercel)

### Step 1: Prepare Repository

```bash
# Ensure clean build
cd frontend
npm run build

# Test production build locally
npm run preview
```

### Step 2: Vercel Setup

1. **Create Vercel Account**: https://vercel.com
2. **Import Repository**: Connect GitHub repository
3. **Configure Project Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: Leave empty (monorepo setup)
   - **Build Command**: `npm run build:frontend`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install && npm run install:all`

### Step 3: Environment Variables

Add in Vercel dashboard:

```env
VITE_API_BASE_URL=https://finance-app-ddaf.onrender.com/api
VITE_APP_NAME=Finance Dashboard
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

### Step 4: Deploy

```bash
# Automatic deployment on git push
git add .
git commit -m "Deploy to production"
git push origin main
```

### Step 5: Custom Domain (Optional)

1. **Add Domain** in Vercel dashboard
2. **Configure DNS** records:

   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com

   Type: A
   Name: @
   Value: 76.76.19.61
   ```

### Vercel Configuration File

Create `vercel.json`:

```json
{
  "version": 2,
  "buildCommand": "npm run build:frontend",
  "outputDirectory": "frontend/dist",
  "installCommand": "npm install && npm run install:all",
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "https://finance-app-ddaf.onrender.com/api",
    "VITE_APP_NAME": "Finance Dashboard",
    "VITE_CLOUDINARY_CLOUD_NAME": "your-cloud-name"
  }
}
```

## 🖥️ Backend Deployment (Render)

### Step 1: Prepare Backend

```bash
# Test production build
cd backend
npm run build
npm start
```

### Step 2: Render Setup

1. **Create Render Account**: https://render.com
2. **Create Web Service**: Connect GitHub repository
3. **Configure Service**:
   - **Name**: finance-dashboard-backend
   - **Environment**: Node
   - **Region**: Oregon (or closest to users)
   - **Branch**: main
   - **Build Command**: `cd backend && npm ci --include=dev && npm run build`
   - **Start Command**: `cd backend && node dist/server.js`

### Step 3: Environment Variables

Add in Render dashboard:

```env
NODE_ENV=production
PORT=8000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finance-dashboard

# JWT Secrets (Generate strong 64-character secrets)
JWT_ACCESS_SECRET=your-64-character-production-secret-key-here-very-secure
JWT_REFRESH_SECRET=your-64-character-production-refresh-key-here-very-secure
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PHONE=+1234567890
ADMIN_FULL_NAME=Admin User

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_EMAIL_TEST_MODE=false
OTP_SMS_TEST_MODE=false
OTP_TEST_CODE=123456

# Email Service (Production)
EMAIL_SERVICE=brevo
BREVO_API_KEY=your-brevo-api-key
BREVO_FROM_EMAIL=noreply@yourdomain.com

# SMS Service
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# File Upload
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Caching (Optional)
REDIS_URL=redis://username:password@host:port
```

### Step 4: Health Check

Configure health check path: `/api/health`

### Render Configuration File

Create `render.yaml`:

```yaml
services:
  - type: web
    name: finance-dashboard-backend
    env: node
    region: oregon
    plan: free # or starter/standard for production
    runtime: node
    buildCommand: cd backend && npm ci --include=dev && npm run build
    startCommand: cd backend && node dist/server.js
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8000
      # Add other environment variables here
```

## 🐳 Docker Deployment

### Backend Dockerfile

```dockerfile
# Multi-stage build for production optimization
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

# Set environment
ENV NODE_ENV=production

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/server.js"]
```

### Frontend Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose (Full Stack)

```yaml
version: "3.8"

services:
  mongodb:
    image: mongo:6.0
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: finance-dashboard
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:password@mongodb:27017/finance-dashboard?authSource=admin
      - REDIS_URL=redis://redis:6379
      - JWT_ACCESS_SECRET=your-secret-key
      - JWT_REFRESH_SECRET=your-refresh-key
    depends_on:
      - mongodb
      - redis
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
  redis_data:
```

### Deploy with Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale backend=3

# Stop services
docker-compose down
```

## ☁️ Cloud Platform Deployments

### AWS Deployment

#### Using AWS App Runner

1. **Create App Runner Service**
2. **Connect GitHub Repository**
3. **Configure Build**:
   ```yaml
   version: 1.0
   runtime: nodejs18
   build:
     commands:
       build:
         - cd backend
         - npm ci --include=dev
         - npm run build
   run:
     runtime-version: 18
     command: cd backend && node dist/server.js
     network:
       port: 8000
       env: PORT
   ```

#### Using Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize application
eb init finance-dashboard

# Create environment
eb create production

# Deploy
eb deploy
```

### Google Cloud Platform

#### Using Cloud Run

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/finance-backend

# Deploy to Cloud Run
gcloud run deploy finance-backend \
  --image gcr.io/PROJECT_ID/finance-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Microsoft Azure

#### Using Container Instances

```bash
# Create resource group
az group create --name finance-dashboard --location eastus

# Deploy container
az container create \
  --resource-group finance-dashboard \
  --name finance-backend \
  --image your-registry/finance-backend:latest \
  --dns-name-label finance-api \
  --ports 8000
```

## 🔧 Database Deployment

### MongoDB Atlas Setup

1. **Create Cluster**: https://cloud.mongodb.com
2. **Configure Network Access**: Add IP whitelist (0.0.0.0/0 for cloud deployments)
3. **Create Database User**: With read/write permissions
4. **Get Connection String**: Use in MONGODB_URI

### Redis Cloud Setup

1. **Create Account**: https://redis.com/redis-enterprise-cloud/
2. **Create Database**: Choose region close to backend
3. **Get Connection URL**: Use in REDIS_URL

### Database Migration

```bash
# Seed production database
cd backend
NODE_ENV=production npm run seed

# Or use MongoDB Compass/CLI
mongosh "mongodb+srv://cluster.mongodb.net/finance-dashboard" --username admin
```

## 🔐 Security Configuration

### Environment Variables Security

```bash
# Generate secure secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Use different secrets for each environment
# Development: 32-character secrets
# Production: 64-character secrets
```

### CORS Configuration

```env
# Development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### SSL/TLS

- **Vercel**: Automatic SSL certificates
- **Render**: Automatic SSL certificates
- **Custom domains**: Use Let's Encrypt or CloudFlare

## 📊 Monitoring & Logging

### Health Checks

```bash
# Backend health
curl https://finance-app-ddaf.onrender.com/api/health

# Frontend health
curl https://yourdomain.com

# Database health (from backend logs)
```

### Logging Configuration

```env
# Production logging
NODE_ENV=production  # Enables structured JSON logging
LOG_LEVEL=info       # info, warn, error
```

### Monitoring Services

- **Render**: Built-in metrics and logs
- **Vercel**: Analytics and performance monitoring
- **External**: New Relic, DataDog, Sentry

## 🚨 Troubleshooting

### Common Deployment Issues

#### 1. Build Failures

```bash
# Check build logs
# Render: View build logs in dashboard
# Vercel: Check function logs

# Common fixes:
# - Ensure all dependencies are in package.json
# - Check Node.js version compatibility
# - Verify environment variables
```

#### 2. Database Connection Issues

```bash
# Test connection string
mongosh "your-connection-string"

# Common fixes:
# - Whitelist IP addresses in MongoDB Atlas
# - Check username/password
# - Verify network access rules
```

#### 3. CORS Errors

```bash
# Update ALLOWED_ORIGINS
ALLOWED_ORIGINS=https://your-frontend-domain.com

# Check preflight requests
curl -X OPTIONS https://your-api-domain.com/api/auth/login \
  -H "Origin: https://your-frontend-domain.com" \
  -H "Access-Control-Request-Method: POST"
```

#### 4. Environment Variable Issues

```bash
# Verify variables are set
curl https://your-api-domain.com/api/health

# Check logs for missing variables
# Render: View logs in dashboard
# Vercel: Check function logs
```

### Rollback Procedures

```bash
# Render: Redeploy previous commit
git revert HEAD
git push origin main

# Vercel: Use dashboard to rollback deployment
# Or redeploy previous commit

# Database: Restore from backup if needed
```

## 📈 Performance Optimization

### Frontend Optimization

- **Code Splitting**: Implemented with React.lazy()
- **Asset Optimization**: Vite handles bundling and minification
- **CDN**: Vercel provides global CDN
- **Caching**: Service worker for offline functionality

### Backend Optimization

- **Database Indexing**: Ensure proper MongoDB indexes
- **Redis Caching**: Cache frequently accessed data
- **Connection Pooling**: MongoDB connection pooling
- **Compression**: Gzip compression enabled

### Scaling Strategies

- **Horizontal Scaling**: Multiple backend instances
- **Database Scaling**: MongoDB Atlas auto-scaling
- **CDN**: CloudFlare for global content delivery
- **Load Balancing**: Platform-provided load balancing

## 📋 Deployment Checklist

### Pre-deployment

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates configured
- [ ] Domain names configured
- [ ] Monitoring setup

### Post-deployment

- [ ] Health checks passing
- [ ] Database connectivity verified
- [ ] Authentication flow tested
- [ ] API endpoints responding
- [ ] Frontend loading correctly
- [ ] Email/SMS notifications working
- [ ] File uploads functioning
- [ ] Performance metrics acceptable

### Maintenance

- [ ] Regular backups scheduled
- [ ] Security updates planned
- [ ] Monitoring alerts configured
- [ ] Log rotation setup
- [ ] Disaster recovery plan documented

---

**Deployment complete! 🚀 Your Finance Dashboard is now live in production.**
