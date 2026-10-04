/**
 * Staff Role & Department Permissions Utility
 * 
 * Three Distinct Staff Roles:
 * 1. court: Court Schedule, Members CRM, Leads CRM, Friday Social, Shifts, Leave
 * 2. shop: Shop Inventory, Shop Orders, Counter POS, Shifts, Leave
 * 3. cafe: Café Inventory, Café POS & Orders, Kitchen Display, Café Summary, Shifts, Leave
 * 
 * Owner: Unrestricted executive access across all consoles
 */

export const getStaffDepartment = (user) => {
  if (!user) return 'court'
  if (user.role === 'owner') return 'owner'
  
  const role = (user.role || '').toLowerCase()
  const email = (user.email || '').toLowerCase()
  
  if (role === 'shop_staff' || email.includes('shop')) {
    return 'shop'
  }
  
  if (
    role === 'cafe_staff' ||
    role === 'bar_staff' ||
    email.includes('cafe') ||
    email.includes('bar')
  ) {
    return 'cafe'
  }
  
  return 'court'
}

export const getDepartmentHome = (department) => {
  switch (department) {
    case 'shop':
      return '/staff/products'
    case 'cafe':
      return '/staff/cafe/inventory'
    case 'owner':
      return '/staff/bookings'
    case 'court':
    default:
      return '/staff/bookings'
  }
}

export const getDepartmentTitle = (department) => {
  switch (department) {
    case 'shop':
      return 'Pro Shop Staff'
    case 'cafe':
      return 'Club Café Staff'
    case 'owner':
      return 'Club Owner'
    case 'court':
    default:
      return 'Court Operations Staff'
  }
}

/**
 * Validates if the given staff user is permitted to view a specific pathname
 */
export const isStaffPathAllowed = (user, pathname) => {
  if (!user || user.role === 'member' || user.role === 'user') return false
  const dept = getStaffDepartment(user)
  if (dept === 'owner') return true

  // Universal staff paths allowed for all staff departments
  const universalPaths = [
    '/staff/shifts',
    '/staff/leave',
    '/staff/profile',
  ]
  if (universalPaths.some((p) => pathname.startsWith(p))) {
    return true
  }

  if (dept === 'court') {
    const courtPaths = [
      '/staff/bookings',
      '/staff/members',
      '/staff/leads',
      '/staff/social',
    ]
    return courtPaths.some((p) => pathname.startsWith(p))
  }

  if (dept === 'shop') {
    const shopPaths = [
      '/staff/products',
      '/staff/orders',
      '/staff/pos',
    ]
    return shopPaths.some((p) => pathname.startsWith(p))
  }

  if (dept === 'cafe') {
    const cafePaths = [
      '/staff/cafe',
      '/staff/bar',
      '/staff/cafe-inventory',
    ]
    return cafePaths.some((p) => pathname.startsWith(p))
  }

  return false
}
