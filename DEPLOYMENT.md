# Deployment Guide

This guide covers deploying the TagMyExpenses monorepo to production.

## Prerequisites

- Supabase project (for database and auth)
- Vercel account (for frontend)
- Fly.io or similar (for backend API)

## 1. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Run the SQL schema from `supabase/schema.sql` in the SQL Editor
3. Configure authentication providers (Email, Google, GitHub)
4. Get your credentials:
   - Project URL
   - Anon key (public)
   - Service role key (secret - keep secure!)

## 2. Frontend Deployment (Vercel)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure build settings:
   - Framework Preset: Vite
   - Root Directory: `apps/web`
   - Build Command: `cd ../.. && pnpm build --filter=web`
   - Output Directory: `apps/web/dist`
   - Install Command: `pnpm install`
4. Add environment variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=https://your-api-url.fly.dev
   ```
5. Deploy!

## 3. Backend Deployment (Fly.io)

1. Install Fly.io CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Create a new app: `fly launch` (in `apps/api` directory)
4. Add environment variables:
   ```bash
   fly secrets set SUPABASE_URL=your_supabase_url
   fly secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   fly secrets set PORT=3000
   fly secrets set HOST=0.0.0.0
   fly secrets set NODE_ENV=production
   ```
5. Create `apps/api/fly.toml`:
   ```toml
   app = "tagmyexpenses-api"
   primary_region = "iad"

   [build]
     builder = "paketobuildpacks/builder:base"

   [[services]]
     internal_port = 3000
     protocol = "tcp"

     [[services.ports]]
       port = 80
       handlers = ["http"]
       force_https = true

     [[services.ports]]
       port = 443
       handlers = ["tls", "http"]

   [env]
     NODE_ENV = "production"
   ```
6. Deploy: `fly deploy`

**Note:** Express is more commonly used and easier to deploy. The backend uses Express instead of Fastify for better compatibility with deployment platforms.

## 4. Update CORS Settings

After deploying both frontend and backend:

1. Update backend CORS to allow your Vercel domain:
   - Edit `apps/api/src/index.ts`
   - Update `cors` middleware to include your Vercel URL:
   ```typescript
   app.use(cors({
     origin: [
       'https://your-app.vercel.app',
       'http://localhost:5173', // for local development
     ],
     credentials: true,
   }));
   ```

2. Redeploy backend

## 5. Update Supabase RLS Policies

Ensure your Supabase Row Level Security policies are properly configured. The schema.sql file includes the necessary policies, but verify them in the Supabase dashboard.

## Alternative: Deploy to Railway/Render

### Railway
1. Create a new Railway project
2. Add GitHub repository
3. Create two services:
   - Frontend: Point to `apps/web`, use Vite build
   - Backend: Point to `apps/api`, use Node.js
4. Add environment variables for each service

### Render
Similar process - create two services (web service and web service for API) and configure build commands accordingly.

## Local Development

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Create `.env.local` files:
   - `apps/web/.env.local`
   - `apps/api/.env.local`
4. Add your environment variables
5. Run migrations in Supabase (copy `supabase/schema.sql`)
6. Start dev servers: `pnpm dev`

