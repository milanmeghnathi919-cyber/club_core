import { Router } from 'express'
import memberController from '../controllers/memberController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

const router = Router()

router.patch('/:id/cancel', authenticate, authorize('FD+'), memberController.cancelMembership)

export default router
