/**
 * Verifies every external connection the server depends on.
 *
 *   npm run db:check
 */
import config, { assertConfig } from '../config/index.js'
import { pool } from '../config/postgres.js'
import { queryOne, query } from '../utils/db.js'
import cloudinary from '../config/cloudinary.js'
import { isMailConfigured, verifyMail } from '../utils/mailer.js'
import { isRazorpayEnabled } from '../utils/razorpay.js'

const PLACEHOLDER = /^(YOUR-|PASTE_|replace-with|your-)/i
const looksLikePlaceholder = (value) => !value || PLACEHOLDER.test(value)

const line = (ok, label, detail = '') =>
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)

async function checkPostgres() {
  const { host, user, password, port } = config.db

  if (looksLikePlaceholder(host) || looksLikePlaceholder(user) || looksLikePlaceholder(password)) {
    return line(false, 'postgres', 'DB_HOST / DB_USER / DB_PASSWORD contain placeholders')
  }

  try {
    const row = await queryOne('select current_database() as db, current_user as usr')
    line(true, 'postgres', `${row.db} as ${row.usr} via ${host}:${port}`)
  } catch (err) {
    line(false, 'postgres', err.message)
  }
}

function checkCloudinary() {
  const { cloudName, apiKey, apiSecret } = config.cloudinary

  if (looksLikePlaceholder(cloudName) || looksLikePlaceholder(apiKey) || looksLikePlaceholder(apiSecret)) {
    return line(false, 'cloudinary', 'CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET still placeholders')
  }

  // ping is authenticated and leaves no uploaded asset behind
  return cloudinary.api
    .ping()
    .then((res) => line(res?.status === 'ok', 'cloudinary', `cloud: ${cloudName}`))
    .catch((err) => line(false, 'cloudinary', err.message))
}

function checkMail() {
  if (!isMailConfigured()) {
    line(false, 'email', 'EMAIL_USER / EMAIL_PASS still placeholders')
    console.log('        app password: https://myaccount.google.com/apppasswords')
    return Promise.resolve()
  }

  return verifyMail()
    .then(() => line(true, 'email', `${config.mail.user} via ${config.mail.host}:${config.mail.port}`))
    .catch((err) => line(false, 'email', err.message))
}

async function checkRoles() {
  const rows = await query('select role, count(*)::int from public.users group by role order by role')
  const counts = rows.map((r) => `${r.role}=${r.count}`).join(', ')
  line(true, 'roles', counts || 'no users yet')
}

function checkRazorpay() {
  if (!isRazorpayEnabled()) {
    return line(true, 'razorpay', 'not configured — payment routes will reject')
  }
  line(true, 'razorpay', `key id ${config.razorpay.keyId}`)
}

async function main() {
  console.log('\nConnection check\n')

  try {
    assertConfig()
  } catch (err) {
    console.log(`  FAIL  config: ${err.message}\n`)
    process.exit(1)
  }

  console.log(`  env: ${config.env}  port: ${config.port}\n`)

  await checkPostgres()
  await checkCloudinary()
  await checkMail()
  checkRazorpay()
  await checkRoles()

  await pool.end()
  console.log('')
}

main().catch(async (err) => {
  console.error('Check failed:', err.message)
  await pool.end().catch(() => null)
  process.exit(1)
})