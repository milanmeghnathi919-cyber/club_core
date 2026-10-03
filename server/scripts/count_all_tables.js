import { query } from '../src/utils/db.js'

async function countAllTables() {
  const tables = await query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `)

  console.log('--- Current Row Counts in Supabase ---')
  for (const t of tables.rows || tables) {
    const tableName = t.table_name
    try {
      const countRes = await query(`SELECT count(*)::int as count FROM public."${tableName}"`)
      console.log(`${tableName}: ${countRes[0]?.count ?? 0} rows`)
    } catch (err) {
      console.log(`${tableName}: error (${err.message})`)
    }
  }
  process.exit(0)
}

countAllTables().catch(console.error)
