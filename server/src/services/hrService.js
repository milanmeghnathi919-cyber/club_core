import bcrypt from 'bcryptjs'
import hrRepository from '../repositories/hrRepository.js'
import userRepository from '../repositories/userRepository.js'
import { expenseRepository } from '../repositories/financeRepository.js'
import notificationService from './notificationService.js'
import ApiError from '../utils/ApiError.js'
import { round2 } from '../utils/money.js'
import { toClubDate } from '../utils/clubTime.js'

export const hrService = {
  // Employees
  async listEmployees(isOwner = false) {
    const list = await hrRepository.listEmployees()
    return list.map((e) => {
      // Rule 9 of P0: front_desk gets sanitized view (id + fullName only)
      if (!isOwner) {
        return {
          id: e.id,
          fullName: e.full_name,
          title: e.title,
        }
      }
      return {
        id: e.id,
        userId: e.user_id,
        fullName: e.full_name,
        title: e.title,
        phone: e.phone,
        email: e.email,
        baseSalary: Number(e.base_salary),
        joinedOn: e.joined_on,
        status: e.status,
        role: e.user_role || (e.title?.toLowerCase().includes('bar') || e.title?.toLowerCase().includes('caf') ? 'bar_staff' : 'front_desk'),
      }
    })
  },

  async createEmployee(data) {
    const cleanEmail = data.email ? String(data.email).toLowerCase().trim() : null
    const cleanPhone = data.phone ? String(data.phone).trim() : null
    let userId = data.userId || data.user_id || null
    const password = data.password ? String(data.password).trim() : 'Staff@123'

    if (cleanEmail && !userId) {
      let existingUser = await userRepository.findByEmail(cleanEmail)
      if (existingUser) {
        userId = existingUser.id
      } else {
        const passwordHash = await bcrypt.hash(password, 10)
        const role = data.role || (data.title?.toLowerCase().includes('bar') || data.department?.toLowerCase().includes('bar') || data.department?.toLowerCase().includes('caf') ? 'bar_staff' : 'front_desk')

        const newUser = await userRepository.create({
          email: cleanEmail,
          passwordHash,
          role,
          name: data.fullName || data.full_name,
          phone: cleanPhone,
          isActive: true,
        })
        userId = newUser.id
      }
    }

    const employee = await hrRepository.createEmployee({
      ...data,
      userId,
      email: cleanEmail,
      phone: cleanPhone,
    })

    return {
      ...employee,
      userId,
      role: data.role || 'front_desk',
      tempPassword: password,
    }
  },

  async updateEmployee(id, data) {
    const emp = await hrRepository.findEmployeeById(id)
    if (!emp) throw new ApiError(404, 'Employee not found', null, 'NOT_FOUND')
    return hrRepository.updateEmployee(id, data)
  },

  async deleteEmployee(id, requestingUserId) {
    const emp = await hrRepository.findEmployeeById(id)
    if (!emp) throw new ApiError(404, 'Employee not found', null, 'NOT_FOUND')

    if (emp.user_id) {
      if (emp.user_id === requestingUserId) {
        throw new ApiError(400, 'Cannot delete your own account', null, 'CANNOT_DELETE_SELF')
      }
      const user = await userRepository.findById(emp.user_id)
      if (user && user.role === 'owner') {
        throw new ApiError(400, 'Cannot delete an owner account', null, 'CANNOT_DELETE_OWNER')
      }
    }

    await hrRepository.deleteEmployee(id)

    if (emp.user_id) {
      try {
        await userRepository.delete(emp.user_id)
      } catch {
        await userRepository.update(emp.user_id, { is_active: false })
      }
    }

    return { message: 'Employee deleted successfully', id }
  },

  // Shifts
  async listShifts({ isOwnerOrFD = false, userId = null, date = null, from = null, to = null } = {}) {
    let employeeId = null
    if (!isOwnerOrFD && userId) {
      const emp = await hrRepository.findEmployeeByUserId(userId)
      if (!emp) return []
      employeeId = emp.id
    }

    return hrRepository.listShifts({ employeeId, date, from, to })
  },

  async createShift(data) {
    const overlapping = await hrRepository.findOverlappingShift(
      data.employeeId,
      data.shiftDate,
      data.startTime,
      data.endTime
    )
    if (overlapping) {
      throw new ApiError(409, 'Employee already has an overlapping shift on this date', null, 'OVERLAPPING_SHIFT')
    }

    return hrRepository.createShift(data)
  },

  async updateShift(id, data) {
    const shift = await hrRepository.findShiftById(id)
    if (!shift) throw new ApiError(404, 'Shift not found', null, 'NOT_FOUND')

    if (data.startTime || data.endTime || data.shiftDate) {
      const overlapping = await hrRepository.findOverlappingShift(
        data.employeeId || shift.employee_id,
        data.shiftDate || shift.shift_date,
        data.startTime || shift.start_time,
        data.endTime || shift.end_time,
        id
      )
      if (overlapping) {
        throw new ApiError(409, 'Overlapping shift on this date', null, 'OVERLAPPING_SHIFT')
      }
    }

    return hrRepository.updateShift(id, data)
  },

  async deleteShift(id) {
    const shift = await hrRepository.findShiftById(id)
    if (!shift) throw new ApiError(404, 'Shift not found', null, 'NOT_FOUND')
    return hrRepository.deleteShift(id)
  },

  async checkIn(id, userId) {
    const shift = await hrRepository.findShiftById(id)
    if (!shift) throw new ApiError(404, 'Shift not found', null, 'NOT_FOUND')

    const emp = await hrRepository.findEmployeeByUserId(userId)
    if (!emp || emp.id !== shift.employee_id) {
      throw new ApiError(403, 'You can only check in to your own shift', null, 'FORBIDDEN')
    }

    return hrRepository.updateShift(id, {
      status: 'checked_in',
      checked_in_at: new Date().toISOString(),
    })
  },

  async checkOut(id, userId) {
    const shift = await hrRepository.findShiftById(id)
    if (!shift) throw new ApiError(404, 'Shift not found', null, 'NOT_FOUND')

    const emp = await hrRepository.findEmployeeByUserId(userId)
    if (!emp || emp.id !== shift.employee_id) {
      throw new ApiError(403, 'You can only check out of your own shift', null, 'FORBIDDEN')
    }

    return hrRepository.updateShift(id, {
      status: 'completed',
      checked_out_at: new Date().toISOString(),
    })
  },

  // Leave Requests
  async listLeaveRequests({ isOwner = false, userId = null, status = null } = {}) {
    let employeeId = null
    if (!isOwner && userId) {
      const emp = await hrRepository.findEmployeeByUserId(userId)
      if (!emp) return []
      employeeId = emp.id
    }
    return hrRepository.listLeaveRequests({ employeeId, status })
  },

  async createLeaveRequest(userId, { type = 'casual', fromDate, toDate, reason }) {
    const emp = await hrRepository.findEmployeeByUserId(userId)
    if (!emp) throw new ApiError(404, 'Employee record not found for this user', null, 'NOT_FOUND')

    const from = new Date(fromDate)
    const to = new Date(toDate)
    const days = Math.round((to - from) / (1000 * 60 * 60 * 24)) + 1

    if (days <= 0) {
      throw new ApiError(422, 'End date must be on or after start date', null, 'INVALID_DATE_RANGE')
    }

    const leave = await hrRepository.createLeaveRequest({
      employeeId: emp.id,
      type,
      fromDate,
      toDate,
      days,
      reason,
    })

    // Notify owners
    notificationService.notify({
      roles: ['owner'],
      type: 'leave_request',
      title: `Leave Request: ${emp.full_name}`,
      body: `${days} day(s) (${type}): ${fromDate} to ${toDate}`,
      link: `/owner/leave-requests/${leave.id}`,
    }).catch(() => {})

    return leave
  },

  async decideLeaveRequest(id, { decision, note }, actorId) {
    const leave = await hrRepository.findLeaveRequestById(id)
    if (!leave) throw new ApiError(404, 'Leave request not found', null, 'NOT_FOUND')

    if (leave.status !== 'pending') {
      throw new ApiError(409, 'This leave request has already been decided', null, 'ALREADY_DECIDED')
    }

    const updated = await hrRepository.updateLeaveRequest(id, {
      status: decision,
      decision_note: note || null,
      decided_by: actorId,
      decided_at: new Date().toISOString(),
    })

    return updated
  },

  // Payroll (P2)
  async listPayrollRuns() {
    return hrRepository.listPayrollRuns()
  },

  async getPayrollRun(id) {
    const run = await hrRepository.findPayrollRunById(id)
    if (!run) throw new ApiError(404, 'Payroll run not found', null, 'NOT_FOUND')
    return run
  },

  async createPayrollRun(month, actorId) {
    const existing = await hrRepository.findPayrollRunByMonth(month)
    if (existing) {
      throw new ApiError(409, `Payroll run for ${month} already exists`, null, 'RUN_EXISTS')
    }

    const run = await hrRepository.createPayrollRun({
      month,
      createdBy: actorId,
    })

    const employees = await hrRepository.listEmployees()
    const activeEmployees = employees.filter((e) => e.status === 'active')

    // Find unpaid leave days approved within this month
    const approvedLeaves = await hrRepository.listLeaveRequests({ status: 'approved' })

    for (const emp of activeEmployees) {
      const base = Number(emp.base_salary || 0)

      // Count unpaid days in month
      let unpaidDays = 0
      const empUnpaidLeaves = approvedLeaves.filter(
        (l) => l.employee_id === emp.id && l.type === 'unpaid' && l.from_date.startsWith(month)
      )
      for (const l of empUnpaidLeaves) {
        unpaidDays += Number(l.days || 0)
      }

      // Rule BR-20: net = base + allowances - deductions - unpaidLeaveDays * base / 30
      const leaveDeduction = round2(unpaidDays * (base / 30))
      const netPay = round2(base - leaveDeduction)

      await hrRepository.addPayslip({
        runId: run.id,
        employeeId: emp.id,
        baseSalary: base,
        allowances: 0,
        deductions: 0,
        unpaidLeaveDays: unpaidDays,
        leaveDeduction,
        netPay,
      })
    }

    return this.getPayrollRun(run.id)
  },

  async updatePayslip(payslipId, updates) {
    const slip = await hrRepository.findPayslipById(payslipId)
    if (!slip) throw new ApiError(404, 'Payslip not found', null, 'NOT_FOUND')

    const run = await hrRepository.findPayrollRunById(slip.run_id)
    if (run.status !== 'draft') {
      throw new ApiError(409, 'Cannot edit payslip on a finalized payroll run', null, 'RUN_LOCKED')
    }

    const base = Number(updates.baseSalary ?? slip.base_salary)
    const allowances = Number(updates.allowances ?? slip.allowances)
    const deductions = Number(updates.deductions ?? slip.deductions)
    const unpaidDays = Number(updates.unpaidLeaveDays ?? slip.unpaid_leave_days)
    const leaveDeduction = round2(unpaidDays * (base / 30))
    const netPay = round2(base + allowances - deductions - leaveDeduction)

    return hrRepository.updatePayslip(payslipId, {
      base_salary: base,
      allowances,
      deductions,
      unpaid_leave_days: unpaidDays,
      leave_deduction: leaveDeduction,
      net_pay: netPay,
    })
  },

  async finalizePayrollRun(id, _actorId) {
    const run = await hrRepository.findPayrollRunById(id)
    if (!run) throw new ApiError(404, 'Payroll run not found', null, 'NOT_FOUND')
    if (run.status !== 'draft') return run

    await hrRepository.updatePayrollRun(id, {
      status: 'finalized',
      finalized_at: new Date().toISOString(),
    })

    return this.getPayrollRun(id)
  },

  async markPaidPayrollRun(id, actorId) {
    const run = await this.getPayrollRun(id)
    if (run.status === 'paid') return run

    const totalSalary = round2((run.payslips || []).reduce((acc, p) => acc + Number(p.net_pay || 0), 0))

    // Rule BR-20: mark-paid writes a salary expense
    await expenseRepository.insert({
      vendor: `Payroll ${run.month}`,
      category: 'salary',
      description: `Staff salaries for ${run.month}`,
      amount: totalSalary,
      taxAmount: 0,
      dueDate: toClubDate(),
      status: 'paid',
      paidAt: new Date().toISOString(),
      paymentMethod: 'bank_transfer',
      createdBy: actorId,
    })

    await hrRepository.updatePayrollRun(id, {
      status: 'paid',
      paid_at: new Date().toISOString(),
    })

    return this.getPayrollRun(id)
  },
}

export default hrService
