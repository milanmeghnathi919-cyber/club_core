import crypto from 'crypto'
import { query, queryOne } from '../utils/db.js'
import { USER_COLUMNS } from '../models/User.js'
import { ROLES } from '../config/roles.js'
import memoryStore from '../utils/memoryStore.js'

const TABLE = 'users'
const PUBLIC_COLS = USER_COLUMNS.join(', ')

export const userRepository = {
  async findByEmail(email) {
    const cleanEmail = String(email).toLowerCase()
    try {
      const row = await queryOne(
        `select ${PUBLIC_COLS}, password_hash from public.${TABLE} where lower(email) = $1`,
        [cleanEmail],
      )
      if (row) return row
    } catch {
      // fallback to memoryStore
    }
    return memoryStore.findOne('users', (u) => u.email?.toLowerCase() === cleanEmail)
  },

  async findById(id) {
    try {
      const row = await queryOne(`select ${PUBLIC_COLS} from public.${TABLE} where id = $1`, [id])
      if (row) return row
    } catch {
      // fallback
    }
    return memoryStore.findOne('users', (u) => u.id === id)
  },

  async list({ page = 1, limit = 20, search } = {}) {
    const offset = (page - 1) * limit
    const term = `%${String(search ?? '').toLowerCase()}%`

    try {
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
    } catch {
      let all = memoryStore.find('users')
      if (search) {
        const s = search.toLowerCase()
        all = all.filter(
          (u) =>
            u.name?.toLowerCase().includes(s) ||
            u.email?.toLowerCase().includes(s) ||
            u.phone?.toLowerCase().includes(s)
        )
      }
      return {
        items: all.slice(offset, offset + limit),
        total: all.length,
      }
    }
  },

  async create(data) {
    const cleanEmail = String(data.email).toLowerCase()
    const userRole = data.role ?? ROLES.MEMBER

    try {
      const row = await queryOne(
        `insert into public.${TABLE}
           (email, password_hash, role, name, phone, is_active)
         values ($1, $2, $3, $4, $5, $6)
         returning ${PUBLIC_COLS}`,
        [
          cleanEmail,
          data.passwordHash,
          userRole,
          data.name,
          data.phone ?? null,
          data.isActive ?? true,
        ],
      )
      if (row) {
        memoryStore.insert('users', { ...row, password_hash: data.passwordHash })
        return row
      }
    } catch (err) {
      console.error('[userRepository.create DB failed]', err)
    }

    const created = memoryStore.insert('users', {
      id: data.id || crypto.randomUUID(),
      email: cleanEmail,
      password_hash: data.passwordHash,
      role: userRole,
      name: data.name,
      phone: data.phone ?? null,
      is_active: data.isActive ?? true,
      created_at: new Date().toISOString(),
    })
    return created
  },

  async updateLastLogin(id) {
    try {
      await queryOne(`update public.${TABLE} set last_login_at = now() where id = $1 returning id`, [id])
    } catch {
      memoryStore.update('users', (u) => u.id === id, { last_login_at: new Date().toISOString() })
    }
  },

  async updatePassword(id, passwordHash) {
    try {
      await queryOne(`update public.${TABLE} set password_hash = $1 where id = $2 returning id`, [
        passwordHash,
        id,
      ])
    } catch {
      memoryStore.update('users', (u) => u.id === id, { password_hash: passwordHash })
    }
  },

  async update(id, updates) {
    try {
      const sets = []
      const vals = []
      let idx = 1
      for (const [k, v] of Object.entries(updates)) {
        sets.push(`${k} = $${idx++}`)
        vals.push(v)
      }
      vals.push(id)
      return queryOne(`update public.${TABLE} set ${sets.join(', ')} where id = $${idx} returning ${PUBLIC_COLS}`, vals)
    } catch {
      return memoryStore.update('users', (u) => u.id === id, updates)
    }
  },
}

export default userRepository