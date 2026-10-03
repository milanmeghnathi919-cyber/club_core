# API_CONTRACT.md — Frontend ↔ Backend Integration Contract (v1.0)

> Single source of truth for every endpoint. Referenced by FRONTEND_EXECUTION_PLAN.md and BACKEND_EXECUTION_PLAN.md.
> **Rule:** nobody changes this file silently. Change = edit here + add a line to "Contract change log" in PROJECT_CONTEXT.md + tell the other side.
> Marking: **ASSUMPTION** = our decision, not in organizer docs. **UNKNOWN** = organizers did not say.

---

## 0. Conventions (apply to every endpoint)

| Item | Rule |
|---|---|
| Base URL | `{API_URL}/api/v1` (local: `http://localhost:5000/api/v1`) |
| Format | JSON, UTF-8. Uploads: `multipart/form-data` |
| Auth | JWT in **httpOnly cookie `cc_token`** (7 days). `Authorization: Bearer <jwt>` also accepted (for Postman). FE must send `credentials: 'include'`. Prod cross-domain: cookie `SameSite=None; Secure`, CORS origin allow-list, `credentials: true` |
| Roles | `owner`, `front_desk`, `bar_staff`, `member`; `public` = no login. Shorthand: **staff** = owner+front_desk+bar_staff · **FD+** = owner+front_desk · **owner** = owner only · **any** = any logged-in user |
| IDs | UUID strings |
| Dates/times | ISO-8601 UTC for instants (`2026-10-09T12:30:00.000Z`). Calendar dates `YYYY-MM-DD`. Club timezone **Asia/Kolkata** (ASSUMPTION); server generates slots in club tz, FE displays in club tz |
| Money | INR (ASSUMPTION). JSON numbers, 2 decimals (`1499.00`). Prices are **tax-inclusive** (ASSUMPTION). FE never computes authoritative totals — use `quote`/response fields |
| Pagination | `?page=1&limit=20` (max 100). Response `meta: {page,limit,total,totalPages}` |
| Sorting | `?sort=field:asc|desc` where supported |
| Naming | camelCase in JSON; snake_case only in DB |

### Success envelope
```json
{ "success": true, "data": <object|array>, "meta": { "page":1,"limit":20,"total":57,"totalPages":3 } }
```
`meta` only on paginated lists. Deletes/no-content actions return `{ "success": true, "data": {} }` (HTTP 200).

### Error envelope
```json
{ "success": false, "error": { "code": "SLOT_TAKEN", "message": "Court 2 is already booked for 18:00–19:00.", "details": [ { "field": "startAt", "message": "..." } ] } }
```
`details` optional (validation errors: one entry per field). FE shows `message` in toast; uses `code` for logic.

### HTTP status codes
`200` ok · `201` created · `400` malformed request · `401` not logged in / bad token · `403` role not allowed · `404` not found · `409` conflict (slot taken, out of stock, duplicate, invalid state) · `422` validation / business-rule failure · `429` rate limited · `500` server error.

### Error codes
| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 422 | body/query failed schema (see `details`) |
| `UNAUTHENTICATED` | 401 | no/expired token |
| `INVALID_CREDENTIALS` | 401 | wrong email/password |
| `FORBIDDEN` | 403 | role/ownership not allowed |
| `NOT_FOUND` | 404 | resource missing |
| `EMAIL_EXISTS` / `PHONE_EXISTS` | 409 | unique violation |
| `SLOT_TAKEN` | 409 | court/time already booked |
| `MEMBER_OVERLAP` | 409 | same member already has overlapping booking |
| `DAILY_LIMIT_REACHED` | 422 | member already has max (default 2) sessions that day |
| `INVALID_SLOT` | 422 | not on :00/:30, outside opening hours, or beyond booking window |
| `PAST_SLOT` | 422 | start time in the past |
| `CANCEL_WINDOW_PASSED` | 422 | member cancelling too close to start |
| `SESSION_FULL` / `ALREADY_JOINED` | 409 | social session capacity / duplicate join |
| `OUT_OF_STOCK` | 409 | `details:[{productId,available}]` |
| `ITEM_UNAVAILABLE` | 409 | menu item switched off |
| `TABLE_OCCUPIED` | 409 | table already has open tab |
| `TAB_CLOSED` | 409 | modifying a settled/void tab |
| `AMOUNT_MISMATCH` | 422 | settle payments ≠ tab total |
| `JUNIOR_AGE_MISMATCH` | 422 | Junior plan requires age < 18 (and vice-versa) |
| `INVALID_TRANSITION` | 409 | status change not allowed |
| `SIGNATURE_INVALID` | 400 | Razorpay signature check failed |
| `RATE_LIMITED` | 429 | too many requests |
| `INTERNAL_ERROR` | 500 | unexpected |

**Non-blocking warnings:** responses may include top-level `"warnings": ["MEMBERSHIP_EXPIRED"]` (e.g. booking priced as walk-in because membership lapsed). FE should show a toast.

### Enums
`role`: owner·front_desk·bar_staff·member | `planCode`: gold·silver·junior | `sport`: tennis·cricket·padel·badminton (**UNKNOWN** — brief mentions tennis, cricket, padel, badminton in different places; owner can add/disable courts) | `bookingStatus`: confirmed·cancelled·completed·no_show | `bookingType`: regular·social_session | `paymentStatus`: unpaid·paid·waived·refund_pending·refunded | `paymentMethod`: cash·card·upi·online | `bookingSource`: member_web·staff_counter·phone·public_trial | `orderChannel`: counter·online | `fulfilment`: in_store·pickup·delivery | `orderStatus`: pending·confirmed·ready·out_for_delivery·completed·cancelled | `kitchenStatus`: new·preparing·ready·served·cancelled | `tabStatus`: open·settled·void | `leadStatus`: new·contacted·quoted·won·lost | `leadInterest`: membership·trial·corporate·other | `invoiceStatus`: draft·sent·paid·void (+ computed `overdue`) | `revenueCategory`: court·shop·bar·membership·corporate·other

### Rate limits
`/auth/login`, `/auth/register`, `/public/enquiries`, `/public/trial-bookings`: 10 req/min/IP.

---

## 1. Shared data shapes

```jsonc
// Plan
{ "id":"uuid","code":"gold","name":"Gold","description":"…","price":12000.00,"durationDays":365,
  "courtDiscountPct":100,"shopDiscountPct":15,"barDiscountPct":15,"maxBookingsPerDay":2,"perks":["Free court access"],"isActive":true }

// Member (+ currentMembership when included)
{ "id":"uuid","memberCode":"CC-000123","fullName":"Aarav Shah","phone":"9876543210","email":"a@x.com","dob":"2010-04-02",
  "photoUrl":"https://…","address":null,"emergencyContact":"Dad 98…","notes":null,"createdAt":"…",
  "currentMembership":{ "id":"uuid","plan":{"id":"uuid","code":"junior","name":"Junior"},"startDate":"2026-10-01","endDate":"2027-09-30",
                        "status":"active","daysLeft":362,"expiringSoon":false } }   // null if none/lapsed

// Court
{ "id":"uuid","name":"Court 1","sport":"tennis","ratePerHour":600.00,"isActive":true,"imageUrl":null }

// Slot (in availability)
{ "start":"2026-10-09T12:30:00.000Z","end":"2026-10-09T13:30:00.000Z","state":"available|booked|social|closed|past",
  "price":300.00,"discountPct":50,"bookingId":null /*staff only*/,"social":null /* or {sessionId,capacity,joined,spotsLeft} */ }

// Booking
{ "id":"uuid","bookingNo":"BK-2026-000045","court":{"id":"uuid","name":"Court 1","sport":"tennis"},"type":"regular",
  "member":{"id":"uuid","memberCode":"CC-000123","fullName":"Aarav Shah"} /*or null*/,"guest":{"name":null,"phone":null},
  "startAt":"…","endAt":"…","status":"confirmed","basePrice":600.00,"discountPct":50,"price":300.00,"taxAmount":45.76,
  "paymentStatus":"unpaid","source":"member_web","cancelReason":null,"createdAt":"…" }

// SocialSession (booking of type social_session + capacity)
{ "id":"uuid","court":{…},"title":"Friday Social Padel","startAt":"…","endAt":"…","capacity":8,"joined":5,"spotsLeft":3,
  "pricePerHead":150.00,"priceForYou":75.00,"joinedByMe":false,"status":"confirmed",
  "participants":[{"id":"uuid","name":"Aarav Shah","memberCode":"CC-000123","paymentStatus":"paid"}] /*staff only*/ }

// Product
{ "id":"uuid","sku":"RKT-001","name":"Pro Racket X","description":"…","category":{"id":"uuid","name":"Rackets"},"brand":"Yonex",
  "price":4999.00,"taxRatePct":18,"imageUrl":"https://…","inStock":true,
  "stockQty":12 /*staff only; public gets inStock only*/,"lowStockThreshold":5,"isLowStock":false,"isActive":true }

// ShopOrder
{ "id":"uuid","orderNo":"SO-2026-000210","channel":"online","fulfilment":"pickup","status":"pending","paymentStatus":"unpaid",
  "customer":{"memberId":"uuid","name":"Aarav Shah","phone":"98…"},"deliveryAddress":null,"deliveryFee":0.00,
  "items":[{"productId":"uuid","name":"Pro Racket X","unitPrice":4999.00,"qty":1,"taxRatePct":18,"lineTotal":4999.00}],
  "subtotal":4999.00,"discountPct":15,"discount":749.85,"taxAmount":648.92,"total":4249.15,"createdAt":"…" }

// BarTab
{ "id":"uuid","tabNo":"T-20261003-014","status":"open","table":{"id":"uuid","label":"T4"} /*or null*/,
  "member":{"id":"uuid","fullName":"…","memberCode":"…"} /*or null*/,"guestName":null,
  "items":[{"id":"uuid","menuItemId":"uuid","name":"Cold Coffee","unitPrice":150.00,"qty":2,"notes":"less sugar","kitchenStatus":"new","station":"bar","addedBy":"Ravi","createdAt":"…"}],
  "subtotal":300.00,"discountPct":10,"discount":30.00,"taxAmount":12.86,"total":270.00,"payments":[],"openedAt":"…","closedAt":null }

// Lead
{ "id":"uuid","name":"Neha","email":"n@x.com","phone":"98…","source":"website","interest":"trial","sport":"padel","preferredDate":"2026-10-12",
  "message":"…","status":"new","assignedTo":null,"followUpAt":null,"createdAt":"…" }

// Payment
{ "id":"uuid","paymentNo":"PAY-2026-000999","sourceType":"bar_tab","sourceId":"uuid","amount":270.00,"method":"upi","status":"paid","revenueCategory":"bar","paidAt":"…" }

// Notification
{ "id":"uuid","type":"new_lead|low_stock|membership_expiring|leave_request|payment","title":"…","body":"…","link":"/staff/leads/uuid","isRead":false,"createdAt":"…" }

// User (session)
{ "id":"uuid","name":"Ravi","email":"r@club.com","role":"front_desk" }
```

---

## 2. Endpoints

Legend: **Req** = body (B) or query (Q). `?` = optional. All responses wrapped in the success envelope (shown: contents of `data`).

### 2.1 Auth
| Method | Path | Auth | Request | Response `data` | Errors |
|---|---|---|---|---|---|
| POST | `/auth/register` | public | B: `name, email, phone, password(min 8), dob?` | `{user, member}` + sets cookie. Creates role `member` + member profile (no membership yet) | 409 EMAIL_EXISTS/PHONE_EXISTS, 422 |
| POST | `/auth/login` | public | B: `email, password` | `{user, member?}` + cookie | 401 INVALID_CREDENTIALS, 429 |
| POST | `/auth/logout` | any | – | `{}` clears cookie | – |
| GET | `/auth/me` | any | – | `{user, member?, membership?}` | 401 |
| PATCH | `/auth/password` | any | B: `currentPassword, newPassword` | `{}` | 401, 422 |
| POST | `/auth/forgot-password`, `/auth/reset-password` | public | **P2** B: `email` / `token,newPassword` | `{}` | – |

### 2.2 Public (no login, never returns PII or exact stock)
| Method | Path | Request | Response `data` |
|---|---|---|---|
| GET | `/public/club` | – | `{name,about,address,phone,email,hours:{open,close},sports[],timezone,social:{day,start,end}}` |
| GET | `/public/plans` | – | `Plan[]` (active) |
| GET | `/public/courts` | – | `[{id,name,sport,walkInRate,imageUrl}]` |
| GET | `/public/availability` | Q: `from=YYYY-MM-DD, days=7 (≤14), sport?` | `{days:[{date, courts:[{courtId,name,sport,walkInRate,freeSlots:["18:00","18:30"],socialSessions:[{sessionId,start,spotsLeft}]}]}]}` (times in club tz `HH:mm`) |
| GET | `/public/categories` | – | `[{id,name}]` |
| GET | `/public/products` | Q: `category?, q?, minPrice?, maxPrice?, page, limit` | `Product[]` (no `stockQty`) + meta |
| GET | `/public/products/:id` | – | `Product` |
| POST | `/public/enquiries` | B: `name, phone?, email? (one of phone/email required), interest, planId?, sport?, preferredDate?, message?` | `201 {id,status:"new"}`. Creates lead, notifies owner+front_desk (in-app + email) |
| POST | `/public/trial-bookings` | **P1** B: `name, phone, email?, courtId, startAt` | `201 {booking, leadId}` guest booking (`source=public_trial`, unpaid/pay at club) + lead. Errors: 409 SLOT_TAKEN, 422 INVALID_SLOT/PAST_SLOT |

### 2.3 Settings & uploads
| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/settings` | staff | – | `{openTime:"06:00",closeTime:"22:00",slotMinutes:30,sessionMinutes:60,bookingWindowDays:14,cancelCutoffHours:2,socialDay:5,socialStart:"18:00",socialEnd:"22:00",lowStockDefault:5,onlineOrderHoldMinutes:30,deliveryFee:50,taxRates:{court:18,membership:18,shop:18,barFood:5,barDrink:18},club:{…}}` (all values ASSUMPTION/placeholder — owner confirms) |
| PATCH | `/settings` | owner | B: any subset of above | updated settings |
| POST | `/uploads/image` | any | multipart `file` (≤3 MB jpg/png/webp) | `{url}` (Cloudinary) |
| GET | `/health` | public | – | `{status:"ok",time}` |

### 2.4 Plans, Members, Memberships
| Method | Path | Auth | Request | Response `data` | Errors |
|---|---|---|---|---|---|
| GET | `/plans` | any | – | `Plan[]` | |
| POST/PATCH | `/plans`, `/plans/:id` | owner | B: Plan fields | `Plan` | 422 |
| GET | `/members` | staff | Q: `q?, planCode?, status?(active\|expired\|none), expiringInDays?, page, limit` | `Member[]` (with currentMembership) + meta | |
| GET | `/members/lookup` | staff | Q: `q` (name/phone/code, min 2 chars) | top 10 `Member[]` (fast, topbar search) | |
| POST | `/members` | FD+ | B: `fullName, phone, email?, dob?, address?, emergencyContact?, photoUrl?, planId, startDate?(default today), paymentMethod:"cash"\|"card"\|"upi"\|"later", createLogin?:bool` | `201 {member, membership, payment?, tempPassword?}` (tempPassword only if `createLogin` and email given; also emailed) | 409 PHONE_EXISTS/EMAIL_EXISTS, 422 JUNIOR_AGE_MISMATCH |
| GET | `/members/:id` | staff; member = self | – | `{member, currentMembership, stats:{totalBookings,totalSpend,lastVisitAt}}` | 404 |
| PATCH | `/members/:id` | FD+; member = self (limited) | B: profile fields | `Member` | |
| GET | `/members/:id/history` | staff; member = self | Q: `type?(booking\|shop\|bar\|payment\|membership), page, limit` | `[{type,id,at,title,amount,status}]` newest first + meta | |
| POST | `/members/:id/memberships` | FD+ | B: `planId, startDate?, paymentMethod` | `201 {membership, payment?}` renew or change plan: current one → `replaced`/ends day before; no proration (ASSUMPTION) | 422 JUNIOR_AGE_MISMATCH |
| PATCH | `/memberships/:id/cancel` | FD+ | – | `{membership}` | |
| POST | `/me/membership/purchase` | member | **P1** B: `planId` | `201 {membership(status:"pending"), payment:{razorpayOrderId,amount,keyId}}` → activates after `/payments/razorpay/verify` | |

### 2.5 Courts, availability, bookings
| Method | Path | Auth | Request | Response `data` | Errors |
|---|---|---|---|---|---|
| GET | `/courts` | any | Q: `includeInactive?` | `Court[]` | |
| POST/PATCH | `/courts`, `/courts/:id` | owner | B: `name, sport, ratePerHour, isActive, imageUrl?` | `Court` | |
| GET | `/courts/availability` | any | Q: `date=YYYY-MM-DD, sport?, courtId?, memberId? (staff only: price for that member)` | `{date,slotMinutes:30,durationMinutes:60,courts:[{court:Court,slots:Slot[]}]}`. `price` = for caller (member plan) or walk-in. Slots every 30 min; `bookingId` only for staff | 422 |
| POST | `/bookings` | member, FD+ | B: `courtId, startAt, memberId? (staff), guest?:{name,phone} (staff, when no member), paymentMethod?:"online"\|"pay_at_club"\|"cash"\|"card"\|"upi"` | `201 {booking, payment?:{razorpayOrderId,amount,keyId}}`. price 0 (Gold) → `paymentStatus:"waived"`. Member self-service: `online` returns razorpay order (P1) or `pay_at_club` → unpaid. Staff with cash/card/upi → paid immediately | 409 SLOT_TAKEN, 409 MEMBER_OVERLAP, 422 DAILY_LIMIT_REACHED, INVALID_SLOT, PAST_SLOT |
| GET | `/bookings` | staff (all); member (auto-scoped to self) | Q: `date?, from?, to?, courtId?, memberId?, status?, page, limit` | `Booking[]` + meta | |
| GET | `/bookings/mine` | member | Q: `upcoming?=true` | `Booking[]` | |
| GET | `/bookings/:id` | staff; member = own | – | `Booking` | 404 |
| PATCH | `/bookings/:id/cancel` | member (own), FD+ | B: `reason?` | `Booking` (status cancelled; if paid online → `refund_pending`) | 422 CANCEL_WINDOW_PASSED (member only), 409 INVALID_TRANSITION |
| PATCH | `/bookings/:id/pay` | FD+ | B: `method:"cash"\|"card"\|"upi"` | `{booking, payment}` | 409 |
| PATCH | `/bookings/:id/status` | FD+ | B: `status:"completed"\|"no_show"` | `Booking` | 409 |

### 2.6 Social play (Friday night shared courts) — **P1**
| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | `/social-sessions` | any | Q: `date? \| from?,to?` | `SocialSession[]` (participants only for staff) | |
| POST | `/social-sessions` | FD+ | B: `courtId, startAt, endAt?(default +60m), capacity, pricePerHead, title?` | `201 SocialSession` | 409 SLOT_TAKEN |
| POST | `/social-sessions/generate` | FD+ | B: `date, courtIds[], windowStart:"18:00", windowEnd:"22:00", capacity, pricePerHead` | `{created:SocialSession[], skipped:[{courtId,start,reason}]}` | |
| POST | `/social-sessions/:id/join` | member, FD+ | B: `memberId?(staff), guest?:{name}, paymentMethod?` | `201 {participant, payment?}` | 409 SESSION_FULL/ALREADY_JOINED, 422 DAILY_LIMIT_REACHED |
| DELETE | `/social-sessions/:id/participants/:pid` | member(own), FD+ | – | `{}` | |
| PATCH | `/social-sessions/:id/cancel` | FD+ | B: `reason?` | `SocialSession` | |

### 2.7 Shop & inventory
| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | `/categories` | any | – | `[{id,name}]` | |
| POST/PATCH | `/categories`, `/categories/:id` | owner | B: `name` | category | |
| GET | `/products` | staff | Q: `q?, categoryId?, lowStock?=true, includeInactive?, page, limit` | `Product[]` (with `stockQty`) + meta | |
| POST | `/products` | FD+ | B: `sku, name, description?, categoryId, brand?, price, taxRatePct?, stockQty, lowStockThreshold?, imageUrl?` | `201 Product` | 409 duplicate sku |
| PATCH | `/products/:id` | FD+ | B: partial | `Product` | |
| DELETE | `/products/:id` | owner | – | soft delete (`isActive=false`) | |
| POST | `/products/:id/stock` | FD+ | B: `delta (non-zero int), reason:"restock"\|"adjustment"\|"damage"\|"return", note?` | `{product, movement}` | 422 (would go < 0) |
| GET | `/products/low-stock` | FD+ | – | `Product[]` where `stockQty ≤ threshold` | |
| GET | `/products/:id/movements` | FD+ | Q: page | `[{id,delta,reason,note,by,createdAt}]` | |
| POST | `/shop/orders/quote` | member, FD+ | B: `items:[{productId,qty}], memberId?(staff), fulfilment?` | `{lines[], subtotal, discountPct, discount, taxAmount, deliveryFee, total}` (used by cart; no stock change) | 409 OUT_OF_STOCK |
| POST | `/shop/orders` | member, FD+ | B: `items:[{productId,qty}], fulfilment:"in_store"\|"pickup"\|"delivery", memberId?(staff), customerName?, customerPhone?, deliveryAddress? (required if delivery), paymentMethod:"cash"\|"card"\|"upi"\|"online"\|"pay_at_club"` | `201 {order, payment?:{razorpayOrderId,amount,keyId}}`. Member → channel `online`; staff → `counter`. Stock decremented atomically at creation. Counter + cash/card/upi → paid & `completed`. Online unpaid → `pending`, auto-cancelled (stock restored) after `onlineOrderHoldMinutes`. Delivery requires `online` (ASSUMPTION) | 409 OUT_OF_STOCK, 422 |
| GET | `/shop/orders` | FD+ | Q: `status?, channel?, from?, to?, q?, page, limit` | `ShopOrder[]` + meta | |
| GET | `/shop/orders/mine` | member | Q: page | `ShopOrder[]` | |
| GET | `/shop/orders/:id` | FD+; member = own | – | `ShopOrder` | |
| PATCH | `/shop/orders/:id/status` | FD+ | B: `status` — allowed: pending→confirmed→ready→completed; confirmed→out_for_delivery→completed (delivery); any non-completed→cancelled | `ShopOrder` | 409 INVALID_TRANSITION |
| POST | `/shop/orders/:id/pay` | FD+ | B: `method:"cash"\|"card"\|"upi"` | `{order,payment}` | |
| PATCH | `/shop/orders/:id/cancel` | member(own, only `pending`), FD+ | B: `reason?` | `ShopOrder` (stock restored; if paid → `refund_pending`) | 409 |

### 2.8 Payments (Razorpay + ledger)
| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| POST | `/payments/razorpay/verify` | member, FD+ | B: `razorpayOrderId, razorpayPaymentId, razorpaySignature` | `{payment, source:{type,id,status}}` marks booking/order/membership paid | 400 SIGNATURE_INVALID |
| POST | `/payments/razorpay/webhook` | public (signature header) | **P2** Razorpay payload | `200` | |
| GET | `/payments` | FD+ | Q: `from?, to?, method?, sourceType?, revenueCategory?, page, limit` | `Payment[]` + meta | |

`payment` object returned when online payment is needed: `{razorpayOrderId, amount (₹), currency:"INR", keyId}` → FE opens Razorpay Checkout, then calls `/verify`. Test mode only (ASSUMPTION).

### 2.9 Bar & café
| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | `/bar/menu` | staff | Q: `category?, available?` | `[{id,name,category,price,taxRatePct,station,isAvailable,imageUrl}]` | |
| POST | `/bar/menu` | owner, FD+ | B: item fields | `201` item | |
| PATCH | `/bar/menu/:id` | owner, FD+; bar_staff may only toggle `isAvailable` | B: partial | item | |
| GET | `/bar/tables` | staff | – | `[{id,label,seats,status:"free"\|"occupied",currentTabId}]` | |
| POST/PATCH | `/bar/tables`, `/bar/tables/:id` | owner | B: `label, seats, isActive` | table | |
| POST | `/bar/tabs` | staff | B: `tableId?, memberId?, guestName?` | `201 BarTab` | 409 TABLE_OCCUPIED |
| GET | `/bar/tabs` | staff | Q: `status?(default open), date?, tableId?, memberId?` | `BarTab[]` | |
| GET | `/bar/tabs/:id` | staff | – | `BarTab` (live totals, member discount applied automatically) | |
| POST | `/bar/tabs/:id/items` | staff | B: `items:[{menuItemId, qty, notes?}]` | `BarTab` (new items `kitchenStatus:"new"`) | 409 ITEM_UNAVAILABLE/TAB_CLOSED |
| PATCH | `/bar/tabs/:id/items/:itemId` | staff | B: `qty?` or `cancel:true` (only while `new`) | `BarTab` | 409 |
| PATCH | `/bar/tabs/:id/member` | staff | B: `memberId \| null` | `BarTab` (discount recalculated) | |
| PATCH | `/bar/tabs/:id/table` | staff | B: `tableId \| null` | `BarTab` | 409 TABLE_OCCUPIED |
| POST | `/bar/tabs/:id/settle` | staff | B: `payments:[{method,amount}]` (sum = total; single payment normal) | `BarTab` (settled, table freed) | 422 AMOUNT_MISMATCH, 409 TAB_CLOSED |
| POST | `/bar/tabs/:id/void` | owner, FD+ | B: `reason` | `BarTab` | 409 |
| GET | `/bar/kitchen` | staff | Q: `status?=new,preparing` `station?` | `[{itemId,name,qty,notes,tabId,tableLabel,memberName,guestName,placedAt,kitchenStatus,station}]` oldest first (FE polls every 5 s) | |
| PATCH | `/bar/items/:itemId/kitchen-status` | staff | B: `status:"preparing"\|"ready"\|"served"` | item | 409 |
| GET | `/bar/summary` | owner, FD+, bar_staff | Q: `date=YYYY-MM-DD` | `{date,tabsCount,voidedCount,gross,discounts,tax,net,byMethod:{cash,card,upi},byStaff:[{name,tabs,net}],topItems:[{name,qty,amount}]}` | |

### 2.10 Leads / enquiries (CRM) + notifications
| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET | `/leads` | FD+ | Q: `status?, assignedTo?, interest?, q?, page, limit` | `Lead[]` + meta | |
| POST | `/leads` | FD+ | B: same as enquiry + `source:"walk_in"\|"phone"\|"referral"` | `201 Lead` | |
| GET | `/leads/:id` | FD+ | – | `{lead, activities:[{id,type,text,followUpAt,by,createdAt}], quotes:[…]}` | |
| PATCH | `/leads/:id` | FD+ | B: `status?, assignedTo?, followUpAt?` | `Lead` | |
| GET | `/leads/follow-ups` | FD+ | Q: `due=today\|overdue` | `Lead[]` | |
| POST | `/leads/:id/activities` | FD+ | B: `type:"note"\|"call"\|"email"\|"visit", text, followUpAt?` | `201 activity` | |
| POST | `/leads/:id/quotes` | FD+ | B: `planId?, amount, validUntil, notes?, sendEmail?:bool` | `201 quote` (sets lead `quoted`; emails if lead has email) | |
| POST | `/leads/:id/convert` | FD+ | B: `planId, startDate?, paymentMethod` | `201 {member, membership, payment?}` lead → `won` | 409 PHONE_EXISTS |
| GET | `/notifications` | any | Q: `unread?, page` | `Notification[]` + `meta.unreadCount` | |
| PATCH | `/notifications/:id/read` · POST `/notifications/read-all` | any | – | `{}` | |

### 2.11 Finance: clients, invoices, expenses/payables
| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET/POST/PATCH | `/clients`, `/clients/:id` | owner | B: `name, contactPerson?, email?, phone?, gstNo?, address?` | `Client` | |
| GET | `/invoices` | owner | Q: `status?, category?, clientId?, from?, to?, page` | `Invoice[]` (+computed `overdue`) + meta | |
| POST | `/invoices` | owner | B: `clientId \| memberId, category, issueDate, dueDate, items:[{description,qty,unitPrice,taxRatePct}], notes?` | `201 Invoice {id,invoiceNo:"INV-2026-0001",items,subtotal,taxAmount,total,paidAmount,status:"draft"}` | 422 |
| GET | `/invoices/:id` | owner | – | `Invoice` + `payments[]` | |
| PATCH | `/invoices/:id/status` | owner | B: `status:"sent"\|"void"` | `Invoice` | 409 |
| POST | `/invoices/:id/payments` | owner | B: `method, amount (≤ balance), paidAt?` | `{invoice, payment}` auto → `paid` when fully settled | 422 |
| GET | `/expenses` | owner | Q: `status?, category?, from?, to?, page` | `Expense[]` + meta | |
| POST/PATCH | `/expenses`, `/expenses/:id` | owner | B: `vendor, category, description?, amount, taxAmount?, dueDate` | `Expense` | |
| PATCH | `/expenses/:id/pay` | owner | B: `method, paidAt?` | `Expense` | |
| GET | `/reports/payables` | owner | – | `{totalDue,overdueAmount,byCategory:[{category,amount}],items:Expense[]}` ("what do we owe") | |

### 2.12 HR: employees, shifts, leave, payroll
| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| GET/POST/PATCH | `/employees`, `/employees/:id` | owner | B: `fullName, title, phone?, email?, baseSalary, joinedOn, userId?, status` | `Employee` | |
| GET | `/shifts` | staff (self); owner (all) | Q: `from, to, employeeId?` | `[{id,employee:{id,name},date,startTime,endTime,area,status}]` | |
| POST/PATCH/DELETE | `/shifts`, `/shifts/:id` | owner, FD+ | B: `employeeId, date, startTime, endTime, area` | `Shift` | 409 overlapping shift |
| POST | `/shifts/:id/check-in` · `/check-out` | staff (own shift) | – | `Shift` | |
| POST | `/leave-requests` | staff | B: `type:"casual"\|"sick"\|"unpaid", fromDate, toDate, reason?` | `201 LeaveRequest {days,status:"pending"}` | 422 |
| GET | `/leave-requests/mine` | staff | – | `LeaveRequest[]` | |
| GET | `/leave-requests` | owner | Q: `status?, employeeId?, page` | `LeaveRequest[]` + meta | |
| PATCH | `/leave-requests/:id/decision` | owner | B: `decision:"approved"\|"rejected", note?` | `LeaveRequest` | 409 |
| POST | `/payroll/runs` | owner | B: `month:"2026-10"` | `201 {run, payslips[]}` drafts computed: `net = base + allowances − deductions − unpaidLeaveDays × base/30` (ASSUMPTION) | 409 run exists |
| GET | `/payroll/runs` · `/payroll/runs/:id` | owner | – | run list / `{run,payslips[]}` | |
| PATCH | `/payroll/payslips/:id` | owner (draft only) | B: `allowances?, deductions?` | `Payslip` | |
| POST | `/payroll/runs/:id/finalize` · `/mark-paid` | owner | B (`mark-paid`): `method` | `{run}` (mark-paid creates an `expenses` row of category salary, paid) | 409 |

### 2.12b Reports & exports
| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/reports/dashboard` | owner (FD+ gets limited subset) | Q: `range=today\|week\|month` (or `from,to`) | see below |
| GET | `/reports/revenue` | owner | Q: `from, to, groupBy=day\|source\|method` | `[{key,amount,count}]` |
| GET | `/reports/tax` | owner | Q: `from, to` | `{outputTax:[{ratePct,taxableValue,tax}],inputTax,netPayable,byCategory[]}` (rates are placeholders — **UNKNOWN** which tax regime organizers expect; ASSUMPTION GST-style) |
| GET | `/reports/export/:type` | owner | `type=revenue\|payments\|tax\|members\|payables`, Q: `from,to,format=csv` | CSV file download |
| POST | `/reports/email` | owner | **P2** B: `type, from, to, toEmail` | `{}` (nodemailer) |

`/reports/dashboard` response:
```jsonc
{ "range":{"from":"2026-10-01","to":"2026-10-31"},
  "revenue":{"total":412300.00,
    "bySource":{"court":120000.00,"shop":90000.00,"bar":75000.00,"membership":110000.00,"corporate":17300.00},
    "byMethod":{"cash":150000.00,"card":120000.00,"upi":100000.00,"online":42300.00},
    "series":[{"date":"2026-10-01","total":12000.00,"court":3000.00,"shop":2000.00,"bar":1500.00,"membership":5500.00,"corporate":0}]},
  "compare":{"previousTotal":380000.00,"changePct":8.5},
  "bookings":{"count":420,"utilisationPct":61.4,"cancelled":22},
  "members":{"active":210,"newInRange":18,"expiringIn7Days":9},
  "alerts":{"lowStockCount":4,"openLeads":7,"overdueFollowUps":2,"pendingLeave":1,"payablesDue":58000.00,"overdueInvoices":2} }
```
Revenue = sum of `payments` with `status=paid` in range (single ledger — BR-13). Refunded payments excluded.
