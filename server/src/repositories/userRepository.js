import { query, queryOne } from '../utils/db.js'
import { USER_COLUMNS } from '../models/User.js'
import { ROLES } from '../config/roles.js'

const TABLE = 'users'
const PUBLIC_COLS = USER_COLUMNS.join(', ')

export const userRepository = {
  /** Includes password_hash; only the auth service may call this. */
  async findByEmail(email) {
    return queryOne(
      `select ${PUBLIC_COLS}, password_hash from public.${TABLE} where email = $1`,
      [String(email).toLowerCase()],
    )
  },

  async findById(id) {
    return queryOne(`select ${PUBLIC_COLS} from public.${TABLE} where id = $1`, [id])
  },

  async list({ page = 1, limit = 20, search } = {}) {
    const offset = (page - 1) * limit
    const term = `%${String(search ?? '').toLowerCase()}%`

    const rows = await query(
      `select ${PUBLIC_COLS},
              count(*) over ()::int as total_count
         from public.${TABLE}
        where ($1::text = '' or lower(name) like $2
                           or lower(email) like $2
                           or coalesce(phone, '') like $2)
        order by created_at desc
        limit $3 offset $4`,
      [String(search ?? ''), term, limit, offset],
    )

    const total = rows.length ? Number(rows[0].total_count) : 0
    return { items: rows, total }
  },

  async create(data) {
    return queryOne(
      `insert into public.${TABLE}
         (email, password_hash, role, name, phone, is_active, is_email_verified)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning ${PUBLIC_COLS}`,
      [
        String(data.email).toLowerCase(),
        data.passwordHash,
        data.role ?? ROLES.MEMBER,
        data.name,
        data.phone ?? null,
        data.isActive ?? true,
        data.isEmailVerified ?? false,
      ],
    )
  },

  async updateLastLogin(id) {
    return queryOne(
      `update public.${TABLE} set last_login_at = now() where id = $1 returning ${PUBLIC_COLS}`,
      [id],
    )
  },

  async updateById(id, data) {
    return queryOne(
      `update public.${TABLE}
          set name         = coalesce($2, name),
              phone        = coalesce($3, phone),
              role         = coalesce($4, role),
              is_active    = coalesce($5, is_active),
              password_hash = coalesce($6, password_hash)
        where id = $1
        returning ${PUBLIC_COLS}`,
      [id, data.name ?? null, data.phone ?? null, data.role ?? null,
        data.isActive ?? null, data.passwordHash ?? null],
    )
  },

  async deleteById(id) {
    const row = await queryOne(`delete from public.${TABLE} where id = $1 returning id`, [id])
    return Boolean(row)
  },
}

export default userRepository