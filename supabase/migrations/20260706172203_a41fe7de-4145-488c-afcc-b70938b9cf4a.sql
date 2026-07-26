create table public.postback_field_mappings (
  target_field text primary key,
  source_param text not null,
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.postback_field_mappings to authenticated;
grant all on public.postback_field_mappings to service_role;

alter table public.postback_field_mappings enable row level security;

create policy "postback_field_mappings_admin_read"
  on public.postback_field_mappings for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "postback_field_mappings_admin_write"
  on public.postback_field_mappings for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

insert into public.postback_field_mappings (target_field, source_param) values
  ('email', 'email'),
  ('first_name', 'first_name'),
  ('last_name', 'last_name'),
  ('order_id', 'order_id')
on conflict (target_field) do nothing;