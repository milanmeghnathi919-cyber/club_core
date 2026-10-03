import React, { useEffect, useState } from 'react'
import financeService from '@/service/financeService'
import { formatCurrency, formatDate } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Card, { CardContent } from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { CreditCard, Plus, AlertCircle, CheckCircle2 } from 'lucide-react'

export const ExpensesPage = () => {
  const toast = useToast()

  const [expenses, setExpenses] = useState([])
  const [payables, setPayables] = useState(null)
  const [loading, setLoading] = useState(true)

  // New Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('utilities')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const [expRes, payRes] = await Promise.all([
        financeService.getExpenses(),
        financeService.getPayables(),
      ])
      setExpenses(expRes.items || [])
      setPayables(payRes)
    } catch {
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  const handleCreateExpense = async (e) => {
    e.preventDefault()
    if (!title || !amount || !dueDate) {
      toast.error('Please complete all required fields')
      return
    }

    setCreating(true)
    try {
      await financeService.createExpense({
        vendor: title,
        title,
        category,
        amount: Number(amount),
        dueDate,
      })
      toast.success('Expense record created')
      setIsModalOpen(false)
      setTitle('')
      setAmount('')
      setDueDate('')
      fetchExpenses()
    } catch (err) {
      toast.error(err.message || 'Failed to save expense')
    } finally {
      setCreating(false)
    }
  }

  const handlePayExpense = async (id) => {
    try {
      await financeService.payExpense(id, { method: 'bank_transfer' })
      toast.success('Expense marked as paid from operating funds')
      fetchExpenses()
    } catch (err) {
      toast.error(err.message || 'Payment update failed')
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
            Operating Expenses
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Expenses & Accounts Payable
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track utility bills, court maintenance contracts, inventory purchasing, and payroll liabilities.
          </p>
        </div>

        <Button variant="lawn" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)} className="font-bold">
          Record Expense
        </Button>
      </div>

      {/* Payables Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 p-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Total Outstanding Payables
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {formatCurrency(payables?.totalDue || 42000)}
          </p>
        </Card>

        <Card className="border-slate-200 p-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Overdue Payables
          </span>
          <p className="text-2xl font-extrabold text-rose-600 mt-1 tabular-nums">
            {formatCurrency(payables?.overdueAmount || 0)}
          </p>
        </Card>

        <Card className="border-slate-200 p-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Primary Cost Center
          </span>
          <p className="text-xl font-bold text-slate-800 mt-1">
            Electricity & Maintenance
          </p>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card className="border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-16 text-center space-y-2 text-slate-400">
            <CreditCard className="w-12 h-12 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">No expense records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Vendor & Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => {
                  const isPaid = e.status === 'paid'

                  return (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {e.title || e.vendor}
                      </td>

                      <td className="py-3 px-4 capitalize text-slate-600 font-medium">
                        {e.category}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(e.dueDate || e.due_date)}
                      </td>

                      <td className="py-3 px-4 font-extrabold text-slate-900 tabular-nums">
                        {formatCurrency(e.amount)}
                      </td>

                      <td className="py-3 px-4">
                        <Badge status={e.status}>{e.status}</Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {!isPaid && (
                          <Button
                            variant="lawn"
                            size="sm"
                            className="text-[11px] py-1"
                            onClick={() => handlePayExpense(e.id)}
                          >
                            Mark Paid
                          </Button>
                        )}
                        {isPaid && (
                          <span className="text-xs font-semibold text-emerald-700 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Record Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Operating Expense"
        subtitle="Log vendor invoice or club facility maintenance bill"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4 py-2">
          <Input
            label="Vendor / Bill Description *"
            placeholder="e.g. BESCOM Monthly Power Bill"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Cost Category *"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="utilities">Utilities & Power</option>
              <option value="maintenance">Court Maintenance</option>
              <option value="supplies">Inventory & Supplies</option>
              <option value="salary">Staff Compensation</option>
              <option value="marketing">Marketing & Events</option>
            </Select>

            <Input
              label="Amount (INR) *"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <Input
            label="Payment Due Date *"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="lawn" type="submit" loading={creating} className="font-bold">
              Record Liability
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ExpensesPage
