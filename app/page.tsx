import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PLANS } from "@/lib/billing"
import { Check, ArrowRight } from "lucide-react"
import Link from "next/link"
import { SignedIn, SignedOut } from "@clerk/nextjs"

/**
 * Home page component
 * Landing page for the AI Customer Feedback Analyzer
 */
export default function HomePage() {
  return (
    <div>
      {/* Hero Section - Full Viewport Height */}
      <section className="flex min-h-screen flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[980px] flex flex-col items-center justify-center text-center space-y-6">
          <h1 className="text-3xl font-bold leading-tight tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl lg:leading-[1.1]">
            AI Customer Feedback Analyzer
          </h1>
          <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl md:text-2xl">
            Transform customer feedback into actionable insights with AI-powered analysis.
            Upload, analyze, and visualize sentiment at scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
            <SignedOut>
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/sign-up">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="/pricing">
                  Upgrade Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Features Section - Full Viewport Height */}
      <section className="flex min-h-screen flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[980px] flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-8 sm:text-3xl md:text-4xl lg:mb-12">
            Key Features
          </h2>
          <div className="grid gap-6 w-full sm:grid-cols-2 lg:grid-cols-3">
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
        </div>
      </section>

      {/* Pricing Section - Full Viewport Height */}
      <section className="flex min-h-screen flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[980px] flex flex-col items-center justify-center">
          <div className="text-center mb-8 sm:mb-12 w-full">
            <h2 className="text-2xl font-bold tracking-tight mb-4 sm:text-3xl md:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto sm:text-lg md:text-xl">
              Choose the plan that fits your needs. Upgrade or downgrade at any time.
            </p>
          </div>

          <div className="grid gap-6 w-full sm:grid-cols-2 lg:grid-cols-3">
          {/* Free Plan */}
          <Card>
            <CardHeader>
              <CardTitle>{PLANS.free.name}</CardTitle>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold">${PLANS.free.priceMonthly}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription>Perfect for getting started</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {PLANS.free.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <SignedOut>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </SignedIn>
            </CardFooter>
          </Card>

          {/* Pro Plan - Highlighted */}
          <Card className="border-primary shadow-lg relative sm:col-span-2 lg:col-span-1">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">
                Most Popular
              </Badge>
            </div>
            <CardHeader>
              <CardTitle>{PLANS.pro.name}</CardTitle>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold">${PLANS.pro.priceMonthly}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription>Best for growing teams</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {PLANS.pro.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <SignedOut>
                <Button className="w-full" asChild>
                  <Link href="/sign-up">Start Pro Trial</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button className="w-full" asChild>
                  <Link href="/pricing">
                    Upgrade to Pro
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </SignedIn>
            </CardFooter>
          </Card>

          {/* Business Plan */}
          <Card>
            <CardHeader>
              <CardTitle>{PLANS.business.name}</CardTitle>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold">${PLANS.business.priceMonthly}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription>For enterprises at scale</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {PLANS.business.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <SignedOut>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/sign-up">Contact Sales</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/pricing">
                    Upgrade to Business
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </SignedIn>
            </CardFooter>
          </Card>
        </div>

          <div className="text-center mt-8 sm:mt-12">
            <Button variant="link" className="text-base sm:text-lg" asChild>
              <Link href="/pricing">
                View All Plans and Features
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

