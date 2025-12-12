"use client"

import { useState } from "react"
import { Button, ButtonProps } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { type PlanType } from "@/lib/billing"
import { Loader2 } from "lucide-react"

/**
 * UpgradeButton Component
 * 
 * A reusable button component that initiates the Stripe checkout flow
 * for upgrading to a paid plan. Handles loading states and errors.
 * 
 * @example
 * ```tsx
 * <UpgradeButton plan="pro" variant="default" size="lg" />
 * ```
 */
interface UpgradeButtonProps extends Omit<ButtonProps, "onClick" | "onError"> {
  plan: PlanType
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function UpgradeButton({
  plan,
  className,
  children,
  onSuccess,
  onError,
  ...props
}: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleUpgrade = async () => {
    setIsLoading(true)

    try {
      // Call the checkout-plan API endpoint which handles price ID lookup server-side
      const response = await fetch("/api/stripe/checkout-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session")
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
        onSuccess?.()
      } else {
        throw new Error("No checkout URL received")
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to start upgrade process"

      console.error("Upgrade error:", error)
      toast({
        title: "Upgrade Failed",
        description: errorMessage,
        variant: "destructive",
      })
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Default button text based on plan
  const buttonText =
    children ||
    (plan === "pro"
      ? "Upgrade to Pro"
      : plan === "business"
      ? "Upgrade to Business"
      : "Upgrade")

  return (
    <Button
      onClick={handleUpgrade}
      disabled={isLoading}
      className={className}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        buttonText
      )}
    </Button>
  )
}

