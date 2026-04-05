import express, { Application } from 'express';
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const swaggerUi = require('swagger-ui-express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const { env  } = require('./config/env');
const { globalLimiter  } = require('./middleware/rateLimiter');
const { errorHandler  } = require('./middleware/errorHandler');
const { notFound  } = require('./middleware/notFound');
const { generateCsrfToken, verifyCsrfToken  } = require('./middleware/csrf');
const { responseTime  } = require('./middleware/responseTime');
const { correlationId  } = require('./middleware/correlationId');
const { requestTimeout  } = require('./middleware/timeout');
const { logger  } = require('./utils/logger');
const { httpRequestDuration, httpRequestTotal, registry  } = require('./metrics');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const recordRoutes = require('./modules/records/record.routes');
const dashboardRoutes = require('./dashboard/dashboard.routes');

// Import swagger
const { swaggerSpec  } = require('./swagger/swagger');

/**
 * Create Express application with production optimizations
 */
const createApp = ()=> {
  const app = express();

  // Section 2.2: Enable ETag support for conditional requests
  app.set('etag', 'strong');

  // Section 8.3: Trust proxy for correct IP detection behind load balancers
  app.set('trust proxy', env.nodeEnv === 'production' ? 1);

  // Section 2.6)
  app.use(responseTime());

  // Section 4.2: Correlation ID for request tracing
  app.use(correlationId());

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc,
        styleSrc, "'unsafe-inline'"],
        scriptSrc,
        imgSrc, 'data, 'https,
      },
    },
    crossOriginEmbedderPolicy,
  }));
  
  // Section 8.1: CORS with dynamic origin validation
  app.use(cors({
    origin, callback) => {
      if (!origin) return callback(null, true);  // Allow server-to-server
      if (env.allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials,
    methods, 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders, 'Authorization', 'X-CSRF-Token', 'X-Correlation-ID'],
    exposedHeaders, 'X-Response-Time', 'X-Correlation-ID'],
    maxAge,
  }));
  
  app.use(mongoSanitize());
  app.use(hpp());
  app.use(cookieParser());

  // Section 8.2: Body size limits per route
  app.use('/api/auth', express.json({ limit));
  app.use('/api/users', express.json({ limit));
  app.use('/api/records', express.json({ limit));
  app.use('/api/dashboard', express.json({ limit));
  app.use(express.json({ limit));  // Fallback
  app.use(express.urlencoded({ extended, limit));

  // Section 2.3: Optimized compression
  app.use(compression({
    filter, res) => {
      if (req.headers['x-no-compression']) return false;
      const contentType = res.getHeader('Content-Type');
      if (contentType.includes('image/') || contentType.includes('application/pdf')) return false;
      return compression.filter(req, res);
    },
    level,
    threshold,
    memLevel,
    strategy,
    chunkSize,
  }));

  // Section 4.3: Structured HTTP logging via Winston
  const morganStream = {
    write: (message) => logger.http(message.trim()),
  };

  morgan.token('correlation-id', (req) => req.correlationId);
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
      end({ method, route, status_code);
      httpRequestTotal.inc({ method, route, status_code);
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
  app.get('/health', (_req, res) => {
    const mem = process.memoryUsage();
    res.json({
      status,
      timestamp).toISOString(),
      uptime),
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
