# AI Customer Feedback Analyzer

A modern Next.js application for analyzing customer feedback using AI-powered sentiment analysis. Built with TypeScript, Tailwind CSS, and the latest web technologies.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm, yarn, or pnpm package manager

### Installation

1. Clone the repository and navigate to the project directory:

```bash
cd ai-customer-feedback-analyzer
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your API keys and configuration values.

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Authentication:** Clerk
- **Database:** Supabase
- **AI/ML:** LangChain + OpenAI
- **Payments:** Stripe
- **Charts:** Recharts
- **CSV Parsing:** PapaParse

## 📁 Project Structure

```
ai-customer-feedback-analyzer/
├── app/                    # Next.js App Router pages and layouts
│   ├── layout.tsx         # Root layout with header/footer
│   └── page.tsx           # Home page
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
│   └── utils.ts          # Helper utilities (cn function, etc.)
├── styles/               # Global styles
│   └── globals.css       # Tailwind base styles and CSS variables
├── scripts/              # Build and utility scripts
├── public/               # Static assets
├── .env.local.example    # Environment variables template
├── next.config.js        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production-ready application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check code quality

## 🎨 Features

- **CSV Upload**: Upload customer feedback in CSV format
- **AI Sentiment Analysis**: Automatic sentiment detection using OpenAI
- **Visual Insights**: Interactive charts and dashboards
- **Secure Authentication**: User management with Clerk
- **Scalable Storage**: Feedback data stored in Supabase
- **Export Reports**: Download comprehensive analysis reports
- **Responsive Design**: Mobile-first UI with Tailwind CSS

## 🔐 Environment Variables

Required environment variables (see `.env.local.example`):

- **Clerk**: Authentication keys
- **Supabase**: Database connection
- **OpenAI**: AI model access
- **Stripe**: Payment processing

## 📝 Development Notes

- This project uses **TypeScript** for type safety
- **App Router** pattern for better performance and DX
- **Server Components** by default for optimal bundle size
- All components are documented with JSDoc comments
- Follows Next.js and React best practices

## 🚧 Next Steps

1. Set up Clerk authentication routes (`/sign-in`, `/sign-up`)
2. Create Supabase database schema for feedback storage
3. Implement CSV upload and parsing functionality
4. Build AI analysis pipeline with LangChain/OpenAI
5. Create dashboard with Recharts visualizations
6. Add Stripe subscription tiers
7. Implement export functionality

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Clerk Authentication](https://clerk.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [LangChain](https://js.langchain.com/docs)

## 📄 License

MIT License - Feel free to use this project for your own purposes.

---

**Ready for Cursor iteration** - All files are modular, commented, and structured for easy AI-assisted development.

