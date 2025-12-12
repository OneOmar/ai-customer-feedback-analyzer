"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { QuotaWarning } from "@/components/feature-gate"

/**
 * QuotaDisplay Component
 * 
 * Displays the user's current quota usage and plan information.
 * Shows progress bar and upgrade prompts when approaching limits.
 */
interface QuotaDisplayProps {
  className?: string
  /**
   * Refresh trigger - when this value changes, the quota will be refetched
   */
  refreshTrigger?: number
}

interface QuotaData {
  plan: string
  used: number
  limit: number
  percentage: number
  resetsAt: string
}

export function QuotaDisplay({ className, refreshTrigger }: QuotaDisplayProps) {
  const [quota, setQuota] = useState<QuotaData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isInitialMount = useRef(true)

  useEffect(() => {
    async function fetchQuota() {
      try {
        // Only show loading state on initial load, not on refresh
        if (isInitialMount.current) {
          setIsLoading(true)
          isInitialMount.current = false
        }
        const response = await fetch("/api/quota")
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setQuota(data.data)
          }
        }
      } catch (error) {
        console.error("Error fetching quota:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuota()
  }, [refreshTrigger])

  // Only show loading state if we don't have any quota data yet
  if (isLoading && !quota) {
    return null
  }

  // If we don't have quota data and we're not loading, don't render
  if (!quota) {
    return null
  }

  const resetDate = new Date(quota.resetsAt)
  const isWarning = quota.percentage >= 80
  const isExceeded = quota.used >= quota.limit
  const planLower = quota.plan.toLowerCase() as "free" | "pro" | "business"

  return (
    <div className={className}>
      {/* Quota Warning Alert */}
      {(isWarning || isExceeded) && (
        <QuotaWarning
          currentPlan={planLower}
          used={quota.used}
          limit={quota.limit}
          resource="analyses"
          resetDate={resetDate}
          showUpgrade={planLower !== "business"}
        />
      )}

      {/* Quota Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Usage this month</CardTitle>
            <Badge variant="secondary">{quota.plan} Plan</Badge>
          </div>
          <CardDescription>
            {quota.used} of {quota.limit} analyses used
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={quota.percentage} max={100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Resets on {resetDate.toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

