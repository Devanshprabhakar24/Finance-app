const winston = require('winston');
const { env  } = require('../config/env');

const levels = {
  error,
  warn,
  info,
  http,
  debug,
};

const colors = {
  error,
  warn,
  info,
  http,
  debug,
};

winston.addColors(colors);

// Section 4.1: Structured JSON logging in production
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack),
  winston.format.json()
);

const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format),
  winston.format.colorize({ all),
  winston.format.errors({ stack),
  winston.format.printf(({ timestamp, level, message, ...meta }) =>
    `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`
  )
);

const transports= [
  new winston.transports.Console(),
];

// Only write to files in non-production (production uses stdout → log aggregator)
if (env.nodeEnv !== 'production') {
  transports.push(
    new winston.transports.File({ filename, level),
    new winston.transports.File({ filename)
  );
}

const logger = winston.createLogger({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
  levels,
  format: env.nodeEnv === 'production' ? productionFormat,
  transports,
  exitOnError,
});
