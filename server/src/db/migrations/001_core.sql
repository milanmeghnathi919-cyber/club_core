-- =============================================================================
-- 001_core.sql
-- Core schema: identity, membership, courts, bookings, payments, notifications
-- Apply with: npm run db:migrate
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. users
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,
  password_hash  text not null,
  role           text not null default 'user' check (role in ('owner', 'admin', 'manager', 'staff', 'user')),
  name           text not null,
  phone          text,
  is_active      boolean not null default true,
  last_login_at  timestamptz,
  created_at     timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2. settings  (key/value app config)
-- -----------------------------------------------------------------------------
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

comment on table public.settings is 'Key/value application settings. value is jsonb so numbers, arrays and objects all work.';

-- -----------------------------------------------------------------------------
-- 3. plans
-- -----------------------------------------------------------------------------
create table if not exists public.plans (
  id                    uuid primary key default gen_random_uuid(),
  code                  text not null unique,
  name                  text not null,
  description           text,
  price                 numeric(10, 2) not null default 0 check (price >= 0),
  duration_days         integer not null check (duration_days > 0),
  court_discount_pct    numeric(5, 2) not null default 0 check (court_discount_pct between 0 and 100),
  shop_discount_pct     numeric(5, 2) not null default 0 check (shop_discount_pct  between 0 and 100),
  bar_discount_pct      numeric(5, 2) not null default 0 check (bar_discount_pct   between 0 and 100),
  max_bookings_per_day  integer check (max_bookings_per_day > 0),
  perks                 jsonb not null default '[]'::jsonb,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 4. members
-- -----------------------------------------------------------------------------
create table if not exists public.members (
  id                uuid primary key default gen_random_uuid(),
  member_code       text not null unique,
  user_id           uuid references public.users (id) on delete set null,
  full_name         text not null,
  phone             text not null,
  email             text,
  dob               date,
  address           text,
  emergency_contact text,
  photo_url         text,
  notes             text,
  created_by        uuid references public.users (id) on delete set null,
  created_at        timestamptz not null default now()
);

create index if not exists members_phone_idx  on public.members (phone);
create index if not exists members_user_idx  on public.members (user_id);
create index if not exists members_name_idx  on public.members (full_name);

-- -----------------------------------------------------------------------------
-- 5. memberships
-- -----------------------------------------------------------------------------
create table if not exists public.memberships (
  id                  uuid primary key default gen_random_uuid(),
  member_id           uuid not null references public.members (id) on delete cascade,
  plan_id             uuid not null references public.plans   (id) on delete restrict,
  start_date          date not null,
  end_date            date not null,
  status              text not null default 'active' check (status in ('pending', 'active', 'expired', 'cancelled', 'frozen')),
  price_paid          numeric(10, 2) not null default 0 check (price_paid >= 0),
  tax_amount          numeric(10, 2) not null default 0 check (tax_amount >= 0),
  reminder_7d_sent_at timestamptz,
  reminder_1d_sent_at timestamptz,
  created_by          uuid references public.users (id) on delete set null,
  created_at          timestamptz not null default now(),
  constraint memberships_dates_ck check (end_date > start_date)
);

create index if not exists memberships_member_idx on public.memberships (member_id);
create index if not exists memberships_plan_idx   on public.memberships (plan_id);
create index if not exists memberships_end_idx    on public.memberships (end_date) where status = 'active';

-- -----------------------------------------------------------------------------
-- 6. courts
-- -----------------------------------------------------------------------------
create table if not exists public.courts (
  id             uuid primary key default gen_random_uuid(),
  name           text not null unique,
  sport          text not null,
  rate_per_hour  numeric(10, 2) not null check (rate_per_hour >= 0),
  description    text,
  image_url      text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists courts_sport_idx on public.courts (sport) where is_active;

-- -----------------------------------------------------------------------------
-- 7. bookings
-- -----------------------------------------------------------------------------
create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  booking_no     text not null unique,
  court_id       uuid not null references public.courts  (id) on delete restrict,
  booking_type   text not null default 'court' check (booking_type in ('court', 'session', 'event', 'tournament')),
  member_id      uuid references public.members (id) on delete set null,
  guest_name     text,
  guest_phone    text,
  start_at       timestamptz not null,
  end_at         timestamptz not null,
  during         text not null default 'day' check (during in ('day', 'night', 'evening', 'morning')),
  status         text not null default 'pending' check (status in ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')),
  base_price     numeric(10, 2) not null default 0 check (base_price >= 0),
  discount_pct   numeric(5, 2) not null default 0 check (discount_pct between 0 and 100),
  price          numeric(10, 2) not null default 0 check (price >= 0),
  tax_amount     numeric(10, 2) not null default 0 check (tax_amount >= 0),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid', 'refunded')),
  source         text not null default 'walk_in' check (source in ('walk_in', 'online', 'phone', 'whatsapp', 'admin')),
  capacity       integer check (capacity > 0),
  price_per_head numeric(10, 2) check (price_per_head >= 0),
  title          text,
  notes          text,
  cancelled_at   timestamptz,
  cancel_reason  text,
  created_by     uuid references public.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  constraint bookings_time_ck check (end_at > start_at),
  constraint bookings_guest_ck check (member_id is not null or guest_name is not null)
);

create index if not exists bookings_court_time_idx on public.bookings (court_id, start_at, end_at);
create index if not exists bookings_member_idx     on public.bookings (member_id);
create index if not exists bookings_status_idx     on public.bookings (status);

-- -----------------------------------------------------------------------------
-- 8. booking_participants
-- -----------------------------------------------------------------------------
create table if not exists public.booking_participants (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.bookings (id) on delete cascade,
  member_id      uuid references public.members (id) on delete set null,
  guest_name     text,
  status         text not null default 'joined' check (status in ('invited', 'joined', 'left', 'absent')),
  base_price     numeric(10, 2) not null default 0 check (base_price >= 0),
  discount_pct   numeric(5, 2) not null default 0 check (discount_pct between 0 and 100),
  price          numeric(10, 2) not null default 0 check (price >= 0),
  tax_amount     numeric(10, 2) not null default 0 check (tax_amount >= 0),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid', 'refunded')),
  joined_at      timestamptz,
  created_by     uuid references public.users (id) on delete set null,
  created_at     timestamptz not null default now()
);

create index if not exists booking_participants_session_idx on public.booking_participants (session_id);

-- -----------------------------------------------------------------------------
-- 9. payments
-- -----------------------------------------------------------------------------
create table if not exists public.payments (
  id                 uuid primary key default gen_random_uuid(),
  payment_no         text not null unique,
  source_type        text not null check (source_type in ('membership', 'booking', 'shop_order', 'bar_tab', 'invoice', 'other')),
  source_id          uuid,
  member_id          uuid references public.members (id) on delete set null,
  amount             numeric(10, 2) not null check (amount > 0),
  method             text not null check (method in ('cash', 'upi', 'card', 'razorpay', 'bank_transfer', 'wallet')),
  status             text not null default 'success' check (status in ('pending', 'success', 'failed', 'refunded')),
  revenue_category   text not null default 'other' check (revenue_category in ('membership', 'court', 'shop', 'bar', 'event', 'other')),
  razorpay_order_id   text,
  razorpay_payment_id text,
  received_by        uuid references public.users (id) on delete set null,
  paid_at            timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists payments_source_idx  on public.payments (source_type, source_id);
create index if not exists payments_member_idx  on public.payments (member_id);
create index if not exists payments_rzp_order_idx on public.payments (razorpay_order_id);

-- -----------------------------------------------------------------------------
-- 10. notifications
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  type       text not null default 'general' check (type in ('general', 'booking', 'membership', 'payment', 'lead', 'stock', 'system')),
  title      text not null,
  body       text,
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

-- =============================================================================
-- Human-readable document numbers
-- Sequences are per-year so numbers read like BK-2026-000123.
-- =============================================================================
create sequence if not exists public.booking_no_seq;
create sequence if not exists public.payment_no_seq;
create sequence if not exists public.invoice_no_seq;
create sequence if not exists public.order_no_seq;

create or replace function public.next_doc_no(p_seq text, p_prefix text, p_width int default 6)
returns text
language plpgsql
as $$
declare
  v_no bigint;
  v_year int := extract(year from now());
begin
  execute format('select nextval(%L)', p_seq) into v_no;
  return p_prefix || '-' || v_year::text || '-' || lpad(v_no::text, p_width, '0');
end;
$$;

create or replace function public.next_booking_no()
returns text language sql as $$ select public.next_doc_no('public.booking_no_seq', 'BK') $$;

create or replace function public.next_payment_no()
returns text language sql as $$ select public.next_doc_no('public.payment_no_seq', 'PAY') $$;

create or replace function public.next_invoice_no()
returns text language sql as $$ select public.next_doc_no('public.invoice_no_seq', 'INV') $$;

create or replace function public.next_order_no()
returns text language sql as $$ select public.next_doc_no('public.order_no_seq', 'ORD') $$;