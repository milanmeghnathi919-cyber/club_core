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
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Select Your Membership Tier
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((p) => {
            const isGold = p.code?.toLowerCase().includes('gold')
            const isJunior = p.code?.toLowerCase().includes('junior')

            return (
              <div
                key={p.id}
                className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
                  isGold
                    ? 'bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-2xl border-2 border-amber-500 scale-105 z-10'
                    : 'bg-white border border-slate-200 text-slate-800 hover:shadow-lg'
                }`}
              >
                {isGold && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-widest shadow-md">
                    Most Prestigious
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold">{p.name}</h3>
                      {isGold ? (
                        <Trophy className="w-6 h-6 text-amber-400" />
                      ) : (
                        <ShieldCheck className="w-6 h-6 text-[#1B4D2E]" />
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${isGold ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isJunior ? 'For aspiring young athletes under 18' : 'Complete 365-day access'}
                    </p>
                  </div>

                  <div className={`py-4 border-y ${isGold ? 'border-white/10' : 'border-slate-100'}`}>
                    <div className="flex items-baseline">
                      <span className="text-3xl sm:text-4xl font-extrabold tabular-nums">
                        {formatCurrency(p.price)}
                      </span>
                      <span className={`text-xs ml-1.5 ${isGold ? 'text-slate-400' : 'text-slate-500'}`}>
                        / year
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-emerald-600 block mt-1">
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
                      <span>{p.bar_discount_pct}% Automatic Bar & Cafe Discount</span>
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
                      className="w-full font-bold justify-between cursor-pointer"
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
