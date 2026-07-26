create table public.bonus_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  vimeo_id text not null,
  display_order int not null unique,
  created_at timestamptz not null default now()
);

grant select on public.bonus_videos to authenticated;
grant all on public.bonus_videos to service_role;

alter table public.bonus_videos enable row level security;

create policy "bonus_videos_select_authenticated"
  on public.bonus_videos for select
  to authenticated
  using (true);

create policy "bonus_videos_admin_all"
  on public.bonus_videos for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

insert into public.bonus_videos (title, vimeo_id, display_order) values
('Start Here', '1138899196', 1),
('Gift', '1138899171', 2),
('Triple Earning System', '1138899145', 3),
('Activation Phase', '1138899126', 4),
('How to Earn', '1138899061', 5),
('How to Increase', '1138899103', 6),
('How to Redeem', '1138899036', 7),
('Activation Phase 2', '1138898985', 8),
('How to Earn & Redeem', '1138899002', 9),
('How to Increase 2', '1138898958', 10),
('How to Redeem 2', '1138898872', 11);