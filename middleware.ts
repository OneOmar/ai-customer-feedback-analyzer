import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

/**
 * Middleware for handling authentication and route protection with Clerk v6
 * Runs before every request
 * 
 * Protected routes: /dashboard/*
 * Public routes: Everything else
 */

// Define which routes require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  // Add more protected routes here as needed
])

export default clerkMiddleware(async (auth, req) => {
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

/**
 * Configure which routes should trigger middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

