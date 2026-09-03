-- Row level security for the two core tables.
--
-- Like the tables themselves, these policies were created in the Supabase
-- dashboard and were never in version control. Captured 2026-09-03 from
-- pg_policies. These are what stop one user reading another user's health
-- data, so they matter more than the table definitions.
--
-- Runs immediately after 20260301000000_baseline_core_tables.sql. Safe to run
-- against the existing database: each policy is dropped and recreated with
-- identical logic.
--
-- NOTE ON DUPLICATES: the live database currently carries two redundant extra
-- policies on `profiles` -- profiles_select_own and profiles_update_own --
-- which duplicate "Users can read own profile" and "Users can update own
-- profile" exactly. Postgres ORs permissive policies together, so they change
-- nothing, but they are leftovers from two rounds of policy creation. This
-- file defines the canonical set only; see the optional cleanup at the end.

alter table public.profiles      enable row level security;
alter table public.symptom_logs  enable row level security;

-- ---------------------------------------------------------------- profiles
-- `id` IS the auth.users id on this table, hence `id = auth.uid()`
-- rather than the user_id pattern used elsewhere.

drop policy if exists "Users can read own profile"   on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (id = auth.uid());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete
  using (id = auth.uid());

-- ------------------------------------------------------------ symptom_logs

drop policy if exists logs_select_own on public.symptom_logs;
create policy logs_select_own
  on public.symptom_logs for select
  using (auth.uid() = user_id);

drop policy if exists logs_insert_own on public.symptom_logs;
create policy logs_insert_own
  on public.symptom_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists logs_update_own on public.symptom_logs;
create policy logs_update_own
  on public.symptom_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists logs_delete_own on public.symptom_logs;
create policy logs_delete_own
  on public.symptom_logs for delete
  using (auth.uid() = user_id);

-- OPTIONAL CLEANUP -- not run automatically. Uncomment and run once against
-- the live database to remove the redundant duplicate policies described
-- above. Behaviour is identical with or without them.
--
-- drop policy if exists profiles_select_own on public.profiles;
-- drop policy if exists profiles_update_own on public.profiles;

-- ONE COSMETIC DIFFERENCE FROM LIVE: the live `logs_update_own` and
-- `profiles_update_own` policies have a USING clause but no WITH CHECK. That
-- is NOT a security gap -- Postgres uses the USING expression as the check
-- when WITH CHECK is absent, so the behaviour is identical. The explicit
-- WITH CHECK written above is for readability only; it makes the intent
-- obvious rather than relying on a fallback rule.
