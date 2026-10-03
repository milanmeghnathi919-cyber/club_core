import supabase from '../config/supabase.js'
import { MEMBER_COLUMNS } from '../models/Member.js'

const TABLE = 'members'

export const memberRepository = {
  async findById(id) {
    const { data } = await supabase.from(TABLE).select(MEMBER_COLUMNS).eq('id', id).maybeSingle()
    return data
  },

  async findByCode(memberCode) {
    const { data } = await supabase
      .from(TABLE)
      .select(MEMBER_COLUMNS)
      .eq('member_code', memberCode)
      .maybeSingle()
    return data
  },

  async list({ page = 1, limit = 20, search } = {}) {
    const from = (page - 1) * limit

    let query = supabase.from(TABLE).select(MEMBER_COLUMNS, { count: 'exact' })

    if (search) {
      const term = `%${search}%`
      query = query.or(`full_name.ilike.${term},phone.ilike.${term},member_code.ilike.${term}`)
    }

    const { data, count, error } = await query.range(from, from + limit - 1).order('created_at', {
      ascending: false,
    })

    if (error) throw new Error(error.message)
    return { items: data ?? [], total: count ?? 0 }
  },

  async create(data) {
    const { data: created, error } = await supabase
      .from(TABLE)
      .insert(data)
      .select(MEMBER_COLUMNS)
      .single()

    if (error) {
      if (error.code === '23505') throw new Error('Member code already exists')
      throw new Error(error.message)
    }
    return created
  },

  async updateById(id, patch) {
    const { data: updated, error } = await supabase
      .from(TABLE)
      .update(patch)
      .eq('id', id)
      .select(MEMBER_COLUMNS)
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

export default memberRepository