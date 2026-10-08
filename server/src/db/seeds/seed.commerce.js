import memoryStore from '../../utils/memoryStore.js'
import { toClubDate } from '../../utils/clubTime.js'
import { subDays, format, addDays } from 'date-fns'

export const seedCommerce = async () => {
  console.log('--- SEEDING COMMERCE & OPS DATA ---')
  const nowIso = new Date().toISOString()
  const today = toClubDate()

  // 1. Categories
  const categories = [
    { id: 'cat-01', name: 'Rackets', is_active: true },
    { id: 'cat-02', name: 'Balls & Shuttles', is_active: true },
    { id: 'cat-03', name: 'Apparel', is_active: true },
    { id: 'cat-04', name: 'Footwear', is_active: true },
    { id: 'cat-05', name: 'Accessories', is_active: true },
  ]
  memoryStore.collections.product_categories = [...categories]

  // 2. Products (~20 SKUs, some at or below low stock threshold)
  const products = [
    { id: 'prd-01', name: 'Wilson Pro Staff 97 v14', sku: 'WIL-PS97-01', category_id: 'cat-01', price: 21990, stock_qty: 6, low_stock_threshold: 5, image_url: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=600&q=80', is_active: true },
    { id: 'prd-02', name: 'Babolat Pure Aero 2023', sku: 'BAB-PA23-01', category_id: 'cat-01', price: 19990, stock_qty: 3, low_stock_threshold: 5, image_url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80', is_active: true }, // LOW STOCK
    { id: 'prd-03', name: 'Head Speed MP 2024', sku: 'HED-SMP24-01', category_id: 'cat-01', price: 18500, stock_qty: 8, low_stock_threshold: 4, image_url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=600&q=80', is_active: true },
    { id: 'prd-04', name: 'Yonex Astrox 88D Pro', sku: 'YNX-AX88D-01', category_id: 'cat-01', price: 15490, stock_qty: 2, low_stock_threshold: 4, image_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80', is_active: true }, // LOW STOCK
    { id: 'prd-05', name: 'Bullpadel Hack 03 Padel Racket', sku: 'BUL-HACK3-01', category_id: 'cat-01', price: 24900, stock_qty: 5, low_stock_threshold: 3, image_url: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=600&q=80', is_active: true },
    { id: 'prd-06', name: 'Dunlop Fort All Court Balls (Can of 3)', sku: 'DUN-FORT-3', category_id: 'cat-02', price: 450, stock_qty: 48, low_stock_threshold: 15, image_url: 'https://images.unsplash.com/photo-1530915365347-e35b749a0381?auto=format&fit=crop&w=600&q=80', is_active: true },
    { id: 'prd-07', name: 'Head Tour XT Balls (Can of 3)', sku: 'HED-TXT-3', category_id: 'cat-02', price: 420, stock_qty: 30, low_stock_threshold: 10, image_url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80', is_active: true },
    { id: 'prd-08', name: 'Yonex Aerosensa 30 Feather Shuttles', sku: 'YNX-AS30-TUBE', category_id: 'cat-02', price: 2100, stock_qty: 4, low_stock_threshold: 8, image_url: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?auto=format&fit=crop&w=600&q=80', is_active: true }, // LOW STOCK
    { id: 'prd-09', name: 'Head Padel Pro S (Can of 3)', sku: 'HED-PADEL-3', category_id: 'cat-02', price: 650, stock_qty: 24, low_stock_threshold: 8, image_url: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=600&q=80', is_active: true },
    { id: 'prd-10', name: 'SG Club Leather Cricket Ball', sku: 'SG-CLUB-BALL', category_id: 'cat-02', price: 550, stock_qty: 20, low_stock_threshold: 6, image_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=600&q=80', is_active: true },
    { id: 'prd-11', name: 'Nike Dri-FIT Court Tennis Polo (M)', sku: 'NKE-DF-POLO-M', category_id: 'cat-03', price: 2995, stock_qty: 12, low_stock_threshold: 5, image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80', is_active: true },
    { id: 'prd-12', name: 'Nike Dri-FIT Court Tennis Polo (L)', sku: 'NKE-DF-POLO-L', category_id: 'cat-03', price: 2995, stock_qty: 10, low_stock_threshold: 5, image_url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80', is_active: true },
    { id: 'prd-13', name: 'Adidas Club Tennis Shorts (M)', sku: 'ADI-SHRT-M', category_id: 'cat-03', price: 2199, stock_qty: 8, low_stock_threshold: 4, image_url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=600&q=80', is_active: true },
    { id: 'prd-14', name: 'Yonex Team Badminton Tee (L)', sku: 'YNX-TEE-L', category_id: 'cat-03', price: 1290, stock_qty: 15, low_stock_threshold: 5, image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80', is_active: true },
    { id: 'prd-15', name: 'Asics Gel Resolution 9 Clay (UK 9)', sku: 'ASC-GELR9-09', category_id: 'cat-04', price: 11999, stock_qty: 4, low_stock_threshold: 3, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', is_active: true },
    { id: 'prd-16', name: 'Yonex Power Cushion 65 Z3 (UK 8)', sku: 'YNX-PC65-08', category_id: 'cat-04', price: 9500, stock_qty: 1, low_stock_threshold: 3, image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80', is_active: true }, // LOW STOCK
    { id: 'prd-17', name: 'Tourna Grip Original Dry XL (Pack of 3)', sku: 'TRN-GRP-3', category_id: 'cat-05', price: 590, stock_qty: 35, low_stock_threshold: 10, image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=600&q=80', is_active: true },
    { id: 'prd-18', name: 'Yonex Super Grap Overgrip (Pack of 3)', sku: 'YNX-GRAP-3', category_id: 'cat-05', price: 490, stock_qty: 40, low_stock_threshold: 12, image_url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80', is_active: true },
    { id: 'prd-19', name: 'Nike Swoosh Wristbands (Pair)', sku: 'NKE-WRIST-BLK', category_id: 'cat-05', price: 695, stock_qty: 18, low_stock_threshold: 5, image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80', is_active: true },
    { id: 'prd-20', name: 'Champions Club Insulated Water Bottle 1L', sku: 'CC-BTL-1L', category_id: 'cat-05', price: 890, stock_qty: 25, low_stock_threshold: 8, image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80', is_active: true },
  ]
  memoryStore.collections.products = products.map((p) => ({
    ...p,
    created_at: nowIso,
    updated_at: nowIso,
  }))

  // 3. Bar Menu Items (~15 items)
  const menuItems = [
    { id: 'mnu-01', name: 'Classic Margherita Pizza', category: 'food', price: 380, tax_rate_pct: 5, station: 'kitchen', image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80', is_available: true },
    { id: 'mnu-02', name: 'Grilled Chicken Panini', category: 'food', price: 320, tax_rate_pct: 5, station: 'kitchen', image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80', is_available: true },
    { id: 'mnu-03', name: 'Mediterranean Hummus Bowl', category: 'food', price: 290, tax_rate_pct: 5, station: 'kitchen', image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', is_available: true },
    { id: 'mnu-04', name: 'Penne Arbiatta', category: 'food', price: 340, tax_rate_pct: 5, station: 'kitchen', image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80', is_available: true },
    { id: 'mnu-05', name: 'Champions Protein Shake', category: 'drink', price: 220, tax_rate_pct: 18, station: 'bar', image_url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=600&q=80', is_available: true },
    { id: 'mnu-06', name: 'Iced Americano', category: 'drink', price: 160, tax_rate_pct: 18, station: 'bar', image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80', is_available: true },
    { id: 'mnu-07', name: 'Cold Brew Coffee', category: 'drink', price: 190, tax_rate_pct: 18, station: 'bar', image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80', is_available: true },
    { id: 'mnu-08', name: 'Fresh Watermelon Juice', category: 'drink', price: 150, tax_rate_pct: 18, station: 'bar', image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80', is_available: true },
    { id: 'mnu-09', name: 'Tender Coconut Water', category: 'drink', price: 120, tax_rate_pct: 18, station: 'bar', image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', is_available: true },
    { id: 'mnu-10', name: 'Masala French Fries', category: 'snack', price: 180, tax_rate_pct: 5, station: 'kitchen', image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80', is_available: true },
    { id: 'mnu-11', name: 'Crispy Veg Spring Rolls', category: 'snack', price: 220, tax_rate_pct: 5, station: 'kitchen', image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', is_available: true },
    { id: 'mnu-12', name: 'Peri Peri Chicken Wings', category: 'snack', price: 280, tax_rate_pct: 5, station: 'kitchen', image_url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80', is_available: true },
    { id: 'mnu-13', name: 'Nachos with Cheese & Salsa', category: 'snack', price: 210, tax_rate_pct: 5, station: 'kitchen', image_url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80', is_available: true },
    { id: 'mnu-14', name: 'Warm Chocolate Walnut Brownie', category: 'dessert', price: 190, tax_rate_pct: 5, station: 'kitchen', image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80', is_available: true },
    { id: 'mnu-15', name: 'Artisanal Gelato Scoop', category: 'dessert', price: 140, tax_rate_pct: 5, station: 'bar', image_url: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80', is_available: true },
  ]
  memoryStore.collections.menu_items = menuItems.map((m) => ({
    ...m,
    created_at: nowIso,
  }))

  // 4. Bar Tables (8 tables)
  const barTables = [
    { id: 'tbl-01', label: 'T1 (Courtside)', seats: 4, status: 'free', current_tab_id: null },
    { id: 'tbl-02', label: 'T2 (Courtside)', seats: 4, status: 'free', current_tab_id: null },
    { id: 'tbl-03', label: 'T3 (Lounge)', seats: 6, status: 'free', current_tab_id: null },
    { id: 'tbl-04', label: 'T4 (Lounge)', seats: 6, status: 'free', current_tab_id: null },
    { id: 'tbl-05', label: 'T5 (Patio)', seats: 2, status: 'free', current_tab_id: null },
    { id: 'tbl-06', label: 'T6 (Patio)', seats: 2, status: 'free', current_tab_id: null },
    { id: 'tbl-07', label: 'T7 (Terrace)', seats: 4, status: 'free', current_tab_id: null },
    { id: 'tbl-08', label: 'T8 (Terrace VIP)', seats: 8, status: 'free', current_tab_id: null },
  ]
  memoryStore.collections.bar_tables = [...barTables]

  // 5. Employees & HR
  const employees = [
    { id: 'emp-01', user_id: 'usr-owner-001', full_name: 'Rajesh Sharma', role: 'owner', department: 'Management', base_salary: 120000, is_active: true },
    { id: 'emp-02', user_id: 'usr-frontdesk-002', full_name: 'Priya Patel', role: 'front_desk', department: 'Operations', base_salary: 35000, is_active: true },
    { id: 'emp-03', user_id: 'usr-bar-003', full_name: 'Vikram Singh', role: 'bar_staff', department: 'F&B', base_salary: 28000, is_active: true },
  ]
  memoryStore.collections.employees = employees.map((e) => ({ ...e, created_at: nowIso }))

  // Shifts
  memoryStore.collections.shifts = [
    { id: 'shf-01', employee_id: 'emp-02', date: today, start_time: '06:00', end_time: '14:00', area: 'Front Desk', status: 'completed' },
    { id: 'shf-02', employee_id: 'emp-03', date: today, start_time: '12:00', end_time: '20:00', area: 'Bar Lounge', status: 'scheduled' },
  ]

  // Leave Request
  memoryStore.collections.leave_requests = [
    {
      id: 'lvr-01',
      employee_id: 'emp-02',
      type: 'casual',
      from_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
      to_date: format(addDays(new Date(), 4), 'yyyy-MM-dd'),
      days: 2,
      reason: 'Family function',
      status: 'pending',
      created_at: nowIso,
    },
  ]

  // 6. Leads (5+ open leads)
  const leads = [
    { id: 'led-01', full_name: 'Vikram Malhotra', phone: '+919988776655', email: 'vikram.m@example.com', interest: 'tennis', status: 'new', follow_up_date: today },
    { id: 'led-02', full_name: 'Sunita Rao', phone: '+919988776656', email: 'sunita.rao@example.com', interest: 'membership', status: 'contacted', follow_up_date: format(subDays(new Date(), 1), 'yyyy-MM-dd') }, // Overdue
    { id: 'led-03', full_name: 'Aditya Birla', phone: '+919988776657', email: 'aditya.b@example.com', interest: 'corporate', status: 'quoted', follow_up_date: format(addDays(new Date(), 2), 'yyyy-MM-dd') },
    { id: 'led-04', full_name: 'Deepak Joshi', phone: '+919988776658', email: 'deepak.j@example.com', interest: 'padel', status: 'new', follow_up_date: today },
    { id: 'led-05', full_name: 'Shalini Nair', phone: '+919988776659', email: 'shalini.n@example.com', interest: 'trial', status: 'trial_booked', follow_up_date: format(addDays(new Date(), 1), 'yyyy-MM-dd') },
  ]
  memoryStore.collections.leads = leads.map((l) => ({ ...l, created_at: nowIso }))

  // 7. Clients, Invoices & Expenses
  const clients = [
    { id: 'cli-01', name: 'Infosys Sports Club', contact_name: 'Ramesh Sen', email: 'sports@infosys.com', phone: '+919800112233', gst_no: '29ABCDE1234F1Z5' },
    { id: 'cli-02', name: 'Bengaluru Tennis Academy', contact_name: 'Mahesh B', email: 'contact@bta.org', phone: '+919800112244', gst_no: '29ABCDE5678F1Z6' },
  ]
  memoryStore.collections.clients = clients.map((c) => ({ ...c, created_at: nowIso }))

  memoryStore.collections.invoices = [
    {
      id: 'inv-01',
      invoice_no: 'INV-2026-0001',
      client_id: 'cli-01',
      category: 'corporate',
      issue_date: format(subDays(new Date(), 15), 'yyyy-MM-dd'),
      due_date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), // OVERDUE
      subtotal: 50000,
      tax_amount: 9000,
      total: 59000,
      paid_amount: 0,
      status: 'sent',
      created_at: nowIso,
    },
    {
      id: 'inv-02',
      invoice_no: 'INV-2026-0002',
      client_id: 'cli-02',
      category: 'coaching',
      issue_date: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
      due_date: format(addDays(new Date(), 25), 'yyyy-MM-dd'),
      subtotal: 25000,
      tax_amount: 4500,
      total: 29500,
      paid_amount: 29500,
      status: 'paid',
      created_at: nowIso,
    },
  ]

  memoryStore.collections.expenses = [
    {
      id: 'exp-01',
      title: 'Monthly Electricity Bill (BESCOM)',
      category: 'utilities',
      amount: 42000,
      tax_amount: 3500,
      due_date: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
      status: 'pending', // OVERDUE PAYABLE
      created_at: nowIso,
    },
    {
      id: 'exp-02',
      title: 'Court Maintenance & Clay Replenishment',
      category: 'maintenance',
      amount: 18500,
      tax_amount: 2820,
      due_date: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
      status: 'pending',
      created_at: nowIso,
    },
    {
      id: 'exp-03',
      title: 'Sports Equipment Restock',
      category: 'inventory',
      amount: 65000,
      tax_amount: 9915,
      due_date: format(subDays(new Date(), 12), 'yyyy-MM-dd'),
      status: 'paid',
      paid_at: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
      method: 'bank_transfer',
      created_at: nowIso,
    },
  ]

  // 8. 30 Days of Payments across categories & methods (BR-13 Single Revenue Ledger)
  const payments = []
  const methods = ['cash', 'card', 'upi', 'online']

  let paySeq = 1000
  let totalRevenueSeeded = 0

  for (let i = 29; i >= 0; i--) {
    const d = subDays(new Date(), i)
    const dateStr = format(d, 'yyyy-MM-dd')
    const isWeekend = d.getDay() === 0 || d.getDay() === 6
    const multiplier = isWeekend ? 2.2 : 1.0

    // Court payments
    const courtCount = Math.round(4 * multiplier)
    for (let c = 0; c < courtCount; c++) {
      paySeq++
      const amount = 800
      const taxAmount = Number(((amount * 18) / 118).toFixed(2))
      const method = methods[c % methods.length]
      payments.push({
        id: `pay-${paySeq}`,
        payment_no: `PAY-2026-${String(paySeq).padStart(6, '0')}`,
        source_type: 'booking',
        source_id: `bkg-${paySeq}`,
        revenue_category: 'court',
        amount,
        tax_amount: taxAmount,
        method,
        status: 'paid',
        paid_at: `${dateStr}T1${c}:00:00.000Z`,
        created_at: `${dateStr}T1${c}:00:00.000Z`,
      })
      totalRevenueSeeded += amount
    }

    // Shop payments
    const shopCount = Math.round(2 * multiplier)
    for (let s = 0; s < shopCount; s++) {
      paySeq++
      const amount = (s + 1) * 650
      const taxAmount = Number(((amount * 18) / 118).toFixed(2))
      const method = methods[(s + 1) % methods.length]
      payments.push({
        id: `pay-${paySeq}`,
        payment_no: `PAY-2026-${String(paySeq).padStart(6, '0')}`,
        source_type: 'shop_order',
        source_id: `ord-${paySeq}`,
        revenue_category: 'shop',
        amount,
        tax_amount: taxAmount,
        method,
        status: 'paid',
        paid_at: `${dateStr}T14:${s * 15}:00.000Z`,
        created_at: `${dateStr}T14:${s * 15}:00.000Z`,
      })
      totalRevenueSeeded += amount
    }

    // Bar payments
    const barCount = Math.round(3 * multiplier)
    for (let b = 0; b < barCount; b++) {
      paySeq++
      const amount = 450 + b * 150
      const taxAmount = Number(((amount * 12) / 112).toFixed(2))
      const method = methods[(b + 2) % methods.length]
      payments.push({
        id: `pay-${paySeq}`,
        payment_no: `PAY-2026-${String(paySeq).padStart(6, '0')}`,
        source_type: 'bar_tab',
        source_id: `tab-${paySeq}`,
        revenue_category: 'bar',
        amount,
        tax_amount: taxAmount,
        method,
        status: 'paid',
        paid_at: `${dateStr}T19:${b * 20}:00.000Z`,
        created_at: `${dateStr}T19:${b * 20}:00.000Z`,
      })
      totalRevenueSeeded += amount
    }
  }

  // Add the invoice payment from inv-02
  paySeq++
  payments.push({
    id: `pay-${paySeq}`,
    payment_no: `PAY-2026-${String(paySeq).padStart(6, '0')}`,
    source_type: 'invoice',
    source_id: 'inv-02',
    revenue_category: 'corporate',
    amount: 29500,
    tax_amount: 4500,
    method: 'bank_transfer',
    status: 'paid',
    paid_at: `${format(subDays(new Date(), 5), 'yyyy-MM-dd')}T10:00:00.000Z`,
    created_at: `${format(subDays(new Date(), 5), 'yyyy-MM-dd')}T10:00:00.000Z`,
  })
  totalRevenueSeeded += 29500

  memoryStore.collections.payments = payments

  console.log('✅ Commerce & Ops Seed completed:')
  console.log(`- Categories: ${categories.length}`)
  console.log(`- Products: ${products.length} (Low-stock items: ${products.filter(p => p.stock_qty <= p.low_stock_threshold).length})`)
  console.log(`- Menu Items: ${menuItems.length}`)
  console.log(`- Bar Tables: ${barTables.length}`)
  console.log(`- Employees: ${employees.length}`)
  console.log(`- Leads: ${leads.length}`)
  console.log(`- Invoices: ${memoryStore.collections.invoices.length}`)
  console.log(`- Expenses: ${memoryStore.collections.expenses.length}`)
  console.log(`- Payments Seeded: ${payments.length} rows totaling ₹${totalRevenueSeeded.toLocaleString('en-IN')}`)
}

export default seedCommerce
