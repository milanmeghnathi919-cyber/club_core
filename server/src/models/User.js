/**
 * Table/column constants for the users table.
 * Postgres owns the schema (see src/db/migrations), so models here describe
 * shape and allow-lists rather than defining storage.
 */
import { ROLE_VALUES } from '../config/roles.js'

export const USER_COLUMNS = [
  'id',
  'email',
  'role',
  'name',
  'phone',
  'is_active',
  'is_email_verified',
  'email_verified_at',
  'last_login_at',
  'created_at',
]

/** Re-exported so callers have one import for everything user-shaped. */
export const USER_ROLES = ROLE_VALUES

/** Never leak password_hash outside the auth layer. */
export const toPublicUser = (user) => {
  if (!user) return null
  const { password_hash: _hash, ...rest } = user
  return {
    ...rest,
    // mirror the camelCase the rest of the API uses
    isEmailVerified: rest.is_email_verified ?? false,
    isActive: rest.is_active ?? true,
    lastLoginAt: rest.last_login_at ?? null,
    createdAt: rest.created_at ?? null,
  }
}

export default { USER_COLUMNS, USER_ROLES, toPublicUser }