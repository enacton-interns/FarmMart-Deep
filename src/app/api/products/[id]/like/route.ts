import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { NotificationModel } from '@/lib/models';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';

export async function POST(
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

    // Check if product exists
    const productResult = await pool.query(
      'SELECT id FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if user already liked this product
    const existingLike = await pool.query(
      'SELECT id FROM likes WHERE user_id = $1 AND product_id = $2',
      [decoded.id, productId]
    );

    if (existingLike.rows.length > 0) {
      return NextResponse.json(
        { error: 'Product already liked' },
        { status: 400 }
      );
    }

    // Add like
    await pool.query(
      'INSERT INTO likes (user_id, product_id) VALUES ($1, $2)',
      [decoded.id, productId]
    );

    // Get updated like count
    const likeCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM likes WHERE product_id = $1',
      [productId]
    );

    // Create notification for farmer
    try {
      const notificationModel = new NotificationModel(pool);

      // Get product details to find farmer
      const productDetails = await pool.query(
        'SELECT p.name, f.user_id as farmer_user_id FROM products p JOIN farmers f ON p.farmer_id = f.id WHERE p.id = $1',
        [productId]
      );

      if (productDetails.rows.length > 0) {
        const product = productDetails.rows[0];

        // Don't notify if user is liking their own product
        if (product.farmer_user_id !== decoded.id) {
          await notificationModel.create({
            userId: product.farmer_user_id,
            type: 'product_available',
            title: 'Product Liked',
            message: `Someone liked your product "${product.name}". Keep up the great work!`,
            read: false,
          });
        }
      }
    } catch (notificationError) {
      // Don't fail the like if notification creation fails
      console.error('Error creating like notification:', notificationError);
    }

    return NextResponse.json(
      {
        message: 'Product liked successfully',
        liked: true,
        likeCount: parseInt(likeCountResult.rows[0].count),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Like product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Remove like
    const result = await pool.query(
      'DELETE FROM likes WHERE user_id = $1 AND product_id = $2',
      [decoded.id, productId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Like not found' },
        { status: 404 }
      );
    }

    // Get updated like count
    const likeCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM likes WHERE product_id = $1',
      [productId]
    );

    return NextResponse.json(
      {
        message: 'Product unliked successfully',
        liked: false,
        likeCount: parseInt(likeCountResult.rows[0].count),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unlike product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
