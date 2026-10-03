import request from 'supertest'
import app from '../../src/app.js'
import seedCore from '../../src/db/seeds/seed.core.js'
import { toClubDate } from '../../src/utils/clubTime.js'
import { addDays, format } from 'date-fns'

describe('Bookings Integration Tests (BE1-08)', () => {
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

  test('T-B1: Books a court successfully and enforces slot collision (409)', async () => {
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
    const startAt = `${tomorrow}T10:00:00.000Z`

    // 1. First booking succeeds
    const res1 = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        courtId: 'court-tennis-1',
        startAt,
        paymentMethod: 'pay_at_club',
      })

    expect(res1.status).toBe(201)
    expect(res1.body.success).toBe(true)
    expect(res1.body.data.court_id).toBe('court-tennis-1')

    // 2. Second booking for the same slot must fail with 409 SLOT_TAKEN
    const res2 = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        courtId: 'court-tennis-1',
        startAt,
        paymentMethod: 'pay_at_club',
      })

    expect(res2.status).toBe(409)
    expect(res2.body.success).toBe(false)
    expect(res2.body.error.code).toBe('SLOT_TAKEN')
  })

  test('T-B3: Member can cancel booking and slot is released', async () => {
    const dayAfter = format(addDays(new Date(), 2), 'yyyy-MM-dd')
    const startAt = `${dayAfter}T14:00:00.000Z`

    const bkgRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        courtId: 'court-tennis-2',
        startAt,
        paymentMethod: 'pay_at_club',
      })

    expect(bkgRes.status).toBe(201)
    const bookingId = bkgRes.body.data.id

    const cancelRes = await request(app)
      .patch(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ reason: 'Schedule conflict' })

    expect(cancelRes.status).toBe(200)
    expect(cancelRes.body.success).toBe(true)
    expect(cancelRes.body.data.status).toBe('cancelled')
  })
})
