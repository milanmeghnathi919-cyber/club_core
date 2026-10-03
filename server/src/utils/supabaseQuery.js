import supabase from '../config/supabase.js'
import ApiError from './ApiError.js'

/**
 * Supabase never throws; it returns { data, error }. This wrapper unwraps that
 * so repository code can use plain try/catch and services stay readable.
 */
export const query = async (builder) => {
  const { data, error } = await builder

  if (error) {
    throw new ApiError(error.code === 'PGRST116' ? 404 : 500, error.message, error.details)
  }

  return data
}

/**
 * Same as query() but preserves a 409 for unique-violation (23505),
 * which is what callers usually want to surface as "already exists".
 */
export const queryOrConflict = async (builder, message = 'Record already exists') => {
  const { data, error } = await builder

  if (error) {
    if (error.code === '23505') throw ApiError.conflict(message)
    throw new ApiError(error.code === 'PGRST116' ? 404 : 500, error.message, error.details)
  }

  return data
}

export const countOf = (rows = [], page = 1, limit = 20) => ({
  page,
  limit,
  total: rows.length,
  totalPages: rows.length ? Math.ceil(rows.length / limit) : 0,
})

export { supabase }