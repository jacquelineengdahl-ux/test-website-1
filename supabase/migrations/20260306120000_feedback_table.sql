-- Feedback table for test user input
create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  category text,
  message text not null,
  page text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.feedback enable row level security;

-- Users can insert their own feedback
create policy "Users can insert own feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

-- Users can read their own feedback
create policy "Users can read own feedback"
  on public.feedback for select
  using (auth.uid() = user_id);
