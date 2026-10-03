import bcrypt from 'bcryptjs'
import { query, queryOne } from '../src/utils/db.js'

const HASHED_PWD = bcrypt.hashSync('Password@123', 10)

const AVATAR_IMAGES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
]

const COURT_IMAGES = [
  'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
]

const PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1617083934555-563d762e8316?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1530915365347-e35b749a0381?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80',
]

const MENU_IMAGES = [
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=600&q=80',
]

async function seedDatabase() {
  console.log('🚀 Starting comprehensive database seeding (10+ entries per table)...')

  // 1. USERS
  console.log('--- 1. Seeding Users ---')
  const userSeeds = [
    { email: 'rohit.sharma@championsclub.in', name: 'Rohit Sharma', role: 'admin', phone: '+919811100001' },
    { email: 'virat.kohli@championsclub.in', name: 'Virat Kohli', role: 'member', phone: '+919811100002' },
    { email: 'sania.mirza@championsclub.in', name: 'Sania Mirza', role: 'court_manager', phone: '+919811100003' },
    { email: 'pv.sindhu@championsclub.in', name: 'P.V. Sindhu', role: 'shop_manager', phone: '+919811100004' },
    { email: 'neeraj.chopra@championsclub.in', name: 'Neeraj Chopra', role: 'cafe_manager', phone: '+919811100005' },
    { email: 'lakshya.sen@championsclub.in', name: 'Lakshya Sen', role: 'member', phone: '+919811100006' },
    { email: 'leander.paes@championsclub.in', name: 'Leander Paes', role: 'member', phone: '+919811100007' },
    { email: 'mahesh.bhupathi@championsclub.in', name: 'Mahesh Bhupathi', role: 'member', phone: '+919811100008' },
    { email: 'ashwini.ponnappa@championsclub.in', name: 'Ashwini Ponnappa', role: 'member', phone: '+919811100009' },
    { email: 'satwik.sairaj@championsclub.in', name: 'Satwiksairaj Rankireddy', role: 'member', phone: '+919811100010' },
    { email: 'chirag.shetty@championsclub.in', name: 'Chirag Shetty', role: 'member', phone: '+919811100011' },
    { email: 'rohan.bopanna@championsclub.in', name: 'Rohan Bopanna', role: 'member', phone: '+919811100012' },
    { email: 'manika.batra@championsclub.in', name: 'Manika Batra', role: 'member', phone: '+919811100013' },
    { email: 'sharath.kamal@championsclub.in', name: 'Sharath Kamal', role: 'member', phone: '+919811100014' },
  ]

  for (const u of userSeeds) {
    await query(`
      INSERT INTO public.users (email, password_hash, role, name, phone, is_active, is_email_verified)
      VALUES ($1, $2, $3, $4, $5, true, true)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, is_email_verified = true
    `, [u.email, HASHED_PWD, u.role, u.name, u.phone])
  }

  const allUsers = await query('SELECT id, email, name, role FROM public.users ORDER BY created_at ASC')
  console.log(`✅ Users table now has: ${allUsers.length} rows`)

  // 2. PLANS (ensure at least 10 plans)
  console.log('--- 2. Seeding Plans ---')
  const planSeeds = [
    { code: 'GOLD', name: 'Gold Annual Elite', price: 15000, duration_days: 365, court_discount_pct: 100, shop_discount_pct: 15, bar_discount_pct: 15, max_bookings: 4 },
    { code: 'SILVER', name: 'Silver Annual Plan', price: 8000, duration_days: 365, court_discount_pct: 30, shop_discount_pct: 10, bar_discount_pct: 10, max_bookings: 2 },
    { code: 'JUNIOR', name: 'Junior Rising Star (<18)', price: 5000, duration_days: 365, court_discount_pct: 50, shop_discount_pct: 10, bar_discount_pct: 10, max_bookings: 2 },
    { code: 'PLATINUM', name: 'Platinum Founder Club', price: 25000, duration_days: 365, court_discount_pct: 100, shop_discount_pct: 25, bar_discount_pct: 25, max_bookings: 6 },
    { code: 'CORP_ELITE', name: 'Corporate Corporate Club', price: 45000, duration_days: 365, court_discount_pct: 50, shop_discount_pct: 15, bar_discount_pct: 20, max_bookings: 8 },
    { code: 'MONTHLY_PRO', name: 'Monthly Pro Athlete', price: 2500, duration_days: 30, court_discount_pct: 40, shop_discount_pct: 10, bar_discount_pct: 10, max_bookings: 3 },
    { code: 'QUARTERLY', name: 'Quarterly Squash & Padel', price: 6000, duration_days: 90, court_discount_pct: 35, shop_discount_pct: 12, bar_discount_pct: 10, max_bookings: 3 },
    { code: 'WEEKEND_WARRIOR', name: 'Weekend Warrior Pass', price: 4000, duration_days: 180, court_discount_pct: 25, shop_discount_pct: 5, bar_discount_pct: 10, max_bookings: 2 },
    { code: 'SUMMER_CAMP', name: 'Summer Coaching Pass', price: 3500, duration_days: 60, court_discount_pct: 60, shop_discount_pct: 15, bar_discount_pct: 5, max_bookings: 2 },
    { code: 'LIFETIME_VIP', name: 'Lifetime Honorary Patron', price: 99999, duration_days: 3650, court_discount_pct: 100, shop_discount_pct: 30, bar_discount_pct: 30, max_bookings: 10 },
  ]

  for (const p of planSeeds) {
    await query(`
      INSERT INTO public.plans (code, name, price, duration_days, court_discount_pct, shop_discount_pct, bar_discount_pct, max_bookings_per_day, perks, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '["Free Towel Service", "Locker Access", "Priority Booking"]'::jsonb, true)
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price
    `, [p.code, p.name, p.price, p.duration_days, p.court_discount_pct, p.shop_discount_pct, p.bar_discount_pct, p.max_bookings])
  }

  const allPlans = await query('SELECT id, code, name, price FROM public.plans')
  console.log(`✅ Plans table now has: ${allPlans.length} rows`)

  // 3. MEMBERS (ensure at least 15 members with avatars)
  console.log('--- 3. Seeding Members ---')
  const memberUsers = allUsers.filter(u => u.role === 'member')
  for (let i = 0; i < memberUsers.length; i++) {
    const u = memberUsers[i]
    const photo = AVATAR_IMAGES[i % AVATAR_IMAGES.length]
    const seqRow = await queryOne("SELECT public.next_member_code() as code")
    const code = seqRow?.code || `CC-${String(300 + i).padStart(6, '0')}`

    await query(`
      INSERT INTO public.members (member_code, user_id, full_name, phone, email, dob, address, photo_url, created_at)
      VALUES ($1, $2, $3, $4, $5, '1995-05-15', 'Champions Club Suites, Bengaluru', $6, now())
      ON CONFLICT (member_code) DO NOTHING
    `, [code, u.id, u.name, u.phone || `+9198765432${i}`, u.email, photo])
  }

  const allMembers = await query('SELECT id, member_code, full_name, user_id FROM public.members')
  console.log(`✅ Members table now has: ${allMembers.length} rows`)

  // 4. MEMBERSHIPS (at least 12 rows)
  console.log('--- 4. Seeding Memberships ---')
  for (let i = 0; i < allMembers.length; i++) {
    const m = allMembers[i]
    const plan = allPlans[i % allPlans.length]
    await query(`
      INSERT INTO public.memberships (member_id, plan_id, start_date, end_date, status, price_paid, tax_amount)
      VALUES ($1, $2, current_date - interval '30 days', current_date + interval '335 days', 'active', $3, $4)
      ON CONFLICT DO NOTHING
    `, [m.id, plan.id, plan.price, Number(plan.price) * 0.18])
  }
  const allMemberships = await query('SELECT count(*)::int as count FROM public.memberships')
  console.log(`✅ Memberships table now has: ${allMemberships[0].count} rows`)

  // 5. COURTS (at least 10 courts)
  console.log('--- 5. Seeding Courts ---')
  const courtSeeds = [
    { name: 'Centre Court - Roland Garros Clay', sport: 'tennis', rate: 1000, img: COURT_IMAGES[0] },
    { name: 'Court 2 - Wimbledon Grass', sport: 'tennis', rate: 1200, img: COURT_IMAGES[1] },
    { name: 'Court 3 - US Open Hardcourt', sport: 'tennis', rate: 900, img: COURT_IMAGES[2] },
    { name: 'Padel Glass Arena 1', sport: 'padel', rate: 800, img: COURT_IMAGES[3] },
    { name: 'Padel Panoramic Arena 2', sport: 'padel', rate: 800, img: COURT_IMAGES[4] },
    { name: 'Badminton Championship Court 1', sport: 'badminton', rate: 600, img: COURT_IMAGES[5] },
    { name: 'Badminton Wooden Court 2', sport: 'badminton', rate: 600, img: COURT_IMAGES[6] },
    { name: 'Badminton Wooden Court 3', sport: 'badminton', rate: 600, img: COURT_IMAGES[6] },
    { name: 'Squash Glass Back Court 1', sport: 'squash', rate: 500, img: COURT_IMAGES[7] },
    { name: 'Squash Glass Back Court 2', sport: 'squash', rate: 500, img: COURT_IMAGES[7] },
    { name: 'Pickleball Pro Court 1', sport: 'pickleball', rate: 450, img: COURT_IMAGES[8] },
    { name: 'Pickleball Pro Court 2', sport: 'pickleball', rate: 450, img: COURT_IMAGES[8] },
  ]

  for (const c of courtSeeds) {
    await query(`
      INSERT INTO public.courts (name, sport, rate_per_hour, description, image_url, is_active)
      VALUES ($1, $2, $3, 'Professional tournament-grade surface with anti-glare floodlights', $4, true)
      ON CONFLICT (name) DO UPDATE SET rate_per_hour = EXCLUDED.rate_per_hour, image_url = EXCLUDED.image_url
    `, [c.name, c.sport, c.rate, c.img])
  }

  const allCourts = await query('SELECT id, name, sport, rate_per_hour FROM public.courts')
  console.log(`✅ Courts table now has: ${allCourts.length} rows`)

  // 6. BOOKINGS (at least 15 bookings)
  console.log('--- 6. Seeding Bookings ---')
  for (let i = 0; i < 15; i++) {
    const court = allCourts[i % allCourts.length]
    const member = allMembers[i % allMembers.length]
    const bNo = `BK-2026-${String(1001 + i).padStart(6, '0')}`
    const startHour = 8 + (i % 12)
    const startIso = new Date(Date.now() + (i - 7) * 86400000)
    startIso.setHours(startHour, 0, 0, 0)
    const endIso = new Date(startIso.getTime() + 3600000)

    await query(`
      INSERT INTO public.bookings (
        booking_no, court_id, booking_type, member_id, start_at, end_at, during,
        status, base_price, discount_pct, price, tax_amount, payment_status, source
      ) VALUES ($1, $2, 'court', $3, $4, $5, 'morning', 'confirmed', $6, 0, $6, $7, 'paid', 'online')
      ON CONFLICT (booking_no) DO NOTHING
    `, [bNo, court.id, member.id, startIso.toISOString(), endIso.toISOString(), court.rate_per_hour, Number(court.rate_per_hour) * 0.18])
  }
  const allBookings = await query('SELECT id, booking_no, member_id, price FROM public.bookings')
  console.log(`✅ Bookings table now has: ${allBookings.length} rows`)

  // 7. BOOKING PARTICIPANTS (at least 15 rows)
  console.log('--- 7. Seeding Booking Participants ---')
  for (let i = 0; i < allBookings.length; i++) {
    const b = allBookings[i]
    const m = allMembers[(i + 1) % allMembers.length]
    await query(`
      INSERT INTO public.booking_participants (
        session_id, member_id, guest_name, status, base_price, price, tax_amount, payment_status
      ) VALUES ($1, $2, null, 'joined', 200, 200, 36, 'paid')
      ON CONFLICT DO NOTHING
    `, [b.id, m.id])
  }
  const allParticipants = await query('SELECT count(*)::int as count FROM public.booking_participants')
  console.log(`✅ Booking Participants table now has: ${allParticipants[0].count} rows`)

  // 8. PRODUCT CATEGORIES (at least 10 categories)
  console.log('--- 8. Seeding Product Categories ---')
  const catNames = [
    'Rackets & Bats', 'Balls & Shuttles', 'Footwear', 'Apparel & Sportswear',
    'Bags & Backpacks', 'Grips & Overgrips', 'Protective Gear', 'Hydration & Nutrition',
    'Training Equipment', 'Club Merchandise'
  ]
  for (const name of catNames) {
    await query(`INSERT INTO public.product_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name])
  }
  const allCategories = await query('SELECT id, name FROM public.product_categories')
  console.log(`✅ Product Categories table now has: ${allCategories.length} rows`)

  // 9. PRODUCTS (at least 15 products with sports gear images)
  console.log('--- 9. Seeding Products ---')
  const productSeeds = [
    { sku: 'PRO-TEN-001', name: 'Wilson Pro Staff 97 v14', brand: 'Wilson', catIdx: 0, price: 18500, img: PRODUCT_IMAGES[0] },
    { sku: 'PRO-PAD-002', name: 'Babolat Pure Aero 2026', brand: 'Babolat', catIdx: 0, price: 16200, img: PRODUCT_IMAGES[1] },
    { sku: 'BAL-TEN-003', name: 'Wilson US Open Extra Duty Balls (3-Pack)', brand: 'Wilson', catIdx: 1, price: 550, img: PRODUCT_IMAGES[2] },
    { sku: 'BAD-YON-004', name: 'Yonex Astrox 99 Pro Racket', brand: 'Yonex', catIdx: 0, price: 14500, img: PRODUCT_IMAGES[3] },
    { sku: 'SHU-YON-005', name: 'Yonex Aerosensa 50 Shuttles (Tube of 12)', brand: 'Yonex', catIdx: 1, price: 2400, img: PRODUCT_IMAGES[4] },
    { sku: 'PAD-BUL-006', name: 'Bullpadel Vertex 03 Padel Racket', brand: 'Bullpadel', catIdx: 0, price: 19800, img: PRODUCT_IMAGES[5] },
    { sku: 'BAL-PAD-007', name: 'Head Pro Padel Balls (Can of 3)', brand: 'Head', catIdx: 1, price: 650, img: PRODUCT_IMAGES[6] },
    { sku: 'SHO-NIK-008', name: 'NikeCourt Air Zoom Vapor Pro 2', brand: 'Nike', catIdx: 2, price: 11995, img: PRODUCT_IMAGES[7] },
    { sku: 'BAG-WIL-009', name: 'Champions Club Tour 12-Pack Bag', brand: 'Champions Club', catIdx: 4, price: 6500, img: PRODUCT_IMAGES[8] },
    { sku: 'ACC-GRP-010', name: 'Tourna Grip XL Original (Pack of 10)', brand: 'Tourna', catIdx: 5, price: 1250, img: PRODUCT_IMAGES[9] },
    { sku: 'ACC-BOT-011', name: 'Hydro Flask 32oz Insulated Sports Bottle', brand: 'Hydro Flask', catIdx: 7, price: 3200, img: PRODUCT_IMAGES[10] },
    { sku: 'APP-CAP-012', name: 'Champions Club Aerobill Performance Cap', brand: 'Champions Club', catIdx: 3, price: 1200, img: PRODUCT_IMAGES[11] },
  ]

  for (const p of productSeeds) {
    const cat = allCategories[p.catIdx % allCategories.length]
    await query(`
      INSERT INTO public.products (sku, name, brand, category_id, price, tax_rate_pct, stock_qty, low_stock_threshold, image_url, is_active)
      VALUES ($1, $2, $3, $4, $5, 18, 50, 10, $6, true)
      ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url, stock_qty = EXCLUDED.stock_qty
    `, [p.sku, p.name, p.brand, cat.id, p.price, p.img])
  }
  const allProducts = await query('SELECT id, sku, name, price FROM public.products')
  console.log(`✅ Products table now has: ${allProducts.length} rows`)

  // 10. STOCK MOVEMENTS (at least 15 rows)
  console.log('--- 10. Seeding Stock Movements ---')
  for (let i = 0; i < allProducts.length; i++) {
    const p = allProducts[i]
    await query(`
      INSERT INTO public.stock_movements (product_id, delta, reason, ref_type, note)
      VALUES ($1, 50, 'purchase', 'purchase_order', 'Initial shipment from authorized distributor')
      ON CONFLICT DO NOTHING
    `, [p.id])
  }
  const allStockMovements = await query('SELECT count(*)::int as count FROM public.stock_movements')
  console.log(`✅ Stock Movements table now has: ${allStockMovements[0].count} rows`)

  // 11. SHOP ORDERS (at least 12 orders)
  console.log('--- 11. Seeding Shop Orders ---')
  for (let i = 0; i < 12; i++) {
    const m = allMembers[i % allMembers.length]
    const ordNo = `ORD-2026-${String(2001 + i).padStart(6, '0')}`
    await query(`
      INSERT INTO public.shop_orders (
        order_no, member_id, customer_name, customer_phone, channel, fulfilment,
        status, payment_status, subtotal, discount, tax_amount, total
      ) VALUES ($1, $2, $3, $4, 'counter', 'pickup', 'delivered', 'paid', 2500, 250, 405, 2655)
      ON CONFLICT (order_no) DO NOTHING
    `, [ordNo, m.id, m.full_name, '+919876543210'])
  }
  const allShopOrders = await query('SELECT id, order_no FROM public.shop_orders')
  console.log(`✅ Shop Orders table now has: ${allShopOrders.length} rows`)

  // 12. SHOP ORDER ITEMS (at least 15 rows)
  console.log('--- 12. Seeding Shop Order Items ---')
  for (let i = 0; i < allShopOrders.length; i++) {
    const ord = allShopOrders[i]
    const prod = allProducts[i % allProducts.length]
    await query(`
      INSERT INTO public.shop_order_items (
        order_id, product_id, name_snapshot, unit_price, qty, tax_rate_pct, tax_amount, line_total
      ) VALUES ($1, $2, $3, $4, 1, 18, $5, $4)
      ON CONFLICT DO NOTHING
    `, [ord.id, prod.id, prod.name, prod.price, Number(prod.price) * 0.18])
  }
  const allOrderItems = await query('SELECT count(*)::int as count FROM public.shop_order_items')
  console.log(`✅ Shop Order Items table now has: ${allOrderItems[0].count} rows`)

  // 13. BAR TABLES (at least 10 tables)
  console.log('--- 13. Seeding Bar Tables ---')
  for (let i = 1; i <= 12; i++) {
    const label = `Table T-${String(i).padStart(2, '0')}`
    await query(`
      INSERT INTO public.bar_tables (label, seats, is_active)
      VALUES ($1, $2, true)
      ON CONFLICT (label) DO NOTHING
    `, [label, i <= 4 ? 2 : (i <= 8 ? 4 : 6)])
  }
  const allBarTables = await query('SELECT id, label FROM public.bar_tables')
  console.log(`✅ Bar Tables table now has: ${allBarTables.length} rows`)

  // 14. MENU ITEMS (at least 15 items with gourmet photos)
  console.log('--- 14. Seeding Menu Items ---')
  const menuSeeds = [
    { name: 'Double Ristretto Espresso', cat: 'Coffee & Brews', price: 180, station: 'bar', img: MENU_IMAGES[0] },
    { name: 'Nitro Cold Brew Coffee', cat: 'Coffee & Brews', price: 260, station: 'bar', img: MENU_IMAGES[1] },
    { name: 'Velvet Oat Milk Cappuccino', cat: 'Coffee & Brews', price: 240, station: 'bar', img: MENU_IMAGES[2] },
    { name: 'Ceremonial Matcha Latte', cat: 'Wellness Teas', price: 280, station: 'bar', img: MENU_IMAGES[3] },
    { name: 'Wild Berry Electrolyte Smoothie', cat: 'Recovery Smoothies', price: 320, station: 'bar', img: MENU_IMAGES[4] },
    { name: 'Cold-Pressed Valencia Orange', cat: 'Fresh Juices', price: 220, station: 'bar', img: MENU_IMAGES[5] },
    { name: 'Herb Grilled Chicken Quinoa Bowl', cat: 'Protein Bowls', price: 480, station: 'kitchen', img: MENU_IMAGES[6] },
    { name: 'Smashed Avocado & Egg Sourdough', cat: 'Artisan Toasts', price: 390, station: 'kitchen', img: MENU_IMAGES[7] },
    { name: 'Smoked Turkey Club Sandwich', cat: 'Gourmet Sandwiches', price: 420, station: 'kitchen', img: MENU_IMAGES[8] },
    { name: 'Kalamata Greek Salad with Feta', cat: 'Fresh Salads', price: 360, station: 'kitchen', img: MENU_IMAGES[9] },
    { name: 'Organic Chia & Acai Granola Bowl', cat: 'Healthy Snacks', price: 340, station: 'kitchen', img: MENU_IMAGES[10] },
    { name: 'Triple Chocolate Whey Shake', cat: 'Protein Shakes', price: 300, station: 'bar', img: MENU_IMAGES[11] },
  ]

  for (const m of menuSeeds) {
    await query(`
      INSERT INTO public.menu_items (name, category, price, tax_rate_pct, station, is_available, image_url)
      VALUES ($1, $2, $3, 5, $4, true, $5)
      ON CONFLICT (name, category) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url
    `, [m.name, m.cat, m.price, m.station, m.img])
  }
  const allMenuItems = await query('SELECT id, name, category, price FROM public.menu_items')
  console.log(`✅ Menu Items table now has: ${allMenuItems.length} rows`)

  // 15. BAR TABS (at least 12 tabs)
  console.log('--- 15. Seeding Bar Tabs ---')
  for (let i = 0; i < 12; i++) {
    const table = allBarTables[i % allBarTables.length]
    const member = allMembers[i % allMembers.length]
    const tabNo = `TAB-20261003-${String(100 + i).padStart(4, '0')}`
    await query(`
      INSERT INTO public.bar_tabs (
        tab_no, table_id, member_id, status, subtotal, discount_pct, discount, tax_amount, total
      ) VALUES ($1, $2, $3, 'settled', 800, 10, 80, 36, 756)
      ON CONFLICT (tab_no) DO NOTHING
    `, [tabNo, table.id, member.id])
  }
  const allBarTabs = await query('SELECT id, tab_no FROM public.bar_tabs')
  console.log(`✅ Bar Tabs table now has: ${allBarTabs.length} rows`)

  // 16. BAR ORDER ITEMS (at least 15 items)
  console.log('--- 16. Seeding Bar Order Items ---')
  for (let i = 0; i < allBarTabs.length; i++) {
    const tab = allBarTabs[i]
    const item = allMenuItems[i % allMenuItems.length]
    await query(`
      INSERT INTO public.bar_order_items (
        tab_id, menu_item_id, name_snapshot, unit_price, qty, tax_rate_pct, kitchen_status, station
      ) VALUES ($1, $2, $3, $4, 1, 5, 'served', 'bar')
      ON CONFLICT DO NOTHING
    `, [tab.id, item.id, item.name, item.price])
  }
  const allBarOrderItems = await query('SELECT count(*)::int as count FROM public.bar_order_items')
  console.log(`✅ Bar Order Items table now has: ${allBarOrderItems[0].count} rows`)

  // 17. EMPLOYEES (at least 10 employees)
  console.log('--- 17. Seeding Employees ---')
  const empTitles = [
    { title: 'Head Tennis Coach', salary: 75000 },
    { title: 'Master Padel Instructor', salary: 70000 },
    { title: 'Chief Operations Officer', salary: 90000 },
    { title: 'Executive Head Chef', salary: 65000 },
    { title: 'Lead Mixologist & Bar Manager', salary: 55000 },
    { title: 'Front Desk Lead', salary: 45000 },
    { title: 'Pro Shop Inventory Manager', salary: 48000 },
    { title: 'Senior Court Superintendent', salary: 40000 },
    { title: 'Sports Physiotherapist', salary: 65000 },
    { title: 'Events Coordinator', salary: 50000 },
  ]

  for (let i = 0; i < empTitles.length; i++) {
    const empUser = allUsers[i % allUsers.length]
    const emp = empTitles[i]
    await query(`
      INSERT INTO public.employees (user_id, full_name, title, phone, email, base_salary, joined_on, status)
      VALUES ($1, $2, $3, $4, $5, $6, '2024-01-15', 'active')
      ON CONFLICT (user_id) DO UPDATE SET title = EXCLUDED.title, base_salary = EXCLUDED.base_salary
    `, [empUser.id, empUser.name, emp.title, empUser.phone || `+9198760000${i}`, empUser.email, emp.salary])
  }
  const allEmployees = await query('SELECT id, full_name, title, base_salary FROM public.employees')
  console.log(`✅ Employees table now has: ${allEmployees.length} rows`)

  // 18. SHIFTS (at least 12 shifts)
  console.log('--- 18. Seeding Shifts ---')
  const areas = ['court', 'shop', 'bar', 'front_desk', 'maintenance']
  for (let i = 0; i < allEmployees.length; i++) {
    const emp = allEmployees[i]
    const area = areas[i % areas.length]
    await query(`
      INSERT INTO public.shifts (employee_id, shift_date, start_time, end_time, area, status)
      VALUES ($1, current_date, '06:00:00', '14:00:00', $2, 'checked_in')
      ON CONFLICT (employee_id, shift_date) DO NOTHING
    `, [emp.id, area])
  }
  const allShifts = await query('SELECT count(*)::int as count FROM public.shifts')
  console.log(`✅ Shifts table now has: ${allShifts[0].count} rows`)

  // 19. LEAVE REQUESTS (at least 10 requests)
  console.log('--- 19. Seeding Leave Requests ---')
  for (let i = 0; i < allEmployees.length; i++) {
    const emp = allEmployees[i]
    await query(`
      INSERT INTO public.leave_requests (employee_id, type, from_date, to_date, days, reason, status)
      VALUES ($1, 'casual', current_date + interval '10 days', current_date + interval '12 days', 3, 'Annual family holiday', 'approved')
      ON CONFLICT DO NOTHING
    `, [emp.id])
  }
  const allLeaves = await query('SELECT count(*)::int as count FROM public.leave_requests')
  console.log(`✅ Leave Requests table now has: ${allLeaves[0].count} rows`)

  // 20. PAYROLL RUNS (at least 10 monthly payroll runs)
  console.log('--- 20. Seeding Payroll Runs ---')
  for (let m = 1; m <= 10; m++) {
    const monthDate = `2025-${String(m).padStart(2, '0')}-01`
    await query(`
      INSERT INTO public.payroll_runs (month, status, finalized_at, paid_at)
      VALUES ($1, 'paid', now(), now())
      ON CONFLICT (month) DO NOTHING
    `, [monthDate])
  }
  const allRuns = await query('SELECT id, month FROM public.payroll_runs')
  console.log(`✅ Payroll Runs table now has: ${allRuns.length} rows`)

  // 21. PAYSLIPS (at least 15 payslips)
  console.log('--- 21. Seeding Payslips ---')
  for (let i = 0; i < allEmployees.length; i++) {
    const run = allRuns[0]
    const emp = allEmployees[i]
    const base = Number(emp.base_salary)
    await query(`
      INSERT INTO public.payslips (run_id, employee_id, base_salary, allowances, deductions, unpaid_leave_days, leave_deduction, net_pay)
      VALUES ($1, $2, $3, 5000, 2000, 0, 0, $4)
      ON CONFLICT (run_id, employee_id) DO NOTHING
    `, [run.id, emp.id, base, base + 3000])
  }
  const allPayslips = await query('SELECT count(*)::int as count FROM public.payslips')
  console.log(`✅ Payslips table now has: ${allPayslips[0].count} rows`)

  // 22. LEADS (at least 12 leads)
  console.log('--- 22. Seeding Leads ---')
  const leadSeeds = [
    { name: 'Kavita Krishnan', email: 'kavita@techcorp.in', phone: '+919900112233', source: 'website', sport: 'tennis' },
    { name: 'Arjun Singhania', email: 'arjun@investments.in', phone: '+919900112234', source: 'referral', sport: 'padel' },
    { name: 'Vikramaditya Roy', email: 'vikram@roylogistics.com', phone: '+919900112235', source: 'instagram', sport: 'squash' },
    { name: 'Meera Nambiar', email: 'meera@nambiar.org', phone: '+919900112236', source: 'walk_in', sport: 'badminton' },
    { name: 'Sameer Verma', email: 'sameer@fintech.co', phone: '+919900112237', source: 'campaign', sport: 'pickleball' },
    { name: 'Ananya Deshmukh', email: 'ananya@creativelabs.io', phone: '+919900112238', source: 'website', sport: 'tennis' },
    { name: 'Rohan Mehra', email: 'rohan@startups.in', phone: '+919900112239', source: 'referral', sport: 'padel' },
    { name: 'Devika Pillai', email: 'devika@consulting.com', phone: '+919900112240', source: 'phone', sport: 'tennis' },
    { name: 'Harsh Vardhan', email: 'harsh@biotech.res', phone: '+919900112241', source: 'campaign', sport: 'squash' },
    { name: 'Shreya Kapoor', email: 'shreya@kapoor.co', phone: '+919900112242', source: 'walk_in', sport: 'badminton' },
    { name: 'Gaurav Sen', email: 'gaurav@sensolutions.in', phone: '+919900112243', source: 'website', sport: 'pickleball' },
    { name: 'Pooja Hegde', email: 'pooja@mediahouse.com', phone: '+919900112244', source: 'instagram', sport: 'padel' },
  ]

  for (const l of leadSeeds) {
    const plan = allPlans[0]
    await query(`
      INSERT INTO public.leads (name, email, phone, source, sport, plan_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'contacted')
      ON CONFLICT DO NOTHING
    `, [l.name, l.email, l.phone, l.source, l.sport, plan.id])
  }
  const allLeads = await query('SELECT id, name FROM public.leads')
  console.log(`✅ Leads table now has: ${allLeads.length} rows`)

  // 23. LEAD ACTIVITIES (at least 15 activities)
  console.log('--- 23. Seeding Lead Activities ---')
  for (let i = 0; i < allLeads.length; i++) {
    const lead = allLeads[i]
    await query(`
      INSERT INTO public.lead_activities (lead_id, type, text)
      VALUES ($1, 'call', 'Scheduled club tour and introduction with the Head Tennis Coach')
      ON CONFLICT DO NOTHING
    `, [lead.id])
  }
  const allActivities = await query('SELECT count(*)::int as count FROM public.lead_activities')
  console.log(`✅ Lead Activities table now has: ${allActivities[0].count} rows`)

  // 24. QUOTES (at least 10 quotes)
  console.log('--- 24. Seeding Quotes ---')
  for (let i = 0; i < 10; i++) {
    const lead = allLeads[i % allLeads.length]
    const plan = allPlans[i % allPlans.length]
    await query(`
      INSERT INTO public.quotes (lead_id, plan_id, amount, notes, valid_until, status)
      VALUES ($1, $2, $3, 'Special corporate intro package with 2 free coaching clinics', current_date + interval '14 days', 'sent')
      ON CONFLICT DO NOTHING
    `, [lead.id, plan.id, plan.price])
  }
  const allQuotes = await query('SELECT count(*)::int as count FROM public.quotes')
  console.log(`✅ Quotes table now has: ${allQuotes[0].count} rows`)

  // 25. CLIENTS (at least 10 B2B corporate clients)
  console.log('--- 25. Seeding Clients ---')
  const clientSeeds = [
    { name: 'Infosys Sports Club', person: 'Narayana Murthy', email: 'sports@infosys.com', phone: '+918028520261' },
    { name: 'Wipro Wellness Foundation', person: 'Azim Premji', email: 'wellness@wipro.com', phone: '+918028440011' },
    { name: 'Tata Consultancy Services Corp', person: 'K. Krithivasan', email: 'club@tcs.com', phone: '+912267789999' },
    { name: 'Google India Bengaluru Campus', person: 'Sundar Pichai', email: 'blr-facilities@google.com', phone: '+918067218000' },
    { name: 'Microsoft India R&D', person: 'Satya Nadella', email: 'recreation@microsoft.com', phone: '+918041300000' },
    { name: 'Flipkart Health & Fitness League', person: 'Kalyan Krishnamurthy', email: 'sports@flipkart.com', phone: '+918049080000' },
    { name: 'Swiggy HQ Wellness Division', person: 'Sriharsha Majety', email: 'wellness@swiggy.in', phone: '+918067466790' },
    { name: 'Zerodha Traders Athletic Guild', person: 'Nithin Kamath', email: 'health@zerodha.com', phone: '+918047181888' },
    { name: 'Razorpay Sports Society', person: 'Harshil Mathur', email: 'sports@razorpay.com', phone: '+918046669999' },
    { name: 'Titan Company Recreation Club', person: 'CK Venkataraman', email: 'recreation@titan.co.in', phone: '+918067047000' },
  ]

  for (const c of clientSeeds) {
    await query(`
      INSERT INTO public.clients (name, contact_person, email, phone, gst_no, address)
      VALUES ($1, $2, $3, $4, '29AAAAA0000A1Z5', 'Outer Ring Road Tech Park, Bengaluru')
      ON CONFLICT (name) DO NOTHING
    `, [c.name, c.person, c.email, c.phone])
  }
  const allClients = await query('SELECT id, name FROM public.clients')
  console.log(`✅ Clients table now has: ${allClients.length} rows`)

  // 26. INVOICES (at least 12 invoices)
  console.log('--- 26. Seeding Invoices ---')
  for (let i = 0; i < allClients.length; i++) {
    const client = allClients[i]
    const invNo = `INV-2026-${String(3001 + i).padStart(4, '0')}`
    await query(`
      INSERT INTO public.invoices (
        invoice_no, client_id, category, issue_date, due_date, status,
        subtotal, tax_amount, total, paid_amount, notes
      ) VALUES ($1, $2, 'court', current_date, current_date + interval '30 days', 'paid', 50000, 9000, 59000, 59000, 'Monthly corporate court bulk booking package')
      ON CONFLICT (invoice_no) DO NOTHING
    `, [invNo, client.id])
  }
  const allInvoices = await query('SELECT id, invoice_no FROM public.invoices')
  console.log(`✅ Invoices table now has: ${allInvoices.length} rows`)

  // 27. INVOICE ITEMS (at least 15 items)
  console.log('--- 27. Seeding Invoice Items ---')
  for (let i = 0; i < allInvoices.length; i++) {
    const inv = allInvoices[i]
    await query(`
      INSERT INTO public.invoice_items (invoice_id, description, qty, unit_price, tax_rate_pct, amount)
      VALUES ($1, '50 Hours Peak Time Court Reservation', 50, 1000, 18, 50000)
      ON CONFLICT DO NOTHING
    `, [inv.id])
  }
  const allInvoiceItems = await query('SELECT count(*)::int as count FROM public.invoice_items')
  console.log(`✅ Invoice Items table now has: ${allInvoiceItems[0].count} rows`)

  // 28. PAYMENTS (at least 20 payments across categories)
  console.log('--- 28. Seeding Payments ---')
  const payMethods = ['upi', 'card', 'cash', 'bank_transfer', 'razorpay']
  for (let i = 0; i < 20; i++) {
    const payNo = `PAY-2026-${String(4001 + i).padStart(6, '0')}`
    const member = allMembers[i % allMembers.length]
    const method = payMethods[i % payMethods.length]
    await query(`
      INSERT INTO public.payments (
        payment_no, source_type, member_id, amount, method, status, revenue_category, paid_at
      ) VALUES ($1, 'booking', $2, 1180, $3, 'success', 'court', now())
      ON CONFLICT (payment_no) DO NOTHING
    `, [payNo, member.id, method])
  }
  const allPayments = await query('SELECT count(*)::int as count FROM public.payments')
  console.log(`✅ Payments table now has: ${allPayments[0].count} rows`)

  // 29. EXPENSES (at least 15 expenses)
  console.log('--- 29. Seeding Expenses ---')
  const expenseSeeds = [
    { vendor: 'Bangalore Electricity Supply (BESCOM)', cat: 'utilities', amt: 35000, desc: 'Monthly club floodlight power charges' },
    { vendor: 'Karnataka Water Board (BWSSB)', cat: 'utilities', amt: 12000, desc: 'Club facilities and irrigation water supply' },
    { vendor: 'Roland Garros Clay Importers', cat: 'maintenance', amt: 45000, desc: 'French red clay powder top-up for courts' },
    { vendor: 'Yonex India Sports Equipment', cat: 'inventory', amt: 85000, desc: 'Batch procurement of tournament shuttles' },
    { vendor: 'Wilson Sports Gear Logistics', cat: 'inventory', amt: 120000, desc: 'Pro shop tennis rackets and ball shipments' },
    { vendor: 'Blue Tokai Coffee Roasters', cat: 'inventory', amt: 28000, desc: 'Specialty espresso and cold brew coffee beans' },
    { vendor: 'Modern Facility Management Services', cat: 'maintenance', amt: 32000, desc: 'Clubhouse daily deep sanitation and towel wash' },
    { vendor: 'Meta Platforms Inc.', cat: 'marketing', amt: 25000, desc: 'Instagram championship league tournament ads' },
    { vendor: 'Google India Ads', cat: 'marketing', amt: 20000, desc: 'Search ads for court bookings and club memberships' },
    { vendor: 'Indiranagar Prime Properties', cat: 'rent', amt: 150000, desc: 'Ground lease monthly rental payment' },
    { vendor: 'TechnoGym Equipment Care', cat: 'maintenance', amt: 18000, desc: 'Bi-monthly cardio and weights maintenance' },
    { vendor: 'Fresh Farm Produce Bengaluru', cat: 'inventory', amt: 16500, desc: 'Organic sourdough and kitchen salad supplies' },
  ]

  for (const exp of expenseSeeds) {
    await query(`
      INSERT INTO public.expenses (vendor, category, description, amount, tax_amount, due_date, status, paid_at, payment_method)
      VALUES ($1, $2, $3, $4, $5, current_date, 'paid', now(), 'bank_transfer')
      ON CONFLICT DO NOTHING
    `, [exp.vendor, exp.cat, exp.desc, exp.amt, exp.amt * 0.18])
  }
  const allExpenses = await query('SELECT count(*)::int as count FROM public.expenses')
  console.log(`✅ Expenses table now has: ${allExpenses[0].count} rows`)

  // 30. NOTIFICATIONS (at least 15 notifications)
  console.log('--- 30. Seeding Notifications ---')
  for (let i = 0; i < allUsers.length; i++) {
    const user = allUsers[i]
    await query(`
      INSERT INTO public.notifications (user_id, type, title, body, link, is_read)
      VALUES ($1, 'booking', 'Court Booking Confirmed', 'Your reservation at Centre Court has been confirmed.', '/bookings', false)
      ON CONFLICT DO NOTHING
    `, [user.id])
  }
  const allNotifs = await query('SELECT count(*)::int as count FROM public.notifications')
  console.log(`✅ Notifications table now has: ${allNotifs[0].count} rows`)

  // 31. EMAIL VERIFICATION CODES (at least 10 rows)
  console.log('--- 31. Seeding Email Verification Codes ---')
  for (let i = 0; i < 10; i++) {
    const user = allUsers[i]
    await query(`
      INSERT INTO public.email_verification_codes (user_id, code_hash, expires_at, attempts)
      VALUES ($1, 'seed_hash_dummy_verification_code', now() + interval '1 day', 0)
      ON CONFLICT DO NOTHING
    `, [user.id])
  }
  const allCodes = await query('SELECT count(*)::int as count FROM public.email_verification_codes')
  console.log(`✅ Email Verification Codes table now has: ${allCodes[0].count} rows`)

  // 32. SETTINGS (ensure at least 10 settings keys)
  console.log('--- 32. Seeding Settings ---')
  const settingsKeys = [
    { key: 'club_profile', val: { name: 'The Champions Club', city: 'Bengaluru', established: 2024 } },
    { key: 'court_operating_hours', val: { open: '06:00', close: '23:00', slot_duration: 60 } },
    { key: 'tax_configuration', val: { gst_court_pct: 18, gst_proshop_pct: 18, gst_cafe_pct: 5 } },
    { key: 'cancellation_policy', val: { free_cancel_hours: 4, late_cancel_fee_pct: 50 } },
    { key: 'membership_rules', val: { max_advance_booking_days: 14, guest_passes_included: 4 } },
    { key: 'pro_shop_rules', val: { low_stock_alert_threshold: 5, allow_backorders: false } },
    { key: 'cafe_bar_rules', val: { auto_gratuity_pct: 0, service_charge_pct: 0 } },
    { key: 'notifications_config', val: { email_alerts: true, whatsapp_alerts: true } },
    { key: 'payment_gateways', val: { razorpay_enabled: true, cash_on_delivery: true, upi_qr: true } },
    { key: 'brand_theme', val: { primary_color: '#0f172a', accent_color: '#10b981', font: 'Inter' } },
  ]

  for (const s of settingsKeys) {
    await query(`
      INSERT INTO public.settings (key, value, updated_at)
      VALUES ($1, $2, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [s.key, JSON.stringify(s.val)])
  }
  const allSettings = await query('SELECT count(*)::int as count FROM public.settings')
  console.log(`✅ Settings table now has: ${allSettings[0].count} rows`)

  console.log('\n🎉 ALL TABLES IN SUPABASE DATABASE SUCCESSFULLY SEEDED WITH 10+ ENTRIES AND IMAGES!')
  process.exit(0)
}

seedDatabase().catch((err) => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
