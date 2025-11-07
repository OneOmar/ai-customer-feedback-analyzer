# Project Structure

Complete overview of the AI Customer Feedback Analyzer project structure.

## Directory Tree

```
ai-customer-feedback-analyzer/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   └── health/              # Health check endpoint
│   │       └── route.ts
│   ├── layout.tsx               # Root layout with header/footer
│   ├── page.tsx                 # Home page
│   └── favicon.ico              # Site favicon
│
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx           # Button component
│   │   └── card.tsx             # Card components
│   └── .gitkeep
│
├── lib/                         # Utilities and configurations
│   ├── utils.ts                 # Helper utilities (cn function)
│   ├── supabase.ts              # Supabase client
│   ├── openai.ts                # OpenAI client
│   ├── stripe.ts                # Stripe client
│   └── constants.ts             # App-wide constants
│
├── types/                       # TypeScript type definitions
│   └── index.ts                 # Core type definitions
│
├── styles/                      # Global styles
│   └── globals.css              # Tailwind base + CSS variables
│
├── scripts/                     # Build and utility scripts
│   └── .gitkeep
│
├── public/                      # Static assets
│   └── .gitkeep
│
├── .eslintrc.json              # ESLint configuration
├── .gitignore                  # Git ignore rules
├── .env.local.example          # Environment variables template
├── components.json             # shadcn/ui configuration
├── middleware.ts               # Next.js middleware
├── next.config.js              # Next.js configuration
├── package.json                # Dependencies and scripts
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── README.md                   # Main documentation
├── SETUP.md                    # Setup instructions
├── CONTRIBUTING.md             # Contributing guidelines
└── PROJECT_STRUCTURE.md        # This file
```

## Key Files and Their Purpose

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | NPM dependencies and scripts |
| `tsconfig.json` | TypeScript compiler configuration |
| `next.config.js` | Next.js framework configuration |
| `tailwind.config.ts` | Tailwind CSS theming and plugins |
| `postcss.config.js` | PostCSS plugins (Tailwind, Autoprefixer) |
| `components.json` | shadcn/ui component configuration |
| `.eslintrc.json` | Code linting rules |
| `middleware.ts` | Request/response middleware |

### Application Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with header, footer, font loading |
| `app/page.tsx` | Home page with hero and features |
| `app/api/health/route.ts` | Health check API endpoint |
| `lib/utils.ts` | Utility functions (cn for class merging) |
| `lib/supabase.ts` | Supabase database client setup |
| `lib/openai.ts` | OpenAI API client and helpers |
| `lib/stripe.ts` | Stripe payment processing setup |
| `lib/constants.ts` | Application constants and config |
| `types/index.ts` | TypeScript type definitions |
| `styles/globals.css` | Global CSS with Tailwind and theme variables |

### Component Files

| File | Purpose |
|------|---------|
| `components/ui/button.tsx` | Reusable button component with variants |
| `components/ui/card.tsx` | Card components for content sections |

## Future Structure

As the project grows, consider these additions:

```
app/
├── (auth)/                      # Auth route group
│   ├── sign-in/                # Sign-in page
│   └── sign-up/                # Sign-up page
├── (dashboard)/                # Protected routes
│   ├── dashboard/
│   │   ├── page.tsx           # Dashboard overview
│   │   ├── upload/            # CSV upload
│   │   ├── analytics/         # Analytics dashboard
│   │   └── settings/          # User settings
│   └── layout.tsx             # Dashboard layout
├── pricing/                    # Pricing page
└── api/
    ├── feedback/              # Feedback CRUD
    ├── analyze/               # AI analysis endpoint
    ├── upload/                # CSV upload handler
    └── webhooks/
        └── stripe/            # Stripe webhook handler

components/
├── ui/                        # shadcn/ui components
├── layout/
│   ├── Header.tsx            # Site header
│   ├── Footer.tsx            # Site footer
│   └── Sidebar.tsx           # Dashboard sidebar
├── feedback/
│   ├── FeedbackCard.tsx      # Individual feedback display
│   ├── FeedbackList.tsx      # List of feedback items
│   └── FeedbackUpload.tsx    # CSV upload form
├── analytics/
│   ├── SentimentChart.tsx    # Sentiment visualization
│   ├── TrendChart.tsx        # Trend analysis
│   └── StatsCard.tsx         # Statistics display
└── forms/
    ├── UploadForm.tsx        # Upload form component
    └── FilterForm.tsx        # Filtering controls

lib/
├── utils/
│   ├── date.ts               # Date formatting utilities
│   ├── format.ts             # Data formatting helpers
│   └── validation.ts         # Input validation
├── hooks/
│   ├── useFeedback.ts        # Feedback data hook
│   ├── useAnalytics.ts       # Analytics hook
│   └── useSubscription.ts    # Subscription hook
└── api/
    ├── feedback.ts           # Feedback API calls
    └── analytics.ts          # Analytics API calls

types/
├── index.ts                  # Core types
├── api.ts                    # API-related types
└── components.ts             # Component prop types
```

## Naming Conventions

### Directories
- Use lowercase with hyphens for route directories: `sign-in`, `user-settings`
- Use camelCase for utility directories: `lib`, `components`, `types`
- Use route groups with parentheses: `(auth)`, `(dashboard)`

### Files
- **Pages**: `page.tsx` (Next.js convention)
- **Layouts**: `layout.tsx` (Next.js convention)
- **Components**: `PascalCase.tsx` - `FeedbackCard.tsx`
- **Utilities**: `camelCase.ts` - `formatDate.ts`
- **API Routes**: `route.ts` (Next.js convention)
- **Types**: `camelCase.ts` or `index.ts`

## Import Paths

Use absolute imports with the `@/` alias:

```typescript
// Good
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Feedback } from "@/types"

// Avoid
import { Button } from "../../components/ui/button"
import { cn } from "../../../lib/utils"
```

## File Size Guidelines

Keep files focused and manageable:
- **Components**: < 200 lines (split into smaller components if larger)
- **Utilities**: < 100 lines per function file
- **API Routes**: < 150 lines (extract logic to lib/ if needed)
- **Pages**: < 300 lines (extract sections to components)

## Code Organization Tips

1. **Group related functionality** together in directories
2. **Extract reusable logic** into lib/ utilities
3. **Create custom hooks** for complex state management
4. **Keep components small** and single-purpose
5. **Separate concerns** (presentation vs. logic)
6. **Use barrel exports** (index.ts) for cleaner imports
7. **Document complex logic** with comments
8. **Type everything** with TypeScript

---

This structure is designed to scale from MVP to production while maintaining clean organization and developer experience.

