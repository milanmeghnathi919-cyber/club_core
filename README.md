# 🏆 The Champions Club — Modern Sports Club Management System

[![Node.js](https://img.shields.io/badge/Node.js-v20+-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-v2-764ABC?style=flat&logo=redux&logoColor=white)](https://redux-toolkit.js.org/)

**The Champions Club** is a full-stack, enterprise-grade digital operating platform purpose-built for elite sports facilities, racquet and padel clubs, and multi-sport complexes. Built with a high-performance **React + Vite** frontend and a modular **Node.js + Express + PostgreSQL** backend, it delivers a unified system covering court reservations, membership lifecycles, retail point-of-sale, food & beverage ordering with a live Kitchen Display System (KDS), CRM lead management, automated staff payroll, and executive financial reporting with GST tax invoicing.

---

## 📌 Table of Contents

- [Core Portals & Features](#-core-portals--features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Repository Structure](#-repository-structure)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Quick Start & Installation](#-quick-start--installation)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [Environment Variables](#-environment-variables)
- [Database & Migrations](#-database--migrations)
- [Payment Systems](#-payment-systems)
- [API Architecture & Endpoints](#-api-architecture--endpoints)
- [Available Scripts](#-available-scripts)
- [License](#-license)

---

## 🌟 Core Portals & Features

The platform is designed around 4 distinct, role-tailored portals delivering unified real-time operations:

### 1. 🌐 Public Experience
- **Interactive Club Showcase**: Dynamic court showcases (Tennis, Padel, Badminton, Pickleball, Squash, Cricket Nets), amenities overview, and visitor contact system.
- **Live Court Slot Availability (`/availability`)**: Real-time inspection of bookable slots across all active courts and facilities without requiring upfront login.
- **Membership Plan Comparison (`/plans`)**: Multi-tiered packages (Gold, Silver, Junior) detailing daily allowances, booking windows, and pro shop / cafe discount perks.
- **Pro Shop Catalog (`/shop`)**: Premium sports gear, apparel, racquets, and accessories browseable by category.
- **Secure Onboarding (`/register` & `/login`)**: Member registration, password hashing with bcrypt, role resolution, and automated route redirection.

### 2. 🎾 Member Athlete Portal (`/app`)
- **Athlete Dashboard (`/app`)**: Personalized home displaying active membership status, upcoming matches, quick actions, and club notices.
- **Real-Time Court Booking (`/app/book`)**: Interactive court selector, time-slot reservation, automatic member discounts, and instant checkout.
- **Match Pass & Booking History (`/app/bookings`)**: Detailed schedule of upcoming matches, participant slots, cancellation policies, and invoice receipts.
- **Digital Pass & QR Gate Access (`/app/pass`)**: Live scannable digital access pass for fast turnstile check-ins and member identification.
- **Club Cafe & Lounge Ordering (`/app/cafe`)**: Mobile F&B ordering menu with real-time station routing (Kitchen vs. Bar).
- **Social Matchmaking & Community Play (`/app/social`)**: Match request board to find playing partners at equivalent skill levels.
- **Universal Profile Management (`/profile`)**: Manage personal athlete credentials, emergency contacts, and passwords.

### 3. 🛡️ Staff Operational Console (`/staff`)
- **Master Court Booking Schedule (`/staff/bookings`)**: Complete facility grid view with support for walk-ins, phone reservations, and court maintenance holds.
- **Front-Desk Counter POS (`/staff/pos`)**: Fast retail and court sales checkout with walk-in customer support and split payment methods.
- **Member Directory & Profiles (`/staff/members`)**: Member search, profile inspection, status toggling, and new athlete onboarding (`/staff/members/new`).
- **Retail Inventory Admin (`/staff/products` & `/staff/orders`)**: Product catalog management, real-time stock adjustment logging, and customer order fulfilment tracking.
- **CRM Leads & Sales Pipeline (`/staff/leads`)**: Prospect acquisition funnel, activity logging (calls, emails, meetings), and one-click quote generation for corporate/group packages.
- **Staff Shifts & Leave Desk (`/staff/shifts` & `/staff/leave`)**: Individual shift calendars and time-off request submissions.

### 4. 🍽️ Cafe, Bar & Kitchen Display System (KDS) (`/staff/cafe` & `/bar`)
- **Table Map POS (`/bar/pos`)**: Visual dining table layout, open tabs management, and instant kitchen ticket dispatch.
- **Live Kitchen Display System (`/bar/kitchen`)**: Real-time kitchen & bar preparation queues with live status progression (`pending` ➔ `preparing` ➔ `served`).
- **F&B Inventory Management (`/staff/cafe/inventory`)**: Track ingredients and menu stock levels with automated low-stock warnings.
- **F&B Sales Summary (`/bar/summary`)**: End-of-day sales reconciliation, tax collection summaries, and category performance analysis.

### 5. 💼 Owner Executive Suite (`/owner`)
- **Executive BI Dashboard (`/owner`)**: High-level club KPI metrics, occupancy tracking, and interactive revenue charts via Recharts across courts, shop, memberships, and F&B.
- **HR & Staff Management (`/owner/employees`)**: Employee records, department assignments, salary structures, and role permissions.
- **Automated Payroll Engine (`/owner/payroll`)**: Monthly payroll run execution, allowances & deductions computation, and individual payslip generation with direct PDF download.
- **Operating Expenses Ledger (`/owner/expenses`)**: Facility maintenance, equipment purchases, utility bills, and vendor payment tracking.
- **Corporate Invoices & B2B Billing (`/owner/invoices`)**: GST-compliant corporate invoices, custom line items, tax computations, and downloadable invoice PDFs.
- **Tax & Financial Compliance (`/owner/tax`)**: GST collection registers, output tax breakdowns, and financial exports for accounting.
- **Club Master Settings (`/owner/settings`)**: Operating hours, default tax rates, cancellation cutoff rules, and facility metadata.

---

## 🏗️ Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                 React 18 + Vite Frontend                    │
│   Tailwind CSS v4 • Redux Toolkit • Recharts • jsPDF       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST (/api)
┌──────────────────────────────▼──────────────────────────────┐
│                  Node.js + Express Backend                  │
│   Zod Validation • JWT + RBAC • Nodemailer • Multer/Cloudinary │
└──────────────────────────────┬──────────────────────────────┘
                               │ Parameterized SQL Pool (pg)
┌──────────────────────────────▼──────────────────────────────┐
│                    PostgreSQL Database                      │
│   31 Relational Tables • Direct TCP Pool • SQL Migrations   │
└─────────────────────────────────────────────────────────────┘
```

### Frontend
- **Framework**: [React 18](https://react.dev/) with [Vite 5](https://vitejs.dev/) (fast HMR and optimized production builds)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) for centralized authentication, cart, and domain state
- **Routing**: [React Router v6](https://reactrouter.com/) with nested layouts and role-based redirect guards
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with modern CSS variables, transitions, and dark sport styling tokens
- **Data Visualization**: [Recharts](https://recharts.org/) for executive dashboards and occupancy analytics
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) & [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) for client-side invoice and payslip export
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Runtime & Server**: [Node.js](https://nodejs.org/) (ES Modules) with [Express 4](https://expressjs.com/)
- **Database Access**: Direct connection pool using [`pg`](https://node-postgres.com/) — zero ORM overhead, clean parameterized SQL queries (`$1, $2`)
- **Validation**: [Zod](https://zod.dev/) schema validation on incoming request bodies and parameters
- **Authentication**: JWT (JSON Web Tokens) with dual cookie and Authorization Bearer header support; passwords hashed via [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Security**: [Helmet](https://helmetjs.github.io/) HTTP security headers, [CORS](https://github.com/expressjs/cors), and [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)
- **Background Tasks**: [node-cron](https://github.com/node-cron/node-cron) for automated reservation status and periodic maintenance
- **Asset Storage**: [Cloudinary](https://cloudinary.com/) integration for court, inventory, and profile photo uploads
- **Email Service**: [Nodemailer](https://nodemailer.com/) with Google SMTP transport for verification codes and notices

---

## 📁 Repository Structure

```
.
├── client/                     # Frontend Application (React + Vite)
│   ├── public/                 # Static assets, logos, and manifest
│   ├── src/
│   │   ├── components/         # Reusable UI controls (Modals, Buttons, Tables, Toast)
│   │   ├── config/             # App-wide constants & API endpoints
│   │   ├── feature/            # Feature-sliced hooks, slices, and services
│   │   ├── layout/             # Layout shells (PublicLayout, MemberLayout, StaffLayout, OwnerLayout)
│   │   ├── pages/              # Routed pages organized by role (public, member, staff, bar, owner)
│   │   ├── redux/              # Redux store configuration and router definition
│   │   ├── service/            # Axios API client and interceptors
│   │   ├── utils/              # Formatting helpers (currency, time, date)
│   │   ├── index.css           # Global stylesheet & Tailwind CSS tokens
│   │   └── main.jsx            # React root mount point
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend API Server (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Environment, Postgres pool, Cloudinary, and Mailer config
│   │   ├── controllers/        # Request handlers orchestrating business logic
│   │   ├── db/                 # Database migrations and seed utilities
│   │   │   ├── migrations/     # Versioned SQL migration files
│   │   │   └── seeds/          # Initial seed dataset scripts
│   │   ├── middleware/         # Auth verification, RBAC guard, error handling
│   │   ├── repositories/       # Raw parameterized PostgreSQL queries
│   │   ├── routes/             # REST route declarations grouped by domain
│   │   ├── services/           # Domain business logic & payment processors
│   │   ├── utils/              # Timezone utilities, document number generators
│   │   ├── validators/         # Zod request validation schemas
│   │   ├── app.js              # Express application assembly
│   │   └── server.js           # Server entry point & port listener
│   └── package.json
│
├── .gitignore                  # Git production exclusion rules
└── README.md                   # Project documentation & quick start guide
```

---

## 👥 Role-Based Access Control (RBAC)

The system implements 7 granular roles mapped to 3 operational portals and 1 member portal:

| Role | Portal Access | Primary Capabilities |
| :--- | :--- | :--- |
| **`owner`** | `/owner`, `/staff`, `/app` | Full system access: executive dashboard, payroll, HR, invoices, tax reports, club settings. |
| **`front_desk`** | `/staff`, `/app` | Master court calendar, walk-in bookings, member registration, counter POS sales. |
| **`court_staff`** | `/staff`, `/app` | Court scheduling, equipment rental logs, slot attendance confirmation. |
| **`shop_staff`** | `/staff`, `/app` | Pro shop counter POS, product catalog, inventory adjustments, retail orders. |
| **`bar_staff`** | `/staff/cafe`, `/bar`, `/app` | Dining table POS, open bar tabs, kitchen ticket status tracking, F&B billing. |
| **`cafe_staff`** | `/staff/cafe`, `/bar`, `/app` | Cafe counter ordering, Kitchen Display System (KDS), cafe inventory checks. |
| **`member`** | `/app` | Self-serve court reservations, personal digital QR pass, cafe orders, profile management. |

---

## 🚀 Quick Start & Installation

### Prerequisites

- [Node.js](https://nodejs.org/) **>= 20.0.0**
- [npm](https://www.npmjs.com/) **>= 10.0.0**
- A running **PostgreSQL** instance (local PostgreSQL server or cloud instance such as [Supabase](https://supabase.com/))

---

### 1. Backend Setup

1. Open your terminal and navigate to the `server` directory:
   ```bash
   cd server
   npm install
   ```

2. Create your environment file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your PostgreSQL connection parameters and JWT secret (see [Environment Variables](#-environment-variables)).

4. Verify database connectivity and run schema migrations:
   ```bash
   npm run db:test        # Verifies database connection
   npm run db:migrate     # Applies all pending SQL migrations (creates 31 tables)
   ```

5. (Optional) Run connection checks for all integrations:
   ```bash
   npm run db:check       # Verifies Postgres, Mailer, Cloudinary, and Razorpay
   ```

6. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend API will start on **http://localhost:5000**.*

---

### 2. Frontend Setup

1. In a new terminal window, navigate to the `client` directory:
   ```bash
   cd client
   npm install
   ```

2. Create your client environment configuration:
   ```bash
   cp .env.example .env
   ```
   *Default: `VITE_API_BASE_URL=/api` (development requests are automatically proxied to port 5000).*

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend application will launch on **http://localhost:5173**.*

---

## ⚙️ Environment Variables

### Server (`server/.env`)

| Variable | Required | Default / Example | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | No | `development` | Environment mode (`development` / `production`) |
| `PORT` | No | `5000` | Port for the Express HTTP server |
| `CLIENT_ORIGIN` | Yes | `http://localhost:5173` | Allowed origin for CORS requests |
| `DB_HOST` | Yes | `localhost` or `aws-0-...supabase.com` | PostgreSQL database host |
| `DB_PORT` | Yes | `5432` | PostgreSQL port |
| `DB_NAME` | Yes | `padel_club_dev` or `postgres` | Database name |
| `DB_USER` | Yes | `postgres` | Database username |
| `DB_PASSWORD` | Yes | `your_db_password` | Database password |
| `DB_SSL` | No | `false` (local) / `true` (cloud) | Enable TLS encryption for Postgres connections |
| `JWT_SECRET` | Yes | `your-secure-jwt-secret-at-least-32-chars` | Secret key used for signing auth tokens |
| `JWT_EXPIRES_IN` | No | `7d` | JWT expiration duration |
| `EMAIL_USER` | No | `club@gmail.com` | Gmail address for Nodemailer SMTP |
| `EMAIL_PASS` | No | `16-char-google-app-password` | Google 16-character App Password (not account password) |
| `CLOUDINARY_CLOUD_NAME` | No | `your_cloud_name` | Cloudinary account name for media uploads |
| `CLOUDINARY_API_KEY` | No | `your_api_key` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | No | `your_api_secret` | Cloudinary API Secret |
| `RAZORPAY_KEY_ID` | No | `rzp_test_...` | Razorpay Key ID for online payments |
| `RAZORPAY_KEY_SECRET` | No | `your_razorpay_secret` | Razorpay Key Secret |
| `CLUB_TZ` | No | `Asia/Kolkata` | Facility operating timezone |

### Client (`client/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | No | `/api` | Base URL prefix for backend REST requests |

---

## 🗄️ Database & Migrations

The database is built on relational **PostgreSQL** without ORM abstraction to guarantee optimal query performance and absolute control over transactional integrity.

### Application Tables

The database schema includes **31 core domain tables**:
- **Auth & Accounts**: `users`, `email_verification_codes`, `notifications`
- **Members & Passes**: `members`, `memberships`, `plans`
- **Court Operations**: `courts`, `bookings`, `booking_participants`
- **Pro Shop Retail**: `product_categories`, `products`, `stock_movements`, `shop_orders`, `shop_order_items`
- **Cafe, Bar & KDS**: `bar_tables`, `bar_tabs`, `menu_items`, `bar_order_items`
- **Human Resources**: `employees`, `shifts`, `leave_requests`, `payroll_runs`, `payslips`
- **Corporate & Invoicing**: `clients`, `invoices`, `invoice_items`
- **CRM & Inquiries**: `leads`, `lead_activities`, `quotes`
- **Finance & System**: `payments`, `expenses`, `settings`, `schema_migrations`

### Migration System

Migrations are stored as ordered, idempotent SQL scripts in `server/src/db/migrations/`.
- Every migration executes inside an atomic database transaction (`BEGIN ... COMMIT`).
- Executed migrations are tracked in `schema_migrations`.
- To inspect or apply migrations:
  ```bash
  # Check status without applying
  npm run db:migrate -- --status

  # Apply all pending migrations
  npm run db:migrate
  ```

---

## 💳 Payment Systems

The Champions Club supports a **dual payment architecture**:

1. **Integrated Simulated Payment Engine (Default / Sandbox)**:
   - Built directly into checkout flows for court bookings, memberships, pro shop purchases, and cafe orders.
   - Allows instant test transactions with simulated payment IDs (`SIM_PAY_...`) and immediate status transitions to `paid` without requiring external payment credentials.
   - Ideal for local development, automated testing, and live hackathon presentations.

2. **Razorpay Gateway Integration (Production)**:
   - Configurable via `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
   - Supports online card, net banking, and UPI payments with server-side HMAC signature verification.

---

## 📡 API Architecture & Endpoints

All endpoints are prefixed with `/api` and return standardized JSON responses:

- **Success**: `{ "success": true, "data": ... }`
- **Error**: `{ "success": false, "message": "Reason", "details": ... }`

### Endpoint Summary

| Domain | Route Prefix | Key Endpoints | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth` | `POST /login`, `POST /register`, `POST /logout` | Authentication and session lifecycle |
| **Current User** | `/api/me` | `GET /`, `PUT /profile`, `PUT /password` | Self profile and password management |
| **Email Verification**| `/api/verify-email`| `POST /send`, `POST /verify` | OTP dispatch and email verification |
| **Courts** | `/api/courts` | `GET /`, `GET /:id`, `POST /` *(Staff)* | Facility court listings and management |
| **Bookings** | `/api/bookings` | `GET /`, `POST /`, `GET /availability`, `DELETE /:id` | Court booking calendar & slot reservation |
| **Plans & Members** | `/api/plans`, `/api/members`| `GET /`, `POST /`, `GET /:id` | Membership tiers & athlete directory |
| **Pro Shop** | `/api/products`, `/api/shop` | `GET /`, `POST /`, `POST /orders` | Product catalog, inventory, and retail orders |
| **Cafe & Bar** | `/api/bar` | `GET /tables`, `POST /tabs`, `GET /kitchen/orders` | Table POS, running tabs, and KDS queue |
| **HR & Payroll** | `/api/hr` | `GET /employees`, `POST /shifts`, `POST /payroll/run` | Staff scheduling and monthly payroll runs |
| **Invoices** | `/api/invoices` | `GET /`, `POST /`, `GET /:id/pdf` | Corporate billing and GST invoices |
| **CRM Leads** | `/api/leads` | `GET /`, `POST /`, `POST /:id/activities`, `POST /quotes` | Sales inquiry pipeline and quotation generator |
| **Reports** | `/api/reports` | `GET /revenue`, `GET /occupancy`, `GET /tax` | Financial reporting and analytics |
| **Settings** | `/api/settings` | `GET /`, `PUT /` *(Owner)* | Club operating metadata and tax policies |

---

## 🛠️ Available Scripts

### Backend (`server/`)

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Express server with hot-reload (`--watch`) |
| `npm start` | Runs server in production mode |
| `npm run db:test` | Connects to Postgres and prints table summary |
| `npm run db:migrate` | Applies all pending database migrations |
| `npm run db:check` | Tests Postgres, Cloudinary, Mailer, and Razorpay configs |
| `npm run mail:test` | Tests SMTP authentication without sending emails |
| `npm run db:smoke` | Executes HTTP registration smoke test against Postgres |
| `npm run seed` | Seeds core demo records and catalog items |
| `npm run lint` | Runs ESLint analysis across server code |

### Frontend (`client/`)

| Command | Action |
| :--- | :--- |
| `npm run dev` | Launches Vite local development server with HMR |
| `npm run build` | Compiles optimized production bundle into `dist/` |
| `npm run preview` | Locally serves the production build for testing |
| `npm run lint` | Runs ESLint across client JSX and JS source files |

---

## 📄 License

This project is licensed under the **ISC License**. Built with ❤️ for sports clubs and athletes.
