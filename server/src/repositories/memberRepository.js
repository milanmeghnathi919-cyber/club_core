import crypto from 'crypto'
import { query, queryOne } from '../utils/db.js'
import memoryStore from '../utils/memoryStore.js'
import { MEMBER_COLUMNS } from '../models/Member.js'

const TABLE = 'members'
const COLS = MEMBER_COLUMNS.join(', ')

export const memberRepository = {
  async findById(id) {
    try {
      const row = await queryOne(`select ${COLS} from public.${TABLE} where id = $1`, [id])
      if (row) return row
    } catch {}
    return memoryStore.findOne('members', (m) => m.id === id)
  },

  async findByUserId(userId) {
    try {
      const row = await queryOne(`select ${COLS} from public.${TABLE} where user_id = $1`, [userId])
      if (row) return row
    } catch {}
    return memoryStore.findOne('members', (m) => m.user_id === userId)
  },

  async findByPhone(phone) {
    const clean = String(phone).trim()
    try {
      const row = await queryOne(`select ${COLS} from public.${TABLE} where phone = $1`, [clean])
      if (row) return row
    } catch {}
    return memoryStore.findOne('members', (m) => m.phone === clean)
  },

  async findByCode(memberCode) {
    const clean = String(memberCode).trim()
    try {
      const row = await queryOne(`select ${COLS} from public.${TABLE} where upper(member_code) = upper($1)`, [clean])
      if (row) return row
    } catch {}
    return memoryStore.findOne('members', (m) => m.member_code?.toUpperCase() === clean.toUpperCase())
  },

  async lookup(q) {
    const term = `%${String(q || '').toLowerCase()}%`
    try {
      const rows = await query(
        `select ${COLS} from public.${TABLE}
          where lower(full_name) like $1
             or lower(phone) like $1
             or lower(member_code) like $1
          order by full_name asc
          limit 10`,
        [term]
      )
      if (rows && rows.length > 0) return rows
    } catch {}

    const search = String(q || '').toLowerCase()
    return memoryStore.find('members', (m) =>
      m.full_name?.toLowerCase().includes(search) ||
      m.phone?.toLowerCase().includes(search) ||
      m.member_code?.toLowerCase().includes(search)
    ).slice(0, 10)
  },

  async list({ page = 1, limit = 20, search, planId } = {}) {
    const offset = (page - 1) * limit
    const term = `%${String(search ?? '').toLowerCase()}%`

    try {
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
    } catch {
      let items = memoryStore.find('members')
      if (search) {
        const s = search.toLowerCase()
        items = items.filter(
          (m) =>
            m.full_name?.toLowerCase().includes(s) ||
            m.phone?.toLowerCase().includes(s) ||
            m.member_code?.toLowerCase().includes(s)
        )
      }
      return {
        items: items.slice(offset, offset + limit),
        total: items.length,
      }
    }
  },

  async create(data) {
    try {
      const row = await queryOne(
        `insert into public.${TABLE}
           (member_code, user_id, full_name, phone, email, dob, address,
            emergency_contact, photo_url, notes, created_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         returning ${COLS}`,
        [
          data.memberCode || data.member_code,
          data.userId || data.user_id || null,
          data.fullName || data.full_name,
          data.phone,
          data.email || null,
          data.dob || null,
          data.address || null,
          data.emergencyContact || data.emergency_contact || null,
          data.photoUrl || data.photo_url || null,
          data.notes || null,
          data.createdBy || data.created_by || null,
        ],
      )
      if (row) {
        memoryStore.insert('members', row)
        return row
      }
    } catch {}

    return memoryStore.insert('members', {
      id: data.id || crypto.randomUUID(),
      member_code: data.memberCode || data.member_code,
      user_id: data.userId || data.user_id || null,
      full_name: data.fullName || data.full_name,
      phone: data.phone,
      email: data.email || null,
      dob: data.dob || null,
      address: data.address || null,
      emergency_contact: data.emergencyContact || data.emergency_contact || null,
      photo_url: data.photoUrl || data.photo_url || null,
      notes: data.notes || null,
      created_by: data.createdBy || data.created_by || null,
      created_at: new Date().toISOString(),
    })
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
      const row = await queryOne(`update public.${TABLE} set ${sets.join(', ')} where id = $${idx} returning ${COLS}`, vals)
      if (row) {
        memoryStore.update('members', (m) => m.id === id, row)
        return row
      }
    } catch {}

    return memoryStore.update('members', (m) => m.id === id, updates)
  },
}

export default memberRepository