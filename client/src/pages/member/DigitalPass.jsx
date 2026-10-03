import React from 'react'
import { useSelector } from 'react-redux'
import { Trophy, ShieldCheck, QrCode, Sparkles, CheckCircle2 } from 'lucide-react'
import Card, { CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export const DigitalPass = () => {
  const user = useSelector((state) => state.auth.user)

  return (
    <div className="max-w-md mx-auto py-8 space-y-6 font-sans">
      <div className="text-center space-y-1">
        <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
          Member Identity
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">Digital Access Pass</h1>
        <p className="text-xs text-slate-500">
          Present this pass at reception or courtside for member check-in.
        </p>
      </div>

      {/* The Prestige Athletic Member Pass */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white p-6 sm:p-7 shadow-2xl border-2 border-amber-500/80 relative overflow-hidden space-y-6">
        {/* Metallic Sheen Effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-amber-400/20 to-transparent blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Trophy className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-white leading-tight">
                THE CHAMPIONS CLUB
              </h3>
              <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400">
                Official Access Card
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
            GOLD PASS
          </span>
        </div>

        {/* Member Details */}
        <div className="space-y-1 relative z-10 pt-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Member Name
          </p>
          <h2 className="text-2xl font-extrabold text-white tracking-wide">
            {user?.name || 'Arun Kumar'}
          </h2>
          <div className="flex items-center gap-4 pt-2">
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Member Code</p>
              <p className="text-xs font-mono font-bold text-amber-400">MEM-2026-000001</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Valid Thru</p>
              <p className="text-xs font-bold text-slate-200">Apr 2027</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Status</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
              </span>
            </div>
          </div>
        </div>

        {/* Simulated QR & Barcode Section */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
          <div className="space-y-1">
            {/* Simulated Barcode Stripes */}
            <div className="flex items-center gap-0.5 h-10 py-1 bg-white px-2 rounded-md">
              {[3, 1, 4, 1, 5, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1].map((w, i) => (
                <div
                  key={i}
                  className="bg-slate-950 h-full"
                  style={{ width: `${w * 1.5}px` }}
                />
              ))}
            </div>
            <p className="text-[9px] text-slate-400 font-mono text-center">890123456789</p>
          </div>

          <div className="w-16 h-16 bg-white p-1 rounded-xl shadow-md flex items-center justify-center shrink-0">
            <QrCode className="w-14 h-14 text-slate-900" />
          </div>
        </div>
      </div>

      {/* Privileges Snapshot Card */}
      <Card className="border-slate-200">
        <CardContent className="p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Show to reception staff for fast court check-in</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Auto-applies 15% discount on all Bar and Pro Shop orders</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DigitalPass
