import { NextResponse } from 'next/server'

/**
 * Health check endpoint
 * GET /api/health
 * 
 * Returns the health status of the application
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  })
}

