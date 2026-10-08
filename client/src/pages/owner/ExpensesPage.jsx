import React, { useEffect, useState } from 'react'
import financeService from '@/service/financeService'
import { formatCurrency, formatDate } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { CreditCard, Plus, AlertCircle, CheckCircle2, Zap } from 'lucide-react'

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Operating Expenses
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
            Expenses & Accounts Payable
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track utility bills, court maintenance contracts, inventory purchasing, and payroll liabilities.
          </p>
        </div>

        <Button variant="volt" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)} className="font-black uppercase text-xs">
          Record Expense
        </Button>
      </div>

      {/* Payables Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-[#111418] border border-white/10 p-5 shadow-2xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Total Outstanding Payables
          </span>
          <p className="text-2xl font-black font-mono text-white mt-1.5 tabular-nums">
            {formatCurrency(payables?.totalDue || 42000)}
          </p>
        </div>

        <div className="rounded-3xl bg-[#111418] border border-white/10 p-5 shadow-2xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Overdue Payables
          </span>
          <p className="text-2xl font-black font-mono text-rose-400 mt-1.5 tabular-nums">
            {formatCurrency(payables?.overdueAmount || 0)}
          </p>
        </div>

        <div className="rounded-3xl bg-[#111418] border border-white/10 p-5 shadow-2xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Primary Cost Center
          </span>
          <p className="text-lg font-black uppercase tracking-tight text-[#CCFF00] mt-1.5">
            Electricity & Maintenance
          </p>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-3xl bg-[#111418] border border-white/10 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-16 text-center space-y-2 text-slate-500">
            <CreditCard className="w-12 h-12 mx-auto text-slate-600" />
            <p className="font-bold text-white uppercase">No expense records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">Vendor & Description</th>
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5">Due Date</th>
                  <th className="py-3.5 px-5">Amount</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {expenses.map((e) => {
                  const isPaid = e.status === 'paid'

                  return (
                    <tr key={e.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-white">
                        {e.title || e.vendor}
                      </td>

                      <td className="py-3.5 px-5 capitalize text-slate-300 font-medium">
                        {e.category}
                      </td>

                      <td className="py-3.5 px-5 text-slate-400">
                        {formatDate(e.dueDate || e.due_date)}
                      </td>

                      <td className="py-3.5 px-5 font-black font-mono text-white tabular-nums">
                        {formatCurrency(e.amount)}
                      </td>

                      <td className="py-3.5 px-5">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            isPaid
                              ? 'bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30'
                              : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        {!isPaid && (
                          <button
                            className="text-[11px] font-bold uppercase py-1.5 px-3 rounded-xl text-black bg-[#CCFF00] hover:bg-[#b8e600] shadow-md transition-colors"
                            onClick={() => handlePayExpense(e.id)}
                          >
                            Mark Paid
                          </button>
                        )}
                        {isPaid && (
                          <span className="text-xs font-bold text-[#CCFF00] flex items-center justify-end gap-1 uppercase tracking-wider">
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
      </div>

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
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Cost Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-[#111418] rounded-xl border border-white/10 text-white text-xs focus:outline-none"
              >
                <option value="utilities" className="bg-[#111418] text-white">Utilities & Power</option>
                <option value="maintenance" className="bg-[#111418] text-white">Court Maintenance</option>
                <option value="supplies" className="bg-[#111418] text-white">Inventory & Supplies</option>
                <option value="salary" className="bg-[#111418] text-white">Staff Compensation</option>
                <option value="marketing" className="bg-[#111418] text-white">Marketing & Events</option>
              </select>
            </div>

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

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="volt" type="submit" loading={creating} className="font-black uppercase text-xs">
              Record Liability
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ExpensesPage
