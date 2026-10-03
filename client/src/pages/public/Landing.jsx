import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import publicService from '@/service/publicService'
import { formatCurrency } from '@/utils/format'
import {
  Trophy,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Clock,
  Compass,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'

export const Landing = () => {
  const [club, setClub] = useState(null)
  const [plans, setPlans] = useState([])
  const [courts, setCourts] = useState([])

  useEffect(() => {
    publicService.getClubInfo().then(setClub).catch(console.error)
    publicService.getPlans().then(setPlans).catch(console.error)
    publicService.getCourts().then(setCourts).catch(console.error)
  }, [])

  return (
    <div className="space-y-20 pb-20 font-sans">
      {/* Hero Section */}
      <section className="relative bg-[#090D16] text-white overflow-hidden py-24 sm:py-32 px-4 sm:px-8 border-b border-white/10">
        {/* Subtle athletic grid backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#1B4D2E]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#C85A32]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to Bengaluru&rsquo;s Premier Sports Sanctuary</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Where Champions <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-[#C85A32]">
              Train, Play & Connect.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            World-class Roland Garros clay tennis courts, panoramic padel glass cages, BWF standard badminton, and artisanal club dining. Powered by real-time scheduling.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link to="/availability">
              <Button variant="lawn" size="lg" className="gap-2 bg-[#1B4D2E] text-white">
                <Calendar className="w-4 h-4" /> Check Court Availability
              </Button>
            </Link>
            <Link to="/plans">
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
                Explore Membership Tiers
              </Button>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-white/10">
            <div className="p-3 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 tabular-nums">6</p>
              <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Championship Courts</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">06:00</p>
              <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Morning First Serve</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">100%</p>
              <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Gold Court Access</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 tabular-nums">0</p>
              <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Double-Booking Guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* Championship Facilities Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
            Athletic Excellence
          </span>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">Tournament-Grade Facilities</h2>
          <p className="text-sm text-slate-500 mt-2">
            Every arena is maintained to strict international federation tolerances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courts.slice(0, 3).map((court) => (
            <Card key={court.id} hover className="border-slate-200">
              <div className="h-48 bg-slate-100 overflow-hidden relative">
                {court.imageUrl ? (
                  <img
                    src={court.imageUrl}
                    alt={court.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1B4D2E]/10 flex items-center justify-center text-[#1B4D2E]">
                    <Trophy className="w-12 h-12" />
                  </div>
                )}
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider">
                  {court.sport}
                </span>
              </div>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900">{court.name}</h3>
                  <span className="text-xs font-bold text-[#1B4D2E] tabular-nums">
                    {formatCurrency(court.ratePerHour)}/hr
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Competition floodlighting, high-traction athletic surfacing, and court-side hydration coolers.
                </p>
                <Link to="/availability" className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View Schedule <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Membership Tiers Teaser */}
      <section className="bg-slate-900 text-white py-20 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Club Privileges
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-1 text-white">
              Designed For High Performers
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Unlock prioritized booking windows, 100% complimentary court access, and pro shop privileges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => {
              const isGold = p.code?.toLowerCase().includes('gold')
              return (
                <div
                  key={p.id}
                  className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
                    isGold
                      ? 'bg-gradient-to-b from-[#1E293B] to-[#0F172A] border-2 border-amber-500/80 shadow-2xl relative'
                      : 'bg-white/5 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {isGold && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-widest shadow-md">
                      Flagship Tier
                    </span>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{p.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">Full 365-day athletic access</p>
                    </div>

                    <div className="py-2 border-y border-white/10">
                      <span className="text-3xl font-extrabold text-white tabular-nums">
                        {formatCurrency(p.price)}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">/ year</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          <strong className="text-white">{p.court_discount_pct}% Court Discount</strong>{' '}
                          {p.court_discount_pct === 100 ? '(Free Play)' : ''}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{p.shop_discount_pct}% Off Pro Shop Equipment</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{p.bar_discount_pct}% Off F&B and Energy Bar</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Max {p.max_bookings_per_day} Bookings / Day</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-8">
                    <Link to="/contact">
                      <Button
                        variant={isGold ? 'clay' : 'outline'}
                        className={`w-full font-bold ${!isGold ? 'border-white/20 text-white' : ''}`}
                      >
                        Enquire for Membership
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Friday Social Play Invitation */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#1B4D2E] to-[#12351F] text-white p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
              Every Friday Evening
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Friday Social Doubles & Padel Mixer
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Shared court rotations, dynamic partner matching, and post-match drinks at the Club Lounge. Open to all skill levels.
            </p>
          </div>
          <Link to="/contact">
            <Button variant="clay" size="lg" className="whitespace-nowrap font-bold shadow-lg">
              Book a Trial Session
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Landing
