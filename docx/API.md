# API.md — The Champions Club API Specification

> **Status:** Design only. No implementation in this file. Everything below is the contract the backend will be built against.
>
> **Derived from:**
> - `Sports_Club_Management_System.pdf` — organiser brief (extracted requirements, §1)
> - Live Postgres schema — 31 tables in `server/src/db/migrations/` (§3 maps every table to its endpoints)
> - Implemented stack — Express + `pg` + Cloudinary + Razorpay + nodemailer
>
> **Relationship to `API_CONTRACT.md`:** that file is the frozen team contract. This file is the *derived design*: it explains which requirement from the PDF produced which endpoint, and records where the live database disagrees with the contract (§9 — these need a decision before coding starts).

---

## Table of contents

1. [Requirement analysis](#1-requirement-analysis)
2. [Business rules](#2-business-rules-br)
3. [Data model → API map](#3-data-model--api-map)
4. [Conventions](#4-conventions)
5. [Endpoints](#5-endpoints)
6. [Cross-cutting flows](#6-cross-cutting-flows)
7. [Background jobs](#7-background-jobs)
8. [Endpoint index](#8-endpoint-index)
9. [Open questions and schema conflicts](#9-open-questions-and-schema-conflicts)

---

## 1. Requirement analysis

Each row traces a sentence in the organiser PDF to the capability it demands and the modules that serve it.

| # | PDF requirement | Capability | Modules |
|---|---|---|---|
| R1 | "Someone signs up at the front desk… which plan (Gold, Silver, Junior), and what that plan entitles them to, from court rates to discounts at the shop and bar" | Member + plan + membership lifecycle; plan entitlements drive pricing everywhere | 5.4, 5.5, 5.6, 5.7, 5.9 |
| R2 | "Their membership will run out one day, and nobody should have to remember when" | Expiry tracking, `daysLeft`, reminder notifications | 5.4, 7.2, 7.4 |
| R3 | "Any member of staff should be able to recognise them quickly and see their history" | Member lookup, member profile with stats, history feed | 5.6 |
| R4 | "Sessions last an hour, a new slot opens every half hour, and each member can play at most twice a day" | Availability grid, booking rules, daily cap | 5.8, 2 BR-2/BR-3/BR-4 |
| R5 | "Members pay less than walk-ins, or nothing at all, depending on their plan" | Plan-discounted pricing with server-authoritative totals | 2 BR-6, 5.8, 5.7, 5.9 |
| R6 | "On Friday night the courts open up for social play where many people share one court" | Social sessions with capacity and per-head pricing | 5.9 |
| R7 | "Two people must never end up on the same court at the same time" | Overlap exclusion at the database level | 2 BR-1, 7.1 |
| R8 | "A member's racket string snaps… wants new shoes and would rather order from home and collect, or have them delivered" | Shop catalogue + online orders with pickup/delivery | 5.7 |
| R9 | "It should always know what is in stock and when something is running low" | Stock ledger, low-stock detection and alerting | 5.7, 7.3 |
| R10 | "What a member buys at the counter and what they order from their sofa come from the same shelf" | One inventory, atomic decrement on every channel | 5.7, 2 BR-8 |
| R11 | "Twenty people arrive at once. Orders are scribbled on paper, tabs get lost" | Bar tabs, items, live kitchen display | 5.9 |
| R12 | "Members expect their discount without having to ask" | Automatic plan discount on bar tabs | 5.9, 2 BR-6 |
| R13 | "Some would rather run a tab and settle up before they leave" | Open tab → settle with one or split payments | 5.9 |
| R14 | "Guests pay by cash, card or UPI… tables need to be tracked" | Payment methods, bar table tracking | 5.10, 5.9 |
| R15 | "At closing time the owner wants to know what the bar actually earned that day" | Daily bar summary | 5.9 |
| R16 | "If they could see the club, its plans and prices, what is free this week, and what the shop sells" | Public endpoints, no login | 5.2 |
| R17 | "They might book a trial session on the spot" | Public trial booking | 5.2 |
| R18 | "That enquiry should not vanish. Follow up, send a quote, welcome a new member" | Leads, activities, quotes, conversion | 5.11 |
| R19 | "How much did we earn, from where, and what do we owe?" | Revenue and payables reporting | 5.12 |
| R20 | "Money arrives from courts, the shop and the bar, by card, cash and online, and today none of it is in one place" | Single payments ledger | 5.10, 2 BR-9 |
| R21 | "There are memberships and business clients to invoice, employees to pay, leave to approve, taxes to report" | Clients, invoices, expenses, HR, payroll, tax | 5.12, 5.13 |
| R22 | "See how the club is doing today, this week and this month, and share the numbers" | Dashboard, CSV export, email report | 5.12 |

### Tiers from the brief

| Tier | Court | Shop | Bar | Bookings/day | Age |
|---|---|---|---|---|---|
| **Gold** | Free | 15% off | 15% off | 2 | any |
| **Silver** | 50% off | 10% off | 10% off | 2 | any |
| **Junior** | 50% off | 10% off | 10% off | 2 | **under 18** |

> **ASSUMPTION** — the brief names the three tiers but not their numbers. The percentages above are placeholders; the owner must confirm. They live in `plans.court_discount_pct` / `shop_discount_pct` / `bar_discount_pct` so they are editable, not hardcoded.

---

## 2. Business rules (BR)

These are **invariants**, not endpoints. Each is enforced server-side and, where the database can guarantee it, in SQL.

| ID | Rule | Enforced by |
|---|---|---|
| **BR-1** | A court is never double-booked for overlapping times | `EXCLUDE USING gist` constraint on `bookings` (§7.1) — the database rejects the insert, no application race |
| **BR-2** | Sessions are 60 minutes | `settings.sessionMinutes` (default 60); `end_at` derived from `start_at`, never client-supplied |
| **BR-3** | Slots start on :00 and :30 | `settings.slotMinutes` (default 30); validated server-side |
| **BR-4** | A member may hold at most 2 bookings per day | Counted in the booking transaction; `422 DAILY_LIMIT_REACHED` |
| **BR-5** | A member cannot hold two overlapping bookings | Checked in the same transaction that inserts |
| **BR-6** | Price is computed from the plan, never from the client | `quote_*` SQL functions return the authoritative amount; the client only sends ids |
| **BR-7** | A member cannot book for a lapsed membership | Treated as walk-in, response carries `warnings: ["MEMBERSHIP_EXPIRED"]` |
| **BR-8** | One stock pool for counter and online | `products.stock_qty` decremented atomically; `stock_movements` is an append-only audit ledger |
| **BR-9** | Every rupee of income is in one ledger | All revenue funnels into `payments`; reports read only from it |
| **BR-10** | Junior plan requires age < 18, and vice-versa | Checked against `members.dob` on purchase and renew |
| **BR-11** | Tax-exclusive arithmetic, stored to 2dp | All amounts `numeric(10,2)`; computed in SQL, never in JavaScript floats |
| **BR-12** | An expired or cancelled document is immutable | Status transitions validated against an allowed-transition map |

---

## 3. Data model → API map

All 31 tables, and where each is read or written. Every table is reachable through at least one endpoint.

| # | Table | Read by | Written by |
|---|---|---|---|
| 1 | `users` | auth, member profile (linked) | auth register/login, staff CRUD |
| 2 | `settings` | everything (rates, windows, tax) | owner settings PATCH |
| 3 | `plans` | public, pricing, memberships | owner CRUD |
| 4 | `members` | member list, booking, shop, bar, invoices | member CRUD |
| 5 | `memberships` | pricing, expiry, member profile | purchase, renew, cancel |
| 6 | `courts` | availability, booking, public | owner CRUD |
| 7 | `bookings` | availability, reports, history | create, cancel, status, pay |
| 8 | `booking_participants` | social sessions | join, leave |
| 9 | `payments` | every report, bar, shop, finance | record, verify, settle |
| 10 | `notifications` | bell, alerts | jobs, CRM events |
| 11 | `product_categories` | shop browse | owner CRUD |
| 12 | `products` | catalogue, orders | CRUD, stock adjust |
| 13 | `stock_movements` | product history | stock adjust, order create/cancel |
| 14 | `shop_orders` | order list, member history | create, status, cancel |
| 15 | `shop_order_items` | order detail | order create |
| 16 | `menu_items` | bar menu, kitchen | owner/FD CRUD, availability toggle |
| 17 | `bar_tables` | floor view | owner CRUD |
| 18 | `bar_tabs` | tab list, bar summary | open, attach, settle, void |
| 19 | `bar_order_items` | tab detail, kitchen display | add, edit qty, cancel, kitchen status |
| 20 | `leads` | CRM pipeline, follow-ups | public enquiry, staff CRUD, convert |
| 21 | `lead_activities` | lead timeline | add activity |
| 22 | `quotes` | lead detail | create quote |
| 23 | `clients` | invoices | owner CRUD |
| 24 | `invoices` | finance, dashboard | create, status, payment |
| 25 | `invoice_items` | invoice detail | invoice create |
| 26 | `expenses` | payables, payroll mark-paid | CRUD, pay |
| 27 | `employees` | HR, shifts, payroll | owner CRUD |
| 28 | `shifts` | roster, attendance | CRUD, check-in/out |
| 29 | `leave_requests` | approvals | request, decision |
| 30 | `payroll_runs` | payroll | create, finalise, mark paid |
| 31 | `payslips` | payroll | run create, edit (draft) |

**Deliberately no endpoint:** `schema_migrations` — written only by `npm run db:migrate`.

---

## 4. Conventions

### Base

| Item | Rule |
|---|---|
| Base URL | `{API_URL}/api/v1` |
| Format | JSON, UTF-8 · uploads `multipart/form-data` |
| IDs | UUID strings |
| Naming | camelCase in JSON, snake_case only in the database |

### Auth

JWT in an **httpOnly cookie `cc_token`**, 7 days, `SameSite=Lax`. `Authorization: Bearer <jwt>` also accepted for Postman and mobile.

The **role is read from the database on every authenticated request**, not trusted from the token. A token that claims `admin` while the row says `member` gets `member`. That costs one indexed lookup per request and buys immediate revocation: demoting or disabling a person takes effect at once rather than whenever their token happens to expire.

> Enforced in `server/src/middlewares/auth.js`. Covered by the “a token claiming admin is ignored” test.

### Roles

Five operational roles, mirroring how the club actually divides work.

| Role | Areas | Notes |
|---|---|---|
| `admin` | everything | manages staff accounts and settings; the only role that touches finance and HR |
| `cafe_manager` | bar, kitchen, tables | cannot open a shift or view payroll |
| `court_manager` | courts, availability, bookings, social sessions | |
| `shop_manager` | products, stock, shop orders | |
| `member` | own bookings, orders, tabs, membership | |

Single source of truth: `server/src/config/roles.js`, mirrored by the `users_role_check` constraint in `004_auth_roles.sql`.

Reusable guards: `staffOnly` (any of the four staff roles), `managerOnly` (the three managers + admin), `adminOnly`.

### Email verification

Members confirm their address with a 6-digit code before member-only actions work.

| Rule | Detail |
|---|---|
| Code | 6 digits, random, `crypto.randomInt` (not `Math.random`) |
| Storage | SHA-256 hash only — a leaked table snapshot cannot be replayed |
| Comparison | `timingSafeEqual`, so a wrong code cannot be found by timing |
| Lifetime | 10 min (`EMAIL_CODE_TTL_MINUTES`) |
| Single-use | consumed on success; a partial unique index keeps at most one live code per user |
| Resend throttle | one code per 60s per user → `429` with the wait time in the message |
| Attempt limit | 5 wrong guesses, then the code is burned and a new one is needed |
| Staff exemption | managers and admins are created by the club and skip verification |

Requesting a code supersedes any earlier one, so “click send twice” never leaves two valid codes.

> A failed send never fails the request: `POST /auth/email/send-code` returns `200 { sent: false, reason }` and the user can retry. A broken mail server must not look like a broken signup.

### Money

INR, `numeric(10,2)`, sent as JSON numbers with 2 decimals. **Tax-exclusive** arithmetic: tax is added on top. All totals are computed in SQL by the `quote_*` functions; the client sends product/court/plan ids and never a price.

### Time

Instants are ISO-8601 UTC (`2026-10-09T12:30:00.000Z`). Calendar dates are `YYYY-MM-DD`. The club runs on `Asia/Kolkata`; slots are generated in club time and displayed in club time. A slot is identified by its **start instant** — `end_at` is always derived.

### Envelopes

Success:
```json
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 20, "total": 57, "totalPages": 3 } }
```
`meta` only on paginated lists.

Error:
```json
{
  "success": false,
  "error": {
    "code": "SLOT_TAKEN",
    "message": "Court 2 is already booked for 18:00–19:00.",
    "details": [ { "field": "startAt", "message": "Not a valid slot boundary" } ]
  },
  "warnings": []
}
```
`warnings` is non-blocking — the request succeeded but something needs the user's attention (expired membership, nearing stock).

### Status codes

`200` ok · `201` created · `400` malformed · `401` unauthenticated · `403` forbidden · `404` not found · `409` conflict · `422` business-rule failure · `429` rate limited · `500` server error.

**409 vs 422** matters and is easy to get wrong: **409** means the request is well-formed but clashes with current state (slot taken, out of stock, illegal status move). **422** means the request is well-formed and the state is fine, but a rule rejects it (past slot, daily cap, bad amount).

### Pagination

`?page=1&limit=20`, `limit` capped at 100.

---

## 5. Endpoints

Auth shorthand: **public** = no login · **member** = the member's own rows only · **staff** = front desk, bar staff, owner · **FD+** = front desk + owner · **owner** = owner only.

### 5.1 Auth

| Method | Path | Auth | Request | Response `data` | Errors |
|---|---|---|---|---|---|
| POST | `/auth/register` | public | B: `name, email, phone, password(≥8), dob?` | `{ user, token, emailCodeSent }` + sets cookie. Fires the first verification code | 409 `EMAIL_EXISTS`, 422 |
| POST | `/auth/login` | public | B: `email, password` | `{ user, token, needsEmailVerification }` + cookie | 401 `INVALID_CREDENTIALS`, 429 |
| POST | `/auth/logout` | any | – | `{}`, clears cookie | – |
| GET | `/auth/me` | any | – | `{ user, member?, membership? }` | 401, 403 if deactivated |
| PATCH | `/auth/password` | any | B: `currentPassword, newPassword` | `{}` | 401, 422 |
| POST | `/auth/forgot-password` | public | B: `email` | `{}` always (never leaks whether the email exists) | – |
| POST | `/auth/reset-password` | public | B: `token, newPassword` | `{}` | 422 |

Registration creates a `users` row **and** a `members` row in one transaction — a login always has a member profile, so no orphan accounts exist.

#### Email verification

All four require a signed-in user. Base path `/auth/email`.

| Method | Path | Request | Response `data` | Errors |
|---|---|---|---|---|
| POST | `/send-code` | – | `{ sent, expiresInMinutes }` — `reason` instead of `sent` if mail failed | 400 already verified, 429 `CODE_ALREADY_SENT` |
| POST | `/resend` | – | same as `send-code`; a clearer name for the client | 400, 429 |
| POST | `/verify` | B: `code` (exactly 6 digits) | `{ verified: true }` or `{ alreadyVerified: true }` | 400 `INVALID_CODE` (wrong, expired, or none active) |
| GET | `/status` | – | `{ isEmailVerified, verifiedAt, lastSentAt, hasActiveCode, resendAvailableInSeconds }` | 401 |

`resendAvailableInSeconds` lets the UI start a countdown instead of the user discovering the limit by hitting it.

Member-only endpoints additionally pass through `requireVerifiedEmail`, which returns `403` with a `details` entry pointing at verification. Staff roles skip the gate — they were created by the club, not self-signed-up.

### 5.2 Public — no login

Never returns PII, never returns exact stock quantities.

| Method | Path | Request | Response `data` | Notes |
|---|---|---|---|---|
| GET | `/public/club` | – | `{ name, about, address, phone, email, hours, sports[], timezone, socialDay }` | from `settings` |
| GET | `/public/plans` | – | `Plan[]` | active only |
| GET | `/public/courts` | – | `[{ id, name, sport, walkInRate, imageUrl }]` | no internal rates |
| GET | `/public/availability` | Q: `from, days(≤14), sport?` | `{ days: [{ date, courts: [{ courtId, freeSlots[], socialSessions[] }] }] }` | times `HH:mm` club tz |
| GET | `/public/categories` | – | `[{ id, name }]` | |
| GET | `/public/products` | Q: `category?, q?, minPrice?, maxPrice?, page, limit` | `Product[]` **`stockQty` stripped** | `inStock` boolean only |
| GET | `/public/products/:id` | – | `Product` | same stripping |
| POST | `/public/enquiries` | B: `name, phone?\|email?, interest, planId?, sport?, preferredDate?, message?` | `201 { id, status:"new" }` | creates lead + notifies staff (in-app + email) |
| POST | `/public/trial-bookings` | B: `name, phone, email?, courtId, startAt` | `201 { booking, leadId }` | guest booking, unpaid, pay at club |

### 5.3 Settings & uploads

| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | `/settings` | staff | – | opening hours, slot/session minutes, booking window, cancel cutoff, social window, tax rates, delivery fee | – |
| PATCH | `/settings` | owner | B: any subset | updated settings | 422 |
| POST | `/uploads/image` | any | multipart `file` (≤3 MB jpg/png/webp) | `{ url, publicId, width, height, format, bytes }` | 400 bad mime/size |
| DELETE | `/uploads/:publicId` | staff | – | `{}` | 404 |
| GET | `/health` | public | – | `{ status:"ok", db:"up", uptime }` | – |

> `health` pings the database so it proves the pool works, not just that the process is alive.

### 5.4 Plans

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/plans` | any | Q: `includeInactive?` | `Plan[]` |
| POST | `/plans` | owner | B: `code, name, description?, price, durationDays, courtDiscountPct, shopDiscountPct, barDiscountPct, maxBookingsPerDay?, perks[], isActive?` | `201 Plan` |
| PATCH | `/plans/:id` | owner | B: partial | `Plan` |
| DELETE | `/plans/:id` | owner | – | deactivates (`is_active=false`) — never hard-deletes a plan that memberships reference |

### 5.5 Memberships

| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| POST | `/members/:id/memberships` | FD+ | B: `planId, startDate?, paymentMethod` | `201 { membership, payment? }` | 409 `MEMBER_OVERLAP`, 422 `JUNIOR_AGE_MISMATCH` |
| GET | `/memberships/:id` | staff; member own | – | `Membership` | 404 |
| PATCH | `/memberships/:id/cancel` | FD+ | B: `reason?` | `Membership` | 409 `INVALID_TRANSITION` |
| GET | `/memberships/expiring` | staff | Q: `days=7` | `{ memberships[], members[] }` | – |
| POST | `/me/membership/purchase` | member | B: `planId` | `201 { membership(status:"pending"), payment:{ razorpayOrderId, amount, keyId } }` | 422 |

Renewal marks the current membership `replaced` with `end_date = start_date - 1 day`. **No proration** — ASSUMPTION, the brief does not mention it.

### 5.6 Members

| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | `/members` | staff | Q: `q?, planCode?, status?(active\|expired\|none), expiringInDays?, page, limit` | `Member[]` with `currentMembership` + meta | – |
| GET | `/members/lookup` | staff | Q: `q` (≥2 chars) | top 10 `Member[]` | – |
| POST | `/members` | FD+ | B: `fullName, phone, email?, dob?, address?, emergencyContact?, photoUrl?, planId, startDate?, paymentMethod, createLogin?` | `201 { member, membership, payment?, tempPassword? }` | 409 `PHONE_EXISTS`, 422 `JUNIOR_AGE_MISMATCH` |
| GET | `/members/:id` | staff; member own | – | `{ member, currentMembership, stats:{ totalBookings, totalSpend, lastVisitAt } }` | 404 |
| PATCH | `/members/:id` | FD+; member own (limited fields) | B: partial | `Member` | 422 |
| GET | `/members/:id/history` | staff; member own | Q: `type?(booking\|shop\|bar\|payment\|membership), page, limit` | `[{ type, id, at, title, amount, status }]` newest first + meta | – |
| POST | `/members/:id/photo` | FD+ | multipart `image` | `{ member }` — uploads to Cloudinary, replaces and deletes the old asset | 400 |
| DELETE | `/members/:id` | owner | – | `{}` (soft — FK from `bookings` is `ON DELETE SET NULL`, history is kept) | 404 |

### 5.7 Shop & inventory

| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | `/categories` | any | – | `[{ id, name }]` | – |
| POST/PATCH | `/categories`, `/categories/:id` | owner | B: `name` | category | 409 |
| GET | `/products` | staff | Q: `q?, categoryId?, lowStock?, includeInactive?, page, limit` | `Product[]` **with** `stockQty` + meta | – |
| POST | `/products` | FD+ | B: `sku, name, categoryId, brand?, price, taxRatePct?, stockQty, lowStockThreshold?, imageUrl?` | `201 Product` | 409 duplicate sku |
| PATCH | `/products/:id` | FD+ | B: partial | `Product` | 422 |
| DELETE | `/products/:id` | owner | – | `isActive=false` | 404 |
| POST | `/products/:id/stock` | FD+ | B: `delta(≠0), reason(purchase\|restock\|sale\|return\|damage\|expire\|adjustment), note?` | `{ product, movement }` | 422 if it would go negative |
| GET | `/products/low-stock` | FD+ | – | `Product[]` where `stockQty ≤ threshold` | – |
| GET | `/products/:id/movements` | FD+ | Q: page | stock ledger entries | – |
| POST | `/shop/orders/quote` | member, FD+ | B: `items:[{productId, qty}], fulfilment?, memberId?` | `{ lines[], subtotal, discountPct, discount, taxAmount, deliveryFee, total }` | 409 `OUT_OF_STOCK` |
| POST | `/shop/orders` | member, FD+ | B: `items[], fulfilment, memberId?, customerName?, customerPhone?, deliveryAddress?, paymentMethod` | `201 { order, payment? }` | 409 `OUT_OF_STOCK`, 422 |
| GET | `/shop/orders` | FD+ | Q: `status?, channel?, from?, to?, q?, page, limit` | `ShopOrder[]` + meta | – |
| GET | `/shop/orders/mine` | member | Q: page | `ShopOrder[]` + meta | – |
| GET | `/shop/orders/:id` | FD+; member own | – | `ShopOrder` with items | 404 |
| PATCH | `/shop/orders/:id/status` | FD+ | B: `status` | `ShopOrder` | 409 `INVALID_TRANSITION` |
| POST | `/shop/orders/:id/pay` | FD+ | B: `method(cash\|card\|upi)` | `{ order, payment }` | 409 |
| PATCH | `/shop/orders/:id/cancel` | member (own, pending only), FD+ | B: `reason?` | `ShopOrder` — **stock restored** | 409 |

**Order status machine** (enforced, not documented-and-hoped):

```
in_store : pending → confirmed → ready → completed
delivery : pending → confirmed → out_for_delivery → completed
any      : (non-completed) → cancelled     [stock returned]
```

> **Schema conflict** — the live `shop_orders.status` enum has `packed`, `delivered`, `returned`; this machine uses `ready`/`completed`. See §9.2.

`quote` is what the cart calls — it prices a basket **without touching stock**, so a shopper can refresh price and availability safely before committing.

### 5.8 Courts, availability, bookings

| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | `/courts` | any | Q: `includeInactive?` | `Court[]` | – |
| POST/PATCH | `/courts`, `/courts/:id` | owner | B: `name, sport, ratePerHour, isActive?, imageUrl?` | `Court` | 409 |
| GET | `/courts/availability` | any | Q: `date, sport?, courtId?, memberId?(staff)` | `{ date, slotMinutes, durationMinutes, courts:[{ court, slots: Slot[] }] }` | 422 |
| POST | `/bookings` | member, FD+ | B: `courtId, startAt, memberId?(staff), guest?:{name,phone}, paymentMethod?` | `201 { booking, payment? }` | 409 `SLOT_TAKEN`, 409 `MEMBER_OVERLAP`, 422 `DAILY_LIMIT_REACHED`/`INVALID_SLOT`/`PAST_SLOT` |
| GET | `/bookings` | staff; member auto-scoped | Q: `date?, from?, to?, courtId?, memberId?, status?, page, limit` | `Booking[]` + meta | – |
| GET | `/bookings/mine` | member | Q: `upcoming?` | `Booking[]` | – |
| GET | `/bookings/:id` | staff; member own | – | `Booking` | 404 |
| PATCH | `/bookings/:id/cancel` | member (own), FD+ | B: `reason?` | `Booking` | 422 `CANCEL_WINDOW_PASSED`, 409 |
| PATCH | `/bookings/:id/pay` | FD+ | B: `method` | `{ booking, payment }` | 409 |
| PATCH | `/bookings/:id/status` | FD+ | B: `status(completed\|no_show)` | `Booking` | 409 |

`Slot`:
```json
{
  "start": "2026-10-09T12:30:00.000Z",
  "end":   "2026-10-09T13:30:00.000Z",
  "state": "available | booked | social | closed | past",
  "price": 300.00,
  "discountPct": 50,
  "bookingId": null,
  "social": { "sessionId": "uuid", "capacity": 8, "joined": 5, "spotsLeft": 3 }
}
```
`bookingId` is **staff-only** — exposing it publicly would leak that a court is busy and who is on it.

Availability is priced **for the caller**: a Gold member sees `0.00`, a Silver member sees 50% off, an anonymous visitor sees the walk-in rate. Same endpoint, different numbers, because `memberId` resolves server-side from the session.

### 5.9 Social play (Friday night)

| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | `/social-sessions` | any | Q: `date?` or `from?,to?` | `SocialSession[]` — participants staff-only | – |
| POST | `/social-sessions` | FD+ | B: `courtId, startAt, endAt?(+60m), capacity, pricePerHead, title?` | `201 SocialSession` | 409 `SLOT_TAKEN` |
| POST | `/social-sessions/generate` | FD+ | B: `date, courtIds[], windowStart, windowEnd, capacity, pricePerHead` | `{ created[], skipped:[{courtId,start,reason}] }` | – |
| POST | `/social-sessions/:id/join` | member, FD+ | B: `memberId?(staff), guest?:{name}, paymentMethod?` | `201 { participant, payment? }` | 409 `SESSION_FULL`/`ALREADY_JOINED`, 422 `DAILY_LIMIT_REACHED` |
| DELETE | `/social-sessions/:id/participants/:pid` | member own, FD+ | – | `{}` | 404 |
| PATCH | `/social-sessions/:id/cancel` | FD+ | B: `reason?` | `SocialSession` — all participants refunded | 409 |

`generate` is the "Friday night is busy" button: create a run of shared sessions across courts and a time window in one call, and get back what was **not** created and why (court already booked) rather than failing the whole batch.

### 5.10 Bar & café

| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | `/bar/menu` | staff | Q: `category?, available?` | `MenuItem[]` | – |
| POST | `/bar/menu` | owner, FD+ | B: `name, category, price, taxRatePct?, station, imageUrl?` | `201` item | 409 duplicate name+category |
| PATCH | `/bar/menu/:id` | owner, FD+; bar staff may only flip `isAvailable` | B: partial | item | 403 |
| GET | `/bar/tables` | staff | – | `[{ id, label, seats, status:"free"\|"occupied", currentTabId }]` | – |
| POST/PATCH | `/bar/tables`, `/bar/tables/:id` | owner | B: `label, seats, isActive` | table | 409 |
| POST | `/bar/tabs` | staff | B: `tableId?, memberId?, guestName?` | `201 BarTab` | 409 `TABLE_OCCUPIED` |
| GET | `/bar/tabs` | staff | Q: `status?(open), date?, tableId?, memberId?` | `BarTab[]` | – |
| GET | `/bar/tabs/:id` | staff | – | `BarTab` with live totals | 404 |
| POST | `/bar/tabs/:id/items` | staff | B: `items:[{menuItemId, qty, notes?}]` | `BarTab` | 409 `ITEM_UNAVAILABLE`/`TAB_CLOSED` |
| PATCH | `/bar/tabs/:id/items/:itemId` | staff | B: `qty?` or `cancel:true` (only while `new`) | `BarTab` | 409 |
| PATCH | `/bar/tabs/:id/member` | staff | B: `memberId \| null` | `BarTab` — discount recalculated | – |
| PATCH | `/bar/tabs/:id/table` | staff | B: `tableId \| null` | `BarTab` | 409 `TABLE_OCCUPIED` |
| POST | `/bar/tabs/:id/settle` | staff | B: `payments:[{method, amount}]` | `BarTab` — settled, table freed | 422 `AMOUNT_MISMATCH` |
| POST | `/bar/tabs/:id/void` | owner, FD+ | B: `reason` | `BarTab` | 409 |
| GET | `/bar/kitchen` | staff | Q: `status?(new,preparing), station?` | `[{ itemId, name, qty, notes, tabId, tableLabel, placedAt, kitchenStatus, station }]` oldest first | – |
| PATCH | `/bar/items/:itemId/kitchen-status` | staff | B: `status` | item | 409 |
| GET | `/bar/summary` | staff | Q: `date` | `{ date, tabsCount, voidedCount, gross, discounts, tax, net, byMethod{}, byStaff[], topItems[] }` | – |

**Bar status machine:**
```
tab   : open → settled | void        (settled/void are terminal)
item  : new → preparing → ready → served
                          ↘ cancelled   (only while still `new`)
table : occupied while an open tab points at it; freed on settle or void
```

`PATCH /bar/tabs/:id/items/:itemId` can only cancel while `kitchenStatus = new` — once the kitchen has started, the kitchen cancels it, not the counter. That rule prevents a drink being struck off after it is made.

Member discount is applied automatically when a `memberId` is attached. Staff never type a discount.

### 5.11 Payments

| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| POST | `/payments/order` | member, FD+ | B: `sourceType, sourceId` | `{ razorpayOrderId, amount, currency:"INR", keyId }` | 422 |
| POST | `/payments/verify` | member, FD+ | B: `razorpayOrderId, razorpayPaymentId, razorpaySignature` | `{ payment, source }` — marks booking/order/membership paid | 400 `SIGNATURE_INVALID` |
| POST | `/payments/webhook` | public (HMAC header) | Razorpay payload | `200` | – |
| GET | `/payments` | FD+ | Q: `from?, to?, method?, sourceType?, revenueCategory?, page, limit` | `Payment[]` + meta | – |
| GET | `/payments/:id` | FD+ | – | `Payment` | 404 |

**Webhook vs verify:** `/verify` is the happy path — the browser returns and we confirm. The webhook is the safety net for when the browser closes mid-payment. It is **idempotent**: verifying the same payment twice updates the existing row rather than inserting a second one, because a double-charged member is a support call.

### 5.12 CRM, finance, reports

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/leads` | FD+ | Q: `status?, assignedTo?, interest?, q?, page, limit` | `Lead[]` + meta |
| POST | `/leads` | FD+ | B: enquiry fields + `source(walk_in\|phone\|referral)` | `201 Lead` |
| GET | `/leads/:id` | FD+ | – | `{ lead, activities[], quotes[] }` |
| PATCH | `/leads/:id` | FD+ | B: `status?, assignedTo?, followUpAt?` | `Lead` |
| GET | `/leads/follow-ups` | FD+ | Q: `due(today\|overdue)` | `Lead[]` |
| POST | `/leads/:id/activities` | FD+ | B: `type, text, followUpAt?` | `201 activity` |
| POST | `/leads/:id/quotes` | FD+ | B: `planId?, amount, validUntil, notes?, sendEmail?` | `201 quote` — lead → `quoted`, emails if it has an address |
| POST | `/leads/:id/convert` | FD+ | B: `planId, startDate?, paymentMethod` | `201 { member, membership, payment? }` — lead → `won` |
| GET/POST/PATCH | `/clients`, `/clients/:id` | owner | B: `name, contactPerson?, email?, phone?, gstNo?, address?` | `Client` |
| GET | `/invoices` | owner | Q: `status?, category?, clientId?, from?, to?, page` | `Invoice[]` (+ computed `overdue`) + meta |
| POST | `/invoices` | owner | B: `clientId\|memberId, category, issueDate, dueDate, items[], notes?` | `201 Invoice` |
| GET | `/invoices/:id` | owner | – | `Invoice` + `payments[]` |
| PATCH | `/invoices/:id/status` | owner | B: `status(sent\|void)` | `Invoice` |
| POST | `/invoices/:id/payments` | owner | B: `method, amount(≤balance), paidAt?` | `{ invoice, payment }` |
| GET | `/expenses` | owner | Q: `status?, category?, from?, to?, page` | `Expense[]` + meta |
| POST/PATCH | `/expenses`, `/expenses/:id` | owner | B: `vendor, category, description?, amount, taxAmount?, dueDate` | `Expense` |
| PATCH | `/expenses/:id/pay` | owner | B: `method, paidAt?` | `Expense` |
| GET | `/reports/dashboard` | owner (FD+ limited) | Q: `range(today\|week\|month)` | see below |
| GET | `/reports/revenue` | owner | Q: `from, to, groupBy(day\|source\|method)` | `[{ key, amount, count }]` |
| GET | `/reports/tax` | owner | Q: `from, to` | `{ outputTax[], inputTax, netPayable, byCategory[] }` |
| GET | `/reports/payables` | owner | – | `{ totalDue, overdueAmount, byCategory[], items[] }` |
| GET | `/reports/export/:type` | owner | Q: `from, to, format=csv` | CSV download |
| POST | `/reports/email` | owner | B: `type, from, to, toEmail` | `{}` |

**Lead pipeline** — the enquiry from the PDF must not vanish:
```
new → contacted → quoted → negotiation → won
                  ↓
                 lost
```
`won` requires `POST /leads/:id/convert`, which creates the member, the membership and the first payment in one transaction and back-links `leads.converted_member_id`. A lead can only be converted once.

`/reports/dashboard`:
```jsonc
{
  "range": { "from": "2026-10-01", "to": "2026-10-31" },
  "revenue": {
    "total": 412300.00,
    "bySource": { "court": 120000, "shop": 90000, "bar": 75000, "membership": 110000, "corporate": 17300 },
    "byMethod": { "cash": 150000, "card": 120000, "upi": 100000, "online": 42300 },
    "series": [ { "date": "2026-10-01", "total": 12000, "court": 3000, "shop": 2000, "bar": 1500, "membership": 5500 } ]
  },
  "compare": { "previousTotal": 380000, "changePct": 8.5 },
  "bookings": { "count": 420, "utilisationPct": 61.4, "cancelled": 22 },
  "members":  { "active": 210, "newInRange": 18, "expiringIn7Days": 9 },
  "alerts":   { "lowStockCount": 4, "openLeads": 7, "overdueFollowUps": 2, "pendingLeave": 1, "payablesDue": 58000, "overdueInvoices": 2 }
}
```
Revenue is `sum(payments.amount) where status='paid'` in range, refunds excluded. **Every figure traces to the one ledger** — there is no second place where money is counted (BR-9).

### 5.13 HR

| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET/POST/PATCH | `/employees`, `/employees/:id` | owner | B: `fullName, title, phone?, email?, baseSalary, joinedOn, userId?, status?` | `Employee` | 422 |
| GET | `/shifts` | staff (own); owner (all) | Q: `from, to, employeeId?` | `Shift[]` | – |
| POST/PATCH/DELETE | `/shifts`, `/shifts/:id` | owner, FD+ | B: `employeeId, date, startTime, endTime, area` | `Shift` | 409 overlapping |
| POST | `/shifts/:id/check-in` · `/check-out` | staff (own shift) | – | `Shift` | 409 |
| POST | `/leave-requests` | staff | B: `type, fromDate, toDate, reason?` | `201 LeaveRequest { days, status:"pending" }` | 422 |
| GET | `/leave-requests/mine` | staff | – | `LeaveRequest[]` | – |
| GET | `/leave-requests` | owner | Q: `status?, employeeId?, page` | `LeaveRequest[]` + meta | – |
| PATCH | `/leave-requests/:id/decision` | owner | B: `decision(approved\|rejected), note?` | `LeaveRequest` | 409 |
| GET | `/payroll/runs` · `/payroll/runs/:id` | owner | – | run list / `{ run, payslips[] }` | 404 |
| POST | `/payroll/runs` | owner | B: `month("2026-10")` | `201 { run, payslips[] }` | 409 exists |
| PATCH | `/payroll/payslips/:id` | owner (draft only) | B: `allowances?, deductions?` | `Payslip` | 409 |
| POST | `/payroll/runs/:id/finalize` · `/mark-paid` | owner | B (mark-paid): `method` | `{ run }` | 409 |

Payroll formula: `net = base + allowances − deductions − (unpaidLeaveDays × base ÷ 30)`. ASSUMPTION — the brief says "employees to pay" and nothing about the formula. One payslip per employee per run is enforced by a unique constraint.

Marking payroll paid writes an `expenses` row of category `salary`, so payroll shows up in payables without a second code path.

### 5.14 Notifications

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/notifications` | any | Q: `unread?, page, limit` | `Notification[]` + `meta.unreadCount` |
| PATCH | `/notifications/:id/read` | any | – | `{}` |
| POST | `/notifications/read-all` | any | – | `{}` |

Notification types: `new_lead`, `low_stock`, `membership_expiring`, `leave_request`, `payment`, `booking`, `system`.

---

## 6. Cross-cutting flows

### 6.1 Booking a court

```
Client                API                          Postgres
  │  GET /courts/availability?date=…               │
  │ ───────────────────────────────────────────────►│  sessions + slots + overlap check
  │ ◄─────────────────────────────────────────────── │
  │  POST /bookings { courtId, startAt }           │
  │ ───────────────────────────────────────────────►│  BEGIN
  │                                                │   member's plan → discount
  │                                                │   daily cap (BR-4)
  │                                                │   member overlap (BR-5)
  │                                                │   INSERT booking  ← EXCLUDE rejects overlap (BR-1)
  │                                                │   quote_* computes price (BR-6)
  │ ◄─────────────────────────────────────────────── │  COMMIT  { booking, payment? }
  │  open Razorpay → POST /payments/verify          │
  │ ───────────────────────────────────────────────►│  HMAC check → payments row → booking.paid
```

Any step fails, the transaction rolls back and no half-booking exists.

### 6.2 Expiring memberships

`node-cron` at 09:00 IST → find `memberships` with `status='active'` and `end_date` in 7 days → email member + notify front desk → set `reminder_7d_sent_at`. Repeat at 1 day. The sent-at columns make it **idempotent**: re-running the job does not email twice.

### 6.3 Bar tab settle

Open tab → items added (`kitchenStatus: new`) → kitchen marks ready/served → staff settle. `settle` takes `payments[]` so a member can split the bill; the sum must equal the total or it is `422 AMOUNT_MISMATCH`. Settling inserts into `payments` with `revenue_category: 'bar'` and frees the table in the same transaction.

### 6.4 Online shop order

`quote` (no stock movement) → `orders` (atomic decrement + `stock_movements` row) → pay. If unpaid after `onlineOrderHoldMinutes`, a job cancels the order and **restores stock**. Counter orders paid in cash skip straight to `completed`.

---

## 7. Background jobs

| Job | Cadence | Does |
|---|---|---|
| Membership reminders | daily 09:00 IST | email + notify at 7 days and 1 day |
| Abandoned order release | every 5 min | cancel unpaid online orders past the hold window, restore stock |
| Membership expiry sweep | daily 01:00 IST | mark `active` memberships past `end_date` as `expired` |
| Low-stock sweep | daily 07:00 IST | flag products at/below threshold, notify owner once |
| Lead follow-up digest | hourly | list leads whose `follow_up_at` has passed |
| Payment reconciliation | daily 23:30 IST | compare Razorpay settlements against local `payments` |

All jobs must be **idempotent** and safe to run twice.

---

## 8. Endpoint index

<details>
<summary>~150 endpoints, grouped</summary>

| Group | Count | Base |
|---|---|---|
| Auth | 7 | `/auth` |
| Public | 9 | `/public` |
| Settings & uploads | 5 | `/settings`, `/uploads`, `/health` |
| Plans | 5 | `/plans` |
| Memberships | 5 | `/memberships`, `/me/membership` |
| Members | 9 | `/members` |
| Shop & inventory | 15 | `/products`, `/categories`, `/shop/orders` |
| Courts & bookings | 12 | `/courts`, `/bookings` |
| Social play | 6 | `/social-sessions` |
| Bar | 18 | `/bar` |
| Payments | 5 | `/payments` |
| CRM | 8 | `/leads` |
| Finance | 8 | `/clients`, `/invoices`, `/expenses` |
| Reports | 6 | `/reports` |
| HR | 13 | `/employees`, `/shifts`, `/leave-requests`, `/payroll` |
| Notifications | 3 | `/notifications` |
| **Total** | **~134** | |

</details>

---

## 9. Open questions and schema conflicts

> These need a decision from the team **before** the matching code is written. Per `PROJECT_CONTEXT.md` §0, unknowns get marked rather than invented.

### 9.1 Roles — RESOLVED

The live DB previously carried `owner, admin, manager, staff, user`, which matched neither the contract nor how the club works. Migration `004_auth_roles.sql` replaced it with the five operational roles in §4 (`admin`, `cafe_manager`, `court_manager`, `shop_manager`, `member`).

Consequences already handled: `userRepository.create` defaults to `member` rather than `user`, every route guard uses the new names, and `authenticate` reads the role from the row on each request so a demotion is immediate.

> **Note for `API_CONTRACT.md` §0:** that file still lists `owner/front_desk/bar_staff/member`. It needs updating to match, and a line added to the contract change log in `PROJECT_CONTEXT.md` §8.

### 9.2 Enum values drift from the contract

| Field | Live DB | Contract | Impact |
|---|---|---|---|
| `bookings.booking_type` | `court`, `session`, `event`, `tournament` | `regular`, `social_session` | Booking endpoints |
| `bookings.source` | `walk_in`, `online`, `phone`, `whatsapp`, `admin` | `member_web`, `staff_counter`, `phone`, `public_trial` | Attribution reporting |
| `shop_orders.status` | `pending`, `confirmed`, `packed`, `out_for_delivery`, `delivered`, `cancelled`, `returned` | `pending`, `confirmed`, `ready`, `out_for_delivery`, `completed`, `cancelled` | Order machine |
| `bar_order_items.kitchen_status` | `na`, `queued`, `preparing`, `ready`, `served`, `cancelled` | `new`, `preparing`, `ready`, `served`, `cancelled` | Kitchen display |
| `payments.method` | `razorpay`, `bank_transfer`, `wallet` | `online` | Method filtering |
| `payments.status` | `pending`, `success`, `failed`, `refunded` | `paid`, `refund_pending`, `refunded` | Revenue queries |
| `plans.code` | free text | `gold`, `silver`, `junior` | Plan filtering |
| `users.role` | **RESOLVED** — now `admin, cafe_manager, court_manager, shop_manager, member` | was `owner, front_desk, bar_staff, member` | see §4 |

Each is a `drop constraint` + `add constraint` while the database holds no production data — cheap now, expensive later.

### 9.3 Missing for BR-1

Double-booking needs an `EXCLUDE USING gist (court_id WITH =, tstzrange(start_at, end_at) WITH &&)` constraint, which requires `CREATE EXTENSION btree_gist`. **Not yet in any migration** — without it, BR-1 rests only on application code, which loses to concurrency. This is the single most important gap: "two people must never end up on the same court at the same time" is the brief's explicit hard rule.

### 9.4 Numbers the organisers did not give

| Unknown | Used for | Where it lives |
|---|---|---|
| Gold / Silver / Junior discount percentages | all pricing | `plans.*_discount_pct` |
| Tax regime and rates | tax reports, invoice totals | `settings.taxRates` |
| Opening hours, session length, cancel cutoff | availability, validation | `settings` |
| Bar and shop prices | every total | `products.price`, `menu_items.price` |
| Membership price and duration | renewals | `plans.price`, `duration_days` |
| Payroll formula | net pay | — |

All are data, not code. Once the owner fills them in, no code changes.

### 9.5 Also undecided

- **Paddle vs Razorpay** — the contract assumes Razorpay (India). Confirm.
- **Delivery fee** — flat or distance-based? Currently flat in `settings.delivery_fee`.
- **Refund mechanics** — `refund_pending` is a state, but who triggers the actual Razorpay refund: staff button, or automatic on webhook?
- **Member self-cancellation cutoff** — assumed 2 hours; not stated.
- **Guest bookings** — the DB allows a booking with neither `member_id` nor `guest_name`, but §5.8 requires one. Add the constraint.
- **Member login** — a member gets a `users` row at conversion; do they get a password immediately or a temp one?

### 9.6 Email delivery — operational note

Delivery depends on a Google account with an App Password in `EMAIL_USER` / `EMAIL_PASS`. Constraints worth knowing before a demo:

- **Gmail caps sending at ~500 messages/day.** Fine for a club, not for a bulk run. A large member-import would need a transactional provider.
- **Free Gmail accounts are limited to ~100 concurrent SMTP connections.** The mailer pools 3, which is comfortable.
- Codes expire after 10 minutes. A member who waits longer must request another — there is a 60-second resend throttle, so the UI needs a countdown, not just a button.
- Staff accounts skip verification. Only self-registered `member` accounts must confirm a code.

---

*Design only — no code in this file. Implementation order should follow `BACKEND_EXECUTION_PLAN.md`.*