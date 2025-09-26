import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { OrderModel } from '@/lib/models';
import { UserModel } from '@/lib/models';
import { FarmerModel } from '@/lib/models';
import { ProductModel } from '@/lib/models';
import { NotificationModel } from '@/lib/models';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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
    const orderModel = new OrderModel(pool);
    const userModel = new UserModel(pool);
    const farmerModel = new FarmerModel(pool);
    const productModel = new ProductModel(pool);

    // Find order by ID
    const order = await orderModel.findById(id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Allow everyone to view order details (no authorization restrictions)

    // Get customer information
    const customer = await userModel.findById(order.userId);
    
    // Get farmer information
    const farmer = await farmerModel.findById(order.farmerId);
    
    // Get product information for each order item
    const enrichedItems = await Promise.all(
      order.items.map(async (item: any) => {
        const product = await productModel.findById(item.productId);
        return {
          ...item,
          product: product ? {
            id: product.id,
            name: product.name,
            images: product.images,
            price: product.price,
            unit: product.unit,
            category: product.category,
          } : null,
        };
      })
    );

    // Enrich order with customer, farmer, and product information
    const enrichedOrder = {
      ...order,
      customer: customer ? {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        address: customer.address,
        phone: customer.phone,
      } : null,
      farmer: farmer ? {
        id: farmer.id,
        farmName: farmer.farmName,
        farmLocation: farmer.farmLocation,
      } : null,
      items: enrichedItems,
    };

    return NextResponse.json(
      {
        order: enrichedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { status, paymentStatus } = await request.json();

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
    const orderModel = new OrderModel(pool);
    const userModel = new UserModel(pool);
    const farmerModel = new FarmerModel(pool);
    const productModel = new ProductModel(pool);

    // Find order by ID
    const order = await orderModel.findById(id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to update this order
    if (decoded.role !== 'admin') {
      // For farmers, check if they own the products in this order
      if (decoded.role === 'farmer') {
        const farmer = await farmerModel.findByUserId(decoded.id);
        if (!farmer || order.farmerId !== farmer.id) {
          return NextResponse.json(
            { error: 'Not authorized to update this order' },
            { status: 403 }
          );
        }
      } else {
        // Customers cannot update orders
        return NextResponse.json(
          { error: 'Not authorized to update this order' },
          { status: 403 }
        );
      }
    }

    // Business rule: Once an order is delivered, it cannot be changed
    if (order.status === 'delivered') {
      return NextResponse.json(
        { error: 'Cannot update a delivered order' },
        { status: 400 }
      );
    }

    // Update order
    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const updatedOrder = await orderModel.update(id, updateData);

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    // Create notifications for status updates
    try {
      const notificationModel = new NotificationModel(pool);

      // Get customer information
      const customer = await userModel.findById(updatedOrder.userId);

      if (status && status !== order.status) {
        // Status changed - notify customer
        const statusMessages = {
          confirmed: 'Your order has been confirmed and is being prepared.',
          preparing: 'Your order is now being prepared.',
          ready: 'Your order is ready for pickup/delivery.',
          delivered: 'Your order has been delivered successfully.',
          cancelled: 'Your order has been cancelled.',
        };

        const statusMessage = statusMessages[status as keyof typeof statusMessages] || `Your order status has been updated to ${status}.`;

        await notificationModel.create({
          userId: updatedOrder.userId,
          type: 'order_update',
          title: 'Order Status Updated',
          message: `Order #${updatedOrder.id.toString().slice(-8)}: ${statusMessage}`,
          read: false,
        });
      }
    } catch (notificationError) {
      // Don't fail the order update if notification creation fails
      console.error('Error creating status update notification:', notificationError);
    }

    // Get customer information
    const customer = await userModel.findById(updatedOrder.userId);
    
    // Get farmer information
    const farmer = await farmerModel.findById(updatedOrder.farmerId);
    
    // Get product information for each order item
    const enrichedItems = await Promise.all(
      updatedOrder.items.map(async (item: any) => {
        const product = await productModel.findById(item.productId);
        return {
          ...item,
          product: product ? {
            id: product.id,
            name: product.name,
            images: product.images,
            price: product.price,
            unit: product.unit,
          } : null,
        };
      })
    );

    // Enrich order with customer, farmer, and product information
    const enrichedOrder = {
      ...updatedOrder,
      customer: customer ? {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      } : null,
      farmer: farmer ? {
        id: farmer.id,
        farmName: farmer.farmName,
      } : null,
      items: enrichedItems,
    };

    return NextResponse.json(
      {
        order: enrichedOrder,
        message: 'Order updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
