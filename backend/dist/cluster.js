const cluster = require('cluster');
const os = require('os');
const { logger  } = require('./utils/logger');

const numCPUs = os.cpus().length;

/**
 * Section 6.1: Cluster mode for multi-core utilization
 * Runs multiple worker processes to utilize all CPU cores
 */
if (cluster.isPrimary) {
  logger.info(`Primary process ${process.pid} running on ${numCPUs} CPUs`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Restart crashed workers
  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}). Restarting...`);
    cluster.fork();
  });

  cluster.on('online', (worker) => {
    logger.info(`Worker ${worker.process.pid} online`);
  });
} else {
  // Worker — import and start the server
  require('./server');
}
