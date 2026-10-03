# BACKEND_EXECUTION_PLAN.md — Sports Club Management System (The Champions Club)

**Required reading before any work:** `PROJECT_CONTEXT.md` → this file → `API_CONTRACT.md` (the full endpoint contract lives there; both teams share it).
**Team:** Backend Person 1 (**BE1**) and Backend Person 2 (**BE2**). Source of truth = organizer PDF "Sports Club Management System" (summarised in MASTER_PLAN.md §1).
Tags: **ASSUMPTION** = our decision · **UNKNOWN** = not in organizer docs.

---

## A. Backend understanding

### A1. What the backend must do (from the organizer scenes)
| # | Scene | Backend responsibility |
|---|---|---|
| 1 | New member at front desk | Member profile, plan (Gold/Silver/Junior) with entitlements (court rate, shop %, bar %), expiry tracking + reminders, quick lookup, history |
| 2 | Court booking at 6 pm | 60-min sessions, new slot every 30 min, max 2/day/member, plan-based pricing (member < walk-in, Gold free), cancel/plan change, Friday social play (many per court), **never double-book** |
| 3 | Gearing up | Product catalogue (rackets, balls, shoes, accessories, apparel), one stock count shared by counter + online orders, low-stock alerts, pickup/delivery |
| 4 | Bar | Tabs/orders per table, kitchen queue, automatic member discount, tab → settle by cash/card/UPI, staff shifts, daily bar earnings |
| 5 | Stranger online | Public club info, plans/prices, weekly availability, shop catalogue, enquiry (never lost) → notify → follow-up → quote → convert to member, trial booking |
| 6 | Owner month-end | One ledger of all money (court/shop/bar × cash/card/online), invoices (memberships + business clients), payroll, leave approval, tax report, "what we owe", dashboard today/week/month, shareable numbers |

### A2. Roles & permission matrix
| Capability | public | member | bar_staff | front_desk | owner |
|---|:-:|:-:|:-:|:-:|:-:|
| Public info, enquiry | ✔ | ✔ | ✔ | ✔ | ✔ |
| Own profile/bookings/orders | – | ✔ | – | – | – |
| Book court (self) | – | ✔ | – | – | – |
| Member CRUD, memberships, book for others | – | – | lookup only | ✔ | ✔ |
| Counter shop sales, stock adjust | – | – | – | ✔ | ✔ |
| Product/catalogue CRUD | – | – | – | create/edit | ✔ (+delete) |
| Bar tabs, kitchen | – | – | ✔ | ✔ | ✔ |
| Leads/CRM | – | – | – | ✔ | ✔ |
| Settings, plans, courts, tables | – | – | – | – | ✔ |
| Invoices, expenses, payroll, tax, full dashboard | – | – | – | – | ✔ |
| Own shifts/leave request | – | – | ✔ | ✔ | ✔ |
| Approve leave | – | – | – | – | ✔ |

### A3. Business rules (implement exactly; tests in §G)
| ID | Rule |
|---|---|
| BR-01 | Session = 60 min. Start times on :00/:30 in club tz, within opening hours (UNKNOWN → ASSUMPTION 06:00–22:00, last start so end ≤ close), not in the past, within `bookingWindowDays` (14). |
| BR-02 | Two non-cancelled bookings can never overlap on one court — **enforced by DB exclusion constraint**, not just code. Note: starts every 30 min with 60-min length means a 18:00 and 18:30 booking overlap. |
| BR-03 | A member can hold ≤ `plan.maxBookingsPerDay` (default 2) sessions per local calendar day: counts regular bookings (confirmed/completed/no_show) + joined social sessions. Cancelled don't count. Guests (no account) are unlimited. |
| BR-04 | Price = `court.ratePerHour × (1 − plan.courtDiscountPct/100)`; walk-in/guest = full rate. 100% → price 0, `paymentStatus=waived`, no payment row. Price snapshot is stored on the booking (later plan changes don't re-price). |
| BR-05 | Member overlap: a member can't hold two overlapping sessions on different courts (`MEMBER_OVERLAP`). ASSUMPTION. |
| BR-06 | Active membership = status `active` and today ∈ [start,end]. One active membership per member. Daily job marks expired; reminders at 7 days and 1 day before end (email + in-app). Expired member: booking allowed but priced walk-in + `warnings:["MEMBERSHIP_EXPIRED"]` (ASSUMPTION). |
| BR-07 | Junior plan requires age < 18 on start date; other plans require ≥ 18? **UNKNOWN** → ASSUMPTION: Gold/Silver have no age limit; only Junior is age-checked. |
| BR-08 | Plan change = new membership row, old → `replaced`, ends the day before; no proration (ASSUMPTION). |
| BR-09 | Cancellation: member until `cancelCutoffHours` (2h) before start; staff any time. Paid online → `refund_pending` (manual refund; Razorpay refund API = P2). Slot becomes available instantly. |
| BR-10 | Social play: on configured day/window (Friday 18:00–22:00 — ASSUMPTION), courts are covered by `social_session` bookings with `capacity` and `pricePerHead`; participants join individually; member discount applies; counts toward BR-03; non-members may join at full price (ASSUMPTION). A regular booking cannot overlap a social session (same constraint). |
| BR-11 | One `products.stock_qty` for counter and online. Order creation decrements atomically (`UPDATE … WHERE stock_qty >= qty`); cancel/auto-expire restores. Every change writes `stock_movements`. Crossing ≤ threshold creates ONE low-stock notification until restocked. |
| BR-12 | Member discount is automatic: shop uses `plan.shopDiscountPct`, bar uses `barDiscountPct`, courts `courtDiscountPct` — only if the member is attached and membership is active. No free-text/manual discounts. |
| BR-13 | **Single money ledger:** every cash-in is a `payments` row (`status=paid`). Dashboard/revenue/tax read ONLY this ledger (+ expenses for outflow). Waived (free) bookings create no payment. |
| BR-14 | Bar: ≤ 1 open tab per table; tab may be table-less (counter). Items carry kitchen status. Settle requires Σ payments = total, locks the tab, frees table, `closed_at` set. Void needs reason + FD+/owner. Item cancel only while `new`. |
| BR-15 | Online shop order unpaid after `onlineOrderHoldMinutes` (30) → auto-cancel + restock (job every 5 min). Delivery only with online payment; delivery fee flat from settings (ASSUMPTION). |
| BR-16 | Tax: listed prices tax-inclusive; tax = gross × rate/(100+rate), stored per line/booking. Rates are placeholders in `settings.taxRates`; **owner must confirm** (UNKNOWN regime). |
| BR-17 | Public enquiry → lead(status `new`) → in-app notification to every owner/front_desk user + email (nodemailer). Lead cannot be deleted (only `lost`). Convert creates member + membership (+ payment) atomically. |
| BR-18 | Invoices: sequential `INV-YYYY-NNNN`; `paid` when Σ payments ≥ total; `overdue` is computed (due_date < today and not paid/void). Invoice payment's `revenue_category` = invoice category. Do **not** also create a payment for the underlying item (no double counting). |
| BR-19 | Leave: staff request → owner approves/rejects. Approved `unpaid` days deduct in payroll. Annual leave balance = **UNKNOWN** (not modelled; P2). |
| BR-20 | Payroll: one run per month; `net = base + allowances − deductions − unpaidLeaveDays × base/30`; finalized runs immutable; mark-paid writes a `salary` expense. |
| BR-21 | Every staff write stores `created_by`/actor. Public endpoints never return PII or exact stock. |

---

## B. Architecture

### B1. Decisions (record in PROJECT_CONTEXT.md §Decisions)
| ID | Decision | Why |
|---|---|---|
| D-B1 | Node + Express (REST, `/api/v1`), **Supabase Postgres** accessed with `@supabase/supabase-js` using the **service-role key from the server only**. Custom auth (bcrypt + JWT cookie) — we do NOT use Supabase Auth. | Stack given by team; bcrypt/jsonwebtoken/cookie-parser are in the stack |
| D-B2 | **Atomic/concurrency-critical logic lives in Postgres functions (RPC)**: `create_booking`, `join_social_session`, `place_shop_order`, `cancel_shop_order`, `adjust_stock`, `quote_court_price`. Node calls `supabase.rpc()`. | supabase-js has no multi-statement transactions; double-booking & stock must be race-free |
| D-B3 | Double-booking prevention = `btree_gist` **EXCLUDE constraint** on `(court_id, tstzrange)`. Map Postgres error `23P01` → `SLOT_TAKEN`. | Correct under parallel requests |
| D-B4 | Schema changes via numbered SQL files in `/server/db/migrations` (run in Supabase SQL editor or script). BE1 owns `001_*`, BE2 owns `002_*`; never edit an applied file — add a new one. | Avoid merge conflicts |
| D-B5 | Validation with **zod** (added lib), one schema per route. Layering: route → controller → service → repository(supabase). | Consistent, testable |
| D-B6 | Background jobs via **node-cron** (added lib) + a guarded `POST /internal/jobs/:name` (header `x-job-secret`) so we can trigger jobs manually in demo / from external cron if host sleeps. | Free hosts sleep |
| D-B7 | Kitchen/booking "live" views = **polling** (FE every 5–30 s), no websockets. | Simplicity |
| D-B8 | Added libs: `zod`, `node-cron`, `helmet`, `express-rate-limit`, `morgan`, `razorpay` (SDK), `csv-stringify`, `jest`+`supertest` (dev). Hash lib = `bcryptjs` (works everywhere), uploads = `multer` + `cloudinary`. | Needed; minimal |
| D-B9 | Money `numeric(12,2)` in DB; API returns numbers rounded to 2 dp. Times `timestamptz` (UTC). Club-tz logic in one util `utils/clubTime.js` (use `date-fns-tz`). | Timezone bugs are the #1 booking bug |

### B2. Folder structure
```
server/
  src/
    app.js                 # express app (helmet, cors, cookieParser, json, routes, errorHandler)
    server.js              # listen + start cron
    config/ env.js supabase.js razorpay.js mailer.js cloudinary.js
    middleware/ auth.js (requireAuth, requireRole(...)) validate.js (zod) errorHandler.js rateLimit.js upload.js (multer)
    utils/ response.js (ok/created/paginated) AppError.js clubTime.js money.js numbering.js asyncHandler.js
    modules/<module>/ <module>.routes.js  .controller.js  .service.js  .repo.js  .schema.js
       auth  users  plans  members  memberships  courts  availability  bookings  social
       products  shop  payments  bar  leads  notifications  settings  uploads
       invoices  clients  expenses  employees  shifts  leave  payroll  reports  public  jobs
    jobs/ expireMemberships.js remindExpiry.js releaseUnpaidOrders.js followUpReminders.js index.js
  db/ migrations/001_core.sql 002_commerce.sql 003_ops.sql 004_functions.sql   seeds/seed.js
  tests/ smoke/*.test.js  concurrency.test.js
  .env.example  package.json
```
Env vars: `PORT, NODE_ENV, CLIENT_URL, DB_HOST, DB_PORT=5432, DB_NAME=postgres, DB_USER=postgres, DB_PASSWORD, DB_POOL_MAX=10, DB_SSL=true, JWT_SECRET, JWT_EXPIRES_IN=7d, COOKIE_SECURE, CLOUDINARY_*, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, EMAIL_USER, EMAIL_PASS, JOB_SECRET, CLUB_TZ=Asia/Kolkata`.

### B3. Middleware order
`helmet → cors({origin: CLIENT_URL, credentials:true}) → morgan → express.json → cookieParser → rateLimit(on auth/public) → routes → notFound → errorHandler`. `errorHandler` converts `AppError`, zod errors, Postgres codes (`23P01`→SLOT_TAKEN, `23505`→409 unique, `23514`/RPC `RAISE EXCEPTION 'CODE:…'`→mapped code) into the error envelope.
RPC functions raise exceptions with message `CODE|human message` (e.g. `DAILY_LIMIT_REACHED|You already have 2 sessions on this day`) → `errorHandler` splits and maps.

### B4. Auth
`POST /auth/login` → bcrypt compare → sign JWT `{sub, role}` → `Set-Cookie cc_token` (httpOnly, `sameSite` lax local / none prod, `secure` prod). `requireAuth` reads cookie or Bearer, loads user (active). `requireRole('owner','front_desk')`. Member ownership checks in services (e.g., member may only read own booking).

---

## C. Database design

Legend: `col type` · `?` nullable · `FK→` · `UQ` unique · `DEF` default. All tables have `id uuid PK DEF gen_random_uuid()` and `created_at timestamptz DEF now()` unless stated. Enums are Postgres enums or `text CHECK`. Extensions: `pgcrypto`, `btree_gist`, `pg_trgm`.

### C1. Core (migration 001 — BE1)
```
users(email UQ lower, password_hash, role user_role, name, phone?, is_active DEF true, last_login_at?)
settings(key text PK, value jsonb, updated_at)                       -- openTime, closeTime, slotMinutes, taxRates, social*, …
plans(code plan_code UQ, name, description?, price numeric, duration_days int, court_discount_pct numeric(5,2),
      shop_discount_pct, bar_discount_pct, max_bookings_per_day int DEF 2, perks jsonb DEF '[]', is_active)
members(member_code UQ  -- 'CC-'||lpad(nextval('member_seq'),6,'0'), user_id? UQ FK→users, full_name, phone UQ, email?, dob?,
        address?, emergency_contact?, photo_url?, notes?, created_by? FK→users)
        idx: gin(full_name gin_trgm_ops), phone, member_code
memberships(member_id FK, plan_id FK, start_date, end_date, status membership_status[pending|active|expired|cancelled|replaced],
        price_paid numeric DEF 0, tax_amount DEF 0, reminder_7d_sent_at?, reminder_1d_sent_at?, created_by?)
        UQ partial: (member_id) WHERE status='active';  idx(member_id,status,end_date)
courts(name UQ, sport sport_enum, rate_per_hour numeric, description?, image_url?, is_active DEF true)
bookings(booking_no UQ, court_id FK, booking_type [regular|social_session] DEF regular, member_id? FK, guest_name?, guest_phone?,
        start_at, end_at, during tstzrange GENERATED ALWAYS AS (tstzrange(start_at,end_at,'[)')) STORED,
        status [confirmed|cancelled|completed|no_show] DEF confirmed, base_price, discount_pct DEF 0, price, tax_amount DEF 0,
        payment_status [unpaid|paid|waived|refund_pending|refunded], source [member_web|staff_counter|phone|public_trial],
        capacity int?, price_per_head numeric?, title?, notes?, cancelled_at?, cancel_reason?, created_by?)
        CHECK end_at = start_at + interval '60 minutes'
        CHECK (booking_type='regular' AND (member_id IS NOT NULL OR guest_name IS NOT NULL)) OR (booking_type='social_session' AND capacity>0)
        EXCLUDE USING gist (court_id WITH =, during WITH &&) WHERE (status <> 'cancelled')      -- BR-02
        idx(member_id,start_at), idx(court_id,start_at), idx(start_at)
booking_participants(session_id FK→bookings, member_id? FK, guest_name?, status [joined|cancelled] DEF joined,
        base_price, discount_pct, price, tax_amount, payment_status, joined_at DEF now(), created_by?)
        UQ partial (session_id, member_id) WHERE member_id IS NOT NULL AND status='joined'
payments(payment_no UQ, source_type [booking|social_join|shop_order|bar_tab|membership|invoice], source_id uuid, member_id?,
        amount numeric(12,2) CHECK >0, method [cash|card|upi|online], status [pending|paid|failed|refunded] DEF paid,
        revenue_category [court|shop|bar|membership|corporate|other], razorpay_order_id?, razorpay_payment_id? UQ,
        received_by? FK→users, paid_at timestamptz?)
        idx(paid_at), idx(source_type,source_id), idx(revenue_category,paid_at)
notifications(user_id FK→users, type, title, body?, link?, is_read DEF false)     -- fan-out one row per recipient
        idx(user_id,is_read,created_at desc)
```
`payments` table is created in 001 by BE1 but its **service is owned by BE2** (BE2-01).

### C2. Commerce & bar (migration 002 — BE2)
```
product_categories(name UQ)                                           -- Rackets, Balls, Shoes, Accessories, Apparel
products(sku UQ, name, description?, category_id FK, brand?, price numeric, tax_rate_pct numeric DEF 18,
        stock_qty int CHECK >=0, low_stock_threshold int DEF 5, low_stock_alerted bool DEF false, image_url?, is_active DEF true)
        idx(category_id), gin(name trgm)
stock_movements(product_id FK, delta int, reason [sale|restock|adjustment|damage|return|order_cancel], ref_type?, ref_id?, note?, created_by?)
shop_orders(order_no UQ, member_id? FK, customer_name, customer_phone?, channel [counter|online], fulfilment [in_store|pickup|delivery],
        delivery_address?, delivery_fee DEF 0, status [pending|confirmed|ready|out_for_delivery|completed|cancelled],
        payment_status [unpaid|paid|refund_pending|refunded], payment_pref [online|pay_at_club]?, subtotal, discount_pct, discount,
        tax_amount, total, notes?, expires_at?, created_by?)         idx(status,created_at), idx(member_id)
shop_order_items(order_id FK, product_id FK, name_snapshot, unit_price, qty int CHECK>0, tax_rate_pct, tax_amount, line_total)
menu_items(name, category [food|drink|snack|dessert], price, tax_rate_pct, station [kitchen|bar], is_available DEF true, image_url?)
bar_tables(label UQ, seats int, is_active DEF true)
bar_tabs(tab_no UQ, table_id? FK, member_id? FK, guest_name?, status [open|settled|void] DEF open, opened_by FK users, settled_by? FK,
        subtotal DEF 0, discount_pct DEF 0, discount DEF 0, tax_amount DEF 0, total DEF 0, void_reason?, opened_at DEF now(), closed_at?)
        UQ partial (table_id) WHERE status='open' AND table_id IS NOT NULL;  idx(status,opened_at), idx(closed_at)
bar_order_items(tab_id FK, menu_item_id FK, name_snapshot, unit_price, qty int>0, tax_rate_pct, notes?,
        kitchen_status [new|preparing|ready|served|cancelled] DEF new, station, added_by FK users, updated_at)
        idx(kitchen_status, created_at)
```

### C3. Ops, CRM, finance, HR (migration 003 — split BE1: leads; BE2: rest)
```
leads(name, email?, phone?, source [website|walk_in|phone|referral], interest [membership|trial|corporate|other], plan_id? FK, sport?,
      preferred_date?, message?, status [new|contacted|quoted|won|lost] DEF new, assigned_to? FK users, follow_up_at?,
      converted_member_id? FK, updated_at)     CHECK (email IS NOT NULL OR phone IS NOT NULL)     idx(status,created_at), idx(follow_up_at)
lead_activities(lead_id FK, type [note|call|email|visit|quote|status_change], text, follow_up_at?, created_by? FK)
quotes(lead_id FK, plan_id? FK, amount, notes?, valid_until date, status [draft|sent|accepted|expired] DEF draft, sent_at?, created_by FK)
clients(name, contact_person?, email?, phone?, gst_no?, address?)
invoices(invoice_no UQ, client_id? FK, member_id? FK, category [membership|corporate|other], issue_date, due_date,
         status [draft|sent|paid|void] DEF draft, subtotal, tax_amount, total, paid_amount DEF 0, notes?, created_by FK)
         CHECK (client_id IS NOT NULL OR member_id IS NOT NULL)
invoice_items(invoice_id FK, description, qty numeric, unit_price, tax_rate_pct, amount)
expenses(vendor, category [stock_purchase|rent|utilities|maintenance|salary|tax|other], description?, amount, tax_amount DEF 0,
         due_date, status [unpaid|paid] DEF unpaid, paid_at?, payment_method?, created_by FK)       idx(status,due_date)
employees(user_id? FK UQ, full_name, title, phone?, email?, base_salary numeric, joined_on date, status [active|inactive] DEF active)
shifts(employee_id FK, shift_date, start_time, end_time, area [front_desk|bar|shop|court_ops], status [scheduled|checked_in|completed|missed] DEF scheduled,
       checked_in_at?, checked_out_at?)                      idx(shift_date, employee_id)
leave_requests(employee_id FK, type [casual|sick|unpaid], from_date, to_date, days numeric, reason?,
       status [pending|approved|rejected|cancelled] DEF pending, decided_by? FK, decided_at?, decision_note?)
payroll_runs(month text UQ 'YYYY-MM', status [draft|finalized|paid] DEF draft, created_by FK, finalized_at?, paid_at?)
payslips(run_id FK, employee_id FK, base_salary, allowances DEF 0, deductions DEF 0, unpaid_leave_days DEF 0, leave_deduction DEF 0, net_pay, UQ(run_id,employee_id))
```
Sequences for numbering: `member_seq, booking_seq, shop_order_seq, payment_seq, tab_seq (reset daily in code via date prefix), invoice_seq` (helper `next_no(prefix,seq)`).

### C4. Functions (migration 004 — BE1: booking/pricing/social; BE2: stock/orders)
| Function | Behaviour |
|---|---|
| `quote_court_price(p_court uuid, p_member uuid, p_start timestamptz) → jsonb{base,discountPct,price,tax,expired}` | active membership at local date of `p_start` → plan.court_discount_pct; else walk-in; tax from settings |
| `create_booking(p_court, p_start, p_member, p_guest_name, p_guest_phone, p_source, p_actor)` | validate slot (BR-01) → if member: `pg_advisory_xact_lock(hashtext(p_member::text \|\| local_date))`, check daily count (BR-03), member overlap (BR-05) → price via `quote_court_price` → INSERT (exclusion violation propagates as 23P01) → returns row |
| `join_social_session(p_session, p_member, p_guest_name, p_actor)` | `SELECT … FOR UPDATE` on session row; capacity check; duplicate check; daily limit; insert participant with price |
| `place_shop_order(p_payload jsonb)` | for each item: `UPDATE products SET stock_qty=stock_qty-qty WHERE id=… AND stock_qty>=qty` (0 rows → raise `OUT_OF_STOCK|…`); insert order+items+stock_movements; compute discount/tax; set `expires_at` for online-unpaid; set `low_stock_alerted` and insert notifications when crossing threshold |
| `cancel_shop_order(p_order, p_actor, p_reason)` | status guard; restore stock; movements `order_cancel`; payment_status → `refund_pending` if paid |
| `adjust_stock(p_product, p_delta, p_reason, p_note, p_actor)` | no negative; movement row; reset `low_stock_alerted` if above threshold |

### C5. Example row (booking)
```json
{"id":"…","booking_no":"BK-2026-000045","court_id":"…","booking_type":"regular","member_id":"…","start_at":"2026-10-09T12:30:00Z","end_at":"2026-10-09T13:30:00Z",
 "status":"confirmed","base_price":600,"discount_pct":50,"price":300,"tax_amount":45.76,"payment_status":"unpaid","source":"member_web"}
```

---

## D. API contract
Full contract: **`API_CONTRACT.md`** (sections 0–2). BE must implement it exactly; any deviation → fix the contract first, log in PROJECT_CONTEXT.md.
Integration boundary summary: base `/api/v1` · envelope `{success,data,meta|error}` · cookie auth `cc_token` · errors/status codes table §0 · enums §0 · shapes §1 · endpoints §2.1–2.12b.
Validation rules live in zod schemas mirrored from the contract (`*.schema.js`). Unknown body fields are stripped; lengths: names ≤ 120, notes ≤ 1000; phone `^[0-9+\- ]{8,15}$`; password ≥ 8.

---

## E. Two-person task division

Priority tags: **P0** must work · **P1** important · **P2** enhancement. "Needs" = dependency. DoD = Definition of Done. All tasks: PR/merge to `main` via short-lived branches `be1/<id>` · `be2/<id>`; update `PROJECT_CONTEXT.md` when a task completes.

### E1. Backend Person 1 — Core, members, courts/bookings, public, leads, notifications, dashboard
| ID | P | Task | Why | Needs | Files / modules | DB / API impact | Expected result | Testing | DoD |
|---|---|---|---|---|---|---|---|---|---|
| BE1-01 | P0 | Scaffold Express app: config, `app.js`, middleware (auth/validate/error/rateLimit/upload), response utils, supabase client, `/health`, CORS+cookies, `.env.example`, README run steps | Everyone builds on it | – | `server/src/**` | `GET /health` | `npm run dev` serves; error envelope works | curl `/health`; throw test error → envelope | BE2 can clone & add a module in <10 min |
| BE1-02 | P0 | Migration `001_core.sql`: extensions, enums, sequences, tables C1 (+leads/lead tables C3 part), indexes, EXCLUDE constraint; apply to Supabase | Contract-first schema | 01 | `db/migrations/001_core.sql` | all C1 tables | Schema live; BE2 can FK to `members`,`users`,`payments` | Try inserting two overlapping bookings in SQL → error 23P01 | Applied on shared Supabase; schema snapshot noted in PROJECT_CONTEXT |
| BE1-03 | P0 | Auth: register/login/logout/me/password, bcrypt, JWT cookie, `requireAuth`, `requireRole` | Gate for all roles | 01,02 | `modules/auth`, `middleware/auth.js` | `/auth/*` | 4 roles can log in; cookie set | Postman: login ok/bad pw/expired; role-forbidden 403 | FE can log in against it (**Handoff H-B1**) |
| BE1-04 | P0 | Seed script: users per role, 3 plans, 4+ courts, settings, 10 demo members w/ memberships, a few bookings | FE+demo need data | 02,03 | `db/seeds/seed.js` | data | `npm run seed` idempotent; credentials in README | run twice | Printed login table (owner/front_desk/bar_staff/member) |
| BE1-05 | P0 | Plans + members + memberships services & endpoints, lookup (trigram), history aggregator, junior-age rule, expiry fields (`daysLeft`,`expiringSoon`), helper `membershipService.getActive(memberId,date)` + `discountFor(memberId,'court'\|'shop'\|'bar')` | Scene 1; BE2 needs the helpers | 03 | `modules/plans, members, memberships` | `/plans`, `/members*`, `/memberships/*`, `/me/membership/purchase`(P1) | Register member + plan + payment, search, profile + history | smoke tests; junior 25-yo → 422 | **Handoff H-B2: helpers merged → BE2 can use** |
| BE1-06 | P0 | Uploads (multer→Cloudinary) + Settings API + `settings` seed | Photos, product images, club config | 01 | `modules/uploads, settings` | `/uploads/image`, `/settings` | image URL returned | upload png; >3 MB → 422 | Used by FE for member photo |
| BE1-07 | P0 | Courts CRUD + **availability engine** (`utils/clubTime`, slot generator, social/closed/past states, per-viewer price via `quote_court_price`) | Scene 2 + public site | 02,05 | `modules/courts, availability`, migration `004` (price fn) | `/courts*`, `/courts/availability` | Correct slots at 30-min steps, last start = close−60 | unit tests on slot generator incl. DST-free IST edge, midnight | FE grid renders real data |
| BE1-08 | P0 | **Booking engine**: `create_booking` RPC, create/list/get/cancel/pay/status endpoints, daily limit, member overlap, cancel window, warnings, payment hook to BE2 `paymentsService.record()` | Core of the whole app | 07, BE2-01 | `modules/bookings`, migration `004` | `/bookings*` | All BR-01..09 hold | **concurrency test:** 10 parallel POST same slot → 1×201, 9×409 | Concurrency + limit tests green; Gold booking = waived |
| BE1-09 | P0 | Public API: club, plans, courts, availability (7 days), enquiries | Scene 5 | 05,07, 11 | `modules/public` | `/public/*` | Anonymous browse works, no PII | curl w/o cookie; rate limit 429 | FE public site fully live |
| BE1-10 | P1 | Social sessions: create/generate/join/leave/cancel (RPC `join_social_session`) | Friday social play | 08 | `modules/social` | `/social-sessions*` | capacity enforced; counted in daily limit | 20 parallel joins on cap 8 → exactly 8 succeed | Tests green |
| BE1-11 | P0 | Leads module + notifications service (`notify(roles,payload)`), nodemailer mailer, new-lead alert, activities, follow-ups, quotes (email), **convert** (member+membership atomic) | Scene 5 "enquiry must not vanish" | 05 | `modules/leads, notifications`, `config/mailer.js` | `/leads*`, `/notifications*` | Enquiry → bell + email → follow-up → quote → member | smoke: public enquiry creates lead + notif rows | Convert creates member; duplicate phone 409 |
| BE1-12 | P1 | Cron jobs: expire memberships, 7d/1d reminders (email + in-app), follow-up reminders; `/internal/jobs/:name` | "Nobody should have to remember" | 05,11 | `jobs/*`, `modules/jobs` | none | Reminders sent once | set end_date = today+7 → run job → one notif + mail; re-run no dup | Idempotent |
| BE1-13 | P0 | **Dashboard & revenue reports** (`/reports/dashboard`, `/reports/revenue`) reading `payments` + bookings/members/alerts | Scene 6 | BE2-01, 08, BE2-04, BE2-06 | `modules/reports` | `/reports/*` | Today/week/month totals by source & method | seed known payments → totals match SQL | Matches shape in contract §2.12b |
| BE1-14 | P1 | Trial booking endpoint + member self purchase membership (Razorpay) + `member-limited` history | Scene 5 "book a trial on the spot" | 08, BE2-05 | `modules/public`, `memberships` | `/public/trial-bookings`, `/me/membership/purchase` | works in test mode | smoke | Lead + booking created |
| BE1-15 | P0 | Integration support, bug fixing, performance (indexes), logging, deploy config (Render/Railway), CORS prod cookies | Ship | all | – | – | Prod API stable | full smoke suite | Deployed URL in PROJECT_CONTEXT |

### E2. Backend Person 2 — Payments, shop/inventory, bar, finance, HR, tax
| ID | P | Task | Why | Needs | Files / modules | DB / API impact | Expected result | Testing | DoD |
|---|---|---|---|---|---|---|---|---|---|
| BE2-01 | P0 | **Payments service**: `paymentsService.record({sourceType,sourceId,amount,method,category,memberId,receivedBy})`, numbering, `GET /payments`, ledger invariants (BR-13) | Everyone writes money here | BE1-01,02 | `modules/payments` | `/payments` | Importable function used by bookings/shop/bar/memberships/invoices | unit test: record + list filters | Merged early (**Handoff H-B3**) |
| BE2-02 | P0 | Migration `002_commerce.sql` (C2) + `003_ops.sql` BE2 part (C3: clients…payslips) + functions `place_shop_order`, `cancel_shop_order`, `adjust_stock` | Commerce schema + atomic stock | BE1-02 | `db/migrations/002,003*` | tables C2/C3 | Applied | direct SQL: order 5 when stock 3 → error | Applied on shared DB |
| BE2-03 | P0 | Categories + products CRUD, public catalogue (no exact stock), stock adjust, movements, low-stock list + notification | Scene 3 | 02, BE1-03 | `modules/products` | `/products*`, `/categories*`, `/public/products*` | Catalogue + stock live | smoke; `isLowStock` flips | FE shop pages live |
| BE2-04 | P0 | Shop orders: quote, place (counter/online, pickup/delivery), status machine, pay, cancel/restock, member discount via `discountFor`, payment records | Scene 3 "same shelf" | 03, BE1-05 (helpers), 01 | `modules/shop` | `/shop/orders*` | One shelf for both channels | **race test:** 2 parallel orders for last item → 1 ok, 1 `OUT_OF_STOCK` | Totals/discount/tax correct; cancel restores stock |
| BE2-05 | P1 | Razorpay: create order util, `/payments/razorpay/verify` (HMAC check), optional webhook, hook for bookings/orders/memberships; job `releaseUnpaidOrders` (5 min) | Online pay + auto-release | 04, BE1-08 | `modules/payments`, `config/razorpay.js`, `jobs/releaseUnpaidOrders.js` | `/payments/razorpay/*` | Test-mode pay flips status | bad signature → 400; unpaid order auto-cancelled | Works end-to-end in test mode |
| BE2-06 | P0 | **Bar module**: menu, tables, tabs (open/add items/edit/member attach/move table), kitchen queue + status, settle (cash/card/upi), void, daily summary (`/bar/summary`) | Scene 4 | 02, BE1-05, 01 | `modules/bar` | `/bar/*` | Tabs end-to-end, discount automatic | table double-open → 409; settle mismatch → 422; summary = Σ settled tabs | FE bar POS + kitchen live |
| BE2-07 | P1 | Employees, shifts (CRUD, overlap check, check-in/out), leave requests + decision | Scene 4 shifts + Scene 6 leave | 02, BE1-03 | `modules/employees, shifts, leave` | `/employees`, `/shifts`, `/leave-requests*` | Staff schedule + leave flow | overlapping shift 409; approve flips status | Owner can approve; staff sees own |
| BE2-08 | P1 | Clients + invoices (numbering, items, tax, status, partial/full payments → ledger) | Scene 6 invoice memberships/business clients | 01 | `modules/clients, invoices` | `/clients`, `/invoices*` | Invoice lifecycle | totals math; overpay 422; overdue computed | PDF data complete for FE |
| BE2-09 | P1 | Expenses/payables + `/reports/payables` | "What do we owe" | 02 | `modules/expenses` | `/expenses*`, `/reports/payables` | Owner sees dues | unpaid → paid | Totals match |
| BE2-10 | P2 | Payroll runs/payslips, finalize, mark-paid → salary expense | Scene 6 pay employees | 07, 09 | `modules/payroll` | `/payroll/*` | Month payroll computed | unpaid leave deduction math | Immutable after finalize |
| BE2-11 | P1 | Tax report + CSV exports (`/reports/tax`, `/reports/export/:type`), optional `/reports/email` (P2) | Scene 6 taxes + share numbers | 04, 06, 08, 09 | `modules/reports` (tax/export files) | `/reports/tax`, `/reports/export/*` | Output vs input tax; CSVs open in Excel | known data → known tax | Matches hand calc |
| BE2-12 | P0 | Seed products (5 categories, ~20 SKUs), menu (~15), tables (8), employees, sample payments over 30 days (for a good dashboard demo) | Demo quality | 03,06,07 | `db/seeds/seed.commerce.js` | data | Dashboard looks real | run twice idempotent | Included in `npm run seed` |
| BE2-13 | P0 | Integration support, bug fixing, race/consistency checks, API docs sanity vs contract | Ship | all | – | – | – | contract-vs-impl check script | No contract mismatches |

---

## F. Execution order

Assume build window **UNKNOWN**; timeline in % of window (hours shown for a 36 h assumption). Checkpoints (**CP**) are sync points where both BE persons and FE confirm a working state.

| Step | BE1 | BE2 | Parallel? | Gate |
|---|---|---|---|---|
| 0 (0–4%) | Read docs, agree contract; create repo, Supabase project, env sharing | same | ✔ | **CP0** contract frozen |
| 1 (4–12%) | BE1-01 scaffold → 02 migration → 03 auth | BE2-01 payments service (against BE1-02 schema) → BE2-02 commerce migration | ✔ after 01/02 | **CP1 (~H4):** server runs, auth works, schema applied, FE can log in |
| 2 (12–25%) | 04 seed → 05 members/plans → 06 uploads/settings → 07 courts/availability | 03 products → 04 shop orders | ✔ | **H-B2:** discount helpers merged (BE2-04 starts), **CP2 (~H9)** members + availability + products live |
| 3 (25–45%) | 08 booking engine (critical path) → 09 public API → 11 leads/notifications | 06 bar module (critical path) → 12 seed commerce | ✔ | **CP3 (~H16):** all P0 endpoints live; FE integrating |
| 4 (45–60%) | 13 dashboard | 05 Razorpay, 07 shifts/leave | ✔ (13 needs payments from 04/06) | **CP4 (~H22):** dashboard shows real totals |
| 5 (60–78%) | 10 social, 12 jobs, 14 trial/purchase | 08 invoices, 09 expenses, 11 tax/export | ✔ | **CP5 (~H28):** P1 done |
| 6 (78–90%) | 15 hardening, load/perf, bugs | BE2-10 payroll (P2), 13 consistency checks, bugs | ✔ | Feature freeze ~H31 |
| 7 (90–100%) | Deploy prod, env, CORS/cookie, smoke on prod, demo data | same | ✔ | Demo-ready |

**Critical path:** BE1-01 → 02 → 03 → 05 → 07 → 08 (booking) → 13 (dashboard) and BE2-01 → 02 → 04/06 → 13.
**Handoffs:** H-B1 (auth ready), H-B2 (discount helpers), H-B3 (payments service), H-B4 (all P0 endpoints on shared dev API).
**Rule:** deploy a **staging backend by CP2** so FE tests against a real URL early.

---

## G. Backend testing

Tooling: Postman/Thunder collection in `/server/tests/collection.json` + `jest`+`supertest` for the starred (★) tests. Run `npm test` before each merge to `main`.

| ID | Area | Test | Expected |
|---|---|---|---|
| T-A1 | Auth | login valid / wrong pw / inactive user | 200 + cookie / 401 INVALID_CREDENTIALS / 401 |
| T-A2 | Auth | protected route without cookie; expired token | 401 UNAUTHENTICATED |
| T-A3 | RBAC | member calls `GET /members`; bar_staff calls `POST /invoices`; front_desk calls `PATCH /settings` | 403 FORBIDDEN each |
| T-A4 | Ownership | member A reads member B's booking/order/profile | 403/404 |
| T-M1 | Members | create Gold member → membership active, endDate = start + duration | ✔ |
| T-M2 | Members | Junior with dob 25 yrs ago | 422 JUNIOR_AGE_MISMATCH |
| T-M3 | Members | duplicate phone | 409 PHONE_EXISTS |
| T-M4 | Members | change plan Silver→Gold | old `replaced`, new `active`, one active only |
| T-M5 | Members | lookup `q=aar`/phone/code | ≤10 results < 200 ms |
| T-B1★ | Bookings | **10 parallel** POST same court+slot | exactly 1×201, 9×409 SLOT_TAKEN |
| T-B2★ | Bookings | 18:00 booked → book 18:30 same court | 409 SLOT_TAKEN (overlap) |
| T-B3★ | Bookings | member books 3rd session same day | 422 DAILY_LIMIT_REACHED; cancelled one frees quota |
| T-B4 | Bookings | start 18:15 / outside hours / past / >14 days | 422 INVALID_SLOT / PAST_SLOT |
| T-B5 | Bookings | price: walk-in 600; Silver 30% → 420; Junior 50% → 300; Gold → 0 + `waived` | ✔ |
| T-B6 | Bookings | cancel by member <2h before start | 422 CANCEL_WINDOW_PASSED; staff can |
| T-B7 | Bookings | cancel frees slot → rebook succeeds | ✔ |
| T-B8 | Bookings | expired membership → priced walk-in + warning | ✔ |
| T-B9 | Availability | slot generator: 06:00–22:00 → last start 21:00; booked/past/social states | ✔ |
| T-S1★ | Social | 20 parallel joins on capacity 8 | exactly 8 ✔, 12 × SESSION_FULL |
| T-S2 | Social | regular booking over a social session | 409 SLOT_TAKEN |
| T-P1★ | Shop | 2 parallel orders for last unit | 1 ok, 1 OUT_OF_STOCK; stock never < 0 |
| T-P2 | Shop | member discount applied automatically; tax extracted correctly | totals match calc |
| T-P3 | Shop | cancel pending order | stock restored; movement logged |
| T-P4 | Shop | online unpaid order past hold → job | cancelled + restocked |
| T-P5 | Shop | counter order and online order same SKU | one shelf: both decrement same `stock_qty` |
| T-P6 | Shop | stock crosses threshold | one low-stock notification, none repeated until restock |
| T-P7 | Shop | public catalogue | no `stockQty` in payload |
| T-R1 | Razorpay | verify with bad signature | 400 SIGNATURE_INVALID, nothing marked paid |
| T-R2 | Razorpay | verify twice same payment | idempotent (no duplicate ledger row) |
| T-X1★ | Bar | open 2nd tab on occupied table | 409 TABLE_OCCUPIED |
| T-X2 | Bar | add item unavailable / to settled tab | 409 ITEM_UNAVAILABLE / TAB_CLOSED |
| T-X3 | Bar | attach member → discount; detach → none | ✔ |
| T-X4 | Bar | settle with wrong sum / double settle | 422 AMOUNT_MISMATCH / 409 |
| T-X5 | Bar | kitchen queue ordering & status transitions | oldest first; invalid transition 409 |
| T-X6 | Bar | `/bar/summary` equals Σ settled tab nets by method | ✔ |
| T-L1 | Leads | public enquiry (phone only) | lead + notifications to owner & front_desk + email attempted |
| T-L2 | Leads | enquiry with neither phone nor email | 422 |
| T-L3 | Leads | convert lead | member+membership created, lead `won`; atomic on failure |
| T-F1 | Finance | invoice totals/tax; pay in 2 parts; overpay | paid at full; overpay 422 |
| T-F2 | Finance | overdue computed | status `overdue` after due date |
| T-F3 | Finance | revenue never double counts invoice+item | ✔ |
| T-H1 | HR | overlapping shift; leave approve/reject; staff sees only own | ✔ |
| T-H2 | HR | payroll math with 2 unpaid leave days | `base − 2×base/30` |
| T-D1★ | Reports | seed known payments across cash/card/upi/online & sources | dashboard totals & series match SQL |
| T-D2 | Reports | range=today/week/month boundaries in IST | correct day cut-off (midnight IST) |
| T-V1 | Validation | missing/invalid fields on each POST | 422 with `details[].field` |
| T-V2 | Security | SQL-ish strings, huge payloads, mass-assignment (`role:"owner"` in register) | sanitized / ignored |
| T-V3 | Security | rate limit login 11×/min | 429 |
| T-V4 | Errors | unknown route; unexpected throw | 404 envelope; 500 envelope without stack |

---

## H. Backend AI handoff (use if the current AI hits its limit)

A replacement AI must do this, in order:
1. Read `PROJECT_CONTEXT.md` fully (current task, last completed step, exact next step, "must not change").
2. Read this file §A3 (business rules), §B1 (decisions), §C (schema), and the section of `API_CONTRACT.md` for the module at hand.
3. Run `git log -10`, `git status`, `ls server/src/modules`, open the module being continued and read it **before** writing code. Never recreate files that exist.
4. Know the invariants: (a) money only through `paymentsService.record` → `payments`; (b) stock only through RPC functions; (c) bookings only through `create_booking`; (d) all errors via `AppError` → envelope; (e) club-time conversions only via `utils/clubTime.js`; (f) responses are camelCase, DB is snake_case — map in repo/service layer.
5. Commands: `cd server && npm i && npm run dev` · `npm run seed` · `npm test` · migrations: paste file into Supabase SQL editor (or `npm run migrate` if added — check PROJECT_CONTEXT).
6. Seed logins are listed in `server/README.md` and PROJECT_CONTEXT §Environment.
7. When finishing: tick the task ID in PROJECT_CONTEXT, list files changed, write "Exact next step", note any contract change.
8. If something is unknown (e.g., tax regime, opening hours, sports list) → keep the ASSUMPTION value, do not invent a new one, add to PROJECT_CONTEXT §Open questions.
