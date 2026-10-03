import { Router } from 'express'
import bookingController from '../controllers/bookingController.js'
import { authenticate, authorize } from '../middlewares/auth.js'
import { validateBody } from '../middlewares/validate.js'
import { bookingCreateSchema } from '../validators/schemas.js'

const router = Router()

// STATIC ROUTES FIRST (before /:id)
router.get('/mine', authenticate, bookingController.mine)

router.get('/', authenticate, bookingController.list)
router.post('/', authenticate, validateBody(bookingCreateSchema), bookingController.create)

router.get('/:id', authenticate, bookingController.get)
router.patch('/:id/cancel', authenticate, bookingController.cancel)
router.patch('/:id/pay', authenticate, authorize('staff'), bookingController.pay)
router.patch('/:id/status', authenticate, authorize('staff'), bookingController.updateStatus)

export default router
