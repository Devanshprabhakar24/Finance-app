# 🚀 Deployment Guide

This guide covers deploying the Finance Dashboard application with frontend on Vercel and backend on Render.

## 📋 Prerequisites

- GitHub repository with the latest code
- Vercel account (free tier available)
- Render account (free tier available)
- MongoDB Atlas database
- Cloudinary account for file uploads
- Email service (Gmail SMTP or Brevo API)

## 🎯 Deployment Steps

### 1. Backend Deployment (Render)

#### Step 1: Create Render Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `finance-dashboard-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: Leave empty (uses render.yaml)
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`

#### Step 2: Set Environment Variables

Add these environment variables in Render dashboard:

**Required Variables:**

```
NODE_ENV=production
PORT=8000
MONGODB_URI=your_mongodb_connection_string_here
JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PHONE=+1234567890
ADMIN_FULL_NAME=System Administrator
BREVO_API_KEY=your_brevo_api_key_here
BREVO_FROM_EMAIL=your_email@yourdomain.com
SMTP_USER=your_smtp_user@gmail.com
SMTP_PASS=your_smtp_app_password
EMAIL_FROM=Finance Dashboard <your_email@yourdomain.com>
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Optional Variables (with defaults):**

```
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_EMAIL_TEST_MODE=false
OTP_SMS_TEST_MODE=false
EMAIL_SERVICE=gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

#### Step 3: Update CORS Origins

After deployment, update the `ALLOWED_ORIGINS` variable to include your Vercel domain:

```
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://yourdomain.com
```

### 2. Frontend Deployment (Vercel)

#### Step 1: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Step 2: Set Environment Variables

Add these environment variables in Vercel dashboard:

```
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
VITE_APP_NAME=Finance Dashboard
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
```

#### Step 3: Update Backend URL

After Render deployment, update the `VITE_API_BASE_URL` in Vercel to point to your Render backend URL.

## 🔧 Post-Deployment Configuration

### 1. Update CORS Settings

In your Render backend, update the `ALLOWED_ORIGINS` environment variable to include your Vercel domain.

### 2. Test the Deployment

1. Visit your Vercel frontend URL
2. Test user registration and login
3. Verify API connectivity
4. Check email/SMS functionality (if configured)

## 📊 Monitoring & Health Checks

### Backend Health Check

- **Endpoint**: `https://your-backend-url.onrender.com/health`
- **Expected Response**: JSON with system status and memory usage

### Frontend Performance

- Vercel provides automatic performance monitoring
- Check Core Web Vitals in Vercel dashboard

## 🔒 Security Considerations

### Production Security Checklist

- [ ] JWT secrets are strong and unique (use `openssl rand -base64 32`)
- [ ] MongoDB connection uses authentication
- [ ] CORS origins are properly configured
- [ ] Email credentials are secure
- [ ] Cloudinary API keys are protected
- [ ] Admin credentials are changed from defaults

### Environment Variables Security

- Never commit `.env` files to version control
- Use Render/Vercel environment variable management
- Rotate secrets regularly
- Use different credentials for production

## 🚨 Troubleshooting

### Common Issues

#### Backend Issues

1. **Build Failures**: Check Node.js version compatibility
2. **Database Connection**: Verify MongoDB URI and network access
3. **Email Issues**: Check SMTP credentials and service configuration
4. **CORS Errors**: Ensure frontend domain is in ALLOWED_ORIGINS

#### Frontend Issues

1. **API Connection**: Verify VITE_API_BASE_URL points to correct backend
2. **Build Failures**: Check TypeScript errors and dependencies
3. **Environment Variables**: Ensure all VITE\_ prefixed variables are set

### Logs and Debugging

- **Render**: Check service logs in Render dashboard
- **Vercel**: Check function logs and build logs in Vercel dashboard
- **MongoDB**: Monitor connection and query performance in Atlas

## 📈 Scaling Considerations

### Free Tier Limitations

- **Render**: 750 hours/month, sleeps after 15 minutes of inactivity
- **Vercel**: 100GB bandwidth, 6000 minutes build time
- **MongoDB Atlas**: 512MB storage, shared cluster

### Upgrade Path

1. **Render**: Upgrade to Starter plan ($7/month) for always-on service
2. **Vercel**: Pro plan ($20/month) for better performance and analytics
3. **MongoDB**: Dedicated cluster for production workloads

## 🎯 Performance Optimization

### Backend Optimization

- Enable Redis caching (requires paid Render plan)
- Optimize database queries and indexes
- Implement proper error handling and logging

### Frontend Optimization

- Leverage Vercel's Edge Network
- Optimize images and assets
- Implement proper caching strategies
- Monitor Core Web Vitals

## 📞 Getting Your Credentials

### MongoDB Atlas

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster and get connection string
3. Add your IP to whitelist or use 0.0.0.0/0 for all IPs

### Cloudinary

1. Create account at [Cloudinary](https://cloudinary.com/)
2. Get Cloud Name, API Key, and API Secret from dashboard

### Email Service (Gmail)

1. Enable 2-factor authentication on Gmail
2. Generate App Password for SMTP
3. Use App Password as SMTP_PASS

### JWT Secrets

Generate secure secrets using:

```bash
openssl rand -base64 32
```

## 📞 Support

For deployment issues:

1. Check service logs first
2. Verify environment variables
3. Test API endpoints manually
4. Check network connectivity and CORS settings

---

**Note**: This deployment uses free tiers which have limitations. For production use, consider upgrading to paid plans for better performance and reliability.
