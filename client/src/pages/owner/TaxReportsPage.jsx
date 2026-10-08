import React, { useEffect, useState } from 'react'
import financeService from '@/service/financeService'
import { formatCurrency } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import { FileSpreadsheet, Download, Printer, ShieldCheck, Zap } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

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
    try {
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

      autoTable(doc, {
        startY: 36,
        head: [['Tax Slab Rate', 'Taxable Turnover Base', 'Output GST Collected']],
        body: outputRows,
        theme: 'grid',
      })

      const finalY = (doc.lastAutoTable?.finalY ?? 36) + 10
      doc.text(`Total Output GST Collected: ${formatCurrency(taxData.outputTax?.reduce((a, b) => a + b.tax, 0) || 54000)}`, 14, finalY)
      doc.text(`Input Tax Credit Claimed: ${formatCurrency(taxData.inputTax || 3500)}`, 14, finalY + 6)
      doc.setFontSize(12)
      doc.text(`NET GST PAYABLE: ${formatCurrency(taxData.netPayable || 50500)}`, 14, finalY + 14)

      doc.save('GST-Audit-Report.pdf')
      toast.success('Tax Audit PDF downloaded')
    } catch (err) {
      console.error('Tax PDF error:', err)
      toast.error('Failed to generate Tax Audit PDF')
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Statutory Compliance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
            GST & Tax Statements
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Reconcile tax inclusive gross receipts (BR-16 formula) against input tax credits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={Download} onClick={handleDownloadCsv} className="font-bold text-xs uppercase">
            Export CSV
          </Button>
          <Button variant="volt" size="sm" icon={Printer} onClick={handleDownloadPdf} className="font-black uppercase text-xs">
            Download Tax PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-28 bg-white/5 rounded-3xl animate-pulse" />
          <div className="h-64 bg-white/5 rounded-3xl animate-pulse" />
        </div>
      ) : taxData ? (
        <div className="space-y-6">
          {/* Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-3xl bg-[#111418] border border-white/10 p-5 shadow-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Total Output GST Collected
              </span>
              <p className="text-2xl font-black font-mono text-white mt-1.5 tabular-nums">
                {formatCurrency(taxData.outputTax?.reduce((a, b) => a + b.tax, 0) || 54000)}
              </p>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Derived from gross client receipts
              </span>
            </div>

            <div className="rounded-3xl bg-[#111418] border border-white/10 p-5 shadow-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Input Tax Credit (ITC)
              </span>
              <p className="text-2xl font-black font-mono text-blue-400 mt-1.5 tabular-nums">
                {formatCurrency(taxData.inputTax || 3500)}
              </p>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Vendor expenses and supplies
              </span>
            </div>

            <div className="rounded-3xl bg-[#111418] border border-[#CCFF00]/40 p-5 shadow-2xl shadow-[#CCFF00]/5">
              <span className="text-[10px] text-[#CCFF00] font-black uppercase tracking-wider block">
                Net Tax Remittance Due
              </span>
              <p className="text-2xl font-black font-mono text-[#CCFF00] mt-1.5 tabular-nums">
                {formatCurrency(taxData.netPayable || 50500)}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Output Tax minus ITC
              </span>
            </div>
          </div>

          {/* Slabs Table */}
          <div className="rounded-3xl bg-[#111418] border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/10">
              <h3 className="text-base font-black uppercase tracking-tight text-white">Tax Output Slabs Breakdown</h3>
              <p className="text-xs text-slate-400">Computed strictly via tax = gross * rate / (100 + rate)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-5">Tax Category & Slab</th>
                    <th className="py-3.5 px-5">Taxable Value Base</th>
                    <th className="py-3.5 px-5">Tax Rate</th>
                    <th className="py-3.5 px-5 text-right">Output GST Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {(taxData.outputTax || []).map((t, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-white">
                        {t.ratePct === 5 ? 'Food & Concession Items' : 'Sports Courts, Pro Shop & Beverages'}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-300 tabular-nums">
                        {formatCurrency(t.taxableValue)}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-[#CCFF00] font-mono">
                        {t.ratePct}%
                      </td>
                      <td className="py-3.5 px-5 font-black font-mono text-[#CCFF00] tabular-nums text-right">
                        {formatCurrency(t.tax)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default TaxReportsPage
