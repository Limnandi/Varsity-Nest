import winston from 'winston';
import { NextRequest } from 'next/server';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'demo-stuff' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export type LogContext = {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  [key: string]: any;
};

export const log = {
  info: (message: string, context?: LogContext) => {
    logger.info(message, context);
  },
  error: (message: string, error: Error, context?: LogContext) => {
    logger.error(message, {
      ...context,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    });
  },
  warn: (message: string, context?: LogContext) => {
    logger.warn(message, context);
  },
  debug: (message: string, context?: LogContext) => {
    logger.debug(message, context);
  },
  http: (req: NextRequest, context?: LogContext) => {
    logger.http(`${req.method} ${req.url}`, {
      ...context,
      headers: req.headers,
      ip: req.ip
    });
  }
};

export default log;
