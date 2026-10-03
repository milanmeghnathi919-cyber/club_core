import { Router } from 'express'
import leadController from '../controllers/leadController.js'
import { authenticate, authorize } from '../middlewares/auth.js'
import { validateBody } from '../middlewares/validate.js'
import { leadCreateSchema } from '../validators/schemas.js'

const router = Router()

// STATIC ROUTES FIRST (before /:id)
router.get('/follow-ups', authenticate, authorize('FD+'), leadController.getFollowUps)

router.get('/', authenticate, authorize('FD+'), leadController.list)
router.post('/', authenticate, authorize('FD+'), validateBody(leadCreateSchema), leadController.create)

router.get('/:id', authenticate, authorize('FD+'), leadController.get)
router.patch('/:id', authenticate, authorize('FD+'), leadController.update)
router.post('/:id/activities', authenticate, authorize('FD+'), leadController.addActivity)
router.post('/:id/quotes', authenticate, authorize('FD+'), leadController.addQuote)
router.post('/:id/convert', authenticate, authorize('FD+'), leadController.convert)

export default router
