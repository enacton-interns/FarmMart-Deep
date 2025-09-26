import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { UserModel } from '@/lib/models';
import { rateLimit } from '@/lib/security';
import { isValidEmail } from '@/lib/validation';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting - stricter for password reset
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    if (await rateLimit.check(clientIP, 3, 60 * 60 * 1000)) { // 3 requests per hour
      return NextResponse.json(
        { error: 'Too many password reset requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Get email from request body
    let email;
    try {
      const body = await request.text();
      if (!body || body.trim().length === 0) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        );
      }
      const data = JSON.parse(body);
      email = data.email;
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate email
    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Initialize user model
    const userModel = new UserModel(pool);

    // Check if user exists (but don't reveal this information for security)
    const user = await userModel.findByEmail(email.toLowerCase().trim());

    // Always return success for security reasons (don't reveal if email exists)
    // Generate reset token and send email only if user exists
    if (user) {
      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // In a real application, you would:
      // 1. Store the reset token in the database with expiry
      // 2. Send an email with the reset link


      // TODO: In production, implement:
      // - Store reset token in database with expiry
      // - Send email with reset link using a service like SendGrid, AWS SES, etc.
      // - Include proper email template with branding
    }

    // Always return success response for security
    return NextResponse.json(
      {
        message: 'If an account with that email exists, we have sent you a password reset link.',
        success: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
