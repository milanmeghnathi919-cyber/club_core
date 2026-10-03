import { Router } from 'express'
import shopController from '../controllers/shopController.js'
import { authenticate, authorize, optionalAuth } from '../middlewares/auth.js'
import { validateBody } from '../middlewares/validate.js'
import { shopOrderCreateSchema } from '../validators/schemas.js'

const router = Router()

// STATIC ROUTES FIRST (before /orders/:id)
router.post('/orders/quote', optionalAuth, shopController.quote)
router.get('/orders/mine', authenticate, shopController.mine)

router.get('/orders', authenticate, authorize('staff'), shopController.list)
router.post('/orders', authenticate, validateBody(shopOrderCreateSchema), shopController.create)

router.get('/orders/:id', authenticate, shopController.get)
router.patch('/orders/:id/status', authenticate, authorize('staff'), shopController.updateStatus)
router.post('/orders/:id/pay', authenticate, authorize('staff'), shopController.pay)
router.patch('/orders/:id/cancel', authenticate, shopController.cancel)

export default router
