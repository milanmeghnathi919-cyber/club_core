import request from 'supertest'
import app from '../../src/app.js'
import seedCore from '../../src/db/seeds/seed.core.js'

describe('Auth Integration Tests (BE1-03)', () => {
  beforeAll(async () => {
    await seedCore()
  })

  test('T-A1: Login valid credentials returns user and sets cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'member@championsclub.in',
        password: 'Member@123',
      })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.user).toBeDefined()
    expect(res.body.data.user.role).toBe('member')

    const cookies = res.headers['set-cookie']
    expect(cookies).toBeDefined()
    expect(cookies.some((c) => c.includes('cc_token='))).toBe(true)
  })

  test('T-A1: Login with invalid password returns 401 UNAUTHENTICATED', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'member@championsclub.in',
        password: 'WrongPassword!',
      })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS')
  })

  test('T-A2: Access protected route without cookie returns 401 UNAUTHENTICATED', async () => {
    const res = await request(app).get('/api/v1/auth/me')
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('UNAUTHENTICATED')
  })

  test('T-V2: Register ignores mass-assigned role and defaults to member', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Hacker Attempt',
        email: 'hacker@example.com',
        phone: '+919876599999',
        password: 'Password@123',
        role: 'owner', // Should be ignored
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.user.role).toBe('member')
  })

  test('T-A3: GET /auth/me returns member profile and active membership', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'member@championsclub.in',
        password: 'Member@123',
      })

    const token = loginRes.body.data.token

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(meRes.status).toBe(200)
    expect(meRes.body.success).toBe(true)
    expect(meRes.body.data.user.email).toBe('member@championsclub.in')
    expect(meRes.body.data.member).toBeDefined()
    expect(meRes.body.data.membership).toBeDefined()
    expect(meRes.body.data.membership.plan).toBeDefined()
  })
})
