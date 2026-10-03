# The Champions Club — Sports Club Management System

A unified digital platform for "The Champions Club" sports facility. This repository currently contains a React + Vite client and a Node + Express server.

## Project documentation

The planning documents describe the product requirements and intended architecture:

- [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) — Live project state, task board, and contributor rules
- [`MASTER_PLAN.md`](./MASTER_PLAN.md) — Product requirements, timeline, and architecture overview
- [`API_CONTRACT.md`](./API_CONTRACT.md) — REST API specifications and data contracts
- [`BACKEND_EXECUTION_PLAN.md`](./BACKEND_EXECUTION_PLAN.md) — Backend implementation guide and database plan
- [`FRONTEND_EXECUTION_PLAN.md`](./FRONTEND_EXECUTION_PLAN.md) — Frontend architecture and UI flows
- [`STRUCTURE_NOTES.md`](./STRUCTURE_NOTES.md) — Structure analysis, unknowns, and assumptions

## Repository layout

```
.
├── client/   React + Vite + Redux Toolkit (feature-based architecture)
└── server/   Node + Express + pg + Cloudinary + Razorpay
```

## Run the client

```bash
cd client
npm install
npm run dev        # http://localhost:5173
npm run build
npm run preview
```

Copy `client/.env.example` to `client/.env` to override `VITE_API_BASE_URL`. Development requests to `/api` are proxied to the server.

## Run the server

```bash
cd server
npm install
cp .env.example .env   # set DB_* , CLOUDINARY_* , EMAIL_* and JWT_SECRET
npm run db:test        # verify the database connection
npm run db:migrate     # create the 31 tables
npm run dev            # http://localhost:5000
npm start
```

The database is a **direct Postgres connection** (`pg` with a connection pool) — no ORM and no Supabase REST client. Configure it in `.env`:

```
DB_HOST=db.<project-ref>.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=<password>
DB_SSL=true
```

Remote Postgres requires TLS, so leave `DB_SSL=true` and set it to `false` only for a local socket. The server exits at startup with a clear message naming any missing variable.

### Database scripts

| Script | What it does |
| --- | --- |
| `npm run db:test` | Opens a real connection, authenticates, reports tables and doc-number functions |
| `npm run db:migrate` | Applies pending SQL files, one transaction per file |
| `npm run db:migrate -- --status` | Lists applied vs pending without changing anything |
| `npm run db:check` | Checks Postgres, Cloudinary, email and Razorpay together |
| `npm run mail:test` | Authenticate against Google SMTP without sending anything |
| `npm run db:smoke` | End-to-end test: registers over HTTP, verifies the Postgres row, cleans up |
| `npm run db:smoke:verify` | Tests email verification and role enforcement |

### Email

Email uses Google SMTP with an App Password. Set `EMAIL_USER` (the Gmail address) and `EMAIL_PASS` (the 16-character app password from <https://myaccount.google.com/apppasswords>) — **not** your Google account password. 2-Step Verification has to be on before app passwords can be generated.

Mail config is validated lazily rather than at boot, so a missing or wrong app password never blocks migrations or health checks — it only fails when an email is actually due.

Migrations live in `server/src/db/migrations/`. Each file is idempotent and applied inside a transaction, so a failure rolls the whole file back; `schema_migrations` records what has run, making `db:migrate` safe to repeat.

## Request flow

Server requests flow through `routes → validators → controllers → services → repositories`. SQL lives in `repositories/` and is always parameterised (`$1, $2`), never string-concatenated. Successful responses use `{ success, data }`; errors use `{ success: false, message, details? }`.

In the client, each feature owns its slice, hooks, services, and components. Hooks call feature services, which use the shared `service/api.js` client. Pages import from feature barrels (for example, `@/feature/auth`).
