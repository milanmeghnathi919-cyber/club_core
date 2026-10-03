/**
 * Verifies every external connection the server depends on.
 *
 *   npm run db:check
 *
 * Placeholder values fail fast with a clear message so you know exactly which
 * env var still needs filling in.
 */
import config, { assertConfig } from '../config/index.js'
import { supabase } from '../config/supabase.js'
import cloudinary from '../config/cloudinary.js'
import nodemailer from 'nodemailer'
import { isRazorpayEnabled } from '../utils/razorpay.js'

const PLACEHOLDER = /^(YOUR-|PASTE_|replace-with|your-)/i

const looksLikePlaceholder = (value) => !value || PLACEHOLDER.test(value)

const line = (ok, label, detail = '') =>
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)

function checkSupabase() {
  const { supabaseUrl, supabaseServiceRoleKey } = config

  if (looksLikePlaceholder(supabaseUrl) || looksLikePlaceholder(supabaseServiceRoleKey)) {
    return line(false, 'supabase', 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY still placeholders')
  }

  // any trivial read proves the URL, key and network path all work
  return supabase
    .from('users')
    .select('id')
    .limit(1)
    .then(({ error }) => {
      if (error && !/does not exist|schema cache/i.test(error.message)) {
        return line(false, 'supabase', error.message)
      }
      line(true, 'supabase', `connected (${supabaseUrl})`)
      if (error) console.log('        note: users table not found yet — run npm run db:migrate')
    })
    .catch((err) => line(false, 'supabase', err.message))
}

function checkCloudinary() {
  const { cloudName, apiKey, apiSecret } = config.cloudinary

  if (looksLikePlaceholder(cloudName) || looksLikePlaceholder(apiKey) || looksLikePlaceholder(apiSecret)) {
    return line(false, 'cloudinary', 'CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET still placeholders')
  }

  // ping is authenticated and does not leave an uploaded asset behind
  return cloudinary.api
    .ping()
    .then((res) => line(res?.status === 'ok', 'cloudinary', `cloud: ${cloudName}`))
    .catch((err) => line(false, 'cloudinary', err.message))
}

function checkSmtp() {
  const { host } = config.smtp

  if (!host) {
    return line(true, 'smtp', 'not configured — email sends are skipped')
  }

  const tx = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  })

  return tx
    .verify()
    .then(() => line(true, 'smtp', `${host}:${config.smtp.port}`))
    .catch((err) => line(false, 'smtp', err.message))
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

  await checkSupabase()
  await checkCloudinary()
  await checkSmtp()
  checkRazorpay()

  console.log('\nRun `npm run dev` to exercise uploads and payments end to end.\n')
}

main().catch((err) => {
  console.error('Check failed:', err.message)
  process.exit(1)
})