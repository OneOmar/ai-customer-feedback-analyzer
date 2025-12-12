"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Send } from "lucide-react"

/**
 * ContactSalesForm Component
 * 
 * A clean, accessible contact form for sales inquiries.
 * Features form validation, loading states, and error handling.
 */
export function ContactSalesForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate form submission
      // In a real application, this would send data to your backend
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Message sent!",
        description: "Our sales team will get back to you within 24 hours.",
      })

      // Reset form
      setFormData({
        name: "",
        email: "",
        company: "",
        message: "",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again or contact us directly.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send us a message</CardTitle>
        <CardDescription>
          Fill out the form below and we&#39;ll get back to you as soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Name <span className="text-destructive" aria-label="required">*</span>
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
              required
              aria-required="true"
              className="w-full"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Email <span className="text-destructive" aria-label="required">*</span>
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              aria-required="true"
              className="w-full"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="company"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Company (optional)
            </label>
            <Input
              id="company"
              name="company"
              type="text"
              placeholder="Your company name"
              value={formData.company}
              onChange={handleChange}
              className="w-full"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="message"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Message <span className="text-destructive" aria-label="required">*</span>
            </label>
            <Textarea
              id="message"
              name="message"
              placeholder="Tell us about your needs..."
              value={formData.message}
              onChange={handleChange}
              required
              aria-required="true"
              rows={4}
              className="w-full resize-none"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            aria-label="Send sales inquiry message"
          >
            {isLoading ? (
              "Sending..."
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

