import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    if (await rateLimit.check(clientIP, 3, 60 * 1000)) { // 3 newsletter subscriptions per minute
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Get newsletter data from request body
    let newsletterData;
    try {
      const body = await request.text();
      if (!body || body.trim().length === 0) {
        return NextResponse.json(
          { error: 'Request body is required' },
          { status: 400 }
        );
      }
      newsletterData = JSON.parse(body);
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { email } = newsletterData;

    // Basic validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Email validation (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // In a real application, you would:
    // 1. Store email in newsletter database
    // 2. Send confirmation email
    // 3. Handle unsubscriptions
    // 4. Integrate with email marketing service

    // For now, just log and return success
    return NextResponse.json(
      {
        message: 'Successfully subscribed to newsletter!',
        success: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
