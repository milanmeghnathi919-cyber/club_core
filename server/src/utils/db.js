import { pool } from '../config/postgres.js'
import ApiError from './ApiError.js'

/**
 * Escape hatch: a value is inlined into SQL, a string is quoted.
 *
 * Using this everywhere instead of building SQL by concatenation lets
 * repositories stay readable while still being injection-safe, because every
 * dynamic value passes through quote() here.
 */
export const quote = (value) => {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new ApiError(400, 'Invalid numeric value')
    return String(value)
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) return value.map(quote).join(', ')
  if (value instanceof Date) return quote(value.toISOString())
  return `'${String(value).replace(/'/g, "''")}'`
}

/** Alias that reads better in query strings. */
export const t = quote

const PG_ERRORS = {
  '23505': (err) => ApiError.conflict(detailOf(err) ?? 'Record already exists'),
  '23503': (err) => ApiError.badRequest(detailOf(err) ?? 'Referenced record does not exist'),
  '23502': (err) => ApiError.badRequest(detailOf(err) ?? 'Required field is missing'),
  '23514': (err) => ApiError.badRequest(detailOf(err) ?? 'Value failed a constraint check'),
  '22P02': (err) => ApiError.badRequest(detailOf(err) ?? 'Invalid input syntax'),
  '22001': (err) => ApiError.badRequest('Value too long for this column'),
  '57014': () => ApiError.badRequest('Query cancelled'),
}

const detailOf = (err) => err.detail ?? err.message

/** Translate a driver error into an ApiError with the right status. */
export const toApiError = (err) => {
  if (err instanceof ApiError) return err

  const mapped = PG_ERRORS[err.code]?.(err)
  if (mapped) return mapped

  // connection failures are operational, not bugs
  if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EHOSTUNREACH', 'ECONNRESET'].includes(err.code)) {
    return new ApiError(503, `Database unreachable: ${err.code}`)
  }

  return err
}

/**
 * Run a query and return rows. Postgres error codes become ApiError.
 *
 *   const rows = await query('select * from users where email = $1', [email])
 */
export const query = async (text, params = []) => {
  try {
    const result = await pool.query(text, params)
    return result.rows
  } catch (err) {
    if (['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', '57P01'].includes(err.code)) {
      try {
        const retry = await pool.query(text, params)
        return retry.rows
      } catch (retryErr) {
        throw toApiError(retryErr)
      }
    }
    throw toApiError(err)
  }
}

/** First row or null. */
export const queryOne = async (text, params = []) => {
  const rows = await query(text, params)
  return rows[0] ?? null
}

/**
 * Run work inside a transaction. Rolls back on any throw and always releases
 * the client back to the pool.
 *
 *   await transaction(async (tx) => {
 *     await tx.query('insert ...')
 *     await tx.query('update ...')
 *   })
 *
 * `tx` is the raw pg client, so `tx.query` is a normal call and rows come
 * back as `{ rows }`.
 */
export const transaction = async (work) => {
  const client = await pool.connect()

  try {
    await client.query('begin')
    const result = await work(client)
    await client.query('commit')
    return result
  } catch (err) {
    await client.query('rollback').catch(() => null)
    throw toApiError(err)
  } finally {
    client.release()
  }
}

export const healthCheck = async () => {
  const row = await queryOne('select current_database() as database, version() as version')
  return row
}

export default { query, queryOne, transaction, quote, t, healthCheck }