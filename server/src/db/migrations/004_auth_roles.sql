-- =============================================================================
-- 004_auth_roles.sql
-- Email verification + role model
-- Depends on: 001_core.sql (users)
--
-- Changes:
--   1. users gains is_email_verified / verification fields
--   2. new email_verification_codes table for one-time codes
--   3. users.role enum replaced with the operational role set:
--        admin, cafe_manager, court_manager, shop_manager, member
--      (was: owner, admin, manager, staff, user)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Email verification state on users
-- -----------------------------------------------------------------------------
alter table public.users
  add column if not exists is_email_verified boolean not null default false,
  add column if not exists email_verified_at  timestamptz,
  add column if not exists verification_sent_at timestamptz;

comment on column public.users.is_email_verified is
  'False until the member confirms the code sent to this address. Unverified accounts cannot use member-only endpoints.';

-- -----------------------------------------------------------------------------
-- 2. One-time verification codes
--
-- Codes are hashed, never stored in plain text, so a leaked table snapshot
-- cannot be replayed against someone's email.
-- -----------------------------------------------------------------------------
create table if not exists public.email_verification_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  code_hash   text not null,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  attempts    smallint not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists evc_user_idx    on public.email_verification_codes (user_id);
create index if not exists evc_active_idx  on public.email_verification_codes (user_id, expires_at)
  where consumed_at is null;

-- At most one live code per user: sending again supersedes the old one.
create unique index if not exists evc_one_live_per_user
  on public.email_verification_codes (user_id)
  where consumed_at is null;

-- -----------------------------------------------------------------------------
-- 3. Role model
--
-- Operational roles replace the old owner/admin/manager/staff/user set.
--   admin          full access, manages staff and settings
--   cafe_manager   bar, kitchen, tables
--   court_manager  courts, availability, bookings
--   shop_manager   products, stock, orders
--   member         the club's members
--
-- The old role values were a check constraint, not an enum type.
-- -----------------------------------------------------------------------------
alter table public.users drop constraint if exists users_role_check;

-- Remap anything already stored before narrowing the constraint.
update public.users set role = 'member' where role = 'user';
update public.users set role = 'admin'  where role in ('owner', 'manager');
update public.users set role = 'court_manager' where role = 'staff';

alter table public.users
  add constraint users_role_check
  check (role in ('admin', 'cafe_manager', 'court_manager', 'shop_manager', 'member'));

create index if not exists users_role_idx on public.users (role);

-- -----------------------------------------------------------------------------
-- 4. Seed the first admin
--
-- Run once, from an authenticated psql session, then change the password.
-- The password below is a bcrypt hash of "ChangeMe123!".
-- -----------------------------------------------------------------------------
-- insert into public.users (email, password_hash, role, name, is_email_verified)
-- values ('admin@championsclub.com', '<bcrypt hash>', 'admin', 'Owner', true)
-- on conflict (email) do update set role = 'admin';

-- -----------------------------------------------------------------------------
-- 5. Helper: is a user's verification code still usable?
-- -----------------------------------------------------------------------------
create or replace function public.is_email_verified(p_user_id uuid)
returns boolean
language sql
stable
as $$
  select coalesce((select is_email_verified from public.users where id = p_user_id), false);
$$;