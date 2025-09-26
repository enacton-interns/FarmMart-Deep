import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import stripe from '@/lib/stripe';
import { log } from 'console';

export async function POST(request: NextRequest) {
  try {
    console.log('Payment Intent API: Request received');

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log('Payment Intent API: No token provided');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('Payment Intent API: Invalid token');
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    console.log('Payment Intent API: Token verified for user:', decoded.id);

    // Get payment data from request body
    const { amount, items } = await request.json();
    console.log('Payment Intent API: Received amount:', amount, 'items count:', items?.length);

    if (!amount || amount <= 0) {
      console.log('Payment Intent API: Invalid amount');
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    console.log('Payment Intent API: Creating payment intent...');

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

    console.log('Payment Intent API: Payment intent created successfully:', paymentIntent.id);

    return NextResponse.json(
      {
        clientSecret: paymentIntent.client_secret,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment Intent API: Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
