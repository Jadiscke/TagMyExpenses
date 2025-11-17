-- Seed file for local development
-- This file is executed after the schema is applied
-- Add any test data or initial data here

-- Create test user: test@example with password 123456
-- Note: This uses Supabase's crypt extension to hash the password
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Generate a UUID for the test user
  test_user_id := gen_random_uuid();
  
  -- Insert the user into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    test_user_id,
    'authenticated',
    'authenticated',
    'test@example.com',
    crypt('123456', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert into auth.identities for email provider
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    test_user_id,
    'test@example',
    format('{"sub":"%s","email":"%s"}', test_user_id::text, 'test@example')::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;
END $$;

