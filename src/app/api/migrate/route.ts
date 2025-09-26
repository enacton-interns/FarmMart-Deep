import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';
import { getOptionalEnvVar } from '../../../lib/env';

export async function POST(request: NextRequest) {
  const internalSecret = getOptionalEnvVar('INTERNAL_API_SECRET');

    if (!internalSecret) {
      return NextResponse.json(
        { error: 'Migration endpoint is disabled' },
        { status: 503 }
      );
    }

    const requestSecret = request.headers.get('x-internal-secret');

    if (requestSecret !== internalSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  try {
    console.log('Running database migration...');

    // Update notifications table constraint
    try {
      console.log('Updating notifications table constraint...');

      // Drop the old constraint if it exists
      await pool.query(`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check`);

      // Add the new constraint
      await pool.query(`ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('order_update', 'product_available', 'promotion', 'system'))`);

      console.log('Notifications table constraint updated successfully');
    } catch (constraintError) {
      console.log('Constraint update result:', constraintError instanceof Error ? constraintError.message : String(constraintError));
    }

    // Add updated_at column if it doesn't exist
    try {
      const columnCheck = await pool.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'updated_at'
      `);

      if (columnCheck.rows.length === 0) {
        await pool.query(`ALTER TABLE notifications ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        console.log('Added updated_at column to notifications table');
      } else {
        console.log('updated_at column already exists');
      }
    } catch (columnError) {
      console.log('Column check result:', columnError instanceof Error ? columnError.message : String(columnError));
    }

    console.log('Database migration completed successfully');
    return NextResponse.json({ message: 'Migration completed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
