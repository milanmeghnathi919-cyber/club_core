/**
 * Applies every .sql file in src/db/migrations in filename order.
 *
 * The Supabase JS client can execute raw SQL through .rpc(), but that only
 * works for functions defined in the database. For schema DDL the practical
 * route is the Supabase SQL Editor or `supabase db push` — so this script
 * prints exactly what to run instead of pretending to do it.
 *
 *   node src/db/migrate.js          -> lists pending files
 *   node src/db/migrate.js --check  -> validates that files parse in order
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import logger from '../utils/logger.js'

const MIGRATIONS_DIR = path.dirname(fileURLToPath(import.meta.url)) + '/migrations'

const listFiles = async () => {
  const entries = await readdir(MIGRATIONS_DIR)
  return entries.filter((f) => f.endsWith('.sql')).sort()
}

const splitStatements = (sql) =>
  sql
    .split(/^\s*--.*$/gm)
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

async function main() {
  const files = await listFiles()

  logger.info(`Found ${files.length} migration file(s):`)
  for (const file of files) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
    const statements = splitStatements(sql)
    logger.info(`  ${file}  (${statements.length} statements)`)
  }

  if (process.argv.includes('--check')) {
    for (const file of files) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
      const count = splitStatements(sql).length
      if (!count) throw new Error(`${file} contains no statements`)
    }
    logger.info('All migration files parsed cleanly')
    return
  }

  logger.info('')
  logger.info('Run these in the Supabase SQL Editor, in this order:')
  for (const file of files) logger.info(`  ${file}`)
  logger.info('')
  logger.info('Or with the Supabase CLI:  supabase db push')
}

main().catch((err) => {
  logger.error(err.message)
  process.exit(1)
})