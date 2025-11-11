"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

/**
 * Back Button Component
 * 
 * Client component that handles browser back navigation
 */
export function BackButton() {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <Button 
      size="lg" 
      variant="outline" 
      onClick={handleBack}
      className="w-full sm:w-auto"
      aria-label="Go back to previous page"
    >
      <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
      Go Back
    </Button>
  )
}

