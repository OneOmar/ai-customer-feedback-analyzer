import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

/**
 * Clerk Authentication Middleware (v6)
 * 
 * Protected Routes:
 * - /dashboard/* - User dashboard and all sub-routes
 * - /api/protected/* - Protected API endpoints
 * 
 * Public Routes:
 * - / - Home page
 * - /sign-in - Clerk sign-in page
 * - /sign-up - Clerk sign-up page
 * - /api/health - Public health check
 * 
 * Unauthenticated users accessing protected routes will be redirected to /sign-in
 * 
 * Required Environment Variables:
 * - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
 * - CLERK_SECRET_KEY
 * - NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
 * - NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
 * - NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
 * - NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
 */

// Define which routes require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',      // All dashboard routes
  '/api/protected(.*)',  // Protected API endpoints
])

export default clerkMiddleware(async (auth, req) => {
  // Protect routes that require authentication
  // Users will be redirected to sign-in page if not authenticated
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

/**
 * Configure which routes should trigger middleware
 * Matches all routes except static assets
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

