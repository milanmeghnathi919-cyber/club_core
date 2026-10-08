import React, { useEffect, useState } from 'react'
import barService from '@/service/barService'
import { formatCurrency } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Calendar, CreditCard, Banknote, QrCode } from 'lucide-react'

export const BarSummary = () => {
  const toast = useToast()
  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    barService
      .getBarSummary(selectedDate)
      .then(setSummary)
      .catch(() => toast.error('Failed to load daily register summary'))
      .finally(() => setLoading(false))
  }, [selectedDate, toast])

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#CCFF00] text-black">
            End of Day Reconciliation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mt-3">
            Café & Dining Daily Register Summary
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Audit daily receipts, tender settlement breakdown, and F&B sales.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#111418] px-3 py-1.5 rounded-xl border border-white/10 text-xs shadow-2xs">
          <Calendar className="w-4 h-4 text-[#CCFF00]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="font-bold text-white bg-transparent focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : summary ? (
        <div className="space-y-6">
          {/* Top 4 KPI Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-white/10 bg-[#111418] p-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Gross Orders
              </span>
              <p className="text-2xl font-black text-white mt-1 tabular-nums font-mono">
                {formatCurrency(summary.gross || 0)}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {summary.tabsCount || 0} Tabs Settled
              </span>
            </Card>

            <Card className="border-white/10 bg-[#111418] p-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Member Discounts
              </span>
              <p className="text-2xl font-black text-amber-400 mt-1 tabular-nums font-mono">
                -{formatCurrency(summary.discounts || 0)}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Gold & Silver Privileges</span>
            </Card>

            <Card className="border-white/10 bg-[#111418] p-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                GST Tax Collected
              </span>
              <p className="text-2xl font-black text-slate-300 mt-1 tabular-nums font-mono">
                {formatCurrency(summary.tax || 0)}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">5% Food / 18% Drink</span>
            </Card>

            <Card className="border-[#CCFF00] bg-[#CCFF00]/10 p-4 shadow-[0_0_20px_rgba(204,255,0,0.15)]">
              <span className="text-[10px] text-[#CCFF00] font-black uppercase tracking-wider">
                Net Register Total
              </span>
              <p className="text-2xl font-black text-[#CCFF00] mt-1 tabular-nums font-mono">
                {formatCurrency(summary.net || 0)}
              </p>
              <span className="text-[10px] text-slate-300 mt-0.5 block">Single Revenue Ledger</span>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tender Breakdown */}
            <Card className="border-white/10 bg-[#111418]">
              <CardHeader title="Tender Method Breakdown" subtitle="Reconciled payments by channel" />
              <CardContent className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <QrCode className="w-4 h-4 text-[#CCFF00]" />
                    <span className="font-bold text-white">UPI / QR Transfers</span>
                  </div>
                  <strong className="text-[#CCFF00] font-mono tabular-nums">
                    {formatCurrency(summary.byMethod?.upi || 0)}
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-white">Credit / Debit Card Terminal</span>
                  </div>
                  <strong className="text-white font-mono tabular-nums">
                    {formatCurrency(summary.byMethod?.card || 0)}
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Banknote className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white">Cash in Drawer</span>
                  </div>
                  <strong className="text-white font-mono tabular-nums">
                    {formatCurrency(summary.byMethod?.cash || 0)}
                  </strong>
                </div>
              </CardContent>
            </Card>

            {/* Top Items Sold */}
            <Card className="border-white/10 bg-[#111418]">
              <CardHeader title="Popular F&B Items" subtitle="Top performers for selected date" />
              <CardContent>
                {(!summary.topItems || summary.topItems.length === 0) ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No item sales recorded on this date.</p>
                ) : (
                  <div className="divide-y divide-white/5 text-xs">
                    {summary.topItems.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between">
                        <span className="font-bold text-white">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">×{item.qty} units</span>
                          <span className="font-mono font-bold text-[#CCFF00] tabular-nums">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default BarSummary
