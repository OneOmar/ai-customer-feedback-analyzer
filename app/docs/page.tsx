import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Book, FileText, Video, Code, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Documentation | AI Feedback Analyzer",
  description: "Documentation and guides for AI Customer Feedback Analyzer",
}

/**
 * Documentation Page
 */
export default function DocsPage() {
  const docSections = [
    {
      title: "Getting Started",
      description: "Learn the basics and get up and running quickly",
      icon: Book,
      links: [
        { href: "#", label: "Quick Start Guide" },
        { href: "#", label: "Creating Your Account" },
        { href: "#", label: "Your First Analysis" },
      ],
    },
    {
      title: "User Guide",
      description: "Comprehensive guides for using all features",
      icon: FileText,
      links: [
        { href: "#", label: "Uploading Feedback Data" },
        { href: "#", label: "Understanding Analytics" },
        { href: "#", label: "Exporting Results" },
      ],
    },
    {
      title: "API Reference",
      description: "Integrate with our API for advanced workflows",
      icon: Code,
      links: [
        { href: "#", label: "Authentication" },
        { href: "#", label: "Endpoints" },
        { href: "#", label: "Webhooks" },
      ],
    },
    {
      title: "Video Tutorials",
      description: "Watch step-by-step video guides",
      icon: Video,
      links: [
        { href: "#", label: "Getting Started Video" },
        { href: "#", label: "Advanced Features" },
        { href: "#", label: "Best Practices" },
      ],
    },
  ]

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Documentation
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about using AI Feedback Analyzer
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mb-12">
          {docSections.map((section) => {
            const Icon = section.icon
            return (
              <Card key={section.title}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <CardTitle>{section.title}</CardTitle>
                  </div>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                        >
                          <ArrowRight className="h-4 w-4" />
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="border-t pt-12">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-2xl font-bold">Need More Help?</h2>
            <p className="text-muted-foreground">
              Can&apos;t find what you&apos;re looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/contact">
                  Contact Support
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/support">Visit Support Center</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

