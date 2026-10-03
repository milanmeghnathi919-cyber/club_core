import { Router } from 'express'
import * as userController from '../controllers/userController.js'
import { authenticate, staffOnly, managerOnly, adminOnly } from '../middlewares/auth.js'

const router = Router()

router.use(authenticate)

// any staff member may look up other users
router.get('/', staffOnly, userController.listUsers)
router.get('/:id', staffOnly, userController.getUser)

// managers may adjust name, phone and role
router.patch('/:id', managerOnly, userController.updateUser)

// only an admin may create or remove accounts
router.post('/', adminOnly, userController.createUser)
router.delete('/:id', adminOnly, userController.deleteUser)

export default router