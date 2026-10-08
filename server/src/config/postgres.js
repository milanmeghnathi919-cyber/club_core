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

/**
 * Hermetic test mode.
 *
 * Jest runs (NODE_ENV=test or JEST_WORKER_ID set) get a stub pool that rejects
 * instantly instead of opening sockets. Repositories already treat a failed
 * query as "fall back to the in-memory store", and the test seeds populate
 * that store, so every integration suite runs against the exact fixture state
 * its own beforeAll created — no leftover rows from earlier runs, no rows from
 * an unrelated dev database, and no keep-alive sockets leaking past teardown.
 *
 * Set DB_IN_TESTS=true to run the same suites against a real Postgres instead.
 */
const hermeticTests =
  process.env.DB_IN_TESTS !== 'true' &&
  (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined)

const disabledPool = () => {
  const reject = () => {
    const err = new Error(
      'Postgres disabled in hermetic test mode (set DB_IN_TESTS=true to use a real database)',
    )
    err.code = 'PG_DISABLED'
    return Promise.reject(err)
  }
  return {
    query: reject,
    connect: reject,
    end: () => Promise.resolve(),
    on: () => {},
  }
}

export const dbEnabled = !hermeticTests
export const pool = hermeticTests ? disabledPool() : new Pool(poolConfig)

if (dbEnabled) {
  // A pool-level error (e.g. the network drops) must not crash the process.
  pool.on('error', (err) => {
    console.error('[postgres] idle client error:', err.message)
  })
}

export default pool