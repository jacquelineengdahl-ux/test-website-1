-- Migrate medical events and pack tracking from localStorage to DB
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS medical_events jsonb DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_pack_start_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_pack_length integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS noticed_side_effects jsonb DEFAULT '[]';
