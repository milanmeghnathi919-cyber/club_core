import { Router } from 'express'
import plansController from '../controllers/plansController.js'
import { authenticate, authorize } from '../middlewares/auth.js'
import { validateBody } from '../middlewares/validate.js'
import { planCreateSchema, planPatchSchema } from '../validators/schemas.js'

const router = Router()

router.get('/', plansController.list)
router.get('/:id', plansController.get)
router.post('/', authenticate, authorize('owner'), validateBody(planCreateSchema), plansController.create)
router.patch('/:id', authenticate, authorize('owner'), validateBody(planPatchSchema), plansController.update)

export default router
