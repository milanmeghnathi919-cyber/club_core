import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import publicService from '@/service/publicService'
import { formatCurrency } from '@/utils/format'
import {
  Check,
  ShieldCheck,
  Trophy,
  Sparkles,
  ArrowRight,
  Zap,
  TrendingUp,
  Percent,
  Clock,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  Calendar,
  Award,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import FakePaymentModal from '@/components/common/FakePaymentModal'
import useToast from '@/components/ui/Toast'

export const Plans = () => {
  const toast = useToast()
  const user = useSelector((state) => state.auth.user)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState('annual') // 'annual' | 'quarterly'
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    publicService
      .getPlans()
      .then((data) => {
        // Ensure sorted order: junior -> silver -> gold
        const sorted = [...data].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
        setPlans(sorted)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const faqs = [
    {
      q: 'How does complimentary court access work with Gold Membership?',
      a: 'Gold members receive 100% free booking credits for all standard tennis, badminton, squash, padel, and cricket net slots. You can reserve up to 4 sessions daily with zero court fees.',
    },
    {
      q: 'Can I bring guests or playing partners?',
      a: 'Yes! A member may invite up to 3 non-member guests per reserved court session at no extra charge beyond the standard slot allocation.',
    },
    {
      q: 'Are the displayed prices inclusive of taxes?',
      a: 'Yes. All displayed membership pricing includes 18% GST with zero hidden registration or maintenance charges.',
    },
    {
      q: 'Can I switch between Quarterly and Annual billing?',
      a: 'Yes. You can transition your plan upon renewal at any time. Annual members lock in 20% savings and exclusive advance booking privileges.',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-16 font-sans bg-[#090B0E] text-white">
      {/* Header section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-xs font-black uppercase tracking-widest text-[#CCFF00]">
          <Award className="w-3.5 h-3.5" />
          <span>Tiered Athletic Privileges</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display uppercase">
          Invest In Your Athletic Excellence
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Uncompromised access to championship courts, racquet services, and club dining.
          Structured to deliver exponential value against individual hourly court fees.
        </p>

        {/* Billing cycle switch */}
        <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-[#111418] border border-white/10 shadow-lg mt-2">
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              billingCycle === 'annual'
                ? 'bg-[#CCFF00] text-black shadow-md shadow-[#CCFF00]/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Annual Pass (Save 20% · Best Value)
          </button>
          <button
            onClick={() => setBillingCycle('quarterly')}
            className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              billingCycle === 'quarterly'
                ? 'bg-[#CCFF00] text-black shadow-md shadow-[#CCFF00]/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Quarterly Flex
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
          {plans.slice(0, 3).map((p) => {
            const isGold = p.code?.toLowerCase().includes('gold')
            const isSilver = p.code?.toLowerCase().includes('silver')
            const isJunior = p.code?.toLowerCase().includes('junior')

            const annualPrice = Number(p.price) || 0
            const quarterlyPrice = Math.round(annualPrice * 0.3)
            const effectivePrice = billingCycle === 'annual' ? annualPrice : quarterlyPrice
            const monthlyEquivalent = Math.round(
              billingCycle === 'annual' ? annualPrice / 12 : quarterlyPrice / 3
            )

            // Value savings breakdown
            const valueBadge = isGold
              ? { total: '₹1,80,000+', savings: 'Save ₹1,20,000+/yr' }
              : isSilver
              ? { total: '₹75,000+', savings: 'Save ₹45,000+/yr' }
              : { total: '₹45,000+', savings: 'Save ₹30,000+/yr' }

            return (
              <div
                key={p.id}
                className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                  isGold
                    ? 'bg-[#12161E] text-white shadow-2xl shadow-[#CCFF00]/15 border-2 border-[#CCFF00] md:-translate-y-2 z-10'
                    : 'bg-[#111418] border border-white/10 text-white hover:shadow-xl hover:border-white/20'
                }`}
              >
                {isGold && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#CCFF00] text-black text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#CCFF00]/30 border border-[#CCFF00]">
                    ★ Flagship VIP Tier
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black font-display uppercase text-white">{p.name}</h3>
                      {isGold ? (
                        <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/20 text-[#CCFF00] flex items-center justify-center border border-[#CCFF00]/30 shadow-xs">
                          <Trophy className="w-5 h-5" />
                        </div>
                      ) : isSilver ? (
                        <div className="w-10 h-10 rounded-xl bg-sky-400/15 text-sky-400 flex items-center justify-center border border-sky-400/25">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-400 flex items-center justify-center border border-amber-400/25">
                          <Sparkles className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs mt-1 text-slate-400">
                      {isJunior
                        ? 'Under 18 youth academy development pass'
                        : isGold
                        ? 'Unlimited complimentary courts & elite clubhouse privileges'
                        : 'Active competitor pass with priority court access'}
                    </p>
                  </div>

                  {/* Pricing Box */}
                  <div className="py-4 border-y border-white/10 space-y-1.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-black tabular-nums font-display text-white">
                        {formatCurrency(effectivePrice)}
                      </span>
                      <span className="text-xs text-slate-400">
                        / {billingCycle === 'annual' ? 'year' : 'quarter'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400 font-medium">
                        Equivalent to{' '}
                        <strong className="text-white font-bold">{formatCurrency(monthlyEquivalent)}</strong> / mo
                      </span>
                      <span className="text-[#CCFF00] font-bold">18% GST Included</span>
                    </div>

                    {/* Real Value Pill */}
                    <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Est. Facility Value:</span>
                      <span className="font-extrabold text-[#CCFF00]">{valueBadge.total}</span>
                    </div>
                  </div>

                  {/* Privileges checklist */}
                  <ul className="space-y-3 text-xs">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#CCFF00]" />
                      <span className="text-slate-300">
                        <strong className="font-bold text-white">{p.court_discount_pct}% Court Discount</strong>{' '}
                        {p.court_discount_pct === 100 && (
                          <span className="text-[#CCFF00] font-bold">(100% Free Unlimited Bookings)</span>
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#CCFF00]" />
                      <span className="text-slate-300">
                        <strong className="font-bold text-white">{p.max_bookings_per_day} Active Court Sessions</strong> / day allowance
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#CCFF00]" />
                      <span className="text-slate-300">
                        <strong className="font-bold text-white">
                          {isGold ? '14-Day' : isSilver ? '7-Day' : '5-Day'} Priority
                        </strong>{' '}
                        Advance Booking Window
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#CCFF00]" />
                      <span className="text-slate-300">
                        <strong className="font-bold text-white">{p.shop_discount_pct}% Off</strong> Pro Shop Gear & Restringing
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#CCFF00]" />
                      <span className="text-slate-300">
                        <strong className="font-bold text-white">{p.bar_discount_pct}% Off</strong> Clubhouse Café & Energy Bar
                      </span>
                    </li>
                    {isGold && (
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#CCFF00]" />
                        <span className="text-slate-300">
                          <strong className="font-bold text-white">VIP Locker</strong> & Recovery Lounge Access
                        </span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="pt-8">
                  {user ? (
                    <Button
                      variant={isGold ? 'volt' : 'dark'}
                      size="lg"
                      className="w-full font-black justify-between cursor-pointer shadow-md"
                      onClick={() =>
                        setSelectedPlanForPayment({
                          plan: p,
                          cycle: billingCycle,
                          amount: effectivePrice,
                        })
                      }
                    >
                      <span>Upgrade to {p.name.split(' ')[0]}</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </Button>
                  ) : (
                    <Link to={`/register?plan=${encodeURIComponent(p.name)}`}>
                      <Button
                        variant={isGold ? 'volt' : 'dark'}
                        size="lg"
                        className="w-full font-black justify-between cursor-pointer shadow-md"
                      >
                        <span>Join as {p.name.split(' ')[0]}</span>
                        <ArrowRight className="w-4 h-4 stroke-[3]" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* VALUE COMPARISON MATRIX / "THE ROI MATH" */}
      <div className="rounded-3xl bg-[#111418] border border-white/10 p-6 sm:p-10 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#CCFF00]">
            <TrendingUp className="w-4 h-4" />
            <span>Value Breakdown</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white font-display uppercase">
            Why Membership Pays For Itself
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Compare annual benefits against standard hourly court fees (₹800 - ₹1,500/hr) for regular athletes playing 2 sessions per week.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white uppercase text-[11px] font-black tracking-wider">
                <th className="py-4 px-4">Membership Benefit</th>
                <th className="py-4 px-4 text-slate-400">Pay-As-You-Play</th>
                <th className="py-4 px-4 text-amber-400">Junior Tier</th>
                <th className="py-4 px-4 text-sky-400">Silver Tier</th>
                <th className="py-4 px-4 text-[#CCFF00] bg-[#CCFF00]/5 rounded-t-xl">Gold VIP Flagship</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-4 px-4 font-bold text-white">Court Booking Cost</td>
                <td className="py-4 px-4 text-slate-400">Standard Rate (₹800 - ₹1,500/h)</td>
                <td className="py-4 px-4 font-bold text-amber-400">50% Off Courts</td>
                <td className="py-4 px-4 font-bold text-sky-400">30% Off Courts</td>
                <td className="py-4 px-4 font-black text-[#CCFF00] bg-[#CCFF00]/5">
                  100% Free (₹0 Court Fees)
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-bold text-white">Annual Court Usage (100 Hours)</td>
                <td className="py-4 px-4 text-slate-400">₹1,20,000+ court fee</td>
                <td className="py-4 px-4 text-white">₹60,000 (Saves ₹60,000)</td>
                <td className="py-4 px-4 text-white">₹84,000 (Saves ₹36,000)</td>
                <td className="py-4 px-4 font-black text-[#CCFF00] bg-[#CCFF00]/5">
                  ₹0 (Saves ₹1,20,000+)
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-bold text-white">Advance Priority Booking</td>
                <td className="py-4 px-4 text-slate-400">2 Days Advance</td>
                <td className="py-4 px-4 text-white">5 Days Advance</td>
                <td className="py-4 px-4 text-white">7 Days Advance</td>
                <td className="py-4 px-4 font-black text-[#CCFF00] bg-[#CCFF00]/5">
                  14 Days First Priority
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-bold text-white">Daily Sessions Allowed</td>
                <td className="py-4 px-4 text-slate-400">1 session max</td>
                <td className="py-4 px-4 text-white">2 sessions/day</td>
                <td className="py-4 px-4 text-white">2 sessions/day</td>
                <td className="py-4 px-4 font-black text-[#CCFF00] bg-[#CCFF00]/5">
                  4 sessions/day
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-bold text-white">Pro Shop Gear & Restringing</td>
                <td className="py-4 px-4 text-slate-400">0% Discount</td>
                <td className="py-4 px-4 text-white">10% Off Equipment</td>
                <td className="py-4 px-4 text-white">10% Off Equipment</td>
                <td className="py-4 px-4 font-black text-[#CCFF00] bg-[#CCFF00]/5">
                  15% Off All Gear
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-bold text-white">Clubhouse Café & Energy Bar</td>
                <td className="py-4 px-4 text-slate-400">Standard Menu</td>
                <td className="py-4 px-4 text-white">10% Off Smoothies</td>
                <td className="py-4 px-4 text-white">10% Off Dining</td>
                <td className="py-4 px-4 font-black text-[#CCFF00] bg-[#CCFF00]/5">
                  15% Off Entire Menu
                </td>
              </tr>
              <tr className="border-t border-white/20 bg-white/5 font-black">
                <td className="py-5 px-4 text-white text-sm">Estimated Net Member Savings</td>
                <td className="py-5 px-4 text-slate-500">None</td>
                <td className="py-5 px-4 text-amber-400 text-sm">+₹30,000+ / year</td>
                <td className="py-5 px-4 text-sky-400 text-sm">+₹45,000+ / year</td>
                <td className="py-5 px-4 text-[#CCFF00] text-sm bg-[#CCFF00]/10 rounded-b-xl">
                  +₹1,20,000+ / year
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#CCFF00]">
            <HelpCircle className="w-4 h-4" />
            <span>Clarifications</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-display uppercase">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#111418] border border-white/10 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full py-4 px-6 flex items-center justify-between text-left font-bold text-sm text-white hover:text-[#CCFF00] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-4 ${
                      isOpen ? 'rotate-180 text-[#CCFF00]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-white/5">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment simulation modal */}
      {selectedPlanForPayment && (
        <FakePaymentModal
          isOpen={Boolean(selectedPlanForPayment)}
          onClose={() => setSelectedPlanForPayment(null)}
          amount={selectedPlanForPayment.amount || 0}
          title={`${selectedPlanForPayment.plan.name} (${
            selectedPlanForPayment.cycle === 'annual' ? 'Annual Pass' : 'Quarterly Flex'
          })`}
          description={`Direct activation: ${formatCurrency(selectedPlanForPayment.amount)} / ${
            selectedPlanForPayment.cycle === 'annual' ? 'year' : 'quarter'
          }`}
          sourceType="membership"
          sourceId={selectedPlanForPayment.plan.id}
          planId={selectedPlanForPayment.plan.id}
          customerName={user?.name || user?.full_name || 'Champion Member'}
          onSuccess={() => {
            toast.success(
              `Successfully activated ${selectedPlanForPayment.plan.name}! Your privileges are now active.`
            )
            setSelectedPlanForPayment(null)
          }}
        />
      )}
    </div>
  )
}

export default Plans
