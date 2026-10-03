# The Champions Club — Sports Club Management System

A unified digital platform for "The Champions Club" sports facility, supporting a public website, member portal, staff console (front desk, courts, shop, bar, kitchen, leads), and owner administration (finance, HR, tax, analytics).

## Project Documentation (Canonical Source of Truth)

Before contributing or modifying code, all developers and AI agents must review the root planning documents:

- [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) — Live project state, task board, and rules (read first)
- [`MASTER_PLAN.md`](./MASTER_PLAN.md) — Master product requirements, scenes, timeline, and architecture overview
- [`API_CONTRACT.md`](./API_CONTRACT.md) — Full REST API specifications, data contracts, and status codes
- [`BACKEND_EXECUTION_PLAN.md`](./BACKEND_EXECUTION_PLAN.md) — Backend implementation guide, database schema, and test matrix
- [`FRONTEND_EXECUTION_PLAN.md`](./FRONTEND_EXECUTION_PLAN.md) — Frontend architecture, component hierarchy, routes, and UI flows
- [`STRUCTURE_NOTES.md`](./STRUCTURE_NOTES.md) — Structure analysis, conflicts, unknowns, assumptions, and setup decisions

## Repository Architecture

```text
├── client/                     # Frontend SPA (React 18, Vite, Tailwind, Redux Toolkit)
│   ├── src/
│   │   ├── app/                # RTK store, baseApi, routing, and role guards
│   │   ├── components/         # Reusable UI kit, layout shells, and cross-domain components
│   │   ├── features/           # Modular domain features (auth, members, bookings, shop, bar, etc.)
│   │   ├── hooks/              # Custom React hooks (useRazorpay, useDebounce, usePolling)
│   │   ├── mocks/              # MSW mock handlers and API fixture datasets
│   │   └── utils/              # Formatting, club timezone conversions, and PDF generators
├── server/                     # Backend REST API (Node.js, Express, Supabase Postgres)
│   ├── db/
│   │   ├── migrations/         # Numbered SQL schema definitions (001_core to 004_functions)
│   │   └── seeds/              # Database seed data scripts (core + commerce)
│   ├── src/
│   │   ├── config/             # External service configurations (Supabase, Razorpay, Cloudinary, etc.)
│   │   ├── jobs/               # Background cron jobs (membership expiry, order release, etc.)
│   │   ├── middleware/         # Auth, validation, rate limiting, and error handling
│   │   ├── modules/            # Domain-driven backend modules (routes, controller, service, repo, schema)
│   │   └── utils/              # Standard responses, error classes, money math, and time helpers
│   └── tests/                  # Concurrency verification, smoke tests, and Postman collection
```

## Quick Start

### Backend API
```bash
cd server
npm install
npm run dev
```

### Frontend Client
```bash
cd client
npm install
npm run dev
```
