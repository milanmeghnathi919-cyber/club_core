import { Router } from 'express'
import financeController from '../controllers/financeController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

const router = Router()

router.use(authenticate, authorize('owner'))

router.get('/', financeController.listClients)
router.post('/', financeController.createClient)
router.patch('/:id', financeController.updateClient)

export default router
