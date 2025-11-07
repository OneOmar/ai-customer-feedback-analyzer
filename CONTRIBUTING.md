# Contributing Guide

Thank you for contributing to the AI Customer Feedback Analyzer! This guide will help you get started with development.

## Development Workflow

### 1. Set Up Development Environment

Follow the instructions in `SETUP.md` to configure your local environment.

### 2. Code Style Guidelines

- **TypeScript**: All new files must use TypeScript
- **Components**: Use functional components with TypeScript interfaces
- **Naming**: Use PascalCase for components, camelCase for functions/variables
- **Comments**: Add JSDoc comments for all exported functions and components
- **Imports**: Use absolute imports with `@/` alias

### 3. Component Structure

```typescript
import { ComponentProps } from "@/types"
import { cn } from "@/lib/utils"

/**
 * Component description
 * @param props - Component props
 * @returns JSX Element
 */
export function MyComponent({ prop1, prop2 }: ComponentProps) {
  // Component logic
  return (
    <div className={cn("base-classes", "conditional-classes")}>
      {/* Component content */}
    </div>
  )
}
```

### 4. File Organization

```
app/                    # App Router pages
  (auth)/              # Auth route group
  (dashboard)/         # Protected dashboard routes
  api/                 # API routes
components/            # Reusable components
  ui/                  # shadcn/ui components
  layout/              # Layout components (Header, Footer)
  feedback/            # Feature-specific components
lib/                   # Utility functions and configs
  utils.ts             # Helper utilities
  supabase.ts          # Database client
  openai.ts            # AI client
  stripe.ts            # Payment client
  constants.ts         # App constants
types/                 # TypeScript type definitions
styles/                # Global styles
scripts/               # Build and utility scripts
```

### 5. Naming Conventions

#### Files
- **Components**: `PascalCase.tsx` (e.g., `FeedbackCard.tsx`)
- **Utilities**: `camelCase.ts` (e.g., `formatDate.ts`)
- **Types**: `camelCase.ts` or `index.ts`
- **Styles**: `kebab-case.css` (e.g., `global-styles.css`)

#### Variables and Functions
```typescript
// Components
export function FeedbackCard() {}

// Hooks
export function useFeedback() {}

// Utilities
export function formatSentiment() {}

// Constants
export const MAX_FILE_SIZE = 1024

// Types
export interface FeedbackProps {}
export type SentimentType = 'positive' | 'negative' | 'neutral'
```

### 6. Git Workflow

#### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

#### Commit Messages
Follow conventional commits:
```
feat: add CSV upload component
fix: resolve sentiment analysis bug
docs: update setup instructions
style: format code with prettier
refactor: simplify feedback processing
test: add unit tests for analytics
chore: update dependencies
```

### 7. Testing Strategy

```typescript
// Unit tests for utilities
describe('formatSentiment', () => {
  it('should format positive sentiment correctly', () => {
    expect(formatSentiment(0.8)).toBe('positive')
  })
})

// Component tests
describe('FeedbackCard', () => {
  it('should render feedback content', () => {
    render(<FeedbackCard feedback={mockFeedback} />)
    expect(screen.getByText(mockFeedback.content)).toBeInTheDocument()
  })
})
```

### 8. API Route Pattern

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Route description
 * @param request - Next.js request object
 * @returns JSON response
 */
export async function GET(request: NextRequest) {
  try {
    // Route logic
    return NextResponse.json({ success: true, data: {} })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error message' },
      { status: 500 }
    )
  }
}
```

### 9. Environment Variables

- **Never** commit `.env.local` or any file with real credentials
- Always update `.env.local.example` when adding new variables
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Validate required env vars at startup

### 10. Code Review Checklist

Before submitting a PR:
- [ ] Code follows style guidelines
- [ ] All functions have JSDoc comments
- [ ] Types are properly defined
- [ ] No console.logs or debug code
- [ ] Error handling is implemented
- [ ] Components are responsive
- [ ] Accessibility (a11y) is considered
- [ ] Performance is optimized
- [ ] Tests pass (when implemented)
- [ ] Linter shows no errors (`npm run lint`)
- [ ] Documentation is updated

### 11. Performance Best Practices

- Use Server Components by default
- Add `'use client'` only when needed (interactivity, hooks)
- Optimize images with `next/image`
- Lazy load heavy components
- Implement proper loading states
- Use React.memo for expensive renders
- Debounce user input handlers

### 12. Accessibility Guidelines

- Use semantic HTML elements
- Add proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Maintain color contrast ratios (WCAG AA)
- Provide alt text for images

### 13. Security Considerations

- Validate all user input
- Sanitize data before storing/displaying
- Use parameterized queries
- Implement rate limiting
- Never expose API keys client-side
- Use HTTPS in production
- Implement CSRF protection

## Getting Help

- Check existing documentation in `README.md` and `SETUP.md`
- Review similar implementations in the codebase
- Ask questions in issues or discussions

Thank you for contributing! 🚀

