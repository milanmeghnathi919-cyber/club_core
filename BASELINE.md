# Behavior & Interaction Baseline (Phase 0)

This document establishes the byte-for-byte behavioral baseline across all roles and flows. After each batch of styling overhaul, every item below must function identically without regression.

---

## 1. Role Journeys & Endpoints

| Flow Name | Initiating Role | Primary Endpoint | HTTP Method | Expected Payload / Response | Navigation Target |
|---|---|---|---|---|---|
| **Member Login** | Public | `/api/v1/auth/login` | `POST` | `{ email, password }` -> `{ token, user }` | `/app` |
| **Owner Login** | Public | `/api/v1/auth/login` | `POST` | `{ email, password }` -> `{ token, user }` | `/owner` |
| **Court Staff Login**| Public | `/api/v1/auth/login` | `POST` | `{ email, password }` -> `{ token, user }` | `/staff/bookings` |
| **Shop Staff Login** | Public | `/api/v1/auth/login` | `POST` | `{ email, password }` -> `{ token, user }` | `/staff/products` |
| **Café Staff Login** | Public | `/api/v1/auth/login` | `POST` | `{ email, password }` -> `{ token, user }` | `/staff/cafe/inventory` |
| **Member Registration**| Public | `/api/v1/auth/register` | `POST` | `{ name, email, phone, password }` | `/app` |
| **Book Court** | Member/Staff | `/api/v1/bookings` | `POST` | `{ courtId, date, startTime, endTime }` | Toast + Slot marked booked |
| **Cancel Booking** | Member/Staff | `/api/v1/bookings/:id/cancel` | `PATCH` | Empty body -> returns updated booking | Slot released |
| **Shop Add to Cart**| Member/Public | Redux `cart/addItem` | Client | Product ID, variant, quantity, unit price | Cart drawer badge increments |
| **Shop Checkout** | Member | `/api/v1/shop/orders` | `POST` | `{ items, paymentMethod }` | Order confirmed, cart reset |
| **Member Registration**| Staff/Owner | `/api/v1/members` | `POST` | Member profile details | `/staff/members/:id` |
| **Delete Member** | Owner | `/api/v1/members/:id` | `DELETE` | Returns `{ message, id }` | Toast + removed from directory |
| **Onboard Staff** | Owner | `/api/v1/employees` | `POST` | Employee details + role | Row added to directory |
| **Delete Staff** | Owner | `/api/v1/employees/:id` | `DELETE` | Returns `{ message, id }` | Toast + removed from directory |
| **Mark Payroll Paid**| Owner | `/api/v1/payroll/runs/:id/mark-paid` | `POST` | Method: 'bank_transfer' | Status -> 'paid' |
| **Logout** | All Roles | `/api/v1/auth/logout` | `POST` | Client credentials cleared | `/login` |

---

## 2. Exact Visible Values & Formats Baseline
- **Currency formatting**: `₹` with Indian numbering system (e.g., `₹1,200`, `₹3,68,500`) via `formatCurrency`.
- **Date formatting**: `dd MMM yyyy` (e.g., `04 Oct 2026`) via `formatDate`.
- **Time formatting**: `HH:mm` 24h format (e.g., `06:00 - 07:00`).
- **Plan Codes**: `GOLD`, `SILVER`, `JUNIOR`.
- **Court Names**: Court 1 (Clay), Court 2 (Synthetic), Court 3 (Grass), Court 4 (Padel 1), Court 5 (Padel 2), Court 6 (Badminton).
- **Error Messages**: Exact string mappings from API error responses (`INVALID_CREDENTIALS`, `OVERLAPPING_SHIFT`, `NOT_FOUND`, etc.).

---

## 3. Keyboard & Accessibility Baseline
- Focus rings on all interactive elements (`input`, `select`, `button`, `a`).
- Modal dismissibility via backdrop click and `Escape` key where implemented.
- Form submission triggered on `Enter` key inside text inputs.
