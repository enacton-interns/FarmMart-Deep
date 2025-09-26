import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { UserModel } from '@/lib/models';
import { FarmerModel } from '@/lib/models';
import { ProductModel } from '@/lib/models';
import { OrderModel } from '@/lib/models';
import bcrypt from 'bcryptjs';
import { getOptionalEnvVar } from '../../../lib/env';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const internalSecret = getOptionalEnvVar('INTERNAL_API_SECRET');

  if (!internalSecret) {
    return NextResponse.json(
      { error: 'Seed endpoint is disabled' },
      { status: 503 }
    );
  }

  const requestSecret = request.headers.get('x-internal-secret');

  if (requestSecret !== internalSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    logger.info('Seed operation started');

    // Clear existing data
    await pool.query('TRUNCATE TABLE products, farmers, users RESTART IDENTITY CASCADE;');
    logger.debug('Existing data truncated for reseed');

    // Hash passwords
    const customerPassword = await bcrypt.hash('password123', 10);
    const farmerPassword = await bcrypt.hash('farmer123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Initialize models
    const userModel = new UserModel(pool);
    const farmerModel = new FarmerModel(pool);
    const productModel = new ProductModel(pool);
    const orderModel = new OrderModel(pool);

    // Create users
    const customer1 = await userModel.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: customerPassword,
      role: 'customer',
      address: '123 Main St, Anytown, USA',
      phone: '(555) 123-4567',
    });

    const customer2 = await userModel.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: customerPassword,
      role: 'customer',
      address: '456 Oak Ave, Somewhere, USA',
      phone: '(555) 987-6543',
    });

    const farmer1 = await userModel.create({
      name: 'Bob Johnson',
      email: 'bob@example.com',
      password: farmerPassword,
      role: 'farmer',
      address: '789 Farm Rd, Countryside, USA',
      phone: '(555) 456-7890',
    });

    const farmer2 = await userModel.create({
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      password: farmerPassword,
      role: 'farmer',
      address: '321 Country Ln, Rural, USA',
      phone: '(555) 234-5678',
    });

    const admin = await userModel.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      address: '999 Admin St, Capital, USA',
      phone: '(555) 111-2222',
    });
    
    logger.info('Seed users created', { count: 5 });

    // Create farmer profiles
    const farmerProfile1 = await farmerModel.create({
      userId: farmer1.id,
      farmName: 'Green Acres Farm',
      farmDescription: 'A family-owned farm specializing in organic vegetables and free-range eggs.',
      farmLocation: {
        address: '789 Farm Rd',
        city: 'Countryside',
        state: 'USA',
        zipCode: '12345',
      },
      verified: false,
    });

    const farmerProfile2 = await farmerModel.create({
      userId: farmer2.id,
      farmName: 'Sunshine Orchard',
      farmDescription: 'Specializing in fresh fruits, berries, and homemade jams.',
      farmLocation: {
        address: '321 Country Ln',
        city: 'Rural',
        state: 'USA',
        zipCode: '67890',
      },
      verified: false,
    });

    logger.info('Farmer profiles created', { count: 2 });

    // Get farmer IDs (they might not be sequential)
    const farmerResult = await pool.query('SELECT id, user_id FROM farmers ORDER BY id');
    const farmerIds = farmerResult.rows.map(row => row.id);
    logger.debug('Retrieved farmer identifiers for product seeding', { count: farmerIds.length });

    // Create products
    const products = [
      {
        name: 'Organic Tomatoes',
        description: 'Fresh, juicy organic tomatoes grown without pesticides.',
        price: 3.99,
        quantity: 100,
        unit: 'lb' as const,
        category: 'vegetables' as const,
        images: ['/images/tomatoes.jpg'],
        organic: true,
        farmerId: farmerIds[0], // Use actual farmer ID
      },
      {
        name: 'Free-Range Eggs',
        description: 'Fresh eggs from free-range chickens fed organic feed.',
        price: 5.99,
        quantity: 50,
        unit: 'dozen' as const,
        category: 'dairy' as const,
        images: ['/images/eggs.jpg'],
        organic: true,
        farmerId: farmerIds[0],
      },
      {
        name: 'Fresh Strawberries',
        description: 'Sweet, juicy strawberries picked at peak ripeness.',
        price: 4.49,
        quantity: 75,
        unit: 'lb' as const,
        category: 'fruits' as const,
        images: ['/images/strawberries.jpg'],
        organic: true,
        farmerId: farmerIds[1],
      },
      {
        name: 'Whole Wheat Bread',
        description: 'Freshly baked whole wheat bread with no preservatives.',
        price: 3.49,
        quantity: 40,
        unit: 'piece' as const,
        category: 'bakery' as const,
        images: ['/images/bread.jpg'],
        organic: false,
        farmerId: farmerIds[1],
      },
      {
        name: 'Organic Lettuce',
        description: 'Crisp, fresh organic lettuce perfect for salads.',
        price: 2.99,
        quantity: 60,
        unit: 'piece' as const,
        category: 'vegetables' as const,
        images: ['/images/lettuce.jpg'],
        organic: true,
        farmerId: farmerIds[0],
      },
      {
        name: 'Grass-Fed Beef',
        description: 'High-quality grass-fed beef from humanely raised cattle.',
        price: 12.99,
        quantity: 30,
        unit: 'lb' as const,
        category: 'meat' as const,
        images: ['/images/beef.jpg'],
        organic: false,
        farmerId: farmerIds[0],
      },
      {
        name: 'Blueberries',
        description: 'Plump, sweet blueberries packed with antioxidants.',
        price: 5.99,
        quantity: 45,
        unit: 'lb' as const,
        category: 'fruits' as const,
        images: ['/images/blueberries.jpg'],
        organic: true,
        farmerId: farmerIds[1],
      },
      {
        name: 'Raw Honey',
        description: 'Pure, unfiltered raw honey from local bees.',
        price: 8.99,
        quantity: 25,
        unit: 'piece' as const,
        category: 'other' as const,
        images: ['/images/honey.jpg'],
        organic: true,
        farmerId: farmerIds[1],
      },
    ];

    // Save products
    const createdProducts = [];
    for (const product of products) {
      const createdProduct = await productModel.create({
        ...product,
        available: true,
      });
      createdProducts.push(createdProduct);
    }
    logger.info('Seed products created', { count: products.length });

    // Create some test orders
    const orders = [
      {
        userId: customer1.id,
        farmerId: farmerIds[0], // Bob Johnson's farm
        items: [
          { productId: createdProducts[0].id, quantity: 5, price: 3.99 }, // Organic Tomatoes
          { productId: createdProducts[1].id, quantity: 2, price: 5.99 }, // Free-Range Eggs
        ],
        totalAmount: (5 * 3.99) + (2 * 5.99), // 19.95 + 11.98 = 31.93
        status: 'pending' as const,
        paymentStatus: 'paid' as const,
        deliveryAddress: {
          address: '123 Main St',
          city: 'Anytown',
          state: 'USA',
          zipCode: '12345',
        },
        deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        deliveryInstructions: 'Leave at front door',
      },
      {
        userId: customer2.id,
        farmerId: farmerIds[1], // Sarah Williams' farm
        items: [
          { productId: createdProducts[2].id, quantity: 3, price: 4.49 }, // Fresh Strawberries
          { productId: createdProducts[6].id, quantity: 2, price: 5.99 }, // Blueberries
        ],
        totalAmount: (3 * 4.49) + (2 * 5.99), // 13.47 + 11.98 = 25.45
        status: 'pending' as const,
        paymentStatus: 'paid' as const,
        deliveryAddress: {
          address: '456 Oak Ave',
          city: 'Somewhere',
          state: 'USA',
          zipCode: '67890',
        },
        deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        deliveryInstructions: 'Ring doorbell twice',
      },
      {
        userId: customer1.id,
        farmerId: farmerIds[0], // Bob Johnson's farm again
        items: [
          { productId: createdProducts[4].id, quantity: 4, price: 2.99 }, // Organic Lettuce
          { productId: createdProducts[5].id, quantity: 1, price: 12.99 }, // Grass-Fed Beef
        ],
        totalAmount: (4 * 2.99) + (1 * 12.99), // 11.96 + 12.99 = 24.95
        status: 'preparing' as const,
        paymentStatus: 'paid' as const,
        deliveryAddress: {
          address: '123 Main St',
          city: 'Anytown',
          state: 'USA',
          zipCode: '12345',
        },
        deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        deliveryInstructions: 'Call upon arrival',
      },
    ];

    // Save orders
    for (const order of orders) {
      await orderModel.create(order);
    }
    logger.info('Seed orders created', { count: orders.length });

    return NextResponse.json({
      message: 'Database seeded successfully!',
      users: {
        customers: 2,
        farmers: 2,
        admin: 1,
      },
      products: products.length,
      orders: orders.length,
    });
  } catch (error) {
    logger.error('Error seeding database:', {error});
    return NextResponse.json(
      { error: 'An unexpected error occurred while seeding the database' },
      { status: 500 }
    );
  }
}
