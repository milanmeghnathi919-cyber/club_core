import barService from '../services/barService.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ok, created } from '../utils/response.js'

// Menu
export const listMenu = asyncHandler(async (req, res) => {
  const items = await barService.listMenu(req.query.isAvailable === 'true' ? true : undefined)
  return ok(res, items)
})

export const createMenuItem = asyncHandler(async (req, res) => {
  const item = await barService.createMenuItem(req.body)
  return created(res, item)
})

export const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await barService.updateMenuItem(req.params.id, req.body)
  return ok(res, item)
})

export const deleteMenuItem = asyncHandler(async (req, res) => {
  await barService.deleteMenuItem(req.params.id)
  return ok(res, { deleted: true })
})

// Tables
export const listTables = asyncHandler(async (req, res) => {
  const tables = await barService.listTables()
  return ok(res, tables)
})

export const createTable = asyncHandler(async (req, res) => {
  const table = await barService.createTable(req.body)
  return created(res, table)
})

// Tabs
export const listTabs = asyncHandler(async (req, res) => {
  const tabs = await barService.listTabs(req.query)
  return ok(res, tabs)
})

export const openTab = asyncHandler(async (req, res) => {
  const tab = await barService.openTab({
    ...req.body,
    actorId: req.user.id,
  })
  return created(res, tab)
})

export const getTab = asyncHandler(async (req, res) => {
  const tab = await barService.getTab(req.params.id)
  return ok(res, tab)
})

export const addItem = asyncHandler(async (req, res) => {
  if (Array.isArray(req.body.items)) {
    let updatedTab
    for (const item of req.body.items) {
      updatedTab = await barService.addItem(req.params.id, {
        ...item,
        actorId: req.user.id,
      })
    }
    return ok(res, updatedTab)
  }

  const updated = await barService.addItem(req.params.id, {
    ...req.body,
    actorId: req.user.id,
  })
  return ok(res, updated)
})

export const updateItem = asyncHandler(async (req, res) => {
  const updated = await barService.updateItem(req.params.id, req.params.itemId, req.body)
  return ok(res, updated)
})

export const cancelItem = asyncHandler(async (req, res) => {
  const updated = await barService.cancelItem(req.params.id, req.params.itemId, req.user.id)
  return ok(res, updated)
})

export const attachMember = asyncHandler(async (req, res) => {
  const updated = await barService.attachMember(req.params.id, req.body.memberId)
  return ok(res, updated)
})

export const moveTable = asyncHandler(async (req, res) => {
  const updated = await barService.moveTable(req.params.id, req.body.tableId)
  return ok(res, updated)
})

export const settle = asyncHandler(async (req, res) => {
  const settled = await barService.settle(req.params.id, {
    payments: req.body.payments,
    actorId: req.user.id,
  })
  return ok(res, settled)
})

export const voidTab = asyncHandler(async (req, res) => {
  const voided = await barService.voidTab(req.params.id, {
    reason: req.body.reason,
    actorId: req.user.id,
  })
  return ok(res, voided)
})

// Kitchen
export const getKitchenQueue = asyncHandler(async (req, res) => {
  const queue = await barService.getKitchenQueue(req.query.station)
  return ok(res, queue)
})

export const updateKitchenStatus = asyncHandler(async (req, res) => {
  const updated = await barService.updateKitchenStatus(req.params.itemId, req.body.status)
  return ok(res, updated)
})

// Summary
export const getSummary = asyncHandler(async (req, res) => {
  const summary = await barService.getSummary(req.query.date)
  return ok(res, summary)
})

export default {
  listMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  listTables,
  createTable,
  listTabs,
  openTab,
  getTab,
  addItem,
  updateItem,
  cancelItem,
  attachMember,
  moveTable,
  settle,
  voidTab,
  getKitchenQueue,
  updateKitchenStatus,
  getSummary,
}
