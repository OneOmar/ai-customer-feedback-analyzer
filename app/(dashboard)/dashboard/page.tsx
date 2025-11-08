import { getCurrentUser, requireAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Protected Dashboard Page
 * 
 * This page is protected by:
 * 1. Middleware (middleware.ts) - redirects to /sign-in if not authenticated
 * 2. requireAuth() - server-side authentication check
 * 
 * Shows current user information from Clerk
 */
export default async function DashboardPage() {
  // Require authentication - will redirect to /sign-in if not authenticated
  const userId = await requireAuth()
  
  // Get full user profile
  const user = await getCurrentUser()

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-8">
          Welcome to your AI Customer Feedback Analyzer dashboard
        </p>

        {/* User Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Account</CardTitle>
            <CardDescription>Current user information from Clerk</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-medium">User ID:</span>
                <span className="font-mono text-sm text-muted-foreground">{userId}</span>
              </div>
              
              {user?.firstName && (
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-medium">First Name:</span>
                  <span>{user.firstName}</span>
                </div>
              )}
              
              {user?.lastName && (
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-medium">Last Name:</span>
                  <span>{user.lastName}</span>
                </div>
              )}
              
              {user?.emailAddresses && user.emailAddresses.length > 0 && (
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-medium">Email:</span>
                  <span>{user.emailAddresses[0].emailAddress}</span>
                </div>
              )}
              
              {user?.createdAt && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Member Since:</span>
                  <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No feedback uploaded yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Analyzed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Ready for analysis</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Sentiment Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Upload feedback to see score</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with analyzing customer feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a 
              href="/dashboard/upload"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div>
                <p className="font-medium">Upload Feedback</p>
                <p className="text-sm text-muted-foreground">Import CSV file with customer feedback</p>
              </div>
              <span className="text-2xl">→</span>
            </a>

            <a 
              href="/dashboard/analytics"
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div>
                <p className="font-medium">View Analytics</p>
                <p className="text-sm text-muted-foreground">See sentiment trends and insights</p>
              </div>
              <span className="text-2xl">→</span>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

