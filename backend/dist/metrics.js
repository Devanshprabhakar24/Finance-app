"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registry = exports.activeConnections = exports.dbQueryDuration = exports.httpRequestTotal = exports.httpRequestDuration = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
const perf_hooks_1 = require("perf_hooks");
// Section 4.4: Collect default Node.js metrics (heap, GC, event loop lag)
prom_client_1.default.collectDefaultMetrics({ prefix: 'finance_' });
exports.httpRequestDuration = new prom_client_1.default.Histogram({
    name: 'finance_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});
exports.httpRequestTotal = new prom_client_1.default.Counter({
    name: 'finance_http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});
exports.dbQueryDuration = new prom_client_1.default.Histogram({
    name: 'finance_db_query_duration_seconds',
    help: 'Duration of MongoDB queries in seconds',
    labelNames: ['operation', 'collection'],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.5, 1],
});
exports.activeConnections = new prom_client_1.default.Gauge({
    name: 'finance_active_connections',
    help: 'Number of active HTTP connections',
});
// Section 9.2: Event loop lag monitoring
const eventLoopLag = new prom_client_1.default.Gauge({
    name: 'finance_event_loop_lag_seconds',
    help: 'Event loop lag in seconds',
});
// Sample event loop lag every 5 seconds
const h = (0, perf_hooks_1.monitorEventLoopDelay)({ resolution: 20 });
h.enable();
setInterval(() => {
    eventLoopLag.set(h.mean / 1e9); // nanoseconds → seconds
}, 5000);
exports.registry = prom_client_1.default.register;
