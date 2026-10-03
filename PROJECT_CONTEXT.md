# PROJECT_CONTEXT.md — live state file (keep ≤ ~250 lines; link, don't copy)

> **Every AI: read this file FIRST. After any significant work, update it before stopping.**
> Last updated: ____ by ____ (FE1/FE2/BE1/BE2, model name)

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
React 18 (Vite, JS) + React Router + Tailwind + Redux Toolkit/RTK Query + RHF/zod + react-toastify + recharts + jsPDF · Node/Express + Supabase Postgres (service role, server only) + bcryptjs + JWT cookie + multer/Cloudinary + nodemailer + Razorpay (test) + node-cron + zod. Details: BE §B, FE §C.
Deploy: FE Vercel/Netlify · API Render/Railway · DB Supabase. URLs: FE ____ · API ____ · Supabase project ____

## 4. Folder structure
`/client` (see FE §C2) · `/server` (see BE §B2) · root: `PROJECT_CONTEXT.md`, plans, `API_CONTRACT.md`. (Update if structure deviates.)

## 5. Task board  (status: ☐ todo · ◐ in progress · ☑ done · ✖ blocked)
**BE1:** ☐01 ☐02 ☐03 ☐04 ☐05 ☐06 ☐07 ☐08 ☐09 ☐10 ☐11 ☐12 ☐13 ☐14 ☐15
**BE2:** ☐01 ☐02 ☐03 ☐04 ☐05 ☐06 ☐07 ☐08 ☐09 ☐10 ☐11 ☐12 ☐13
**FE1:** ☐01 ☐02 ☐03 ☐04 ☐05 ☐06 ☐07 ☐08 ☐09 ☐10 ☐11 ☐12 ☐13
**FE2:** ☐01 ☐02 ☐03 ☐04 ☐05 ☐06 ☐07 ☐08 ☐09 ☐10 ☐11 ☐12 ☐13 ☐14 ☐15 ☐16
Checkpoints: ☐CP0 contract frozen ☐CP1 login e2e + UI kit ☐CP2 members/availability live + staging deployed ☐CP3 P0 screens on real API ☐CP4 dashboard real ☐CP5 P1 done ☐Freeze ☐Prod deployed ☐Demo rehearsed
Handoffs: ☐H-B1 auth ☐H-B2 discount helpers ☐H-B3 payments service ☐H-F1 UI kit ☐H-F2 auth/baseApi ☐H-F3 SlotGrid

## 6. Current work
- **Current task:** ____ (owner ____)
- **Last completed step:** Planning documents generated (no code yet).
- **Exact next step:** CP0 — team reads plans, confirms assumptions U1–U12, creates repo + Supabase project, then BE1-01 / FE1-01 start in parallel.
- **Remaining tasks:** everything in §5 (see plan files for details).

## 7. Known bugs
| ID | Area | Description | Severity | Owner | Status |
|---|---|---|---|---|---|
| – | – | none yet | – | – | – |

## 8. API contract
Canonical: `API_CONTRACT.md` v1.0. **Contract change log** (date · who · change · affects FE/BE):
- (empty)

## 9. Database schema
Canonical: `BACKEND_EXECUTION_PLAN.md` §C. **Migration log** (file · applied on shared DB? · by · notes):
- (empty) — planned: `001_core.sql` (BE1), `002_commerce.sql` (BE2), `003_ops.sql`, `004_functions.sql`.

## 10. Important decisions
| ID | Decision | Date |
|---|---|---|
| D-B1 | Custom JWT auth (bcrypt, httpOnly cookie), not Supabase Auth | plan |
| D-B2 | Concurrency-critical logic as Postgres RPC functions | plan |
| D-B3 | Double-booking prevented by EXCLUDE constraint (`btree_gist`) | plan |
| D-B4 | Numbered SQL migrations; BE1 owns 001, BE2 owns 002 | plan |
| D-B5/6/7/8/9 | zod validation · node-cron + `/internal/jobs` · polling not websockets · added libs list · money numeric(12,2), club tz util | plan |
| D-F1/2/3/4/5/6/7 | RTK Query · RHF+zod, recharts, jsPDF · added libs · cookie `credentials:'include'` · no client money math · polling intervals · MSW mocks first | plan |
| ASSUMPTIONS | INR, Asia/Kolkata, tax-inclusive prices, 06:00–22:00, Friday social, expired membership = walk-in price + warning | plan |
(Add new rows: ID · decision · why · date · who)

## 11. Files changed (append per task)
- (none yet)

## 12. Do NOT change without recording a decision
- Response envelope and error codes · cookie name `cc_token` · `payments` as the single revenue ledger · stock only via RPC · bookings only via `create_booking` · EXCLUDE constraint on bookings · money/availability computed on server · club tz util · folder ownership (FE1/FE2, BE1/BE2 modules).

## 13. Open questions (UNKNOWN items awaiting organizers/owner)
Judging criteria · submission format/deadline · demo length · sports list · hours/prices/discount % · tax regime · social-play rules · delivery rules · leave/payroll policy.

## 14. Environment (fill in; never commit secrets)
Env var names: see BE §B2. Seed logins (after BE1-04/BE2-12): owner ____ · front_desk ____ · bar_staff ____ · member ____ (passwords in private team chat).
Commands: `cd server && npm i && npm run dev | seed | test` · `cd client && npm i && npm run dev | build | test`.

## 15. Handoff note for the next AI (rewrite at every stop)
State: ____ · Branch: ____ · What works: ____ · What is half-done: ____ · Exact next step: ____ · Gotchas: ____
