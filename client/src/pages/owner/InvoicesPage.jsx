import React, { useEffect, useState } from 'react'
import financeService from '@/service/financeService'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Card, { CardContent } from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Receipt, Plus, Printer, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

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
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text('THE CHAMPIONS CLUB', 105, 18, { align: 'center' })
    doc.setFontSize(10)
    doc.text('Corporate Sports Services Invoice', 105, 24, { align: 'center' })
    doc.text(`Invoice No: ${inv.invoice_no || inv.invoiceNo}`, 14, 34)
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

    doc.autoTable({
      startY: 58,
      head: [['Line Description', 'Qty', 'Unit Rate', 'Subtotal']],
      body: tableRows,
      theme: 'grid',
    })

    const finalY = doc.lastAutoTable.finalY + 10
    doc.text(`Subtotal: ${formatCurrency(inv.subtotal)}`, 140, finalY)
    doc.text(`GST Tax: ${formatCurrency(inv.tax_amount || inv.taxAmount)}`, 140, finalY + 6)
    doc.setFontSize(12)
    doc.text(`TOTAL AMOUNT: ${formatCurrency(inv.total)}`, 140, finalY + 14)
    doc.text(`Balance Due: ${formatCurrency(inv.balance ?? inv.total)}`, 140, finalY + 20)

    doc.save(`Invoice-${inv.invoice_no || 'INV'}.pdf`)
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
            Financial Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Corporate Invoices & Receivables
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage business partner invoicing, tournaments, and payment settlements.
          </p>
        </div>

        <Button
          variant="lawn"
          size="sm"
          icon={Plus}
          onClick={() => setIsCreateModalOpen(true)}
          className="font-bold"
        >
          New Corporate Invoice
        </Button>
      </div>

      <Card className="border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700">No corporate invoices found</h4>
            <p className="text-xs text-slate-400">Issue an invoice to a corporate client.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Issue / Due Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Outstanding Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const isPaid = inv.status === 'paid'
                  const balance = inv.balance ?? (inv.total - (inv.paid_amount || 0))

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {inv.invoice_no || inv.invoiceNo}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <span>Issued: {formatDate(inv.issue_date || inv.issueDate)}</span>
                        <span className="block text-[11px] text-slate-400">
                          Due: {formatDate(inv.due_date || inv.dueDate)}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                        {formatCurrency(inv.total)}
                      </td>

                      <td className="py-3 px-4 font-extrabold text-[#1B4D2E] tabular-nums">
                        {formatCurrency(balance)}
                      </td>

                      <td className="py-3 px-4">
                        <Badge status={inv.overdue ? 'overdue' : inv.status}>
                          {inv.overdue ? 'Overdue' : inv.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPaid && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[11px] py-1 text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => {
                                setPaymentInvoice(inv)
                                setPaymentAmount(balance)
                              }}
                            >
                              Record Payment
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Printer}
                            onClick={() => handlePrintPdf(inv)}
                            className="text-xs p-1.5"
                            title="Download PDF"
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Corporate Invoice Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Corporate Invoice"
        subtitle="Issue formal tax invoice to a corporate client"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 py-2">
          <Select
            label="Corporate Client *"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
          >
            <option value="">Choose Client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.contactPerson || 'Business'})
              </option>
            ))}
          </Select>

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

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <span className="font-bold text-slate-700 block">Service Item</span>
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

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="lawn" type="submit" loading={creating} className="font-bold">
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

          <Select
            label="Settlement Method *"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="bank_transfer">Bank Wire / RTGS / NEFT</option>
            <option value="upi">UPI Corporate Transfer</option>
            <option value="card">Corporate Card</option>
            <option value="cash">Cash Settlement</option>
          </Select>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setPaymentInvoice(null)}>
              Cancel
            </Button>
            <Button variant="lawn" type="submit" loading={recordingPayment} className="font-bold">
              Confirm Payment Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default InvoicesPage
