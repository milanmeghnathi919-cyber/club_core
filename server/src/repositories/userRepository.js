import supabase from '../config/supabase.js'
import { queryOrConflict } from '../utils/supabaseQuery.js'
import { USER_COLUMNS } from '../models/User.js'

const TABLE = 'users'

const toDb = (data) => ({
  email: data.email,
  password_hash: data.passwordHash,
  role: data.role ?? 'user',
  name: data.name,
  phone: data.phone ?? null,
  is_active: data.isActive ?? true,
})

export const userRepository = {
  async findByEmail(email) {
    const { data } = await supabase
      .from(TABLE)
      .select('*, password_hash')
      .eq('email', String(email).toLowerCase())
      .maybeSingle()
    return data
  },

  async findById(id) {
    const { data } = await supabase.from(TABLE).select(USER_COLUMNS).eq('id', id).maybeSingle()
    return data
  },

  async list({ page = 1, limit = 20, search } = {}) {
    const from = (page - 1) * limit

    let query = supabase.from(TABLE).select(USER_COLUMNS, { count: 'exact' })

    if (search) {
      const term = `%${search}%`
      query = query.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term}`)
    }

    const { data, count, error } = await query.range(from, from + limit - 1).order('created_at', {
      ascending: false,
    })

    if (error) throw new Error(error.message)

    return { items: data ?? [], total: count ?? 0 }
  },

  async create(data) {
    return queryOrConflict(supabase.from(TABLE).insert(toDb(data)).select().single(), 'Email already registered')
  },

  async updateLastLogin(id) {
    return supabase
      .from(TABLE)
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', id)
      .then(({ data }) => data)
  },

  async updateById(id, data) {
    const patch = {}
    if (data.name !== undefined) patch.name = data.name
    if (data.phone !== undefined) patch.phone = data.phone
    if (data.role !== undefined) patch.role = data.role
    if (data.isActive !== undefined) patch.is_active = data.isActive
    if (data.passwordHash !== undefined) patch.password_hash = data.passwordHash

    const { data: updated, error } = await supabase
      .from(TABLE)
      .update(patch)
      .eq('id', id)
      .select(USER_COLUMNS)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return updated
  },

  async deleteById(id) {
    const { error } = await supabase.from(TABLE).delete().eq('id', id)
    if (error) throw new Error(error.message)
    return true
  },
}

export default userRepository