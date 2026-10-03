import financeService from '../services/financeService.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ok, created } from '../utils/response.js'

// Clients
export const listClients = asyncHandler(async (req, res) => {
  const clients = await financeService.listClients()
  return ok(res, clients)
})

export const createClient = asyncHandler(async (req, res) => {
  const client = await financeService.createClient(req.body)
  return created(res, client)
})

export const updateClient = asyncHandler(async (req, res) => {
  const client = await financeService.updateClient(req.params.id, req.body)
  return ok(res, client)
})

// Invoices
export const listInvoices = asyncHandler(async (req, res) => {
  const invoices = await financeService.listInvoices(req.query)
  return ok(res, invoices)
})

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await financeService.getInvoice(req.params.id)
  return ok(res, invoice)
})

export const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await financeService.createInvoice({
    ...req.body,
    actorId: req.user.id,
  })
  return created(res, invoice)
})

export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await financeService.updateInvoice(req.params.id, req.body)
  return ok(res, invoice)
})

export const payInvoice = asyncHandler(async (req, res) => {
  const invoice = await financeService.payInvoice(req.params.id, {
    amount: req.body.amount,
    method: req.body.method,
    actorId: req.user.id,
  })
  return ok(res, invoice)
})

// Expenses
export const listExpenses = asyncHandler(async (req, res) => {
  const expenses = await financeService.listExpenses(req.query)
  return ok(res, expenses)
})

export const createExpense = asyncHandler(async (req, res) => {
  const expense = await financeService.createExpense(req.body, req.user.id)
  return created(res, expense)
})

export const payExpense = asyncHandler(async (req, res) => {
  const expense = await financeService.payExpense(req.params.id, {
    method: req.body.method,
    actorId: req.user.id,
  })
  return ok(res, expense)
})

export const getPayables = asyncHandler(async (req, res) => {
  const payables = await financeService.getPayablesReport()
  return ok(res, payables)
})

export default {
  listClients,
  createClient,
  updateClient,
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  payInvoice,
  listExpenses,
  createExpense,
  payExpense,
  getPayables,
}
