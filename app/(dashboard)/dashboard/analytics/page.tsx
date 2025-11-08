import { requireAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Protected Analytics Page
 * View sentiment analysis and insights
 */
export default async function AnalyticsPage() {
  await requireAuth()

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics</h1>
        <p className="text-muted-foreground mb-8">
          AI-powered insights and sentiment analysis of customer feedback
        </p>

        {/* Placeholder for analytics */}
        <Card>
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
      </div>
    </div>
  )
}

