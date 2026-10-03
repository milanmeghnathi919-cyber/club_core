# FRONTEND_ANALYSIS.md — The Champions Club Backend Audit & Integration Analysis

> Single authoritative frontend reference derived from running API, source code, repositories, controllers, database models, and seeds.
> Date: October 2026 | Antigravity Lead Frontend & System Architect

---

## 1. Authentication, Sessions & Roles

### 1.1 Auth Mechanics
- **Cookie Authentication:** Server sets `cc_token` as an `httpOnly` cookie (`maxAge: 7 days`). In dev (`config.env !== 'production'`), `sameSite: 'lax', secure: false`. In prod, `sameSite: 'none', secure: true`.
- **Bearer Token Support:** `Authorization: Bearer <jwt>` is also accepted on all authenticated routes (ideal for hybrid environments & client storage).
- **Session Identity:** `GET /api/v1/auth/me` returns `{ user, member?, membership? }`.
- **401 Handling:** Any `401 UNAUTHENTICATED` triggers client-side logout and redirect to `/login?next=...`.

### 1.2 Seed Accounts & Credentials
| Role | Email | Password | Display Name & Context |
|---|---|---|---|
| **owner** | `owner@championsclub.in` | `Admin@123` | Rajesh Sharma (Full club executive access) |
| **front_desk** | `frontdesk@championsclub.in` | `Staff@123` | Priya Patel (Court booking, member CRM, shop POS) |
| **bar_staff** | `bar@championsclub.in` | `Staff@123` | Vikram Singh (Bar POS, table tabs, kitchen queue) |
| **member** | `member@championsclub.in` | `Member@123` | Arun Kumar (Active Gold member, code `MEM-2026-000001`) |

### 1.3 Role Permission Matrix
| Role | Surface Access | Allowed Actions |
|---|---|---|
| **Public** | Public Landing, Plans, Court Strip, Shop, Contact/Trial | Browse club info, active plans, public 7-day court availability (no member details), shop catalog, submit enquiry / book trial. |
| **Member** | Member Portal (`/app`) | Book courts with member discount, view/cancel own bookings, join Friday social sessions, online shop orders, digital membership pass, update own profile & password. |
| **Front Desk** | Staff Console (`/staff`) | Global member search (`/members/lookup`), register members, court calendar grid, create walk-in/member bookings, shop counter POS, leads pipeline (CRM), shifts check-in/out. |
| **Bar Staff** | Bar Console (`/staff/bar`) | Table map, open/manage tabs, add items with notes, apply member discounts, live Kitchen Display System (KDS), settle tabs, daily shift check-in. |
| **Owner** | Executive Console (`/owner` + `/staff`) | Everything in staff console PLUS financial analytics, revenue charts, invoices, expenses, payroll runs, employee management, tax exports, club configuration. |

---

## 2. API Endpoints Grouped by Feature

### 2.1 Authentication & Profile
- `POST /api/v1/auth/register` (Public) — Req: `{ name, email, phone, password, dob? }` → Resp: `{ user, token, member }`.
- `POST /api/v1/auth/login` (Public) — Req: `{ email, password }` → Resp: `{ user, token, member, membership }`.
- `POST /api/v1/auth/logout` (Any) → Resp: `{}` (clears `cc_token`).
- `GET /api/v1/auth/me` (Any) → Resp: `{ user, member, membership }`.
- `PATCH /api/v1/auth/password` (Any) — Req: `{ currentPassword, newPassword }`.

### 2.2 Public Surface (No Auth)
- `GET /api/v1/public/club` → Resp: `{ clubName, openTime, closeTime, bookingWindowDays, sports }`.
- `GET /api/v1/public/plans` → Resp: `Plan[]` (active membership tiers).
- `GET /api/v1/public/courts` → Resp: `Court[]` (`{ id, name, sport, ratePerHour, imageUrl, isActive }`).
- `GET /api/v1/public/availability` → Q: `from=YYYY-MM-DD, days=7, sport?` → Resp: `{ days: [{ date, courts: [...] }] }`.
- `GET /api/v1/public/categories` → Resp: `Category[]`.
- `GET /api/v1/public/products` → Q: `category?, q?, minPrice?, maxPrice?, page, limit` → Resp: `Product[]` (`inStock` boolean, no raw stock count).
- `GET /api/v1/public/products/:id` → Resp: `Product`.
- `POST /api/v1/public/enquiries` → Req: `{ name, phone?, email?, interest, sport?, preferredDate?, message? }` → Resp: `201 { id, status: "new" }`.
- `POST /api/v1/public/trial-bookings` → Req: `{ name, phone, email?, courtId, startAt }` → Resp: `201 { booking, leadId }`.

### 2.3 Members & Memberships
- `GET /api/v1/members` (FD+) → Q: `q?, planCode?, status?, expiringInDays?, page, limit` → Resp: `Member[]` + `meta`.
- `GET /api/v1/members/lookup` (Staff) → Q: `q` (min 2 chars) → Resp: Top 10 `Member[]` for fast search.
- `POST /api/v1/members` (FD+) → Req: `{ fullName, phone, email?, dob?, address?, emergencyContact?, planId, startDate?, paymentMethod, createLogin? }` → Resp: `201 { member, membership, payment?, tempPassword? }`.
- `GET /api/v1/members/:id` (Staff; Member self) → Resp: `{ member, currentMembership, stats: { totalBookings, totalSpend, lastVisitAt } }`.
- `PATCH /api/v1/members/:id` (FD+; Member self) → Req: profile fields.
- `GET /api/v1/members/:id/history` (Staff; Member self) → Q: `type?, page, limit` → Resp: timeline array.
- `POST /api/v1/members/:id/memberships` (FD+) → Req: `{ planId, startDate?, paymentMethod }`.
- `PATCH /api/v1/memberships/:id/cancel` (FD+).

### 2.4 Courts & Bookings
- `GET /api/v1/courts` (Any) → Resp: `Court[]`.
- `POST /api/v1/courts` & `PATCH /api/v1/courts/:id` (Owner) → Req: `{ name, sport, ratePerHour, isActive, imageUrl? }`.
- `GET /api/v1/courts/availability` (Any) → Q: `date=YYYY-MM-DD, sport?, courtId?, memberId?` → Resp:
  `{ date, slotMinutes: 30, durationMinutes: 60, courts: [{ courtId, courtName, sport, ratePerHour, slots: [{ time, startAt, endAt, state: "available"|"booked"|"social"|"closed"|"past", price }] }] }`.
- `POST /api/v1/bookings` (Member, FD+) → Req: `{ courtId, startAt, memberId?, guest?: { name, phone }, paymentMethod? }` → Resp: `201 { booking, payment? }`.
- `GET /api/v1/bookings` (Staff: all; Member: own) → Q: `date?, from?, to?, courtId?, memberId?, status?, page, limit`.
- `GET /api/v1/bookings/mine` (Member) → Q: `upcoming?=true`.
- `GET /api/v1/bookings/:id` (Staff; Member self).
- `PATCH /api/v1/bookings/:id/cancel` (Member self, FD+) → Req: `{ reason? }`.
- `PATCH /api/v1/bookings/:id/pay` (FD+) → Req: `{ method: "cash"|"card"|"upi" }`.
- `PATCH /api/v1/bookings/:id/status` (FD+) → Req: `{ status: "completed"|"no_show" }`.

### 2.5 Social Sessions (Friday Club Night)
- `GET /api/v1/social-sessions` (Any) → Q: `date? | from?, to?`.
- `POST /api/v1/social-sessions` (FD+) → Req: `{ courtId, startAt, capacity, pricePerHead, title? }`.
- `POST /api/v1/social-sessions/generate` (FD+) → Req: `{ date, courtIds[], windowStart, windowEnd, capacity, pricePerHead }`.
- `POST /api/v1/social-sessions/:id/join` (Member, FD+) → Req: `{ memberId?, guest?: { name }, paymentMethod? }`.
- `DELETE /api/v1/social-sessions/:id/participants/:pid` (Member self, FD+).
- `PATCH /api/v1/social-sessions/:id/cancel` (FD+).

### 2.6 Shop & Inventory
- `GET /api/v1/categories` (Any) → Resp: `Category[]`.
- `POST /api/v1/categories` & `PATCH /api/v1/categories/:id` (Owner).
- `GET /api/v1/products` (Staff) → Q: `q?, categoryId?, lowStock?, page, limit` → Resp: `Product[]` with `stockQty`.
- `POST /api/v1/products` & `PATCH /api/v1/products/:id` (FD+).
- `POST /api/v1/products/:id/stock` (FD+) → Req: `{ delta, reason: "restock"|"adjustment"|"damage"|"return", note? }`.
- `GET /api/v1/products/low-stock` (FD+) → Resp: `Product[]`.
- `GET /api/v1/products/:id/movements` (FD+).
- `POST /api/v1/shop/orders/quote` (Any/Member/FD+) → Req: `{ items: [{ productId, qty }], memberId?, fulfilment? }` → Resp: `{ lines[], subtotal, discountPct, discount, taxAmount, deliveryFee, total }`.
- `POST /api/v1/shop/orders` (Member, FD+) → Req: `{ items, fulfilment: "in_store"|"pickup"|"delivery", memberId?, customerName?, customerPhone?, deliveryAddress?, paymentMethod }`.
- `GET /api/v1/shop/orders` (FD+) & `GET /api/v1/shop/orders/mine` (Member).
- `GET /api/v1/shop/orders/:id`.
- `PATCH /api/v1/shop/orders/:id/status` (FD+) → Req: `{ status }`.
- `POST /api/v1/shop/orders/:id/pay` (FD+) → Req: `{ method }`.
- `PATCH /api/v1/shop/orders/:id/cancel` (Member self while pending, FD+).

### 2.7 Bar & Kitchen POS
- `GET /api/v1/bar/menu` (Staff) → Q: `category?, available?`.
- `POST /api/v1/bar/menu` & `PATCH /api/v1/bar/menu/:id` (Owner, FD+; bar_staff can toggle `is_available`).
- `GET /api/v1/bar/tables` (Staff) → Resp: `[{ id, label, seats, status: "free"|"occupied", current_tab_id }]`.
- `POST /api/v1/bar/tables` & `PATCH /api/v1/bar/tables/:id` (Owner).
- `POST /api/v1/bar/tabs` (Staff) → Req: `{ tableId?, memberId?, guestName? }`.
- `GET /api/v1/bar/tabs` (Staff) → Q: `status? (open|settled|void), date?`.
- `GET /api/v1/bar/tabs/:id` (Staff) → Live tab details with automatic member discount.
- `POST /api/v1/bar/tabs/:id/items` (Staff) → Req: `{ items: [{ menuItemId, qty, notes? }] }`.
- `PATCH /api/v1/bar/tabs/:id/items/:itemId` (Staff) → Req: `{ qty }` or `{ cancel: true }`.
- `PATCH /api/v1/bar/tabs/:id/member` (Staff) → Req: `{ memberId: uuid | null }`.
- `PATCH /api/v1/bar/tabs/:id/table` (Staff) → Req: `{ tableId: uuid | null }`.
- `POST /api/v1/bar/tabs/:id/settle` (Staff) → Req: `{ payments: [{ method, amount }] }`.
- `POST /api/v1/bar/tabs/:id/void` (Owner, FD+) → Req: `{ reason }`.
- `GET /api/v1/bar/kitchen` (Staff) → Q: `status?=new,preparing, station?` (Live KDS).
- `PATCH /api/v1/bar/items/:itemId/kitchen-status` (Staff) → Req: `{ status: "preparing"|"ready"|"served" }`.
- `GET /api/v1/bar/summary` (Staff) → Q: `date=YYYY-MM-DD`.

### 2.8 Leads CRM & Notifications
- `GET /api/v1/leads` (FD+) → Q: `status?, interest?, q?, page, limit`.
- `POST /api/v1/leads` (FD+) → Req: Lead creation body.
- `GET /api/v1/leads/:id` (FD+) → Resp: `{ lead, activities: [...], quotes: [...] }`.
- `PATCH /api/v1/leads/:id` (FD+) → Req: `{ status?, assignedTo?, followUpAt? }`.
- `GET /api/v1/leads/follow-ups` (FD+) → Q: `due=today|overdue`.
- `POST /api/v1/leads/:id/activities` (FD+) → Req: `{ type: "note"|"call"|"email"|"visit", text, followUpAt? }`.
- `POST /api/v1/leads/:id/quotes` (FD+) → Req: `{ planId?, amount, validUntil, notes?, sendEmail? }`.
- `POST /api/v1/leads/:id/convert` (FD+) → Req: `{ planId, startDate?, paymentMethod }`.
- `GET /api/v1/notifications` (Any) → Q: `unread?, page`.
- `PATCH /api/v1/notifications/:id/read` & `POST /api/v1/notifications/read-all`.

### 2.9 Finance & Accounting
- `GET /api/v1/clients`, `POST /api/v1/clients`, `PATCH /api/v1/clients/:id` (Owner).
- `GET /api/v1/invoices` (Owner) → Q: `status?, category?, clientId?, from?, to?, page`.
- `POST /api/v1/invoices` (Owner) → Req: `{ clientId | memberId, category, issueDate, dueDate, items: [...], notes? }`.
- `GET /api/v1/invoices/:id` (Owner) → Resp: `Invoice` + `payments[]`.
- `PATCH /api/v1/invoices/:id/status` (Owner) → Req: `{ status: "sent"|"void" }`.
- `POST /api/v1/invoices/:id/payments` (Owner) → Req: `{ method, amount, paidAt? }`.
- `GET /api/v1/expenses` (Owner) → Q: `status?, category?, page`.
- `POST /api/v1/expenses` & `PATCH /api/v1/expenses/:id` (Owner).
- `PATCH /api/v1/expenses/:id/pay` (Owner) → Req: `{ method, paidAt? }`.
- `GET /api/v1/reports/payables` (Owner).

### 2.10 HR & Operations
- `GET /api/v1/employees`, `POST /api/v1/employees`, `PATCH /api/v1/employees/:id` (Owner).
- `GET /api/v1/shifts` (Staff self, Owner all) → Q: `from, to, employeeId?`.
- `POST /api/v1/shifts`, `PATCH /api/v1/shifts/:id`, `DELETE /api/v1/shifts/:id` (FD+, Owner).
- `POST /api/v1/shifts/:id/check-in` & `/check-out` (Staff own shift).
- `POST /api/v1/leave-requests` (Staff).
- `GET /api/v1/leave-requests/mine` (Staff) & `GET /api/v1/leave-requests` (Owner).
- `PATCH /api/v1/leave-requests/:id/decision` (Owner) → Req: `{ decision: "approved"|"rejected", note? }`.
- `POST /api/v1/payroll/runs` (Owner) → Req: `{ month: "YYYY-MM" }`.
- `GET /api/v1/payroll/runs` & `GET /api/v1/payroll/runs/:id` (Owner).
- `PATCH /api/v1/payroll/payslips/:id` (Owner draft).
- `POST /api/v1/payroll/runs/:id/finalize` & `/mark-paid` (Owner).

### 2.11 Executive Analytics & Reports
- `GET /api/v1/reports/dashboard` (Owner; limited for FD+) → Q: `range=today|week|month`.
- `GET /api/v1/reports/revenue` (Owner) → Q: `from, to, groupBy=day|source|method`.
- `GET /api/v1/reports/tax` (Owner) → Q: `from, to`.
- `GET /api/v1/reports/export/:type` (Owner) → `type=revenue|payments|tax|members|payables`.
- `GET /api/v1/settings` (Staff) & `PATCH /api/v1/settings` (Owner).

---

## 3. Discrepancies: Running API vs Contract Docs
1. **Court Availability Structure:**
   - *Doc says:* `courts: [{ court: Court, slots: Slot[] }]`
   - *Running API returns:* `courts: [{ courtId, courtName, sport, ratePerHour, slots: [...] }]`
   - *UI Adapter:* Support both shapes seamlessly via normalized getter `court.name || court.courtName`.
2. **Bar Menu Property Names:**
   - *Doc says:* `taxRatePct`, `isAvailable` (camelCase)
   - *Running API returns:* `tax_rate_pct`, `is_available` (snake_case in memoryStore)
   - *UI Adapter:* Normalize both snake_case and camelCase on ingestion (`item.is_available ?? item.isAvailable`).
3. **Table Object Property Names:**
   - *Doc says:* `currentTabId`
   - *Running API returns:* `current_tab_id`
   - *UI Adapter:* Accept both `table.current_tab_id || table.currentTabId`.
4. **Lead Object Field Names:**
   - *Doc says:* `name`, `followUpAt`
   - *Running API returns:* `full_name`, `follow_up_date`
   - *UI Adapter:* Accept both `lead.full_name || lead.name`.
5. **Kitchen Ticket Item Format:**
   - *Doc says:* `name`
   - *Running API returns:* `name_snapshot` (guaranteeing historic price & name freeze)
   - *UI Adapter:* `item.name_snapshot || item.name`.

---

## 4. Business Rules Enforced by UI
1. **Hard No Double-Booking:** Slots cannot overlap on the same court. UI pre-validates and disables booked/past slots.
2. **60-Minute Sessions starting on :00 or :30:** Standard session duration is 60 minutes.
3. **Max 2 Bookings per Member per Day:** Front-desk & member UI monitors daily count; shows clear warning if at cap.
4. **Tax-Inclusive Pricing (BR-16):** Gross totals include tax. UI displays server-computed `subtotal`, `discount`, `taxAmount`, and `total` without client-side recalculation.
5. **Shared Inventory:** Products have unified stock across Online Orders and Front-Desk Counter POS. Low-stock badges appear when `stockQty <= lowStockThreshold`.
6. **Live Polling Intervals:**
   - Kitchen Display System: 5 seconds
   - Court Availability Matrix: 20 seconds
   - Notification Bell: 30 seconds
