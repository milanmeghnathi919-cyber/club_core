import { query, queryOne } from '../utils/db.js'
import memoryStore from '../utils/memoryStore.js'

export const courtRepository = {
  async list({ isActive, sport } = {}) {
    try {
      let sql = 'select * from public.courts where 1=1'
      const params = []
      let idx = 1
      if (isActive !== undefined) {
        sql += ` and is_active = $${idx++}`
        params.push(isActive)
      }
      if (sport) {
        sql += ` and sport = $${idx++}`
        params.push(sport)
      }
      sql += ' order by name asc'
      const rows = await query(sql, params)
      if (rows && rows.length > 0) return rows
    } catch {}

    let items = memoryStore.find('courts')
    if (isActive !== undefined) items = items.filter((c) => c.is_active === isActive)
    if (sport) items = items.filter((c) => c.sport === sport)
    items.sort((a, b) => a.name.localeCompare(b.name))
    return items
  },

  async findById(id) {
    try {
      const row = await queryOne('select * from public.courts where id = $1', [id])
      if (row) return row
    } catch {}
    return memoryStore.findOne('courts', (c) => c.id === id)
  },

  async create(data) {
    try {
      const row = await queryOne(
        `insert into public.courts (name, sport, rate_per_hour, description, image_url, is_active)
         values ($1, $2, $3, $4, $5, $6)
         returning *`,
        [
          data.name,
          data.sport,
          data.ratePerHour || data.rate_per_hour,
          data.description || null,
          data.imageUrl || data.image_url || null,
          data.isActive ?? data.is_active ?? true,
        ]
      )
      if (row) {
        memoryStore.insert('courts', row)
        return row
      }
    } catch {}

    return memoryStore.insert('courts', {
      id: data.id || crypto.randomUUID(),
      name: data.name,
      sport: data.sport,
      rate_per_hour: Number(data.ratePerHour || data.rate_per_hour),
      description: data.description || null,
      image_url: data.imageUrl || data.image_url || null,
      is_active: data.isActive ?? data.is_active ?? true,
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
      const row = await queryOne(`update public.courts set ${sets.join(', ')} where id = $${idx} returning *`, vals)
      if (row) {
        memoryStore.update('courts', (c) => c.id === id, row)
        return row
      }
    } catch {}

    return memoryStore.update('courts', (c) => c.id === id, updates)
  },
}

export default courtRepository
