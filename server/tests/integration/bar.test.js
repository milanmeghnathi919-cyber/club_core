import request from 'supertest'
import app from '../../src/app.js'
import seedCore from '../../src/db/seeds/seed.core.js'
import seedCommerce from '../../src/db/seeds/seed.commerce.js'

describe('Bar & Kitchen Integration Tests (BE2-06)', () => {
  let staffToken

  beforeAll(async () => {
    await seedCore()
    await seedCommerce()

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'bar@championsclub.in',
        password: 'Staff@123',
      })
    staffToken = loginRes.body.data.token
  })

  test('T-X1: Opens a bar tab and adds menu items with live totals', async () => {
    const openRes = await request(app)
      .post('/api/v1/bar/tabs')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        tableId: 'tbl-01',
        guestName: 'Walk-in Guest',
      })

    expect(openRes.status).toBe(201)
    expect(openRes.body.success).toBe(true)
    const tabId = openRes.body.data.id

    // Adding items
    const itemRes = await request(app)
      .post(`/api/v1/bar/tabs/${tabId}/items`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        items: [{ menuItemId: 'mnu-01', qty: 1 }], // Pizza 380
      })

    expect(itemRes.status).toBe(200)
    expect(itemRes.body.success).toBe(true)
    expect(itemRes.body.data.subtotal).toBe(380)
    expect(itemRes.body.data.total).toBe(380)
  })

  test('T-X2: Opening a second tab on occupied table returns 409 TABLE_OCCUPIED', async () => {
    const res = await request(app)
      .post('/api/v1/bar/tabs')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        tableId: 'tbl-01',
        guestName: 'Another Guest',
      })

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('TABLE_OCCUPIED')
  })

  test('T-X3: Settling tab frees table and records payment', async () => {
    const tabsRes = await request(app)
      .get('/api/v1/bar/tabs?status=open')
      .set('Authorization', `Bearer ${staffToken}`)

    const tab = tabsRes.body.data[0]
    expect(tab).toBeDefined()

    const settleRes = await request(app)
      .post(`/api/v1/bar/tabs/${tab.id}/settle`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        payments: [{ method: 'cash', amount: tab.total }],
      })

    expect(settleRes.status).toBe(200)
    expect(settleRes.body.success).toBe(true)
    expect(settleRes.body.data.status).toBe('settled')
  })
})
