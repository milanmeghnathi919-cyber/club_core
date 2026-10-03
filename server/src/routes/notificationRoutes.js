import { Router } from 'express'
import notificationController from '../controllers/notificationController.js'
import { authenticate } from '../middlewares/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', notificationController.list)
router.post('/read-all', notificationController.markAllRead)
router.patch('/:id/read', notificationController.markRead)

export default router
