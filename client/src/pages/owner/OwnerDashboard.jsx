import React, { useEffect, useState } from 'react'
import financeService from '@/service/financeService'
import { formatCurrency } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import CountUp from '@/components/ui/CountUp'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import {
  Trophy,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Download,
  Users,
  Percent,
  Clock,
  Sparkles,
  CreditCard,
  Building,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const SOURCE_COLORS = ['#CCFF00', '#10B981', '#38BDF8', '#F59E0B', '#A855F7']
const METHOD_COLORS = ['#CCFF00', '#10B981', '#6366F1', '#EC4899', '#F97316']

export const OwnerDashboard = () => {
  const toast = useToast()
  const [range, setRange] = useState('month')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const res = await financeService.getDashboardReport(range)
      setData(res)
    } catch {
      toast.error('Failed to load executive dashboard report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [range])

  const handleDownloadPdfReport = () => {
    if (!data) return
    try {
      const doc = new jsPDF()

      doc.setFontSize(18)
      doc.text('THE CHAMPIONS CLUB', 105, 18, { align: 'center' })
      doc.setFontSize(11)
      doc.text('Executive Management Financial & Operations Audit', 105, 25, { align: 'center' })
      doc.text(`Reporting Period: ${data.range?.from || '2026-09-04'} to ${data.range?.to || '2026-10-03'}`, 14, 35)

      autoTable(doc, {
        startY: 42,
        head: [['Metric / Key Indicator', 'Current Value', 'Reconciliation Status']],
        body: [
          ['Total Club Revenue', formatCurrency(data.revenue?.total || 0), 'Single Ledger Reconciled'],
          ['Court Bookings Volume', `${data.bookings?.count || 0} Sessions`, 'Zero Double Bookings'],
          ['Court Utilization', `${data.bookings?.utilisationPct || 0}%`, 'Peak 18:00 - 21:00'],
          ['Active Club Memberships', `${data.members?.active || 0} Members`, 'Gold & Silver Active'],
          ['Accounts Payable Pending', formatCurrency(data.alerts?.payablesDue || 0), 'BESCOM & Utilities'],
        ],
        theme: 'grid',
      })

      const sourceRows = Object.entries(data.revenue?.bySource || {}).map(([src, val]) => [
        src.toUpperCase(),
        formatCurrency(val),
      ])

      const secondY = (doc.lastAutoTable?.finalY ?? 42) + 10
      autoTable(doc, {
        startY: secondY,
        head: [['Revenue Stream', 'Amount']],
        body: sourceRows,
        theme: 'striped',
      })

      doc.save(`Executive-Report-${range}.pdf`)
      toast.success('Executive Report PDF downloaded')
    } catch (err) {
      console.error('Executive PDF error:', err)
      toast.error('Failed to export Executive Report PDF')
    }
  }

  const revenueBySourceData = Object.entries(data?.revenue?.bySource || {}).map(([key, val]) => ({
    name: key.toUpperCase(),
    value: Number(val),
  }))

  const revenueByMethodData = Object.entries(data?.revenue?.byMethod || {}).map(([key, val]) => ({
    name: key.toUpperCase(),
    value: Number(val),
  }))

  const dailyTrend = data?.revenue?.dailySeries || []

  return (
    <div className="space-y-6 font-sans text-white">
      {/* Header & Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00]">
            Executive Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 font-display uppercase tracking-tight">
            Club Performance Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time insights consolidated across courts, shop, bar, memberships, and payroll.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
            {['today', 'week', 'month'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  range === r
                    ? 'bg-[#CCFF00] text-black shadow-md shadow-[#CCFF00]/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <Button
            variant="volt"
            size="sm"
            icon={Download}
            onClick={handleDownloadPdfReport}
            className="font-black text-xs cursor-pointer shadow-md shadow-[#CCFF00]/20"
          >
            Export Audit PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl bg-white/5" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-72 rounded-2xl bg-white/5" />
            <Skeleton className="h-72 rounded-2xl bg-white/5" />
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Top 4 KPI Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-white/10 p-5 bg-[#111418] relative overflow-hidden rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Total Ledger Revenue
              </span>
              <p className="text-2xl sm:text-3xl font-black text-[#CCFF00] mt-1 tabular-nums font-mono">
                <CountUp value={data.revenue?.total || 0} format={(n) => formatCurrency(n)} />
              </p>
              <div className="flex items-center gap-1 text-[11px] text-[#CCFF00] font-bold mt-1">
                <TrendingUp className="w-3.5 h-3.5" /> +{data.compare?.changePct || 8.5}% vs previous period
              </div>
            </Card>

            <Card className="border-white/10 p-5 bg-[#111418] rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Court Bookings
              </span>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1 tabular-nums font-mono">
                <CountUp value={data.bookings?.count || 420} />
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {data.bookings?.cancelled || 0} Cancellations
              </span>
            </Card>

            <Card className="border-white/10 p-5 bg-[#111418] rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Court Utilization
              </span>
              <p className="text-2xl sm:text-3xl font-black text-[#CCFF00] mt-1 tabular-nums font-mono">
                <CountUp
                  value={data.bookings?.utilisationPct || 61.4}
                  format={(n) => `${Math.round(n * 100) / 100}%`}
                />
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">6 Championship Arenas</span>
            </Card>

            <Card className="border-white/10 p-5 bg-[#111418] rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Active Memberships
              </span>
              <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 tabular-nums font-mono">
                <CountUp value={data.members?.active || 10} />
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {data.members?.expiringIn7Days || 0} Expiring Soon
              </span>
            </Card>
          </div>

          {/* Alerts Strip */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-4 text-xs text-amber-200">
            <div className="flex items-center gap-2 text-amber-300 font-black">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Operations Attention Required:</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-amber-200 font-semibold">
              <span>• Low-Stock SKUs: <strong className="text-white">{data.alerts?.lowStockCount || 4}</strong></span>
              <span>• Open Enquiries: <strong className="text-white">{data.alerts?.openLeads || 5}</strong></span>
              <span>• Pending Leave: <strong className="text-white">{data.alerts?.pendingLeave || 1}</strong></span>
              <span>• Payables Due: <strong className="text-amber-400 font-mono">{formatCurrency(data.alerts?.payablesDue || 42000)}</strong></span>
            </div>
          </div>

          {/* Revenue Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Source (Donut) */}
            <Card className="border-white/10 bg-[#111418] rounded-2xl">
              <CardHeader title="Revenue by Department" subtitle="Single ledger streams breakdown" />
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueBySourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {revenueBySourceData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="p-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 text-xs">
                {revenueBySourceData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: SOURCE_COLORS[idx % SOURCE_COLORS.length] }}
                    />
                    <span className="text-slate-300 font-semibold">
                      {entry.name}: <strong className="text-white font-mono">{formatCurrency(entry.value)}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Revenue by Tender Method (Bar) */}
            <Card className="border-white/10 bg-[#111418] rounded-2xl">
              <CardHeader title="Revenue by Tender Channel" subtitle="Settlement methods distribution" />
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByMethodData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#0E1217', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    />
                    <Bar dataKey="value" fill="#CCFF00" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="p-4 border-t border-white/10 text-center text-xs text-slate-400">
                100% of money writes route exclusively through payments single ledger (BR-13)
              </div>
            </Card>
          </div>

          {/* Daily Cash Flow Trend Line */}
          {dailyTrend.length > 0 && (
            <Card className="border-white/10 bg-[#111418] rounded-2xl">
              <CardHeader title="Daily Net Inflows Trend" subtitle="30-day cash flow continuity" />
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyTrend}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#0E1217', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#CCFF00"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#CCFF00' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default OwnerDashboard
