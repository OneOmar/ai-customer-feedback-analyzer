import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cookie Policy | AI Feedback Analyzer",
  description: "Cookie Policy for AI Customer Feedback Analyzer",
}

/**
 * Cookie Policy Page
 */
export default function CookiesPage() {
  return (
    <div className="container py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Cookie Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files that are placed on your device when you visit a website. 
              They are widely used to make websites work more efficiently and provide information to 
              the website owners.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use cookies for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
              <li><strong>Authentication Cookies:</strong> To keep you logged in and maintain your session</li>
              <li><strong>Analytics Cookies:</strong> To understand how visitors interact with our website</li>
              <li><strong>Preference Cookies:</strong> To remember your settings and preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">3.1 Session Cookies</h3>
                <p className="text-muted-foreground leading-relaxed">
                  These are temporary cookies that expire when you close your browser. They help maintain 
                  your session while using our Service.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">3.2 Persistent Cookies</h3>
                <p className="text-muted-foreground leading-relaxed">
                  These cookies remain on your device for a set period or until you delete them. 
                  They help us remember your preferences.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Managing Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              You can control and manage cookies through your browser settings. Most browsers allow you to 
              refuse or delete cookies. However, disabling cookies may affect the functionality of our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Third-Party Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may use third-party services that set cookies on your device. These services help us 
              analyze usage and improve our Service. We do not control these third-party cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about our use of cookies, please contact us at{" "}
              <a href="mailto:privacy@example.com" className="text-primary hover:underline">
                privacy@example.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

