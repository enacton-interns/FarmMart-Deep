import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { ProductModel } from '@/lib/models';
import { FarmerModel } from '@/lib/models';
import { UserModel } from '@/lib/models';
import { NotificationModel } from '@/lib/models';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { rateLimit, securityHeaders, validators } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    if (await rateLimit.check(clientIP, 100, 15 * 60 * 1000)) { // 100 requests per 15 minutes
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Get token from Authorization header - optional for viewing products
    const token = getTokenFromRequest(request);

    const decoded = token ? verifyToken(token) : null;

    // Get query parameters with validation
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const location = searchParams.get('location');
    const organicOnly = searchParams.get('organicOnly') === 'true';
    const farmerOnly = searchParams.get('farmer') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10'))); // Max 50 items per page
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Validate sort parameters
    const allowedSortFields = ['createdAt', 'name', 'price', 'quantity'];
    const allowedSortOrders = ['asc', 'desc'];
    if (!allowedSortFields.includes(sortBy) || !allowedSortOrders.includes(sortOrder)) {
      return NextResponse.json(
        { error: 'Invalid sort parameters' },
        { status: 400 }
      );
    }

    // Initialize models
    const productModel = new ProductModel(pool);
    const farmerModel = new FarmerModel(pool);

    // Build filters
    const filters: any = { available: true };

    if (category) {
      filters.category = category;
    }

    if (organicOnly) {
      filters.organic = true;
    }

    if (minPrice) {
      filters.minPrice = parseFloat(minPrice);
    }

    if (maxPrice) {
      filters.maxPrice = parseFloat(maxPrice);
    }

    // If farmer=true, filter by farmer's products
    if (farmerOnly && decoded) {
      if (decoded && decoded.role === 'farmer') {
        const farmer = await farmerModel.findByUserId(decoded.id);
        if (farmer) {
          filters.farmerId = farmer.id;
        } else {
          // No farmer profile found, return empty array
          return NextResponse.json(
            {
              products: [],
              pagination: {
                total: 0,
                page: 1,
                limit,
                pages: 0,
              },
            },
            { status: 200 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // If user is a farmer browsing as customer, exclude their own products
    if (decoded && !farmerOnly) {
      if (decoded.role === 'farmer') {
        const farmer = await farmerModel.findByUserId(decoded.id);
        if (farmer) {
          filters.excludeFarmerId = farmer.id;
        }
      }
    }

    // Get products with filters
    let products = await productModel.findAll(filters);

    // If location is provided, we would need to join with Farmer collection
    // For now, we'll skip location filtering

    // Sort products
    products.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      
      return 0;
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = products.slice(startIndex, endIndex);

    // Transform products without exposing farmer personal information
    const transformedProducts = paginatedProducts.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      unit: product.unit,
      category: product.category,
      images: product.images,
      available: product.available,
      organic: product.organic,
      harvestDate: product.harvestDate,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    // Calculate pagination information
    const total = products.length;
    const pages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        products: transformedProducts,
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
    console.error('Get products error:', error);
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
    if (await rateLimit.check(clientIP, 20, 60 * 1000)) { // 20 requests per minute for POST
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

    // Check if user is a farmer
    if (decoded.role !== 'farmer') {
      return NextResponse.json(
        { error: 'Only farmers can create products' },
        { status: 403 }
      );
    }

    // Get product data from request body with JSON validation
    let productData;
    try {
      const body = await request.text();
      if (!body || body.trim().length === 0) {
        return NextResponse.json(
          { error: 'Request body is required' },
          { status: 400 }
        );
      }
      productData = JSON.parse(body);
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate request size (max 1MB)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024 * 1024) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      );
    }

    const { name, description, price, quantity, unit, category, images, organic, harvestDate } = productData;

    // Comprehensive input validation
    if (!validators.nonEmptyString(name) || name.length > 255) {
      return NextResponse.json(
        { error: 'Product name must be 1-255 characters' },
        { status: 400 }
      );
    }

    if (!validators.nonEmptyString(description) || description.length > 2000) {
      return NextResponse.json(
        { error: 'Product description must be 1-2000 characters' },
        { status: 400 }
      );
    }

    if (!validators.positiveNumber(price) || price > 999999.99) {
      return NextResponse.json(
        { error: 'Price must be a positive number less than 1,000,000' },
        { status: 400 }
      );
    }

    if (!validators.positiveNumber(quantity) || quantity > 999999) {
      return NextResponse.json(
        { error: 'Quantity must be a positive integer less than 1,000,000' },
        { status: 400 }
      );
    }

    if (!validators.nonEmptyString(unit) || unit.length > 50) {
      return NextResponse.json(
        { error: 'Unit must be 1-50 characters' },
        { status: 400 }
      );
    }

    const validCategories = ['fruits', 'vegetables', 'dairy', 'meat', 'bakery', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Validate images array
    if (images && (!Array.isArray(images) || images.length > 10)) {
      return NextResponse.json(
        { error: 'Images must be an array with maximum 10 items' },
        { status: 400 }
      );
    }

    if (images) {
      for (const image of images) {
        if (!validators.isValidUrl(image)) {
          return NextResponse.json(
            { error: 'All images must be valid URLs' },
            { status: 400 }
          );
        }
      }
    }

    // Validate organic flag
    if (organic !== undefined && typeof organic !== 'boolean') {
      return NextResponse.json(
        { error: 'Organic must be a boolean value' },
        { status: 400 }
      );
    }

    // Validate harvest date if provided
    if (harvestDate) {
      const harvestDateObj = new Date(harvestDate);
      if (isNaN(harvestDateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid harvest date' },
          { status: 400 }
        );
      }
      // Harvest date should not be in the future
      if (harvestDateObj > new Date()) {
        return NextResponse.json(
          { error: 'Harvest date cannot be in the future' },
          { status: 400 }
        );
      }
    }

    // Initialize models
    const productModel = new ProductModel(pool);
    const farmerModel = new FarmerModel(pool);

    // Get farmer profile
    let farmer = await farmerModel.findByUserId(decoded.id);
    if (!farmer) {

      // Try to create a basic farmer profile
      try {
        const userModel = new UserModel(pool);
        const user = await userModel.findById(decoded.id);

        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Create basic farmer profile
        const farmerData = {
          userId: decoded.id,
          farmName: `${user.name}'s Farm`.substring(0, 255), // Ensure farm name doesn't exceed VARCHAR(255)
          farmDescription: 'Farm description will be updated by the farmer.',
          farmLocation: {
            address: (user.address || 'Address to be updated').substring(0, 255), // Ensure address doesn't exceed VARCHAR(255)
            city: 'City TBD',
            state: 'State TBD',
            zipCode: '00000',
          },
          verified: false,
        };

        farmer = await farmerModel.create(farmerData);
      } catch (createError) {
        console.error('Error creating farmer profile:', createError);
        return NextResponse.json(
          { error: 'Failed to create farmer profile. Please contact support.' },
          { status: 500 }
        );
      }
    }

    // Create product data
    const newProductData = {
      farmerId: parseInt(farmer.id),
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      quantity: parseInt(quantity),
      unit,
      category,
      images: images || [],
      available: true,
      organic: organic || false,
      harvestDate: harvestDate ? new Date(harvestDate) : undefined,
    };

    const newProduct = await productModel.create(newProductData);

    try {
      const notificationModel = new NotificationModel(pool);

      await notificationModel.create({
        userId: decoded.id,
        type: 'system',
        title: 'Product Listed Successfully',
        message: `Your product "${newProduct.name}" has been successfully listed on FarmMarket!`,
        read: false,
      });
    } catch (notificationError) {
      // Don't fail the product creation if notification creation fails
      console.error('Error creating product creation notification:', notificationError);
    }

    return NextResponse.json(
      {
        message: 'Product created successfully',
        product: {
          id: newProduct.id,
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price,
          quantity: newProduct.quantity,
          unit: newProduct.unit,
          category: newProduct.category,
          available: newProduct.available,
          organic: newProduct.organic,
          createdAt: newProduct.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
