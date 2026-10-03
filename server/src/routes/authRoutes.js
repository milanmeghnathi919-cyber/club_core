import { Router } from 'express'
import authController from '../controllers/authController.js'
import { authenticate } from '../middlewares/auth.js'
import { validateBody } from '../middlewares/validate.js'
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/schemas.js'

const router = Router()

router.post('/register', validateBody(registerSchema), authController.register)
router.post('/login', validateBody(loginSchema), authController.login)
router.post('/logout', authenticate, authController.logout)
router.get('/me', authenticate, authController.me)
router.patch('/password', authenticate, validateBody(changePasswordSchema), authController.changePassword)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)

export default router