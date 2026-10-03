# MASTER_PLAN.md — Sports Club Management System (The Champions Club)

Companion files: `FRONTEND_EXECUTION_PLAN.md` · `BACKEND_EXECUTION_PLAN.md` · `API_CONTRACT.md` · `PROJECT_CONTEXT.md`.
Source of truth: organizer PDF **"Sports Club Management System"** (the only organizer document received). The `.txt` instruction file is our own brief (stack + planning rules), not an organizer document.

---

## 1. Requirement & Solution Summary

### 1.1 Problem (from the PDF)
Build **one unified platform** — "the digital backbone" — for a busy sports club that has outgrown WhatsApp and Excel. Today: bookings over WhatsApp, members in Excel, bar receipts on paper, availability by phone, **no revenue visibility**.

### 1.2 Users
Front-desk/staff · members (Gold = premium/full access, Silver = standard, Junior = under 18 discounted) · walk-ins/guests · bar & kitchen staff · web visitors/prospects · business clients · the owner. Employees are paid, take leave, work shifts.

### 1.3 Requirements extracted (every "scene" mapped)
| # | Organizer scene | Requirement (as stated) | Status |
|---|---|---|---|
| R1 | New member | Know who they are, their plan, **what the plan entitles** (court rates, shop & bar discounts); membership expiry must be handled automatically ("nobody should have to remember"); any staff can **recognise them quickly** and **see their history** | Mandatory (stated) |
| R2 | Court booking | Sessions 1 h; a new slot opens every 30 min; **max 2 per member per day**; members pay less than walk-ins or nothing by plan; plans change; people cancel; **Friday night social play** (many share a court); **never two people on the same court at once**; walk-ins + phone enquiries "what is free" | Mandatory |
| R3 | Gear up | Sell rackets, balls, shoes, accessories, apparel; always know stock and **when low**; member can **order from home, collect or have delivered**; counter and online come from the **same shelf** | Mandatory |
| R4 | Bar | 20 people at once → orders per table/tab; kitchen must know who ordered what; **member discount automatic**; **run a tab and settle before leaving**; pay **cash/card/UPI**; staff **shifts**; **tables tracked**; daily bar earnings at close | Mandatory |
| R5 | Online | Public site: club, **plans & prices**, **what's free this week**, **what the shop sells**, book a trial; **enquiries must not vanish** → someone is told, follows up, **sends a quote**, welcomes a member | Mandatory |
| R6 | Owner | See **earnings by source (courts/shop/bar) and by method (card/cash/online)** in one place; **what we owe**; **invoice memberships and business clients**; **pay employees; approve leave; report taxes**; see **today / this week / this month**; **share the numbers** | Mandatory |

### 1.4 UNKNOWN (organizers did not say — ask via official channel / portal; until then use ASSUMPTION)
| ID | Unknown | Our ASSUMPTION |
|---|---|---|
| U1 | Judging criteria, scoring weights | Judge on: core flows working end-to-end, correctness of booking rules, breadth across all 6 scenes, UX, demo clarity. **Check hackathon portal/rules** |
| U2 | Submission format, deadline, build window, demo length | 36 h build window for planning (percent-based plan scales) |
| U3 | Sports offered | Brief says "tennis, padel and badminton" (§1) **and** "tennis and cricket courts" (§2) → we support all four (`tennis, cricket, padel, badminton`), courts configurable |
| U4 | Opening hours, number of courts, real prices/discount %, plan durations | 06:00–22:00; 6 courts; Gold 100% court / 15% shop / 15% bar, Silver 30/10/10, Junior 50/10/10; durations 365 days; all editable in settings |
| U5 | Tax regime & rates | GST-style, tax-inclusive prices, placeholder rates in settings |
| U6 | Currency/timezone | INR, Asia/Kolkata (UPI mention) |
| U7 | Social-play rules (window, capacity, price, non-members?) | Friday 18:00–22:00, capacity & price set per session, non-members at full price |
| U8 | Delivery details (fee, area) | flat fee ₹50 configurable, online payment only |
| U9 | Leave policy/balances, payroll rules | 3 leave types, no balances; payroll formula in BR-20 |
| U10 | Tech constraints / mandatory stack | None stated; we use team's preferred stack |
| U11 | Whether auth is required for members to book | Yes (login), staff can book on behalf |
| U12 | Cancellation/refund policy | 2 h cutoff for members; manual refund flag |

### 1.5 Conflicts found in the documents
1. **Sports:** §1 says tennis/padel/badminton club; §2 says tennis and **cricket** courts. → Support both (U3).
2. **"Gold = full access"** vs "members pay less … or nothing at all": → Gold court = free (100%).
3. **Instruction file typos:** "dcript" → bcrypt, "melter" → multer (ASSUMPTION).
No other conflicts.

### 1.6 What we are building (product in one paragraph)
A role-based web app with: **(a)** public website, **(b)** member portal (book, shop, social play, membership), **(c)** staff console (members, bookings, counter POS, bar POS, kitchen display, leads), **(d)** owner area (dashboard, finance, HR, tax, settings) on one Node/Express + Supabase Postgres backend with **one stock table, one booking table with DB-level no-overlap, and one payments ledger**.

### 1.7 Judge-facing "wow" that is also required
Concurrency-safe booking (live demo of two users hitting same slot) · automatic member discounts everywhere · one revenue ledger → dashboard by source and method · enquiry-to-member funnel.

---

## 2. Architecture Summary

```
 Visitor / Member (React SPA)        Staff / Owner (React SPA, same app, role-based routes)
            │  HTTPS, cookie JWT (cc_token), JSON /api/v1
            ▼
      Express API (Node)  ──► zod validation → controllers → services → repos
            │                      │                │               │
            │                      │                └─► Cloudinary (images)
            │                      │                └─► Razorpay (test mode) / nodemailer (SMTP)
            ▼
   Supabase Postgres  (service-role key, server only)
     ├─ EXCLUDE constraint (court_id, time range) → no double booking
     ├─ RPC functions: create_booking, join_social_session, place_shop_order, cancel_shop_order, adjust_stock, quote_court_price
     ├─ products.stock_qty  ← counter + online both decrement
     └─ payments ledger  ← courts, shop, bar, memberships, invoices → dashboard/tax reports
   node-cron jobs: expire memberships · expiry reminders · release unpaid online orders · follow-up reminders
```
Key choices: custom JWT auth (bcrypt) · RTK Query on FE · polling not websockets · server computes money/price/availability · tax-inclusive pricing · club tz Asia/Kolkata. Details: Backend plan §B, Frontend plan §C.
Deployment: FE → Vercel/Netlify; API → Render/Railway (cross-site cookie `SameSite=None; Secure`, CORS allow-list); DB → Supabase. **Deploy staging by CP2**, not at the end.

---

## 3. Frontend Execution Plan → `FRONTEND_EXECUTION_PLAN.md`
## 4. Backend Execution Plan → `BACKEND_EXECUTION_PLAN.md`
## 5. Frontend ↔ Backend Integration Contract → `API_CONTRACT.md` (conventions copied in both plans: FE §D1, BE §D)

---

## 6. Master Development Timeline

Percentages of the total build window (hours shown for a 36 h assumption; scale if different). FE1/FE2/BE1/BE2 work simultaneously unless noted.

| Phase | Window | Objective | Tasks | Owners | Depends on | Deliverables | Completion criteria |
|---|---|---|---|---|---|---|---|
| **1. Understand & freeze** | 0–4% (≈H0–1.5) | Everyone reads PDF + plans; resolve unknowns by ASSUMPTION; freeze contract | Review MASTER/API_CONTRACT; confirm assumptions; create repo (`client/`, `server/`), Supabase project, Cloudinary/Razorpay-test/SMTP keys; branch rules | All | – | Repo, shared `.env` via private channel, frozen contract | All four confirm "contract v1.0 frozen" (CP0) |
| **2. Architecture & setup** | 4–10% (≈H1.5–3.5) | Runnable skeletons | BE1-01/02/03, BE2-01/02; FE1-01, FE2 (fixtures + layout skeleton) | all | 1 | Server `/health`; schema applied; FE shell | **CP1:** login works end-to-end; UI kit shared |
| **3. Parallel foundation** | 10–25% (≈H3.5–9) | Foundations of each domain | BE1-04..07; BE2-03/04; FE1-02..06; FE2-01..03 | all | 2 | Members, plans, courts, availability, products live; public site; staff layout; register member | **CP2:** member registered via UI on real API; availability shown; staging deployed |
| **4. Core features (P0)** | 25–50% (≈H9–18) | Build all P0 | BE1-08/09/11/13; BE2-04/06; FE1-07/09/11; FE2-04/06/07/08/10 | all | 3 | Booking engine, shop orders, bar tabs+kitchen, leads, counter POS | **CP3:** demo flows 1–6 work on real API |
| **5. Integration** | 50–62% (≈H18–22) | Replace all mocks; dashboard live | BE1-13; FE2-11; FE1-13/FE2-16 (P0 parts) | all | 4 | Owner dashboard with real ledger; contract mismatches fixed | **CP4:** every P0 screen uses real data, no mocks |
| **6. P1 features** | 62–78% (≈H22–28) | Add important features | Social play, Razorpay, trial booking, reminders/jobs, invoices, expenses, shifts, leave, tax/export, settings | split per plans | 5 | P1 complete | **CP5:** P1 demoable; feature freeze at ~H31 |
| **7. Testing** | 78–86% (≈H28–31) | Verify against checklists | Run BE §G + FE §G; concurrency tests; role matrix; contract diff | all | 6 | Bug list triaged | No open P0 bug |
| **8. Bug fixing + P2/polish** | 86–93% (≈H31–33.5) | Stability, UX, perf | Fix; payroll (P2), email report (P2), empty/error states, loading, a11y; indexes | all | 7 | Polished UI | P0+P1 stable; P2 only if stable |
| **9. Deploy / submission** | 93–97% (≈H33.5–35) | Production | Prod env, CORS/cookies, seed prod demo data, smoke tests on prod, README, submission form | BE1+FE1 lead; others verify | 8 | Live URLs, README, repo | Smoke suite green on prod |
| **10. Demo prep** | 97–100% (≈H35–36) | Win the demo | Script (7 flows below), backup screen recording, test accounts, rehearse | All | 9 | Demo script + video | Full run ≤ organizer's time limit (**UNKNOWN**) |

**Simultaneously:** FE builds against MSW mocks while BE builds; BE1 and BE2 touch different modules/migrations; FE1 and FE2 touch different feature folders.
**Demo script (7 min):** 1 register member (front desk) → 2 member books court, second user collides on same slot → 3 walk-in booking → 4 online racket order + counter sale same stock → 5 bar tab with auto discount + kitchen → 6 public enquiry → bell → quote → convert → 7 owner dashboard (source × method), invoice PDF, leave approval, tax view.

---

## 7. MVP / P0–P2 Priorities

All six scenes are in the brief; priorities decide **order**, based on how directly a feature is the stated problem (R1–R6). Judging criteria are **UNKNOWN**, so breadth across scenes matters — every scene gets at least a P0 slice.

### P0 — MUST WORK (core fails without)
- Auth + 4 roles; seed data
- Plans (Gold/Silver/Junior) with entitlements; member register; quick search; profile + history; expiry date visible (R1)
- Courts, availability at 30-min steps, 60-min booking, **no double booking**, max 2/day, plan-based price (Gold free), cancel; staff booking for walk-ins (R2)
- Products + categories, single stock, counter sale + online order (pickup), member discount, low-stock indicator (R3)
- Bar: menu, tables, tabs, kitchen queue, automatic member discount, settle cash/card/UPI, daily summary (R4)
- Public site: club, plans/prices, weekly availability, shop catalogue, enquiry → lead + notification (R5)
- Payments ledger + owner dashboard: revenue by source and method for today/week/month (R6)

### P1 — IMPORTANT (after P0 stable)
- Friday social play · membership expiry reminders (job + email/in-app) · plan change/renew · low-stock notifications
- Delivery option · Razorpay online payments · trial booking from public site
- Leads pipeline depth: follow-ups, quotes by email, convert to member
- Shifts · leave request/approval · invoices (members + business clients) · expenses/"what we owe" · tax report · CSV/PDF export · settings UI

### P2 — ENHANCEMENT (only if P0/P1 stable)
- Payroll runs/payslips · email report sharing · Razorpay webhook/refunds · forgot-password · QR on member card · reschedule booking · leave balances · split payments in bar · realtime (Supabase Realtime) instead of polling

---

## 8. AI Handoff / PROJECT_CONTEXT.md Strategy

`PROJECT_CONTEXT.md` (provided, pre-filled) is the single live state file at repo root. Required sections: Project summary · Requirements pointers · Architecture · Tech stack · Folder structure · **Completed tasks** · **Current task** · **Remaining tasks** · Known bugs · API contract pointer + **Contract change log** · Database schema pointer + **Migration log** · Important decisions · Files changed · **Last completed step** · **Exact next step** · **Do-not-change list** · Open questions · Environment/test logins.
Protocol: **Before coding, every AI reads PROJECT_CONTEXT.md. After significant work (every finished task, every decision, every contract/schema change), the AI updates it.** Keep it ≤ ~250 lines (link instead of copying). Only the working AI's owner edits their own task rows to avoid conflicts; commit the file with the code.
Git hygiene supporting handoff: one branch per task, descriptive commits (`BE1-08: create_booking RPC + tests`), `main` always runnable.

AI coding rules (also at top of PROJECT_CONTEXT.md): 1) read context first · 2) inspect existing code before modifying · 3) don't rebuild completed work · 4) no unnecessary libraries · 5) don't change architecture without recording a decision · 6) never change API contract silently · 7) don't break existing functionality · 8) focused changes · 9) test changes · 10) record important decisions · 11) update context after significant work · 12) if uncertain, mark UNKNOWN/ASSUMPTION, don't invent.

---

## 9. Final Risk & Testing Checklist

### 9.1 Quality check (done while planning)
- [x] Every scene R1–R6 mapped to P0/P1 tasks · [x] no requirement silently optional (P2 items are all additions beyond the literal text, except payroll which is in R6 → scheduled last but still planned)
- [x] No invented requirement presented as official — all labelled ASSUMPTION/UNKNOWN
- [x] FE/BE share one contract; DB entities cover every API shape
- [x] Dependencies and handoffs ordered; four people parallel
- [x] Realistic: P0 slice for every scene first, deep P1 afterward

### 9.2 Risks
| Risk | Impact | Mitigation |
|---|---|---|
| Unknown judging criteria | Build the wrong emphasis | Check portal/rules now; keep breadth across 6 scenes; polish demo flows |
| Double-booking race | Fails headline rule | DB exclusion constraint + RPC + concurrency test T-B1 |
| Timezone/slot bugs | Wrong availability | Single `clubTime` util; tests for 06:00/21:00/midnight |
| Cross-site cookie on deploy | Login breaks in prod | Test staging by CP2; `SameSite=None; Secure`; CORS credentials |
| Scope too big for 4 people | Unfinished | Strict P0→P1→P2; feature freeze at ~85%; payroll/tax are cut-able |
| Razorpay/SMTP setup delays | Blocks payment/email demo | Test keys on hour 1; "pay at club" fallback; mail failure never blocks the request |
| Merge conflicts | Lost time | Ownership by module/folder; small PRs; shared files edit-only-own-lines |
| Supabase free-tier limits / host sleep | Demo hiccup | Warm-up before demo; `/internal/jobs` manual trigger; keep seed script handy |
| Data inconsistency (stock/payments) | Wrong dashboard | Only RPC for stock; only `paymentsService` for money; test T-P1, T-D1 |
| Demo day failure | Lose impressions | Backup recording; seeded accounts; rehearsal |

### 9.3 Final ship checklist
- [ ] BE §G tests pass (★ concurrency tests green) · [ ] FE §G checklist passed at 360/768/1280
- [ ] Contract diff run: no field mismatches · [ ] role matrix verified (member can't hit staff APIs)
- [ ] Seeds produce good dashboard · [ ] prod env vars set, cookies work cross-site · [ ] README with setup + test logins
- [ ] No secrets in repo · [ ] Demo script rehearsed · [ ] Backup recording saved · [ ] Submission completed before deadline (**UNKNOWN date — confirm**)
