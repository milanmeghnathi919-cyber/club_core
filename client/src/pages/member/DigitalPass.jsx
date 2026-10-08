import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Trophy, QrCode, CheckCircle2, AlertCircle } from 'lucide-react'
import Card, { CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import authService from '@/service/authService'
import { formatDate } from '@/utils/format'

export const DigitalPass = () => {
  const user = useSelector((state) => state.auth.user)
  const [memberData, setMemberData] = useState(null)
  const [membershipData, setMembershipData] = useState(null)

  useEffect(() => {
    authService.me().then((res) => {
      if (res?.member) setMemberData(res.member)
      if (res?.membership) setMembershipData(res.membership)
    }).catch(() => {})
  }, [])

  const hasActivePass = Boolean(membershipData && (membershipData.status === 'active' || !membershipData.status))
  const memberCode = memberData?.member_code || (user?.id ? `CC-${String(user.id).padStart(6, '0')}` : 'CC-GUEST')
  const planName = hasActivePass && membershipData?.plan_name ? `${membershipData.plan_name.toUpperCase()} PASS` : 'NO ACTIVE PLAN'
  const validThru = hasActivePass && membershipData?.end_date ? formatDate(membershipData.end_date) : 'Not Subscribed'
  const passStatus = hasActivePass ? (membershipData?.status?.toUpperCase() || 'ACTIVE') : 'INACTIVE'

  return (
    <div className="max-w-md mx-auto py-8 space-y-6 font-sans">
      <div className="text-center space-y-1">
        <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#CCFF00] text-black">
          Member Identity
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mt-3">Digital Access Pass</h1>
        <p className="text-xs text-slate-400">
          Present this pass at reception or courtside for member check-in.
        </p>
      </div>

      {/* No Active Plan Upgrade Alert */}
      {!hasActivePass && (
        <div className="p-4 rounded-2xl bg-[#111418] border border-amber-500/40 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div>
            <h4 className="font-bold text-sm flex items-center gap-1.5 text-white">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>No Active Membership Subscription</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Subscribe to a membership plan to activate digital pass privileges and unlock free court reservations.
            </p>
          </div>
          <Link to="/plans" className="shrink-0">
            <Button variant="volt" size="sm" className="font-bold">
              Explore Plans
            </Button>
          </Link>
        </div>
      )}

      {/* The Cyber-Volt Athletic Member Pass Card */}
      <div
        className={`rounded-3xl bg-gradient-to-br from-[#0F1318] via-[#141A22] to-[#090C10] text-white p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-6 ${
          hasActivePass ? 'border-2 border-[#CCFF00] shadow-[0_0_35px_rgba(204,255,0,0.25)]' : 'border border-white/10'
        }`}
      >
        {/* Glow Sheen Effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#CCFF00]/15 via-transparent to-transparent blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#CCFF00] text-black flex items-center justify-center font-bold shadow-md">
              <Trophy className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-tight text-white leading-tight">
                THE CHAMPIONS CLUB
              </h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#CCFF00]">
                Official Digital Identity
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs ${
              hasActivePass
                ? 'bg-[#CCFF00] text-black'
                : 'bg-white/10 border border-white/10 text-slate-400'
            }`}
          >
            {planName}
          </span>
        </div>

        {/* Member Details */}
        <div className="space-y-1 relative z-10 pt-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Registered Athlete
          </p>
          <h2 className="text-2xl font-black text-white tracking-wide uppercase">
            {memberData?.full_name || user?.name || 'Member'}
          </h2>
          <div className="flex items-center gap-4 pt-2">
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Member Code</p>
              <p className="text-sm font-mono font-black text-[#CCFF00]">{memberCode}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Valid Thru</p>
              <p className="text-xs font-bold text-slate-200">{validThru}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Pass Status</p>
              {hasActivePass ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#CCFF00]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" /> {passStatus}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> {passStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Simulated QR & Barcode Section */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
          <div className="space-y-1">
            {/* Simulated Barcode Stripes */}
            <div className="flex items-center gap-0.5 h-10 py-1 bg-[#CCFF00] px-2 rounded-lg">
              {[3, 1, 4, 1, 5, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1].map((w, i) => (
                <div
                  key={i}
                  className="bg-black h-full"
                  style={{ width: `${w * 1.5}px` }}
                />
              ))}
            </div>
            <p className="text-[9px] text-slate-400 font-mono text-center">890123456789</p>
          </div>

          <div className="w-16 h-16 bg-[#CCFF00] p-1.5 rounded-2xl shadow-md flex items-center justify-center shrink-0 border border-white/10">
            <QrCode className="w-13 h-13 text-black" />
          </div>
        </div>
      </div>

      {/* Privileges Snapshot Card */}
      <Card className="border-white/10 bg-[#111418]">
        <CardContent className="p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
            <span>Present at clubhouse front desk for member check-in</span>
          </div>
          {hasActivePass ? (
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
              <span>Auto-applies {membershipData?.bar_discount_pct || 15}% discount on all Café and Pro Shop orders</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
              <span className="text-slate-400">Subscribe to unlock complimentary court access & discounts</span>
              <Link to="/plans" className="text-xs font-bold text-[#CCFF00] hover:underline">
                View Plans
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DigitalPass
