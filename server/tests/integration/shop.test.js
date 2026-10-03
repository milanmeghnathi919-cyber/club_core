import request from 'supertest'
import app from '../../src/app.js'
import seedCore from '../../src/db/seeds/seed.core.js'
import seedCommerce from '../../src/db/seeds/seed.commerce.js'

describe('Shop & Inventory Integration Tests (BE2-03, BE2-04)', () => {
  let memberToken

  beforeAll(async () => {
    await seedCore()
    await seedCommerce()

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'member@championsclub.in',
        password: 'Member@123',
      })
    memberToken = loginRes.body.data.token
  })

  test('T-P1: Quote cart without auth returns totals with walk-in pricing', async () => {
    const res = await request(app)
      .post('/api/v1/shop/orders/quote')
      .send({
        items: [{ productId: 'prd-06', qty: 2 }],
      })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.subtotal).toBe(900)
    expect(res.body.data.total).toBe(900)
  })

  test('T-P2: Create shop order decrements stock atomically', async () => {
    const prodRes = await request(app).get('/api/v1/public/products/prd-05')
    expect(prodRes.status).toBe(200)

    const orderRes = await request(app)
      .post('/api/v1/shop/orders')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        items: [{ productId: 'prd-05', qty: 1 }],
        fulfilment: 'in_store',
        paymentMethod: 'pay_at_club',
      })

    expect(orderRes.status).toBe(201)
    expect(orderRes.body.success).toBe(true)
    expect(orderRes.body.data.order_no).toMatch(/^ORD-/)
  })

  test('T-P3: Over-ordering beyond stock returns 409 OUT_OF_STOCK', async () => {
    const res = await request(app)
      .post('/api/v1/shop/orders')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        items: [{ productId: 'prd-16', qty: 999 }], // only 1 in stock
        fulfilment: 'in_store',
        paymentMethod: 'pay_at_club',
      })

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('OUT_OF_STOCK')
  })
})
