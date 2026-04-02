-- Add pill day tracking to symptom logs
ALTER TABLE symptom_logs ADD COLUMN IF NOT EXISTS pill_day integer;
ALTER TABLE symptom_logs ADD COLUMN IF NOT EXISTS pill_day_phase text;
