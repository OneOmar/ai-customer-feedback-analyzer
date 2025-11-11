import { requireAuth } from '@/lib/auth'
import { DashboardContent } from '@/components/dashboard-content'
import { QuotaDisplay } from '@/components/quota-display'

/**
 * Protected Dashboard Page
 * 
 * This page is protected by:
 * 1. Middleware (middleware.ts) - redirects to /sign-in if not authenticated
 * 2. requireAuth() - server-side authentication check
 * 
 * Displays dashboard with upload, charts, and feedback list
 */
export default async function DashboardPage() {
  // Require authentication - will redirect to /sign-in if not authenticated
  await requireAuth()

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Analyze customer feedback with AI-powered insights
          </p>
        </div>

        {/* Quota Display */}
        <div className="mb-6">
          <QuotaDisplay />
        </div>

        <DashboardContent />
      </div>
    </div>
  )
}

