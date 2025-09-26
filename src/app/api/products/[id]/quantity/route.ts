import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { ProductModel } from '@/lib/models';
import {getTokenFromRequest, verifyToken } from '@/lib/jwt';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const productId = params.id;
    const { quantity } = await request.json();

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Valid quantity is required' },
        { status: 400 }
      );
    }

    // Initialize product model
    const productModel = new ProductModel(pool);

    // Decrease product quantity
    const success = await productModel.decreaseQuantity(productId, quantity);

    if (!success) {
      return NextResponse.json(
        { error: 'Insufficient stock or product not found' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Product quantity updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update product quantity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
