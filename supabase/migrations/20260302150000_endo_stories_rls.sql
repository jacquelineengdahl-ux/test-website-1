-- Create endo_stories table
CREATE TABLE endo_stories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  content text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE endo_stories ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own story
CREATE POLICY "Users can read own story"
  ON endo_stories FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own story
CREATE POLICY "Users can insert own story"
  ON endo_stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own story
CREATE POLICY "Users can update own story"
  ON endo_stories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own story
CREATE POLICY "Users can delete own story"
  ON endo_stories FOR DELETE
  USING (auth.uid() = user_id);
