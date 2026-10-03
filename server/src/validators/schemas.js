import { z } from 'zod'

const phoneRegex = /^[0-9+\- ]{8,15}$/

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().trim().regex(phoneRegex, 'Invalid phone number format').optional().nullable(),
  dob: z.string().optional().nullable(),
})

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export const planCreateSchema = z.object({
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000).optional().nullable(),
  price: z.coerce.number().min(0),
  durationDays: z.coerce.number().int().positive(),
  courtDiscountPct: z.coerce.number().min(0).max(100).default(0),
  shopDiscountPct: z.coerce.number().min(0).max(100).default(0),
  barDiscountPct: z.coerce.number().min(0).max(100).default(0),
  maxBookingsPerDay: z.coerce.number().int().positive().default(2),
  perks: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
})

export const planPatchSchema = planCreateSchema.partial()

export const memberCreateSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().regex(phoneRegex, 'Invalid phone number'),
  dob: z.string().optional().nullable(), // YYYY-MM-DD
  address: z.string().max(500).optional().nullable(),
  emergencyContact: z.string().max(120).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  planId: z.string().min(1).optional().nullable(),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'online', 'pay_at_club']).optional().nullable(),
  startDate: z.string().optional().nullable(),
  createLogin: z.boolean().default(false),
})

export const memberPatchSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().regex(phoneRegex).optional(),
  dob: z.string().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  emergencyContact: z.string().max(120).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export const courtCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sport: z.enum(['tennis', 'cricket', 'padel', 'badminton']),
  ratePerHour: z.coerce.number().positive(),
  description: z.string().max(1000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true),
})

export const courtPatchSchema = courtCreateSchema.partial()

export const bookingCreateSchema = z.object({
  courtId: z.string().min(1),
  startAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)),
  memberId: z.string().min(1).optional().nullable(),
  guestName: z.string().trim().max(120).optional().nullable(),
  guestPhone: z.string().trim().regex(phoneRegex).optional().nullable(),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'online', 'pay_at_club']).default('pay_at_club'),
  notes: z.string().max(1000).optional().nullable(),
})

export const socialSessionCreateSchema = z.object({
  courtId: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  startAt: z.string(),
  capacity: z.coerce.number().int().min(2),
  pricePerHead: z.coerce.number().min(0),
  notes: z.string().max(1000).optional().nullable(),
})

export const productCreateSchema = z.object({
  sku: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000).optional().nullable(),
  categoryId: z.string().min(1),
  brand: z.string().max(120).optional().nullable(),
  price: z.coerce.number().positive(),
  taxRatePct: z.coerce.number().min(0).max(100).default(18),
  stockQty: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  imageUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true),
})

export const productPatchSchema = productCreateSchema.partial().omit({ sku: true })

export const stockAdjustSchema = z.object({
  delta: z.coerce.number().int(),
  reason: z.enum(['sale', 'restock', 'adjustment', 'damage', 'return', 'order_cancel']),
  note: z.string().max(500).optional().nullable(),
})

export const shopOrderCreateSchema = z.object({
  channel: z.enum(['counter', 'online']).default('counter'),
  fulfilment: z.enum(['in_store', 'pickup', 'delivery']).default('in_store'),
  memberId: z.string().min(1).optional().nullable(),
  customerName: z.string().trim().max(120).optional().nullable(),
  customerPhone: z.string().trim().regex(phoneRegex).optional().nullable(),
  deliveryAddress: z.string().max(500).optional().nullable(),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'online', 'pay_at_club']),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      qty: z.coerce.number().int().positive(),
    })
  ).min(1),
  notes: z.string().max(1000).optional().nullable(),
})

export const barTabOpenSchema = z.object({
  tableId: z.string().min(1).optional().nullable(),
  memberId: z.string().min(1).optional().nullable(),
  guestName: z.string().trim().max(120).optional().nullable(),
})

export const barTabAddItemSchema = z.union([
  z.object({
    menuItemId: z.string().min(1),
    qty: z.coerce.number().int().positive().default(1),
    notes: z.string().max(500).optional().nullable(),
  }),
  z.object({
    items: z.array(
      z.object({
        menuItemId: z.string().min(1),
        qty: z.coerce.number().int().positive().default(1),
        notes: z.string().max(500).optional().nullable(),
      })
    ).min(1),
  }),
])

export const barTabSettleSchema = z.object({
  payments: z.array(
    z.object({
      method: z.enum(['cash', 'card', 'upi']),
      amount: z.coerce.number().positive(),
    })
  ).min(1),
})

export const leadCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().regex(phoneRegex).optional().nullable(),
  source: z.enum(['website', 'walk_in', 'phone', 'referral']).default('website'),
  interest: z.enum(['membership', 'trial', 'corporate', 'other']).default('membership'),
  planId: z.string().min(1).optional().nullable(),
  sport: z.string().max(50).optional().nullable(),
  preferredDate: z.string().optional().nullable(),
  message: z.string().max(1000).optional().nullable(),
})

export const publicEnquirySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().regex(phoneRegex).optional().nullable(),
  interest: z.enum(['membership', 'trial', 'corporate', 'other']).default('membership'),
  message: z.string().max(1000).optional().nullable(),
  planId: z.string().min(1).optional().nullable(),
  sport: z.string().optional().nullable(),
  preferredDate: z.string().optional().nullable(),
})

export default {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  planCreateSchema,
  planPatchSchema,
  memberCreateSchema,
  memberPatchSchema,
  courtCreateSchema,
  courtPatchSchema,
  bookingCreateSchema,
  socialSessionCreateSchema,
  productCreateSchema,
  productPatchSchema,
  stockAdjustSchema,
  shopOrderCreateSchema,
  barTabOpenSchema,
  barTabAddItemSchema,
  barTabSettleSchema,
  leadCreateSchema,
  publicEnquirySchema,
}
