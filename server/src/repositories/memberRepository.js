import { query, queryOne } from '../utils/db.js'
import { MEMBER_COLUMNS } from '../models/Member.js'

const TABLE = 'members'
const COLS = MEMBER_COLUMNS.join(', ')

export const memberRepository = {
  async findById(id) {
    return queryOne(`select ${COLS} from public.${TABLE} where id = $1`, [id])
  },

  async findByCode(memberCode) {
    return queryOne(`select ${COLS} from public.${TABLE} where member_code = $1`, [memberCode])
  },

  async list({ page = 1, limit = 20, search } = {}) {
    const offset = (page - 1) * limit
    const term = `%${String(search ?? '').toLowerCase()}%`

    const rows = await query(
      `select ${COLS}, count(*) over ()::int as total_count
         from public.${TABLE}
        where ($1::text = '' or lower(full_name) like $2
                           or phone like $2
                           or lower(member_code) like $2)
        order by created_at desc
        limit $3 offset $4`,
      [String(search ?? ''), term, limit, offset],
    )

    return { items: rows, total: rows.length ? Number(rows[0].total_count) : 0 }
  },

  /** Sequential member codes: M-00001, M-00002, ... */
  async nextMemberCode() {
    const row = await queryOne(
      `select coalesce(max(nullif(regexp_replace(member_code, '\\D', '', 'g'), '')::int), 0) + 1 as n
         from public.${TABLE}`,
    )
    return `M-${String(Number(row?.n ?? 1)).padStart(5, '0')}`
  },

  async create(data) {
    return queryOne(
      `insert into public.${TABLE}
         (member_code, user_id, full_name, phone, email, dob, address,
          emergency_contact, photo_url, notes, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       returning ${COLS}`,
      [
        data.member_code,
        data.user_id ?? null,
        data.full_name,
        data.phone,
        data.email ?? null,
        data.dob ?? null,
        data.address ?? null,
        data.emergency_contact ?? null,
        data.photo_url ?? null,
        data.notes ?? null,
        data.created_by ?? null,
      ],
    )
  },

  async updateById(id, patch) {
    return queryOne(
      `update public.${TABLE}
          set full_name         = coalesce($2, full_name),
              phone             = coalesce($3, phone),
              email             = coalesce($4, email),
              dob               = coalesce($5, dob),
              address           = coalesce($6, address),
              emergency_contact = coalesce($7, emergency_contact),
              photo_url         = coalesce($8, photo_url),
              notes             = coalesce($9, notes)
        where id = $1
        returning ${COLS}`,
      [id, patch.full_name ?? null, patch.phone ?? null, patch.email ?? null,
        patch.dob ?? null, patch.address ?? null, patch.emergency_contact ?? null,
        patch.photo_url ?? null, patch.notes ?? null],
    )
  },

  async deleteById(id) {
    const row = await queryOne(`delete from public.${TABLE} where id = $1 returning id`, [id])
    return Boolean(row)
  },
}

export default memberRepository