# Living with Endo

## Overview
Endometriosis symptom tracker. Next.js 16 (App Router) + Supabase + Tailwind CSS 4 + Recharts.

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build (always run before deploying)
- Deploy: push to `main` branch triggers Vercel auto-deploy

## Supabase
- Project ref: `wuesyvcawhjvcwmdyplq`
- Client: singleton in `lib/supabase.ts`
- Auth: email/password + Google OAuth
- After adding DB columns, run `NOTIFY pgrst, 'reload schema';` in SQL Editor

## Key Pages
- `app/profile/page.tsx` — profile with sectioned layout (photo, Personal Info, Endometriosis, My Letter)
- `app/dashboard/page.tsx` — main dashboard
- `app/dashboard/log/page.tsx` — daily symptom logging
- `app/dashboard/summary/page.tsx` — summary stats
- `app/dashboard/history/page.tsx` — history view
- `app/login/page.tsx` / `app/signup/page.tsx` — auth pages

## Design Conventions
- Warm editorial aesthetic with serif headings (`font-serif`)
- Colors: `bg-background`, `text-foreground`, `text-muted`, `bg-surface`, `border-border`, `bg-accent-green`
- Cards: `rounded-xl border border-border bg-surface p-6 shadow-sm`
- Inner cards: `rounded-lg border border-border bg-background px-4 py-3`
- View rows: label left (`text-muted`), value right (`font-medium text-foreground`) using `flex justify-between`
- Icons: inline SVGs in `text-accent-green`
- Buttons: `rounded-md`, green primary (`bg-accent-green text-white`), outlined secondary (`border border-border`)
- Mobile-first: use `flex-col sm:flex-row` for button groups

## Profiles Table Columns
name, date_of_birth, country, avatar_url, mobile_number, first_symptom_date, diagnosis_date, endo_stage, treatment_plan, supporting_treatment, healthcare_providers (jsonb), treatment_goals (text[])

## Rules
- Always `npm run build` before pushing to verify no errors
- When adding new Supabase columns: create migration file in `supabase/migrations/`, user runs SQL manually in dashboard
- PDF generation uses Helvetica with aggressive Unicode sanitization (no non-ASCII characters)
- Letter email uses Web Share API with PDF attachment (fallback: download + mailto)
