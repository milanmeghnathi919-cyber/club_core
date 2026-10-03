import { Router } from 'express'
import memberController from '../controllers/memberController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

const router = Router()

router.post('/membership/purchase', authenticate, authorize('member'), memberController.purchaseMembership)

export default router
