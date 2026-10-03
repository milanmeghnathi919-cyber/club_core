import { Router } from 'express'
import * as authController from '../controllers/authController.js'
import validate from '../validators/authValidators.js'
import { registerRules, loginRules } from '../validators/authValidators.js'

const router = Router()

router.post('/register', validate(registerRules), authController.register)
router.post('/login', validate(loginRules), authController.login)
router.post('/logout', authController.logout)

export default router