# Deployment Checklist - Finance Dashboard

## 🚀 Render Dashboard — Required Environment Variables

Set ALL of these manually in Render → Environment before deploying:

### Database

- `MONGODB_URI` → MongoDB Atlas connection string

### Auth / JWT (generate with: `openssl rand -base64 32`)

- `JWT_ACCESS_SECRET` → min 32 chars random string
- `JWT_REFRESH_SECRET` → different min 32 chars random string
- `JWT_ACCESS_EXPIRES` → 15m
- `JWT_REFRESH_EXPIRES` → 7d

### Admin seed user

- `ADMIN_USERNAME` → admin
- `ADMIN_PASSWORD` → secure password
- `ADMIN_EMAIL` → admin@finance.com
- `ADMIN_PHONE` → E.164 format e.g. +911234567890
- `ADMIN_FULL_NAME` → Admin User

### OTP / SMS (Twilio)

- `TWILIO_ACCOUNT_SID` → your Twilio account SID
- `TWILIO_AUTH_TOKEN` → your Twilio auth token
- `TWILIO_PHONE_NUMBER` → your Twilio phone number
- `OTP_EMAIL_TEST_MODE` → false (in production)
- `OTP_SMS_TEST_MODE` → false (in production)

### Email (Gmail SMTP)

- `SMTP_USER` → your Gmail address
- `SMTP_PASS` → use App Password not Gmail password
- `EMAIL_FROM` → "Finance Dashboard <noreply@finance.com>"
- `SMTP_HOST` → smtp.gmail.com
- `SMTP_PORT` → 587

### Cloudinary (image uploads)

- `CLOUDINARY_CLOUD_NAME` → your cloudinary cloud name
- `CLOUDINARY_API_KEY` → your cloudinary API key
- `CLOUDINARY_API_SECRET` → your cloudinary API secret

### CORS

- `ALLOWED_ORIGINS` → https://finance-103y771kv-devansh-prabhakars-projects.vercel.app,http://localhost:3000,http://localhost:5173

## 🌐 Vercel Dashboard — Environment Variables

- `VITE_API_BASE_URL` → https://finance-app-ddaf.onrender.com/api
- `VITE_CLOUDINARY_CLOUD_NAME` → your cloudinary cloud name

## ✅ After deploying

1. **Verify backend health**: https://finance-app-ddaf.onrender.com/api/health
2. **Test login with admin credentials**
3. **Confirm dashboard loads without 404s**

## 🔧 Build Commands

### Render (Backend)

```bash
buildCommand: cd backend && npm ci && npm run build
startCommand: cd backend && node dist/server.js
healthCheckPath: /api/health
```

### Vercel (Frontend)

```bash
buildCommand: npm run build:frontend
outputDirectory: frontend/dist
installCommand: npm install && npm run install:all
```

## 🚨 Common Issues & Solutions

### 404 Errors on All Routes

- **Cause**: Backend not properly deployed or wrong start command
- **Fix**: Ensure `startCommand: cd backend && node dist/server.js` in render.yaml
- **Verify**: Check https://finance-app-ddaf.onrender.com/api/health returns 200

### CORS Errors

- **Cause**: Frontend URL not in ALLOWED_ORIGINS
- **Fix**: Add exact Vercel URL to ALLOWED_ORIGINS environment variable
- **Format**: `https://your-app.vercel.app,http://localhost:3000`

### JWT Errors

- **Cause**: Missing or invalid JWT secrets
- **Fix**: Generate proper secrets with `openssl rand -base64 32`
- **Requirement**: Must be at least 32 characters long

### OTP Not Working

- **Cause**: Test mode enabled in production
- **Fix**: Set `OTP_EMAIL_TEST_MODE=false` and `OTP_SMS_TEST_MODE=false`
- **Alternative**: Use test OTP `123456` if test mode is enabled

### Database Connection Failed

- **Cause**: Invalid MongoDB URI or network access
- **Fix**: Verify MongoDB Atlas connection string and whitelist Render IPs
- **Test**: Use MongoDB Compass to test connection string

### Build Failures

- **Cause**: Missing dependencies or TypeScript errors
- **Fix**: Ensure `npm ci && npm run build` works locally
- **Debug**: Check Render build logs for specific errors

## 📋 Pre-Deployment Checklist

- [ ] All environment variables set in Render dashboard
- [ ] MongoDB Atlas cluster created and accessible
- [ ] Twilio account configured (if using SMS)
- [ ] Gmail App Password generated (if using email)
- [ ] Cloudinary account setup (if using file uploads)
- [ ] Frontend environment variables set in Vercel
- [ ] CORS origins include production frontend URL
- [ ] JWT secrets are secure (32+ characters)
- [ ] Test mode disabled for production

## 🔄 Deployment Process

1. **Push code to GitHub**
2. **Render auto-deploys backend** (if connected to GitHub)
3. **Vercel auto-deploys frontend** (if connected to GitHub)
4. **Verify health endpoints**
5. **Test login flow**
6. **Check dashboard functionality**

## 📞 Troubleshooting

If deployment fails:

1. **Check Render logs** for backend errors
2. **Check Vercel logs** for frontend build errors
3. **Verify environment variables** are set correctly
4. **Test API endpoints** manually with curl
5. **Check CORS configuration** if getting network errors

---

**🎯 Success Criteria**: All endpoints return 200, login works, dashboard loads without errors\*\*
