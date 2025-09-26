import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { UserModel } from '@/lib/models';
import { verifyToken } from '@/lib/jwt';
import { validateUpdateProfile } from '@/lib/validation';
import { sanitizeInput } from '@/lib/security';

export async function PUT(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { name, address, phone } = await request.json();

    // Validate input
    const validation = validateUpdateProfile({ name, address, phone });
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Sanitize input - allow empty strings to be saved
    const sanitizedData = {
      name: sanitizeInput(name),
      address: address !== undefined ? sanitizeInput(address) : undefined,
      phone: phone !== undefined ? sanitizeInput(phone) : undefined,
    };

    // Initialize user model
    const userModel = new UserModel(pool);

    // Update user profile
    const updatedUser = await userModel.update(decoded.id, sanitizedData);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return updated user data (without password)
    const userResponse = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      address: updatedUser.address,
      phone: updatedUser.phone,
      createdAt: updatedUser.createdAt,
    };

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        user: userResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
