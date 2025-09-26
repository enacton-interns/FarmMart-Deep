import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { OrderModel } from '@/lib/models';
import { UserModel } from '@/lib/models';
import { FarmerModel } from '@/lib/models';
import { ProductModel } from '@/lib/models';
import { NotificationModel } from '@/lib/models';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { rateLimit, securityHeaders, validators } from '@/lib/security';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const role = searchParams.get('role');

    // Initialize models
    const orderModel = new OrderModel(pool);
    const userModel = new UserModel(pool);
    const farmerModel = new FarmerModel(pool);
    const productModel = new ProductModel(pool);

    // Get orders based on user role
    let orders: any[] = [];

    if (role === 'customer') {
      orders = await orderModel.findByUserId(decoded.id);
    } else if (role === 'farmer') {
      // For farmers, find orders that contain their products
      const farmer = await farmerModel.findByUserId(decoded.id);
      if (farmer) {
        // Use the OrderModel's findByFarmerId method
        orders = await orderModel.findByFarmerId(farmer.id);
      } else {
        orders = [];
      }
    } else {
      // Admin can see all orders
      orders = await orderModel.findAll();
    }

    // Filter by status if provided
    if (status) {
      orders = orders.filter(order => order.status === status);
    }

    // Sort orders by creation date (newest first)
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = orders.slice(startIndex, endIndex);

    // Enrich orders with customer, farmer, and product information
    const enrichedOrders = await Promise.all(
      paginatedOrders.map(async (order) => {
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
              } : null,
            };
          })
        );

        return {
          ...order,
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
      })
    );

    // Calculate pagination information
    const total = orders.length;
    const pages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        orders: enrichedOrders,
        pagination: {
          total,
          page,
          limit,
          pages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Get orders error:', {error});
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    if (await rateLimit.check(clientIP, 5, 60 * 1000)) { // 5 orders per minute
      return NextResponse.json(
        { error: 'Too many order attempts. Please try again later.' },
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

    // Get order data from request body with JSON validation
    let orderData;
    try {
      const body = await request.text();
      if (!body || body.trim().length === 0) {
        return NextResponse.json(
          { error: 'Request body is required' },
          { status: 400 }
        );
      }
      orderData = JSON.parse(body);
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate request size (max 200KB for orders)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 200 * 1024) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      );
    }

    const { items, totalAmount, deliveryAddress, deliveryDate, deliveryInstructions, paymentMethod, paymentStatus } = orderData;

    // Comprehensive input validation
    if (!items || !Array.isArray(items) || items.length === 0 || items.length > 100) {
      return NextResponse.json(
        { error: 'Order must contain 1-100 items' },
        { status: 400 }
      );
    }

    if (!validators.positiveNumber(totalAmount) || totalAmount > 999999.99) {
      return NextResponse.json(
        { error: 'Invalid total amount' },
        { status: 400 }
      );
    }

    // Validate delivery address
    if (!deliveryAddress || typeof deliveryAddress !== 'object') {
      return NextResponse.json(
        { error: 'Delivery address is required' },
        { status: 400 }
      );
    }

    const { address, city, state, zipCode } = deliveryAddress;
    if (!validators.nonEmptyString(address) || address.length > 255) {
      return NextResponse.json(
        { error: 'Address must be 1-255 characters' },
        { status: 400 }
      );
    }

    if (!validators.nonEmptyString(city) || city.length > 100) {
      return NextResponse.json(
        { error: 'City must be 1-100 characters' },
        { status: 400 }
      );
    }

    if (!validators.nonEmptyString(state) || state.length > 100) {
      return NextResponse.json(
        { error: 'State must be 1-100 characters' },
        { status: 400 }
      );
    }

    if (!validators.nonEmptyString(zipCode) || zipCode.length > 20) {
      return NextResponse.json(
        { error: 'Zip code must be 1-20 characters' },
        { status: 400 }
      );
    }

    // Validate delivery date if provided
    if (deliveryDate) {
      const deliveryDateObj = new Date(deliveryDate);
      if (isNaN(deliveryDateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid delivery date' },
          { status: 400 }
        );
      }
      // Delivery date should be in the future but not too far
      const now = new Date();
      const maxDeliveryDate = new Date();
      maxDeliveryDate.setDate(now.getDate() + 90); // Max 90 days in future

      if (deliveryDateObj <= now || deliveryDateObj > maxDeliveryDate) {
        return NextResponse.json(
          { error: 'Delivery date must be within the next 90 days' },
          { status: 400 }
        );
      }
    }

    // Validate delivery instructions if provided
    if (deliveryInstructions && (typeof deliveryInstructions !== 'string' || deliveryInstructions.length > 500)) {
      return NextResponse.json(
        { error: 'Delivery instructions must be less than 500 characters' },
        { status: 400 }
      );
    }

    // Validate payment status
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: 'Invalid payment status' },
        { status: 400 }
      );
    }

    // Initialize models
    const orderModel = new OrderModel(pool);
    const userModel = new UserModel(pool);
    const farmerModelInstance = new FarmerModel(pool);
    const productModel = new ProductModel(pool);

    // Find user by ID
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate and fetch all products, check inventory, and group by farmer
    const validatedItems = [];
    const farmerGroups = new Map(); // farmerId -> items array
    let calculatedSubtotal = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Validate item structure
      if (!item.productId || !validators.isValidId(item.productId)) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Invalid product ID` },
          { status: 400 }
        );
      }

      if (!validators.positiveNumber(item.quantity) || item.quantity > 999) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Quantity must be 1-999` },
          { status: 400 }
        );
      }

      if (!validators.positiveNumber(item.price) || item.price > 999999.99) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Invalid price` },
          { status: 400 }
        );
      }

      // Fetch product
      const product = await productModel.findById(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Product not found` },
          { status: 404 }
        );
      }

      if (!product.available) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Product is not available` },
          { status: 400 }
        );
      }

      // Check inventory
      if (product.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Insufficient inventory. Available: ${product.quantity}` },
          { status: 400 }
        );
      }

      // Check if farmer is ordering their own product
      if (decoded.role === 'farmer') {
        const farmer = await farmerModelInstance.findByUserId(decoded.id);
        if (farmer && product.farmerId === Number(farmer.id)) {
          return NextResponse.json(
            { error: `Item ${i + 1}: Farmers cannot order their own products` },
            { status: 400 }
          );
        }
      }

      // Group items by farmer
      if (!farmerGroups.has(product.farmerId)) {
        farmerGroups.set(product.farmerId, []);
      }
      farmerGroups.get(product.farmerId).push({
        ...item,
        product,
        itemTotal: item.price * item.quantity
      });

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      });

      calculatedSubtotal += item.price * item.quantity;
    }

    // Calculate total the same way as frontend: subtotal + shipping + tax
    const calculatedShipping = calculatedSubtotal > 50 ? 0 : 5.99;
    const calculatedTax = calculatedSubtotal * 0.08;
    const calculatedTotal = calculatedSubtotal + calculatedShipping + calculatedTax;

    // Verify total amount matches (allow small floating point differences)
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      logger.warn('Order total mismatch detected', {
        calculatedTotal,
        providedTotal: totalAmount,
        userId: decoded.id,
      });
      return NextResponse.json(
        { error: 'Total amount mismatch' },
        { status: 400 }
      );
    }

    // Create separate orders for each farmer (multi-farmer support)
    const createdOrders = [];
    const notificationPromises = [];

    for (const [farmerId, farmerItems] of Array.from(farmerGroups.entries())) {
      const farmerOrderTotal: number = farmerItems.reduce((sum: number, item: any) => sum + item.itemTotal, 0);

      const orderCreateData = {
        userId: decoded.id,
        farmerId: farmerId,
        items: farmerItems.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: farmerOrderTotal,
        status: 'pending' as const,
        paymentStatus: (paymentStatus || 'pending') as 'pending' | 'paid' | 'failed' | 'refunded',
        deliveryAddress: deliveryAddress,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        deliveryInstructions: deliveryInstructions,
      };

      // Use database transaction for atomicity
      // Note: This is a simplified transaction - in production you'd use proper DB transactions
      try {
        // CRITICAL: Check inventory AND update atomically to prevent race conditions
        // This ensures that between checking inventory and updating it, no other transaction can interfere
        for (const item of farmerItems) {
          // The decreaseQuantity method uses atomic SQL with WHERE condition
          // This prevents race conditions even under high concurrency
          const success = await productModel.decreaseQuantity(item.productId, item.quantity);
          if (!success) {
            throw new Error(`Insufficient inventory for product ${item.productId} - item may have been purchased by another customer`);
          }
        }

        // Create the order only after successful inventory reduction
        const newOrder = await orderModel.create(orderCreateData);

        createdOrders.push(newOrder);

        // Prepare notifications
        notificationPromises.push(
          (async () => {
            try {
              const notificationModel = new NotificationModel(pool);
              const farmer = await farmerModelInstance.findById(farmerId);

              // Notification for customer
              await notificationModel.create({
                userId: decoded.id,
                type: 'order_update',
                title: 'Order Placed Successfully',
                message: `Your order #${newOrder.id.toString().slice(-8)} has been placed successfully. Total: $${newOrder.totalAmount.toFixed(2)}`,
                read: false,
              });

              // Notification for farmer
              if (farmer) {
                await notificationModel.create({
                  userId: farmer.userId,
                  type: 'order_update',
                  title: 'New Order Received',
                  message: `You have received a new order #${newOrder.id.toString().slice(-8)} from ${user.name}. Total: $${newOrder.totalAmount.toFixed(2)}`,
                  read: false,
                });
              }
            } catch (notificationError) {
              logger.error('Error creating notifications:', {notificationError});
            }
          })()
        );

      } catch (orderError) {
        // If order creation fails, we should ideally rollback inventory changes
        // For now, log the error - in production implement proper rollback
        logger.error('Order creation failed:', {orderError});
        return NextResponse.json(
          { error: 'Failed to create order. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Wait for all notifications to be sent
    await Promise.all(notificationPromises);

    return NextResponse.json(
      {
        message: `${createdOrders.length} order${createdOrders.length > 1 ? 's' : ''} created successfully`,
        orders: createdOrders.map(order => ({
          id: order.id,
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
        })),
        totalAmount: calculatedTotal,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Create order error:', {error});
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
