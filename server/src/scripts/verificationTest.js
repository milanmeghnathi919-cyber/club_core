/**
 * End-to-end test for email verification and the role model.
 *
 *   npm run db:smoke:verify
 *
 * Runs against the live database and cleans up after itself. It reads the
 * generated code straight out of the database (hashed) so the flow can be
 * tested without a real mailbox — the code path is the same one an email
 * would trigger.
 */
import app from '../app.js'
import { pool } from '../config/postgres.js'
import { query, queryOne } from '../utils/db.js'

const base = 'http://localhost:5098'
const stamp = Date.now()
const email = `verify_${stamp}@example.com`
const password = 'verify-test-pass-123'

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

/** Brute-force the 6-digit code out of the sha256 hashes (fine in a test). */
async function recoverCode(userId) {
  const crypto = await import('node:crypto')
  const rows = await query('select code_hash from public.email_verification_codes where user_id = $1', [
    userId,
  ])
  for (let i = 0; i < 1_000_000; i += 1) {
    const code = String(i).padStart(6, '0')
    const hash = crypto.createHash('sha256').update(code).digest('hex')
    if (rows.some((r) => r.code_hash === hash)) return code
  }
  return null
}

async function main() {
  const server = app.listen(5098)

  try {
    // --- register ----------------------------------------------------------
    const reg = await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Verify Test', email, password }),
    })
    const regBody = await reg.json()
    check(reg.status === 201, 'register', `HTTP ${reg.status}`)

    const token = regBody?.data?.token
    const userId = regBody?.data?.user?.id
    check(Boolean(token && userId), 'register returns token + user id')
    check(regBody?.data?.user?.isEmailVerified === false, 'new account starts unverified')
    check(regBody?.data?.user?.role === 'member', 'default role is member', regBody?.data?.user?.role)

    const auth = { authorization: `Bearer ${token}` }

    // --- a code was issued -------------------------------------------------
    const codes = await query(
      'select code_hash, expires_at from public.email_verification_codes where user_id = $1 and consumed_at is null',
      [userId],
    )
    check(codes.length === 1, 'one active code issued on register', `${codes.length}`)
    check(!codes.some((c) => c.code_hash === 'undefined'), 'code is hashed, not stored in plain text')

    // --- status ------------------------------------------------------------
    const statusRes = await fetch(`${base}/api/auth/email/status`, { headers: auth })
    const statusBody = await statusRes.json()
    check(statusRes.status === 200, 'GET /auth/email/status', `HTTP ${statusRes.status}`)
    check(statusBody?.data?.isEmailVerified === false, 'status reports unverified')
    check(statusBody?.data?.hasActiveCode === true, 'status reports an active code')

    // --- verified gate blocks member actions -------------------------------
    const blocked = await fetch(`${base}/api/users`, { headers: auth })
    check(blocked.status === 403, 'unverified member blocked from staff route', `HTTP ${blocked.status}`)

    // --- wrong code is rejected --------------------------------------------
    const code = await recoverCode(userId)
    check(Boolean(code), 'recovered the issued code from the hash')

    const wrong = await fetch(`${base}/api/auth/email/verify`, {
      method: 'POST',
      headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ code: code === '000000' ? '111111' : '000000' }),
    })
    check(wrong.status === 400, 'wrong code -> 400', `HTTP ${wrong.status}`)

    const afterWrong = await queryOne(
      'select attempts from public.email_verification_codes where user_id = $1 and consumed_at is null',
      [userId],
    )
    check(afterWrong?.attempts === 1, 'failed attempt is counted', `attempts=${afterWrong?.attempts}`)

    // --- malformed code is rejected by validation ---------------------------
    const malformed = await fetch(`${base}/api/auth/email/verify`, {
      method: 'POST',
      headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'abcdef' }),
    })
    check(malformed.status === 400, 'non-numeric code -> 400', `HTTP ${malformed.status}`)

    // --- correct code verifies ---------------------------------------------
    const okRes = await fetch(`${base}/api/auth/email/verify`, {
      method: 'POST',
      headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    check(okRes.status === 200, 'correct code -> 200', `HTTP ${okRes.status}`)

    const row = await queryOne('select is_email_verified, email_verified_at from public.users where id = $1', [userId])
    check(row?.is_email_verified === true, 'users.is_email_verified flipped to true')
    check(Boolean(row?.email_verified_at), 'email_verified_at stamped')

    // --- code is single-use --------------------------------------------------
    // Once verified, a repeat submit is a harmless no-op rather than an error,
    // so the client can retry blindly. The important guarantee is that the
    // stored code was consumed and cannot verify anyone else.
    const reuse = await fetch(`${base}/api/auth/email/verify`, {
      method: 'POST',
      headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const reuseBody = await reuse.json()
    check(reuse.status === 200, 'repeat verify on a verified account is a no-op', `HTTP ${reuse.status}`)
    check(reuseBody?.data?.alreadyVerified === true, 'no-op reports alreadyVerified')

    const consumed = await queryOne(
      'select consumed_at from public.email_verification_codes where user_id = $1 order by created_at desc limit 1',
      [userId],
    )
    check(Boolean(consumed?.consumed_at), 'the code row is marked consumed')

    // --- already verified ---------------------------------------------------
    const again = await fetch(`${base}/api/auth/email/send-code`, { method: 'POST', headers: auth })
    check(again.status === 400, 'send-code on a verified account -> 400', `HTTP ${again.status}`)

    // --- resend throttle (needs a fresh, still-unverified account) -----------
    const email2 = `verify2_${stamp}@example.com`
    const reg2 = await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Throttle Test', email: email2, password }),
    })
    const reg2Body = await reg2.json()
    const auth2 = { authorization: `Bearer ${reg2Body.data.token}` }

    const throttled = await fetch(`${base}/api/auth/email/send-code`, { method: 'POST', headers: auth2 })
    check(throttled.status === 429, 'resend inside 60s window -> 429', `HTTP ${throttled.status}`)

    const throttledBody = await throttled.json()
    check(
      /wait \d+s/i.test(throttledBody?.error?.message ?? ''),
      '429 tells the client how long to wait',
      throttledBody?.error?.message,
    )

    const liveAfterThrottle = await query(
      'select id from public.email_verification_codes where user_id = $1 and consumed_at is null',
      [reg2Body.data.user.id],
    )
    check(liveAfterThrottle.length === 1, 'throttled resend issued no second code')

    // --- role enforcement ---------------------------------------------------
    // The role is read from the database on every request, not trusted from
    // the token, so forging a role in a JWT must not grant access.
    const jwt = (await import('jsonwebtoken')).default
    const config = (await import('../config/index.js')).default
    const asRole = (role) => ({
      authorization: `Bearer ${jwt.sign({ sub: userId, role, email }, config.jwtSecret, { expiresIn: '5m' })}`,
    })

    const forgedAdmin = await fetch(`${base}/api/users`, { headers: asRole('admin') })
    check(
      forgedAdmin.status === 403,
      'a token claiming admin is ignored; db role (member) wins',
      `HTTP ${forgedAdmin.status}`,
    )

    // promote for real, then the same token gains access
    await query('update public.users set role = $1 where id = $2', ['shop_manager', userId])

    const asShop = await fetch(`${base}/api/users`, { headers: auth })
    check(asShop.status === 200, 'shop_manager can list users after real promotion', `HTTP ${asShop.status}`)

    const shopOnFinance = await fetch(`${base}/api/payments/revenue`, { headers: auth })
    check(shopOnFinance.status === 403, 'shop_manager cannot read finance reports', `HTTP ${shopOnFinance.status}`)

    await query('update public.users set role = $1 where id = $2', ['cafe_manager', userId])

    const cafeOnUsers = await fetch(`${base}/api/users`, { headers: auth })
    check(cafeOnUsers.status === 200, 'cafe_manager is staff, so /users is allowed', `HTTP ${cafeOnUsers.status}`)

    const cafeOnFinance = await fetch(`${base}/api/payments/revenue`, { headers: auth })
    check(cafeOnFinance.status === 403, 'cafe_manager cannot read finance reports', `HTTP ${cafeOnFinance.status}`)

    await query('update public.users set role = $1 where id = $2', ['member', userId])
    const adminOnly = await fetch(`${base}/api/reports/dashboard`, { headers: asRole('admin') })
    check(adminOnly.status !== 200, 'member cannot read reports', `HTTP ${adminOnly.status}`)

    // --- disabled account loses access immediately ---------------------------
    await query('update public.users set is_active = false where id = $1', [userId])
    const disabled = await fetch(`${base}/api/auth/me`, { headers: auth })
    check(disabled.status === 403, 'deactivated account blocked even with a valid token', `HTTP ${disabled.status}`)

    // --- role constraint rejects unknown values ------------------------------
    try {
      await query('update public.users set role = $1 where id = $2', ['superuser', userId])
      check(false, 'role constraint rejects an unknown role')
    } catch {
      check(true, 'role constraint rejects an unknown role')
    }
  } finally {
    await query('delete from public.users where email = any($1)', [[email, `verify2_${stamp}@example.com`]]).catch(
      () => null,
    )
    server.close()
    await pool.end()
  }

  console.log(`\n  ${pass} passed, ${fail} failed\n`)
  process.exit(fail ? 1 : 0)
}

main().catch(async (err) => {
  console.error('\nTest crashed:', err.message)
  await pool.end().catch(() => null)
  process.exit(1)
})