import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from '@clerk/nextjs'
import "@/styles/globals.css"

// Load Inter font with Latin subset
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Customer Feedback Analyzer",
  description: "Analyze customer feedback with AI-powered insights",
}

/**
 * Root layout component for the entire application
 * Wraps all pages with common HTML structure and providers
 * Now includes ClerkProvider for authentication (v6)
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
          {/* Header placeholder - will be extracted to component */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <div className="mr-4 flex">
                <a className="mr-6 flex items-center space-x-2" href="/">
                  <span className="font-bold">AI Feedback Analyzer</span>
                </a>
              </div>
              <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                <nav className="flex items-center">
                  {/* Future: Add navigation items and user menu */}
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
      </body>
    </html>
    </ClerkProvider>
  )
}

