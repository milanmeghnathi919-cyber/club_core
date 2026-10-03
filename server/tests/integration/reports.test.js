import request from 'supertest'
import app from '../../src/app.js'
import seedCore from '../../src/db/seeds/seed.core.js'
import seedCommerce from '../../src/db/seeds/seed.commerce.js'

describe('Reports & Analytics Integration Tests (BE1-13, BE2-11)', () => {
  let ownerToken
  let frontDeskToken

  beforeAll(async () => {
    await seedCore()
    await seedCommerce()

    const ownerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'owner@championsclub.in',
        password: 'Admin@123',
      })
    ownerToken = ownerLogin.body.data.token

    const fdLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'frontdesk@championsclub.in',
        password: 'Staff@123',
      })
    frontDeskToken = fdLogin.body.data.token
  })

  test('T-D1: Owner can fetch dashboard analytics with KPI figures and revenue', async () => {
    const res = await request(app)
      .get('/api/v1/reports/dashboard?range=month')
      .set('Authorization', `Bearer ${ownerToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.revenue).toBeDefined()
    expect(res.body.data.revenue.total).toBeGreaterThan(0)
    expect(res.body.data.bookings).toBeDefined()
    expect(res.body.data.members).toBeDefined()
    expect(res.body.data.alerts).toBeDefined()
  })

  test('T-D2: Owner can fetch tax report with output tax and net payable', async () => {
    const res = await request(app)
      .get('/api/v1/reports/tax')
      .set('Authorization', `Bearer ${ownerToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.outputTax).toBeDefined()
    expect(res.body.data.netPayable).toBeDefined()
  })

  test('T-D3: Front desk calling /reports/revenue is forbidden (owner only)', async () => {
    const res = await request(app)
      .get('/api/v1/reports/revenue')
      .set('Authorization', `Bearer ${frontDeskToken}`)

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })
})
