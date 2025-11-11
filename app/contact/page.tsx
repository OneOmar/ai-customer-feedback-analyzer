import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, MessageSquare, Phone, MapPin, Send } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Contact Us | AI Feedback Analyzer",
  description: "Get in touch with the AI Feedback Analyzer team",
}

/**
 * Contact Page
 */
export default function ContactPage() {
  const contactMethods = [
    {
      title: "Email Support",
      description: "Send us an email and we'll respond within 24 hours",
      icon: Mail,
      contact: "support@example.com",
      href: "mailto:support@example.com",
    },
    {
      title: "Sales Inquiries",
      description: "Interested in enterprise plans? Let's talk",
      icon: MessageSquare,
      contact: "sales@example.com",
      href: "mailto:sales@example.com",
    },
    {
      title: "General Inquiries",
      description: "Have a question? We're here to help",
      icon: Phone,
      contact: "+1 (555) 123-4567",
      href: "tel:+15551234567",
    },
  ]

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We'd love to hear from you. Get in touch with our team.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {contactMethods.map((method) => {
            const Icon = method.icon
            return (
              <Card key={method.title}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <CardTitle className="text-lg">{method.title}</CardTitle>
                  </div>
                  <CardDescription>{method.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href={method.href}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {method.contact}
                  </a>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Send us a Message</CardTitle>
            <CardDescription>
              Fill out the form below and we'll get back to you as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="your.email@example.com"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="What's this about?"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder="Tell us more..."
                />
              </div>
              <Button type="submit" className="w-full">
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

