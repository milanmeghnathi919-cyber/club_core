# PROJECT_CONTEXT.md — live state file (keep ≤ ~250 lines; link, don't copy)

> **Every AI: read this file FIRST. After any significant work, update it before stopping.**
> Last updated: 2026-10-03 by BE Lead (Antigravity Agent)

## 0. AI coding rules (project-wide)
1. Read this file first. 2. Inspect existing code before modifying it. 3. Do not rebuild completed functionality.
4. Do not add libraries unless necessary (record in Decisions). 5. Do not change architecture without recording a decision.
6. Do not change `API_CONTRACT.md` silently — edit it, log below, tell the other side. 7. Do not break existing functionality.
8. Make focused changes. 9. Test your changes (see plan §G). 10. Record important decisions. 11. Update this file after significant work.
12. If uncertain, mark **UNKNOWN**/**ASSUMPTION** — never invent official requirements.

## 1. Project summary
Sports Club Management System for "The Champions Club" (hackathon). One platform: public website, member portal, staff console (members, courts, shop, bar, kitchen, leads), owner area (dashboard, finance, HR, tax). Team: FE1, FE2, BE1, BE2. Source docs: organizer PDF; plans in `MASTER_PLAN.md`, `FRONTEND_EXECUTION_PLAN.md`, `BACKEND_EXECUTION_PLAN.md`, `API_CONTRACT.md`.

## 2. Requirements (pointer)
R1–R6 in `MASTER_PLAN.md` §1.3. Unknowns U1–U12 in §1.4 (confirm with organizers; defaults = ASSUMPTION).
Hard rules: **no double booking** · 60-min sessions / 30-min slot start · max 2 bookings per member per day · plan-based prices (Gold free) · one stock shared by counter+online · automatic member discounts · one payments ledger.

## 3. Architecture & stack
React 18 (Vite, JS) + React Router + Tailwind + Redux Toolkit/RTK Query + RHF/zod + react-toastify + recharts + jsPDF · Node/Express (ES Modules) + Supabase Postgres (service role, server only) + bcryptjs + JWT cookie + multer/Cloudinary + nodemailer + Razorpay (test) + node-cron + zod. Details: BE §B, FE §C.
Deploy: FE Vercel/Netlify · API Render/Railway · DB Supabase. URLs: FE ____ · API http://localhost:5000/api/v1 · Supabase project ____

## 4. Folder structure
`/client` (see FE §C2) · `/server` (layered architecture: `controllers`, `services`, `repositories`, `routes`, `validators`, `middlewares`, `jobs`, `db/seeds`, `scripts`, `tests`) · root: `PROJECT_CONTEXT.md`, plans, `API_CONTRACT.md`.

## 5. Task board  (status: ☐ todo · ◐ in progress · ☑ done · ✖ blocked)
**BE1:** ☑01 ☑02 ☑03 ☑04 ☑05 ☑06 ☑07 ☑08 ☑09 ☑10 ☑11 ☑12 ☑13 ☑14 ☑15
**BE2:** ☑01 ☑02 ☑03 ☑04 ☑05 ☑06 ☑07 ☑08 ☑09 ☑10 ☑11 ☑12 ☑13
**FE1:** ☑01 ☑02 ☑03 ☑04 ☑05 ☑06 ☑07 ☑08 ☑09 ☑10 ☑11 ☑12 ☑13
**FE2:** ☑01 ☑02 ☑03 ☑04 ☑05 ☑06 ☑07 ☑08 ☑09 ☑10 ☑11 ☑12 ☑13 ☑14 ☑15 ☑16
Checkpoints: ☑CP0 contract frozen ☑CP1 backend ready & verified ☑FE login e2e + UI kit ☑CP2 members/availability live ☑CP3 P0 screens on real API ☑CP4 dashboard real ☑CP5 P1 done ☑Freeze ☑Prod built ☑Demo rehearsed
Handoffs: ☑H-B1 auth ☑H-B2 discount helpers ☑H-B3 payments service ☑H-F1 UI kit ☑H-F2 auth/baseApi ☑H-F3 SlotGrid

## 6. Current work
- **Current task:** Full-Stack Complete & Demo-Ready (Frontend & Backend Integrated).
- **Last completed step:** Complete User Login & Registration flow implemented across backend and frontend. Polished `Login.jsx` (with show/hide password, remember me, error banners, demo accounts, forgot password modal), created `Register.jsx` (with real-time password strength, confirmation check, club etiquette terms, evaluator 1-click test fill, duplicate email/phone handling, automatic member code generation), session hydration in `authSlice.js`, and public header integration with `/register` and `/login`.
- **Exact next step:** 7-Minute Judge Demo and walkthrough.
- **Remaining tasks:** None. All backend and frontend tasks completed and verified against running servers.

## 7. Known bugs
| ID | Area | Description | Severity | Owner | Status |
|---|---|---|---|---|---|
| – | – | None. 100% contract check & smoke tests passing | – | – | – |

## 8. API contract
Canonical: `API_CONTRACT.md` v1.1. Contract audit: 112/112 endpoints matching (0 missing).
- Postman Collection: `server/tests/collection.json`
- OpenAPI Specification: `server/docs/openapi.yaml`
- Contract Check Script: `npm run contract:check`

## 9. Database schema
Canonical: `BACKEND_EXECUTION_PLAN.md` §C.
- Migration files: `001_core.sql`, `002_commerce.sql`, `003_ops.sql`, `004_auth_roles.sql`
- High-fidelity In-Memory & DB Seed: `server/src/db/seeds/seed.js` (`npm run seed`)
- 370 seeded transactions, 30 days of payments across all revenue streams.

## 10. Important decisions
| ID | Decision | Date |
|---|---|---|
| D-B1 | Custom JWT auth (bcrypt, httpOnly cookie `cc_token` + Bearer header support) | plan |
| D-B2 | Concurrency-critical logic with guarded execution & rollback | plan |
| D-B3 | Double-booking prevented by slot exclusion check & advisory lock | plan |
| D-B4 | Numbered SQL migrations & in-memory mirror store for 100% offline fallback | plan |
| D-B5/6/7/8/9 | zod validation · node-cron + `/internal/jobs` · polling not websockets · `date-fns-tz` for Asia/Kolkata | plan |
| D-B10 | Same-origin API proxy `/api` and `/api/v1` supported simultaneously | implementation |
| D-B11 | BR-13 Single Revenue Ledger: all money writes route exclusively through `paymentsService.record` | implementation |
| D-B12 | Static routes registered before parameterized `/:id` routes to prevent route swallows | implementation |
| D-F1 | Tailwind v4 with `@tailwindcss/vite` & athletic luxury heritage palette (clay, grass, carbon) | implementation |
| D-F2 | Zero-client finance math: all quotes, taxes, and discounts derived from `POST /shop/orders/quote` | implementation |
| D-F3 | Floating presenter `RoleSwitcher` overlay allowing instant 1-click role swapping for hackathon judging | implementation |
| D-F4 | Vite code splitting with manual chunks (`vendor-react`, `vendor-charts`, `vendor-pdf`) | implementation |

## 11. Files changed (append per task)
- Layered backend modules in `server/src/`: `controllers/`, `services/`, `repositories/`, `routes/`, `validators/`, `jobs/`, `middlewares/`, `utils/`
- Seeds & tests: `server/src/db/seeds/`, `server/tests/unit/`, `server/tests/integration/`, `server/tests/collection.json`, `server/docs/openapi.yaml`
- Complete frontend in `client/`:
  - UI kit: `src/components/ui/` (`Button`, `Input`, `Select`, `Badge`, `Card`, `Modal`, `Skeleton`, `EmptyState`, `Toast`)
  - Domain components: `src/components/common/` (`RoleSwitcher`, `SlotGrid`, `MemberQuickSearch`, `CartDrawer`)
  - Layouts: `src/layout/` (`PublicLayout`, `MemberLayout`, `StaffLayout`, `OwnerLayout`)
  - Pages: `src/pages/public/`, `src/pages/member/`, `src/pages/staff/`, `src/pages/bar/`, `src/pages/owner/`
  - Services: `src/service/` (`api.js`, `authService`, `courtService`, `memberService`, `shopService`, `barService`, `leadService`, `financeService`, `hrService`, `publicService`)
  - Store & Router: `src/redux/store/`, `src/feature/shop/cartSlice.js`, `src/redux/router/`
  - Design & Analysis docs: `FRONTEND_ANALYSIS.md`, `FRONTEND_EXECUTION_PLAN.md`

## 12. Do NOT change without recording a decision
- Response envelope: `{ success: true, data, meta? }` and `{ success: false, error: { code, message, details? } }`
- Cookie name `cc_token` (httpOnly)
- Single revenue ledger `payments` (BR-13)
- BR-16 Tax inclusive formula: `tax = gross * rate / (100 + rate)`
- Club timezone: `Asia/Kolkata`

## 13. Open questions (UNKNOWN items awaiting organizers/owner)
- Razorpay test keys (mocked with graceful fallback when omitted)
- Cloudinary credentials (fallback memory store when omitted)
- SMTP credentials (non-blocking notification logger when omitted)

## 14. Environment
- Port: 5000 (default) or `process.env.PORT`
- Test Logins:
  - Owner: `owner@championsclub.in` / `Admin@123`
  - Front Desk: `frontdesk@championsclub.in` / `Staff@123`
  - Bar Staff: `bar@championsclub.in` / `Staff@123`
  - Member: `member@championsclub.in` / `Member@123`
- Environment Variables:
  - Database: Direct Supabase PostgreSQL (`DB_HOST`, `DB_PORT=5432`, `DB_NAME=postgres`, `DB_USER=postgres`, `DB_PASSWORD`, `DB_POOL_MAX=10`, `DB_SSL=true`)
  - Email OTP: Google Application Pass Key (`EMAIL_USER`, `EMAIL_PASS` - all SMTP vars removed)
- Commands:
  - `npm run dev`: Start Express API server with file watch
  - `npm run seed`: Populate database with core & commerce demo data
  - `npm test`: Run complete Jest unit and integration test suite
  - `npm run contract:check`: Audit registered routes against `API_CONTRACT.md`
  - `npm run smoke`: Run end-to-end smoke test against running server
  - `npm run mail:test`: Verify Google SMTP connection with EMAIL_USER / EMAIL_PASS

## 15. Handoff note for Judges & Evaluators
State: Complete Full-Stack Platform · Branch: main · What works: 100% of endpoints in API_CONTRACT.md v1.1 and complete interactive UI for all 5 roles (Public, Member, Front Desk, Bar/Kitchen, Owner). Live court booking matrix, online pro shop with live server pricing quotes, member digital QR pass, POS with split payments, Bar Tab manager with real-time KDS workflow, and Owner financial executive suite with revenue analytics and PDF invoice downloads. RoleSwitcher floating widget enables 1-click role jumping across the entire presentation.
