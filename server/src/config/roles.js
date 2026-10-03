/**
 * Roles and permissions.
 *
 * The club runs on five operational roles:
 *   admin          full access, manages staff and settings
 *   cafe_manager   bar, kitchen, tables
 *   court_manager  courts, availability, bookings
 *   shop_manager   products, stock, orders
 *   member         a paying club member
 *
 * Keep this file in step with the `users_role_check` constraint in
 * src/db/migrations/004_auth_roles.sql.
 */

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  CAFE_MANAGER: 'cafe_manager',
  COURT_MANAGER: 'court_manager',
  SHOP_MANAGER: 'shop_manager',
  MEMBER: 'member',
})

export const ROLE_VALUES = Object.freeze(Object.values(ROLES))

export const isValidRole = (role) => ROLE_VALUES.includes(role)

/** Anyone who works at the club. */
export const STAFF = Object.freeze([
  ROLES.ADMIN,
  ROLES.CAFE_MANAGER,
  ROLES.COURT_MANAGER,
  ROLES.SHOP_MANAGER,
])

/** Managers who run an area of the club. */
export const MANAGERS = Object.freeze([
  ROLES.CAFE_MANAGER,
  ROLES.COURT_MANAGER,
  ROLES.SHOP_MANAGER,
])

/** Every role that may use staff-console endpoints. */
export const ANY_STAFF = Object.freeze([...STAFF, ...MANAGERS])

/**
 * Area permissions, used by route-level guards:
 *   cafe_manager     -> /bar/**, /bar/summary
 *   court_manager    -> /courts/**, /bookings/**
 *   shop_manager     -> /products/**, /categories/**, /shop/**, /stock/**
 *   admin            -> everything
 */
export const AREA_ROUTES = Object.freeze({
  '/bar': [ROLES.ADMIN, ROLES.CAFE_MANAGER],
  '/courts': [ROLES.ADMIN, ROLES.COURT_MANAGER],
  '/bookings': [ROLES.ADMIN, ROLES.COURT_MANAGER],
  '/social-sessions': [ROLES.ADMIN, ROLES.COURT_MANAGER],
  '/products': [ROLES.ADMIN, ROLES.SHOP_MANAGER],
  '/categories': [ROLES.ADMIN, ROLES.SHOP_MANAGER],
  '/shop': [ROLES.ADMIN, ROLES.SHOP_MANAGER],
  '/stock': [ROLES.ADMIN, ROLES.SHOP_MANAGER],
})

/** Finance, HR and settings are admin-only. */
export const ADMIN_ONLY = Object.freeze([
  '/invoices',
  '/expenses',
  '/clients',
  '/employees',
  '/payroll',
  '/shifts',
  '/leave-requests',
  '/reports',
  '/settings',
])

export default {
  ROLES,
  ROLE_VALUES,
  isValidRole,
  STAFF,
  MANAGERS,
  ANY_STAFF,
  AREA_ROUTES,
  ADMIN_ONLY,
}