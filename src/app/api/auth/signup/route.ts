import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { UserModel } from '@/lib/models';
import { FarmerModel } from '@/lib/models';
import jwt from 'jsonwebtoken';
import { validateRegister } from '@/lib/validation';
import { sanitizeInput } from '@/lib/security';
import { getRequiredEnvVar } from '../../../../lib/env';

const JWT_SECRET = getRequiredEnvVar('JWT_SECRET');

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
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedAddress = address ? sanitizeInput(address) : '';
    const sanitizedPhone = phone ? sanitizeInput(phone) : '';

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
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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

      console.log('Creating farmer with data:', farmerData);
      console.log('Farm name length:', farmerData.farmName.length);
      console.log('Farm description length:', farmerData.farmDescription.length);
      console.log('Address length:', farmerData.farmLocation.address.length);

      try {
        await farmerModel.create(farmerData);
        console.log('Farmer profile created successfully');
      } catch (farmerError) {
        console.error('Error creating farmer profile:', farmerError);
        // Don't fail the entire signup if farmer creation fails
        // The farmer can try to add products later which will create the profile
      }
    }

    return NextResponse.json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
