import hrService from '../services/hrService.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ok, created } from '../utils/response.js'
import { FD_PLUS } from '../config/roles.js'

// Employees
export const listEmployees = asyncHandler(async (req, res) => {
  const isOwner = req.user.role === 'owner'
  const employees = await hrService.listEmployees(isOwner)
  return ok(res, employees)
})

export const createEmployee = asyncHandler(async (req, res) => {
  const employee = await hrService.createEmployee(req.body)
  return created(res, employee)
})

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await hrService.updateEmployee(req.params.id, req.body)
  return ok(res, employee)
})

export const deleteEmployee = asyncHandler(async (req, res) => {
  const result = await hrService.deleteEmployee(req.params.id, req.user.id)
  return ok(res, result)
})

// Shifts
export const listShifts = asyncHandler(async (req, res) => {
  const isOwnerOrFD = FD_PLUS.includes(req.user.role)
  const shifts = await hrService.listShifts({
    isOwnerOrFD,
    userId: req.user.id,
    date: req.query.date,
    from: req.query.from,
    to: req.query.to,
  })
  return ok(res, shifts)
})

export const createShift = asyncHandler(async (req, res) => {
  const shift = await hrService.createShift(req.body)
  return created(res, shift)
})

export const updateShift = asyncHandler(async (req, res) => {
  const shift = await hrService.updateShift(req.params.id, req.body)
  return ok(res, shift)
})

export const deleteShift = asyncHandler(async (req, res) => {
  const result = await hrService.deleteShift(req.params.id)
  return ok(res, result)
})

export const checkIn = asyncHandler(async (req, res) => {
  const result = await hrService.checkIn(req.params.id, req.user.id)
  return ok(res, result)
})

export const checkOut = asyncHandler(async (req, res) => {
  const result = await hrService.checkOut(req.params.id, req.user.id)
  return ok(res, result)
})

// Leave
export const listLeaveRequests = asyncHandler(async (req, res) => {
  const isOwner = req.user.role === 'owner'
  const requests = await hrService.listLeaveRequests({
    isOwner,
    userId: req.user.id,
    status: req.query.status,
  })
  return ok(res, requests)
})

export const myLeaveRequests = asyncHandler(async (req, res) => {
  const requests = await hrService.listLeaveRequests({
    isOwner: false,
    userId: req.user.id,
  })
  return ok(res, requests)
})

export const createLeaveRequest = asyncHandler(async (req, res) => {
  const leave = await hrService.createLeaveRequest(req.user.id, req.body)
  return created(res, leave)
})

export const decideLeaveRequest = asyncHandler(async (req, res) => {
  const decided = await hrService.decideLeaveRequest(req.params.id, req.body, req.user.id)
  return ok(res, decided)
})

// Payroll
export const listPayrollRuns = asyncHandler(async (req, res) => {
  const runs = await hrService.listPayrollRuns()
  return ok(res, runs)
})

export const getPayrollRun = asyncHandler(async (req, res) => {
  const run = await hrService.getPayrollRun(req.params.id)
  return ok(res, run)
})

export const createPayrollRun = asyncHandler(async (req, res) => {
  const run = await hrService.createPayrollRun(req.body.month, req.user.id)
  return created(res, run)
})

export const updatePayslip = asyncHandler(async (req, res) => {
  const slip = await hrService.updatePayslip(req.params.id, req.body)
  return ok(res, slip)
})

export const finalizePayrollRun = asyncHandler(async (req, res) => {
  const run = await hrService.finalizePayrollRun(req.params.id, req.user.id)
  return ok(res, run)
})

export const markPaidPayrollRun = asyncHandler(async (req, res) => {
  const run = await hrService.markPaidPayrollRun(req.params.id, req.user.id)
  return ok(res, run)
})

export default {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  listShifts,
  createShift,
  updateShift,
  deleteShift,
  checkIn,
  checkOut,
  listLeaveRequests,
  myLeaveRequests,
  createLeaveRequest,
  decideLeaveRequest,
  listPayrollRuns,
  getPayrollRun,
  createPayrollRun,
  updatePayslip,
  finalizePayrollRun,
  markPaidPayrollRun,
}
