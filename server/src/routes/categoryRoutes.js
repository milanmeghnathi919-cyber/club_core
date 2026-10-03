import { Router } from 'express'
import productController from '../controllers/productController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

const router = Router()

router.get('/', productController.listCategories)
router.post('/', authenticate, authorize('owner'), productController.createCategory)
router.patch('/:id', authenticate, authorize('owner'), productController.updateCategory)

export default router
