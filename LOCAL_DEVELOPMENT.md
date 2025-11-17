# Local Development Guide

This guide will help you set up and run TagMyExpenses locally for development.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **pnpm** (v8 or higher) - Install with `npm install -g pnpm`
3. **Docker Desktop** or compatible container runtime (for Supabase local development)
   - Docker Desktop: https://www.docker.com/products/docker-desktop
   - Alternative: Rancher Desktop, Podman, or OrbStack (macOS)

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up Supabase locally:**
   ```bash
   # Install Supabase CLI globally
   npm install supabase --save-dev
   
   # Or use npx
   npx supabase init
   npx supabase start
   ```

3. **Run database migrations:**
   ```bash
   # The schema is in supabase/schema.sql
   # Apply it to your local Supabase instance
   npx supabase db reset
   ```

4. **Set up environment variables:**
   - Copy `.env.example` files and fill in values (see below)

5. **Start development servers:**
   ```bash
   # Start both frontend and backend
   pnpm dev
   
   # Or start individually:
   pnpm dev:web   # Frontend on http://localhost:5173
   pnpm dev:api   # Backend on http://localhost:3000
   ```

## Detailed Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Supabase Locally

Following the [Supabase Local Development Guide](https://supabase.com/docs/guides/local-development):

#### Install Supabase CLI

```bash
# Using npm
npm install -g supabase

# Or using pnpm
pnpm add -D supabase

# Or using Homebrew (macOS)
brew install supabase/tap/supabase
```

#### Initialize Supabase

```bash
# Initialize Supabase in your project (if not already done)
npx supabase init
```

This creates a `supabase/` directory with configuration files.

#### Start Local Supabase Stack

```bash
npx supabase start
```

This command:
- Downloads and starts all necessary Docker containers
- Sets up PostgreSQL database
- Starts Auth, Storage, and other Supabase services
- Shows you connection credentials

**Important:** After starting, you'll see output like:
```
API URL: http://localhost:54321
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Save these credentials - you'll need them for environment variables!

#### Apply Database Schema

1. Open the Supabase Studio (usually at http://localhost:54323)
2. Go to SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Execute the SQL

Alternatively, use the CLI:
```bash
# If you have migrations set up
npx supabase db reset

# Or apply schema directly
psql postgresql://postgres:postgres@localhost:54322/postgres < supabase/schema.sql
```

#### Stop Supabase

When you're done developing:
```bash
npx supabase stop
```

To start again:
```bash
npx supabase start
```

### 3. Environment Variables

#### Frontend (`apps/web/.env.local`)

Create `apps/web/.env.local`:

```env
# Supabase (from local instance)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_anon_key_from_supabase_start

# API URL
VITE_API_URL=http://localhost:3000
```

#### Backend (`apps/api/.env.local`)

Create `apps/api/.env.local`:

```env
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Supabase (from local instance)
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_supabase_start
```

**Getting the keys:**
- After running `npx supabase start`, the keys are displayed in the terminal
- You can also find them in `supabase/.env` or by running `npx supabase status`

### 4. Start Development Servers

#### Option 1: Run Both (Recommended)

```bash
pnpm dev
```

This runs both frontend and backend in parallel using Turborepo.

#### Option 2: Run Individually

**Terminal 1 - Frontend:**
```bash
pnpm dev:web
```
Frontend will be available at http://localhost:5173

**Terminal 2 - Backend:**
```bash
pnpm dev:api
```
Backend API will be available at http://localhost:3000

### 5. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Supabase Studio:** http://localhost:54323
- **API Health Check:** http://localhost:3000/health

## Development Workflow

### Making Changes

1. **Frontend changes** (`apps/web/`):
   - Hot reload is enabled with Vite
   - Changes will automatically refresh in the browser

2. **Backend changes** (`apps/api/`):
   - Uses `tsx watch` for hot reload
   - Server will automatically restart on file changes

3. **Package changes** (`packages/`):
   - Changes to shared packages require a rebuild
   - Turborepo handles dependencies automatically

### Database Changes

1. **Create a migration:**
   ```bash
   npx supabase migration new your_migration_name
   ```

2. **Apply migrations:**
   ```bash
   npx supabase db reset
   ```

3. **Or manually apply:**
   - Use Supabase Studio SQL Editor
   - Copy your SQL and execute

### Testing

```bash
# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Build everything
pnpm build
```

## Troubleshooting

### Supabase Not Starting

1. **Check Docker is running:**
   ```bash
   docker ps
   ```

2. **Check if ports are in use:**
   - Supabase uses ports 54321, 54322, 54323
   - Make sure nothing else is using these ports

3. **Reset Supabase:**
   ```bash
   npx supabase stop
   npx supabase start
   ```

### Database Connection Issues

1. **Verify Supabase is running:**
   ```bash
   npx supabase status
   ```

2. **Check environment variables:**
   - Make sure `SUPABASE_URL` points to `http://localhost:54321`
   - Verify keys match what `supabase start` displayed

3. **Check RLS policies:**
   - Make sure you've applied the schema from `supabase/schema.sql`
   - Verify RLS policies are enabled

### Port Already in Use

If port 3000 or 5173 is already in use:

1. **Backend:** Set `PORT=3001` in `apps/api/.env.local`
2. **Frontend:** Vite will automatically use the next available port
   - Or set in `apps/web/vite.config.ts`

### Authentication Issues

1. **Verify Supabase Auth is configured:**
   - Check Supabase Studio → Authentication → Providers
   - Email provider should be enabled by default

2. **Check Auth URL redirects:**
   - In local dev, OAuth might not work fully
   - Use email/password auth for local development

## Useful Commands

```bash
# View Supabase logs
npx supabase logs

# Reset database
npx supabase db reset

# Generate TypeScript types from database
npx supabase gen types typescript --local > apps/web/src/types/database.ts

# Stop all Supabase services
npx supabase stop

# View Supabase status
npx supabase status
```

## Additional Resources

- [Supabase Local Development Docs](https://supabase.com/docs/guides/local-development)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Turborepo Docs](https://turbo.build/repo/docs)

## Next Steps

Once local development is set up:

1. Create a test user account in Supabase Studio
2. Upload a test PDF statement
3. Verify transactions are parsed correctly
4. Test categorization and filtering

Happy coding! 🚀

