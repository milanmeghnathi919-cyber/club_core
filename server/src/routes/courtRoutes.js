import { Router } from 'express'
import courtController from '../controllers/courtController.js'
import { authenticate, authorize, optionalAuth } from '../middlewares/auth.js'
import { validateBody } from '../middlewares/validate.js'
import { courtCreateSchema, courtPatchSchema } from '../validators/schemas.js'

const router = Router()

// STATIC ROUTES FIRST (before /:id)
router.get('/availability', optionalAuth, courtController.getAvailability)

router.get('/', optionalAuth, courtController.list)
router.get('/:id', courtController.get)
router.post('/', authenticate, authorize('owner'), validateBody(courtCreateSchema), courtController.create)
router.patch('/:id', authenticate, authorize('owner'), validateBody(courtPatchSchema), courtController.update)

export default router
