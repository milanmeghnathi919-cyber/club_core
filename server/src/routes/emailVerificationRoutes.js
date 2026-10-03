import { Router } from 'express'
import * as emailVerificationController from '../controllers/emailVerificationController.js'
import { authenticate } from '../middlewares/auth.js'

const router = Router()

router.use(authenticate)

router.get('/status', emailVerificationController.status)
router.post('/send-code', emailVerificationController.sendCode)
router.post('/resend', emailVerificationController.resendCode)
router.post('/verify', emailVerificationController.verifyCode)

export default router