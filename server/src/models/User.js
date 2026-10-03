/**
 * Table/column constants for the users table.
 * Postgres owns the schema (see src/db/migrations), so models here describe
 * shape and allow-lists rather than defining storage.
 */

export const USER_COLUMNS = [
  'id',
  'email',
  'role',
  'name',
  'phone',
  'is_active',
  'last_login_at',
  'created_at',
]

export const USER_ROLES = ['owner', 'admin', 'manager', 'staff', 'user']

/** Never leak password_hash outside the auth layer. */
export const toPublicUser = (user) => {
  if (!user) return null
  const { password_hash: _hash, ...rest } = user
  return rest
}

export default { USER_COLUMNS, USER_ROLES, toPublicUser }