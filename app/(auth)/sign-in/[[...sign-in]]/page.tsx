import { SignIn } from '@clerk/nextjs'

/**
 * Sign-in page
 * 
 * Uses Clerk's pre-built SignIn component
 * The [[...sign-in]] catch-all route handles all sign-in flows
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in (set in .env.local)
 */
export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg"
          }
        }}
      />
    </div>
  )
}

