import crypto from 'crypto';

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
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;')
    .trim();
};

// Advanced input sanitization for SQL injection prevention
export const sanitizeForSQL = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/'/g, "''") // Escape single quotes for SQL
    .replace(/;/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comments
    .trim();
};

// Account lockout mechanism
const lockoutStore = new Map<string, { attempts: number; lockoutUntil: number }>();

export const accountLockout = {
  // Check if account is locked
  isLocked: (identifier: string): boolean => {
    const record = lockoutStore.get(identifier);
    if (!record) return false;

    const now = Date.now();
    if (now > record.lockoutUntil) {
      lockoutStore.delete(identifier); // Lockout expired
      return false;
    }

    return true;
  },

  // Record failed attempt
  recordFailedAttempt: (identifier: string, maxAttempts: number = 5, lockoutMinutes: number = 15): boolean => {
    const record = lockoutStore.get(identifier) || { attempts: 0, lockoutUntil: 0 };
    record.attempts++;

    if (record.attempts >= maxAttempts) {
      record.lockoutUntil = Date.now() + (lockoutMinutes * 60 * 1000);
      lockoutStore.set(identifier, record);
      return true; // Account is now locked
    }

    lockoutStore.set(identifier, record);
    return false; // Account not locked yet
  },

  // Clear failed attempts on successful login
  clearFailedAttempts: (identifier: string): void => {
    lockoutStore.delete(identifier);
  },

  // Get remaining attempts
  getRemainingAttempts: (identifier: string, maxAttempts: number = 5): number => {
    const record = lockoutStore.get(identifier);
    if (!record) return maxAttempts;
    return Math.max(0, maxAttempts - record.attempts);
  }
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
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = {
  // Check if a request should be rate limited
  check: (identifier: string, limit: number, windowMs: number): boolean => {
    const now = Date.now();
    const record = rateLimitStore.get(identifier);
    
    if (!record) {
      // First request from this identifier
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return false;
    }
    
    // Check if the window has reset
    if (now > record.resetTime) {
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return false;
    }
    
    // Increment the count
    record.count++;
    
    // Check if the limit has been exceeded
    if (record.count > limit) {
      return true; // Rate limited
    }
    
    return false;
  },
  
  // Get the remaining requests and reset time
  getStatus: (identifier: string): { remaining: number; resetTime: number } | null => {
    const record = rateLimitStore.get(identifier);
    
    if (!record) {
      return null;
    }
    
    return {
      remaining: Math.max(0, record.count),
      resetTime: record.resetTime
    };
  },
  
  // Clean up expired records (call this periodically)
  cleanup: (): void => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    });
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
