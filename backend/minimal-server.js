// Minimal server for Render deployment testing
const http = require('http');

const port = process.env.PORT || 8000;

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });

    if (req.url === '/api/health') {
        res.end(JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
            message: 'Minimal server is running'
        }));
    } else {
        res.end(JSON.stringify({
            message: 'Finance Dashboard Backend - Minimal Version',
            status: 'running',
            timestamp: new Date().toISOString(),
            port: port
        }));
    }
});

server.listen(port, () => {
    console.log(`🚀 Minimal server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});