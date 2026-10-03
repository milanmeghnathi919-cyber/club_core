import { Router } from 'express'
import * as authController from '../controllers/authController.js'
import emailVerificationRoutes from './emailVerificationRoutes.js'
import validate, { registerRules, loginRules, changePasswordRules, verifyCodeRules } from '../validators/authValidators.js'
import { authenticate } from '../middlewares/auth.js'

const router = Router()

router.post('/register', validate(registerRules), authController.register)
router.post('/login', validate(loginRules), authController.login)
router.post('/logout', authController.logout)
router.get('/me', authenticate, authController.me)
router.post('/change-password', authenticate, validate(changePasswordRules), authController.changePassword)

// POST /api/auth/email/verify | /send-code | /resend | GET /status
router.use('/email', emailVerificationRoutes)

export default router