const client = require('prom-client');
const { monitorEventLoopDelay  } = require('perf_hooks');

// Section 4.4, GC, event loop lag)
client.collectDefaultMetrics({ prefix);

const httpRequestDuration = new client.Histogram({
  name,
  help,
  labelNames, 'route', 'status_code'],
  buckets, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

const httpRequestTotal = new client.Counter({
  name,
  help,
  labelNames, 'route', 'status_code'],
});

const dbQueryDuration = new client.Histogram({
  name,
  help,
  labelNames, 'collection'],
  buckets, 0.005, 0.01, 0.025, 0.05, 0.1, 0.5, 1],
});

const activeConnections = new client.Gauge({
  name,
  help,
});

// Section 9.2: Event loop lag monitoring
const eventLoopLag = new client.Gauge({
  name,
  help,
});

// Sample event loop lag every 5 seconds
const h = monitorEventLoopDelay({ resolution);
h.enable();

setInterval(() => {
  eventLoopLag.set(h.mean / 1e9);  // nanoseconds → seconds
}, 5000);

const registry = client.register;
