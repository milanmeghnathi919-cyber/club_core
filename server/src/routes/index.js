import { Router } from 'express'
import authRoutes from './authRoutes.js'
import publicRoutes from './publicRoutes.js'
import planRoutes from './planRoutes.js'
import memberRoutes from './memberRoutes.js'
import membershipRoutes from './membershipRoutes.js'
import meRoutes from './meRoutes.js'
import courtRoutes from './courtRoutes.js'
import bookingRoutes from './bookingRoutes.js'
import socialRoutes from './socialRoutes.js'
import categoryRoutes from './categoryRoutes.js'
import productRoutes from './productRoutes.js'
import shopRoutes from './shopRoutes.js'
import paymentRoutes from './paymentRoutes.js'
import barRoutes from './barRoutes.js'
import leadRoutes from './leadRoutes.js'
import notificationRoutes from './notificationRoutes.js'
import clientRoutes from './clientRoutes.js'
import invoiceRoutes from './invoiceRoutes.js'
import expenseRoutes from './expenseRoutes.js'
import hrRoutes from './hrRoutes.js'
import reportRoutes from './reportRoutes.js'
import settingsRoutes from './settingsRoutes.js'
import uploadRoutes from './uploadRoutes.js'
import userRoutes from './userRoutes.js'
import jobRoutes from './jobRoutes.js'

const router = Router()

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      time: new Date().toISOString(),
      uptime: process.uptime(),
    },
  })
})

// Core & Operations modules
router.use('/auth', authRoutes)
router.use('/public', publicRoutes)
router.use('/settings', settingsRoutes)
router.use('/uploads', uploadRoutes)
router.use('/plans', planRoutes)
router.use('/members', memberRoutes)
router.use('/memberships', membershipRoutes)
router.use('/me', meRoutes)
router.use('/courts', courtRoutes)
router.use('/bookings', bookingRoutes)
router.use('/social-sessions', socialRoutes)
router.use('/categories', categoryRoutes)
router.use('/products', productRoutes)
router.use('/shop', shopRoutes)
router.use('/payments', paymentRoutes)
router.use('/bar', barRoutes)
router.use('/cafe', barRoutes)
router.use('/leads', leadRoutes)
router.use('/notifications', notificationRoutes)
router.use('/clients', clientRoutes)
router.use('/invoices', invoiceRoutes)
router.use('/expenses', expenseRoutes)
router.use('/reports', reportRoutes)
router.use('/users', userRoutes)

// HR & Payroll routes (/employees, /shifts, /leave-requests, /payroll/runs)
router.use(hrRoutes)

// Background Jobs runner (internal)
router.use('/internal/jobs', jobRoutes)

export default router