"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const hpp_1 = __importDefault(require("hpp"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./config/env");
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const csrf_1 = require("./middleware/csrf");
const responseTime_1 = require("./middleware/responseTime");
const correlationId_1 = require("./middleware/correlationId");
const timeout_1 = require("./middleware/timeout");
const logger_1 = require("./utils/logger");
const metrics_1 = require("./metrics");
// Import routes
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const user_routes_1 = __importDefault(require("./modules/users/user.routes"));
const record_routes_1 = __importDefault(require("./modules/records/record.routes"));
const dashboard_routes_1 = __importDefault(require("./dashboard/dashboard.routes"));
const migration_routes_1 = __importDefault(require("./routes/migration.routes"));
// Import swagger
const swagger_1 = require("./swagger/swagger");
/**
 * Create Express application with production optimizations
 */
const createApp = () => {
    const app = (0, express_1.default)();
    // Section 2.2: Enable ETag support for conditional requests
    app.set('etag', 'strong');
    // Section 8.3: Trust proxy for correct IP detection behind load balancers
    app.set('trust proxy', env_1.env.nodeEnv === 'production' ? 1 : false);
    // Section 2.6: Response time tracking (must be first)
    app.use((0, responseTime_1.responseTime)());
    // Section 4.2: Correlation ID for request tracing
    app.use((0, correlationId_1.correlationId)());
    // Security middleware
    app.use((0, helmet_1.default)({
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
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true); // Allow server-to-server
            if (env_1.env.allowedOrigins.includes(origin))
                return callback(null, true);
            // Allow Vercel preview deployment URLs for this project
            if (/^https:\/\/finance-[a-z0-9-]+-devansh-prabhakars-projects\.vercel\.app$/.test(origin)) {
                return callback(null, true);
            }
            callback(new Error(`CORS: origin ${origin} not allowed`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Correlation-ID'],
        exposedHeaders: ['X-Total-Count', 'X-Response-Time', 'X-Correlation-ID'],
        maxAge: 86400,
    }));
    app.use((0, express_mongo_sanitize_1.default)());
    app.use((0, hpp_1.default)());
    app.use((0, cookie_parser_1.default)());
    // Section 8.2: Body size limits per route
    app.use('/api/auth', express_1.default.json({ limit: '10kb' }));
    app.use('/api/users', express_1.default.json({ limit: '10kb' }));
    app.use('/api/records', express_1.default.json({ limit: '100kb' }));
    app.use('/api/dashboard', express_1.default.json({ limit: '1kb' }));
    app.use(express_1.default.json({ limit: '10mb' })); // Fallback
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Section 2.3: Optimized compression
    app.use((0, compression_1.default)({
        filter: (req, res) => {
            if (req.headers['x-no-compression'])
                return false;
            const contentType = res.getHeader('Content-Type') || '';
            if (contentType.includes('image/') || contentType.includes('application/pdf'))
                return false;
            return compression_1.default.filter(req, res);
        },
        level: 6,
        threshold: 512,
        memLevel: 8,
        strategy: 0,
        chunkSize: 16384,
    }));
    // Section 4.3: Structured HTTP logging via Winston
    const morganStream = {
        write: (message) => logger_1.logger.http(message.trim()),
    };
    morgan_1.default.token('correlation-id', (req) => req.correlationId);
    app.use((0, morgan_1.default)(env_1.env.nodeEnv === 'production'
        ? ':method :url :status :res[content-length] :response-time ms :correlation-id'
        : 'dev', { stream: morganStream }));
    // Section 4.4: Metrics collection middleware
    app.use((req, res, next) => {
        const end = metrics_1.httpRequestDuration.startTimer();
        res.on('finish', () => {
            const route = req.route?.path || req.path;
            end({ method: req.method, route, status_code: res.statusCode });
            metrics_1.httpRequestTotal.inc({ method: req.method, route, status_code: res.statusCode });
        });
        next();
    });
    // Rate limiting
    app.use(rateLimiter_1.globalLimiter);
    // CSRF protection (disabled — app uses JWT Bearer auth, see csrf.ts)
    app.use(csrf_1.generateCsrfToken);
    app.use(csrf_1.verifyCsrfToken);
    // Section 2.5: Request timeout middleware
    app.use('/api/records/:id/attachment', (0, timeout_1.requestTimeout)(30000));
    app.use('/api/users/me/avatar', (0, timeout_1.requestTimeout)(30000));
    app.use((0, timeout_1.requestTimeout)(10000)); // Global fallback
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
            mongo: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected',
        });
    });
    // CSRF token endpoint — always issues a fresh token and sets the cookie.
    // The frontend calls this on startup, stores the token in memory, and sends
    // it back as X-CSRF-Token on every mutating request.
    app.get('/api/csrf-token', (req, res) => {
        // Force a fresh token on every call so the frontend is never stale
        const token = require('crypto').randomBytes(32).toString('hex');
        res.cookie('csrfToken', token, {
            httpOnly: false,
            secure: true,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000,
        });
        req.csrfToken = token; // keep in sync for any downstream middleware
        res.json({ csrfToken: token });
    });
    // Section 4.4: Prometheus metrics endpoint
    app.get('/metrics', async (_req, res) => {
        res.set('Content-Type', metrics_1.registry.contentType);
        res.end(await metrics_1.registry.metrics());
    });
    // API routes
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/users', user_routes_1.default);
    app.use('/api/records', record_routes_1.default);
    app.use('/api/dashboard', dashboard_routes_1.default);
    app.use('/api/migrate', migration_routes_1.default);
    // Section 7.4: Disable Swagger in production
    if (env_1.env.nodeEnv !== 'production') {
        app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
    }
    // 404 handler
    app.use(notFound_1.notFound);
    // Global error handler (must be last)
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
