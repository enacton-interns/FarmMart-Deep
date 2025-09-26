import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { ProductModel, OrderModel, FarmerModel } from '@/lib/models';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { rateLimit } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    if (await rateLimit.check(clientIP, 30, 60 * 1000)) { // 30 requests per minute
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
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

    // Initialize models
    const productModel = new ProductModel(pool);
    const orderModel = new OrderModel(pool);
    const farmerModel = new FarmerModel(pool);

    // Get dashboard statistics based on user role
    let stats: any = {};
    let recentOrders: any[] = [];
    let lowStockProducts: any[] = [];

    if (decoded.role === 'farmer') {
      // First, find the farmer profile using the user ID
      const farmer = await farmerModel.findByUserId(decoded.id);
      if (!farmer) {
        return NextResponse.json(
          { error: 'Farmer profile not found' },
          { status: 404 }
        );
      }

      // Farmer statistics - use farmer.id for orders and products
      const farmerOrders = await orderModel.findByFarmerId(farmer.id);
      const totalOrdersReceived = farmerOrders.length;
      const totalEarnings = farmerOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);

      const userPurchases = await orderModel.findByUserId(decoded.id);
      const totalPurchasesMade = userPurchases.length;
      const totalMoneySpent = userPurchases.reduce((sum: number, order: any) => sum + order.totalAmount, 0);

      // Get recent orders received (last 5)
      recentOrders = farmerOrders
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      // Get low stock products
      const farmerProducts = await productModel.findByFarmerId(farmer.id);
      lowStockProducts = farmerProducts
        .filter((product: any) => product.quantity < 10 && product.available)
        .slice(0, 5);

      stats = {
        totalOrdersReceived,
        totalEarnings,
        totalPurchasesMade,
        totalMoneySpent,
        lowStockProducts: lowStockProducts.length
      };
    } else {
      // Customer statistics
      const userPurchases = await orderModel.findByUserId(decoded.id);
      const totalPurchasesMade = userPurchases.length;
      const totalMoneySpent = userPurchases.reduce((sum: number, order: any) => sum + order.totalAmount, 0);

      // Get recent purchases (last 5)
      recentOrders = userPurchases
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      stats = {
        totalPurchasesMade,
        totalMoneySpent
      };
    }

    return NextResponse.json({
      role: decoded.role,
      stats,
      recentOrders: recentOrders.map((order: any) => ({
        id: order.id,
        status: order.status,
        total: order.totalAmount,
        createdAt: order.createdAt
      })),
      ...(decoded.role === 'farmer' && {
        lowStockProducts: lowStockProducts.map((product: any) => ({
          id: product.id,
          name: product.name,
          quantity: product.quantity
        }))
      })
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
