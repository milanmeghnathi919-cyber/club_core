import { Router } from 'express'
import paymentController from '../controllers/paymentController.js'
import { authenticate, authorize, optionalAuth } from '../middlewares/auth.js'

const router = Router()

// Static routes before /:id
router.post('/create-order', optionalAuth, paymentController.createOrder)
router.post('/razorpay/create-order', optionalAuth, paymentController.createOrder)
router.post('/razorpay/verify', optionalAuth, paymentController.verifyRazorpay)
router.post('/razorpay/webhook', (req, res) => res.status(200).json({ success: true, data: {} }))
router.post('/dummy/process', optionalAuth, paymentController.processDummyPayment)

router.get('/', authenticate, authorize('FD+'), paymentController.list)
router.post('/:id/refund', authenticate, authorize('FD+'), paymentController.refund)

export default router