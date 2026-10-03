import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')

dotenv.config({ path: path.join(rootDir, '.env') })

const required = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
]

const optionalNumber = (value, fallback) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback

const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: optionalNumber(process.env.PORT, 5000),

  // Direct Postgres connection (Supabase direct connection)
  db: {
    host: process.env.DB_HOST ?? 'db.rcfyaquqdrvlwyvfshow.supabase.co',
    port: optionalNumber(process.env.DB_PORT, 5432),
    name: process.env.DB_NAME ?? 'postgres',
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'club_core@123',
    poolMax: optionalNumber(process.env.DB_POOL_MAX, 10),
    // Supabase remote connections are always TLS; disable only for a local socket
    ssl: process.env.DB_SSL === 'true' || process.env.DB_SSL !== 'false',
  },

  // Auth
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  cookieSecure: process.env.NODE_ENV === 'production',

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER ?? 'clubhouse',
  },

  // Uploads
  upload: {
    maxFileSizeBytes: optionalNumber(process.env.UPLOAD_MAX_MB, 5) * 1024 * 1024,
    allowedMimeTypes: (process.env.UPLOAD_ALLOWED_TYPES ??
      'image/jpeg,image/png,image/webp,image/avif').split(','),
  },

  // Email OTP verification via Google Pass Key
  // Only EMAIL_USER and EMAIL_PASS are needed in .env
  mail: {
    user: process.env.EMAIL_USER || process.env.email_user || process.env.EMAL_USER,
    pass: process.env.EMAIL_PASS || process.env.email_pass,
    from:
      process.env.EMAIL_USER || process.env.email_user || process.env.EMAL_USER
        ? `The Champions Club <${process.env.EMAIL_USER || process.env.email_user || process.env.EMAL_USER}>`
        : 'The Champions Club <noreply@thechampionsclub.com>',
    codeTtlMinutes: 10,
    maxPerHour: 5,
  },

  // Razorpay
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },

  clientOrigin: process.env.CLIENT_ORIGIN ?? process.env.CLIENT_URL ?? 'http://localhost:5173',
}

export function assertConfig() {
  const missing = required.filter((key) => !process.env[key])
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}\nCopy .env.example to .env and fill them in.`)
  }
}

/**
 * Mail is checked separately and lazily, so a missing EMAIL_USER/EMAIL_PASS
 * never blocks migrations or health checks — it only fails when an email is
 * actually due to go out.
 */
export function assertMailConfig() {
  const user = process.env.EMAIL_USER || process.env.email_user || process.env.EMAL_USER
  const pass = process.env.EMAIL_PASS || process.env.email_pass
  const missing = []
  if (!user) missing.push('EMAIL_USER')
  if (!pass) missing.push('EMAIL_PASS')
  if (missing.length) {
    throw new Error(`Mail is not configured: ${missing.join(', ')} missing. Add EMAIL_USER and EMAIL_PASS to .env`)
  }
}

export default config