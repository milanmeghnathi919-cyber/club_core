import { Router } from 'express'
import barController from '../controllers/barController.js'
import { authenticate, authorize } from '../middlewares/auth.js'
import { validateBody } from '../middlewares/validate.js'
import { barTabOpenSchema, barTabAddItemSchema, barTabSettleSchema } from '../validators/schemas.js'

const router = Router()

// Menu
router.get('/menu', authenticate, authorize('staff'), barController.listMenu)
router.post('/menu', authenticate, authorize('owner'), barController.createMenuItem)
router.patch('/menu/:id', authenticate, authorize('staff'), barController.updateMenuItem)

// Tables
router.get('/tables', authenticate, authorize('staff'), barController.listTables)
router.post('/tables', authenticate, authorize('owner'), barController.createTable)

// STATIC ROUTES FIRST (before /tabs/:id)
router.get('/kitchen', authenticate, authorize('staff'), barController.getKitchenQueue)
router.patch('/kitchen/:itemId/status', authenticate, authorize('staff'), barController.updateKitchenStatus)
router.patch('/items/:itemId/kitchen-status', authenticate, authorize('staff'), barController.updateKitchenStatus)
router.get('/summary', authenticate, authorize('staff'), barController.getSummary)

// Tabs
router.get('/tabs', authenticate, authorize('staff'), barController.listTabs)
router.post('/tabs', authenticate, authorize('staff'), validateBody(barTabOpenSchema), barController.openTab)
router.get('/tabs/:id', authenticate, authorize('staff'), barController.getTab)

router.post('/tabs/:id/items', authenticate, authorize('staff'), validateBody(barTabAddItemSchema), barController.addItem)
router.patch('/tabs/:id/items/:itemId', authenticate, authorize('staff'), barController.updateItem)
router.delete('/tabs/:id/items/:itemId', authenticate, authorize('staff'), barController.cancelItem)

router.patch('/tabs/:id/member', authenticate, authorize('staff'), barController.attachMember)
router.patch('/tabs/:id/table', authenticate, authorize('staff'), barController.moveTable)
router.patch('/tabs/:id/move-table', authenticate, authorize('staff'), barController.moveTable)
router.post('/tabs/:id/settle', authenticate, authorize('staff'), validateBody(barTabSettleSchema), barController.settle)
router.post('/tabs/:id/void', authenticate, authorize('FD+'), barController.voidTab)

export default router
