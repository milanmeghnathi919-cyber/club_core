import { Router } from 'express'
import settingsController from '../controllers/settingsController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

const router = Router()

router.get('/', authenticate, authorize('staff'), settingsController.get)
router.patch('/', authenticate, authorize('owner'), settingsController.update)

export default router
