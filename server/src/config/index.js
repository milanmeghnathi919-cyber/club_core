import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')

dotenv.config({ path: path.join(rootDir, '.env') })

const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
]

const optionalNumber = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback)

const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: optionalNumber(process.env.PORT, 5000),

  // Supabase (service role key bypasses RLS, keep it server-side only)
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,

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

  // Mail (nodemailer)
  smtp: {
    host: process.env.SMTP_HOST,
    port: optionalNumber(process.env.SMTP_PORT, 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM ?? 'no-reply@example.com',
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
    throw new Error(
      `Missing required env vars: ${missing.join(', ')}\n` +
        `Copy .env.example to .env and fill them in.`,
    )
  }
}

export default config