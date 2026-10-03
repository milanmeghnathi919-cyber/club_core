import { Router } from 'express'
import paymentController from '../controllers/paymentController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

const router = Router()

// Static routes before /:id
router.post('/razorpay/verify', paymentController.verifyRazorpay)
router.post('/razorpay/webhook', (req, res) => res.status(200).json({ success: true, data: {} }))

router.get('/', authenticate, authorize('FD+'), paymentController.list)
router.post('/:id/refund', authenticate, authorize('FD+'), paymentController.refund)

export default router