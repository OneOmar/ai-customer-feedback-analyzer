import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'

/**
 * Protected API Route Example
 * GET /api/protected/user
 * 
 * Demonstrates how to protect API routes using withAuth helper
 * Returns current user information
 * 
 * Authentication:
 * - Required: Valid Clerk session
 * - Returns 401 if not authenticated
 */
export const GET = withAuth(async (req, { userId, user }) => {
  // userId and user are guaranteed to exist here
  // withAuth handles authentication and returns 401 if not authenticated
  
  return NextResponse.json({
    success: true,
    data: {
      userId,
      email: user?.emailAddresses?.[0]?.emailAddress,
      firstName: user?.firstName,
      lastName: user?.lastName,
      fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      createdAt: user?.createdAt,
    },
  })
})

/**
 * Example POST endpoint - also protected
 */
export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json()
  
  // Process the request with authenticated user context
  return NextResponse.json({
    success: true,
    message: 'Data received',
    userId,
    receivedData: body,
  })
})

