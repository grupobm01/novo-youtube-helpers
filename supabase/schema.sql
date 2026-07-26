-- YouTube Rewards Schema
-- Run this in your Supabase SQL Editor

create extension if not exists pgcrypto;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  username text,
  avatar_initial text default 'U',
  avatar_color text default 'rgb(21, 101, 192)',
  balance numeric(10,2) not null default 280.00,
  in_transit numeric(10,2) not null default 0.00,
  total_paid_out numeric(10,2) not null default 0.00,
  completed_videos integer not null default 0,
  member_since text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reward History
create table if not exists public.reward_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  amount numeric(10,2) not null default 40.00,
  date_label text,
  video_id text,
  created_at timestamptz not null default now(),
  unique (profile_id, video_id)
);

-- Withdraw History
create table if not exists public.withdraw_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(10,2) not null default 0.00,
  status text not null default 'processing',
  date_label text,
  created_at timestamptz not null default now()
);

-- Video Progress
create table if not exists public.video_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  video_id text not null,
  is_unlocked boolean not null default true,
  unlock_days_remaining integer default 21,
  watched boolean not null default false,
  rewarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.reward_history enable row level security;
alter table public.withdraw_history enable row level security;
alter table public.video_progress enable row level security;

-- RLS Policies: profiles
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- RLS Policies: reward_history
create policy "Users can view own rewards"
  on public.reward_history for select
  to authenticated
  using (profile_id = auth.uid());

create policy "Users can insert own rewards"
  on public.reward_history for insert
  to authenticated
  with check (profile_id = auth.uid());

-- RLS Policies: withdraw_history
create policy "Users can view own withdrawals"
  on public.withdraw_history for select
  to authenticated
  using (profile_id = auth.uid());

create policy "Users can insert own withdrawals"
  on public.withdraw_history for insert
  to authenticated
  with check (profile_id = auth.uid());

-- Video Likes
create table if not exists public.video_likes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  video_id text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, video_id)
);

alter table public.video_likes enable row level security;

-- RLS Policies: video_likes
create policy "Users can view own likes"
  on public.video_likes for select
  to authenticated
  using (profile_id = auth.uid());

create policy "Users can insert own likes"
  on public.video_likes for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "Users can delete own likes"
  on public.video_likes for delete
  to authenticated
  using (profile_id = auth.uid());

-- RLS Policies: video_progress
create policy "Users can view own video progress"
  on public.video_progress for select
  to authenticated
  using (profile_id = auth.uid());

create policy "Users can insert own video progress"
  on public.video_progress for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "Users can update own video progress"
  on public.video_progress for update
  to authenticated
  using (profile_id = auth.uid());

