# Docker Deployment Guide

This guide explains how to run the Finance Dashboard application using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB of available RAM
- At least 5GB of available disk space

## Quick Start

### 1. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.docker .env
```

Edit `.env` and update the following critical values:

- `JWT_ACCESS_SECRET` - Generate with: `openssl rand -base64 32`
- `JWT_REFRESH_SECRET` - Generate with: `openssl rand -base64 32`
- `MONGO_ROOT_PASSWORD` - Strong password for MongoDB
- `ADMIN_PASSWORD` - Strong password for admin user
- Email and SMS credentials (if not using test mode)
- Cloudinary credentials

### 2. Start All Services

```bash
# Production mode (backend + frontend + mongodb)
docker-compose up -d

# Development mode (includes mongo-express)
docker-compose --profile dev up -d
```

### 3. Access the Application

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:5000
- **MongoDB Express** (dev only): http://localhost:8081

### 4. Default Admin Credentials

```
Username: admin
Password: (value from ADMIN_PASSWORD in .env)
```

## Service Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Nginx)       │
│   Port: 80      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend API   │
│   (Node.js)     │
│   Port: 5000    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   MongoDB       │
│   Port: 27017   │
└─────────────────┘
```

## Docker Commands

### Start Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend

# Start with logs
docker-compose up
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Check Service Status

```bash
# List running containers
docker-compose ps

# Check health status
docker-compose ps --format json | jq '.[].Health'
```

### Execute Commands in Containers

```bash
# Backend shell
docker-compose exec backend sh

# MongoDB shell
docker-compose exec mongodb mongosh

# View backend environment
docker-compose exec backend env
```

## Building Images

### Build All Images

```bash
docker-compose build
```

### Build Specific Service

```bash
docker-compose build backend
docker-compose build frontend
```

### Build with No Cache

```bash
docker-compose build --no-cache
```

## Data Persistence

MongoDB data is persisted in Docker volumes:

- `mongodb_data` - Database files
- `mongodb_config` - Configuration files

### Backup MongoDB

```bash
# Create backup
docker-compose exec mongodb mongodump --out=/data/backup

# Copy backup to host
docker cp finance-mongodb:/data/backup ./mongodb-backup
```

### Restore MongoDB

```bash
# Copy backup to container
docker cp ./mongodb-backup finance-mongodb:/data/backup

# Restore
docker-compose exec mongodb mongorestore /data/backup
```

## Environment Variables

### Required Variables

| Variable              | Description               | Example                |
| --------------------- | ------------------------- | ---------------------- |
| `JWT_ACCESS_SECRET`   | Secret for access tokens  | Random 32+ char string |
| `JWT_REFRESH_SECRET`  | Secret for refresh tokens | Random 32+ char string |
| `MONGO_ROOT_PASSWORD` | MongoDB admin password    | Strong password        |
| `ADMIN_PASSWORD`      | Admin user password       | Strong password        |

### Optional Variables

| Variable              | Description            | Default |
| --------------------- | ---------------------- | ------- |
| `BACKEND_PORT`        | Backend port           | 5000    |
| `FRONTEND_PORT`       | Frontend port          | 80      |
| `MONGO_PORT`          | MongoDB port           | 27017   |
| `OTP_EMAIL_TEST_MODE` | Use test OTP for email | true    |
| `OTP_SMS_TEST_MODE`   | Use test OTP for SMS   | true    |

See `.env.docker` for complete list.

## Health Checks

All services include health checks:

### Backend Health Check

```bash
curl http://localhost:5000/health
```

### Frontend Health Check

```bash
curl http://localhost:80/health
```

### MongoDB Health Check

```bash
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

## Troubleshooting

### Services Won't Start

1. Check logs:

   ```bash
   docker-compose logs backend
   ```

2. Verify environment variables:

   ```bash
   docker-compose config
   ```

3. Check port conflicts:
   ```bash
   netstat -tulpn | grep -E ':(80|5000|27017)'
   ```

### MongoDB Connection Issues

1. Verify MongoDB is healthy:

   ```bash
   docker-compose ps mongodb
   ```

2. Check MongoDB logs:

   ```bash
   docker-compose logs mongodb
   ```

3. Test connection:
   ```bash
   docker-compose exec backend node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(e => console.error(e))"
   ```

### Backend API Errors

1. Check environment variables are set:

   ```bash
   docker-compose exec backend env | grep JWT
   ```

2. Verify MongoDB connection:

   ```bash
   docker-compose logs backend | grep -i mongo
   ```

3. Check for missing secrets:
   ```bash
   docker-compose logs backend | grep -i "required"
   ```

### Frontend Not Loading

1. Check nginx logs:

   ```bash
   docker-compose logs frontend
   ```

2. Verify build completed:

   ```bash
   docker-compose exec frontend ls -la /usr/share/nginx/html
   ```

3. Check nginx configuration:
   ```bash
   docker-compose exec frontend nginx -t
   ```

## Production Deployment

### Security Checklist

- [ ] Generate strong random JWT secrets
- [ ] Use strong MongoDB password
- [ ] Set `OTP_EMAIL_TEST_MODE=false`
- [ ] Set `OTP_SMS_TEST_MODE=false`
- [ ] Configure real Twilio credentials
- [ ] Configure real email service
- [ ] Update `ALLOWED_ORIGINS` with production domain
- [ ] Use HTTPS (configure reverse proxy)
- [ ] Enable firewall rules
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Set up monitoring and alerts

### Recommended Setup

1. **Use a reverse proxy** (Nginx/Traefik) for HTTPS
2. **Set up automated backups** for MongoDB
3. **Configure log aggregation** (ELK, Loki, etc.)
4. **Set up monitoring** (Prometheus, Grafana)
5. **Use secrets management** (Docker Secrets, Vault)
6. **Implement rate limiting** at reverse proxy level
7. **Set up CI/CD pipeline** for automated deployments

### Example Production docker-compose.yml

```yaml
version: "3.8"

services:
  backend:
    image: your-registry/finance-backend:latest
    restart: always
    environment:
      NODE_ENV: production
    secrets:
      - jwt_access_secret
      - jwt_refresh_secret
      - mongo_password
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: "1"
          memory: 512M
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3
```

Note: Requires load balancer configuration.

### Resource Limits

Edit `docker-compose.yml` to add resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 512M
        reservations:
          cpus: "0.5"
          memory: 256M
```

## Monitoring

### View Resource Usage

```bash
# All containers
docker stats

# Specific container
docker stats finance-backend
```

### Container Logs

```bash
# Follow logs
docker-compose logs -f --tail=100

# Export logs
docker-compose logs > logs.txt
```

## Cleanup

### Remove Stopped Containers

```bash
docker-compose down
```

### Remove All Data (WARNING)

```bash
# Remove containers, networks, and volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

### Clean Docker System

```bash
# Remove unused containers, networks, images
docker system prune -a

# Remove unused volumes
docker volume prune
```

## Development Mode

### Enable MongoDB Express

```bash
docker-compose --profile dev up -d
```

Access at: http://localhost:8081

### Hot Reload (Development)

For development with hot reload, use the local development setup instead:

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

## Support

For issues and questions:

1. Check logs: `docker-compose logs`
2. Verify configuration: `docker-compose config`
3. Review this documentation
4. Check GitHub issues

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Nginx Docker Hub](https://hub.docker.com/_/nginx)
