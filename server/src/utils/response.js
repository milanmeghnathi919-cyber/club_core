/**
 * Standard API Response envelope helpers adhering to API_CONTRACT.md
 * 
 * Success:
 *   { "success": true, "data": <object|array>, "meta": { "page":1, ... } }
 * Deletes/Empty:
 *   { "success": true, "data": {} }
 */

export const ok = (res, data = {}, meta = null) => {
  const body = { success: true, data }
  if (meta) body.meta = meta
  return res.status(200).json(body)
}

export const created = (res, data = {}) => {
  return res.status(201).json({ success: true, data })
}

export const paginated = (res, data = [], meta = { page: 1, limit: 20, total: 0, totalPages: 1 }) => {
  return res.status(200).json({
    success: true,
    data,
    meta,
  })
}

export default {
  ok,
  created,
  paginated,
}
