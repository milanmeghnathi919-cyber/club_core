import { Pool } from 'pg'
import config from './index.js'

/**
 * Direct Postgres connection pool.
 *
 * Connects over TCP to DB_HOST:DB_PORT as DB_USER, exactly as configured in
 * .env. Supabase requires SSL for remote connections; rejectUnauthorized is
 * off because Supabase's cert for *.supabase.co is not in Node's default trust store.
 */
const poolConfig = {
  max: Math.min(Number(config.db.poolMax) || 5, 5),
  idleTimeoutMillis: 10_000,
  // remote Postgres over the open internet is occasionally slow to handshake;
  // 15s is safe for Supabase direct connection
  connectionTimeoutMillis: 15_000,
  query_timeout: 15_000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : undefined,
}

let host = config.db.host
let user = config.db.user
let port = config.db.port

// Automatically adapt IPv6-only Supabase direct connection host to the working IPv4 pooler
if (host && host.includes('rcfyaquqdrvlwyvfshow.supabase.co')) {
  host = 'aws-0-ap-southeast-1.pooler.supabase.com'
  if (user === 'postgres' || !user.includes('.')) {
    user = 'postgres.rcfyaquqdrvlwyvfshow'
  }
} else if (host && host.startsWith('db.') && host.endsWith('.supabase.co')) {
  const match = host.match(/^db\.([^.]+)\.supabase\.co$/)
  if (match) {
    const ref = match[1]
    host = 'aws-0-ap-southeast-1.pooler.supabase.com'
    if (user === 'postgres' || !user.includes('.')) {
      user = `postgres.${ref}`
    }
  }
}

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL
} else {
  poolConfig.host = host
  poolConfig.port = port
  poolConfig.database = config.db.name
  poolConfig.user = user
  poolConfig.password = config.db.password
}

export const pool = new Pool(poolConfig)

// A pool-level error (e.g. the network drops) must not crash the process.
pool.on('error', (err) => {
  console.error('[postgres] idle client error:', err.message)
})

export default pool