import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'unknown'
    };

    // Test database connection
    try {
      // Simple database test
      const testQuery = 'SELECT 1';
      await pool.query(testQuery);
      healthStatus.database = 'connected';
    } catch (dbError) {
      healthStatus.database = 'disconnected';
      healthStatus.status = 'unhealthy';
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 503 }
    );
  }
}
