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
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
]

const optionalNumber = (value, fallback) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback

const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: optionalNumber(process.env.PORT, 5000),

  // Direct Postgres connection (Connect > Direct connection)
  db: {
    host: process.env.DB_HOST,
    port: optionalNumber(process.env.DB_PORT, 5432),
    name: process.env.DB_NAME ?? 'postgres',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    poolMax: optionalNumber(process.env.DB_POOL_MAX, 10),
    // Supabase remote connections are always TLS; disable only for a local socket
    ssl: process.env.DB_SSL !== 'false',
  },

  // Auth
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
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

  // Mail (nodemailer over Google SMTP)
  // EMAIL_USER is the Google account, EMAIL_PASS is a 16-char App Password
  // (not the account password). Generate at myaccount.google.com > Security > App passwords.
  mail: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port: optionalNumber(process.env.MAIL_PORT, 587),
    secure: process.env.MAIL_SECURE === 'true',
    from: process.env.MAIL_FROM ?? process.env.EMAIL_USER,
    codeTtlMinutes: optionalNumber(process.env.EMAIL_CODE_TTL_MINUTES, 10),
    maxPerHour: optionalNumber(process.env.EMAIL_MAX_PER_HOUR, 5),
  },

  // Razorpay
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },

  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
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
  const missing = ['EMAIL_USER', 'EMAIL_PASS'].filter((key) => !process.env[key])
  if (missing.length) {
    throw new Error(`Mail is not configured: ${missing.join(', ')} missing`)
  }
}

export default config