// Simple Node.js server that bypasses all TypeScript issues
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const port = process.env.PORT || 8000;

// Basic middleware
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple logger
const log = (level, message) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} [${level.toUpperCase()}] ${message}`);
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    log('info', 'Health check requested');
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Finance Dashboard Backend is running',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
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
            docs: '/api/docs'
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
            { path: '/api/docs', method: 'GET', description: 'API documentation' }
        ]
    });
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