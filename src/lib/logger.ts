const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

type LogMeta = Record<string, unknown> | undefined;

const DEFAULT_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'info';
const configuredLevel = (process.env.LOG_LEVEL || DEFAULT_LEVEL).toLowerCase() as LogLevel;
const activeLevel: LogLevel = LOG_LEVELS[configuredLevel] !== undefined ? configuredLevel : DEFAULT_LEVEL;

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'client_secret',
  'card',
  'address',
  'phone',
  'metadata',
  'items',
  'authorization',
  'cookie',
]);

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: process.env.NODE_ENV !== 'production' ? value.stack : undefined,
    };
  }

  if (typeof value === 'string') {
    return value.length > 200 ? `${value.slice(0, 197)}...` : value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (depth > 3) {
    return '[Depth limit reached]';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [];
    }

    const limited = value.slice(0, 3).map((item) => sanitizeValue(item, depth + 1));
    if (value.length > 3) {
      limited.push(`…and ${value.length - 3} more`);
    }
    return limited;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(normalizedKey)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    sanitized[key] = sanitizeValue(val, depth + 1);
  }

  return sanitized;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] <= LOG_LEVELS[activeLevel];
}

function prepareMeta(meta: LogMeta): unknown {
  if (!meta) {
    return undefined;
  }

  try {
    return sanitizeValue(meta);
  } catch {
    return undefined;
  }
}

function log(level: LogLevel, message: string, meta?: LogMeta) {
  const payload = prepareMeta(meta);

  switch (level) {
    case 'error':
      if (payload !== undefined) {
        console.error(message, payload);
      } else {
        console.error(message);
      }
      break;
    case 'warn':
      if (!shouldLog('warn')) return;
      if (payload !== undefined) {
        console.warn(message, payload);
      } else {
        console.warn(message);
      }
      break;
    case 'info':
      if (!shouldLog('info')) return;
      if (payload !== undefined) {
        console.info(message, payload);
      } else {
        console.info(message);
      }
      break;
    case 'debug':
      if (!shouldLog('debug')) return;
      if (payload !== undefined) {
        console.debug(message, payload);
      } else {
        console.debug(message);
      }
      break;
  }
}

export const logger = {
  error(message: string, meta?: LogMeta) {
    log('error', message, meta);
  },
  warn(message: string, meta?: LogMeta) {
    log('warn', message, meta);
  },
  info(message: string, meta?: LogMeta) {
    log('info', message, meta);
  },
  debug(message: string, meta?: LogMeta) {
    log('debug', message, meta);
  },
};

export type Logger = typeof logger;