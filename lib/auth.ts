import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import type { User } from '@clerk/nextjs/server'

/**
 * Authentication utilities for server-side operations
 * Uses Clerk v6 API
 * 
 * Required Environment Variables:
 * - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
 * - CLERK_SECRET_KEY
 */

/**
 * Get the current authenticated user's ID and session info
 * Use this in Server Components and API Routes
 * 
 * @returns Object with userId and session info, or null if not authenticated
 * 
 * @example
 * ```typescript
 * import { getCurrentAuth } from '@/lib/auth'
 * 
 * export default async function Page() {
 *   const { userId } = await getCurrentAuth()
 *   if (!userId) redirect('/sign-in')
 *   // Use userId...
 * }
 * ```
 */
export async function getCurrentAuth() {
  return await auth()
}

/**
 * Get the current authenticated user's full profile
 * Use this when you need detailed user information
 * 
 * @returns User object or null if not authenticated
 * 
 * @example
 * ```typescript
 * import { getCurrentUser } from '@/lib/auth'
 * 
 * export default async function ProfilePage() {
 *   const user = await getCurrentUser()
 *   if (!user) redirect('/sign-in')
 *   return <div>Welcome {user.firstName}!</div>
 * }
 * ```
 */
export async function getCurrentUser(): Promise<User | null> {
  return await currentUser()
}

/**
 * Require authentication - redirect to sign-in if not authenticated
 * Use this at the top of protected pages
 * 
 * @returns User ID of authenticated user
 * @throws Redirects to /sign-in if not authenticated
 * 
 * @example
 * ```typescript
 * import { requireAuth } from '@/lib/auth'
 * 
 * export default async function ProtectedPage() {
 *   const userId = await requireAuth()
 *   // User is guaranteed to be authenticated here
 *   return <div>User ID: {userId}</div>
 * }
 * ```
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  return userId
}

/**
 * Higher-order function to protect API routes
 * Wraps API route handlers to require authentication
 * 
 * @param handler - The API route handler function
 * @returns Protected API route handler
 * 
 * @example
 * ```typescript
 * import { withAuth } from '@/lib/auth'
 * import { NextResponse } from 'next/server'
 * 
 * export const GET = withAuth(async (req, { userId }) => {
 *   // userId is guaranteed to exist here
 *   return NextResponse.json({ userId })
 * })
 * ```
 */
export function withAuth<T>(
  handler: (
    req: Request,
    context: { userId: string; user: User | null }
  ) => Promise<T>
) {
  return async (req: Request): Promise<T> => {
    const { userId } = await auth()
    
    if (!userId) {
      // Return 401 Unauthorized for API routes
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized - Authentication required' 
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      ) as T
    }
    
    const user = await currentUser()
    
    return handler(req, { userId, user })
  }
}

/**
 * Check if user has a specific role
 * Requires Clerk roles to be configured in Clerk Dashboard
 * 
 * @param role - Role name to check
 * @returns true if user has the role
 * 
 * @example
 * ```typescript
 * import { hasRole } from '@/lib/auth'
 * 
 * export default async function AdminPage() {
 *   const isAdmin = await hasRole('admin')
 *   if (!isAdmin) redirect('/dashboard')
 *   // Admin-only content
 * }
 * ```
 */
export async function hasRole(role: string): Promise<boolean> {
  const { sessionClaims } = await auth()
  
  if (!sessionClaims) return false
  
  // Clerk stores roles in metadata
  const roles = (sessionClaims.metadata as { roles?: string[] })?.roles || []
  return roles.includes(role)
}

/**
 * Type guard for checking if user is authenticated
 * Useful for conditional logic in Server Components
 * 
 * @returns true if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { userId } = await auth()
  return !!userId
}

