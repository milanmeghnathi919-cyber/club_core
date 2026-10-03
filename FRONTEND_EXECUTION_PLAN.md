# FRONTEND_EXECUTION_PLAN.md — Sports Club Management System (The Champions Club)

**Required reading before any work:** `PROJECT_CONTEXT.md` → this file → `API_CONTRACT.md` (full endpoint contract, shared with backend).
**Team:** Frontend Person 1 (**FE1**) and Frontend Person 2 (**FE2**). Source of truth = organizer PDF "Sports Club Management System" (summary in MASTER_PLAN.md §1).
Tags: **ASSUMPTION** = our decision · **UNKNOWN** = not in organizer docs.

---

## A. Frontend understanding

### A1. User roles and what each sees
| Role | Who | Surface | Core jobs |
|---|---|---|---|
| Visitor (public) | stranger searching online | Public website | See club, plans/prices, free slots this week, shop; send enquiry / book trial |
| Member | Gold/Silver/Junior | Member portal (mobile-first) | Book court (see price), see/cancel bookings, join Friday social play, order shop items (pickup/delivery), see plan + expiry |
| Front desk | staff | Staff console (tablet/desktop) | Register/recognise member fast, see history, book courts (walk-in/phone), counter shop sale, handle leads |
| Bar staff | staff | Bar POS + Kitchen display | Open tabs per table, add items, member discount auto, settle (cash/card/UPI), kitchen queue |
| Owner | owner | Everything + Owner area | Dashboard today/week/month, finance, HR, tax, settings, share numbers |

### A2. Required screens → organizer scene
| Scene | Screens |
|---|---|
| New member at desk | Member register form, member search, member profile (plan, entitlements, expiry, history) |
| Court booking | Availability/booking grid (member + staff), confirm modal with price, my bookings, social play list |
| Gearing up | Shop catalogue, product detail, cart, checkout (pickup/delivery), my orders; staff: counter POS, stock, orders, low-stock |
| Bar | Table map, tab view, menu picker, settle dialog, kitchen display, daily summary |
| Stranger online | Landing, plans, availability this week, shop, contact/enquiry + trial booking |
| Owner month-end | Dashboard, revenue charts, invoices, expenses/payables, employees/shifts/leave/payroll, tax report, exports/PDF |

### A3. Main user journeys (must be demo-able)
1. **Front desk registers member** → search by phone → no match → register (plan Silver, pay UPI) → profile shows plan + expiry + discounts.
2. **Member books court** → pick date/sport → grid shows price for me → tap 18:00 slot → confirm → success; try 3rd booking → friendly "2 per day" message; another user on same slot → "just booked, pick another".
3. **Walk-in at 6 pm** → front desk grid → free slots → book as walk-in (full price) → mark paid cash.
4. **Member orders racket** → shop → cart (member discount from `/quote`) → pickup/delivery → Razorpay test pay → order status page.
5. **Bar** → open tab on T4 → attach member (discount appears) → add items → kitchen sees ticket → settle UPI.
6. **Visitor** → public site → availability → enquiry → front desk sees bell notification → follow-up → quote → convert.
7. **Owner** → dashboard (revenue by source & method) → invoice a business client → approve leave → download tax/revenue PDF.

---

## B. UI/UX architecture

### B1. Routes
```
PUBLIC   /                    Landing (hero, sports, plans teaser, CTA)
         /plans               Plans & prices
         /availability        This week's free slots (7-day strip + sport filter) → CTA to login/book or trial
         /shop, /shop/:id     Catalogue + detail          /cart       Cart (works logged-out, persisted)
         /contact             Enquiry + "Book a trial" form
         /login, /register
MEMBER   /app                 Dashboard (plan, expiry banner, next booking, quick actions)           [member]
         /app/book            Court booking grid     /app/bookings     My bookings (upcoming/past, cancel)
         /app/social          Friday social sessions /app/orders       My orders     /app/checkout
         /app/membership      Plan, benefits, renew  /app/profile      Profile, password
STAFF    /staff               Home: global member search + today's schedule + alerts               [staff]
         /staff/members       List (filters: plan, expiring) /staff/members/new  Register
         /staff/members/:id   Profile (tabs: Overview · Membership · History)
         /staff/bookings      Booking grid (courts × time) + create/cancel/pay     /staff/social  Social session admin
         /staff/shop          Counter POS         /staff/shop/products  Products & stock (+low stock)   /staff/shop/orders  Orders (online + counter)
         /staff/bar           Tables & tabs POS   /staff/bar/kitchen  Kitchen display   /staff/bar/summary  Daily summary
         /staff/leads, /staff/leads/:id   CRM     /staff/shifts  My/all shifts     /staff/leave  My leave
OWNER    /owner               Dashboard           /owner/finance/invoices (+/new, /:id)   /owner/finance/clients   /owner/finance/expenses
         /owner/finance/tax   Tax + exports       /owner/hr/employees  /owner/hr/payroll   /owner/hr/leave
         /owner/settings      Club, hours, plans, courts, tables, menu, tax rates, social config
ERROR    /403  /404 (catch-all)
```
Guards: `<RequireAuth roles={[…]}>`; owner can open `/staff/*`; after login redirect by role (member→`/app`, front_desk/bar_staff→`/staff` (bar_staff→`/staff/bar`), owner→`/owner`).

### B2. Components
**Reusable UI kit (`components/ui`) — FE1 builds (FE1-02), both use:** `Button, Input, Select, Textarea, Checkbox, FormField (RHF-aware, shows error), Modal, ConfirmDialog, Drawer, Table (sortable, sticky header, responsive card-mode), Pagination, Badge/StatusPill, Card, Tabs, Spinner, Skeleton, EmptyState, ErrorState(retry), Money (₹ en-IN), DateTime (club tz), SearchInput (debounced), DatePicker (day strip), Stat tile, Toast (react-toastify config)`.
**Domain components:** `SlotGrid` (shared by member & staff, prop `mode`), `PriceTag`, `MembershipBadge` (plan colour + days-left), `MemberQuickSearch`, `MemberCard`, `ProductCard`, `CartDrawer`, `OrderStatusStepper`, `TableTile`, `TabPanel`, `MenuPicker`, `KitchenTicket`, `LeadCard`, `ActivityTimeline`, `KpiCard`, `RevenueChart (recharts)`, `NotificationBell`, `PdfButton`.
**Layouts:** `PublicLayout`, `MemberLayout` (bottom nav on mobile), `StaffLayout`/`OwnerLayout` (sidebar + topbar with MemberQuickSearch + NotificationBell).

### B3. Forms (React Hook Form + zod resolver)
Register member · login/register · enquiry/trial · booking confirm · checkout · product · stock adjust · tab add item · settle · lead activity/quote/convert · invoice (dynamic item rows via `useFieldArray`) · expense · employee · shift · leave · payroll adjustments · settings. Rules mirror API_CONTRACT validation (phone regex, password ≥ 8, dob rule for Junior shown inline). Inline error under field + server `details[]` mapped to fields via `setError`.

### B4. States (every data screen)
`loading` → Skeleton · `empty` → EmptyState with next action · `error` → ErrorState + Retry · `401` → clear store, redirect `/login?next=…` · `403` → `/403` · `409/422` → toast with server `message` + keep dialog open · network down → toast "Can't reach server" + retry. Buttons show spinner and are disabled while submitting (prevents double-submit of bookings/orders).

### B5. Responsive & accessibility
Public + member: mobile-first (360 px). Staff console: tablet (≥768) & desktop first; bar POS & kitchen display must work at 768–1024 px touch (≥44 px tap targets). Tables collapse to cards < 640 px. Slot grid: horizontal scroll with sticky court/time header. Accessibility: every input has a label, visible focus ring, `aria-live` for toasts, modal focus trap + Esc, colour is never the only status signal (icon/text), contrast ≥ 4.5:1, grid navigable by keyboard.

---

## C. Technical architecture

### C1. Stack (decisions → PROJECT_CONTEXT §Decisions)
| ID | Decision |
|---|---|
| D-F1 | **Vite + React 18 (JS)**, React Router v6, **Tailwind**, **Redux Toolkit with RTK Query** for all server data (no axios needed), Redux slices only for `auth`, `cart`, `ui`. |
| D-F2 | **React Hook Form** + `zod` + `@hookform/resolvers` (added). **react-toastify** for toasts. **recharts** for charts (ASSUMPTION for "react chart"; swap allowed). **jsPDF + jspdf-autotable** for invoices, payslips, reports, receipts. |
| D-F3 | Added libs (kept minimal): `date-fns`, `date-fns-tz`, `lucide-react`, `msw` (dev mocks), `vitest` + `@testing-library/react` (dev). Razorpay Checkout loaded via `<script>` inside `useRazorpay()` hook. |
| D-F4 | Auth by cookie: `fetchBaseQuery({ baseUrl, credentials:'include' })`; envelope unwrapped in a custom `baseQuery` → components receive `data` or normalised `{status, code, message, details}`. |
| D-F5 | Money/total/discount/availability are **never computed on the client** — display server values (`/quote`, response fields). |
| D-F6 | Live views use polling: kitchen 5 s, staff booking grid 20 s, notifications 30 s; availability refetch on focus. |
| D-F7 | During first hours FE runs against **MSW fixtures** (`VITE_USE_MOCKS=true`) for P0 endpoints taken from API_CONTRACT §1 shapes; flip to real API per module as BE merges. |

### C2. Folder structure
```
client/src/
  app/ store.js  baseApi.js (RTK Query + envelope/401 handling)  router.jsx  guards.jsx
  features/
    auth/      authSlice.js authApi.js pages/{Login,Register}.jsx
    public/    publicApi.js pages/{Landing,Plans,Availability,Contact}.jsx
    members/   membersApi.js pages/{MemberList,MemberNew,MemberProfile}.jsx components/{MemberQuickSearch,MembershipBadge}.jsx
    bookings/  bookingsApi.js components/SlotGrid.jsx pages/{MemberBook,MyBookings,StaffBookings}.jsx
    social/    socialApi.js pages/{MemberSocial,StaffSocial}.jsx
    shop/      shopApi.js cartSlice.js pages/{Catalogue,ProductDetail,Cart,Checkout,MyOrders,POS,ProductsAdmin,OrdersAdmin}.jsx
    bar/       barApi.js pages/{BarPos,Kitchen,BarSummary}.jsx
    leads/     leadsApi.js pages/{LeadList,LeadDetail}.jsx
    finance/   financeApi.js pages/{Invoices,InvoiceForm,InvoiceDetail,Clients,Expenses,Tax}.jsx
    hr/        hrApi.js pages/{Employees,Shifts,Leave,Payroll}.jsx
    reports/   reportsApi.js pages/OwnerDashboard.jsx
    settings/  settingsApi.js pages/Settings.jsx
    notifications/ notificationsApi.js components/NotificationBell.jsx
  components/ ui/*  layout/{PublicLayout,MemberLayout,StaffLayout}.jsx  common/*
  hooks/ useRazorpay.js useDebounce.js usePolling.js   utils/ format.js clubTime.js pdf/{invoicePdf,payslipPdf,reportPdf,receiptPdf}.js constants.js
  mocks/ handlers.js fixtures/*.json browser.js
  main.jsx  index.css
```
Env: `VITE_API_URL`, `VITE_USE_MOCKS`, `VITE_RAZORPAY_KEY_ID` (optional; key comes from API).

### C3. Data models used by frontend
Exactly the shapes in `API_CONTRACT.md` §1 (Plan, Member, Court, Slot, Booking, SocialSession, Product, ShopOrder, BarTab, Lead, Payment, Notification, User). Do not invent fields; if one is missing, request a contract change.

### C4. Authentication flow
App start → `GET /auth/me` (shows splash) → store `{user, member?}` → router guards. Login → `POST /auth/login` → role redirect. Any 401 from RTK base query → dispatch `logout()` + redirect with `next`. Logout → `POST /auth/logout` + reset RTK cache. Role-aware nav (items hidden if role not allowed; server remains the authority).

---

## D. API dependency

The **complete** request/response/error/validation definitions are in `API_CONTRACT.md` §2 — treat it as part of this file. Page → endpoint map (every endpoint FE uses):

| Page / feature | Endpoints (METHOD path) | Notes on handling |
|---|---|---|
| Auth | `POST /auth/login, /auth/register, /auth/logout` · `GET /auth/me` · `PATCH /auth/password` | 401 INVALID_CREDENTIALS inline; 409 EMAIL_EXISTS inline on email field |
| Public site | `GET /public/club, /public/plans, /public/courts, /public/availability, /public/categories, /public/products(/:id)` · `POST /public/enquiries, /public/trial-bookings` | No PII; 429 → "Try again in a minute" |
| Member profile/membership | `GET /auth/me`, `GET/PATCH /members/:id` (self), `GET /members/:id/history`, `POST /me/membership/purchase` (P1) | Show `daysLeft`, `expiringSoon` banner (≤ 7 days) |
| Member search/register (staff) | `GET /members/lookup?q`, `GET /members`, `POST /members`, `GET /members/:id`, `PATCH /members/:id`, `POST /members/:id/memberships`, `PATCH /memberships/:id/cancel`, `POST /uploads/image`, `GET /plans` | 422 JUNIOR_AGE_MISMATCH → inline on plan/dob |
| Court booking | `GET /courts`, `GET /courts/availability`, `POST /bookings`, `GET /bookings(/mine)`, `PATCH /bookings/:id/cancel, /pay, /status` | 409 SLOT_TAKEN → toast + refetch grid; 422 DAILY_LIMIT_REACHED → inline banner; `warnings[]` → toast |
| Social play | `GET /social-sessions`, `POST /social-sessions/:id/join`, `DELETE …/participants/:pid`; admin: `POST /social-sessions, /generate`, `PATCH …/cancel` | SESSION_FULL → refetch |
| Shop (member) | `GET /public/products`, `POST /shop/orders/quote`, `POST /shop/orders`, `GET /shop/orders/mine, /shop/orders/:id`, `PATCH /shop/orders/:id/cancel`, `POST /payments/razorpay/verify` | OUT_OF_STOCK `details` → mark cart lines |
| Shop (staff) | `GET/POST/PATCH /products`, `POST /products/:id/stock`, `GET /products/low-stock, /products/:id/movements`, `GET /shop/orders`, `PATCH /shop/orders/:id/status`, `POST /shop/orders/:id/pay`, `GET/POST /categories` | Counter POS uses `POST /shop/orders` with `memberId?` |
| Bar | `GET /bar/menu, /bar/tables, /bar/tabs, /bar/tabs/:id, /bar/kitchen, /bar/summary` · `POST /bar/tabs, /bar/tabs/:id/items, /settle, /void` · `PATCH /bar/tabs/:id/items/:itemId, /member, /table`, `PATCH /bar/items/:id/kitchen-status`, `PATCH /bar/menu/:id` | Poll kitchen 5 s |
| Leads | `GET /leads, /leads/:id, /leads/follow-ups` · `POST /leads, /leads/:id/activities, /quotes, /convert` · `PATCH /leads/:id` | convert 409 PHONE_EXISTS |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `POST /notifications/read-all` | Poll 30 s |
| Dashboard/reports | `GET /reports/dashboard, /reports/revenue, /reports/tax, /reports/payables, /reports/export/:type` | PDF built client-side from JSON |
| Finance | `GET/POST/PATCH /clients`, `GET/POST /invoices`, `GET /invoices/:id`, `PATCH /invoices/:id/status`, `POST /invoices/:id/payments`, `GET/POST/PATCH /expenses`, `PATCH /expenses/:id/pay` | |
| HR | `GET/POST/PATCH /employees`, `GET/POST/PATCH/DELETE /shifts`, `POST /shifts/:id/check-in, /check-out`, `POST /leave-requests`, `GET /leave-requests, /leave-requests/mine`, `PATCH /leave-requests/:id/decision`, `POST/GET /payroll/runs`, `PATCH /payroll/payslips/:id`, `POST /payroll/runs/:id/finalize, /mark-paid` | |
| Settings | `GET/PATCH /settings`, `GET/POST/PATCH /plans, /courts, /bar/tables, /bar/menu` | Owner only |

### D1. Integration contract — essentials (identical in both plans)
- Base `/api/v1`; JSON; cookie `cc_token` (httpOnly) → `credentials:'include'`.
- Success `{success:true,data,meta?}`; error `{success:false,error:{code,message,details?}}`; `warnings[]` optional on success.
- Status: 200/201/400/401/403/404/409/422/429/500. Business codes: SLOT_TAKEN, DAILY_LIMIT_REACHED, OUT_OF_STOCK, TABLE_OCCUPIED, AMOUNT_MISMATCH, … (full table in contract §0).
- Dates ISO UTC (display in Asia/Kolkata); money = ₹ numbers with 2 dp, tax-inclusive; pagination `page,limit` + `meta`.
- Roles: owner · front_desk · bar_staff · member · public.

---

## E. Two-person task division

Branches `fe1/<id>` · `fe2/<id>`; small PRs; update `PROJECT_CONTEXT.md` after each task. FE1 owns `components/ui`, `app/*`, `features/{auth,public,bookings (member pages + SlotGrid),social (member page),shop}`; FE2 owns `features/{members,bar,leads,finance,hr,reports,settings,notifications}` + staff layouts. Shared files (`router.jsx`, `store.js`): add only your own lines, pull before editing.

### E1. Frontend Person 1 — Foundation, public site, member portal, booking, shop
| ID | P | Task | Why | Needs | Files / components | Expected result | Testing | DoD |
|---|---|---|---|---|---|---|---|---|
| FE1-01 | P0 | Scaffold Vite+React+Tailwind+Router+RTK, folder structure, eslint/prettier, `.env.example`, MSW setup, git conventions | Everything depends on it | – | `client/**`, `app/*` | `npm run dev` shows routed shell | open all route stubs | FE2 can clone & start in <10 min |
| FE1-02 | P0 | **UI kit + layouts** (all `components/ui`, `PublicLayout`, `MemberLayout`, toast config, Loading/Empty/Error patterns, `Money`, `DateTime`, theme tokens) | Shared look + speed for FE2 | 01 | `components/ui/*`, `layout/*`, `utils/format.js`, `utils/clubTime.js` | Storybook-less demo page `/dev/ui` showing every component | visual check at 360/768/1280 | **Handoff H-F1** (≈CP1): FE2 imports kit |
| FE1-03 | P0 | API layer + auth: `baseApi` (envelope, 401), `authSlice`, `/auth/me` bootstrap, Login, Register, guards, role redirect, 403/404 | Gate for everything | 01 | `app/baseApi.js`, `features/auth/*`, `guards.jsx` | All roles log in (mock then real) | wrong pw, 401 redirect, role redirect | **Handoff H-F2:** FE2 uses guards/baseApi |
| FE1-04 | P0 | Public site: Landing, Plans, Availability (7-day strip, sport filter, free-slot chips), Contact (enquiry + trial booking form), SEO title/meta | Scene 5 | 02,03 | `features/public/*` | Visitor can browse and send enquiry; trial slot picks | enquiry validation; 429; empty availability | Works logged out on mobile |
| FE1-05 | P0 | Shop catalogue + product detail + search/category filter + **cart slice** (localStorage persisted) + CartDrawer | Scene 3 | 02,03 | `features/shop/{Catalogue,ProductDetail,Cart}`, `cartSlice.js` | Add/remove/qty; cart survives refresh | out-of-stock disables add; persist | Cart reads server `/quote` |
| FE1-06 | P0 | Member area shell: Dashboard (plan, expiry banner ≤7 days, next booking), Membership page (benefits table), Profile (+password) | Scene 1 member side | 03 | `features/members/member/*` | Member sees plan/discounts/expiry | expired/none/expiring states | Banner appears when `expiringSoon` |
| FE1-07 | P0 | **Court booking (member):** `SlotGrid` (date strip, sport filter, 30-min slots, price per slot, states), confirm modal, `POST /bookings`, My Bookings (cancel with cutoff message) | Scene 2 core | 02,03, BE1-07/08 | `features/bookings/*`, `SlotGrid.jsx` | Book + cancel; errors handled gracefully | SLOT_TAKEN refetch; 3rd booking message; past slots disabled | SlotGrid reusable by FE2 (**Handoff H-F3**) |
| FE1-08 | P1 | Social play (member): sessions list by date, spots left, join/leave, price for me | Friday social | 07 | `features/social/MemberSocial.jsx` | Join until full | SESSION_FULL refetch | Counts update after join |
| FE1-09 | P0 | Checkout + orders: fulfilment (pickup/delivery + address), quote summary, pay at club / Razorpay (`useRazorpay`), confirmation, My Orders with `OrderStatusStepper` | Scene 3 | 05, BE2-04 | `features/shop/{Checkout,MyOrders}`, `hooks/useRazorpay.js` | Place order, see status | OUT_OF_STOCK per line; payment cancelled; signature fail toast | Order appears in staff orders |
| FE1-10 | P1 | Razorpay for bookings & membership purchase (reuse hook) | Online payment | 09, BE2-05 | `bookings/`, `members/member/Membership` | Pay online, status flips paid | cancel popup; verify failure | Test-mode pay works |
| FE1-11 | P0 | Shop admin: Products table + form (image upload), stock adjust modal, low-stock tab, Orders admin (filters, status buttons per allowed transition, mark paid) | Scene 3 staff side; "know when low" | 02,03 | `features/shop/{ProductsAdmin,OrdersAdmin}` | Staff manage stock & orders | invalid transition 409 toast | Low-stock badge matches API |
| FE1-12 | P0 | Responsive + a11y pass on own pages; 403/404; loading/empty/error audit | Quality | 04–11 | all FE1 pages | Passes checklist §G | manual matrix | No horizontal scroll at 360 px |
| FE1-13 | P0 | Integration: switch FE1 modules from MSW to real API, fix mismatches, demo flow rehearsal | Ship | CP3 | – | Flows 2 & 4 work live | G-I tests | Logged in PROJECT_CONTEXT |

### E2. Frontend Person 2 — Staff console, members, bar, leads, owner/finance/HR
| ID | P | Task | Why | Needs | Files / components | Expected result | Testing | DoD |
|---|---|---|---|---|---|---|---|---|
| FE2-01 | P0 | Staff/Owner layouts: sidebar (role-aware), topbar with **MemberQuickSearch** + **NotificationBell**, route stubs for all `/staff/*` & `/owner/*` | Staff entry point | FE1-02,03 | `layout/StaffLayout.jsx`, `notifications/*`, `members/components/MemberQuickSearch.jsx` | Staff can navigate; search dropdown returns members; bell shows unread | wrong role → 403 | Works with mocks first |
| FE2-02 | P0 | Member register form (RHF+zod; plan picker with entitlements; dob/Junior rule; photo upload; payment method) + success card with member code | Scene 1 | 01, BE1-05 | `members/pages/MemberNew.jsx` | Register in < 60 s | duplicate phone inline; junior mismatch | Member appears in search immediately |
| FE2-03 | P0 | Members list (filters: plan, expiring ≤ N days) + **Member profile** (header with photo, plan badge, expiry; tabs Overview/Membership(renew/change)/History timeline; quick actions: book court, start tab, sell item) | "recognise quickly + see history" | 02 | `members/pages/{MemberList,MemberProfile}.jsx` | One-screen recognition | expired/none states; history pagination | History shows bookings/shop/bar/payments |
| FE2-04 | P0 | Staff booking grid: courts × time using `SlotGrid(mode="staff")`, member/walk-in picker, create booking, cancel, mark paid, no-show; "free now" quick filter for phone calls | Scene 2 (6 pm rush) | FE1-07(SlotGrid), BE1-08 | `bookings/pages/StaffBookings.jsx` | Book walk-in in ≤ 4 taps | SLOT_TAKEN; limit message for member | Grid refreshes every 20 s |
| FE2-05 | P1 | Social admin: generate Friday sessions, participants list, add walk-in, cancel | Friday social | 04, BE1-10 | `social/pages/StaffSocial.jsx` | Sessions created for window | skipped conflicts shown | – |
| FE2-06 | P0 | Counter POS (shop): product search/scan-by-SKU, cart, attach member (discount auto via `/quote`), pay method, receipt (jsPDF/print) | Scene 3 counter | 01, BE2-04 | `shop/pages/POS.jsx`, `utils/pdf/receiptPdf.js` | Sale in ≤ 5 taps; stock decrements | OUT_OF_STOCK; member discount shown | Counter+online share stock visible in product page |
| FE2-07 | P0 | **Bar POS**: table map (free/occupied), open tab (table/counter), menu picker w/ categories, item notes, attach member (discount appears), edit/cancel unsent item, settle dialog (cash/card/UPI, split optional), receipt, void | Scene 4 | 01, BE2-06 | `bar/pages/BarPos.jsx`, `TableTile, TabPanel, MenuPicker` | Tab → settle end-to-end | TABLE_OCCUPIED; AMOUNT_MISMATCH; unavailable item | Works on 768 px touch |
| FE2-08 | P0 | Kitchen display (new → preparing → ready → served columns, ticket shows table/member/notes, 5 s polling, sound/flash on new) | "kitchen keeps asking who ordered what" | 07 | `bar/pages/Kitchen.jsx`, `KitchenTicket` | Live queue | transition errors | New ticket < 5 s |
| FE2-09 | P1 | Bar daily summary (earned today, by method, by staff, top items) + Shifts page (calendar/list, check-in/out for self, owner schedules) | "what the bar earned" + staff shifts | 07, BE2-07 | `bar/pages/BarSummary.jsx`, `hr/pages/Shifts.jsx` | Numbers match API | date change; empty day | – |
| FE2-10 | P0 | Leads CRM: list with status tabs + follow-up due badge, detail (timeline, add note/call, set follow-up), quote form, **convert to member** (prefills register form) | Scene 5 | 01, BE1-11 | `leads/pages/*` | Enquiry → member | convert PHONE_EXISTS | Bell links to lead |
| FE2-11 | P0 | **Owner dashboard**: range toggle today/week/month, KPI cards, revenue by source (bar/donut) & method, daily trend line, alerts strip (low stock, expiring, overdue follow-ups, payables, pending leave) + `PdfButton` "Share/Download report" | Scene 6 core | 01, BE1-13 | `reports/pages/OwnerDashboard.jsx`, `utils/pdf/reportPdf.js` | Owner answers "how much, from where" | empty range; large numbers formatting | Matches API totals |
| FE2-12 | P1 | Finance: clients, invoices (list/create with dynamic rows/detail/record payment/status), invoice PDF, expenses/payables table with "due soon/overdue" | Scene 6 invoices & "what we owe" | 01, BE2-08/09 | `finance/pages/*`, `utils/pdf/invoicePdf.js` | Invoice a business client, download PDF | totals tax math displayed from API; overpay error | PDF has invoice no, items, tax, total |
| FE2-13 | P1 | HR: employees CRUD, leave (staff request form, owner approve/reject with note), shifts scheduler | Scene 6 leave | 01, BE2-07 | `hr/pages/{Employees,Leave}` | Approve leave flow | already decided 409 | Badge count on owner nav |
| FE2-14 | P2 | Payroll: run month, edit allowances/deductions, finalize, mark paid, payslip PDF | Pay employees | 13, BE2-10 | `hr/pages/Payroll.jsx`, `payslipPdf.js` | Payroll for month | locked after finalize | – |
| FE2-15 | P1 | Tax & exports page (output vs input tax, date range, CSV download via `/reports/export`, PDF summary) + Settings page (hours, tax rates, social config, plans, courts, tables, menu CRUD) | Taxes + owner control | 11, BE2-11, BE1-06 | `finance/pages/Tax.jsx`, `settings/*` | Owner configures & exports | invalid rate validation | – |
| FE2-16 | P0 | Integration: switch to real API, fix mismatches, demo rehearsal of flows 1,3,5,6,7 | Ship | CP3 | – | Live flows work | G-I tests | Logged in PROJECT_CONTEXT |

---

## F. Execution order

**Critical path:** FE1-01 → 02 (UI kit) → 03 (auth/baseApi) → 07 (SlotGrid + booking) → FE2-04 ; FE2-01 → 02/03 → 07 → 11.
| Stage (% of window; 36 h assumption) | FE1 | FE2 | Parallel? | Checkpoint |
|---|---|---|---|---|
| 0 (0–4%) | Read docs; agree contract; set repo | same; draft fixtures from contract §1 | ✔ | CP0 contract frozen |
| 1 (4–12%) | 01 scaffold → 02 UI kit → 03 auth | While waiting on 02: build `StaffLayout` skeleton + MSW fixtures for members/bar/leads | ✔ (FE2 starts after FE1-01 push) | **CP1 (~H4): H-F1 UI kit + H-F2 auth/baseApi** |
| 2 (12–25%) | 04 public site, 05 shop catalogue/cart, 06 member shell | 01 layouts → 02 register → 03 profile | ✔ | CP2 (~H9): real auth + members/availability live |
| 3 (25–45%) | 07 booking grid (**H-F3 SlotGrid**) → 09 checkout → 11 shop admin | 04 booking grid → 06 POS → 07 Bar POS → 08 kitchen → 10 leads | ✔ | **CP3 (~H16):** all P0 screens on real API |
| 4 (45–60%) | 12 responsive/a11y pass, 08 social | 11 dashboard, 09 summary/shifts | ✔ | CP4 (~H22): dashboard real data |
| 5 (60–78%) | 10 Razorpay everywhere, fixes | 12 finance, 13 HR, 15 tax/settings | ✔ | CP5 (~H28): P1 done |
| 6 (78–90%) | 13 integration, polish, empty/error states | 16 integration, 14 payroll (P2) | ✔ | Feature freeze ~H31 |
| 7 (90–100%) | Deploy FE (Vercel/Netlify), prod env, smoke | demo script, seed check, backup video | ✔ | Demo ready |
**Handoffs:** H-F1 UI kit (FE1→FE2), H-F2 auth/baseApi/guards, H-F3 `SlotGrid`, H-F4 `Money/DateTime` utils (within H-F1).
**Integration checkpoints:** CP2, CP3, CP5 — at each, both FEs pull `main`, run through §G-I tests against staging API.

---

## G. Frontend testing

Manual checklist (run before every CP) + a few automated (`vitest`) for utils (`format`, `clubTime`) and `cartSlice`. Use MSW to simulate errors (`?mockError=409` toggles).

| ID | Area | Test | Expected |
|---|---|---|---|
| G-W1 | Workflow 1 | Register Junior member (dob 10 yrs ago) + Silver plan | blocks with inline plan/dob error; Junior works |
| G-W2 | Workflow 2 | Member books 18:00; tries 3rd same day | success, then clear "max 2 per day" message |
| G-W3 | Workflow 2 | Two browsers same slot | second gets SLOT_TAKEN toast, grid refreshes, no crash |
| G-W4 | Workflow 3 | Staff books walk-in, marks cash paid | grid shows booked; price = full |
| G-W5 | Workflow 4 | Order racket with member discount + pickup | cart total equals `/quote`; order visible to staff |
| G-W6 | Workflow 5 | Bar: open T4, attach member, add 3 items, settle UPI | discount line shown; kitchen ticket appeared; table freed |
| G-W7 | Workflow 6 | Visitor sends enquiry | success state; staff bell +1 within 30 s |
| G-W8 | Workflow 7 | Owner dashboard range switch | totals update, charts render, PDF downloads |
| G-V1 | Validation | Each form: empty submit, bad phone, short password, negative qty | inline errors, no request sent |
| G-V2 | Validation | Server 422 with `details[]` | errors mapped to fields |
| G-E1 | Errors | Kill API | toast "Can't reach server", Retry works, no blank screen |
| G-E2 | Errors | Expired cookie mid-session | redirect to login with `next` |
| G-E3 | Errors | 403 on direct URL as wrong role | `/403` page |
| G-L1 | Loading | Throttle network (Slow 3G) | skeletons shown, buttons disabled while submitting |
| G-L2 | Empty | New club with no bookings/orders/leads/products | EmptyState with next action on each list |
| G-R1 | Responsive | 360 px member + public pages; 768 px bar POS & kitchen; 1280 staff | no horizontal page scroll; tap targets ≥ 44 px |
| G-A1 | A11y | Keyboard-only: login, booking modal, settle dialog | focus trap, Esc closes, visible focus |
| G-I1 | Integration | Contract check: each page's network tab matches `API_CONTRACT.md` shapes | no `undefined` fields |
| G-I2 | Integration | Money display equals API values (no client recomputation) | ✔ |
| G-I3 | Integration | Polling: kitchen 5 s, grid 20 s, bell 30 s; stops when tab hidden | ✔ |
| G-I4 | Integration | Razorpay test pay success / cancel / bad signature | paid / stays unpaid / error toast |
| G-P1 | PDF | Invoice, receipt, report, payslip PDFs open with correct numbers | ✔ |

---

## H. Frontend AI handoff (if the current AI hits its usage limit)

A replacement AI must:
1. Read `PROJECT_CONTEXT.md` (current task, last step, exact next step, must-not-change), then this file §B–§E, then `API_CONTRACT.md` for the endpoints of the feature at hand.
2. Inspect the repo before coding: `git log -10`, `ls client/src/features`, open the page/component being continued. **Reuse** `components/ui` and `SlotGrid`; never recreate them.
3. Invariants: server data only via RTK Query (`features/*/…Api.js` injected into `baseApi`); no client-side money/availability math; errors via shared handler (toast + inline `setError`); roles via `RequireAuth`; times via `utils/clubTime.js`; all pages implement loading/empty/error states.
4. Commands: `cd client && npm i && npm run dev` · `npm run build` · `npm run test` · mocks on with `VITE_USE_MOCKS=true`.
5. Test accounts come from backend seed (listed in PROJECT_CONTEXT §Environment).
6. Finish by ticking the task ID, listing files changed, writing "Exact next step", and logging any contract mismatch (do **not** edit the contract silently).
7. Unknowns (tax regime, sports list, opening hours, branding) keep their ASSUMPTION values; add open questions to PROJECT_CONTEXT.
