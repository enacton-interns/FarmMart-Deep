import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { ProductModel } from '@/lib/models';
import { FarmerModel } from '@/lib/models';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Initialize models
    const productModel = new ProductModel(pool);
    const farmerModel = new FarmerModel(pool);

    // Find product by ID
    const product = await productModel.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get farmer information
    let farmerName = 'Unknown Farmer';
    let farmerDescription = '';
    let farmerLocation = null;

    if (product.farmerId) {
      const farmer = await farmerModel.findById(String(product.farmerId));
      if (farmer) {
        farmerName = farmer.farmName;
        farmerDescription = farmer.farmDescription || '';
        farmerLocation = farmer.farmLocation;
      }
    }

    // Check if current user is the farmer who owns this product
    const token = getTokenFromRequest(request);
    let isOwnProduct = false;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.role === 'farmer') {
        const farmer = await farmerModel.findByUserId(decoded.id);
        if (farmer && Number(farmer.id) === product.farmerId) {
          isOwnProduct = true;
        }
      }
    }

    return NextResponse.json(
      {
        product: {
          id: product.id,
          farmerId: product.farmerId,
          farmerName,
          farmerDescription,
          farmerLocation,
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
          isOwnProduct, // Add this flag
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



export async function PUT(
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

    // Check if user is a farmer
    if (decoded.role !== 'farmer') {
      return NextResponse.json(
        { error: 'Only farmers can update products' },
        { status: 403 }
      );
    }

    const productId = params.id;
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get update data from request body
    const updateData = await request.json();
    const { name, description, price, quantity, unit, category, images, organic, harvestDate } = updateData;

    // Validate required fields
    if (!name || !description || !price || !quantity || !unit || !category) {
      return NextResponse.json(
        { error: 'Name, description, price, quantity, unit, and category are required' },
        { status: 400 }
      );
    }

    // Validate price and quantity
    if (price <= 0 || quantity <= 0) {
      return NextResponse.json(
        { error: 'Price and quantity must be positive numbers' },
        { status: 400 }
      );
    }

    // Initialize models
    const productModel = new ProductModel(pool);
    const farmerModel = new FarmerModel(pool);

    // Get farmer profile
    const farmer = await farmerModel.findByUserId(decoded.id);
    if (!farmer) {
      return NextResponse.json(
        { error: 'Farmer profile not found' },
        { status: 404 }
      );
    }

    // Check if product exists and belongs to this farmer
    const existingProduct = await productModel.findById(productId);
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (existingProduct.farmerId !== Number(farmer.id)) {
      return NextResponse.json(
        { error: 'You can only update your own products' },
        { status: 403 }
      );
    }

    // Update product data
    const updatedProductData = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      quantity: parseInt(quantity),
      unit,
      category,
      images: images || [],
      organic: organic || false,
      harvestDate: harvestDate ? new Date(harvestDate) : undefined,
    };

    // Update the product
    const updatedProduct = await productModel.update(productId, updatedProductData);

    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Product updated successfully',
        product: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: updatedProduct.price,
          quantity: updatedProduct.quantity,
          unit: updatedProduct.unit,
          category: updatedProduct.category,
          available: updatedProduct.available,
          organic: updatedProduct.organic,
          createdAt: updatedProduct.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update product error:', error);
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
    // Get token from Authorization header.
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
        { error: 'Only farmers can delete products' },
        { status: 403 }
      );
    }

    const productId = params.id;
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Initialize models
    const productModel = new ProductModel(pool);
    const farmerModel = new FarmerModel(pool);

    // Get farmer profile
    const farmer = await farmerModel.findByUserId(decoded.id);
    if (!farmer) {
      return NextResponse.json(
        { error: 'Farmer profile not found' },
        { status: 404 }
      );
    }

    // Check if product exists and belongs to this farmer
    const existingProduct = await productModel.findById(productId);
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (existingProduct.farmerId !== Number(farmer.id)) {
      return NextResponse.json(
        { error: 'You can only delete your own products' },
        { status: 403 }
      );
    }

    // Delete the product
    const deleted = await productModel.delete(productId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Product deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
