"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
const logger_1 = require("./utils/logger");
const numCPUs = os_1.default.cpus().length;
/**
 * Section 6.1: Cluster mode for multi-core utilization
 * Runs multiple worker processes to utilize all CPU cores
 */
if (cluster_1.default.isPrimary) {
    logger_1.logger.info(`Primary process ${process.pid} running on ${numCPUs} CPUs`);
    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster_1.default.fork();
    }
    // Restart crashed workers
    cluster_1.default.on('exit', (worker, code, signal) => {
        logger_1.logger.warn(`Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}). Restarting...`);
        cluster_1.default.fork();
    });
    cluster_1.default.on('online', (worker) => {
        logger_1.logger.info(`Worker ${worker.process.pid} online`);
    });
}
else {
    // Worker — import and start the server
    require('./server');
}
