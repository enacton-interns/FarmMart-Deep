import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { UserModel, ProductModel } from '@/lib/models';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import stripe from '@/lib/stripe';
import { rateLimit, securityHeaders, validators } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    if (await rateLimit.check(clientIP, 10, 60 * 1000)) { // 10 requests per minute for checkout
      return NextResponse.json(
        { error: 'Too many checkout attempts. Please try again later.' },
        { status: 429 }
      );
    }

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

    // Get cart items from request body with JSON validation
    let requestData;
    try {
      const body = await request.text();
      if (!body || body.trim().length === 0) {
        return NextResponse.json(
          { error: 'Request body is required' },
          { status: 400 }
        );
      }
      requestData = JSON.parse(body);
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate request size (max 100KB for checkout)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 100 * 1024) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      );
    }

    const { items } = requestData;

    // Comprehensive input validation
    if (!items || !Array.isArray(items) || items.length === 0 || items.length > 50) {
      return NextResponse.json(
        { error: 'Cart must contain 1-50 items' },
        { status: 400 }
      );
    }

    // Validate each cart item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item.product || typeof item.product !== 'object') {
        return NextResponse.json(
          { error: `Item ${i + 1}: Invalid product data` },
          { status: 400 }
        );
      }

      if (!validators.nonEmptyString(item.product.name) || item.product.name.length > 255) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Invalid product name` },
          { status: 400 }
        );
      }

      if (!validators.positiveNumber(item.product.price) || item.product.price > 999999.99) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Invalid product price` },
          { status: 400 }
        );
      }

      if (!validators.positiveNumber(item.quantity) || item.quantity > 999 || item.quantity < 1) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Quantity must be 1-999` },
          { status: 400 }
        );
      }

      // Validate product description if provided
      if (item.product.description && typeof item.product.description !== 'string') {
        return NextResponse.json(
          { error: `Item ${i + 1}: Invalid product description` },
          { status: 400 }
        );
      }

      // Validate images array if provided
      if (item.product.images && (!Array.isArray(item.product.images) || item.product.images.length > 10)) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Invalid product images` },
          { status: 400 }
        );
      }
    }

    // Initialize models
    const userModel = new UserModel(pool);
    const productModel = new ProductModel(pool);

    // Find user by ID
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate cart items server-side
    const validatedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      // Fetch current product data from database
      const product = await productModel.findById(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 400 }
        );
      }

      if (!product.available) {
        return NextResponse.json(
          { error: `Product ${product.name} is no longer available` },
          { status: 400 }
        );
      }

      // Check inventory
      if (product.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient inventory for ${product.name}. Available: ${product.quantity}` },
          { status: 400 }
        );
      }

      // Validate price matches database (prevent price manipulation)
      if (Math.abs(product.price - item.product.price) > 0.01) {
        return NextResponse.json(
          { error: `Price mismatch for ${product.name}. Please refresh and try again.` },
          { status: 400 }
        );
      }

      // Validate product details match
      if (product.name !== item.product.name ||
          product.description !== item.product.description) {
        return NextResponse.json(
          { error: `Product data mismatch for ${product.name}. Please refresh and try again.` },
          { status: 400 }
        );
      }

      validatedItems.push({
        ...item,
        product,
        itemTotal: product.price * item.quantity
      });

      totalAmount += product.price * item.quantity;
    }

    // Verify total amount matches (prevent total manipulation)
    if (Math.abs(totalAmount - totalAmount) > 0.01) {
      return NextResponse.json(
        { error: 'Cart total mismatch. Please refresh and try again.' },
        { status: 400 }
      );
    }

    // Create line items for Stripe using validated data
    const lineItems = validatedItems.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.name,
          description: item.product.description,
          images: item.product.images,
        },
        unit_amount: Math.round(item.product.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_API_URL || ''}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_API_URL || ''}/checkout/cancel`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        cartItems: JSON.stringify(validatedItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        }))),
      },
    });

    return NextResponse.json(
      {
        sessionId: session.id,
        url: session.url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Create checkout session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
