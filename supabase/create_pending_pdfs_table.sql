-- Quick fix: Create pending_pdfs table if it doesn't exist
-- Run this SQL in your Supabase SQL Editor if the table is missing

-- Pending PDFs table (for password-protected PDFs)
CREATE TABLE IF NOT EXISTS pending_pdfs (
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
CREATE INDEX IF NOT EXISTS idx_pending_pdfs_user_id ON pending_pdfs(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_pdfs_status ON pending_pdfs(status);
CREATE INDEX IF NOT EXISTS idx_pending_pdfs_created_at ON pending_pdfs(created_at DESC);

-- Create updated_at trigger for pending_pdfs (if function doesn't exist, it will be created by schema.sql)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  END IF;
END $$;

CREATE TRIGGER update_pending_pdfs_updated_at 
  BEFORE UPDATE ON pending_pdfs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for pending_pdfs
ALTER TABLE pending_pdfs ENABLE ROW LEVEL SECURITY;

-- RLS policies for pending_pdfs
CREATE POLICY IF NOT EXISTS "Users can view their own pending PDFs"
  ON pending_pdfs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own pending PDFs"
  ON pending_pdfs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own pending PDFs"
  ON pending_pdfs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own pending PDFs"
  ON pending_pdfs FOR DELETE
  USING (auth.uid() = user_id);

