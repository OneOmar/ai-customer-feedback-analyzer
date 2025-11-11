"use client"

import Link from 'next/link'
import { Github, Twitter, Linkedin, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Footer Component
 * 
 * Features:
 * - Fully responsive across all breakpoints
 * - Centered text on mobile screens
 * - Clean, modern design consistent with project UI
 * - Accessibility-friendly (ARIA labels, semantic HTML)
 * - Auto-updating copyright year
 * - Organized link structure (product, legal, support, social)
 * - Proper spacing and typography hierarchy
 */
export function Footer() {
  const currentYear = new Date().getFullYear()

  const productLinks = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/pricing', label: 'Pricing' },
  ]

  const legalLinks = [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/cookies', label: 'Cookie Policy' },
  ]

  const supportLinks = [
    { href: '/docs', label: 'Documentation' },
    { href: '/contact', label: 'Contact' },
    { href: '/support', label: 'Support' },
  ]

  const socialLinks = [
    {
      href: 'https://github.com',
      label: 'GitHub',
      icon: Github,
      external: true,
    },
    {
      href: 'https://twitter.com',
      label: 'Twitter',
      icon: Twitter,
      external: true,
    },
    {
      href: 'https://linkedin.com',
      label: 'LinkedIn',
      icon: Linkedin,
      external: true,
    },
    {
      href: 'mailto:support@example.com',
      label: 'Email',
      icon: Mail,
      external: true,
    },
  ]

  return (
    <footer
      className="border-t bg-background"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-10 sm:py-12 lg:py-16">
          {/* Main footer content */}
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand section */}
            <div className="space-y-5 text-center sm:text-left">
              <Link
                href="/"
                className="inline-flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm transition-opacity hover:opacity-80"
                aria-label="AI Feedback Analyzer - Home"
              >
                <span className="text-lg font-bold text-foreground">
                  AI Feedback Analyzer
                </span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto sm:mx-0">
                Analyze customer feedback with AI-powered insights. Get actionable
                intelligence from your customer data.
              </p>
              {/* Social links */}
              <div className="flex items-center justify-center sm:justify-start space-x-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target={social.external ? '_blank' : undefined}
                      rel={social.external ? 'noopener noreferrer' : undefined}
                      className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                      aria-label={`Visit our ${social.label} page`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Product links */}
            <div className="space-y-4 text-center sm:text-left">
              <h3 className="text-sm font-semibold text-foreground">Product</h3>
              <ul className="space-y-3" role="list">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal links */}
            <div className="space-y-4 text-center sm:text-left">
              <h3 className="text-sm font-semibold text-foreground">Legal</h3>
              <ul className="space-y-3" role="list">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support links */}
            <div className="space-y-4 text-center sm:text-left">
              <h3 className="text-sm font-semibold text-foreground">Support</h3>
              <ul className="space-y-3" role="list">
                {supportLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-8 border-t">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <p className="text-sm text-muted-foreground text-center">
                © {currentYear} AI Feedback Analyzer. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
