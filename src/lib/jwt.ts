import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { IUser } from './models/User';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ALGORITHM = 'HS256';

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable inside .env.local');
}

export const signToken = (user: Pick<IUser, 'id' | 'email' | 'name' | 'role'>): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: '7d',
      algorithm: JWT_ALGORITHM,
    }
  );
};

export const verifyToken = (token: string): any => {
  try {
    if (!token || typeof token !== 'string') {
      console.warn('JWT verification failed: Invalid token format');
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });

    // Additional validation
    if (!decoded || typeof decoded !== 'object') {
      console.warn('JWT verification failed: Invalid token payload');
      return null;
    }

    const payload = decoded as any;
    if (!payload.id || !payload.email || !payload.role) {
      console.warn('JWT verification failed: Missing required claims');
      return null;
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.warn('JWT verification failed: Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.warn('JWT verification failed: Invalid token');
    } else if (error instanceof jwt.NotBeforeError) {
      console.warn('JWT verification failed: Token not active');
    } else {
      console.error('JWT verification failed: Unknown error', error);
    }
    return null;
  }
};

export const getTokenFromRequest = (request: NextRequest): string | null => {
  const cookieToken = request.cookies.get('token');
  if (cookieToken?.value) {
    return cookieToken.value;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    return token.length > 0 ? token : null;
  }

  return null;
};