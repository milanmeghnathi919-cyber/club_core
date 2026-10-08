import React, { useEffect, useState } from 'react'
import financeService from '@/service/financeService'
import { formatCurrency, formatDate } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Receipt, Plus, Printer, CheckCircle2, AlertCircle, DollarSign, Zap } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export const InvoicesPage = () => {
  const toast = useToast()

  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  // New Invoice Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [clientId, setClientId] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [items, setItems] = useState([
    { description: 'Quarterly Corporate Court Booking', qty: 1, unitPrice: 50000, taxRatePct: 18 },
  ])
  const [creating, setCreating] = useState(false)

  // Record Payment Modal
  const [paymentInvoice, setPaymentInvoice] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [recordingPayment, setRecordingPayment] = useState(false)

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const [invRes, cliRes] = await Promise.all([
        financeService.getInvoices(),
        financeService.getClients(),
      ])
      setInvoices(invRes.items || [])
      setClients(cliRes || [])
    } catch {
      toast.error('Failed to load corporate invoices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const handleCreateInvoice = async (e) => {
    e.preventDefault()
    if (!clientId || !dueDate) {
      toast.error('Please specify client and due date')
      return
    }

    setCreating(true)
    try {
      await financeService.createInvoice({
        clientId,
        category: 'corporate',
        issueDate,
        dueDate,
        items,
      })
      toast.success('Corporate invoice issued successfully!')
      setIsCreateModalOpen(false)
      fetchInvoices()
    } catch (err) {
      toast.error(err.message || 'Failed to create invoice')
    } finally {
      setCreating(false)
    }
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    if (!paymentInvoice || paymentAmount <= 0) return

    setRecordingPayment(true)
    try {
      await financeService.recordInvoicePayment(paymentInvoice.id, {
        method: paymentMethod,
        amount: Number(paymentAmount),
      })
      toast.success('Corporate payment recorded and applied to ledger!')
      setPaymentInvoice(null)
      fetchInvoices()
    } catch (err) {
      toast.error(err.message || 'Payment recording failed')
    } finally {
      setRecordingPayment(false)
    }
  }

  const handlePrintPdf = (inv) => {
    if (!inv) return
    try {
      const doc = new jsPDF()

      doc.setFontSize(18)
      doc.text('THE CHAMPIONS CLUB', 105, 18, { align: 'center' })
      doc.setFontSize(10)
      doc.text('Corporate Sports Services Invoice', 105, 24, { align: 'center' })
      doc.text(`Invoice No: ${inv.invoice_no || inv.invoiceNo || 'INV'}`, 14, 34)
      doc.text(`Issue Date: ${formatDate(inv.issue_date || inv.issueDate)}`, 14, 40)
      doc.text(`Due Date: ${formatDate(inv.due_date || inv.dueDate)}`, 14, 46)
      doc.text(`Status: ${(inv.status || 'Sent').toUpperCase()}`, 14, 52)

      const tableRows = [
        [
          'Quarterly Corporate Sports Venue Retainer',
          '1',
          formatCurrency(inv.subtotal),
          formatCurrency(inv.subtotal),
        ],
      ]

      autoTable(doc, {
        startY: 58,
        head: [['Line Description', 'Qty', 'Unit Rate', 'Subtotal']],
        body: tableRows,
        theme: 'grid',
      })

      const finalY = (doc.lastAutoTable?.finalY ?? 58) + 10
      doc.text(`Subtotal: ${formatCurrency(inv.subtotal)}`, 140, finalY)
      doc.text(`GST Tax: ${formatCurrency(inv.tax_amount || inv.taxAmount)}`, 140, finalY + 6)
      doc.setFontSize(12)
      doc.text(`TOTAL AMOUNT: ${formatCurrency(inv.total)}`, 140, finalY + 14)
      doc.text(`Balance Due: ${formatCurrency(inv.balance ?? inv.total)}`, 140, finalY + 20)

      doc.save(`Invoice-${inv.invoice_no || 'INV'}.pdf`)
      toast.success('Invoice PDF downloaded successfully')
    } catch (err) {
      console.error('Invoice PDF error:', err)
      toast.error('Failed to generate Invoice PDF')
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Financial Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
            Corporate Invoices & Receivables
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage business partner invoicing, tournaments, and payment settlements.
          </p>
        </div>

        <Button
          variant="volt"
          size="sm"
          icon={Plus}
          onClick={() => setIsCreateModalOpen(true)}
          className="font-black uppercase text-xs"
        >
          New Corporate Invoice
        </Button>
      </div>

      <div className="rounded-3xl bg-[#111418] border border-white/10 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Receipt className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="font-black uppercase tracking-tight text-white">No corporate invoices found</h4>
            <p className="text-xs text-slate-400">Issue an invoice to a corporate client.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">Invoice No</th>
                  <th className="py-3.5 px-5">Issue / Due Date</th>
                  <th className="py-3.5 px-5">Total Amount</th>
                  <th className="py-3.5 px-5">Outstanding Balance</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {invoices.map((inv) => {
                  const isPaid = inv.status === 'paid'
                  const balance = inv.balance ?? (inv.total - (inv.paid_amount || 0))

                  return (
                    <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-white">
                        {inv.invoice_no || inv.invoiceNo}
                      </td>

                      <td className="py-3.5 px-5 text-slate-300">
                        <span>Issued: {formatDate(inv.issue_date || inv.issueDate)}</span>
                        <span className="block text-[11px] text-slate-400">
                          Due: {formatDate(inv.due_date || inv.dueDate)}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-white tabular-nums">
                        {formatCurrency(inv.total)}
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-[#CCFF00] tabular-nums">
                        {formatCurrency(balance)}
                      </td>

                      <td className="py-3.5 px-5">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            isPaid
                              ? 'bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30'
                              : inv.overdue
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          }`}
                        >
                          {inv.overdue ? 'Overdue' : inv.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPaid && (
                            <button
                              className="text-[11px] font-bold uppercase py-1.5 px-3 rounded-xl text-black bg-[#CCFF00] hover:bg-[#b8e600] shadow-md"
                              onClick={() => {
                                setPaymentInvoice(inv)
                                setPaymentAmount(balance)
                              }}
                            >
                              Record Payment
                            </button>
                          )}
                          <button
                            onClick={() => handlePrintPdf(inv)}
                            className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                            title="Download PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Corporate Invoice Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Corporate Invoice"
        subtitle="Issue formal tax invoice to a corporate client"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Corporate Client *
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              className="w-full py-2.5 px-3.5 bg-[#111418] rounded-xl border border-white/10 text-white text-xs focus:outline-none"
            >
              <option value="" className="bg-[#111418] text-white">Choose Client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#111418] text-white">
                  {c.name} ({c.contactPerson || 'Business'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Issue Date"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
            />
            <Input
              label="Payment Due Date *"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3 text-xs">
            <span className="font-bold text-white uppercase tracking-wider block">Service Item</span>
            <Input
              label="Description"
              value={items[0].description}
              onChange={(e) => {
                const updated = [...items]
                updated[0].description = e.target.value
                setItems(updated)
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Amount (INR)"
                type="number"
                value={items[0].unitPrice}
                onChange={(e) => {
                  const updated = [...items]
                  updated[0].unitPrice = Number(e.target.value)
                  setItems(updated)
                }}
              />
              <Input
                label="GST Rate %"
                type="number"
                value={items[0].taxRatePct}
                onChange={(e) => {
                  const updated = [...items]
                  updated[0].taxRatePct = Number(e.target.value)
                  setItems(updated)
                }}
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="volt" type="submit" loading={creating} className="font-black uppercase text-xs">
              Issue Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={!!paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        title="Record Invoice Settlement"
        subtitle={`Invoice: ${paymentInvoice?.invoice_no || paymentInvoice?.invoiceNo}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 py-2">
          <Input
            label="Payment Amount (INR) *"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Settlement Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full py-2.5 px-3.5 bg-[#111418] rounded-xl border border-white/10 text-white text-xs focus:outline-none"
            >
              <option value="bank_transfer" className="bg-[#111418] text-white">Bank Wire / RTGS / NEFT</option>
              <option value="upi" className="bg-[#111418] text-white">UPI Corporate Transfer</option>
              <option value="card" className="bg-[#111418] text-white">Corporate Card</option>
              <option value="cash" className="bg-[#111418] text-white">Cash Settlement</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setPaymentInvoice(null)}>
              Cancel
            </Button>
            <Button variant="volt" type="submit" loading={recordingPayment} className="font-black uppercase text-xs">
              Confirm Payment Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default InvoicesPage
