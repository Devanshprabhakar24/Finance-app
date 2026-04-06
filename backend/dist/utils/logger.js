"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const env_1 = require("../config/env");
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston_1.default.addColors(colors);
// Section 4.1: Structured JSON logging in production
const productionFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
const developmentFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`));
const transports = [
    new winston_1.default.transports.Console(),
];
// Only write to files in non-production (production uses stdout → log aggregator)
if (env_1.env.nodeEnv !== 'production') {
    transports.push(new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }), new winston_1.default.transports.File({ filename: 'logs/all.log' }));
}
exports.logger = winston_1.default.createLogger({
    level: env_1.env.nodeEnv === 'production' ? 'info' : 'debug',
    levels,
    format: env_1.env.nodeEnv === 'production' ? productionFormat : developmentFormat,
    transports,
    exitOnError: false,
});
