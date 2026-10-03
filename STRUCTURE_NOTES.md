# STRUCTURE_NOTES.md — Architectural Analysis & Structure Decisions

This document records the architectural findings, conflicts, unknowns, assumptions, and structure decisions extracted from the five canonical planning documents (`PROJECT_CONTEXT.md`, `MASTER_PLAN.md`, `API_CONTRACT.md`, `BACKEND_EXECUTION_PLAN.md`, and `FRONTEND_EXECUTION_PLAN.md`).

---

## Conflicts

1. **Sports Offered Across Sections (MASTER_PLAN §1.5, U3)**
   - *Conflict:* Section 1 of the organizer brief states the club is for "tennis, padel and badminton", whereas Section 2 references "tennis and cricket courts".
   - *Resolution in Architecture:* All four sports (`tennis`, `cricket`, `padel`, `badminton`) are supported in enums, database schema (`sport_enum`), court configuration, and slot generators.
2. **Membership Tier Pricing for Courts (MASTER_PLAN §1.5)**
   - *Conflict:* "Gold = premium/full access" vs "members pay less than walk-ins or nothing at all by plan".
   - *Resolution in Architecture:* Gold court access discount is set to 100% (`price = 0`, `paymentStatus = waived`), Silver to 30%, and Junior to 50%, with default parameters configurable in settings.
3. **Instruction File Typographical Errors (MASTER_PLAN §1.5)**
   - *Conflict:* The brief mentions "dcript" and "melter".
   - *Resolution in Architecture:* Interpreted as standard libraries `bcryptjs` and `multer`.
4. **Member Portal Page Routing vs Structure Specification (FE §B1, §C2, §E1)**
   - *Conflict:* FE §C2 summarizes `features/members/pages/{MemberList,MemberNew,MemberProfile}.jsx`, while FE §B1 and FE1-06 / FE1-10 explicitly detail member portal screens for Dashboard, Membership benefits/renewal, and Profile at `/app`, `/app/membership`, and `/app/profile` under `features/members/member/*`.
   - *Resolution in Architecture:* Both structures are created. Staff member management pages live in `features/members/pages/` (`MemberList.jsx`, `MemberNew.jsx`, `MemberProfile.jsx`), while member self-service portal screens are housed in `features/members/member/` (`Dashboard.jsx`, `Membership.jsx`, `Profile.jsx`).

---

## Unknowns

As documented in `MASTER_PLAN.md` §1.4 (U1–U12), the following requirements were not specified by the organizers and await official clarification:
- **U1 (Judging Criteria & Weights):** Official rubric unstated; planned for end-to-end flow integrity across all 6 scenes, concurrency safety, and UX clarity.
- **U2 (Submission Format & Window):** Official deadline/window unstated; scaled around a nominal 36-hour build benchmark.
- **U3 (Exact Sports List):** Brief mentions tennis, padel, badminton, and cricket courts across different sections.
- **U4 (Operating Parameters):** Exact operating hours (assumed 06:00–22:00), number of courts (assumed 6), exact base rates, and plan discount percentages.
- **U5 (Tax Regime):** Exact applicable tax rules/rates (assumed GST-style tax-inclusive pricing, configurable via `settings.taxRates`).
- **U6 (Currency & Timezone):** Assumed INR currency (₹) and `Asia/Kolkata` club timezone based on UPI references.
- **U7 (Social Play Rules):** Session window (assumed Friday 18:00–22:00), per-session capacity, and non-member pricing.
- **U8 (Delivery Terms):** Delivery geographic perimeter and fee (assumed flat ₹50 configurable fee).
- **U9 (Leave & Payroll Policy):** Exact leave balance rules (modeled as 3 types without balance accrual; payroll formula documented in BR-20).
- **U10 (Mandatory Tech Constraints):** No organizer-mandated stack specified; architecture adheres to documented choices (React 18 + Node/Express + Supabase Postgres).
- **U11 (Member Booking Auth Requirement):** Assumed login is required for member self-booking; staff can book on behalf of members or walk-in guests.
- **U12 (Cancellation Window):** Cancellation cut-off assumed at 2 hours prior to slot start for members; staff unrestricted.

---

## Assumptions

- **Single Revenue Ledger (BR-13):** Every cash-in must write to `payments` with `status=paid`. Waived (e.g., Gold 100% discount) bookings generate no payment row.
- **Concurrency & Double-Booking Prevention (D-B2, D-B3):** Race conditions on court bookings and stock updates are strictly guarded at the database level using Postgres RPC functions (`create_booking`, `place_shop_order`, etc.) and a `btree_gist` EXCLUDE constraint over `(court_id, tstzrange)`.
- **Stateless Polling (D-B7, D-F6):** Real-time features (kitchen display 5s, booking grid 20s, notifications 30s) use HTTP polling over RTK Query rather than WebSockets.
- **Client Computation Ban (D-F5):** Totals, discounts, tax amounts, and slot availability are never calculated authoritatively on the client. The frontend consumes server-quoted values (`/shop/orders/quote`, `/courts/availability`, etc.).
- **Dual Workspace Setup:** The application consists of a separate `/client` React SPA (Vite) and `/server` Node/Express API with distinct `package.json` configurations, run from the root via directory traversal.

---

## Decisions Made During Structure Generation

1. **Root Planning Documents Preservation:**
   All five original planning files (`PROJECT_CONTEXT.md`, `MASTER_PLAN.md`, `API_CONTRACT.md`, `BACKEND_EXECUTION_PLAN.md`, `FRONTEND_EXECUTION_PLAN.md`) are placed directly at the repository root as mandated by `PROJECT_CONTEXT.md` §4, preserving their contents without alteration.
2. **Backend Modular Architecture:**
   All 27 documented modules in `server/src/modules/` (`auth`, `users`, `plans`, `members`, `memberships`, `courts`, `availability`, `bookings`, `social`, `products`, `shop`, `payments`, `bar`, `leads`, `notifications`, `settings`, `uploads`, `invoices`, `clients`, `expenses`, `employees`, `shifts`, `leave`, `payroll`, `reports`, `public`, `jobs`) follow the documented uniform 5-file pattern (`.routes.js`, `.controller.js`, `.service.js`, `.repo.js`, `.schema.js`).
3. **Database Migration Numbering:**
   Migrations follow the explicit plan sequence:
   - `001_core.sql` (BE1: Core users, members, courts, bookings, payments, notifications)
   - `002_commerce.sql` (BE2: Products, stock, shop orders, bar tables/tabs/menu)
   - `003_ops.sql` (BE1: Leads/CRM; BE2: Invoices, clients, expenses, employees, shifts, leave, payroll)
   - `004_functions.sql` (BE1 & BE2: Concurrency-safe RPC functions)
4. **Frontend UI Kit and Domain Component Layout:**
   - Universal primitives specified in FE §B2 and FE1-02 are placed in `client/src/components/ui/`.
   - Layout shells (`PublicLayout.jsx`, `MemberLayout.jsx`, `StaffLayout.jsx`) reside in `client/src/components/layout/`.
   - Shared cross-domain cards and modals (`PriceTag`, `MemberCard`, `ProductCard`, `CartDrawer`, `OrderStatusStepper`, `NotFound`, `Forbidden`) reside in `client/src/components/common/`.
   - Domain-specific components are colocated in their respective feature folders (e.g., `SlotGrid` in `bookings/components/`, `TableTile` and `KitchenTicket` in `bar/components/`, `LeadCard` in `leads/components/`, `RevenueChart` in `reports/components/`).
5. **Testing Architecture:**
   - Backend contains smoke tests in `server/tests/smoke/`, the required concurrency test `server/tests/concurrency.test.js`, and the API collection `server/tests/collection.json`.
   - Frontend contains unit tests for utils and store slices in `__tests__/` subdirectories and MSW mock handlers and fixtures in `client/src/mocks/`.
6. **No Implementation Code Included:**
   All JavaScript, JSX, and SQL files are created as structural skeletons with minimal safe placeholders (clean exports, schema stubs, or component shells) ensuring zero application business logic is pre-implemented.
