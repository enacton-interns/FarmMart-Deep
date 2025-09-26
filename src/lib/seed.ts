import pool from './mongodb';
import { UserModel, FarmerModel, ProductModel } from './models';
import bcrypt from 'bcryptjs';

const seedData = async () => {
  try {
    // Database connection is already established via pool
    console.log('Connected to database');

    // Initialize models
    const userModel = new UserModel(pool);
    const farmerModel = new FarmerModel(pool);
    const productModel = new ProductModel(pool);

    console.log('Database seeding is not implemented for SQL-based models.');
    console.log('Please use the application UI or API to create initial data.');
    console.log('Seed script completed (no-op for SQL models).');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
