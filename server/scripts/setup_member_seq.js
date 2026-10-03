import { query } from '../src/utils/db.js'

async function setupMemberSequence() {
  console.log('Setting up member_code_seq in Postgres...')
  
  // Find current maximum numeric CC code in DB
  const maxRow = await query(`
    SELECT max(
      CASE 
        WHEN member_code ~ '^CC-[0-9]+$' 
        THEN substring(member_code from 4)::bigint 
        ELSE 0 
      END
    ) as max_num
    FROM public.members
  `)
  const currentMax = Number(maxRow[0]?.max_num || 100)
  const nextStart = Math.max(currentMax + 1, 200)
  console.log('Current max member_code number:', currentMax, 'Starting sequence at:', nextStart)

  await query(`CREATE SEQUENCE IF NOT EXISTS public.member_code_seq START WITH ${nextStart}`)
  // If sequence already existed, advance it past currentMax
  await query(`SELECT setval('public.member_code_seq', GREATEST(nextval('public.member_code_seq'), ${nextStart}))`)

  await query(`
    CREATE OR REPLACE FUNCTION public.next_member_code()
    RETURNS text
    LANGUAGE plpgsql
    AS $$
    DECLARE
      v_no bigint;
    BEGIN
      v_no := nextval('public.member_code_seq');
      RETURN 'CC-' || lpad(v_no::text, 6, '0');
    END;
    $$;
  `)

  const testCode = await query("SELECT public.next_member_code() as code")
  console.log('Generated test member code:', testCode[0]?.code)
  process.exit(0)
}

setupMemberSequence().catch(console.error)
