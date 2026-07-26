alter table public.payment_methods enable row level security;

drop policy if exists "Users can view own payment methods" on public.payment_methods;
drop policy if exists "Users can insert own payment methods" on public.payment_methods;
drop policy if exists "Users can update own payment methods" on public.payment_methods;
drop policy if exists "Users can delete own payment methods" on public.payment_methods;

create policy "Users can view own payment methods"
  on public.payment_methods for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = payment_methods.profile_id
        and profiles.email = auth.email()
    )
  );

create policy "Users can insert own payment methods"
  on public.payment_methods for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = payment_methods.profile_id
        and profiles.email = auth.email()
    )
  );

create policy "Users can update own payment methods"
  on public.payment_methods for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = payment_methods.profile_id
        and profiles.email = auth.email()
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = payment_methods.profile_id
        and profiles.email = auth.email()
    )
  );

create policy "Users can delete own payment methods"
  on public.payment_methods for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = payment_methods.profile_id
        and profiles.email = auth.email()
    )
  );
