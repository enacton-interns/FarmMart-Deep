import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { UserModel } from '@/lib/models';
import { signToken } from '@/lib/jwt';
import { rateLimit, validators, accountLockout } from '@/lib/security';
import { isValidEmail } from '@/lib/validation';
import {logger} from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    if (await rateLimit.check(clientIP, 5, 15 * 60 * 1000)) { // 5 login attempts per 15 minutes
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Get login data from request body with JSON validation
    let loginData;
    try {
      const body = await request.text();
      if (!body || body.trim().length === 0) {
        return NextResponse.json(
          { error: 'Request body is required' },
          { status: 400 }
        );
      }
      loginData = JSON.parse(body);
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate request size (max 10KB for login)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      );
    }

    const { email, password } = loginData;

    // Sanitize inputs to prevent injection attacks
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
    const sanitizedPassword = typeof password === 'string' ? password.trim() : '';

    // Comprehensive input validation
    if (!validators.nonEmptyString(normalizedEmail) || !isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    if (!validators.nonEmptyString(sanitizedPassword) || sanitizedPassword.length > 255) {
      return NextResponse.json(
        { error: 'Password is required and must be less than 255 characters' },
        { status: 400 }
      );
    }

    // Check if account is locked
    if (await accountLockout.isLocked(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Account is temporarily locked due to too many failed attempts. Try again later.' },
        { status: 429 }
      );
    }

    // Initialize user model
    const userModel = new UserModel(pool);

    // Find user by email
    const user = await userModel.findByEmail(normalizedEmail);  
    if (!user) {
      // Record failed attempt for non-existent accounts too (prevents user enumeration)
      await accountLockout.recordFailedAttempt(normalizedEmail);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare passwords
    const isPasswordValid = await userModel.comparePassword(sanitizedPassword, user.password);
    if (!isPasswordValid) {
      // Record failed attempt
      const isLocked = await accountLockout.recordFailedAttempt(normalizedEmail);
      const remainingAttempts = await accountLockout.getRemainingAttempts(normalizedEmail);

      if (isLocked) {
        return NextResponse.json(
          { error: 'Account locked due to too many failed attempts. Try again in 15 minutes.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: 'Invalid credentials',
          remainingAttempts: remainingAttempts > 0 ? remainingAttempts : undefined
        },
        { status: 401 }
      );
    }

    // Clear failed attempts on successful login
    await accountLockout.clearFailedAttempts(normalizedEmail);

    // Generate JWT token
    const token = signToken(user);

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

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: userResponse,
      },
      { status: 200 }
    );
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    logger.error('Login error:', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
