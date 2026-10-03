import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import publicService from '@/service/publicService'
import cafeService from '@/service/cafeService'
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
  Coffee,
  Utensils,
  Zap,
  ShoppingBag,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'

export const Landing = () => {
  const user = useSelector((state) => state.auth.user)
  const [club, setClub] = useState(null)
  const [plans, setPlans] = useState([])
  const [courts, setCourts] = useState([])
  const [cafeItems, setCafeItems] = useState([])
  const [activeCafeCategory, setActiveCafeCategory] = useState('All')

  useEffect(() => {
    publicService.getClubInfo().then(setClub).catch(console.error)
    publicService.getPlans().then(setPlans).catch(console.error)
    publicService.getCourts().then(setCourts).catch(console.error)
    cafeService.getMenu().then((items) => {
      if (Array.isArray(items)) setCafeItems(items)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (window.location.hash === '#cafe') {
      setTimeout(() => {
        const el = document.getElementById('cafe')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [cafeItems])

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

      {/* Club Café & Recovery Lounge Showcase */}
      <section id="cafe" className="max-w-7xl mx-auto px-4 sm:px-8 scroll-mt-24">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
              <Coffee className="w-3.5 h-3.5 text-amber-700" />
              <span>Nutrition & Recovery Lounge</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              The Club Café & Recovery Bar
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
              Artisan single-origin brews, nutrient-dense protein bowls, fresh superfood smoothies, and court-side hydration coolers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <Link to="/app/cafe">
                <Button variant="lawn" className="gap-2 bg-[#1B4D2E] text-white">
                  <Utensils className="w-4 h-4" /> Order from Café (15% Off)
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="lawn" className="gap-2 bg-[#1B4D2E] text-white">
                  <Coffee className="w-4 h-4" /> Member Café Ordering
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Feature Highlights Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Single-Origin Roasts</h4>
              <p className="text-[11px] text-slate-600">Fresh Arabica, pour-overs & Nitro Cold Brew</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
            <div className="w-10 h-10 rounded-lg bg-[#1B4D2E] text-white flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Athlete Recovery Macros</h4>
              <p className="text-[11px] text-slate-600">Clean proteins, electrolyte elixirs & fresh bowls</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-blue-50/70 border border-blue-200/80">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">15% Member Discount</h4>
              <p className="text-[11px] text-slate-600">Gold & Silver members save on all F&B orders</p>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        {(() => {
          const rawItems = cafeItems.length > 0 ? cafeItems : [
            { id: 'f-1', name: 'Nitro Cold Brew Espresso', category: 'Coffee & Brews', price: 220, calories: 15, description: 'Slow-steeped 18 hours, infused with nitrogen for a velvety, creamy cascade finish.', image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&q=80' },
            { id: 'f-2', name: 'Avocado & Poached Egg Sourdough', category: 'Artisan Toasts', price: 320, calories: 380, description: 'Hass avocado mash, two free-range poached eggs, microgreens, and chili flakes on artisan sourdough.', image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80' },
            { id: 'f-3', name: 'Grilled Salmon & Quinoa Superbowl', category: 'Protein Bowls', price: 480, calories: 520, description: 'Pan-seared Atlantic salmon fillet, rainbow quinoa, edamame, roasted sweet potatoes, and lemon tahini.', image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80' },
            { id: 'f-4', name: 'Wild Berry Recovery Smoothie', category: 'Recovery Smoothies', price: 260, calories: 290, description: 'Blueberries, strawberries, acai, organic whey isolate, coconut water and chia seeds for rapid muscle reload.', image_url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&q=80' },
          ]
          const categories = ['All', ...new Set(rawItems.map((i) => i.category).filter(Boolean))]
          const filtered = activeCafeCategory === 'All' ? rawItems : rawItems.filter((i) => i.category === activeCafeCategory)
          const displayed = filtered.slice(0, 8)

          return (
            <>
              {categories.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCafeCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        activeCafeCategory === cat
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Menu Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayed.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-44 bg-slate-100 relative overflow-hidden">
                        <img
                          src={item.image_url || item.imageUrl || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80'}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold">
                          {item.category}
                        </span>
                        {item.calories && (
                          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-semibold">
                            {item.calories} kcal
                          </span>
                        )}
                      </div>

                      <div className="p-4 space-y-1.5">
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{item.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {item.description || 'Nutrient-rich post-match fuel crafted by club chefs.'}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div>
                          <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                            {formatCurrency(item.price)}
                          </span>
                          <span className="block text-[10px] font-bold text-emerald-700">
                            Member: {formatCurrency(item.price * 0.85)}
                          </span>
                        </div>

                        {user ? (
                          <Link to="/app/cafe">
                            <Button variant="lawn" size="sm" className="text-xs py-1 px-2.5 bg-[#1B4D2E]">
                              Order
                            </Button>
                          </Link>
                        ) : (
                          <Link to="/login">
                            <Button variant="outline" size="sm" className="text-xs py-1 px-2.5">
                              Order
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        })()}

        {/* Member Pre-order Court Delivery Banner */}
        <div className="mt-10 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-[#C85A32] text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1.5 max-w-xl">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider">
              Exclusive Member Perk
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Court-Side Delivery & Locker Pickup
            </h3>
            <p className="text-xs sm:text-sm text-white/90">
              Match running into a third set? Order hydration drinks or post-match protein shakes from your phone and our café team delivers directly to your court bench.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <Link to={user ? '/app/cafe' : '/register'}>
              <Button size="lg" className="bg-slate-950 hover:bg-slate-900 text-white font-bold border-0 shadow-lg">
                {user ? 'Open Café Menu' : 'Join & Get 15% Off'}
              </Button>
            </Link>
          </div>
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
