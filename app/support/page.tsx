import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { HelpCircle, Book, MessageSquare, Search, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Support Center | AI Feedback Analyzer",
  description: "Get help and support for AI Customer Feedback Analyzer",
}

/**
 * Support Center Page
 */
export default function SupportPage() {
  const faqs = [
    {
      question: "How do I upload my feedback data?",
      answer: "Navigate to the Upload page in your dashboard, select your CSV file, and click upload. Make sure your file follows our required format.",
    },
    {
      question: "What file formats are supported?",
      answer: "We currently support CSV and TXT files. Your file should include a column with customer feedback text.",
    },
    {
      question: "How accurate is the sentiment analysis?",
      answer: "Our AI-powered analysis provides high accuracy sentiment detection. Results may vary based on the quality and clarity of the feedback text.",
    },
    {
      question: "Can I export my analysis results?",
      answer: "Yes, you can export your analysis results in various formats including CSV, JSON, and PDF from the Analytics page.",
    },
    {
      question: "What are the subscription limits?",
      answer: "Free plans include 100 feedback entries per month. Pro and Business plans offer higher limits. Check the Pricing page for details.",
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can manage your subscription from your account settings. Cancellations take effect at the end of your billing period.",
    },
  ]

  const supportOptions = [
    {
      title: "Documentation",
      description: "Browse our comprehensive guides and tutorials",
      icon: Book,
      href: "/docs",
    },
    {
      title: "Contact Support",
      description: "Get in touch with our support team",
      icon: MessageSquare,
      href: "/contact",
    },
    {
      title: "Search Articles",
      description: "Find answers in our knowledge base",
      icon: Search,
      href: "#",
    },
  ]

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Support Center
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions or get help from our team
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {supportOptions.map((option) => {
            const Icon = option.icon
            return (
              <Card key={option.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <CardTitle>{option.title}</CardTitle>
                  </div>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={option.href}>
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Still Need Help?</CardTitle>
            <CardDescription>
              Can&apos;t find what you&apos;re looking for? Our support team is ready to assist you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild>
                <Link href="/contact">
                  Contact Support
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="mailto:support@example.com">Email Us</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

