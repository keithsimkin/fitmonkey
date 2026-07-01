-- Workout PWA — cloud sync schema.
-- Run this once in the Supabase dashboard → SQL Editor.
--
-- Model: one JSON document per user holding the entire local app-state blob
-- (the same shape Zustand's persist middleware writes to localStorage).
-- Sync is last-write-wins by `updated_at`. Row-level security ensures a user
-- can only ever read or write their own row.

create table if not exists public.user_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

-- Drop-and-recreate so this script is idempotent.
drop policy if exists "user_state select own" on public.user_state;
drop policy if exists "user_state insert own" on public.user_state;
drop policy if exists "user_state update own" on public.user_state;

create policy "user_state select own"
  on public.user_state for select
  using (auth.uid() = user_id);

create policy "user_state insert own"
  on public.user_state for insert
  with check (auth.uid() = user_id);

create policy "user_state update own"
  on public.user_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- After running this:
-- 1. Authentication → Providers → Email: make sure it's enabled.
-- 2. Authentication → URL Configuration:
--      Site URL       = your deployed origin (or http://localhost:5173 for dev)
--      Redirect URLs  = add http://localhost:5173 and your production origin
--    These must match window.location.origin or the magic link won't return.
-- ---------------------------------------------------------------------------
