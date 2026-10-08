import app from '../src/app.js'
import seedCore from '../src/db/seeds/seed.core.js'
import seedCommerce from '../src/db/seeds/seed.commerce.js'
import { addDays, format } from 'date-fns'

const runSmokeTests = async () => {
  console.log('========================================================================')
  console.log('               CHAMPIONS CLUB - SMOKE TEST RUNNER                     ')
  console.log('========================================================================\n')

  let baseUrl = process.argv[2]
  let server = null

  if (!baseUrl) {
    console.log('No external baseUrl provided. Initializing database and starting local instance...')
    await seedCore()
    await seedCommerce()

    const port = 5055
    server = app.listen(port)
    baseUrl = `http://localhost:${port}`
    console.log(`Ephemeral smoke test server listening on ${baseUrl}\n`)
  } else {
    console.log(`Running smoke tests against target: ${baseUrl}\n`)
  }

  const cleanBase = baseUrl.replace(/\/$/, '')

  const runStep = async (name, fn) => {
    process.stdout.write(`• ${name}... `)
    try {
      await fn()
      console.log('PASSED ✅')
    } catch (err) {
      console.log('FAILED ❌')
      console.error(`  Error: ${err.message}`)
      if (server) server.close()
      process.exit(1)
    }
  }

  let token = null
  let courtId = null
  let bookingId = null

  // 1. Health check
  await runStep('1. Health Check (GET /health)', async () => {
    const res = await fetch(`${cleanBase}/health`)
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const json = await res.json()
    if (!json.success || json.data?.status !== 'ok') throw new Error('Unhealthy response')
  })

  // 2. Member Login
  await runStep('2. Auth Login (POST /api/v1/auth/login)', async () => {
    const res = await fetch(`${cleanBase}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'member@championsclub.in',
        password: 'Member@123',
      }),
    })
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const json = await res.json()
    if (!json.success || !json.data?.token) throw new Error('Missing login token')
    token = json.data.token
  })

  // 3. Query Courts Availability
  await runStep('3. Availability Engine (GET /api/v1/courts/availability)', async () => {
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
    const res = await fetch(`${cleanBase}/api/v1/courts/availability?date=${tomorrow}`)
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const json = await res.json()
    if (!json.success || !json.data?.courts || json.data.courts.length === 0) {
      throw new Error('No courts returned')
    }
    courtId = json.data.courts[0].courtId || json.data.courts[0].id || json.data.courts[0].court?.id
  })

  // 4. Create Court Booking
  await runStep('4. Create Booking (POST /api/v1/bookings)', async () => {
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
    const startAt = `${tomorrow}T10:00:00.000Z` // 15:30 IST, well within 06:00 - 21:00
    const res = await fetch(`${cleanBase}/api/v1/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        courtId,
        startAt,
        paymentMethod: 'pay_at_club',
      }),
    })
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const json = await res.json()
    if (!json.success || !json.data?.id) throw new Error('Booking failed')
    bookingId = json.data.id
  })

  // 5. Query Member Bookings
  await runStep('5. Member Bookings (GET /api/v1/bookings/mine)', async () => {
    const res = await fetch(`${cleanBase}/api/v1/bookings/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const json = await res.json()
    if (!json.success || !Array.isArray(json.data)) throw new Error('Failed to retrieve bookings')
  })

  // 6. Cancel Booking
  await runStep('6. Cancel Booking (PATCH /api/v1/bookings/:id/cancel)', async () => {
    const res = await fetch(`${cleanBase}/api/v1/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason: 'Smoke test verification complete' }),
    })
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const json = await res.json()
    if (!json.success || json.data?.status !== 'cancelled') throw new Error('Cancel failed')
  })

  console.log('\n------------------------------------------------------------------------')
  console.log('✨ ALL SMOKE TESTS PASSED SUCCESSFULLY! Exit code 0.')
  console.log('------------------------------------------------------------------------\n')

  if (server) server.close()
  process.exit(0)
}

runSmokeTests().catch((err) => {
  console.error('Smoke test crashed:', err)
  process.exit(1)
})
