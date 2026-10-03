import { Router } from 'express'
import hrController from '../controllers/hrController.js'
import { authenticate, authorize } from '../middlewares/auth.js'

const router = Router()

router.use(authenticate)

// Employees
router.get('/employees', authorize('FD+'), hrController.listEmployees)
router.post('/employees', authorize('owner'), hrController.createEmployee)
router.patch('/employees/:id', authorize('owner'), hrController.updateEmployee)

// Shifts
router.get('/shifts', hrController.listShifts)
router.post('/shifts', authorize('FD+'), hrController.createShift)
router.patch('/shifts/:id', authorize('FD+'), hrController.updateShift)
router.delete('/shifts/:id', authorize('FD+'), hrController.deleteShift)
router.post('/shifts/:id/check-in', hrController.checkIn)
router.post('/shifts/:id/check-out', hrController.checkOut)

// Leave Requests: STATIC /mine before /:id
router.get('/leave-requests/mine', hrController.myLeaveRequests)
router.get('/leave-requests', authorize('owner'), hrController.listLeaveRequests)
router.post('/leave-requests', hrController.createLeaveRequest)
router.patch('/leave-requests/:id/decision', authorize('owner'), hrController.decideLeaveRequest)

// Payroll Runs (P2)
router.get('/payroll/runs', authorize('owner'), hrController.listPayrollRuns)
router.get('/payroll/runs/:id', authorize('owner'), hrController.getPayrollRun)
router.post('/payroll/runs', authorize('owner'), hrController.createPayrollRun)
router.patch('/payroll/payslips/:id', authorize('owner'), hrController.updatePayslip)
router.post('/payroll/runs/:id/finalize', authorize('owner'), hrController.finalizePayrollRun)
router.post('/payroll/runs/:id/mark-paid', authorize('owner'), hrController.markPaidPayrollRun)

export default router
