"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UpgradeButton } from "@/components/upgrade-button"
import { Lock, Zap, TrendingUp } from "lucide-react"
import Link from "next/link"

/**
 * FeatureGate Component
 * 
 * Displays an upgrade prompt when a user tries to access a feature
 * that's not available on their current plan.
 * 
 * @example
 * ```tsx
 * <FeatureGate
 *   feature="Advanced Analytics"
 *   currentPlan="free"
 *   requiredPlan="pro"
 *   description="Unlock advanced analytics and insights with Pro"
 * />
 * ```
 */
interface FeatureGateProps {
  feature: string
  currentPlan: "free" | "pro" | "business"
  requiredPlan: "pro" | "business"
  description?: string
  actionLabel?: string
  variant?: "card" | "alert"
}

export function FeatureGate({
  feature,
  currentPlan,
  requiredPlan,
  description,
  actionLabel,
  variant = "card",
}: FeatureGateProps) {
  // Don't show gate if user already has access
  const planHierarchy = { free: 0, pro: 1, business: 2 }
  if (planHierarchy[currentPlan] >= planHierarchy[requiredPlan]) {
    return null
  }

  const defaultDescription =
    description ||
    `Upgrade to ${requiredPlan === "pro" ? "Pro" : "Business"} to unlock ${feature}.`

  if (variant === "alert") {
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>Feature Locked</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-3">{defaultDescription}</p>
          <div className="flex gap-2">
            <UpgradeButton plan={requiredPlan} size="sm" />
            <Button variant="outline" size="sm" asChild>
              <Link href="/pricing">View Plans</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Upgrade to Unlock {feature}</CardTitle>
        </div>
        <CardDescription>{defaultDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>
              Available on {requiredPlan === "pro" ? "Pro" : "Business"} plan
            </span>
          </div>
          <div className="flex gap-2">
            <UpgradeButton
              plan={requiredPlan}
              variant="default"
              className="flex-1"
            >
              {actionLabel || `Upgrade to ${requiredPlan === "pro" ? "Pro" : "Business"}`}
            </UpgradeButton>
            <Button variant="outline" asChild>
              <Link href="/pricing">View All Plans</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * QuotaWarning Component
 * 
 * Displays a warning when a user is approaching or has exceeded their quota.
 * Shows upgrade options to increase limits.
 * 
 * @example
 * ```tsx
 * <QuotaWarning
 *   currentPlan="free"
 *   used={45}
 *   limit={50}
 *   resource="analyses"
 *   resetDate={new Date()}
 * />
 * ```
 */
interface QuotaWarningProps {
  currentPlan: "free" | "pro" | "business"
  used: number
  limit: number
  resource: string
  resetDate?: Date
  showUpgrade?: boolean
}

export function QuotaWarning({
  currentPlan,
  used,
  limit,
  resource,
  resetDate,
  showUpgrade = true,
}: QuotaWarningProps) {
  const percentage = (used / limit) * 100
  const isWarning = percentage >= 80
  const isExceeded = used >= limit

  if (!isWarning && !isExceeded) {
    return null
  }

  const recommendedPlan = currentPlan === "free" ? "pro" : "business"

  return (
    <Alert variant={isExceeded ? "destructive" : "default"}>
      <TrendingUp className="h-4 w-4" />
      <AlertTitle>
        {isExceeded
          ? `Quota Exceeded`
          : `Approaching ${resource} Limit`}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          You've used {used} of {limit} {resource} this month.
          {resetDate &&
            !isExceeded &&
            ` Your quota resets on ${resetDate.toLocaleDateString()}.`}
        </p>
        {isExceeded && (
          <p className="mb-3 font-medium">
            Upgrade to continue using {resource}.
          </p>
        )}
        {showUpgrade && (
          <div className="flex gap-2 mt-3">
            <UpgradeButton plan={recommendedPlan} size="sm">
              Upgrade Plan
            </UpgradeButton>
            <Button variant="outline" size="sm" asChild>
              <Link href="/pricing">View Plans</Link>
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

