import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from Authorization header
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Check if user liked this product
    const likeResult = await pool.query(
      'SELECT id FROM likes WHERE user_id = $1 AND product_id = $2',
      [decoded.id, productId]
    );

    return NextResponse.json(
      {
        liked: likeResult.rows.length > 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get like status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
