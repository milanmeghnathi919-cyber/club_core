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
├── client/   React + Vite (feature-based architecture)
└── server/   Node + Express (routes → controllers → services → repositories → models)
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
cp .env.example .env   # set MONGO_URI and JWT_SECRET
npm run dev            # http://localhost:5000
npm start
```

MongoDB must be running before the server starts. The server exits with a clear message if `MONGO_URI` or `JWT_SECRET` is missing.

## Request flow

Server requests flow through `routes → validators → controllers → services → repositories → models`. Successful responses use `{ success, data }`; errors use `{ success: false, message, details? }`.

In the client, each feature owns its slice, hooks, services, and components. Hooks call feature services, which use the shared `service/api.js` client. Pages import from feature barrels (for example, `@/feature/auth`).
