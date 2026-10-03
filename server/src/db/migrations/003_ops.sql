-- =============================================================================
-- 003_ops.sql
-- Operations, CRM, Finance & HR
-- Depends on: 001_core.sql (users, members, plans), 002_commerce.sql (sequences)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 20. leads
-- -----------------------------------------------------------------------------
create table if not exists public.leads (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  email                 text,
  phone                 text not null,
  source                text not null default 'walk_in' check (source in ('walk_in', 'website', 'instagram', 'referral', 'phone', 'campaign')),
  interest              text,
  plan_id               uuid references public.plans  (id) on delete set null,
  sport                 text,
  preferred_date        date,
  message               text,
  status                text not null default 'new' check (status in ('new', 'contacted', 'quoted', 'negotiation', 'won', 'lost')),
  assigned_to           uuid references public.users   (id) on delete set null,
  follow_up_at          timestamptz,
  converted_member_id   uuid references public.members (id) on delete set null,
  updated_at            timestamptz not null default now(),
  created_at            timestamptz not null default now()
);

create index if not exists leads_status_idx   on public.leads (status);
create index if not exists leads_assignee_idx on public.leads (assigned_to);
create index if not exists leads_followup_idx on public.leads (follow_up_at) where status not in ('won', 'lost');

-- -----------------------------------------------------------------------------
-- 21. lead_activities
-- -----------------------------------------------------------------------------
create table if not exists public.lead_activities (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads (id) on delete cascade,
  type        text not null default 'note' check (type in ('call', 'whatsapp', 'email', 'meeting', 'note', 'status_change')),
  text        text not null,
  follow_up_at timestamptz,
  created_by  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists lead_activities_lead_idx on public.lead_activities (lead_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 22. quotes
-- -----------------------------------------------------------------------------
create table if not exists public.quotes (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads (id) on delete cascade,
  plan_id     uuid references public.plans (id) on delete set null,
  amount      numeric(10, 2) not null check (amount >= 0),
  notes       text,
  valid_until date,
  status      text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  sent_at     timestamptz,
  created_by  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists quotes_lead_idx on public.quotes (lead_id);

-- -----------------------------------------------------------------------------
-- 23. clients  (B2B / corporate)
-- -----------------------------------------------------------------------------
create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  contact_person text,
  email         text,
  phone         text not null,
  gst_no        text,
  address       text,
  created_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 24. invoices
-- -----------------------------------------------------------------------------
create table if not exists public.invoices (
  id           uuid primary key default gen_random_uuid(),
  invoice_no   text not null unique,
  client_id    uuid references public.clients (id) on delete set null,
  member_id    uuid references public.members (id) on delete set null,
  category     text not null default 'other' check (category in ('membership', 'court', 'shop', 'bar', 'event', 'other')),
  issue_date   date not null default current_date,
  due_date     date,
  status       text not null default 'draft' check (status in ('draft', 'issued', 'part_paid', 'paid', 'overdue', 'cancelled')),
  subtotal     numeric(10, 2) not null default 0 check (subtotal >= 0),
  tax_amount   numeric(10, 2) not null default 0 check (tax_amount >= 0),
  total        numeric(10, 2) not null default 0 check (total >= 0),
  paid_amount  numeric(10, 2) not null default 0 check (paid_amount >= 0),
  notes        text,
  created_by   uuid references public.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  constraint invoices_client_or_member_ck check (client_id is not null or member_id is not null),
  constraint invoices_paid_ck check (paid_amount >= 0 and paid_amount <= total)
);

create index if not exists invoices_client_idx  on public.invoices (client_id);
create index if not exists invoices_member_idx  on public.invoices (member_id);
create index if not exists invoices_status_idx  on public.invoices (status);

-- -----------------------------------------------------------------------------
-- 25. invoice_items
-- -----------------------------------------------------------------------------
create table if not exists public.invoice_items (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references public.invoices (id) on delete cascade,
  description   text not null,
  qty           numeric(10, 2) not null default 1 check (qty > 0),
  unit_price    numeric(10, 2) not null check (unit_price >= 0),
  tax_rate_pct  numeric(5, 2) not null default 0 check (tax_rate_pct between 0 and 100),
  amount        numeric(10, 2) not null check (amount >= 0),
  created_at    timestamptz not null default now()
);

create index if not exists invoice_items_invoice_idx on public.invoice_items (invoice_id);

-- -----------------------------------------------------------------------------
-- 26. expenses
-- -----------------------------------------------------------------------------
create table if not exists public.expenses (
  id              uuid primary key default gen_random_uuid(),
  vendor          text not null,
  category        text not null check (category in ('rent', 'salary', 'utilities', 'maintenance', 'inventory', 'marketing', 'other')),
  description     text,
  amount          numeric(10, 2) not null check (amount > 0),
  tax_amount      numeric(10, 2) not null default 0 check (tax_amount >= 0),
  due_date        date,
  status          text not null default 'pending' check (status in ('pending', 'paid', 'overdue', 'cancelled')),
  paid_at         timestamptz,
  payment_method  text check (payment_method in ('cash', 'upi', 'card', 'bank_transfer')),
  created_by      uuid references public.users (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists expenses_status_idx on public.expenses (status, due_date);

-- -----------------------------------------------------------------------------
-- 27. employees
-- -----------------------------------------------------------------------------
create table if not exists public.employees (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.users (id) on delete set null unique,
  full_name    text not null,
  title        text,
  phone        text not null,
  email        text,
  base_salary  numeric(10, 2) not null default 0 check (base_salary >= 0),
  joined_on    date not null default current_date,
  status       text not null default 'active' check (status in ('active', 'on_leave', 'resigned', 'terminated')),
  created_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 28. shifts
-- -----------------------------------------------------------------------------
create table if not exists public.shifts (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references public.employees (id) on delete cascade,
  shift_date    date not null,
  start_time    time not null,
  end_time      time not null,
  area          text check (area in ('court', 'shop', 'bar', 'front_desk', 'maintenance')),
  status        text not null default 'scheduled' check (status in ('scheduled', 'checked_in', 'checked_out', 'absent', 'leave')),
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  created_at    timestamptz not null default now(),
  constraint shifts_time_ck check (end_time > start_time),
  constraint shifts_employee_day_ck unique (employee_id, shift_date)
);

create index if not exists shifts_date_idx on public.shifts (shift_date, area);

-- -----------------------------------------------------------------------------
-- 29. leave_requests
-- -----------------------------------------------------------------------------
create table if not exists public.leave_requests (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references public.employees (id) on delete cascade,
  type         text not null default 'casual' check (type in ('casual', 'sick', 'earned', 'unpaid')),
  from_date    date not null,
  to_date      date not null,
  days         numeric(4, 1) not null check (days > 0),
  reason       text,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  decided_by   uuid references public.users (id) on delete set null,
  decided_at   timestamptz,
  decision_note text,
  created_at   timestamptz not null default now(),
  constraint leave_requests_dates_ck check (to_date >= from_date)
);

create index if not exists leave_requests_employee_idx on public.leave_requests (employee_id, status);

-- -----------------------------------------------------------------------------
-- 30. payroll_runs
-- -----------------------------------------------------------------------------
create table if not exists public.payroll_runs (
  id          uuid primary key default gen_random_uuid(),
  month       date not null unique,   -- store as the first day of the month
  status      text not null default 'draft' check (status in ('draft', 'processing', 'finalized', 'paid')),
  created_by  uuid references public.users (id) on delete set null,
  finalized_at timestamptz,
  paid_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 31. payslips
-- -----------------------------------------------------------------------------
create table if not exists public.payslips (
  id                  uuid primary key default gen_random_uuid(),
  run_id              uuid not null references public.payroll_runs (id) on delete cascade,
  employee_id         uuid not null references public.employees (id) on delete cascade,
  base_salary         numeric(10, 2) not null default 0 check (base_salary >= 0),
  allowances          numeric(10, 2) not null default 0 check (allowances >= 0),
  deductions          numeric(10, 2) not null default 0 check (deductions >= 0),
  unpaid_leave_days   numeric(4, 1) not null default 0 check (unpaid_leave_days >= 0),
  leave_deduction     numeric(10, 2) not null default 0 check (leave_deduction >= 0),
  net_pay             numeric(10, 2) not null default 0 check (net_pay >= 0),
  created_at          timestamptz not null default now(),
  constraint payslips_unique_ck unique (run_id, employee_id)
);

create index if not exists payslips_run_idx      on public.payslips (run_id);
create index if not exists payslips_employee_idx on public.payslips (employee_id);