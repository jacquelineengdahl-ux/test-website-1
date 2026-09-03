-- Baseline schema for the two core tables.
--
-- These tables were originally created through the Supabase dashboard and were
-- never captured in a migration, so the schema existed only inside the live
-- database. This file closes that gap: it is a capture of the schema as it
-- stood on 2026-09-03, taken from information_schema.
--
-- Dated ahead of the earliest existing migration (20260301135618) so that a
-- fresh restore runs this first. Every later migration uses
-- ADD COLUMN IF NOT EXISTS, so they become harmless no-ops against this
-- baseline. Running this file against the existing database is also a no-op.
--
-- Columns, types, nullability and defaults are exact. Primary keys, foreign
-- keys and ON DELETE behaviour are INFERRED from the standard Supabase pattern
-- and from application usage -- information_schema.columns does not expose
-- constraints. Verify against the live database before relying on this for a
-- real restore; see the note at the end of this file.

-- ---------------------------------------------------------------- profiles
-- One row per user. `id` is the auth.users id (no separate user_id column).
create table if not exists public.profiles (
  id                            uuid primary key references auth.users (id) on delete cascade,
  name                          text,
  date_of_birth                 date,
  pronouns                      text,
  country                       text,
  mobile_number                 text,
  avatar_url                    text,

  -- endometriosis background
  first_symptom_date            date,
  diagnosis_date                date,
  endo_stage                    text,

  -- treatment
  treatment_plan                text,
  supporting_treatment          text,
  treatment_goals               text[] default '{}'::text[],
  healthcare_providers          jsonb  default '[]'::jsonb,
  medical_events                jsonb  default '[]'::jsonb,

  -- hormonal treatment + pack tracking
  hormonal_treatment            text   default ''::text,
  hormonal_treatment_start_date date,
  current_pack_start_date       date,
  custom_pack_length            integer,
  noticed_side_effects          jsonb  default '[]'::jsonb,

  consented_at                  timestamp with time zone,
  created_at                    timestamp with time zone default now(),
  updated_at                    timestamp with time zone default now()
);

-- ------------------------------------------------------------ symptom_logs
-- One row per logged day. The application decides insert-vs-update by looking
-- up an existing row first, then writing by id -- there is deliberately NO
-- unique constraint on (user_id, log_date).
create table if not exists public.symptom_logs (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users (id) on delete cascade,
  log_date                date not null,

  -- pain, 0-10
  pelvic_pain             smallint,
  lower_back_pain         smallint,
  leg_pain                smallint,
  chest_pain              smallint,
  shoulder_pain           smallint,
  headache                smallint,
  bowel_urination_pain    smallint,  -- legacy, superseded by the two below
  bowel_pain              integer default 0,
  urination_pain          integer default 0,
  intercourse_pain        smallint,

  -- other symptoms
  bloating                smallint,
  nausea                  smallint,
  fatigue                 smallint,
  inflammation            smallint,
  diarrhea                smallint,
  constipation            smallint,

  -- mood
  mood                    smallint,          -- 0-10 severity, kept for charts
  mood_tags               text[] default '{}'::text[],

  -- cycle. No CHECK constraint: comma-separated values are allowed.
  cycle_phase             text,

  -- lifestyle / triggers
  stress                  smallint,
  sleep                   smallint,
  diet                    smallint,
  coffee                  smallint,
  alcohol                 smallint,
  smoking                 smallint,
  inactivity              smallint,
  overexertion            smallint,

  -- hormonal treatment context for the day
  pill_day                integer,
  pill_day_phase          text,
  side_effects_today      text,
  hormonal_treatment_note text,

  notes                   text,
  created_at              timestamp with time zone default now()
);

-- NOT CAPTURED HERE: row level security.
--
-- RLS policies for these two tables were also created in the dashboard and are
-- still not in version control. They are what stops one user reading another
-- user's health data, so they matter more than the table definitions above.
-- Capture them next.
