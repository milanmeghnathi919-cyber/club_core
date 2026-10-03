/**
 * Live connection test for the direct Postgres connection.
 *
 *   npm run db:test
 *
 * This actually authenticates: it runs `select 1`, so a PASS proves the
 * host, port, user and password all work together. It also reports whether
 * the schema has been applied yet.
 */
import config, { assertConfig } from '../config/index.js'
import { pool } from '../config/postgres.js'
import { query, queryOne } from '../utils/db.js'

const PLACEHOLDER = /^(YOUR-|PASTE_|replace-with|your-)/i
const isPlaceholder = (value = '') => !value || PLACEHOLDER.test(value)

const ok = (label, detail = '') => console.log(`  PASS  ${label}${detail ? `  ${detail}` : ''}`)
const bad = (label, detail = '') => console.log(`  FAIL  ${label}${detail ? `  ${detail}` : ''}`)
const note = (msg) => console.log(`        ${msg}`)

async function testAuth() {
  const { host, port, name, user, password } = config.db

  if (isPlaceholder(host) || isPlaceholder(user) || isPlaceholder(password)) {
    bad('postgres auth', 'DB_HOST / DB_USER / DB_PASSWORD contain placeholders')
    return false
  }

  const started = Date.now()
  try {
    const row = await queryOne('select current_database() as db, current_user as usr, version() as v')
    const ms = Date.now() - started
    ok('postgres auth', `connected to "${row.db}" as ${row.usr} in ${ms}ms`)
    note(row.v.split(' ').slice(0, 2).join(' '))
    return true
  } catch (err) {
    bad('postgres auth', err.message)
    note(`host=${host}:${port} db=${name} user=${user}`)
    if (err.code === '28P01') note('28P01 = password authentication failed — check DB_PASSWORD')
    if (err.code === '28000') note('28000 = user is not authorised on this database')
    if (err.code === '42501') note('42501 = insufficient privileges')
    return false
  }
}

async function testSchema() {
  const rows = await query(
    `select table_name from information_schema.tables
      where table_schema = 'public' and table_type = 'BASE TABLE'
      order by table_name`,
  )
  const names = rows.map((r) => r.table_name)

  if (!names.length) {
    bad('schema', 'no tables in public schema')
    note('run: npm run db:migrate')
    return
  }

  ok('schema', `${names.length} tables present`)
  note(names.slice(0, 8).join(', ') + (names.length > 8 ? ', ...' : ''))
}

async function testSequences() {
  try {
    const row = await queryOne(`select next_booking_no() as no`)
    ok('doc numbers', `next_booking_no() -> ${row.no}`)
  } catch {
    note('document-number functions missing — run: npm run db:migrate')
  }
}

async function main() {
  console.log('\nPostgres connection test\n')

  try {
    assertConfig()
  } catch (err) {
    bad('config', err.message)
    await pool.end()
    process.exit(1)
  }

  console.log(`  env ${config.env}   ssl ${config.db.ssl}\n`)

  const connected = await testAuth()
  if (connected) {
    await testSchema()
    await testSequences()
  }

  await pool.end()
  console.log('')
}

main().catch(async (err) => {
  console.error('Test failed:', err.message)
  await pool.end().catch(() => null)
  process.exit(1)
})