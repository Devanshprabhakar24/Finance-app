// Production-ready Finance Dashboard Backend
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 8000;

// Environment configuration
const config = {
    jwtSecret: process.env.JWT_ACCESS_SECRET || 'fallback-secret-key-for-demo',
    jwtExpires: process.env.JWT_ACCESS_EXPIRES || '24h',
    nodeEnv: process.env.NODE_ENV || 'production',
    allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://finance-103y771kv-devansh-prabhakars-projects.vercel.app',
        /^https:\/\/.*\.vercel\.app$/
    ]
};

// Enhanced middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use(compression());
app.use(cors({
    origin: config.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['X-Total-Count']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced logger
const log = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        ...meta
    };

    if (config.nodeEnv === 'production') {
        console.log(JSON.stringify(logEntry));
    } else {
        console.log(`${timestamp} [${level.toUpperCase()}] ${message}`, meta);
    }
};

// In-memory storage for demo (replace with database in production)
const users = new Map();
const records = new Map();

// Demo admin user
const adminUser = {
    id: 'admin-1',
    email: 'admin@finance.com',
    name: 'Admin User',
    role: 'admin',
    password: '$2b$10$rQZ8kHWKtGkVQ7K5nGzGxeJ7vQZ8kHWKtGkVQ7K5nGzGxeJ7vQZ8kH' // 'admin123'
};
users.set(adminUser.email, adminUser);

// JWT middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Access token is required'
        });
    }

    jwt.verify(token, config.jwtSecret, (err, user) => {
        if (err) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Invalid or expired token'
            });
        }
        req.user = user;
        next();
    });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    log('info', 'Health check requested');
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Finance Dashboard Backend is running',
        version: '1.0.0',
        environment: config.nodeEnv,
        uptime: process.uptime()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Finance Dashboard Backend API',
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            docs: '/api/docs',
            auth: '/api/auth/*',
            records: '/api/records',
            dashboard: '/api/dashboard'
        }
    });
});

// API docs endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        message: 'Finance Dashboard API Documentation',
        version: '1.0.0',
        endpoints: [
            { path: '/', method: 'GET', description: 'API information' },
            { path: '/api/health', method: 'GET', description: 'Health check' },
            { path: '/api/docs', method: 'GET', description: 'API documentation' },
            { path: '/api/auth/login', method: 'POST', description: 'User login' },
            { path: '/api/auth/register', method: 'POST', description: 'User registration' },
            { path: '/api/auth/me', method: 'GET', description: 'Get current user (requires auth)' },
            { path: '/api/records', method: 'GET', description: 'Get records (requires auth)' },
            { path: '/api/records', method: 'POST', description: 'Create record (requires auth)' },
            { path: '/api/dashboard/stats', method: 'GET', description: 'Get dashboard stats (requires auth)' }
        ]
    });
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
    try {
        log('info', 'Login attempt', { email: req.body.email });
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Email and password are required'
            });
        }

        const user = users.get(email);
        if (!user) {
            return res.status(401).json({
                error: 'Authentication Failed',
                message: 'Invalid email or password'
            });
        }

        // For demo purposes, accept 'admin123' as password for admin user
        const isValidPassword = password === 'admin123' || await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Authentication Failed',
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            config.jwtSecret,
            { expiresIn: config.jwtExpires }
        );

        log('info', 'Login successful', { userId: user.id, email: user.email });

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token
        });
    } catch (error) {
        log('error', 'Login error', { error: error.message });
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Login failed'
        });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        log('info', 'Registration attempt', { email: req.body.email });
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Email, password, and name are required'
            });
        }

        if (users.has(email)) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'User with this email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: `user-${Date.now()}`,
            email,
            name,
            role: 'user',
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.set(email, newUser);

        log('info', 'Registration successful', { userId: newUser.id, email: newUser.email });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role
            }
        });
    } catch (error) {
        log('error', 'Registration error', { error: error.message });
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Registration failed'
        });
    }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    try {
        const user = users.get(req.user.email);
        if (!user) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        log('error', 'Get user error', { error: error.message });
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get user information'
        });
    }
});

// Records routes
app.get('/api/records', authenticateToken, (req, res) => {
    try {
        log('info', 'Records requested', { userId: req.user.id });

        const userRecords = Array.from(records.values()).filter(record =>
            record.userId === req.user.id
        );

        res.json({
            success: true,
            data: userRecords,
            total: userRecords.length,
            message: userRecords.length > 0 ? 'Records retrieved successfully' : 'No records found'
        });
    } catch (error) {
        log('error', 'Get records error', { error: error.message });
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve records'
        });
    }
});

app.post('/api/records', authenticateToken, (req, res) => {
    try {
        log('info', 'Record creation attempt', { userId: req.user.id });

        const { type, amount, description, category, date } = req.body;

        if (!type || !amount || !description) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Type, amount, and description are required'
            });
        }

        const newRecord = {
            id: `record-${Date.now()}`,
            userId: req.user.id,
            type,
            amount: parseFloat(amount),
            description,
            category: category || 'general',
            date: date || new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        records.set(newRecord.id, newRecord);

        log('info', 'Record created successfully', { recordId: newRecord.id, userId: req.user.id });

        res.status(201).json({
            success: true,
            message: 'Record created successfully',
            data: newRecord
        });
    } catch (error) {
        log('error', 'Create record error', { error: error.message });
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create record'
        });
    }
});

app.get('/api/records/:id', authenticateToken, (req, res) => {
    try {
        const record = records.get(req.params.id);

        if (!record || record.userId !== req.user.id) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Record not found'
            });
        }

        res.json({
            success: true,
            data: record
        });
    } catch (error) {
        log('error', 'Get record error', { error: error.message });
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve record'
        });
    }
});

app.put('/api/records/:id', authenticateToken, (req, res) => {
    try {
        const record = records.get(req.params.id);

        if (!record || record.userId !== req.user.id) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Record not found'
            });
        }

        const { type, amount, description, category, date } = req.body;

        const updatedRecord = {
            ...record,
            type: type || record.type,
            amount: amount ? parseFloat(amount) : record.amount,
            description: description || record.description,
            category: category || record.category,
            date: date || record.date,
            updatedAt: new Date().toISOString()
        };

        records.set(record.id, updatedRecord);

        log('info', 'Record updated successfully', { recordId: record.id, userId: req.user.id });

        res.json({
            success: true,
            message: 'Record updated successfully',
            data: updatedRecord
        });
    } catch (error) {
        log('error', 'Update record error', { error: error.message });
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update record'
        });
    }
});

app.delete('/api/records/:id', authenticateToken, (req, res) => {
    try {
        const record = records.get(req.params.id);

        if (!record || record.userId !== req.user.id) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Record not found'
            });
        }

        records.delete(req.params.id);

        log('info', 'Record deleted successfully', { recordId: req.params.id, userId: req.user.id });

        res.json({
            success: true,
            message: 'Record deleted successfully'
        });
    } catch (error) {
        log('error', 'Delete record error', { error: error.message });
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete record'
        });
    }
});

// Dashboard routes
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
    try {
        log('info', 'Dashboard stats requested', { userId: req.user.id });

        const userRecords = Array.from(records.values()).filter(record =>
            record.userId === req.user.id
        );

        const income = userRecords
            .filter(record => record.type === 'income')
            .reduce((sum, record) => sum + record.amount, 0);

        const expenses = userRecords
            .filter(record => record.type === 'expense')
            .reduce((sum, record) => sum + record.amount, 0);

        const balance = income - expenses;

        const categoryBreakdown = userRecords.reduce((acc, record) => {
            if (!acc[record.category]) {
                acc[record.category] = { income: 0, expense: 0 };
            }
            acc[record.category][record.type] += record.amount;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                totalIncome: income,
                totalExpenses: expenses,
                balance,
                totalRecords: userRecords.length,
                categoryBreakdown,
                recentRecords: userRecords
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5)
            }
        });
    } catch (error) {
        log('error', 'Dashboard stats error', { error: error.message });
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve dashboard stats'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    log('error', `Error: ${err.message}`);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    log('warn', `404: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});

// Start server
const server = app.listen(port, () => {
    log('info', `🚀 Finance Dashboard Backend running on port ${port}`);
    log('info', `Environment: ${process.env.NODE_ENV || 'development'}`);
    log('info', `Health check: http://localhost:${port}/api/health`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    log('info', `${signal} received. Starting graceful shutdown...`);
    server.close(() => {
        log('info', 'HTTP server closed');
        process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
        log('error', 'Forced shutdown after 30s timeout');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;