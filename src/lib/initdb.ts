import { Pool } from 'pg';
import pool from './mongodb';

const initDB = async () => {
  try {
    console.log('Initializing database...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'farmer', 'admin')),
        address TEXT,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table created or already exists');

    // Create farmers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS farmers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        farm_name VARCHAR(255) NOT NULL,
        farm_description TEXT,
        farm_address VARCHAR(255),
        farm_city VARCHAR(255),
        farm_state VARCHAR(255),
        farm_zip_code VARCHAR(10),
        farm_coordinates_lat DECIMAL(10, 8),
        farm_coordinates_lng DECIMAL(11, 8),
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Farmers table created or already exists');

    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        quantity INTEGER NOT NULL,
        unit VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        images TEXT[] DEFAULT '{}',
        organic BOOLEAN DEFAULT FALSE,
        available BOOLEAN DEFAULT TRUE,
        farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Products table created or already exists');

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        farmer_id INTEGER REFERENCES farmers(id) ON DELETE SET NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
        total_amount DECIMAL(10, 2) NOT NULL,
        delivery_address JSONB,
        delivery_city VARCHAR(255),
        delivery_state VARCHAR(255),
        delivery_zip_code VARCHAR(10),
        delivery_date DATE,
        delivery_instructions TEXT,
        payment_method VARCHAR(50) DEFAULT 'cash_on_delivery',
        payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Orders table created or already exists');

    // Create order_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Order items table created or already exists');

    // Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('order_update', 'product_available', 'promotion', 'system')),
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Notifications table created or already exists');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rate_limit_counters (
        identifier TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        reset_time TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Rate limit counters table created or already exists');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS account_lockouts (
        identifier TEXT PRIMARY KEY,
        attempts INTEGER NOT NULL DEFAULT 0,
        lockout_until TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Account lockouts table created or already exists');

    // Update existing notifications table if needed
    try {
      // Check if the table has the old constraint
      const constraintCheck = await pool.query(`
        SELECT conname FROM pg_constraint
        WHERE conname LIKE '%notifications_type_check%'
      `);

      if (constraintCheck.rows.length > 0) {
        console.log('Updating notifications table constraint...');
        // Drop the old constraint and add the new one
        await pool.query(`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check`);
        await pool.query(`ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('order_update', 'product_available', 'promotion', 'system'))`);
        console.log('Notifications table constraint updated');
      }

      // Add updated_at column if it doesn't exist
      const columnCheck = await pool.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'updated_at'
      `);

      if (columnCheck.rows.length === 0) {
        await pool.query(`ALTER TABLE notifications ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        console.log('Added updated_at column to notifications table');
      }
    } catch (migrationError) {
      console.log('Migration check completed (table may already be up to date):', migrationError instanceof Error ? migrationError.message : String(migrationError));
    }

    // Create likes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      );
    `);
    console.log('Notifications table created or already exists');

    console.log('Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initDB();
