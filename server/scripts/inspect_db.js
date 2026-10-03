import pg from 'pg'

const client = new pg.Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.rcfyaquqdrvlwyvfshow',
  password: 'club_core@123',
  ssl: { rejectUnauthorized: false },
})

async function main() {
  await client.connect()
  console.log('Connected to Supabase Postgres!')

  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  )
  console.log('Tables in Supabase:', tables.rows.map((r) => r.table_name))

  const userCols = await client.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
  )
  console.log('Users columns:', userCols.rows.map((r) => `${r.column_name} (${r.data_type})`))

  const users = await client.query(
    'SELECT id, email, name, role, created_at FROM public.users ORDER BY created_at DESC LIMIT 10'
  )
  console.log('Latest 10 users in Supabase:', users.rows)

  const constraints = await client.query(
    "SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = 'public.users'::regclass"
  )
  console.log('Constraints on public.users:', constraints.rows)

  const memberConstraints = await client.query(
    "SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = 'public.members'::regclass"
  )
  console.log('Constraints on public.members:', memberConstraints.rows)

  await client.end()
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
