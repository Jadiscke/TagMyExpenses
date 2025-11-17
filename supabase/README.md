# Supabase Setup

This directory contains the database schema for TagMyExpenses.

## Setup Instructions

1. Create a new Supabase project at https://supabase.com

2. Run the SQL schema:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `schema.sql`
   - Execute the SQL

3. Configure authentication:
   - Go to Authentication > Providers in your Supabase dashboard
   - Enable Email provider (enabled by default)
   - Optionally enable Google and GitHub OAuth providers

4. Get your credentials:
   - Go to Settings > API
   - Copy your `Project URL` (for `VITE_SUPABASE_URL` and `SUPABASE_URL`)
   - Copy your `anon` `public` key (for `VITE_SUPABASE_ANON_KEY`)
   - Copy your `service_role` `secret` key (for `SUPABASE_SERVICE_ROLE_KEY` - keep this secure!)

5. Update environment variables:
   - In `apps/web/.env.local`: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - In `apps/api/.env.local`: Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

## Database Schema

### Tables

#### `transactions`
Stores parsed transaction data from PDF statements.

- `id`: UUID primary key
- `user_id`: References auth.users(id)
- `date`: Transaction date
- `merchant`: Original merchant name from statement
- `normalized_merchant`: Normalized merchant name
- `amount`: Transaction amount (numeric)
- `currency`: Currency code (default: BRL)
- `raw_description`: Raw description from PDF
- `category`: Categorized expense category
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Security

Row Level Security (RLS) is enabled:
- Users can only view their own transactions
- Users can only insert/update/delete their own transactions

