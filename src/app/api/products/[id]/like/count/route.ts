import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Get like count for this product
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM likes WHERE product_id = $1',
      [productId]
    );

    return NextResponse.json(
      {
        count: parseInt(countResult.rows[0].count),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get like count error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
