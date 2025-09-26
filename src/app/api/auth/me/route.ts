import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { UserModel } from '@/lib/models';
import { getTokenFromRequest ,verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
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

    // Initialize user model
    const userModel = new UserModel(pool);

    // Find user by ID
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data without password
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      address: user.address,
      phone: user.phone,
      createdAt: user.createdAt,
    };

    return NextResponse.json(
      {
        user: userResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}