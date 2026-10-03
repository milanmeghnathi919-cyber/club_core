import { Router } from 'express'
import memberController from '../controllers/memberController.js'
import { authenticate, authorize } from '../middlewares/auth.js'
import { validateBody } from '../middlewares/validate.js'
import { memberCreateSchema, memberPatchSchema } from '../validators/schemas.js'

const router = Router()

// STATIC ROUTES FIRST (before /:id)
router.get('/lookup', authenticate, authorize('staff'), memberController.lookup)

router.get('/', authenticate, authorize('FD+'), memberController.list)
router.post('/', authenticate, authorize('FD+'), validateBody(memberCreateSchema), memberController.create)

router.get('/:id', authenticate, authorize('staff', 'member'), memberController.get)
router.patch('/:id', authenticate, authorize('FD+'), validateBody(memberPatchSchema), memberController.update)
router.delete('/:id', authenticate, authorize('owner'), memberController.deleteMember)
router.get('/:id/history', authenticate, authorize('staff', 'member'), memberController.history)
router.post('/:id/memberships', authenticate, authorize('FD+'), memberController.assignMembership)

export default router