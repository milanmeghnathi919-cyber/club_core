import { Router } from 'express'
import productController from '../controllers/productController.js'
import { authenticate, authorize } from '../middlewares/auth.js'
import { validateBody } from '../middlewares/validate.js'
import { productCreateSchema, productPatchSchema, stockAdjustSchema } from '../validators/schemas.js'

const router = Router()

// STATIC ROUTES FIRST (before /:id)
router.get('/low-stock', authenticate, authorize('staff'), productController.listLowStock)

router.get('/', authenticate, authorize('staff'), productController.listProducts)
router.post('/', authenticate, authorize('FD+'), validateBody(productCreateSchema), productController.createProduct)

router.get('/:id', authenticate, authorize('staff'), productController.getProduct)
router.patch('/:id', authenticate, authorize('FD+'), validateBody(productPatchSchema), productController.updateProduct)
router.delete('/:id', authenticate, authorize('owner'), productController.deleteProduct)

router.post('/:id/stock', authenticate, authorize('FD+'), validateBody(stockAdjustSchema), productController.adjustStock)
router.get('/:id/movements', authenticate, authorize('staff'), productController.getMovements)

export default router
