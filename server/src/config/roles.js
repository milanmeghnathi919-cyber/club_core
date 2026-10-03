/**
 * Canonical roles and permissions from API_CONTRACT.md & BACKEND_EXECUTION_PLAN.md
 * 
 * Roles:
 *   owner       - Club owner with full administrative and financial access
 *   front_desk  - Front desk operations, members, bookings, counter sales, leads
 *   bar_staff   - Bar & kitchen operations, tabs, orders, kitchen display
 *   member      - Registered club member with portal access
 * 
 * Shorthands:
 *   staff = owner + front_desk + bar_staff
 *   FD+   = owner + front_desk
 *   owner = owner only
 *   any   = any authenticated user
 */

export const ROLES = Object.freeze({
  OWNER: 'owner',
  FRONT_DESK: 'front_desk',
  COURT_STAFF: 'court_staff',
  SHOP_STAFF: 'shop_staff',
  BAR_STAFF: 'bar_staff',
  CAFE_STAFF: 'cafe_staff',
  MEMBER: 'member',
})

export const ROLE_VALUES = Object.freeze(Object.values(ROLES))

export const isValidRole = (role) => ROLE_VALUES.includes(role)

export const STAFF = Object.freeze([
  ROLES.OWNER,
  ROLES.FRONT_DESK,
  ROLES.COURT_STAFF,
  ROLES.SHOP_STAFF,
  ROLES.BAR_STAFF,
  ROLES.CAFE_STAFF,
])

export const ANY_STAFF = STAFF

export const COURT_STAFF = Object.freeze([
  ROLES.OWNER,
  ROLES.FRONT_DESK,
  ROLES.COURT_STAFF,
])

export const SHOP_STAFF = Object.freeze([
  ROLES.OWNER,
  ROLES.SHOP_STAFF,
])

export const CAFE_STAFF = Object.freeze([
  ROLES.OWNER,
  ROLES.BAR_STAFF,
  ROLES.CAFE_STAFF,
])

export const FD_PLUS = COURT_STAFF
export const FRONT_DESK_PLUS = FD_PLUS

export const OWNER_ONLY = Object.freeze([
  ROLES.OWNER,
])

export const ANY_AUTH = Object.freeze([
  ROLES.OWNER,
  ROLES.FRONT_DESK,
  ROLES.COURT_STAFF,
  ROLES.SHOP_STAFF,
  ROLES.BAR_STAFF,
  ROLES.CAFE_STAFF,
  ROLES.MEMBER,
])

export default {
  ROLES,
  ROLE_VALUES,
  isValidRole,
  STAFF,
  COURT_STAFF,
  SHOP_STAFF,
  CAFE_STAFF,
  FD_PLUS,
  OWNER_ONLY,
  ANY_AUTH,
}