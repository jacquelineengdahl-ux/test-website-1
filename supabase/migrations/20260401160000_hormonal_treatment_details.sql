-- Add treatment start date to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hormonal_treatment_start_date date;

-- Add hormonal treatment note to symptom logs (one-off observations)
ALTER TABLE symptom_logs ADD COLUMN IF NOT EXISTS hormonal_treatment_note text;
