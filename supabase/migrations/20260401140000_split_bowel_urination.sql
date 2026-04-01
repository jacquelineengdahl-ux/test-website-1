-- Split bowel_urination_pain into separate columns
ALTER TABLE symptom_logs ADD COLUMN IF NOT EXISTS bowel_pain integer DEFAULT 0;
ALTER TABLE symptom_logs ADD COLUMN IF NOT EXISTS urination_pain integer DEFAULT 0;

-- Copy existing data to both new columns so history is preserved
UPDATE symptom_logs SET bowel_pain = bowel_urination_pain, urination_pain = bowel_urination_pain WHERE bowel_urination_pain > 0;
