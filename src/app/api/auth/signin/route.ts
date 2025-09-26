import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { UserModel } from '@/lib/models';
import { validateLogin } from '@/lib/validation';
import { signToken } from '@/lib/jwt';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    const validation = validateLogin({ email, password });
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Initialize user model
    const userModel = new UserModel(pool);

    // Find user by email
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
    const user = await userModel.findByEmail(normalizedEmail);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Use the UserModel's comparePassword method
    const isPasswordValid = await userModel.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signToken(user);

    // Return success response with token and basic user data
    const response =  NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;

  } catch (error) {
    logger.error('Login error:', {error});
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
