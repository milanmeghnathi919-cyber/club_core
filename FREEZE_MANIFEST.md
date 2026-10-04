# Freeze Manifest (Phase 0)

This manifest lists all frozen paths, route specifications, roles, IDs, form names, and API contracts that **must not be edited, renamed, moved, or deleted** during the style overhaul.

---

## 1. Forbidden Paths
- Backend directory: `server/**`
- Database & Migrations: `server/src/db/**`, `server/src/models/**`
- API Layer & Services: `client/src/service/**`, `server/src/routes/**`, `server/src/controllers/**`, `server/src/services/**`, `server/src/repositories/**`
- Redux Store & Slices: `client/src/redux/store.js`, `client/src/feature/**/*.js`, `client/src/feature/**/*.slice.js`
- Router Config: `client/src/redux/router/index.jsx`
- Core Utilities: `client/src/utils/format.js`, `client/src/utils/staffRoles.js`, `client/src/utils/validation.js`
- Package Configs: `client/package.json`, `client/vite.config.js`, `server/package.json`

---

## 2. Frozen Route Architecture
All paths, layout parents, and navigation hierarchies must remain 100% identical:

### Universal
- `/profile` (Redirects dynamically by role)

### Public Surface (`/`) — Parent: `PublicLayout`
- `/` — `Landing`
- `/availability` — `Availability`
- `/plans` — `Plans`
- `/shop` — `Shop`
- `/contact` — `Contact`
- `/login` — `Login`
- `/register` — `Register`

### Member Portal (`/app`) — Parent: `MemberLayout`
- `/app` — `MemberDashboard`
- `/app/book` — `MemberBook`
- `/app/bookings` — `MyBookings`
- `/app/cafe` — `MemberCafe`
- `/app/social` — `MemberSocial`
- `/app/shop` — `Shop`
- `/app/checkout` — `Checkout`
- `/app/pass` — `DigitalPass`
- `/app/profile` — `Profile`

### Staff Console (`/staff`) — Parent: `StaffLayout`
- `/staff` & `/staff/bookings` — `StaffBookings`
- `/staff/members` — `MemberList`
- `/staff/members/new` — `MemberNew`
- `/staff/members/:id` — `MemberDetail`
- `/staff/pos` — `CounterPos`
- `/staff/products` — `ProductsAdmin`
- `/staff/orders` — `OrdersAdmin`
- `/staff/leads` — `LeadsCrm`
- `/staff/social` — `MemberSocial`
- `/staff/shifts` — `StaffShifts`
- `/staff/leave` — `StaffLeave`
- `/staff/cafe` & `/staff/cafe/pos` — `BarPos`
- `/staff/cafe/inventory` & `/staff/cafe-inventory` — `CafeInventory`
- `/staff/cafe/kitchen` — `KitchenDisplay`
- `/staff/cafe/summary` — `BarSummary`
- `/staff/profile` — `Profile`

### Owner Executive Console (`/owner`) — Parent: `OwnerLayout`
- `/owner` — `OwnerDashboard`
- `/owner/invoices` — `InvoicesPage`
- `/owner/expenses` — `ExpensesPage`
- `/owner/tax` — `TaxReportsPage`
- `/owner/payroll` — `PayrollPage`
- `/owner/employees` — `HrEmployees`
- `/owner/cafe-inventory` — `CafeInventory`
- `/owner/shifts` — `StaffShifts`
- `/owner/leave` — `StaffLeave`
- `/owner/settings` — `ClubSettingsPage`
- `/owner/profile` — `Profile`

---

## 3. Frozen Roles & Business Identities
- `public` — Visitor
- `member` — Club Athlete / Member
- `front_desk` / Court Staff — Court bookings, slot grids, member registration
- `shop_staff` — Shop inventory, counter POS sales, product catalog
- `cafe_staff` / `bar_staff` — Kitchen display, café stock inventory, bar tabs
- `owner` — Financial reports, HR directory, payroll, club settings, deletion controls

---

## 4. Frozen Form Fields, Keys, and State Contracts
- Auth form input IDs/names: `email`, `password`, `name`, `phone`, `role`, `rememberMe`
- Booking parameters: `courtId`, `date`, `slotId`, `duration`, `memberId`
- Cart storage key: `cart` in Redux `cartSlice`
- Local storage auth keys: `cc_token`, `cc_user`, `cc_remember_email`
- API request payloads, query parameter keys, and error codes (`INVALID_CREDENTIALS`, `NOT_FOUND`, `FORBIDDEN`, `OVERLAPPING_SHIFT`, etc.)
