import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PLANS } from "@/lib/billing"
import { Check } from "lucide-react"
import Link from "next/link"
import { UpgradeButton } from "@/components/upgrade-button"
import { getCurrentAuth } from "@/lib/auth"
import { getSubscription } from "@/lib/billing"
import { SignedIn, SignedOut } from "@clerk/nextjs"

/**
 * Pricing Page
 * 
 * Displays all available subscription plans with features and pricing.
 * Shows upgrade buttons for authenticated users or sign-up links for guests.
 */
export default async function PricingPage() {
  const { userId } = await getCurrentAuth()
  const subscription = userId ? await getSubscription(userId) : null
  const currentPlan = subscription?.plan || "free"

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your customer feedback analysis needs.
            All plans include AI-powered sentiment analysis and insights.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {/* Free Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">{PLANS.free.name}</CardTitle>
                {currentPlan === "free" && (
                  <Badge variant="secondary">Current</Badge>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">${PLANS.free.priceMonthly}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription>
                Perfect for getting started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {PLANS.free.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <SignedOut>
                <Link href="/sign-up" className="w-full">
                  <Button variant="outline" className="w-full">
                    Get Started Free
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                {currentPlan === "free" ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Downgrade Available
                  </Button>
                )}
              </SignedIn>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className="border-primary shadow-lg relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              {currentPlan === "pro" ? (
                <Badge className="bg-primary text-primary-foreground">
                  Current
                </Badge>
              ) : (
                <Badge className="bg-primary text-primary-foreground">
                  Popular
                </Badge>
              )}
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">{PLANS.pro.name}</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">${PLANS.pro.priceMonthly}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription>
                Best for growing teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {PLANS.pro.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <SignedOut>
                <Link href="/sign-up" className="w-full">
                  <Button className="w-full">
                    Start Pro Trial
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                {currentPlan === "pro" ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <UpgradeButton 
                    plan="pro" 
                    className="w-full"
                    variant="default"
                  />
                )}
              </SignedIn>
            </CardFooter>
          </Card>

          {/* Business Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">{PLANS.business.name}</CardTitle>
                {currentPlan === "business" && (
                  <Badge variant="secondary">Current</Badge>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">${PLANS.business.priceMonthly}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription>
                For enterprises at scale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {PLANS.business.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <SignedOut>
                <Link href="/sign-up" className="w-full">
                  <Button variant="outline" className="w-full">
                    Contact Sales
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                {currentPlan === "business" ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <UpgradeButton 
                    plan="business" 
                    className="w-full"
                    variant="outline"
                  />
                )}
              </SignedIn>
            </CardFooter>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 border-t pt-12">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards and debit cards through Stripe.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-sm text-muted-foreground">
                The Free plan is always free. Pro and Business plans offer a 14-day free trial.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens if I exceed my limit?</h3>
              <p className="text-sm text-muted-foreground">
                You'll receive a notification when you're approaching your limit. You can upgrade at any time to continue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

