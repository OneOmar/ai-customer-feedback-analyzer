"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { Zap, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileMenu } from './mobile-menu'

/**
 * Responsive Header Component
 * 
 * Features:
 * - Fully responsive across all breakpoints
 * - Mobile hamburger menu with smooth transitions
 * - Accessibility-friendly (ARIA labels, keyboard navigation, focus states)
 * - Clean, modern design consistent with project UI
 * - Proper spacing and typography for all screen sizes
 */
export function Header() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Check if a nav link is active
  const isActive = (href: string) => pathname === href

  // Handle scroll effect for header background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isMobileMenuOpen])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b transition-all duration-200",
          "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          isScrolled && "shadow-sm"
        )}
        role="banner"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center flex-shrink-0">
              <Link
                href="/"
                className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm transition-opacity hover:opacity-80"
                aria-label="AI Feedback Analyzer - Home"
              >
                <span className="text-base sm:text-lg font-bold text-foreground">
                  AI Feedback Analyzer
                </span>
              </Link>
            </div>

            {/* Desktop Navigation - visible when signed in */}
            <SignedIn>
              <nav
                className="hidden md:flex flex-1 items-center justify-center space-x-1 lg:space-x-6 text-sm font-medium mx-4 lg:mx-8"
                aria-label="Main navigation"
              >
                <Link
                  href="/dashboard"
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isActive("/dashboard")
                      ? "text-foreground font-semibold bg-accent/50"
                      : "text-foreground/60 hover:text-foreground/80"
                  )}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/upload"
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isActive("/dashboard/upload")
                      ? "text-foreground font-semibold bg-accent/50"
                      : "text-foreground/60 hover:text-foreground/80"
                  )}
                >
                  Upload
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isActive("/dashboard/analytics")
                      ? "text-foreground font-semibold bg-accent/50"
                      : "text-foreground/60 hover:text-foreground/80"
                  )}
                >
                  Analytics
                </Link>
              </nav>
            </SignedIn>

            {/* Right side actions */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
              {/* Desktop Auth buttons */}
              <div className="hidden md:flex items-center gap-2 sm:gap-3">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                      aria-label="Sign in to your account"
                    >
                      Sign In
                    </button>
                  </SignInButton>
                </SignedOut>

                <SignedIn>
                  <Link
                    href="/pricing"
                    className="group relative inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-semibold bg-primary text-primary-foreground shadow-sm shadow-primary/20 h-9 px-3 sm:px-4 transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
                    aria-label="Upgrade your plan to unlock premium features"
                  >
                    <Zap
                      className="h-3.5 w-3.5 transition-all duration-200 group-hover:scale-110 group-hover:rotate-12"
                      aria-hidden="true"
                    />
                    <span className="hidden sm:inline">Upgrade</span>
                    <span className="sm:hidden">Up</span>
                  </Link>
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-9 h-9"
                      }
                    }}
                  />
                </SignedIn>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-foreground/60 hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
      />
    </>
  )
}

