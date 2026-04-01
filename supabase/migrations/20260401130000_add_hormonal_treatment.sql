-- Add hormonal_treatment column to profiles for tracking current hormonal treatment type
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hormonal_treatment text DEFAULT '';
