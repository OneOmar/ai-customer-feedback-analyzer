import { Button } from "@/components/ui/button"

/**
 * Home page component
 * Landing page for the AI Customer Feedback Analyzer
 */
export default function HomePage() {
  return (
    <div className="container py-10">
      {/* Hero Section */}
      <section className="mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20">
        <h1 className="text-center text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1]">
          AI Customer Feedback Analyzer
        </h1>
        <p className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl">
          Transform customer feedback into actionable insights with AI-powered analysis.
          Upload, analyze, and visualize sentiment at scale.
        </p>
        <div className="flex gap-4 mt-6">
          <Button size="lg">
            Get Started
          </Button>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-[980px] py-8 md:py-12">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-8">
          Key Features
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature Card 1 */}
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">CSV Upload</h3>
            <p className="text-sm text-muted-foreground">
              Easily upload customer feedback data in CSV format for instant analysis.
            </p>
          </div>

          {/* Feature Card 2 */}
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">AI Sentiment Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Leverage OpenAI to analyze sentiment and extract key themes from feedback.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">Visual Insights</h3>
            <p className="text-sm text-muted-foreground">
              View interactive charts and dashboards to understand customer sentiment trends.
            </p>
          </div>

          {/* Feature Card 4 */}
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">Secure Authentication</h3>
            <p className="text-sm text-muted-foreground">
              Protected by Clerk authentication with role-based access control.
            </p>
          </div>

          {/* Feature Card 5 */}
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">Scalable Storage</h3>
            <p className="text-sm text-muted-foreground">
              Store and manage feedback data securely with Supabase.
            </p>
          </div>

          {/* Feature Card 6 */}
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">Export Reports</h3>
            <p className="text-sm text-muted-foreground">
              Generate and download comprehensive analysis reports.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

