# Production Deployment Checklist

## Environment Variables

- [ ] MONGODB_URI points to Atlas M10+ cluster (not shared tier)
- [ ] JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are ≥64 random characters (use `openssl rand -hex 32`)
- [ ] REDIS_URL configured and Redis instance is in same region as app servers
- [ ] OTP_EMAIL_TEST_MODE=false
- [ ] OTP_SMS_TEST_MODE=false
- [ ] NODE_ENV=production
- [ ] ALLOWED_ORIGINS contains only production frontend URL(s)
- [ ] CLOUDINARY credentials are production account (not free tier if >1GB/month)

## Infrastructure

- [ ] Minimum 2 app instances behind load balancer (no single point of failure)
- [ ] MongoDB Atlas: enable VPC peering or Private Link (no public internet access)
- [ ] Redis: TLS enabled, AUTH password set
- [ ] SSL/TLS termination at load balancer level
- [ ] health check endpoint `/health` configured in load balancer target group

## MongoDB Atlas

- [ ] Enable Performance Advisor and follow index recommendations
- [ ] Enable Atlas Search if full-text search grows beyond 100k records
- [ ] Configure automated backups (daily snapshots, 7-day retention minimum)
- [ ] Set MongoDB Atlas alerts: CPU >80%, connections >80% of limit, replication lag >30s

## Monitoring

- [ ] Prometheus scraping `/metrics` every 15s
- [ ] Alert on: p95 latency >500ms, error rate >1%, memory >80%, event loop lag >100ms
- [ ] Centralized logging (Datadog, Loki, CloudWatch) ingesting structured JSON
- [ ] Uptime monitor on `/health` with SMS/Slack alert on failure

## Security

- [ ] Dependabot or Renovate configured for automatic security PRs
- [ ] `npm audit` passes with no critical/high vulnerabilities
- [ ] Private keys (RSA, JWT secrets) stored in secrets manager, not .env files
- [ ] Rate limit counters stored in Redis (not in-memory)
- [ ] Swagger UI disabled in production (`NODE_ENV !== 'production'`)

## Performance

- [ ] All MongoDB indexes created and synchronized
- [ ] Redis-backed rate limiting configured
- [ ] Cluster mode enabled for multi-core utilization
- [ ] Load balancer keepalive timeout < server keepAliveTimeout (65s)
- [ ] CDN configured for static assets

## Testing

- [ ] All 246 tests passing (100% pass rate)
- [ ] Load testing completed with expected traffic patterns
- [ ] Failover testing completed (database, Redis, Cloudinary)
- [ ] Security scanning completed (OWASP ZAP, Burp Suite)

## Deployment

- [ ] CI/CD pipeline configured with automated tests
- [ ] Blue-green or canary deployment strategy in place
- [ ] Rollback procedure documented and tested
- [ ] Database migration strategy documented
- [ ] Monitoring dashboards created and accessible to team
