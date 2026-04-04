# Quick Start Guide

Get the Finance Dashboard up and running in 5 minutes!

---

## Prerequisites

- Docker and Docker Compose installed
- 2GB RAM minimum
- 5GB disk space

---

## 🚀 Quick Start (Docker)

### 1. Clone & Configure

```bash
# Clone repository
git clone <repo-url>
cd Finance-app-improved

# Copy environment file
cp .env.docker .env

# Edit .env with your values (or use defaults for testing)
nano .env
```

### 2. Start Everything

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Access Application

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api/docs

### 4. Login

**Default Admin Credentials:**

- Email: `admin@example.com`
- Password: (from `ADMIN_PASSWORD` in .env)

**Test OTP Code:** `123456` (when `OTP_EMAIL_TEST_MODE=true`)

---

## 🛠️ Development Setup (Local)

### Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your MongoDB URI and secrets
nano .env

# Run database seed (creates test users)
npm run seed

# Start development server
npm run dev
```

Backend runs on: http://localhost:5000

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

Frontend runs on: http://localhost:3000

---

## 📝 Test Users (After Seed)

| Role    | Email               | Password   | OTP (test mode) |
| ------- | ------------------- | ---------- | --------------- |
| Admin   | admin@finance.dev   | Demo@12345 | 123456          |
| Analyst | analyst@finance.dev | Demo@12345 | 123456          |
| Viewer  | viewer@finance.dev  | Demo@12345 | 123456          |

---

## 🔧 Common Commands

### Docker

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart service
docker-compose restart backend

# Rebuild images
docker-compose build

# Check status
docker-compose ps
```

### Development

```bash
# Backend
npm run dev          # Start dev server
npm run build        # Build for production
npm run seed         # Seed database
npm test            # Run tests

# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## 🐛 Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs

# Verify configuration
docker-compose config

# Check ports
netstat -tulpn | grep -E ':(80|5000|27017)'
```

### Can't connect to MongoDB

```bash
# Check MongoDB is running
docker-compose ps mongodb

# Test connection
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

### Frontend not loading

```bash
# Check frontend logs
docker-compose logs frontend

# Verify Nginx config
docker-compose exec frontend nginx -t
```

### OTP not working

Make sure in `.env`:

```env
OTP_EMAIL_TEST_MODE=true
OTP_SMS_TEST_MODE=true
OTP_TEST_CODE=123456
```

---

## 📚 Next Steps

- Read [DOCKER.md](./DOCKER.md) for detailed Docker guide
- Read [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for production deployment
- Read [README.md](./README.md) for API documentation
- Check [API Docs](http://localhost:5000/api/docs) for interactive API testing

---

## 🆘 Need Help?

- Check [DOCKER.md](./DOCKER.md) troubleshooting section
- Review logs: `docker-compose logs -f`
- Check [GitHub Issues](your-repo-url/issues)

---

**That's it! You're ready to go! 🎉**
