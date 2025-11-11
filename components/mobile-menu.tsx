"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { Zap, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Mobile Menu Component
 * 
 * Features:
 * - Smooth slide-in animation
 * - Accessibility-friendly (ARIA labels, keyboard navigation)
 * - Overlay backdrop with click-to-close
 * - Proper focus management
 * - Responsive spacing and typography
 */
export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname()

  // Check if a nav link is active
  const isActive = (href: string) => pathname === href

  // Handle link clicks to close menu
  const handleLinkClick = () => {
    onClose()
  }

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Mobile menu panel */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-background border-l shadow-xl transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        <div className="flex flex-col h-full">
          {/* Menu header */}
          <div className="flex items-center justify-between p-4 border-b">
            <span className="text-lg font-semibold text-foreground">
              Menu
            </span>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md p-2 text-foreground/60 hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Menu content */}
          <nav
            className="flex-1 overflow-y-auto p-4 space-y-1"
            aria-label="Mobile navigation"
          >
            <SignedIn>
              <Link
                href="/dashboard"
                onClick={handleLinkClick}
                className={cn(
                  "block px-4 py-3 rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive("/dashboard")
                    ? "text-foreground font-semibold bg-accent"
                    : "text-foreground/80 hover:text-foreground hover:bg-accent"
                )}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/upload"
                onClick={handleLinkClick}
                className={cn(
                  "block px-4 py-3 rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive("/dashboard/upload")
                    ? "text-foreground font-semibold bg-accent"
                    : "text-foreground/80 hover:text-foreground hover:bg-accent"
                )}
              >
                Upload
              </Link>
              <Link
                href="/dashboard/analytics"
                onClick={handleLinkClick}
                className={cn(
                  "block px-4 py-3 rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive("/dashboard/analytics")
                    ? "text-foreground font-semibold bg-accent"
                    : "text-foreground/80 hover:text-foreground hover:bg-accent"
                )}
              >
                Analytics
              </Link>
            </SignedIn>
          </nav>

          {/* Menu footer with auth actions */}
          <div className="p-4 border-t space-y-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  onClick={handleLinkClick}
                  className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2"
                  aria-label="Sign in to your account"
                >
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <Link
                href="/pricing"
                onClick={handleLinkClick}
                className="group w-full inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold bg-primary text-primary-foreground shadow-sm shadow-primary/20 h-10 px-4 transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Upgrade your plan to unlock premium features"
              >
                <Zap
                  className="h-4 w-4 transition-all duration-200 group-hover:scale-110 group-hover:rotate-12"
                  aria-hidden="true"
                />
                <span>Upgrade</span>
              </Link>
              <div className="flex items-center justify-center pt-2">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10"
                    }
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </>
  )
}

