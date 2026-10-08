# 🏆 The Champions Club — Master Implementation Plan (Plan V3)

> **Source of truth:** `Sports_Club_Management_System.pdf` (5 pages, 6 scenes) · **Baseline:** `BASELINE.md` · **Constraints:** `FREEZE_MANIFEST.md`, `STYLE_BLOCKERS.md`
> **Strategy:** Build on the existing, already-working codebase — audit → fortify invariants → close scene gaps → modern polish → demo.

---

## 0. North Star

> *One platform where a member books a court at 6 pm, buys a new racket string, splits a round at the bar, and the owner sees every rupee by tonight — with a zero double-booking guarantee enforced by the database itself.*

**Demo narrative (5 minutes, exactly the PDF's six scenes):**
walk-in signup → busy-evening booking race → racket emergency (shop pickup) → round at the bar with member discount → stranger books a trial online → owner's today/week/month dashboard + CSV share.

---

## 1. Where We Stand Today (verified 06 Oct 2026)

### 1.1 PDF scene → current status map

| # | PDF Scene | Status | Evidence (existing code) |
|---|---|---|---|
| 1 | New member walks in | ✅ Largely done | `memberRoutes.js`, plans w/ discounts, auto-expiry cron `jobs/expireMemberships.js`, expiry reminders `jobs/remindExpiry.js` (7d/1d), member history UI `pages/member/*`, QR pass |
| 2 | Busy-evening booking | ⚠️ Logic done, **tests red** | `bookingService.js` BR-02 court overlap, BR-05 member overlap, `max_bookings_per_day` (default 2), 30-min grid + 60-min sessions in `availabilityService.js`, social play `socialService.js`, unpaid-slot release every 5 min |
| 3 | Gearing up (shop) | ⚠️ Feature done, **atomicity unproven** | Unified stock `products` + `stock_movements`, `fulfilment ∈ {in_store, pickup, delivery}` (`validators/schemas.js:126`), CartDrawer pickup/delivery + delivery fee, low-stock filter & mailer template `mailer.lowStockAlert` |
| 4 | After the match (bar) | ✅ Done & **tested** | `barRoutes`/`barService`, table map POS, open tabs, KDS queues, shifts, EOD `BarSummary.jsx` — `tests/integration/bar.test.js` **PASSES** |
| 5 | Stranger finds club online | ⚠️ Flow exists, needs wiring proof | Landing/Plans/Shop/Availability public pages, `POST /public/trial-bookings` (`publicController.createTrialBooking`), leads CRM + `jobs/followUpReminders.js`, quote generation |
| 6 | Owner at month-end | ⚠️ Data exists, **reports tests red** | `reportsService`, `financeService`, invoices, payroll, leave, expenses, tax; Recharts dashboards; CSV export dep present |

### 1.2 Verified technical baseline — **updated after Phase 0 + Phase 1 (06 Oct 2026)**

| Check | Result |
|---|---|
| `cd server && npm test` | ✅ **exit 0** — **8 suites / 25 tests, all pass** (was: 4 suites, 11 tests red) |
| New coverage | `tests/integration/invariants.test.js` — T-I1 plan daily-limit (Gold 4/day), T-I2 member overlap across courts |
| Jest hygiene | ✅ No "Jest did not exit" — hermetic test mode never opens DB sockets (`config/postgres.js`; real DB via `DB_IN_TESTS=true`) |
| Root cause (was red) | Seeds populate the memory store only; repos query Postgres first → stale dev-DB rows (wrong `member@` hash, leftover `hacker@`) broke logins. See `FOUND_BUGS.md #2` for the resolution. |
| `cd server && npm run lint` | ✅ **exit 0** — new `server/eslint.config.js` (ESLint 9 flat config) + 64 real issues fixed |
| `cd client && npm run lint` | ✅ **exit 0** — new `client/eslint.config.js` + 118 errors fixed (21 intentional warnings) |
| `cd client && npm run build` | ✅ **exit 0** — 3011 modules, 17.3s |
| `cd server && npm run contract:check` | ✅ **exit 0** — 112/112 endpoints, 100% contract compliance |
| `cd server && npm run seed` | ✅ **exit 0** — now also syncs the 4 demo accounts into Postgres (bcrypt-verified) |
| Migration `007_guardrails.sql` | ✅ applied — `bookings_no_overlap` exclusion constraint; **live-proven**: overlapping insert rejected with SQLSTATE `23P01`, cancelled overlap allowed, different court allowed |

> The 11 red tests sit **exactly on the PDF's hardest promises** (no double-booking, shared-shelf stock, walk-in pricing, owner-only reports). Making them green is the single most impressive credibility win available.

---

## 2. The Plan — 5 Phases

### ▶ Phase 0 — Truth: a green, honest baseline *(0.5–1 day)*

| ID | Task | Exit check |
|---|---|---|
| P0-1 | Root-cause the 11 failing integration tests: diff the working `bar.test.js` login fixture vs failing suites (credentials, response envelope, seed state). Fix **whichever side violates `BASELINE.md`** — never weaken an assertion. | `cd server && npm test` → **exit 0**, 23+/23 pass |
| P0-2 | Fix Jest open handles: teardown closes pg pool and skips `initJobs()` under test env (`JEST_WORKER_ID` guard in `server.js`/`app.js` boot path). | No "Jest did not exit" warning |
| P0-3 | Add `client/eslint.config.js` (ESLint 9 flat config, react + react-hooks rules, matches server style). Fix any real errors it surfaces. | `cd client && npm run lint` → **exit 0** |
| P0-4 | Re-verify `npm run contract:check` and `npm run smoke` still pass; record results in this file's §1.2 table. | Both exit 0 |

**Phase 0 rule:** no feature work until the suite is green. Everything downstream depends on trustworthy checks.

---

### ▶ Phase 1 — Fortify the invariants *(1–2 days)* — the PDF's "hard rules"

These are **defense-in-depth**: friendly app-level 409s stay, database becomes the final authority.

| ID | Invariant (PDF wording) | Implementation | Verify with |
|---|---|---|---|
| P1-1 | *"Two people must never end up on the same court at the same time"* | Migration `005_guardrails.sql`: `CREATE EXTENSION IF NOT EXISTS btree_gist;` + `EXCLUDE USING gist (court_id WITH =, tstzrange(start_at,end_at) WITH &&) WHERE status IN ('confirmed','checked_in')` on `bookings`. Map SQLSTATE `23505` → `SLOT_TAKEN` 409 in `errorHandler.js`. Keep existing BR-02 check as the polite first line. | New **race test**: 2 parallel `POST /bookings` → exactly 1×201, 1×409 |
| P1-2 | *"Counter and online orders come from the same shelf"* | Atomic decrement inside the checkout transaction: `UPDATE products SET stock_qty = stock_qty - $1 WHERE id = $2 AND stock_qty >= $1 RETURNING stock_qty` → miss ⇒ `OUT_OF_STOCK` 409; write `stock_movements` row in same tx. Applies to POS, shop checkout, and bar retail alike. | T-P2, T-P3 green |
| P1-3 | *"Each member can play at most twice a day"* | Confirm daily-count check (`bookingService.js:113`, `socialService.js:133`) keyed on **club timezone date** (`CLUB_TZ`), applied to social sessions and staff walk-ins too; add negative test + edge case (midnight boundary). | New unit/integration tests |
| P1-4 | *"Nobody should remember when membership runs out"* | Boundary tests for `expireMemberships` (expired ⇒ cannot book, rate reverts to walk-in) and `remindExpiry` windows (7d/1d). | `jobs` tests green |
| P1-5 | *"Members pay less than walk-ins, or nothing, per plan"* | Lock plan discount math in tests: Gold/Silver/Junior × court/shop/bar, free-tier plan, walk-in = no discount. | Extend `money.test.js` |

**Phase 0+1 exit:** `npm test` green **including the new invariant/race tests**; `db:migrate` idempotent from scratch.

---

### ▶ Phase 2 — Close the six-scene gaps *(2–3 days)*

| ID | Scene | Work | Done when |
|---|---|---|---|
| P2-1 | 1 · Walk-in | One-glance member recognition at staff desk: QR/member-code lookup, status banner (active/expiring/expired), full history timeline on one screen | Staff finds any member in ≤3 clicks/1 scan |
| P2-2 | 2 · Busy evening | Availability grid truth-check: :00 **and** :30 starts, 60-min sessions, live "just taken" handling on collision (optimistic UI rollback + toast), Friday social mode visible | Two browsers race for one slot → one wins, loser sees friendly message |
| P2-3 | 3 · Gear | Wire `mailer.lowStockAlert` to the actual stock-decrement path (once per threshold crossing via `low_stock_alerted`); pickup/delivery order statuses drive `OrdersAdmin` queue | Stock drops below threshold → one email + staff badge; same SKU decrements from POS *and* web |
| P2-4 | 4 · Bar | Keyboard-first burst mode for the 20-people rush: table tiles, open-tab hotkeys, Enter-to-send to KDS, auto member-discount display | Order of 20 covers taken < 90 s in manual timing |
| P2-5 | 5 · Online stranger | Trial path end-to-end: `Contact?trial=true` → `POST /public/trial-bookings` → staff notification → follow-up task → quote → one-click "convert to member" | Every trial enquiry appears in staff CRM; none vanish (fail test on orphan) |
| P2-6 | 6 · Owner | `today · this week · this month` toggle on every chart; single revenue ledger (courts+shop+bar × card/cash/online); "what we owe" (tax + payroll + expenses); CSV **and** print/PDF export | Owner answers all four PDF questions in ≤3 clicks |

---

### ▶ Phase 3 — The Modern Polish layer *(2 days)* — zero new runtime deps

*Respects `STYLE_BLOCKERS.md`: no dependency additions — Tailwind v4, CSS keyframes, Lucide, Recharts only.*

- **Real-time feel:** skeleton loaders everywhere, optimistic mutations with rollback, stale-while-revalidate polling on availability/KDS, "slot just taken" toast.
- **⌘K command palette** (staff/owner): jump to member, booking, product, table, lead — pure client, keyboard accessible.
- **Micro-interactions:** booking-confirmation success animation, revenue count-up tween on dashboards, KDS status transitions, subtle court-grid hover glow.
- **Accessibility lock-in per `BASELINE.md` §3:** focus rings on all controls, Escape closes modals, Enter submits forms — run a manual keyboard-only pass on the 6 demo flows.
- **Performance:** route-level `React.lazy` code splitting for owner/staff/bar bundles, lazy images, verify production `npm run build` size and no runtime warnings.
- **Public-site PWA-lite:** web manifest + theme color + responsive meta (service worker only if explicitly approved — it adds a dependency/plugin).

**Exit:** `cd client && npm run lint && npm run build` → exit 0; six demo flows keyboard-navigable.

---

### ▶ Phase 4 — Executive wow *(1 day)*

- Owner dashboard: stacked revenue by stream, occupancy heat map (courts × hours), today/week/month + comparison deltas, KPI sparklines.
- Share-ready output: one-click CSV (`csv-stringify` already present) and print-optimized PDF view (jsPDF already present) — "share the numbers when needed."
- Testimonial strip on public site using real seeded metrics (occupancy %, members served).

---

### ▶ Phase 5 — Demo & ship *(0.5 day)*

1. From scratch: `db:migrate` → `npm run seed` → `db:check` → `contract:check` → `smoke` → full `npm test` → client `lint` + `build`. **All exit 0.**
2. Script the 5-minute demo (six scenes, one minute each) with prepared accounts for every RBAC role.
3. Update `README.md` badges/claims to match reality; record final results in §1.2 of this file.

---

## 3. Acceptance Criteria (traceable to the PDF)

| PDF requirement | Criterion | Phase |
|---|---|---|
| Never double-book a court | DB exclusion constraint + passing race test | P1-1 |
| 60-min sessions, :30 slot grid | Availability service + UI grid test | P2-2 |
| Max 2 plays/member/day | Server-side count incl. social sessions + tests | P1-3 |
| Members pay less / free per plan | Discount math unit tests (3 tiers × 3 streams) | P1-5 |
| Friday social play, shared court | Social sessions bookable, overlap-checked | P2-2 |
| Auto membership expiry + recognition | Cron boundary tests + ≤3-click lookup | P1-4, P2-1 |
| One shelf: counter + online | Atomic decrement test (T-P2/P3) | P1-2 |
| Low stock always visible | Threshold email + staff badge, single-fire | P2-3 |
| Bar burst, auto discounts, tabs, EOD earnings | Already passing `bar.test.js` + keyboard burst mode | P2-4 |
| Enquiry never vanishes | Trial → CRM → follow-up → quote → member, orphan test | P2-5 |
| Public site: plans, prices, free slots, shop, trial | Public pages + `POST /public/trial-bookings` E2E | P2-5 |
| Owner: one place, today/week/month, share | Reports toggle + ledger + CSV/PDF export | P2-6, P4 |
| Invoices, payroll, leave, tax | Existing modules — covered by green reports tests | P0-1 |

---

## 4. Guardrails 🚧

1. **`BASELINE.md` is law** — byte-for-byte behavior of listed flows must not regress; every phase re-runs the baseline flows.
2. **No assertion weakening** — a red test gets a root-cause fix, never a `.skip`, `todo`, or loosened matcher. Any contract change updates `API_CONTRACT` + Postman/OpenAPI generators together.
3. **`STYLE_BLOCKERS.md`** — no new runtime dependencies without an explicit, recorded decision.
4. **Migrations idempotent & transactional** (`BEGIN…COMMIT`, tracked in `schema_migrations`) — new `005_guardrails.sql` must survive a from-scratch run.
5. **Fix the cause, not the symptom** — especially P0-1: `bar.test.js` proves the fixture *can* work; align the others to it.

---

## 5. Verification Commands (run before declaring any phase done)

```bash
cd server && npm test                 # exit 0, all suites green (P0-1 onward)
cd server && npm run lint             # exit 0
cd server && npm run contract:check   # exit 0
cd server && npm run smoke            # exit 0
cd server && npm run db:migrate       # idempotent from scratch
cd client && npm run lint             # exit 0 (after P0-3)
cd client && npm run build            # exit 0, no warnings
```

---

## 6. Risks

| Risk | Mitigation |
|---|---|
| Red tests hide a real contract bug (not just fixtures) | P0-1 diffs against passing `bar.test.js` + `BASELINE.md` before touching code |
| Exclusion constraint rejects legacy rows | Pre-flight `NOT VALID` + data check in migration; clean seed data first |
| Style freeze blocks polish ideas | Log new ideas in `STYLE_BLOCKERS.md` style with a proposed resolution instead of improvising |
| Jest open handles mask flakiness | P0-2 teardown fix; keep `--runInBand` for DB suites |
| Scope creep across 6 scenes | Phase order is intentional: **green → guardrails → gaps → glamour → demo** |

---

*Plan authored 06 Oct 2026 from full analysis of `Sports_Club_Management_System.pdf` + verified repo state. Update §1.2 after every baseline run.*
