import React, { useEffect, useState } from 'react'
import hrService from '@/service/hrService'
import { formatCurrency } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Users2, CheckCircle2, Lock, Banknote, Calendar, Printer } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const PayrollPage = () => {
  const toast = useToast()
  const [runs, setRuns] = useState([])
  const [selectedRun, setSelectedRun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [month, setMonth] = useState('2026-10')

  const fetchPayroll = async () => {
    setLoading(true)
    try {
      const data = await hrService.getPayrollRuns()
      setRuns(data || [])
      if (data && data.length > 0) {
        setSelectedRun(data[0])
      }
    } catch {
      toast.error('Failed to load payroll runs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayroll()
  }, [])

  const handleGenerateRun = async () => {
    setGenerating(true)
    try {
      const res = await hrService.createPayrollRun(month)
      toast.success(`Generated payroll run for ${month}!`)
      fetchPayroll()
    } catch (err) {
      if (err.code === 'CONFLICT' || err.status === 409) {
        toast.info(`Payroll run for ${month} already exists.`)
      } else {
        toast.error(err.message || 'Failed to generate payroll')
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleFinalize = async (runId) => {
    try {
      await hrService.finalizePayrollRun(runId)
      toast.success('Payroll run locked & finalized')
      fetchPayroll()
    } catch (err) {
      toast.error(err.message || 'Finalization failed')
    }
  }

  const handleMarkPaid = async (runId) => {
    try {
      await hrService.markPayrollPaid(runId, 'bank_transfer')
      toast.success('Payroll disbursed and expense ledger updated!')
      fetchPayroll()
    } catch (err) {
      toast.error(err.message || 'Payment mark failed')
    }
  }

  const handlePrintPayslip = (slip) => {
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text('THE CHAMPIONS CLUB', 105, 18, { align: 'center' })
    doc.setFontSize(10)
    doc.text(`Employee Payslip Statement — ${month}`, 105, 24, { align: 'center' })

    doc.text(`Employee: ${slip.employeeName || slip.employee_name || 'Staff Member'}`, 14, 36)
    doc.text(`Department: Operations & Clubhouse`, 14, 42)
    doc.text(`Month: ${month}`, 14, 48)

    doc.autoTable({
      startY: 54,
      head: [['Salary Component', 'Amount']],
      body: [
        ['Base Salary', formatCurrency(slip.baseSalary || slip.base_salary || 35000)],
        ['Allowances & Incentives', formatCurrency(slip.allowances || 0)],
        ['Deductions', formatCurrency(slip.deductions || 0)],
        ['Unpaid Leave Deductions', `-${formatCurrency(slip.unpaidLeaveDeduction || 0)}`],
        ['NET PAYABLE DISBURSEMENT', formatCurrency(slip.netSalary || slip.net_salary || 35000)],
      ],
      theme: 'grid',
    })

    doc.save(`Payslip-${slip.employeeName || 'Staff'}-${month}.pdf`)
  }

  const payslips = selectedRun?.payslips || [
    { employeeName: 'Rajesh Sharma', baseSalary: 120000, allowances: 0, deductions: 0, netSalary: 120000 },
    { employeeName: 'Priya Patel', baseSalary: 35000, allowances: 0, deductions: 0, netSalary: 35000 },
    { employeeName: 'Vikram Singh', baseSalary: 28000, allowances: 0, deductions: 0, netSalary: 28000 },
  ]

  const totalPayroll = payslips.reduce((a, b) => a + (b.netSalary || b.baseSalary || 0), 0)

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
            Human Resources & Payroll
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Monthly Payroll Runs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Calculate employee compensations, unpaid leave adjustments, and bank disbursements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white"
          />
          <Button
            variant="lawn"
            size="sm"
            loading={generating}
            onClick={handleGenerateRun}
            className="font-bold text-xs"
          >
            Calculate Payroll Run
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <div className="space-y-6">
          {/* Top Run Status Card */}
          <Card className="border-slate-200 p-6 bg-slate-900 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  Period: {month}
                </span>
                <h3 className="text-2xl font-extrabold text-white">
                  Monthly Total: {formatCurrency(totalPayroll)}
                </h3>
                <p className="text-xs text-slate-400">
                  3 Full-time employees • Operations, Café & Executive
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedRun?.status !== 'finalized' && selectedRun?.status !== 'paid' && (
                  <Button
                    variant="clay"
                    size="sm"
                    icon={Lock}
                    onClick={() => handleFinalize(selectedRun?.id || 'run-01')}
                    className="font-bold"
                  >
                    Finalize Run
                  </Button>
                )}
                {selectedRun?.status === 'finalized' && (
                  <Button
                    variant="lawn"
                    size="sm"
                    icon={Banknote}
                    onClick={() => handleMarkPaid(selectedRun?.id || 'run-01')}
                    className="font-bold bg-emerald-700"
                  >
                    Disburse & Mark Paid
                  </Button>
                )}
                {selectedRun?.status === 'paid' && (
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Disbursed
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Payslips Table */}
          <Card className="border-slate-200 overflow-hidden">
            <CardHeader title="Employee Payslips Roster" subtitle="Computed base salaries and net dues" />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Base Salary</th>
                    <th className="py-3 px-4">Allowances</th>
                    <th className="py-3 px-4">Deductions</th>
                    <th className="py-3 px-4">Net Payable</th>
                    <th className="py-3 px-4 text-right">Payslip PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payslips.map((slip, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {slip.employeeName || slip.employee_name || 'Staff Member'}
                      </td>

                      <td className="py-3 px-4 tabular-nums text-slate-700">
                        {formatCurrency(slip.baseSalary || slip.base_salary)}
                      </td>

                      <td className="py-3 px-4 tabular-nums text-emerald-700">
                        +{formatCurrency(slip.allowances || 0)}
                      </td>

                      <td className="py-3 px-4 tabular-nums text-rose-600">
                        -{formatCurrency(slip.deductions || 0)}
                      </td>

                      <td className="py-3 px-4 font-extrabold text-[#1B4D2E] tabular-nums text-sm">
                        {formatCurrency(slip.netSalary || slip.net_salary || slip.baseSalary)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Printer}
                          onClick={() => handlePrintPayslip(slip)}
                          className="text-xs"
                        >
                          Print Slip
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default PayrollPage
