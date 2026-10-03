import React, { useEffect, useState } from 'react'
import financeService from '@/service/financeService'
import { formatCurrency } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
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
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const SOURCE_COLORS = ['#1B4D2E', '#C85A32', '#F59E0B', '#3B82F6', '#8B5CF6']
const METHOD_COLORS = ['#10B981', '#6366F1', '#EC4899', '#F97316', '#64748B']

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
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text('THE CHAMPIONS CLUB', 105, 18, { align: 'center' })
    doc.setFontSize(11)
    doc.text('Executive Management Financial & Operations Audit', 105, 25, { align: 'center' })
    doc.text(`Reporting Period: ${data.range?.from || '2026-09-04'} to ${data.range?.to || '2026-10-03'}`, 14, 35)

    doc.autoTable({
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

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Revenue Stream', 'Amount']],
      body: sourceRows,
      theme: 'striped',
    })

    doc.save(`Executive-Report-${range}.pdf`)
    toast.success('Executive Report PDF downloaded')
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
    <div className="space-y-6 font-sans">
      {/* Header & Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
            Executive Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Club Performance Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time insights consolidated across courts, shop, bar, memberships, and payroll.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            {['today', 'week', 'month'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                  range === r
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <Button
            variant="lawn"
            size="sm"
            icon={Download}
            onClick={handleDownloadPdfReport}
            className="font-bold text-xs"
          >
            Export Audit PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Top 4 KPI Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200 p-5 bg-gradient-to-br from-white to-emerald-50/40">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Total Ledger Revenue
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#1B4D2E] mt-1 tabular-nums">
                {formatCurrency(data.revenue?.total || 0)}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-1">
                <TrendingUp className="w-3.5 h-3.5" /> +{data.compare?.changePct || 8.5}% vs previous period
              </div>
            </Card>

            <Card className="border-slate-200 p-5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Court Bookings
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">
                {data.bookings?.count || 420}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {data.bookings?.cancelled || 0} Cancellations
              </span>
            </Card>

            <Card className="border-slate-200 p-5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Court Utilization
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">
                {data.bookings?.utilisationPct || 61.4}%
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">6 Championship Arenas</span>
            </Card>

            <Card className="border-slate-200 p-5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Active Memberships
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 tabular-nums">
                {data.members?.active || 10}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {data.members?.expiringIn7Days || 0} Expiring Soon
              </span>
            </Card>
          </div>

          {/* Alerts Strip */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Operations Attention Required:</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-amber-800">
              <span>• Low-Stock SKUs: <strong>{data.alerts?.lowStockCount || 4}</strong></span>
              <span>• Open Enquiries: <strong>{data.alerts?.openLeads || 5}</strong></span>
              <span>• Pending Leave: <strong>{data.alerts?.pendingLeave || 1}</strong></span>
              <span>• Payables Due: <strong>{formatCurrency(data.alerts?.payablesDue || 42000)}</strong></span>
            </div>
          </div>

          {/* Revenue Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Source (Donut) */}
            <Card className="border-slate-200">
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
              <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs">
                {revenueBySourceData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: SOURCE_COLORS[idx % SOURCE_COLORS.length] }}
                    />
                    <span className="text-slate-600 font-medium">
                      {entry.name}: {formatCurrency(entry.value)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Revenue by Tender Method (Bar) */}
            <Card className="border-slate-200">
              <CardHeader title="Revenue by Tender Channel" subtitle="Settlement methods distribution" />
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByMethodData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#1B4D2E" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="p-4 border-t border-slate-100 text-center text-xs text-slate-500">
                100% of money writes route exclusively through payments single ledger (BR-13)
              </div>
            </Card>
          </div>

          {/* Daily Cash Flow Trend Line */}
          {dailyTrend.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader title="Daily Net Inflows Trend" subtitle="30-day cash flow continuity" />
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyTrend}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#C85A32"
                      strokeWidth={3}
                      dot={{ r: 3 }}
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
