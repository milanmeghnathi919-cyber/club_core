import { Router } from 'express'
import * as authController from '../controllers/authController.js'
import validate, { registerRules, loginRules, changePasswordRules } from '../validators/authValidators.js'
import { authenticate } from '../middlewares/auth.js'

const router = Router()

router.post('/register', validate(registerRules), authController.register)
router.post('/login', validate(loginRules), authController.login)
router.post('/logout', authController.logout)
router.get('/me', authenticate, authController.me)
router.post('/change-password', authenticate, validate(changePasswordRules), authController.changePassword)

export default router