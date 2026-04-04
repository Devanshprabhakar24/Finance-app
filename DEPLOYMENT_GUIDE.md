# Production Deployment Guide

This guide provides step-by-step instructions for deploying the Finance Dashboard application to production.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Security Configuration](#security-configuration)
4. [Database Setup](#database-setup)
5. [Application Deployment](#application-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

### Infrastructure Requirements

- [ ] Server with Docker and Docker Compose installed
- [ ] Minimum 2GB RAM, 2 CPU cores
- [ ] At least 20GB available disk space
- [ ] Domain name configured (optional but recommended)
- [ ] SSL/TLS certificate (Let's Encrypt recommended)
- [ ] Firewall configured (ports 80, 443, 22)

### External Services

- [ ] MongoDB Atlas account (or self-hosted MongoDB)
- [ ] Cloudinary account for file storage
- [ ] Twilio account for SMS (or test mode)
- [ ] Email service (Gmail/Brevo) configured
- [ ] Backup storage configured

### Security Preparation

- [ ] Strong JWT secrets generated
- [ ] Strong database passwords generated
- [ ] Admin credentials prepared
- [ ] SSL certificates obtained
- [ ] Firewall rules documented

---

## Environment Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Clone Repository

```bash
# Clone the repository
git clone <your-repo-url>
cd Finance-app-improved

# Or upload files via SCP/SFTP
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.docker .env

# Edit environment file
nano .env
```

### 4. Generate Secrets

```bash
# Generate JWT secrets (run twice for access and refresh)
openssl rand -base64 32

# Generate strong passwords
openssl rand -base64 24
```

---

## Security Configuration

### 1. JWT Secrets

**CRITICAL**: Generate unique, strong secrets for production.

```bash
# Generate access token secret
JWT_ACCESS_SECRET=$(openssl rand -base64 32)
echo "JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET"

# Generate refresh token secret (MUST be different)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
```

Add these to your `.env` file.

### 2. Database Security

```bash
# Generate strong MongoDB password
MONGO_ROOT_PASSWORD=$(openssl rand -base64 24)
echo "MONGO_ROOT_PASSWORD=$MONGO_ROOT_PASSWORD"
```

### 3. Admin Credentials

```bash
# Set strong admin password
ADMIN_PASSWORD=$(openssl rand -base64 16)
echo "ADMIN_PASSWORD=$ADMIN_PASSWORD"
```

**IMPORTANT**: Save these credentials securely!

### 4. CORS Configuration

Update `ALLOWED_ORIGINS` in `.env`:

```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 5. Disable Test Modes

```env
OTP_EMAIL_TEST_MODE=false
OTP_SMS_TEST_MODE=false
```

### 6. Configure External Services

**Twilio (SMS)**

```env
TWILIO_ACCOUNT_SID=your_actual_sid
TWILIO_AUTH_TOKEN=your_actual_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Email Service**

```env
# For Gmail
EMAIL_SERVICE=gmail
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_app_specific_password

# OR for Brevo
EMAIL_SERVICE=brevo
BREVO_API_KEY=your_brevo_api_key
```

**Cloudinary**

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Database Setup

### Option 1: MongoDB Atlas (Recommended)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster (free tier available)
3. Create database user
4. Whitelist your server IP
5. Get connection string

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finance_db?retryWrites=true&w=majority
```

### Option 2: Self-Hosted MongoDB

Use the included MongoDB container:

```env
MONGODB_URI=mongodb://admin:your_password@mongodb:27017/finance_db?authSource=admin
```

### Database Initialization

The application will automatically:

- Create collections
- Create indexes
- Seed admin user (if configured)

---

## Application Deployment

### 1. Build Images

```bash
# Build all images
docker-compose build

# Or build individually
docker-compose build backend
docker-compose build frontend
```

### 2. Start Services

```bash
# Start all services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Verify Services

```bash
# Check service status
docker-compose ps

# Should show all services as "Up" and "healthy"
```

### 4. Create Admin User

If not using seed script, create admin via API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@yourdomain.com",
    "phone": "+1234567890",
    "password": "YourStrongPassword123!"
  }'
```

Then verify OTP and promote to admin role.

---

## SSL/TLS Configuration

### Option 1: Nginx Reverse Proxy (Recommended)

Install Nginx on host:

```bash
sudo apt install nginx certbot python3-certbot-nginx
```

Create Nginx configuration:

```nginx
# /etc/nginx/sites-available/finance-dashboard
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and get SSL:

```bash
sudo ln -s /etc/nginx/sites-available/finance-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Option 2: Traefik (Docker-based)

Add Traefik to docker-compose.yml (see Traefik documentation).

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# Backend health
curl http://localhost:5000/health

# Frontend health
curl http://localhost:80/health

# Expected response: {"status":"ok"}
```

### 2. API Documentation

Visit: `http://yourdomain.com/api/docs`

Verify Swagger UI loads correctly.

### 3. Frontend Access

Visit: `http://yourdomain.com`

Verify:

- [ ] Landing page loads
- [ ] Login page accessible
- [ ] Registration works
- [ ] OTP delivery works
- [ ] Dashboard loads after login

### 4. Database Connection

```bash
# Check backend logs for successful connection
docker-compose logs backend | grep -i "mongodb"

# Should see: "MongoDB connected successfully"
```

### 5. File Upload Test

1. Login as admin
2. Go to profile
3. Upload avatar
4. Verify image appears

### 6. Email/SMS Test

1. Register new user
2. Verify OTP received via email
3. Verify OTP received via SMS (if configured)

---

## Monitoring & Maintenance

### 1. Log Management

```bash
# View logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# Save logs to file
docker-compose logs > logs.txt
```

### 2. Resource Monitoring

```bash
# Monitor resource usage
docker stats

# Check disk usage
df -h
docker system df
```

### 3. Database Backup

```bash
# Create backup directory
mkdir -p backups

# Backup MongoDB
docker-compose exec mongodb mongodump --out=/data/backup

# Copy backup to host
docker cp finance-mongodb:/data/backup ./backups/backup-$(date +%Y%m%d)

# Compress backup
tar -czf backups/backup-$(date +%Y%m%d).tar.gz backups/backup-$(date +%Y%m%d)
```

### 4. Automated Backups

Create cron job:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/Finance-app-improved && ./scripts/backup.sh
```

Create backup script:

```bash
#!/bin/bash
# scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"

# Create backup
docker-compose exec -T mongodb mongodump --out=/data/backup

# Copy and compress
docker cp finance-mongodb:/data/backup $BACKUP_DIR/backup-$DATE
tar -czf $BACKUP_DIR/backup-$DATE.tar.gz $BACKUP_DIR/backup-$DATE
rm -rf $BACKUP_DIR/backup-$DATE

# Keep only last 7 days
find $BACKUP_DIR -name "backup-*.tar.gz" -mtime +7 -delete

echo "Backup completed: backup-$DATE.tar.gz"
```

### 5. Update Procedure

```bash
# Pull latest changes
git pull

# Rebuild images
docker-compose build

# Restart services (zero-downtime with proper setup)
docker-compose up -d

# Verify health
docker-compose ps
```

---

## Monitoring Setup

### Option 1: Simple Monitoring

Create monitoring script:

```bash
#!/bin/bash
# scripts/monitor.sh

# Check if services are running
if ! docker-compose ps | grep -q "Up"; then
    echo "Services are down!" | mail -s "Alert: Finance Dashboard Down" admin@yourdomain.com
    docker-compose up -d
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Disk usage is at ${DISK_USAGE}%" | mail -s "Alert: High Disk Usage" admin@yourdomain.com
fi
```

Add to crontab (every 5 minutes):

```bash
*/5 * * * * /path/to/scripts/monitor.sh
```

### Option 2: Prometheus + Grafana

See separate monitoring guide for full setup.

---

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check configuration
docker-compose config

# Verify environment variables
docker-compose exec backend env | grep -E "JWT|MONGO|PORT"
```

### Database Connection Issues

```bash
# Test MongoDB connection
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check MongoDB logs
docker-compose logs mongodb

# Verify connection string
echo $MONGODB_URI
```

### Frontend Not Loading

```bash
# Check Nginx logs
docker-compose logs frontend

# Verify build
docker-compose exec frontend ls -la /usr/share/nginx/html

# Test Nginx config
docker-compose exec frontend nginx -t
```

### OTP Not Sending

```bash
# Check backend logs
docker-compose logs backend | grep -i otp

# Verify email/SMS configuration
docker-compose exec backend env | grep -E "SMTP|TWILIO|OTP"

# Test in test mode first
OTP_EMAIL_TEST_MODE=true
OTP_SMS_TEST_MODE=true
```

### High Memory Usage

```bash
# Check resource usage
docker stats

# Restart services
docker-compose restart

# Add resource limits to docker-compose.yml
```

---

## Rollback Procedures

### Quick Rollback

```bash
# Stop current version
docker-compose down

# Checkout previous version
git checkout <previous-commit>

# Rebuild and start
docker-compose build
docker-compose up -d
```

### Database Rollback

```bash
# Stop application
docker-compose down

# Restore backup
docker cp backups/backup-YYYYMMDD.tar.gz finance-mongodb:/data/
docker-compose exec mongodb tar -xzf /data/backup-YYYYMMDD.tar.gz -C /data/
docker-compose exec mongodb mongorestore /data/backup-YYYYMMDD

# Start application
docker-compose up -d
```

---

## Performance Optimization

### 1. Enable Caching

Add Redis for session caching (optional):

```yaml
# docker-compose.yml
redis:
  image: redis:alpine
  restart: unless-stopped
  networks:
    - finance-network
```

### 2. Database Optimization

```bash
# Create indexes (already done in code)
# Monitor slow queries
docker-compose exec mongodb mongosh --eval "db.setProfilingLevel(1, { slowms: 100 })"
```

### 3. CDN Setup

Configure Cloudflare or similar CDN for:

- Static asset caching
- DDoS protection
- SSL/TLS termination

### 4. Load Balancing

For high traffic, set up multiple backend instances:

```yaml
# docker-compose.yml
backend:
  deploy:
    replicas: 3
```

Add load balancer (Nginx/HAProxy).

---

## Security Hardening

### 1. Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 2. Fail2Ban Setup

```bash
# Install fail2ban
sudo apt install fail2ban

# Configure for SSH and Nginx
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

### 4. Security Scanning

```bash
# Scan Docker images
docker scan finance-backend
docker scan finance-frontend

# Check for vulnerabilities
npm audit
```

---

## Compliance & Best Practices

### GDPR Compliance

- [ ] Privacy policy implemented
- [ ] Cookie consent banner
- [ ] Data export functionality
- [ ] Data deletion functionality
- [ ] Audit logs enabled

### Security Best Practices

- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Vulnerability scanning
- [ ] Access logs reviewed
- [ ] Incident response plan

### Backup Strategy

- [ ] Daily automated backups
- [ ] Off-site backup storage
- [ ] Backup verification
- [ ] Disaster recovery plan
- [ ] RTO/RPO defined

---

## Support & Maintenance

### Regular Maintenance Tasks

**Daily**

- Check service health
- Review error logs
- Monitor resource usage

**Weekly**

- Review security logs
- Check backup integrity
- Update dependencies

**Monthly**

- Security audit
- Performance review
- Capacity planning
- Update documentation

### Emergency Contacts

- System Administrator: [contact]
- Database Administrator: [contact]
- Security Team: [contact]
- On-Call Engineer: [contact]

---

## Conclusion

Following this guide ensures a secure, reliable production deployment of the Finance Dashboard application.

**Key Points:**

- Always use strong, unique secrets
- Enable SSL/TLS for production
- Configure automated backups
- Monitor services regularly
- Keep system updated
- Document all changes

For additional support, refer to:

- [DOCKER.md](./DOCKER.md) - Docker deployment details
- [README.md](./README.md) - Application overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture

---

**Last Updated**: April 4, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
