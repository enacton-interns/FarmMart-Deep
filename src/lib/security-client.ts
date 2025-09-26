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
const HTML_ESCAPE_LOOKUP: Record<string, string> = {
  '&': '&',
  '<': '<',
  '>': '>',
  '"': '"',
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
