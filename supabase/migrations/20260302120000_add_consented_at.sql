-- Add consented_at timestamp to track when users gave GDPR consent
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consented_at timestamptz;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
