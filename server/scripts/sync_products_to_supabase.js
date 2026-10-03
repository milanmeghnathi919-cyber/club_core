import pg from 'pg'

const client = new pg.Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.rcfyaquqdrvlwyvfshow',
  password: 'club_core@123',
  ssl: { rejectUnauthorized: false },
})

const PRODUCT_IMAGE_MAP = {
  'WIL-PS97-01': 'https://images.unsplash.com/photo-1617083934555-563d762e8316?auto=format&fit=crop&w=600&q=80',
  'BAB-PA23-01': 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80',
  'HED-SMP24-01': 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=600&q=80',
  'YNX-AX88D-01': 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
  'BUL-HACK3-01': 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=600&q=80',
  'DUN-FORT-3': 'https://images.unsplash.com/photo-1530915365347-e35b749a0381?auto=format&fit=crop&w=600&q=80',
  'HED-TXT-3': 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80',
  'YNX-AS30-TUBE': 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?auto=format&fit=crop&w=600&q=80',
  'HED-PADEL-3': 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=600&q=80',
  'SG-CLUB-BALL': 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=600&q=80',
  'NKE-DF-POLO-M': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
  'NKE-DF-POLO-L': 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80',
  'ADI-SHRT-M': 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=600&q=80',
  'YNX-TEE-L': 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
  'ASC-GELR9-09': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  'YNX-PC65-08': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
  'TRN-GRP-3': 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=600&q=80',
  'YNX-GRAP-3': 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80',
  'NKE-WRIST-BLK': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
  'CC-BTL-1L': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
}

const PRODUCTS_DATA = [
  { name: 'Wilson Pro Staff 97 v14', sku: 'WIL-PS97-01', catName: 'Rackets & Bats', price: 21990, stock: 6, low: 5, brand: 'Wilson', desc: 'Precision tennis racket for advanced players' },
  { name: 'Babolat Pure Aero 2023', sku: 'BAB-PA23-01', catName: 'Rackets & Bats', price: 19990, stock: 3, low: 5, brand: 'Babolat', desc: 'Maximum spin and power tournament racket' },
  { name: 'Head Speed MP 2024', sku: 'HED-SMP24-01', catName: 'Rackets & Bats', price: 18500, stock: 8, low: 4, brand: 'Head', desc: 'Versatile speed and control racket' },
  { name: 'Yonex Astrox 88D Pro', sku: 'YNX-AX88D-01', catName: 'Rackets & Bats', price: 15490, stock: 2, low: 4, brand: 'Yonex', desc: 'Heavy smashes and backcourt dominance' },
  { name: 'Bullpadel Hack 03 Padel Racket', sku: 'BUL-HACK3-01', catName: 'Rackets & Bats', price: 24900, stock: 5, low: 3, brand: 'Bullpadel', desc: 'Diamond-shaped maximum power padel racket' },
  { name: 'Dunlop Fort All Court Balls (Can of 3)', sku: 'DUN-FORT-3', catName: 'Balls & Shuttles', price: 450, stock: 48, low: 15, brand: 'Dunlop', desc: 'Premium all-court pressurized tennis balls' },
  { name: 'Head Tour XT Balls (Can of 3)', sku: 'HED-TXT-3', catName: 'Balls & Shuttles', price: 420, stock: 30, low: 10, brand: 'Head', desc: 'Optimized touch and control balls' },
  { name: 'Yonex Aerosensa 30 Feather Shuttles', sku: 'YNX-AS30-TUBE', catName: 'Balls & Shuttles', price: 2100, stock: 4, low: 8, brand: 'Yonex', desc: 'Tournament grade goose feather shuttlecocks' },
  { name: 'Head Padel Pro S (Can of 3)', sku: 'HED-PADEL-3', catName: 'Balls & Shuttles', price: 650, stock: 24, low: 8, brand: 'Head', desc: 'Official World Padel Tour speed ball' },
  { name: 'SG Club Leather Cricket Ball', sku: 'SG-CLUB-BALL', catName: 'Balls & Shuttles', price: 550, stock: 20, low: 6, brand: 'SG', desc: 'Four-piece alum tanned leather ball' },
  { name: 'Nike Dri-FIT Court Tennis Polo (M)', sku: 'NKE-DF-POLO-M', catName: 'Apparel', price: 2995, stock: 12, low: 5, brand: 'Nike', desc: 'Breathable moisture-wicking match polo' },
  { name: 'Nike Dri-FIT Court Tennis Polo (L)', sku: 'NKE-DF-POLO-L', catName: 'Apparel', price: 2995, stock: 10, low: 5, brand: 'Nike', desc: 'Breathable moisture-wicking match polo' },
  { name: 'Adidas Club Tennis Shorts (M)', sku: 'ADI-SHRT-M', catName: 'Apparel', price: 2199, stock: 8, low: 4, brand: 'Adidas', desc: 'Ergonomic performance tennis shorts with deep pockets' },
  { name: 'Yonex Team Badminton Tee (L)', sku: 'YNX-TEE-L', catName: 'Apparel', price: 1290, stock: 15, low: 5, brand: 'Yonex', desc: 'Lightweight quick-dry badminton jersey' },
  { name: 'Asics Gel Resolution 9 Clay (UK 9)', sku: 'ASC-GELR9-09', catName: 'Footwear', price: 11999, stock: 4, low: 3, brand: 'Asics', desc: 'Stability tennis shoe with Dynawall technology' },
  { name: 'Yonex Power Cushion 65 Z3 (UK 8)', sku: 'YNX-PC65-08', catName: 'Footwear', price: 9500, stock: 1, low: 3, brand: 'Yonex', desc: 'All-around fit and maximum shock absorption' },
  { name: 'Tourna Grip Original Dry XL (Pack of 3)', sku: 'TRN-GRP-3', catName: 'Accessories', price: 590, stock: 35, low: 10, brand: 'Tourna', desc: 'Famous blue grip for sweaty hands' },
  { name: 'Yonex Super Grap Overgrip (Pack of 3)', sku: 'YNX-GRAP-3', catName: 'Accessories', price: 490, stock: 40, low: 12, brand: 'Yonex', desc: 'Tacky feel and excellent durability' },
  { name: 'Nike Swoosh Wristbands (Pair)', sku: 'NKE-WRIST-BLK', catName: 'Accessories', price: 695, stock: 18, low: 5, brand: 'Nike', desc: 'High absorption sports wristbands' },
  { name: 'Champions Club Insulated Water Bottle 1L', sku: 'CC-BTL-1L', catName: 'Accessories', price: 890, stock: 25, low: 8, brand: 'Champions Club', desc: 'Vacuum insulated double-wall stainless steel bottle' },
]

async function syncProducts() {
  await client.connect()
  console.log('Connected to Supabase Postgres!')

  const categoriesRes = await client.query('SELECT id, name FROM public.product_categories')
  const categories = categoriesRes.rows
  const catMap = {}
  categories.forEach(c => {
    catMap[c.name.toLowerCase()] = c.id
  })

  // Ensure 'Apparel' category exists
  let apparelCatId = catMap['apparel'] || catMap['apparel & sportswear']
  if (!apparelCatId) {
    const newCat = await client.query("INSERT INTO public.product_categories (name) VALUES ('Apparel') RETURNING id")
    apparelCatId = newCat.rows[0].id
    catMap['apparel'] = apparelCatId
  }

  for (const item of PRODUCTS_DATA) {
    let catId = catMap[item.catName.toLowerCase()] || catMap['accessories'] || categories[0]?.id
    const img = PRODUCT_IMAGE_MAP[item.sku]

    await client.query(`
      INSERT INTO public.products (
        sku, name, description, category_id, brand, price, tax_rate_pct,
        stock_qty, low_stock_threshold, low_stock_alerted, image_url, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, 18, $7, $8, false, $9, true)
      ON CONFLICT (sku) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        category_id = EXCLUDED.category_id,
        brand = EXCLUDED.brand,
        price = EXCLUDED.price,
        stock_qty = EXCLUDED.stock_qty,
        low_stock_threshold = EXCLUDED.low_stock_threshold,
        image_url = EXCLUDED.image_url,
        is_active = true
    `, [item.sku, item.name, item.desc, catId, item.brand, item.price, item.stock, item.low, img])
  }

  // Also update any products that have missing images
  const allProdsRes = await client.query('SELECT id, sku, name, image_url FROM public.products')
  for (const p of allProdsRes.rows) {
    if (!p.image_url) {
      const fallbackImg = PRODUCT_IMAGE_MAP[p.sku] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'
      await client.query('UPDATE public.products SET image_url = $1 WHERE id = $2', [fallbackImg, p.id])
    }
  }

  // Also update menu_items with missing images
  const MENU_FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=600&q=80',
  ]

  const menuItemsRes = await client.query('SELECT id, name, image_url FROM public.menu_items')
  for (let i = 0; i < menuItemsRes.rows.length; i++) {
    const m = menuItemsRes.rows[i]
    if (!m.image_url) {
      const img = MENU_FALLBACK_IMAGES[i % MENU_FALLBACK_IMAGES.length]
      await client.query('UPDATE public.menu_items SET image_url = $1 WHERE id = $2', [img, m.id])
    }
  }

  const finalProds = await client.query('SELECT count(*)::int as count FROM public.products WHERE image_url IS NOT NULL')
  const finalMenu = await client.query('SELECT count(*)::int as count FROM public.menu_items WHERE image_url IS NOT NULL')
  console.log(`✅ Products in Supabase with images: ${finalProds.rows[0].count}`)
  console.log(`✅ Menu items in Supabase with images: ${finalMenu.rows[0].count}`)

  await client.end()
  process.exit(0)
}

syncProducts().catch(console.error)
