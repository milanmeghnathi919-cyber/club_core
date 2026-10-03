import { Router } from 'express'
import * as paymentController from '../controllers/paymentController.js'
import { authenticate, authorize } from '../middlewares/auth.js'
import { verifyWebhookSignature } from '../utils/razorpay.js'

const router = Router()

router.post('/webhook', (req, res) => {
  // raw body is required for the HMAC check, so this route mounts before json parsing
  const valid = verifyWebhookSignature(req.rawBody, req.get('x-razorpay-signature'))
  if (!valid) return res.status(400).json({ success: false, message: 'Invalid signature' })

  const event = req.body?.event
  res.json({ success: true, data: { received: event } })
})

router.use(authenticate)

router.post('/order', authorize('admin', 'manager'), paymentController.createOrder)
router.post('/verify', paymentController.verifyPayment)
router.post('/', authorize('admin', 'manager', 'staff'), paymentController.recordCashPayment)
router.get('/', authorize('admin', 'manager'), paymentController.listPayments)
router.get('/revenue', authorize('admin', 'owner'), paymentController.revenueSummary)

export default router