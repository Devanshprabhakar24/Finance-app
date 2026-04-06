import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import { env } from './config/env';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { generateCsrfToken, verifyCsrfToken } from './middleware/csrf';
import { responseTime } from './middleware/responseTime';
import { correlationId } from './middleware/correlationId';
import { requestTimeout } from './middleware/timeout';
import { logger } from './utils/logger';
import { httpRequestDuration, httpRequestTotal, registry } from './metrics';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import recordRoutes from './modules/records/record.routes';
import dashboardRoutes from './dashboard/dashboard.routes';

// Import swagger
import { swaggerSpec } from './swagger/swagger';

/**
 * Create Express application with production optimizations
 */
export const createApp = (): Application => {
  const app = express();

  // Section 2.2: Enable ETag support for conditional requests
  app.set('etag', 'strong');

  // Section 8.3: Trust proxy for correct IP detection behind load balancers
  app.set('trust proxy', env.nodeEnv === 'production' ? 1 : false);

  // Section 2.6: Response time tracking (must be first)
  app.use(responseTime());

  // Section 4.2: Correlation ID for request tracing
  app.use(correlationId());

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  
  // Section 8.1: CORS with dynamic origin validation
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);  // Allow server-to-server
      if (env.allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Correlation-ID'],
    exposedHeaders: ['X-Total-Count', 'X-Response-Time', 'X-Correlation-ID'],
    maxAge: 86400,
  }));
  
  app.use(mongoSanitize());
  app.use(hpp());
  app.use(cookieParser());

  // Section 8.2: Body size limits per route
  app.use('/api/auth', express.json({ limit: '10kb' }));
  app.use('/api/users', express.json({ limit: '10kb' }));
  app.use('/api/records', express.json({ limit: '100kb' }));
  app.use('/api/dashboard', express.json({ limit: '1kb' }));
  app.use(express.json({ limit: '10mb' }));  // Fallback
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Section 2.3: Optimized compression
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      const contentType = res.getHeader('Content-Type') as string || '';
      if (contentType.includes('image/') || contentType.includes('application/pdf')) return false;
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 512,
    memLevel: 8,
    strategy: 0,
    chunkSize: 16384,
  }));

  // Section 4.3: Structured HTTP logging via Winston
  const morganStream = {
    write: (message: string) => logger.http(message.trim()),
  };

  morgan.token('correlation-id', (req: any) => req.correlationId);
  app.use(
    morgan(
      env.nodeEnv === 'production'
        ? ':method :url :status :res[content-length] :response-time ms :correlation-id'
        : 'dev',
      { stream: morganStream }
    )
  );

  // Section 4.4: Metrics collection middleware
  app.use((req, res, next) => {
    const end = httpRequestDuration.startTimer();
    res.on('finish', () => {
      const route = req.route?.path || req.path;
      end({ method: req.method, route, status_code: res.statusCode });
      httpRequestTotal.inc({ method: req.method, route, status_code: res.statusCode });
    });
    next();
  });

  // Rate limiting
  app.use(globalLimiter);

  // CSRF protection
  app.use(generateCsrfToken);
  app.use(verifyCsrfToken);

  // Section 2.5: Request timeout middleware
  app.use('/api/records/:id/attachment', requestTimeout(30000));
  app.use('/api/users/me/avatar', requestTimeout(30000));
  app.use(requestTimeout(10000));  // Global fallback

  // Section 9.1: Health check with memory stats
  app.get('/api/health', (_req, res) => {
    const mem = process.memoryUsage();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
        external: `${Math.round(mem.external / 1024 / 1024)}MB`,
      },
      mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
  });

  // Section 4.4: Prometheus metrics endpoint
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/records', recordRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // Section 7.4: Disable Swagger in production
  if (env.nodeEnv !== 'production') {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  // 404 handler
  app.use(notFound);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};
