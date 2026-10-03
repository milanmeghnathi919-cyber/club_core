import { Router } from 'express'
import reportsController from '../controllers/reportsController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

const router = Router()

router.use(authenticate)

router.get('/dashboard', authorize('FD+'), reportsController.getDashboard)
router.get('/revenue', authorize('owner'), reportsController.getRevenue)
router.get('/tax', authorize('owner'), reportsController.getTax)
router.get('/payables', authorize('owner'), reportsController.getPayables)
router.get('/export/:type', authorize('owner'), reportsController.exportReport)
router.post('/email', authorize('owner'), reportsController.emailReport)

export default router
