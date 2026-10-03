import { Router } from 'express'
import authRoutes from './authRoutes.js'
import userRoutes from './userRoutes.js'
import uploadRoutes from './uploadRoutes.js'
import memberRoutes from './memberRoutes.js'
import paymentRoutes from './paymentRoutes.js'

const router = Router()

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } })
})

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/uploads', uploadRoutes)
router.use('/members', memberRoutes)
router.use('/payments', paymentRoutes)

export default router