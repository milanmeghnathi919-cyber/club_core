import request from 'supertest'
import app from '../../src/app.js'
import seedCore from '../../src/db/seeds/seed.core.js'
import { format, addDays } from 'date-fns'

/**
 * PDF hard rules that every phase must keep green:
 *  - "each member can play at most twice a day" (per-plan limit; Gold = 4)
 *  - a member can never be in two places at once (BR-05 member overlap)
 *  - two people never share a court at the same time (covered by T-B1)
 */
describe('Booking Invariants — PDF hard rules', () => {
  let memberToken

  beforeAll(async () => {
    await seedCore()

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'member@championsclub.in',
        password: 'Member@123',
      })
    memberToken = loginRes.body.data.token
  })

  test('T-I1: Member cannot exceed the plan daily booking limit (Gold = 4/day)', async () => {
    const day = format(addDays(new Date(), 3), 'yyyy-MM-dd')
    const hours = ['10:00', '11:00', '12:00', '13:00']

    // 1-4: four 60-minute sessions must all succeed
    for (const hh of hours) {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          courtId: 'court-tennis-1',
          startAt: `${day}T${hh}:00.000Z`,
          paymentMethod: 'pay_at_club',
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
    }

    // 5th on the same day must be refused, not silently accepted
    const fifth = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        courtId: 'court-tennis-1',
        startAt: `${day}T14:00:00.000Z`,
        paymentMethod: 'pay_at_club',
      })

    expect(fifth.status).toBe(422)
    expect(fifth.body.success).toBe(false)
    expect(fifth.body.error.code).toBe('DAILY_LIMIT_REACHED')
  })

  test('T-I2: Member overlap on a different court at the same time is refused', async () => {
    const day = format(addDays(new Date(), 4), 'yyyy-MM-dd')
    const startAt = `${day}T10:00:00.000Z`

    const first = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        courtId: 'court-tennis-1',
        startAt,
        paymentMethod: 'pay_at_club',
      })
    expect(first.status).toBe(201)

    // Same member, same instant, different court → BR-05
    const clash = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        courtId: 'court-tennis-2',
        startAt,
        paymentMethod: 'pay_at_club',
      })

    expect(clash.status).toBe(409)
    expect(clash.body.success).toBe(false)
    expect(clash.body.error.code).toBe('MEMBER_OVERLAP')
  })
})
