import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { UserModel } from '@/lib/models';
import { FarmerModel } from '@/lib/models';

import { validateRegister } from '@/lib/validation';
import { signToken } from '@/lib/jwt';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { name, email, password, role, address, phone } = body;

    // Validate input
    const validation = validateRegister({
      name,
      email,
      password,
      role,
      address,
      phone,
    });
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedName = typeof name === 'string' ? name.trim() : '';
    const sanitizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const sanitizedAddress = address ? address.trim() : '';
    const sanitizedPhone = phone ? phone.trim() : '';

    // Initialize models
    const userModel = new UserModel(pool);
    const farmerModel = new FarmerModel(pool);

    // Check if user already exists
    const existingUser = await userModel.findByEmail(sanitizedEmail);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = await userModel.create({
      name: sanitizedName,
      email: sanitizedEmail,
      password, // The password will be hashed in the model's create method
      role,
      address: sanitizedAddress,
      phone: sanitizedPhone,
    });

    // Generate JWT token
    const token = signToken(newUser);

    // If user is a farmer, create a farmer profile
    if (role === 'farmer') {
      // Ensure address doesn't exceed VARCHAR(255) limit
      const truncatedAddress = (sanitizedAddress || 'Address to be updated').substring(0, 255);

      const farmerData = {
        userId: newUser.id,
        farmName: `${sanitizedName}'s Farm`.substring(0, 255), // Ensure farm name doesn't exceed limit
        farmDescription: 'Farm description will be updated by the farmer.',
        farmLocation: {
          address: truncatedAddress,
          city: 'City TBD',
          state: 'State TBD',
          zipCode: '00000',
        },
        verified: false,
      };

      try {
        await farmerModel.create(farmerData);
      } catch (farmerError) {
        logger.error('Error creating farmer profile:', {farmerError});
        // Don't fail the entire signup if farmer creation fails
        // The farmer can try to add products later which will create the profile
      }
    }

    const response = NextResponse.json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    logger.error('Signup error:', {error});
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
