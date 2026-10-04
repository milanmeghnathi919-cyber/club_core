import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import publicService from '@/service/publicService'
import { formatCurrency } from '@/utils/format'
import { Check, ShieldCheck, Trophy, Sparkles, ArrowRight, Zap } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

export const Plans = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    publicService
      .getPlans()
      .then((data) => setPlans(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-12 font-sans">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
          Tiered Privileges
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-display">
          Select Your Membership Tier
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Uncompromised access to championship courts, racquet services, and club dining.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
          {plans.slice(0, 3).map((p) => {
            const isGold = p.code?.toLowerCase().includes('gold')
            const isJunior = p.code?.toLowerCase().includes('junior')

            return (
              <div
                key={p.id}
                className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 relative ${
                  isGold
                    ? 'bg-gradient-to-b from-[#111A2E] to-[#070B14] text-white shadow-2xl border-2 border-amber-500 md:-translate-y-2 z-10'
                    : 'bg-white border border-slate-200/90 text-slate-800 hover:shadow-xl hover:border-slate-300'
                }`}
              >
                {isGold && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-widest shadow-md border border-amber-300">
                    Most Prestigious
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold font-display">{p.name}</h3>
                      {isGold ? (
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                          <Trophy className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[#1B4D2E]/10 text-[#1B4D2E] flex items-center justify-center border border-[#1B4D2E]/20">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${isGold ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isJunior ? 'For aspiring young athletes under 18' : 'Complete 365-day access'}
                    </p>
                  </div>

                  <div className={`py-4 border-y ${isGold ? 'border-white/10' : 'border-slate-100'}`}>
                    <div className="flex items-baseline">
                      <span className="text-3xl sm:text-4xl font-extrabold tabular-nums font-display">
                        {formatCurrency(p.price)}
                      </span>
                      <span className={`text-xs ml-1.5 ${isGold ? 'text-slate-400' : 'text-slate-500'}`}>
                        / year
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 block mt-1">
                      Includes 18% GST (Tax Inclusive)
                    </span>
                  </div>

                  <ul className="space-y-3 text-xs">
                    <li className="flex items-start gap-2.5">
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isGold ? 'text-amber-400' : 'text-[#1B4D2E]'
                        }`}
                      />
                      <span>
                        <strong className="font-bold">{p.court_discount_pct}% Court Discount</strong>{' '}
                        {p.court_discount_pct === 100 && '(100% Free Court Access)'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isGold ? 'text-amber-400' : 'text-[#1B4D2E]'
                        }`}
                      />
                      <span>{p.shop_discount_pct}% Automatic Pro Shop Discount</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isGold ? 'text-amber-400' : 'text-[#1B4D2E]'
                        }`}
                      />
                      <span>{p.bar_discount_pct}% Automatic Club Café & Lounge Discount</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isGold ? 'text-amber-400' : 'text-[#1B4D2E]'
                        }`}
                      />
                      <span>Max {p.max_bookings_per_day} Active Court Sessions / Day</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isGold ? 'text-amber-400' : 'text-[#1B4D2E]'
                        }`}
                      />
                      <span>14-Day Advance Booking Priority Window</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <Link to={`/register?plan=${encodeURIComponent(p.name)}`}>
                    <Button
                      variant={isGold ? 'clay' : 'lawn'}
                      size="lg"
                      className="w-full font-bold justify-between cursor-pointer shadow-md"
                    >
                      <span>Join as {p.name.split(' ')[0]}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Plans
