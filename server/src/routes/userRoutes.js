import { Router } from 'express'
import * as userController from '../controllers/userController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', authorize('admin'), userController.listUsers)
router.get('/:id', userController.getUser)
router.delete('/:id', authorize('admin'), userController.deleteUser)

export default router