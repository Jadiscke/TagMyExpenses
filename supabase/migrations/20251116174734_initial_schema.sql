-- Users table (managed by Supabase Auth, but we'll create a reference table if needed)
-- The auth.users table is automatically created by Supabase

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  merchant TEXT NOT NULL,
  normalized_merchant TEXT,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  raw_description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own transactions
CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own transactions
CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Pending PDFs table (for password-protected PDFs)
CREATE TABLE IF NOT EXISTS public.pending_pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase storage
  password TEXT, -- Encrypted or plain password (stored after user provides it)
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for pending PDFs
CREATE INDEX IF NOT EXISTS idx_pending_pdfs_user_id ON public.pending_pdfs(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_pdfs_status ON public.pending_pdfs(status);
CREATE INDEX IF NOT EXISTS idx_pending_pdfs_created_at ON public.pending_pdfs(created_at DESC);

-- Create updated_at trigger for pending_pdfs
CREATE TRIGGER update_pending_pdfs_updated_at 
  BEFORE UPDATE ON public.pending_pdfs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for pending_pdfs
ALTER TABLE public.pending_pdfs ENABLE ROW LEVEL SECURITY;

-- RLS policies for pending_pdfs
CREATE POLICY "Users can view their own pending PDFs"
  ON public.pending_pdfs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pending PDFs"
  ON public.pending_pdfs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending PDFs"
  ON public.pending_pdfs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pending PDFs"
  ON public.pending_pdfs FOR DELETE
  USING (auth.uid() = user_id);

