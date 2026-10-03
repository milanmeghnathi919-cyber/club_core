/**
 * Applies the SQL files in src/db/migrations over the direct Postgres
 * connection, in filename order, recording what ran in a schema_migrations
 * table so nothing is applied twice.
 *
 *   npm run db:migrate                apply everything pending
 *   npm run db:migrate -- --status    list applied vs pending, change nothing
 *   npm run db:migrate -- --reset     clear the ledger and re-apply
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from '../config/postgres.js'
import config, { assertConfig } from '../config/index.js'

const MIGRATIONS_DIR = path.dirname(fileURLToPath(import.meta.url)) + '/migrations'

const LEDGER_SQL = `
create table if not exists public.schema_migrations (
  filename    text primary key,
  applied_at  timestamptz not null default now()
);`

const listFiles = async () => {
  const entries = await readdir(MIGRATIONS_DIR)
  return entries.filter((f) => f.endsWith('.sql')).sort()
}

async function readApplied(client) {
  await client.query(LEDGER_SQL)
  const { rows } = await client.query('select filename, applied_at from public.schema_migrations')
  return new Map(rows.map((r) => [r.filename, r.applied_at]))
}

/**
 * Strip comments, then split on semicolons that are not inside a string or a
 * dollar-quoted function body, so plpgsql bodies survive intact.
 */
const splitStatements = (sql) => {
  let out = []
  let buf = ''
  let inSingle = false
  let dollarTag = null

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i]
    const two = sql.slice(i, i + 2)

    if (dollarTag) {
      if (two === dollarTag) {
        buf += two
        i += 1
        dollarTag = null
        continue
      }
      buf += ch
      continue
    }

    if (!inSingle && two === '--') {
      const nl = sql.indexOf('\n', i)
      i = nl === -1 ? sql.length : nl
      buf += '\n'
      continue
    }

    if (!inSingle && two === '/*') {
      const end = sql.indexOf('*/', i)
      i = end === -1 ? sql.length : end + 1
      continue
    }

    if (ch === "'") inSingle = !inSingle
    if (!inSingle && ch === '$') {
      const m = /^\$[a-zA-Z_]*\$/.exec(sql.slice(i))
      if (m) {
        dollarTag = m[0]
        buf += m[0]
        i += m[0].length - 1
        continue
      }
    }

    if (ch === ';' && !inSingle) {
      if (buf.trim()) out.push(buf.trim())
      buf = ''
      continue
    }

    buf += ch
  }

  if (buf.trim()) out.push(buf.trim())
  return out
}

const flag = (name) => process.argv.includes(name)

async function main() {
  assertConfig()

  console.log(`\nmigrate -> ${config.db.host}:${config.db.port}/${config.db.name}\n`)

  const files = await listFiles()
  const client = await pool.connect()

  try {
    let applied = await readApplied(client)

    if (flag('--reset')) {
      console.log('  --reset: clearing ledger (tables are left untouched)')
      await client.query('delete from public.schema_migrations')
      applied = new Map()
    }

    const pending = files.filter((f) => !applied.has(f))

    console.log(`  ${files.length} file(s), ${pending.length} pending\n`)

    if (flag('--status')) {
      for (const f of files) {
        const at = applied.get(f)
        console.log(`  ${at ? 'applied ' : 'pending '} ${f}${at ? `  ${new Date(at).toISOString()}` : ''}`)
      }
      return
    }

    for (const file of pending) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
      const statements = splitStatements(sql)

      process.stdout.write(`  ${file} (${statements.length} statements) ... `)

      // each file is one transaction: it either lands whole or not at all
      await client.query('begin')
      try {
        for (const statement of statements) {
          await client.query(statement)
        }
        await client.query('insert into public.schema_migrations (filename) values ($1)', [file])
        await client.query('commit')
        console.log('ok')
      } catch (err) {
        await client.query('rollback')
        console.log('FAILED')
        console.error(`\n  ${err.message}\n`)
        if (err.position) {
          const pos = Number(err.position)
          console.error(`  near: ${sql.slice(Math.max(0, pos - 120), pos + 120).trim()}\n`)
        }
        throw err
      }
    }

    if (!pending.length) console.log('  nothing to do')

    const { rows } = await client.query(
      `select count(*)::int as n from information_schema.tables
        where table_schema = 'public' and table_type = 'BASE TABLE'`,
    )
    console.log(`\n  ${rows[0].n} tables in public\n`)
  } finally {
    client.release()
  }
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error(err.message)
    await pool.end().catch(() => null)
    process.exit(1)
  })