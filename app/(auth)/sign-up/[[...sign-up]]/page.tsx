import { SignUp } from '@clerk/nextjs'

/**
 * Sign-up page
 * 
 * Uses Clerk's pre-built SignUp component
 * The [[...sign-up]] catch-all route handles all sign-up flows
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up (set in .env.local)
 */
export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <SignUp 
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

