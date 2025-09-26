import { NextRequest, NextResponse } from 'next/server';

import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import stripe from '@/lib/stripe';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    logger.debug('Payment intent request received', {
      path: request.nextUrl?.pathname,
    });

    // Get token from Authorization header
    const token = getTokenFromRequest(request);

    if (!token) {
      logger.warn('Payment intent denied due to missing authentication');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      logger.warn('Payment intent denied due to missing authentication');
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    console.log('Payment Intent API: Token verified');

    // Get payment data from request body
    const { amount, items } = await request.json();
    logger.debug('Payment intent payload received', {
      amount,
      itemCount: Array.isArray(items) ? items.length : undefined,
    });

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }


    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure it's an integer
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: decoded.id,
        itemsCount: items?.length || 0,
      },
    });

    logger.info('Payment intent created', {
      paymentIntentId: paymentIntent.id,
      userId: decoded.id,
    });

    return NextResponse.json(
      {
        clientSecret: paymentIntent.client_secret,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Payment intent creation failed', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
