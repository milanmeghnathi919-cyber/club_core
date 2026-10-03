import { query, queryOne } from '../utils/db.js'
import memoryStore from '../utils/memoryStore.js'

export const hrRepository = {
  // Employees
  async listEmployees() {
    try {
      const rows = await query(`
        SELECT e.*,
               u.role as user_role,
               u.is_active as user_active
        FROM public.employees e
        LEFT JOIN public.users u ON e.user_id = u.id
        ORDER BY e.full_name ASC
      `)
      if (rows && rows.length > 0) return rows
    } catch (err) {
      console.error('[hrRepository.listEmployees DB error]', err.message)
    }

    let items = memoryStore.find('employees')
    const users = memoryStore.find('users') || []
    const userMap = new Map(users.map((u) => [u.id, u]))
    const enriched = items.map((e) => {
      const u = userMap.get(e.user_id)
      return {
        ...e,
        user_role: u?.role || null,
        user_active: u?.is_active ?? true,
      }
    })
    enriched.sort((a, b) => a.full_name.localeCompare(b.full_name))
    return enriched
  },

  async findEmployeeById(id) {
    try {
      const row = await queryOne('select * from public.employees where id = $1', [id])
      if (row) return row
    } catch {}
    return memoryStore.findOne('employees', (e) => e.id === id)
  },

  async findEmployeeByUserId(userId) {
    try {
      const row = await queryOne('select * from public.employees where user_id = $1', [userId])
      if (row) return row
    } catch {}
    return memoryStore.findOne('employees', (e) => e.user_id === userId)
  },

  async createEmployee(data) {
    try {
      const row = await queryOne(
        `INSERT INTO public.employees
           (user_id, full_name, title, phone, email, base_salary, joined_on, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          data.userId || data.user_id || null,
          data.fullName || data.full_name,
          data.title || null,
          data.phone || null,
          data.email || null,
          Number(data.baseSalary || data.base_salary || 0),
          data.joinedOn || data.joined_on || new Date().toISOString().slice(0, 10),
          data.status || 'active',
        ]
      )
      if (row) {
        memoryStore.insert('employees', row)
        return row
      }
    } catch (err) {
      console.error('[hrRepository.createEmployee DB error]', err.message)
    }

    return memoryStore.insert('employees', {
      id: data.id || crypto.randomUUID(),
      user_id: data.userId || data.user_id || null,
      full_name: data.fullName || data.full_name,
      title: data.title || null,
      phone: data.phone || null,
      email: data.email || null,
      base_salary: Number(data.baseSalary || data.base_salary || 0),
      joined_on: data.joinedOn || data.joined_on || new Date().toISOString().slice(0, 10),
      status: data.status || 'active',
      created_at: new Date().toISOString(),
    })
  },

  async updateEmployee(id, updates) {
    try {
      const sets = []
      const vals = []
      let idx = 1
      for (const [k, v] of Object.entries(updates)) {
        const col = k.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase())
        sets.push(`${col} = $${idx++}`)
        vals.push(v)
      }
      vals.push(id)
      const row = await queryOne(`update public.employees set ${sets.join(', ')} where id = $${idx} returning *`, vals)
      if (row) {
        memoryStore.update('employees', (e) => e.id === id, row)
        return row
      }
    } catch {}
    return memoryStore.update('employees', (e) => e.id === id, updates)
  },

  // Shifts
  async listShifts({ employeeId, date, from, to } = {}) {
    let items = memoryStore.find('shifts')
    if (employeeId) items = items.filter((s) => s.employee_id === employeeId)
    if (date) items = items.filter((s) => s.shift_date === date)
    if (from) items = items.filter((s) => s.shift_date >= from)
    if (to) items = items.filter((s) => s.shift_date <= to)
    items.sort((a, b) => new Date(`${a.shift_date}T${a.start_time}`) - new Date(`${b.shift_date}T${b.start_time}`))
    return items
  },

  async findShiftById(id) {
    return memoryStore.findOne('shifts', (s) => s.id === id)
  },

  async findOverlappingShift(employeeId, shiftDate, startTime, endTime, excludeId = null) {
    return memoryStore.findOne(
      'shifts',
      (s) =>
        s.employee_id === employeeId &&
        s.shift_date === shiftDate &&
        s.status !== 'missed' &&
        s.start_time < endTime &&
        s.end_time > startTime &&
        (!excludeId || s.id !== excludeId)
    )
  },

  async createShift(data) {
    return memoryStore.insert('shifts', {
      id: data.id || crypto.randomUUID(),
      employee_id: data.employeeId || data.employee_id,
      shift_date: data.shiftDate || data.shift_date,
      start_time: data.startTime || data.start_time,
      end_time: data.endTime || data.end_time,
      area: data.area || 'front_desk',
      status: 'scheduled',
      checked_in_at: null,
      checked_out_at: null,
      created_at: new Date().toISOString(),
    })
  },

  async updateShift(id, updates) {
    return memoryStore.update('shifts', (s) => s.id === id, updates)
  },

  async deleteShift(id) {
    return memoryStore.delete('shifts', (s) => s.id === id)
  },

  // Leave Requests
  async listLeaveRequests({ employeeId, status } = {}) {
    let items = memoryStore.find('leave_requests')
    if (employeeId) items = items.filter((l) => l.employee_id === employeeId)
    if (status) items = items.filter((l) => l.status === status)
    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return items
  },

  async findLeaveRequestById(id) {
    return memoryStore.findOne('leave_requests', (l) => l.id === id)
  },

  async createLeaveRequest(data) {
    return memoryStore.insert('leave_requests', {
      id: data.id || crypto.randomUUID(),
      employee_id: data.employeeId || data.employee_id,
      type: data.type || 'casual',
      from_date: data.fromDate || data.from_date,
      to_date: data.toDate || data.to_date,
      days: Number(data.days || 1),
      reason: data.reason || null,
      status: 'pending',
      decided_by: null,
      decided_at: null,
      decision_note: null,
      created_at: new Date().toISOString(),
    })
  },

  async updateLeaveRequest(id, updates) {
    return memoryStore.update('leave_requests', (l) => l.id === id, updates)
  },

  // Payroll
  async findPayrollRunByMonth(month) {
    return memoryStore.findOne('payroll_runs', (r) => r.month === month)
  },

  async findPayrollRunById(id) {
    const run = memoryStore.findOne('payroll_runs', (r) => r.id === id)
    if (!run) return null
    const slips = memoryStore.find('payslips', (p) => p.run_id === id)
    return { ...run, payslips: slips }
  },

  async listPayrollRuns() {
    let items = memoryStore.find('payroll_runs')
    items.sort((a, b) => b.month.localeCompare(a.month))
    return items
  },

  async createPayrollRun(data) {
    return memoryStore.insert('payroll_runs', {
      id: data.id || crypto.randomUUID(),
      month: data.month,
      status: 'draft',
      created_by: data.createdBy || data.created_by || null,
      finalized_at: null,
      paid_at: null,
      created_at: new Date().toISOString(),
    })
  },

  async updatePayrollRun(id, updates) {
    return memoryStore.update('payroll_runs', (r) => r.id === id, updates)
  },

  async addPayslip(data) {
    return memoryStore.insert('payslips', {
      id: data.id || crypto.randomUUID(),
      run_id: data.runId || data.run_id,
      employee_id: data.employeeId || data.employee_id,
      base_salary: Number(data.baseSalary || data.base_salary || 0),
      allowances: Number(data.allowances || 0),
      deductions: Number(data.deductions || 0),
      unpaid_leave_days: Number(data.unpaidLeaveDays || data.unpaid_leave_days || 0),
      leave_deduction: Number(data.leaveDeduction || data.leave_deduction || 0),
      net_pay: Number(data.netPay || data.net_pay || 0),
      created_at: new Date().toISOString(),
    })
  },

  async updatePayslip(id, updates) {
    return memoryStore.update('payslips', (p) => p.id === id, updates)
  },

  async findPayslipById(id) {
    return memoryStore.findOne('payslips', (p) => p.id === id)
  },
}

export default hrRepository
