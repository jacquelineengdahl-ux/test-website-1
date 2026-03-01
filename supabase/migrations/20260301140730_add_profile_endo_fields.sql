-- Add new profile fields for personal info and endometriosis sections
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mobile_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS treatment_plan text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS healthcare_providers jsonb DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS treatment_goals text[] DEFAULT '{}';
