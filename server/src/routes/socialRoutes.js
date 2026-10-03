import { Router } from 'express'
import socialController from '../controllers/socialController.js'
import { authenticate, authorize } from '../middlewares/auth.js'
import { validateBody } from '../middlewares/validate.js'
import { socialSessionCreateSchema } from '../validators/schemas.js'

const router = Router()

// STATIC ROUTES FIRST (before /:id)
router.post('/generate', authenticate, authorize('FD+'), socialController.generate)

router.get('/', socialController.list)
router.post('/', authenticate, authorize('FD+'), validateBody(socialSessionCreateSchema), socialController.create)

router.post('/:id/join', authenticate, socialController.join)
router.delete('/:id/participants/:pid', authenticate, socialController.leave)
router.patch('/:id/cancel', authenticate, authorize('FD+'), socialController.cancel)

export default router
