import client from 'prom-client';
import { monitorEventLoopDelay } from 'perf_hooks';

// Section 4.4: Collect default Node.js metrics (heap, GC, event loop lag)
client.collectDefaultMetrics({ prefix: 'finance_' });

export const httpRequestDuration = new client.Histogram({
  name: 'finance_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

export const httpRequestTotal = new client.Counter({
  name: 'finance_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const dbQueryDuration = new client.Histogram({
  name: 'finance_db_query_duration_seconds',
  help: 'Duration of MongoDB queries in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.5, 1],
});

export const activeConnections = new client.Gauge({
  name: 'finance_active_connections',
  help: 'Number of active HTTP connections',
});

// Section 9.2: Event loop lag monitoring
const eventLoopLag = new client.Gauge({
  name: 'finance_event_loop_lag_seconds',
  help: 'Event loop lag in seconds',
});

// Sample event loop lag every 5 seconds
const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();

setInterval(() => {
  eventLoopLag.set(h.mean / 1e9);  // nanoseconds → seconds
}, 5000);

export const registry = client.register;
