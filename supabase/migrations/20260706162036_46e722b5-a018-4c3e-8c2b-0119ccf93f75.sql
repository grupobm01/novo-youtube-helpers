
create extension if not exists "pgcrypto";

-- Private schema for encryption key (not exposed via Data API)
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.app_secrets (
  key text primary key,
  value text not null
);
revoke all on private.app_secrets from public, anon, authenticated;

insert into private.app_secrets (key, value)
values ('encryption_key', 'Esclarecendo2023!')
on conflict (key) do nothing;

-- Internal helper to fetch the encryption key
create or replace function private.encryption_key()
returns text
language sql
stable
security definer
set search_path = private
as $$
  select value from private.app_secrets where key = 'encryption_key'
$$;
revoke all on function private.encryption_key() from public, anon, authenticated;

-- Add new encrypted columns
alter table public.payment_methods
  add column if not exists account_number_encrypted bytea,
  add column if not exists account_number_last4 text,
  add column if not exists routing_number_encrypted bytea,
  add column if not exists routing_number_last4 text;

-- Migrate existing plaintext data (if present)
update public.payment_methods
set
  account_number_encrypted = pgp_sym_encrypt(account_number, private.encryption_key()),
  account_number_last4 = right(account_number, 4),
  routing_number_encrypted = pgp_sym_encrypt(routing_number, private.encryption_key()),
  routing_number_last4 = right(routing_number, 4)
where account_number is not null
  and account_number_encrypted is null;

-- Drop old plaintext columns
alter table public.payment_methods
  drop column if exists account_number,
  drop column if exists routing_number;

-- Enforce NOT NULL on new columns
alter table public.payment_methods
  alter column account_number_encrypted set not null,
  alter column account_number_last4 set not null,
  alter column routing_number_encrypted set not null,
  alter column routing_number_last4 set not null;

-- Save (upsert) function
create or replace function public.save_payment_method(
  p_profile_id uuid,
  p_first_name text,
  p_last_name text,
  p_bank_name text,
  p_account_number text,
  p_routing_number text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_key text;
begin
  if p_profile_id <> auth.uid() then
    raise exception 'not authorized';
  end if;

  v_key := private.encryption_key();

  insert into public.payment_methods (
    profile_id, first_name, last_name, bank_name,
    account_number_encrypted, account_number_last4,
    routing_number_encrypted, routing_number_last4
  ) values (
    p_profile_id, p_first_name, p_last_name, p_bank_name,
    pgp_sym_encrypt(p_account_number, v_key),
    right(p_account_number, 4),
    pgp_sym_encrypt(p_routing_number, v_key),
    right(p_routing_number, 4)
  )
  on conflict (profile_id) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    bank_name = excluded.bank_name,
    account_number_encrypted = excluded.account_number_encrypted,
    account_number_last4 = excluded.account_number_last4,
    routing_number_encrypted = excluded.routing_number_encrypted,
    routing_number_last4 = excluded.routing_number_last4,
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.save_payment_method(uuid, text, text, text, text, text) from public, anon;
grant execute on function public.save_payment_method(uuid, text, text, text, text, text) to authenticated;

-- Decrypted read function (use only when full value is required)
create or replace function public.get_payment_method_decrypted(p_profile_id uuid)
returns table (
  first_name text,
  last_name text,
  bank_name text,
  account_number text,
  routing_number text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
begin
  if p_profile_id <> auth.uid() and not public.has_role(auth.uid(), 'admin') then
    raise exception 'not authorized';
  end if;

  v_key := private.encryption_key();

  return query
  select
    pm.first_name,
    pm.last_name,
    pm.bank_name,
    pgp_sym_decrypt(pm.account_number_encrypted, v_key),
    pgp_sym_decrypt(pm.routing_number_encrypted, v_key)
  from public.payment_methods pm
  where pm.profile_id = p_profile_id;
end;
$$;

revoke all on function public.get_payment_method_decrypted(uuid) from public, anon;
grant execute on function public.get_payment_method_decrypted(uuid) to authenticated;
