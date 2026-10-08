/**
 * End-to-end smoke test against the live database.
 *
 *   npm run db:smoke
 *
 * Boots the real Express app, then exercises the write path: register a user
 * over HTTP, confirm the row landed in Postgres, then clean up after itself.
 */
import app from '../app.js'
import { pool } from '../config/postgres.js'
import { query, queryOne, toApiError } from '../utils/db.js'

const base = 'http://localhost:5099'
const stamp = Date.now()
const email = `smoke_${stamp}@example.com`
const password = 'smoke-test-pass-123'

let pass = 0
let fail = 0

const check = (ok, label, detail = '') => {
  if (ok) {
    pass += 1
    console.log(`  PASS  ${label}${detail ? `  ${detail}` : ''}`)
  } else {
    fail += 1
    console.log(`  FAIL  ${label}${detail ? `  ${detail}` : ''}`)
  }
}

async function main() {
  const server = app.listen(5099)

  try {
    // --- reachability -----------------------------------------------------
    const health = await fetch(`${base}/api/health`)
    check(health.status === 200, 'GET /api/health', `HTTP ${health.status}`)

    // --- write path: register --------------------------------------------
    const res = await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Smoke Test', email, password }),
    })
    const body = await res.json()
    check(res.status === 201, 'POST /api/auth/register', `HTTP ${res.status}`)
    check(Boolean(body?.data?.token), 'register returns a JWT')
    check(body?.data?.user?.email === email, 'register echoes the email')
    check(!('password_hash' in (body?.data?.user ?? {})), 'password_hash is not leaked')

    const token = body?.data?.token

    // --- the row really is in Postgres ------------------------------------
    const row = await queryOne('select id, email, role from public.users where email = $1', [email])
    check(Boolean(row), 'row exists in postgres', row ? `id=${row.id}` : 'not found')
    check(row?.role === 'member', 'default role applied', row?.role)

    // --- login round trip --------------------------------------------------
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    check(loginRes.status === 200, 'POST /api/auth/login', `HTTP ${loginRes.status}`)

    const setCookie = loginRes.headers.get('set-cookie') ?? ''
    check(/token=/.test(setCookie), 'login sets an httpOnly cookie')
    check(/HttpOnly/i.test(setCookie), 'cookie is HttpOnly')

    // --- wrong password is rejected ---------------------------------------
    const badLogin = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'wrong-password' }),
    })
    check(badLogin.status === 401, 'wrong password -> 401', `HTTP ${badLogin.status}`)

    // --- auth guard --------------------------------------------------------
    const noAuth = await fetch(`${base}/api/users`)
    check(noAuth.status === 401, 'protected route without token -> 401', `HTTP ${noAuth.status}`)

    const withAuth = await fetch(`${base}/api/users`, {
      headers: { authorization: `Bearer ${token}` },
    })
    // this user is not an admin, so list should be forbidden
    check(
      withAuth.status === 403,
      'non-admin listing users -> 403',
      `HTTP ${withAuth.status}`,
    )

    const me = await fetch(`${base}/api/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
    })
    const meBody = await me.json()
    check(me.status === 200 && meBody?.data?.email === email, 'GET /api/auth/me', `HTTP ${me.status}`)

    // --- validation --------------------------------------------------------
    const invalid = await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x', email: 'nope', password: '1' }),
    })
    check(invalid.status === 400, 'invalid register -> 400', `HTTP ${invalid.status}`)

    // --- unique constraint is surfaced as 409 ------------------------------
    const dupe = await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Smoke Test', email, password }),
    })
    check(dupe.status === 409, 'duplicate email -> 409', `HTTP ${dupe.status}`)

    // --- member codes come from the db -------------------------------------
    const code = await queryOne('select next_booking_no() as no')
    check(/^BK-\d{4}-\d{6}$/.test(code.no), 'next_booking_no format', code.no)
  } finally {
    // cleanup: remove the user this run created
    await query('delete from public.users where email = $1', [email]).catch(() => null)

    server.close()
    await pool.end()
  }

  console.log(`\n  ${pass} passed, ${fail} failed\n`)
  process.exit(fail ? 1 : 0)
}

main().catch(async (err) => {
  console.error('\nSmoke test crashed:', toApiError(err).message ?? err)
  await pool.end().catch(() => null)
  process.exit(1)
})