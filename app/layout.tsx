import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Toaster } from "@/components/ui/toaster"
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
          <div className="relative flex min-h-screen flex-col">
          {/* Header with authentication UI */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <div className="mr-4 flex">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                  <span className="font-bold">AI Feedback Analyzer</span>
                </Link>
              </div>
              
              {/* Navigation - visible when signed in */}
              <SignedIn>
                <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
                  <Link 
                    href="/dashboard" 
                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/dashboard/upload" 
                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                  >
                    Upload
                  </Link>
                  <Link 
                    href="/dashboard/analytics" 
                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                  >
                    Analytics
                  </Link>
                </nav>
              </SignedIn>
              
              {/* Auth buttons and user menu */}
              <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                <nav className="flex items-center gap-2">
                  {/* Show sign-in button when signed out */}
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                        Sign In
                      </button>
                    </SignInButton>
                  </SignedOut>
                  
                  {/* Show user avatar and menu when signed in */}
                  <SignedIn>
                    <UserButton 
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: "w-9 h-9"
                        }
                      }}
                    />
                  </SignedIn>
                </nav>
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1">{children}</main>

          {/* Footer placeholder - will be extracted to component */}
          <footer className="border-t py-6 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
              <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                Built with Next.js, Tailwind CSS, and shadcn/ui.
              </p>
            </div>
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
    </ClerkProvider>
  )
}

