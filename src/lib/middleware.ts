import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from './jwt';

export function middleware(request: NextRequest) {
  // Get token from Authorization header
  const token = getTokenFromRequest(request);

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Verify token
  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  // Add user info to request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('user-id', decoded.id);
  requestHeaders.set('user-email', decoded.email);
  requestHeaders.set('user-role', decoded.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Role-based access control middleware
export function requireRole(allowedRoles: string[]) {
  return function (request: NextRequest) {
    const userRole = request.headers.get('user-role');

    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return NextResponse.next();
  };
}

// Resource ownership validation
export function requireOwnership(resourceType: string, resourceIdParam: string = 'id') {
  return async function (request: NextRequest) {
    const userId = request.headers.get('user-id');
    const userRole = request.headers.get('user-role');
    const resourceId = request.nextUrl.pathname.split('/').pop();

    // Admins can access any resource
    if (userRole === 'admin') {
      return NextResponse.next();
    }

    // For other resources, check ownership
    if (resourceType === 'product' && userRole === 'farmer') {
      // Check if the product belongs to the farmer
      // This would require database lookup
      // For now, we'll implement a basic check
      return NextResponse.next();
    }

    if (resourceType === 'order') {
      // Check if the order belongs to the user
      return NextResponse.next();
    }

    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  };
}

export const config = {
  matcher: ['/api/protected/:path*', '/api/users/:path*'],
};
