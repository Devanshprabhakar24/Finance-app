# Backend Troubleshooting Guide - 503 Service Unavailable

## 🚨 Current Issue

**Backend URL**: `https://finance-app-ddaf.onrender.com/api/health`  
**Status**: 503 Service Unavailable  
**Impact**: Frontend cannot connect, causing CORS errors

## 🔍 Diagnostic Steps

### Step 1: Check Render Deployment Logs

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Find your `finance-dashboard-backend` service
3. Click on "Logs" tab
4. Look for startup errors

**Common Error Patterns to Look For:**

```
❌ MongoDB: unhealthy
❌ Cloudinary: unhealthy
❌ Failed to start server
Environment validation failed
```

### Step 2: Verify Environment Variables

In Render Dashboard → Environment tab, ensure these are set:

#### Critical Variables (Must Be Set)

- ✅ `MONGODB_URI` - MongoDB Atlas connection string
- ✅ `JWT_ACCESS_SECRET` - 32+ character random string
- ✅ `JWT_REFRESH_SECRET` - Different 32+ character random string
- ✅ `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- ✅ `CLOUDINARY_API_KEY` - Your Cloudinary API key
- ✅ `CLOUDINARY_API_SECRET` - Your Cloudinary API secret

#### Admin User Variables

- ✅ `ADMIN_EMAIL` - Admin email address
- ✅ `ADMIN_PASSWORD` - Admin password
- ✅ `ADMIN_USERNAME` - Admin username
- ✅ `ADMIN_PHONE` - Admin phone (E.164 format: +1234567890)
- ✅ `ADMIN_FULL_NAME` - Admin full name

#### Email Variables (Gmail SMTP)

- ✅ `SMTP_USER` - Your Gmail address
- ✅ `SMTP_PASS` - Gmail App Password (not regular password)
- ✅ `EMAIL_FROM` - From email address

### Step 3: Test Individual Services

Run the diagnostic script locally to test each service:

```bash
cd backend
node diagnose.js
```

This will test:

- MongoDB connection
- Cloudinary connection
- Environment variable validation

### Step 4: Check Service Health

The backend now has improved error handling. If a service fails:

- **MongoDB failure** → Server won't start (critical)
- **Cloudinary failure** → Server starts but file uploads fail (warning)
- **Redis failure** → Server starts without caching (warning)

## 🛠️ Common Fixes

### Fix 1: MongoDB Connection Issues

**Symptoms**: `MongoDB connection failed` in logs

**Solutions**:

1. **Check MongoDB URI format**:

   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```

2. **Verify MongoDB Atlas**:
   - Database user exists with correct password
   - IP whitelist includes `0.0.0.0/0` (allow all) for Render
   - Database name matches URI

3. **Test connection locally**:
   ```bash
   cd backend
   node -e "
   const mongoose = require('mongoose');
   mongoose.connect('YOUR_MONGODB_URI')
     .then(() => console.log('✅ Connected'))
     .catch(err => console.log('❌ Failed:', err.message));
   "
   ```

### Fix 2: Cloudinary Configuration Issues

**Symptoms**: `Cloudinary connection failed` in logs

**Solutions**:

1. **Verify Cloudinary credentials**:
   - Login to [Cloudinary Dashboard](https://cloudinary.com/console)
   - Copy exact values for Cloud Name, API Key, API Secret
   - Ensure no extra spaces or characters

2. **Test Cloudinary locally**:
   ```bash
   cd backend
   node -e "
   const cloudinary = require('cloudinary').v2;
   cloudinary.config({
     cloud_name: 'YOUR_CLOUD_NAME',
     api_key: 'YOUR_API_KEY',
     api_secret: 'YOUR_API_SECRET'
   });
   cloudinary.api.ping()
     .then(() => console.log('✅ Cloudinary OK'))
     .catch(err => console.log('❌ Cloudinary Failed:', err.message));
   "
   ```

### Fix 3: JWT Secret Issues

**Symptoms**: `JWT access secret must be at least 32 characters` in logs

**Solutions**:

1. **Generate strong secrets**:

   ```bash
   # Generate JWT_ACCESS_SECRET
   openssl rand -base64 32

   # Generate JWT_REFRESH_SECRET (different from above)
   openssl rand -base64 32
   ```

2. **Set in Render Dashboard**:
   - Copy each generated string
   - Paste into respective environment variables
   - Ensure no trailing spaces

### Fix 4: Email Configuration Issues

**Symptoms**: SMTP connection errors in logs

**Solutions**:

1. **Gmail App Password**:
   - Go to Google Account settings
   - Enable 2-factor authentication
   - Generate App Password (not regular password)
   - Use App Password in `SMTP_PASS`

2. **Email format**:
   ```
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   EMAIL_FROM="Finance Dashboard <your-email@gmail.com>"
   ```

## 🚀 Force Redeploy

After fixing environment variables:

1. **Trigger Redeploy**:
   - Go to Render Dashboard
   - Click "Manual Deploy" → "Deploy latest commit"
   - Or push a small change to trigger auto-deploy

2. **Monitor Deployment**:
   - Watch the build logs for errors
   - Check startup logs for service health
   - Test health endpoint: `https://finance-app-ddaf.onrender.com/api/health`

## 🧪 Test Backend Health

### Health Check Endpoint

```bash
curl https://finance-app-ddaf.onrender.com/api/health
```

**Expected Response** (200 OK):

```json
{
  "status": "ok",
  "timestamp": "2024-04-06T10:30:00.000Z",
  "uptime": 123.45,
  "memory": {
    "heapUsed": "45MB",
    "heapTotal": "67MB",
    "rss": "89MB",
    "external": "12MB"
  },
  "mongo": "connected"
}
```

### Test API Endpoints

```bash
# Test CORS
curl -H "Origin: https://finance-app-one-zeta.vercel.app" \
     https://finance-app-ddaf.onrender.com/api/health

# Test auth endpoint
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"identifier":"admin@finance.dev","password":"admin123"}'
```

## 📊 Monitoring

### Real-time Logs

```bash
# If you have Render CLI installed
render logs -s finance-dashboard-backend --tail
```

### Key Metrics to Watch

- **Memory Usage**: Should stay under 512MB (free tier limit)
- **Response Time**: Health check should respond < 5 seconds
- **Error Rate**: Should be 0% for health checks
- **Uptime**: Should maintain 99%+ uptime

## 🆘 Emergency Fixes

### Quick Fix: Disable Optional Services

If Cloudinary is causing issues, temporarily disable it:

1. **Comment out Cloudinary ping** in `backend/src/server.ts`:

   ```typescript
   // await cloudinary.v2.api.ping();  // Temporarily disabled
   ```

2. **Rebuild and redeploy**:
   ```bash
   cd backend && npm run build
   git add . && git commit -m "Disable Cloudinary ping"
   git push
   ```

### Rollback Strategy

If all else fails, rollback to a working version:

1. **Find last working commit** in Git history
2. **Reset to that commit**:
   ```bash
   git reset --hard WORKING_COMMIT_HASH
   git push --force
   ```

## 📞 Getting Help

### Render Support

- [Render Status Page](https://status.render.com)
- [Render Community](https://community.render.com)
- [Render Documentation](https://render.com/docs)

### Debug Information to Collect

When asking for help, provide:

1. **Render service logs** (last 100 lines)
2. **Environment variables** (names only, not values)
3. **Build logs** from deployment
4. **Error messages** from health check attempts
5. **MongoDB Atlas connection status**
6. **Cloudinary dashboard status**

---

**🎯 Most Likely Fix**: The issue is probably a missing or incorrect environment variable. Check MongoDB URI and Cloudinary credentials first.\*\*
