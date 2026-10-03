import { Router } from 'express'
import financeController from '../controllers/financeController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

const router = Router()

router.use(authenticate, authorize('owner'))

router.get('/', financeController.listExpenses)
router.post('/', financeController.createExpense)
router.patch('/:id/pay', financeController.payExpense)

export default router
