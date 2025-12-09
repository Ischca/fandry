/**
 * Structured Logger for Railway
 *
 * Outputs JSON-formatted logs that Railway can parse and index.
 * All logs are emitted on a single line for proper parsing.
 *
 * Usage:
 *   import { logger } from './lib/logger';
 *   logger.info('User logged in', { userId: 123 });
 *   logger.error('Payment failed', { userId: 123, error: err });
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  // Common fields
  userId?: number;
  creatorId?: number;
  postId?: number;
  planId?: number;

  // Payment related
  amount?: number;
  pointsAmount?: number;
  stripeAmount?: number;
  paymentMethod?: string;
  operationType?: string;
  transactionId?: number;
  idempotencyKey?: string;

  // Stripe related
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeSubscriptionId?: string;

  // Request related
  requestId?: string;
  path?: string;
  method?: string;

  // Error related
  error?: Error | unknown;
  errorCode?: string;

  // Generic extension
  [key: string]: unknown;
}

interface StructuredLog {
  message: string;
  level: LogLevel;
  timestamp: string;
  service: string;
  [key: string]: unknown;
}

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const serviceName = process.env.SERVICE_NAME || 'fandry-api';

// Log level filtering (can be overridden by env var)
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
    return envLevel;
  }
  return isProduction ? 'info' : 'debug';
}

function shouldLog(level: LogLevel): boolean {
  const minLevel = getMinLogLevel();
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

/**
 * Serialize error objects for logging
 */
function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: isProduction ? undefined : error.stack,
    };
  }
  return { errorValue: String(error) };
}

/**
 * Create a structured log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext
): StructuredLog {
  const entry: StructuredLog = {
    message,
    level,
    timestamp: new Date().toISOString(),
    service: serviceName,
  };

  if (context) {
    // Handle error specially
    if (context.error) {
      const { error, ...rest } = context;
      Object.assign(entry, rest, serializeError(error));
    } else {
      Object.assign(entry, context);
    }
  }

  return entry;
}

/**
 * Output log to console
 */
function output(level: LogLevel, entry: StructuredLog): void {
  // In production, always output JSON on single line
  const logLine = JSON.stringify(entry);

  // Use appropriate console method for proper stderr/stdout routing
  switch (level) {
    case 'error':
      console.error(logLine);
      break;
    case 'warn':
      console.warn(logLine);
      break;
    case 'debug':
      console.debug(logLine);
      break;
    default:
      console.log(logLine);
  }
}

/**
 * Main logger interface
 */
export const logger = {
  debug(message: string, context?: LogContext): void {
    if (!shouldLog('debug')) return;
    output('debug', createLogEntry('debug', message, context));
  },

  info(message: string, context?: LogContext): void {
    if (!shouldLog('info')) return;
    output('info', createLogEntry('info', message, context));
  },

  warn(message: string, context?: LogContext): void {
    if (!shouldLog('warn')) return;
    output('warn', createLogEntry('warn', message, context));
  },

  error(message: string, context?: LogContext): void {
    if (!shouldLog('error')) return;
    output('error', createLogEntry('error', message, context));
  },

  /**
   * Create a child logger with preset context
   * Useful for request-scoped logging
   */
  child(baseContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) =>
        logger.debug(message, { ...baseContext, ...context }),
      info: (message: string, context?: LogContext) =>
        logger.info(message, { ...baseContext, ...context }),
      warn: (message: string, context?: LogContext) =>
        logger.warn(message, { ...baseContext, ...context }),
      error: (message: string, context?: LogContext) =>
        logger.error(message, { ...baseContext, ...context }),
    };
  },
};

/**
 * Payment-specific logger with common fields
 */
export function createPaymentLogger(context: {
  operationType: string;
  userId?: number;
  creatorId?: number;
  idempotencyKey?: string;
}) {
  return logger.child({
    operationType: context.operationType,
    userId: context.userId,
    creatorId: context.creatorId,
    idempotencyKey: context.idempotencyKey,
  });
}

/**
 * Request-scoped logger
 */
export function createRequestLogger(context: {
  requestId?: string;
  path?: string;
  method?: string;
  userId?: number;
}) {
  return logger.child(context);
}

export default logger;
