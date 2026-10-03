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
  max: config.db.poolMax,
  idleTimeoutMillis: 30_000,
  // remote Postgres over the open internet is occasionally slow to handshake;
  // 30s is safe for Supabase direct connection
  connectionTimeoutMillis: 30_000,
  query_timeout: 30_000,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : undefined,
}

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL
} else {
  poolConfig.host = config.db.host
  poolConfig.port = config.db.port
  poolConfig.database = config.db.name
  poolConfig.user = config.db.user
  poolConfig.password = config.db.password
}

export const pool = new Pool(poolConfig)

// A pool-level error (e.g. the network drops) must not crash the process.
pool.on('error', (err) => {
  console.error('[postgres] idle client error:', err.message)
})

export default pool