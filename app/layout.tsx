import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from "@/components/ui/toaster"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PostHogProvider } from "@/components/posthog-provider"
import "@/styles/globals.css"

// Load Inter font with Latin subset
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Customer Feedback Analyzer",
  description: "Analyze customer feedback with AI-powered insights",
}

/**
 * Root layout component for the entire application
 * Wraps all pages with Clerk authentication provider
 * 
 * Required Environment Variables:
 * - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
 * - CLERK_SECRET_KEY
 * - NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
 * - NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
 * - NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
 * - NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <PostHogProvider />
          <div className="relative flex min-h-screen flex-col">
          {/* Responsive Header with mobile menu */}
          <Header />

          {/* Main content area */}
          <main className="flex-1">{children}</main>

          {/* Responsive Footer */}
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
    </ClerkProvider>
  )
}

