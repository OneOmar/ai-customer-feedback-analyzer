"use client"

import { useState, useCallback } from "react"
import { QuotaDisplay } from "@/components/quota-display"
import { DashboardContent } from "@/components/dashboard-content"

/**
 * DashboardWrapper Component
 * 
 * Client-side wrapper that coordinates refresh between QuotaDisplay and DashboardContent.
 * When analysis completes, it triggers both quota and feedback data refresh.
 */
export function DashboardWrapper() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  /**
   * Handle analysis completion - refreshes both quota and feedback data
   */
  const handleAnalysisComplete = useCallback(() => {
    // Increment refresh trigger to cause QuotaDisplay to refetch
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  return (
    <>
      {/* Quota Display */}
      <div className="mb-6">
        <QuotaDisplay refreshTrigger={refreshTrigger} />
      </div>

      {/* Dashboard Content */}
      <DashboardContent onQuotaRefresh={handleAnalysisComplete} />
    </>
  )
}

