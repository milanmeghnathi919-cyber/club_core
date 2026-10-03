-- =============================================================================
-- 002_commerce.sql
-- Commerce & Bar: product catalogue, stock ledger, shop orders, bar menu/tabs
-- Depends on: 001_core.sql (users, members)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 11. product_categories
-- -----------------------------------------------------------------------------
create table if not exists public.product_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 12. products
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id                  uuid primary key default gen_random_uuid(),
  sku                 text not null unique,
  name                text not null,
  description         text,
  category_id         uuid references public.product_categories (id) on delete set null,
  brand               text,
  price               numeric(10, 2) not null check (price >= 0),
  tax_rate_pct        numeric(5, 2) not null default 0 check (tax_rate_pct between 0 and 100),
  stock_qty           integer not null default 0,
  low_stock_threshold integer not null default 0 check (low_stock_threshold >= 0),
  low_stock_alerted   boolean not null default false,
  image_url           text,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  constraint products_stock_ck check (stock_qty >= 0)
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_idx   on public.products (is_active) where is_active;

-- -----------------------------------------------------------------------------
-- 13. stock_movements  (append-only ledger; never update qty here)
-- -----------------------------------------------------------------------------
create table if not exists public.stock_movements (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  delta      integer not null check (delta <> 0),
  reason     text not null check (reason in ('purchase', 'sale', 'return', 'adjustment', 'damage', 'expire')),
  ref_type   text check (ref_type in ('shop_order', 'purchase_order', 'manual', 'return')),
  ref_id     uuid,
  note       text,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_product_idx on public.stock_movements (product_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 14. shop_orders
-- -----------------------------------------------------------------------------
create table if not exists public.shop_orders (
  id                uuid primary key default gen_random_uuid(),
  order_no          text not null unique,
  member_id         uuid references public.members (id) on delete set null,
  customer_name     text not null,
  customer_phone    text not null,
  channel           text not null default 'counter' check (channel in ('counter', 'online', 'phone')),
  fulfilment        text not null default 'pickup' check (fulfilment in ('pickup', 'delivery')),
  delivery_address  text,
  delivery_fee      numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  status            text not null default 'pending' check (status in ('pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
  payment_status    text not null default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid', 'refunded')),
  payment_pref      text not null default 'on_delivery' check (payment_pref in ('prepaid', 'on_delivery')),
  subtotal          numeric(10, 2) not null default 0 check (subtotal >= 0),
  discount_pct      numeric(5, 2) not null default 0 check (discount_pct between 0 and 100),
  discount          numeric(10, 2) not null default 0 check (discount >= 0),
  tax_amount        numeric(10, 2) not null default 0 check (tax_amount >= 0),
  total             numeric(10, 2) not null default 0 check (total >= 0),
  notes             text,
  expires_at        timestamptz,
  created_by        uuid references public.users (id) on delete set null,
  created_at        timestamptz not null default now(),
  constraint shop_orders_fulfilment_ck check (
    (fulfilment = 'delivery' and delivery_address is not null) or fulfilment = 'pickup'
  )
);

create index if not exists shop_orders_member_idx on public.shop_orders (member_id);
create index if not exists shop_orders_status_idx on public.shop_orders (status);

-- -----------------------------------------------------------------------------
-- 15. shop_order_items
-- -----------------------------------------------------------------------------
create table if not exists public.shop_order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.shop_orders (id) on delete cascade,
  product_id    uuid references public.products (id) on delete set null,
  name_snapshot text not null,
  unit_price    numeric(10, 2) not null check (unit_price >= 0),
  qty           integer not null check (qty > 0),
  tax_rate_pct  numeric(5, 2) not null default 0 check (tax_rate_pct between 0 and 100),
  tax_amount    numeric(10, 2) not null default 0 check (tax_amount >= 0),
  line_total    numeric(10, 2) not null check (line_total >= 0),
  created_at    timestamptz not null default now()
);

create index if not exists shop_order_items_order_idx on public.shop_order_items (order_id);

-- -----------------------------------------------------------------------------
-- 16. menu_items
-- -----------------------------------------------------------------------------
create table if not exists public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text not null,
  price        numeric(10, 2) not null check (price >= 0),
  tax_rate_pct numeric(5, 2) not null default 0 check (tax_rate_pct between 0 and 100),
  station      text not null default 'bar' check (station in ('bar', 'kitchen')),
  is_available boolean not null default true,
  image_url    text,
  created_at   timestamptz not null default now(),
  constraint menu_items_unique_ck unique (name, category)
);

create index if not exists menu_items_category_idx on public.menu_items (category) where is_available;

-- -----------------------------------------------------------------------------
-- 17. bar_tables
-- -----------------------------------------------------------------------------
create table if not exists public.bar_tables (
  id         uuid primary key default gen_random_uuid(),
  label      text not null unique,
  seats      integer not null default 4 check (seats > 0),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 18. bar_tabs
-- -----------------------------------------------------------------------------
create table if not exists public.bar_tabs (
  id           uuid primary key default gen_random_uuid(),
  tab_no       text not null unique,
  table_id     uuid references public.bar_tables (id) on delete set null,
  member_id    uuid references public.members (id) on delete set null,
  guest_name   text,
  status       text not null default 'open' check (status in ('open', 'settled', 'void')),
  opened_by    uuid references public.users (id) on delete set null,
  settled_by   uuid references public.users (id) on delete set null,
  subtotal     numeric(10, 2) not null default 0 check (subtotal >= 0),
  discount_pct numeric(5, 2) not null default 0 check (discount_pct between 0 and 100),
  discount     numeric(10, 2) not null default 0 check (discount >= 0),
  tax_amount   numeric(10, 2) not null default 0 check (tax_amount >= 0),
  total        numeric(10, 2) not null default 0 check (total >= 0),
  void_reason  text,
  opened_at    timestamptz not null default now(),
  closed_at    timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists bar_tabs_status_idx on public.bar_tabs (status);
create index if not exists bar_tabs_table_idx  on public.bar_tabs (table_id) where status = 'open';

-- -----------------------------------------------------------------------------
-- 19. bar_order_items
-- -----------------------------------------------------------------------------
create table if not exists public.bar_order_items (
  id             uuid primary key default gen_random_uuid(),
  tab_id         uuid not null references public.bar_tabs (id) on delete cascade,
  menu_item_id   uuid references public.menu_items (id) on delete set null,
  name_snapshot  text not null,
  unit_price     numeric(10, 2) not null check (unit_price >= 0),
  qty            integer not null check (qty > 0),
  tax_rate_pct   numeric(5, 2) not null default 0 check (tax_rate_pct between 0 and 100),
  notes          text,
  kitchen_status text not null default 'na' check (kitchen_status in ('na', 'queued', 'preparing', 'ready', 'served', 'cancelled')),
  station        text not null default 'bar' check (station in ('bar', 'kitchen')),
  added_by       uuid references public.users (id) on delete set null,
  updated_at     timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

create index if not exists bar_order_items_tab_idx on public.bar_order_items (tab_id);