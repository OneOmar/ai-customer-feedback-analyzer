import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import { BackButton } from "@/components/back-button"

/**
 * 404 Not Found Page
 * 
 * Custom error page for routes that don't exist.
 * Matches the project's design system and provides
 * a clear path back to the homepage.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md text-center space-y-8">
        {/* 404 Title */}
        <div className="space-y-4">
          <h1 className="text-8xl sm:text-9xl font-bold tracking-tight text-foreground">
            404
          </h1>
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Page Not Found
          </h2>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <p className="text-base sm:text-lg text-muted-foreground">
            Sorry, we couldn't find the page you're looking for.
          </p>
          <p className="text-sm text-muted-foreground">
            The page may have been moved, deleted, or the URL might be incorrect.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href="/" aria-label="Go back to homepage">
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              Go Home
            </Link>
          </Button>
          <BackButton />
        </div>

        {/* Additional Help */}
        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <Link 
              href="/contact" 
              className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

