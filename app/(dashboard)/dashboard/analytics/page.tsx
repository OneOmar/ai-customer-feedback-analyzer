import { requireAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FeatureGate } from '@/components/feature-gate'
import { getSubscription } from '@/lib/billing'

/**
 * Protected Analytics Page
 * View sentiment analysis and insights
 */
export default async function AnalyticsPage() {
  const userId = await requireAuth()
  const subscription = await getSubscription(userId)
  const currentPlan = (subscription?.plan as "free" | "pro" | "business") || "free"

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics</h1>
        <p className="text-muted-foreground mb-8">
          AI-powered insights and sentiment analysis of customer feedback
        </p>

        {/* Basic Analytics - Available to all */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sentiment Overview</CardTitle>
            <CardDescription>
              Upload feedback to see sentiment trends and analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">No Data Available</p>
                <p className="text-sm">Upload customer feedback to view analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Analytics - Pro feature */}
        {currentPlan === "free" && (
          <FeatureGate
            feature="Advanced Analytics"
            currentPlan={currentPlan}
            requiredPlan="pro"
            description="Unlock advanced analytics including trend analysis, custom date ranges, export reports, and more with Pro."
            variant="card"
          />
        )}

        {/* Export Reports - Pro feature */}
        {currentPlan === "free" && (
          <div className="mt-6">
            <FeatureGate
              feature="Export Reports"
              currentPlan={currentPlan}
              requiredPlan="pro"
              description="Export your analytics as PDF or CSV reports with Pro plan."
              variant="alert"
            />
          </div>
        )}
      </div>
    </div>
  )
}

