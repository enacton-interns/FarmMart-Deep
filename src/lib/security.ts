import crypto from 'crypto';
import pool from './mongodb'
import redisClient from './redis';

// Generate a random token
export const generateRandomToken = (length = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash a password using bcrypt (this would be implemented in the actual application)
export const hashPassword = async (password: string): Promise<string> => {
  // In a real implementation, you would use bcrypt:
  // return await bcrypt.hash(password, 10);
  // For now, we'll use a simple hash for demonstration
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Compare a password with a hash
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  // In a real implementation, you would use bcrypt:
  // return await bcrypt.compare(password, hash);
  // For now, we'll use a simple comparison for demonstration
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  return passwordHash === hash;
};

// Sanitize user input to prevent XSS
const HTML_ESCAPE_LOOKUP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[&<>"']/g, (char) => HTML_ESCAPE_LOOKUP[char])
    .trim();
};



// Validate and sanitize an email
export const validateEmail = (email: string): { isValid: boolean; sanitized?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  
  if (!isValid) {
    return { isValid: false };
  }
  
  // Basic sanitization - in a real app, you might want more thorough sanitization
  const sanitized = email.trim().toLowerCase();
  
  return { isValid: true, sanitized };
};

const ACCOUNT_LOCKOUT_ATTEMPTS_PREFIX = 'account:lockout:attempts:';
const ACCOUNT_LOCKOUT_UNTIL_PREFIX = 'account:lockout:until:';
const RATE_LIMIT_PREFIX = 'ratelimit:';
export const accountLockout = {
  isLocked: async (identifier: string): Promise<boolean> => {
    const lockoutUntilRaw = await redisClient.get(`${ACCOUNT_LOCKOUT_UNTIL_PREFIX}${identifier}`);
    if (!lockoutUntilRaw) {
      return false;
    }
    
    // Check if the window has reset
    const lockoutUntil = parseInt(lockoutUntilRaw, 10);
    if (Number.isNaN(lockoutUntil) || lockoutUntil <= Date.now()) {
      await redisClient.del(
        `${ACCOUNT_LOCKOUT_UNTIL_PREFIX}${identifier}`,
        `${ACCOUNT_LOCKOUT_ATTEMPTS_PREFIX}${identifier}`
      );
      return false;
    }

    return true;
  },
  
  // Get the remaining requests and reset time
  recordFailedAttempt: async (
    identifier: string,
    maxAttempts: number = 5,
    lockoutMinutes: number = 15
  ): Promise<boolean> => {
    const lockoutKey = `${ACCOUNT_LOCKOUT_UNTIL_PREFIX}${identifier}`;
    const attemptsKey = `${ACCOUNT_LOCKOUT_ATTEMPTS_PREFIX}${identifier}`;
    const existingLockout = await redisClient.get(lockoutKey);
    const windowMs = Math.max(lockoutMinutes, 1) * 60 * 1000;

    if (existingLockout) {
      const lockoutUntil = parseInt(existingLockout, 10);
      if (!Number.isNaN(lockoutUntil) && lockoutUntil > Date.now()) {
        return true;
      }
      await redisClient.del(lockoutKey);
    }

    const attempts = await redisClient.incr(attemptsKey);
    if (attempts === 1) {
      await redisClient.pexpire(attemptsKey, windowMs);
    }

    if (attempts >= maxAttempts) {
      const lockoutUntil = Date.now() + windowMs;
      await redisClient.set(lockoutKey, lockoutUntil.toString(), 'PX', windowMs);
      await redisClient.del(attemptsKey);
      return true;
    }

    return false;
  },

  clearFailedAttempts: async (identifier: string): Promise<void> => {
    await redisClient.del(
      `${ACCOUNT_LOCKOUT_ATTEMPTS_PREFIX}${identifier}`,
      `${ACCOUNT_LOCKOUT_UNTIL_PREFIX}${identifier}`
    );
  },

  getRemainingAttempts: async (identifier: string, maxAttempts: number = 5): Promise<number> => {
    const lockoutKey = `${ACCOUNT_LOCKOUT_UNTIL_PREFIX}${identifier}`;
    const attemptsKey = `${ACCOUNT_LOCKOUT_ATTEMPTS_PREFIX}${identifier}`;
    const lockoutUntilRaw = await redisClient.get(lockoutKey);
    if (lockoutUntilRaw) {
      const lockoutUntil = parseInt(lockoutUntilRaw, 10);
      if (!Number.isNaN(lockoutUntil) && lockoutUntil > Date.now()) {
        return 0;
      }
    }

    const attemptsRaw = await redisClient.get(attemptsKey);
    const attempts = attemptsRaw ? parseInt(attemptsRaw, 10) : 0;
    if (Number.isNaN(attempts)) {
      return maxAttempts;
    }

    return Math.max(0, maxAttempts - attempts);
  }
};

export const rateLimit = {
  check: async (identifier: string, limit: number, windowMs: number): Promise<boolean> => {
    const windowMsSafe = Math.max(windowMs, 1);
    const key = `${RATE_LIMIT_PREFIX}${identifier}`;
    const count = await redisClient.incr(key);
    if (count === 1) {
      await redisClient.pexpire(key, windowMsSafe);
    }
    return count > limit;
  },

  getStatus: async (
    identifier: string
  ): Promise<{ count: number; resetTime: number } | null> => {
    const key = `${RATE_LIMIT_PREFIX}${identifier}`;
    const [countRaw, ttl] = await Promise.all([
      redisClient.get(key),
      redisClient.pttl(key)
    ]);

    if (!countRaw) {
      return null;
    }
    const count = parseInt(countRaw, 10);
    if (Number.isNaN(count)) {
      return null;
    }

    const ttlMs = typeof ttl === 'number' ? ttl : -1;
    const resetTime = ttlMs > 0 ? Date.now() + ttlMs : Date.now();
    return {
      count,
      resetTime
    };
  },
  
  // Clean up expired records (call this periodically)
  cleanup: async (): Promise<void> => {
    // Redis handles expiration automatically, so no action is needed here
  }
};

// CSRF token generation and validation
export const csrf = {
  // Generate a CSRF token
  generate: (): string => {
    return crypto.randomBytes(32).toString('hex');
  },
  
  // Validate a CSRF token
  validate: (token: string, sessionToken: string): boolean => {
    // In a real implementation, you would compare the token with the one stored in the session
    // For now, we'll just check if they match
    return token === sessionToken;
  }
};

// Security headers for API responses
export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-src 'none'; object-src 'none';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Input validation helpers
export const validators = {
  // Validate a string is not empty
  nonEmptyString: (value: any): boolean => {
    return typeof value === 'string' && value.trim().length > 0;
  },
  
  // Validate a number is positive
  positiveNumber: (value: any): boolean => {
    return typeof value === 'number' && value > 0;
  },
  
  // Validate an ID (PostgreSQL integer ID converted to string)
  isValidId: (value: any): boolean => {
    return typeof value === 'string' && /^\d+$/.test(value);
  },
  
  // Validate a phone number (basic format)
  isValidPhone: (value: any): boolean => {
    return typeof value === 'string' && /^[\d\s\-\+\(\)]+$/.test(value);
  },
  
  // Validate a URL
  isValidUrl: (value: any): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
};

// Security middleware for API routes
export const securityMiddleware = (handler: any) => {
  return async (req: any, res: any) => {
    // Set security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // Continue to the handler
    return handler(req, res);
  };
};
