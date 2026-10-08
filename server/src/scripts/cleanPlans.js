import { query } from '../utils/db.js'

async function clean() {
  const juniorId = '31a48dbd-fb3a-4316-9d86-005ca87b9e0e'
  const silverId = '82e0670b-ddbc-452b-8563-3f2a284294f5'
  const goldId = '023455d2-5e85-454b-83b2-afd73a874032'

  console.log('Canonical core plan IDs:', { juniorId, silverId, goldId })

  // Remap any memberships to the 3 core plans
  await query(
    `update public.memberships 
     set plan_id = $1 
     where plan_id not in ($1, $2, $3) 
       and plan_id in (select id from public.plans where lower(code) in ('gold', 'platinum', 'corp_elite', 'lifetime_vip'))`,
    [goldId, silverId, juniorId]
  )

  await query(
    `update public.memberships 
     set plan_id = $2 
     where plan_id not in ($1, $2, $3) 
       and plan_id in (select id from public.plans where lower(code) in ('silver', 'monthly_pro', 'quarterly', 'weekend_warrior'))`,
    [goldId, silverId, juniorId]
  )

  await query(
    `update public.memberships 
     set plan_id = $3 
     where plan_id not in ($1, $2, $3)`,
    [goldId, silverId, juniorId]
  )

  // Deactivate all plans except the 3 core plans
  await query(
    `update public.plans set is_active = false where id not in ($1, $2, $3)`,
    [juniorId, silverId, goldId]
  )

  // Update canonical pricing and perks to reflect real club value
  await query(
    `update public.plans 
     set price = 59999,
         description = 'The ultimate VIP all-access pass with 100% complimentary courts, 14-day priority window, and luxury clubhouse perks.',
         perks = $1,
         is_active = true
     where id = $2`,
    [
      JSON.stringify([
        '100% Free Court Bookings (Zero Court Fees)',
        '14-Day Advance Priority Window',
        '4 Daily Session Bookings Allowance',
        '15% Off Pro-Shop Equipment & Stringing',
        '15% Off Club Café & Energy Bar',
        'VIP Locker & Recovery Lounge Access',
        'Save ₹1,50,000+/year on Court Fees',
      ]),
      goldId,
    ]
  )

  await query(
    `update public.plans 
     set price = 29999,
         description = 'The active competitive athlete tier with 30% court discounts, priority bookings, and clubhouse privileges.',
         perks = $1,
         is_active = true
     where id = $2`,
    [
      JSON.stringify([
        '30% Off All Court Bookings',
        '7-Day Advance Priority Booking Window',
        '2 Daily Session Bookings Allowance',
        '10% Off Pro-Shop Gear & Apparel',
        '10% Off Club Café & Nutrition Bar',
        'Club Tournament & League Access',
        'Save ₹45,000+/year on Sports Bookings',
      ]),
      silverId,
    ]
  )

  await query(
    `update public.plans 
     set price = 14999,
         description = 'For aspiring young athletes under 18 years. Includes 50% court discount, coaching priority & pro gear savings.',
         perks = $1,
         is_active = true
     where id = $2`,
    [
      JSON.stringify([
        '50% Off Junior & Training Courts',
        'Junior Academy Coaching Priority',
        '2 Daily Session Bookings Allowance',
        '10% Off Junior Equipment & Restringing',
        '10% Off Healthy Café Smoothies & Fuel',
        'Save ₹30,000+/year on Youth Training',
      ]),
      juniorId,
    ]
  )

  const activePlans = await query(
    `select id, code, name, price, is_active from public.plans where is_active = true order by price asc`
  )

  console.log('Active plans remaining in DB:', activePlans.length)
  activePlans.forEach((p) => {
    console.log(`- [${p.code}] ${p.name} (₹${p.price})`)
  })
}

clean()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
