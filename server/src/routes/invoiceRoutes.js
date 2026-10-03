import { Router } from 'express'
import financeController from '../controllers/financeController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

const router = Router()

router.use(authenticate, authorize('owner'))

router.get('/', financeController.listInvoices)
router.post('/', financeController.createInvoice)
router.get('/:id', financeController.getInvoice)
router.patch('/:id', financeController.updateInvoice)
router.patch('/:id/status', financeController.updateInvoice)
router.post('/:id/payments', financeController.payInvoice)

export default router
