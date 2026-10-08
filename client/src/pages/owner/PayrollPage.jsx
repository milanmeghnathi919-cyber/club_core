import React, { useEffect, useState } from 'react'
import hrService from '@/service/hrService'
import { formatCurrency } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import { Users2, CheckCircle2, Lock, Banknote, Calendar, Printer, Zap } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export const PayrollPage = () => {
  const toast = useToast()
  const [, setRuns] = useState([])
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
      await hrService.createPayrollRun(month)
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
    if (!slip) return
    try {
      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text('THE CHAMPIONS CLUB', 105, 18, { align: 'center' })
      doc.setFontSize(10)
      doc.text(`Employee Payslip Statement — ${month}`, 105, 24, { align: 'center' })

      doc.text(`Employee: ${slip.employeeName || slip.employee_name || 'Staff Member'}`, 14, 36)
      doc.text(`Department: Operations & Clubhouse`, 14, 42)
      doc.text(`Month: ${month}`, 14, 48)

      autoTable(doc, {
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
      toast.success('Payslip PDF downloaded')
    } catch (err) {
      console.error('Payslip PDF error:', err)
      toast.error('Failed to generate Payslip PDF')
    }
  }

  const payslips = selectedRun?.payslips || [
    { employeeName: 'Rajesh Sharma', baseSalary: 120000, allowances: 0, deductions: 0, netSalary: 120000 },
    { employeeName: 'Priya Patel', baseSalary: 35000, allowances: 0, deductions: 0, netSalary: 35000 },
    { employeeName: 'Vikram Singh', baseSalary: 28000, allowances: 0, deductions: 0, netSalary: 28000 },
  ]

  const totalPayroll = payslips.reduce((a, b) => a + (b.netSalary || b.baseSalary || 0), 0)

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Human Resources & Payroll
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
            Monthly Payroll Runs
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Calculate employee compensations, unpaid leave adjustments, and bank disbursements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border border-white/10 text-xs font-bold text-white bg-[#111418] focus:outline-none focus:border-[#CCFF00]/60"
          />
          <Button
            variant="volt"
            size="sm"
            loading={generating}
            onClick={handleGenerateRun}
            className="font-black uppercase text-xs"
          >
            Calculate Payroll
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 rounded-3xl bg-white/5 animate-pulse" />
      ) : (
        <div className="space-y-6">
          {/* Top Run Status Card */}
          <div className="rounded-3xl border border-white/10 p-6 sm:p-8 bg-[#111418] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#CCFF00]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest">
                  Period: {month}
                </span>
                <h3 className="text-3xl font-black font-mono text-white">
                  Monthly Total: <span className="text-[#CCFF00]">{formatCurrency(totalPayroll)}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  3 Full-time employees • Operations, Café & Executive Management
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedRun?.status !== 'finalized' && selectedRun?.status !== 'paid' && (
                  <Button
                    variant="volt"
                    size="sm"
                    icon={Lock}
                    onClick={() => handleFinalize(selectedRun?.id || 'run-01')}
                    className="font-black uppercase text-xs"
                  >
                    Finalize Run
                  </Button>
                )}
                {selectedRun?.status === 'finalized' && (
                  <Button
                    variant="volt"
                    size="sm"
                    icon={Banknote}
                    onClick={() => handleMarkPaid(selectedRun?.id || 'run-01')}
                    className="font-black uppercase text-xs"
                  >
                    Disburse & Mark Paid
                  </Button>
                )}
                {selectedRun?.status === 'paid' && (
                  <span className="px-3 py-1.5 rounded-full bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30 text-xs font-black uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Disbursed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Payslips Table */}
          <div className="rounded-3xl bg-[#111418] border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/10">
              <h3 className="text-base font-black uppercase tracking-tight text-white">Employee Payslips Roster</h3>
              <p className="text-xs text-slate-400">Computed base salaries and net dues</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-5">Employee</th>
                    <th className="py-3.5 px-5">Base Salary</th>
                    <th className="py-3.5 px-5">Allowances</th>
                    <th className="py-3.5 px-5">Deductions</th>
                    <th className="py-3.5 px-5">Net Payable</th>
                    <th className="py-3.5 px-5 text-right">Payslip PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {payslips.map((slip, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-white">
                        {slip.employeeName || slip.employee_name || 'Staff Member'}
                      </td>

                      <td className="py-3.5 px-5 tabular-nums font-mono text-slate-300">
                        {formatCurrency(slip.baseSalary || slip.base_salary)}
                      </td>

                      <td className="py-3.5 px-5 tabular-nums font-mono text-[#CCFF00]">
                        +{formatCurrency(slip.allowances || 0)}
                      </td>

                      <td className="py-3.5 px-5 tabular-nums font-mono text-rose-400">
                        -{formatCurrency(slip.deductions || 0)}
                      </td>

                      <td className="py-3.5 px-5 font-black font-mono text-[#CCFF00] tabular-nums text-sm">
                        {formatCurrency(slip.netSalary || slip.net_salary || slip.baseSalary)}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handlePrintPayslip(slip)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-[#CCFF00] hover:text-black border border-white/10 transition-colors inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PayrollPage
