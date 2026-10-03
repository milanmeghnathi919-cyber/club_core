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

  await query(
    `update public.plans set is_active = true where id in ($1, $2, $3)`,
    [juniorId, silverId, goldId]
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
