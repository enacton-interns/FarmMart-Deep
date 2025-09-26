import crypto from 'crypto';
import pool from './mongodb'

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

// Rate limiting utility (in-memory implementation)
// In production, you would use Redis or another distributed store
export const accountLockout = {
  isLocked: async (identifier: string): Promise<boolean> => {
    const { rows } = await pool.query(
      'SELECT lockout_until FROM account_lockouts WHERE identifier = $1',
      [identifier]
    );

    if(rows.length === 0) {
      return false;
    }
    
    // Check if the window has reset
    const lockout_until = rows[0].lockout_until as Date | null;
    
    if(!lockout_until){
      return false;
    }

    await pool.query(
      'UPDATE account_lockouts SET attempts = 0, lockout_until = NULL, updated_at = NOW() WHERE identifier = $1',
      [identifier]
    );
    return false;
  },
  
  // Get the remaining requests and reset time
  recordFailedAttempt: async (
    identifier: string,
    maxAttempts: number = 5,
    lockoutMinutes: number = 15
  ): Promise<boolean> => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        'SELECT attempts, lockout_until FROM account_lockouts WHERE identifier = $1 FOR UPDATE',
        [identifier]
      );

      const now = new Date();
      let attempts = rows[0]?.attempts ?? 0;
      let lockoutUntil = rows[0]?.lockout_until ? new Date(rows[0].lockout_until) : null;

      if (lockoutUntil && lockoutUntil > now) {
        await client.query('COMMIT');
        return true;
      }

      if (lockoutUntil && lockoutUntil <= now) {
        attempts = 0;
        lockoutUntil = null;
      }

      attempts += 1;

      if (attempts >= maxAttempts) {
        lockoutUntil = new Date(now.getTime() + lockoutMinutes * 60 * 1000);
        attempts = 0;
      }

      if (rows.length > 0) {
        await client.query(
          'UPDATE account_lockouts SET attempts = $2, lockout_until = $3, updated_at = NOW() WHERE identifier = $1',
          [identifier, attempts, lockoutUntil]
        );
      } else {
        await client.query(
          'INSERT INTO account_lockouts(identifier, attempts, lockout_until, updated_at) VALUES ($1, $2, $3, NOW())',
          [identifier, attempts, lockoutUntil]
        );
      }

      await client.query('COMMIT');
      return lockoutUntil !== null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  clearFailedAttempts: async (identifier: string): Promise<void> => {
    await pool.query('DELETE FROM account_lockouts WHERE identifier = $1', [identifier]);
  },

  getRemainingAttempts: async (identifier: string, maxAttempts: number = 5): Promise<number> => {
    const { rows } = await pool.query(
      'SELECT attempts, lockout_until FROM account_lockouts WHERE identifier = $1',
      [identifier]
    );

    if (rows.length === 0) {
      return maxAttempts;
    }

    const lockoutUntil = rows[0].lockout_until ? new Date(rows[0].lockout_until) : null;
    if (lockoutUntil && lockoutUntil > new Date()) {
      return 0;
    }

    const attempts = rows[0].attempts ?? 0;
    return Math.max(0, maxAttempts - attempts);
  }
};

export const rateLimit = {
  check: async (identifier: string, limit: number, windowMs: number): Promise<boolean> => {
    const windowMsSafe = Math.max(windowMs, 1);
    const { rows } = await pool.query(
      `
        INSERT INTO rate_limit_counters(identifier, count, reset_time)
        VALUES ($1, 1, NOW() + ($2::bigint * INTERVAL '1 millisecond'))
        ON CONFLICT (identifier)
        DO UPDATE SET
          count = CASE
            WHEN NOW() > rate_limit_counters.reset_time THEN 1
            ELSE rate_limit_counters.count + 1
          END,
          reset_time = CASE
            WHEN NOW() > rate_limit_counters.reset_time THEN NOW() + ($2::bigint * INTERVAL '1 millisecond')
            ELSE rate_limit_counters.reset_time
          END,
          updated_at = NOW()
        RETURNING count;
      `,
      [identifier, windowMsSafe]
    );

    const count = rows[0]?.count ?? 0;
    return count > limit;
  },

  getStatus: async (
    identifier: string
  ): Promise<{ count: number; resetTime: number } | null> => {
    const { rows } = await pool.query(
      'SELECT count, EXTRACT(EPOCH FROM reset_time) * 1000 AS reset_timestamp FROM rate_limit_counters WHERE identifier = $1',
      [identifier]
    );

    if (rows.length === 0) {
      
      return null;
    }
    
    return {
      count: rows[0].count,
      resetTime: Number(rows[0].reset_timestamp)
    };
  },
  
  // Clean up expired records (call this periodically)
  cleanup: async (): Promise<void> => {
    await pool.query('DELETE FROM rate_limit_counters WHERE reset_time < NOW()');
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
