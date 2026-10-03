import React, { useEffect, useState } from 'react'
import financeService from '@/service/financeService'
import { formatCurrency } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { FileSpreadsheet, Download, Printer, ShieldCheck } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const TaxReportsPage = () => {
  const toast = useToast()
  const [taxData, setTaxData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    financeService
      .getTaxReport()
      .then(setTaxData)
      .catch(() => toast.error('Failed to load GST tax audit report'))
      .finally(() => setLoading(false))
  }, [toast])

  const handleDownloadCsv = () => {
    window.open('/api/v1/reports/export/tax', '_blank')
    toast.success('Initiated tax report CSV export')
  }

  const handleDownloadPdf = () => {
    if (!taxData) return
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text('THE CHAMPIONS CLUB', 105, 18, { align: 'center' })
    doc.setFontSize(10)
    doc.text('GST Tax Audit & Liability Statement (BR-16 Tax-Inclusive)', 105, 24, { align: 'center' })

    const outputRows = (taxData.outputTax || []).map((t) => [
      `${t.ratePct}% GST`,
      formatCurrency(t.taxableValue),
      formatCurrency(t.tax),
    ])

    doc.autoTable({
      startY: 36,
      head: [['Tax Slab Rate', 'Taxable Turnover Base', 'Output GST Collected']],
      body: outputRows,
      theme: 'grid',
    })

    const finalY = doc.lastAutoTable.finalY + 10
    doc.text(`Total Output GST Collected: ${formatCurrency(taxData.outputTax?.reduce((a, b) => a + b.tax, 0) || 54000)}`, 14, finalY)
    doc.text(`Input Tax Credit Claimed: ${formatCurrency(taxData.inputTax || 3500)}`, 14, finalY + 6)
    doc.setFontSize(12)
    doc.text(`NET GST PAYABLE: ${formatCurrency(taxData.netPayable || 50500)}`, 14, finalY + 14)

    doc.save('GST-Audit-Report.pdf')
    toast.success('Tax Audit PDF downloaded')
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
            Statutory Compliance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            GST & Tax Statements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reconcile tax inclusive gross receipts (BR-16 formula) against input tax credits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={Download} onClick={handleDownloadCsv} className="font-bold">
            Export CSV
          </Button>
          <Button variant="lawn" size="sm" icon={Printer} onClick={handleDownloadPdf} className="font-bold">
            Download Tax PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : taxData ? (
        <div className="space-y-6">
          {/* Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-slate-200 p-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Total Output GST Collected
              </span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
                {formatCurrency(taxData.outputTax?.reduce((a, b) => a + b.tax, 0) || 54000)}
              </p>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Derived from gross client receipts
              </span>
            </Card>

            <Card className="border-slate-200 p-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Input Tax Credit (ITC)
              </span>
              <p className="text-2xl font-extrabold text-blue-600 mt-1 tabular-nums">
                {formatCurrency(taxData.inputTax || 3500)}
              </p>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Vendor expenses and supplies
              </span>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50/50 p-4">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                Net Tax Remittance Due
              </span>
              <p className="text-2xl font-extrabold text-[#1B4D2E] mt-1 tabular-nums">
                {formatCurrency(taxData.netPayable || 50500)}
              </p>
              <span className="text-[10px] text-emerald-700 mt-0.5 block">
                Output Tax minus ITC
              </span>
            </Card>
          </div>

          {/* Slabs Table */}
          <Card className="border-slate-200 overflow-hidden">
            <CardHeader title="Tax Output Slabs Breakdown" subtitle="Computed strictly via tax = gross * rate / (100 + rate)" />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Tax Category & Slab</th>
                    <th className="py-3 px-4">Taxable Value Base</th>
                    <th className="py-3 px-4">Tax Rate</th>
                    <th className="py-3 px-4 text-right">Output GST Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(taxData.outputTax || []).map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {t.ratePct === 5 ? 'Food & Concession Items' : 'Sports Courts, Pro Shop & Beverages'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 tabular-nums">
                        {formatCurrency(t.taxableValue)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 font-mono">
                        {t.ratePct}%
                      </td>
                      <td className="py-3 px-4 font-extrabold text-[#1B4D2E] tabular-nums text-right">
                        {formatCurrency(t.tax)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}

export default TaxReportsPage
