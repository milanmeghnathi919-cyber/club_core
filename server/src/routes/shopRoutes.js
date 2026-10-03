import { Router } from 'express'
import shopController from '../controllers/shopController.js'
import { authenticate, authorize } from '../middlewares/auth.js'
import { validateBody } from '../middlewares/validate.js'
import { shopOrderCreateSchema } from '../validators/schemas.js'
import jwt from 'jsonwebtoken'
import config from '../config/index.js'
import { COOKIE_NAME } from '../middlewares/auth.js'

const router = Router()

// Optional auth middleware for quote
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization ?? ''
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null
  const token = bearer ?? req.cookies?.[COOKIE_NAME]
  if (token) {
    try {
      req.user = jwt.verify(token, config.jwtSecret || 'dev-secret-key-12345')
    } catch {}
  }
  next()
}

// STATIC ROUTES FIRST (before /orders/:id)
router.post('/orders/quote', optionalAuth, shopController.quote)
router.get('/orders/mine', authenticate, authorize('member'), shopController.mine)

router.get('/orders', authenticate, authorize('staff'), shopController.list)
router.post('/orders', authenticate, validateBody(shopOrderCreateSchema), shopController.create)

router.get('/orders/:id', authenticate, shopController.get)
router.patch('/orders/:id/status', authenticate, authorize('staff'), shopController.updateStatus)
router.post('/orders/:id/pay', authenticate, authorize('staff'), shopController.pay)
router.patch('/orders/:id/cancel', authenticate, shopController.cancel)

export default router
