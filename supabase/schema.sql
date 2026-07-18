-- ─────────────────────────────────────────────
-- Moment — סכמה ל-Supabase
-- להריץ ב: Supabase → SQL Editor → New query → Run
-- ─────────────────────────────────────────────

create extension if not exists "pgcrypto";

create table if not exists public.captures (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  taken_at    timestamptz not null,
  author      text not null,
  image_path  text,
  audio_path  text,
  transcript  text default '',
  note        text default '',
  lat         double precision,
  lng         double precision,
  place_name  text,
  tags        text[] default '{}',
  trip_day    int
);

create index if not exists captures_taken_at_idx on public.captures (taken_at);

-- הרשאות: המשפחה בלבד, ללא התחברות. הגישה מוגנת בכתובת סודית.
alter table public.captures enable row level security;

drop policy if exists "family read"   on public.captures;
drop policy if exists "family write"  on public.captures;
drop policy if exists "family update" on public.captures;
drop policy if exists "family delete" on public.captures;

create policy "family read"   on public.captures for select using (true);
create policy "family write"  on public.captures for insert with check (true);
create policy "family update" on public.captures for update using (true) with check (true);
create policy "family delete" on public.captures for delete using (true);

-- סנכרון חי בין המכשירים
alter publication supabase_realtime add table public.captures;

-- ─────────────────────────────────────────────
-- אחסון: יצירת דלי בשם moments
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('moments', 'moments', true)
on conflict (id) do nothing;

drop policy if exists "moments read"   on storage.objects;
drop policy if exists "moments write"  on storage.objects;
drop policy if exists "moments update" on storage.objects;
drop policy if exists "moments delete" on storage.objects;

create policy "moments read"   on storage.objects for select using (bucket_id = 'moments');
create policy "moments write"  on storage.objects for insert with check (bucket_id = 'moments');
create policy "moments update" on storage.objects for update using (bucket_id = 'moments');
create policy "moments delete" on storage.objects for delete using (bucket_id = 'moments');
