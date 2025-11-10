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
          <SignedOut>
            <Button size="lg" asChild>
              <Link href="/sign-up">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button size="lg" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">
                Upgrade Plan
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </SignedIn>
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

      {/* Pricing Section */}
      <section className="mx-auto max-w-[980px] py-8 md:py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade at any time.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

        <div className="text-center mt-8">
          <Button variant="link" asChild>
            <Link href="/pricing">
              View All Plans and Features
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

