# TagMyExpenses

A full-stack expense tracking application built with Turborepo, React, Node.js, and Supabase.

## Tech Stack

- **Monorepo**: Turborepo + pnpm
- **Frontend**: Vite + React + TypeScript + TailwindCSS
- **Backend**: Express + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth

## Structure

```
.
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Express backend
├── packages/
│   ├── ui/           # Shared React components
│   ├── utils/        # Shared utilities (PDF parsing, categorization)
│   ├── tsconfig/     # Shared TypeScript configs
│   └── eslint-config/ # Shared ESLint config
```

## Getting Started

For detailed local development setup, see [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md).

### Quick Start

1. **Prerequisites:**
   - Node.js (v18+)
   - pnpm (v8+)
   - Docker Desktop (for local Supabase)

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up Supabase locally:**
   ```bash
   # Install Supabase CLI (if not already installed)
   npm install -g supabase
   
   # Start local Supabase stack
   npx supabase init
   npx supabase start
   ```

4. **Apply database schema:**
   - Open Supabase Studio at http://localhost:54323
   - Go to SQL Editor and run `supabase/schema.sql`

5. **Set up environment variables:**
   - Create `apps/web/.env.local` with Supabase credentials from `supabase start` output
   - Create `apps/api/.env.local` with Supabase credentials

6. **Run development servers:**
   ```bash
   pnpm dev
   ```
   
   Or run individually:
   ```bash
   pnpm dev:web  # Frontend on http://localhost:5173
   pnpm dev:api  # Backend on http://localhost:3000
   ```

See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for complete setup instructions.

## Scripts

- `pnpm dev` - Run all apps in development mode
- `pnpm build` - Build all apps and packages
- `pnpm lint` - Lint all packages
- `pnpm typecheck` - Type check all packages

## Features

- 📄 PDF statement parsing (C6 Bank)
- 🏷️ Automatic expense categorization
- 📊 Transaction dashboard
- 🔍 Search and filter transactions
- 🎨 Modern UI with TailwindCSS and Shadcn UI
