import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { UserModel } from '@/lib/models';
import jwt from 'jsonwebtoken';
import { validateLogin } from '@/lib/validation';
import { sanitizeInput } from '@/lib/security';
import { getRequiredEnvVar } from '../../../../lib/env';

const JWT_SECRET = getRequiredEnvVar('JWT_SECRET');

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

    // Sanitize input
    const sanitizedEmail = sanitizeInput(email);

    // Initialize user model
    const userModel = new UserModel(pool);

    // Find user by email
    const user = await userModel.findByEmail(sanitizedEmail);
    if (!user) {
      console.log(`User not found for email: ${sanitizedEmail}`);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password using the User model's comparePassword method
    console.log(`Comparing passwords for user: ${sanitizedEmail}`);
    
    // Use the UserModel's comparePassword method
    const isPasswordValid = await userModel.comparePassword(password, user.password);
    console.log(`Password validation result: ${isPasswordValid}`);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success response with token and basic user data
    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
