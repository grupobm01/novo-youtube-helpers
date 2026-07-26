alter table public.profiles add column first_login_at timestamptz;

create or replace function public.handle_first_login()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.last_sign_in_at is null and new.last_sign_in_at is not null then
    update public.profiles
    set first_login_at = new.last_sign_in_at
    where id = new.id
      and first_login_at is null;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_first_login
  after update on auth.users
  for each row
  execute function public.handle_first_login();

create table public.reminder_email_steps (
  id uuid primary key default gen_random_uuid(),
  step_order int not null unique,
  delay_hours numeric not null,
  subject text not null,
  body_html text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.reminder_email_steps to authenticated;
grant all on public.reminder_email_steps to service_role;

alter table public.reminder_email_steps enable row level security;

create policy "reminder_email_steps_admin_all"
  on public.reminder_email_steps for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create table public.reminder_email_log (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  step_id uuid not null references public.reminder_email_steps(id) on delete cascade,
  sent_at timestamptz not null default now(),
  unique (profile_id, step_id)
);

grant select on public.reminder_email_log to authenticated;
grant all on public.reminder_email_log to service_role;

alter table public.reminder_email_log enable row level security;

create policy "reminder_email_log_admin_select"
  on public.reminder_email_log for select
  using (public.has_role(auth.uid(), 'admin'));