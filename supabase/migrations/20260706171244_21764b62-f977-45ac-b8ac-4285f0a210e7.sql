create table public.postback_logs (
  id uuid primary key default gen_random_uuid(),
  raw_params jsonb not null,
  success boolean not null,
  error text,
  resolved_email text,
  resolved_user_id uuid,
  created_at timestamptz not null default now()
);

grant select on public.postback_logs to authenticated;
grant all on public.postback_logs to service_role;

alter table public.postback_logs enable row level security;

create policy "postback_logs_select_admin_only"
  on public.postback_logs for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));