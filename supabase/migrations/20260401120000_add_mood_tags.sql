-- Add mood_tags column to symptom_logs for multi-select mood tracking
-- The existing mood column (integer 0-10) is kept for severity/chart compatibility
ALTER TABLE symptom_logs ADD COLUMN IF NOT EXISTS mood_tags text[] DEFAULT '{}';
