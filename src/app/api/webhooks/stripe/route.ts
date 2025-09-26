import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import crypto from 'crypto';
import pool from '@/lib/mongodb';
import { OrderModel, UserModel, FarmerModel, ProductModel, NotificationModel } from '@/lib/models';
import { logger } from '@/lib/logger';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Verify webhook signature
function verifyStripeSignature(body: string, signature: string, secret: string): boolean {
  try {
    const elements = signature.split(',');
    const sigElements: { [key: string]: string } = {};

    for (const element of elements) {
      const [key, value] = element.split('=');
      sigElements[key] = value;
    }

    const timestamp = sigElements['t'];
    const expectedSignature = sigElements['v1'];

    if (!timestamp || !expectedSignature) {
      return false;
    }

    const signedPayload = `${timestamp}.${body}`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.error('Stripe signature verification error', { error });
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!webhookSecret) {
      logger.error('Stripe webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      logger.warn('Missing Stripe signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    if (!verifyStripeSignature(body, signature, webhookSecret)) {
      logger.warn('Invalid Stripe webhook signature detected');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    let event;

    try {
      event = JSON.parse(body);
    } catch (err) {
      logger.warn('Invalid JSON in Stripe webhook body', { error: err });
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    // Validate event structure
    if (!event.type || !event.data || !event.data.object) {
      logger.warn('Invalid Stripe event structure received');
      return NextResponse.json(
        { error: 'Invalid event structure' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        logger.info('Stripe checkout session completed', { sessionId: session.id });

        // Validate session data
        if (!session.id || !session.metadata || !session.metadata.userId || !session.metadata.cartItems) {
          console.error('Invalid session data in webhook');
          return NextResponse.json(
            { error: 'Invalid session data' },
            { status: 400 }
          );
        }

        try {
          // Parse cart items from metadata
          const cartItems = JSON.parse(session.metadata.cartItems);
          const userId = session.metadata.userId;

          // Initialize models
          const orderModel = new OrderModel(pool);
          const userModel = new UserModel(pool);
          const farmerModel = new FarmerModel(pool);
          const productModel = new ProductModel(pool);
          const notificationModel = new NotificationModel(pool);

          // Get user
          const user = await userModel.findById(userId);
          if (!user) {
            logger.error('User not found for checkout session', { sessionId: session.id, userId });
            return NextResponse.json(
              { error: 'User not found' },
              { status: 400 }
            );
          }

          // Validate and fetch all products, check inventory, and group by farmer
          const validatedItems = [];
          const farmerGroups = new Map(); // farmerId -> items array

          for (const item of cartItems) {
            // Fetch product
            const product = await productModel.findById(item.productId);
            if (!product) {
              logger.error('Product missing during webhook processing', { productId: item.productId, sessionId: session.id });
              continue; // Skip invalid products
            }

            if (!product.available) {
              logger.warn('Product unavailable during webhook processing', { productId: product.id, sessionId: session.id });
              continue; // Skip unavailable products
            }

            // Check inventory
            if (product.quantity < item.quantity) {
              logger.warn('Insufficient inventory during webhook processing', {
                productId: product.id,
                available: product.quantity,
                requested: item.quantity,
                sessionId: session.id,
              });
              continue; // Skip items with insufficient inventory
            }

            // Group items by farmer
            if (!farmerGroups.has(product.farmerId)) {
              farmerGroups.set(product.farmerId, []);
            }
            farmerGroups.get(product.farmerId).push({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              product,
              itemTotal: item.price * item.quantity
            });

            validatedItems.push({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            });
          }

          // Create separate orders for each farmer
          const createdOrders = [];
          const notificationPromises = [];

          for (const [farmerId, farmerItems] of Array.from(farmerGroups.entries())) {
            const farmerOrderTotal: number = farmerItems.reduce((sum: number, item: any) => sum + item.itemTotal, 0);

            const orderCreateData = {
              userId: userId,
              farmerId: farmerId.toString(), // Ensure farmerId is a string
              items: farmerItems.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
              })),
              totalAmount: farmerOrderTotal,
              status: 'confirmed' as const, // Payment successful, so confirmed
              paymentStatus: 'paid' as const,
              deliveryAddress: {
                address: 'To be updated by customer', // TODO: Collect delivery address in checkout
                city: 'To be updated',
                state: 'To be updated',
                zipCode: '00000',
              },
              deliveryDate: undefined, // TODO: Collect delivery preferences
              deliveryInstructions: undefined,
            };

            try {
              // Decrease inventory atomically
              for (const item of farmerItems) {
                const success = await productModel.decreaseQuantity(item.productId, item.quantity);
                if (!success) {
                  throw new Error(`Insufficient inventory for product ${item.productId}`);
                }
              }

              // Create the order
              const newOrder = await orderModel.create(orderCreateData);
              createdOrders.push(newOrder);

              // Prepare notifications
              notificationPromises.push(
                (async () => {
                  try {
                    const farmer = await farmerModel.findById(farmerId);

                    // Notification for customer
                    await notificationModel.create({
                      userId: userId,
                      type: 'order_update',
                      title: 'Order Confirmed & Paid',
                      message: `Your order #${newOrder.id.toString().slice(-8)} has been confirmed and paid successfully. Total: $${newOrder.totalAmount.toFixed(2)}`,
                      read: false,
                    });

                    // Notification for farmer
                    if (farmer) {
                      await notificationModel.create({
                        userId: farmer.userId,
                        type: 'order_update',
                        title: 'New Paid Order Received',
                        message: `You have received a new paid order #${newOrder.id.toString().slice(-8)} from ${user.name}. Total: $${newOrder.totalAmount.toFixed(2)}`,
                        read: false,
                      });
                    }
                  } catch (notificationError) {
                    logger.error('Error creating notifications during webhook', { error: notificationError });
                  }
                })()
              );

            } catch (orderError) {
              logger.error('Order creation failed:', {error: orderError});
              // Continue with other orders - don't fail the whole webhook
            }
          }

          // Wait for all notifications to be sent
          await Promise.all(notificationPromises);

          logger.info(`Created ${createdOrders.length} orders from checkout session ${session.id}`);

        } catch (webhookProcessingError) {
          console.error('Error processing checkout session:', webhookProcessingError);
          return NextResponse.json(
            { error: 'Failed to process checkout session' },
            { status: 500 }
          );
        }
        break;

      case 'payment_intent.payment_failed':
        const paymentIntent = event.data.object;
        logger.info('Payment failed:', paymentIntent.id);
        // TODO: Handle failed payments
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json(
      { received: true, eventType: event.type },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Webhook error:', {error: error});
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
