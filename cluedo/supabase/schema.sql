-- ============================================================
-- CLUEDO: Manor of Shadows — Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database
-- ============================================================

-- Enable UUID extension (usually already enabled on Supabase)
create extension if not exists "uuid-ossp";

-- ── games table ────────────────────────────────────────────────
-- Stores the entire game state as JSONB for simplicity.
-- This gives us schema flexibility and easy realtime sync.
create table if not exists public.games (
  id          text        primary key,          -- short room code e.g. "ABC123"
  state       jsonb       not null,             -- full GameState object
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for listing recent lobby games quickly
create index if not exists games_created_at_idx on public.games (created_at desc);
create index if not exists games_status_idx     on public.games ((state->>'status'));

-- ── Row Level Security ─────────────────────────────────────────
alter table public.games enable row level security;

-- Anyone can read a game (needed for joining and syncing)
create policy "Public read access"
  on public.games for select
  using (true);

-- Anyone can create a game (anonymous players)
create policy "Public insert access"
  on public.games for insert
  with check (true);

-- Anyone can update a game they are in
-- (In production you would validate the player token)
create policy "Public update access"
  on public.games for update
  using (true);

-- ── Realtime ───────────────────────────────────────────────────
-- Enable realtime for the games table so clients get push updates
alter publication supabase_realtime add table public.games;

-- ── Cleanup function ───────────────────────────────────────────
-- Auto-delete games older than 24 hours (optional, run as cron)
create or replace function public.cleanup_old_games()
returns void language plpgsql as $$
begin
  delete from public.games
  where created_at < now() - interval '24 hours';
end;
$$;

-- ── Helpful views ──────────────────────────────────────────────
create or replace view public.open_lobbies as
  select
    id,
    state->>'status'                          as status,
    jsonb_array_length(state->'players')      as player_count,
    state->>'hostId'                          as host_id,
    created_at
  from public.games
  where state->>'status' = 'lobby'
  order by created_at desc
  limit 50;
