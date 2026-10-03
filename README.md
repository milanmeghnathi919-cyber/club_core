# Fullstack Starter

Two independent apps, no root package.json and no workspaces. Install and run each on its own.

```
.
├── client/   React + Vite  (feature-based architecture)
└── server/   Node + Express (routes → controllers → services → repositories → models)
```

## client/

```bash
cd client
npm install
npm run dev        # http://localhost:5173
npm run build
npm run preview
```

Structure:

```
src/
├── assets/            images, icons, fonts
├── components/        ui, forms, feedback  (shared only)
├── config/
├── feature/           one folder per feature
│   └── auth/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── slices/
│       └── index.js   feature barrel
├── hooks/             common, api          (shared hooks)
├── layout/
├── pages/
├── redux/
│   ├── store/         configureStore
│   └── router/        createBrowserRouter
└── service/
    └── api.js         shared axios instance
```

Copy `.env.example` to `.env` if you need to override `VITE_API_BASE_URL`. Dev requests to `/api` are proxied to the server.

## server/

```bash
cd server
npm install
cp .env.example .env   # set MONGO_URI and JWT_SECRET
npm run dev            # http://localhost:5000
npm start
```

Request flow: `routes → validators → controllers → services → repositories → models`.
Responses are `{ success, data }`; errors are `{ success: false, message, details? }`.

## Request flow in the client

A feature owns its slice, hooks, services and components. `hooks` talk to `services`, `services` talk to `service/api.js`, and results land in the slice via a hook. Pages import from the feature barrel (`@/feature/auth`), never from a slice directly.

## Scripts

| Command | Where | What it does |
| --- | --- | --- |
| `npm run dev` | client | Vite dev server on 5173 |
| `npm run build` | client | production bundle to `dist/` |
| `npm run preview` | client | serve the built bundle |
| `npm run dev` | server | node --watch, reloads on change |
| `npm start` | server | run without the watcher |

MongoDB must be running before `server` starts; the process exits with a clear message if `MONGO_URI` or `JWT_SECRET` is missing.