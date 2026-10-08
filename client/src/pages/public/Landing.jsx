import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import publicService from '@/service/publicService'
import { formatCurrency } from '@/utils/format'
import useToast from '@/components/ui/Toast'
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
  Store,
  Flame,
  Check,
  Phone,
  Mail,
  UserCheck,
  Activity,
  Layers,
  ChevronRight,
  TrendingUp,
  Globe,
  Play,
  Award,
  DollarSign,
  ChevronDown,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import CyberCourtBackground from '@/components/common/CyberCourtBackground'

export const Landing = () => {
  const toast = useToast()
  const [, setClub] = useState(null)
  const [plans, setPlans] = useState([])
  const [courts, setCourts] = useState([])
  const [billingCycle, setBillingCycle] = useState('annual')

  // Trial booking modal
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [trialForm, setTrialForm] = useState({
    name: '',
    email: '',
    phone: '',
    sport: 'tennis',
    experience: 'intermediate',
    preferredTime: '18:00',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  })
  const [submittingTrial, setSubmittingTrial] = useState(false)
  const [trialConfirmed, setTrialConfirmed] = useState(null)

  useEffect(() => {
    publicService.getClubInfo().then(setClub).catch(console.error)
    publicService.getPlans().then(setPlans).catch(console.error)
    publicService.getCourts().then(setCourts).catch(console.error)
  }, [])

  const handleTrialSubmit = async (e) => {
    e.preventDefault()
    if (!trialForm.name || (!trialForm.phone && !trialForm.email)) {
      toast.error('Please enter your name and contact details')
      return
    }

    setSubmittingTrial(true)
    try {
      const payload = {
        name: trialForm.name,
        email: trialForm.email || undefined,
        phone: trialForm.phone || undefined,
        sport: trialForm.sport,
        interest: 'trial',
        message: `Trial session request for ${trialForm.sport.toUpperCase()} at ${trialForm.preferredTime} on ${trialForm.date}. Skill: ${trialForm.experience}.`,
      }
      const res = await publicService.submitEnquiry(payload)
      setTrialConfirmed(res)
      toast.success('Trial booking request submitted! Concierge will confirm your slot.')
    } catch {
      toast.error('Unable to submit trial request. Please try again.')
    } finally {
      setSubmittingTrial(false)
    }
  }

  return (
    <div className="bg-[#090B0E] text-white space-y-28 pb-28 font-sans selection:bg-[#CCFF00] selection:text-black overflow-x-hidden">
      {/* 1. HERO SECTION: "DOMINATE THE COURT" (Cyber Volt Animated Hero) */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Dynamic 60fps Cyber Court Perspective & Particle Background Animation */}
        <CyberCourtBackground />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Big Display Copy */}
          <div className="lg:col-span-7 space-y-7 z-10">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-bold text-slate-200">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-ping" />
              <span className="text-[#CCFF00]">•</span>
              <span>Next-Gen Sports Sanctuary</span>
            </div>

            {/* Giant Title */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.98] font-display uppercase">
              DOMINATE <br />
              THE <br />
              <span className="text-[#CCFF00] drop-shadow-[0_0_40px_rgba(204,255,0,0.4)]">
                COURT
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed max-w-xl">
              Smart 30-min booking, instant matchmaking, and live statistics. The digital operating backbone for padel, tennis, badminton, and cricket champions.
            </p>

            {/* CTAs: Neon Pill + Dark Translucent Button */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/availability">
                <button className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#CCFF00] hover:bg-[#B4E600] text-black font-extrabold text-sm shadow-xl shadow-[#CCFF00]/25 hover:shadow-[#CCFF00]/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer">
                  <span>Book a Court</span>
                  <ArrowRight className="w-4 h-4 font-bold stroke-[3]" />
                </button>
              </Link>
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/15 backdrop-blur-md text-sm font-bold hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white text-white" />
                <span>Watch Demo</span>
              </button>
            </div>
          </div>

          {/* Right Column: Athlete Action Image with Floating Widgets */}
          <div className="lg:col-span-5 relative z-10 flex justify-center">
            <div className="relative w-full max-w-md lg:max-w-none rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-[#12161D] group">
              {/* Main Action Photo (Athlete Smashing in Modern Arena) */}
              <img
                src="https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=1200&q=80"
                alt="Padel / Tennis Champion in Motion"
                className="w-full h-[480px] sm:h-[540px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090B0E] via-transparent to-black/30" />

              {/* Floating Widget 1: Top Right "Court Booked" (Exact Reference Element) */}
              <div className="absolute top-6 right-6 p-3 rounded-2xl bg-[#0F1216]/85 backdrop-blur-md border border-white/15 shadow-2xl flex items-center gap-3 animate-float">
                <div className="w-9 h-9 rounded-xl bg-[#CCFF00]/20 text-[#CCFF00] flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5 text-[#CCFF00]" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Court Booked</p>
                  <p className="text-xs font-extrabold text-white">Today 6:00 PM</p>
                </div>
              </div>

              {/* Floating Widget 2: Bottom Left "Players Active" (Exact Reference Element) */}
              <div className="absolute bottom-6 left-6 p-3 rounded-2xl bg-[#0F1216]/85 backdrop-blur-md border border-white/15 shadow-2xl flex items-center gap-3 animate-float-delayed">
                <div className="w-9 h-9 rounded-xl bg-[#CCFF00] text-black flex items-center justify-center font-bold">
                  <Users className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Players Online</p>
                  <p className="text-sm font-extrabold text-white tabular-nums">2,847</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION 2: "MANAGE YOUR CLUB LIKE A PRO" (Exact Reference Section) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Monochrome Athletic Photo with Floating Stat Badges */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-[#111418]">
              <img
                src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80"
                alt="Padel & Tennis Match Gear"
                className="w-full h-[420px] sm:h-[480px] object-cover filter grayscale contrast-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090B0E] via-transparent to-transparent" />

              {/* Floating Metric Badges Overlay (As in Reference) */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#0F1216]/90 backdrop-blur-md border border-white/15">
                <div className="text-center px-2">
                  <p className="text-lg sm:text-xl font-black text-[#CCFF00] tabular-nums">98%</p>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Court Utilization</p>
                </div>
                <div className="h-8 w-px bg-white/15" />
                <div className="text-center px-2">
                  <p className="text-lg sm:text-xl font-black text-white tabular-nums">+45%</p>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Revenue Growth</p>
                </div>
                <div className="h-8 w-px bg-white/15" />
                <div className="text-center px-2">
                  <p className="text-lg sm:text-xl font-black text-[#CCFF00] tabular-nums">4.9★</p>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Member Rating</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Feature Content & 4 Cards Grid */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] text-xs font-bold uppercase tracking-wider">
              <span>• FOR CLUBS & PLAYERS</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight font-display leading-[1.05]">
              MANAGE YOUR <br />
              <span className="text-[#CCFF00]">CLUB LIKE A PRO</span>
            </h2>

            <p className="text-sm text-slate-400 leading-relaxed">
              Comprehensive management tools for clubs, coaches, and players. Streamline operations, eliminate WhatsApp booking chaos, and scale without friction.
            </p>

            {/* 4 Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#111418] border border-white/10 hover:border-[#CCFF00]/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white/10 text-[#CCFF00] flex items-center justify-center mb-3">
                  <Calendar className="w-4 h-4 text-[#CCFF00]" />
                </div>
                <h4 className="font-bold text-sm text-white">Court Management</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Optimize scheduling with 30-min start grid and zero double-booking invariant.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#111418] border border-white/10 hover:border-[#CCFF00]/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white/10 text-[#CCFF00] flex items-center justify-center mb-3">
                  <TrendingUp className="w-4 h-4 text-[#CCFF00]" />
                </div>
                <h4 className="font-bold text-sm text-white">Revenue Analytics</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Single financial ledger across courts, pro shop, and bar in real time.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#111418] border border-white/10 hover:border-[#CCFF00]/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white/10 text-[#CCFF00] flex items-center justify-center mb-3">
                  <Trophy className="w-4 h-4 text-[#CCFF00]" />
                </div>
                <h4 className="font-bold text-sm text-white">Coach & Player Profiles</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Showcase certified coaches, match ratings, and digital scannable passes.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#111418] border border-white/10 hover:border-[#CCFF00]/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white/10 text-[#CCFF00] flex items-center justify-center mb-3">
                  <Users className="w-4 h-4 text-[#CCFF00]" />
                </div>
                <h4 className="font-bold text-sm text-white">Member Insights</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Understand athlete frequency with automated expiry and renewal workflows.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/plans">
                <button className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#CCFF00] hover:underline cursor-pointer">
                  <span>Learn More</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION 3: "JOIN THE GLOBAL SPORTS REVOLUTION" & Live Community Pulse (Exact Reference) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <span>• COMMUNITY</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight font-display">
            JOIN THE GLOBAL <br />
            <span className="text-[#CCFF00]">SPORTS REVOLUTION</span>
          </h2>

          <p className="text-sm text-slate-400 leading-relaxed">
            Connect with players worldwide. Compete, learn, and grow together in Bengaluru&rsquo;s most vibrant athletics community.
          </p>
        </div>

        {/* 2-Column Dashboard Cards: Community Pulse + Facility Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Card 1: COMMUNITY PULSE (Live Activity Feed) */}
          <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-[#111418] border border-white/10 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                  LIVE RIGHT NOW
                </span>
                <h3 className="text-xl font-black text-white font-display">COMMUNITY PULSE</h3>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#CCFF00]/15 border border-[#CCFF00]/30 text-[#CCFF00] text-[10px] font-extrabold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
                <span>LIVE</span>
              </div>
            </div>

            {/* Top 3 Counters (Reference Image Chips) */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center">
                <p className="text-xl sm:text-2xl font-black text-[#CCFF00] tabular-nums font-display">4,282</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Players Online</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center">
                <p className="text-xl sm:text-2xl font-black text-white tabular-nums font-display">184</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Matches This Week</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center">
                <p className="text-xl sm:text-2xl font-black text-amber-400 tabular-nums font-display">24</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Active Social Teams</p>
              </div>
            </div>

            {/* Recent Live Activity Stream */}
            <div className="space-y-3">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                RECENT ACTIVITY
              </span>
              {[
                { name: 'Arun Kumar (Gold Member)', action: 'Booked Clay Tennis Court 1 for 18:00', time: '2m ago' },
                { name: 'Maria Sharapova', action: 'Settled Clubhouse Café bill via UPI', time: '5m ago' },
                { name: 'Alex Kostov', action: 'Registered for Friday Night Social Mixer', time: '8m ago' },
                { name: 'Sofia Rodriguez', action: 'Purchased Wilson Pro Staff Racket (Click & Collect)', time: '12m ago' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-xs hover:border-white/15 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#CCFF00]/20 text-[#CCFF00] flex items-center justify-center font-bold text-[10px]">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-white">{item.name}</span>
                      <span className="text-slate-400 ml-2">{item.action}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Facility & Court Reach */}
          <div className="lg:col-span-4 p-6 sm:p-8 rounded-3xl bg-[#111418] border border-white/10 shadow-xl space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                    6 CHAMPIONSHIP COURTS
                  </span>
                  <h3 className="text-xl font-black text-white font-display">COURT STATUS</h3>
                </div>
                <Globe className="w-5 h-5 text-[#CCFF00]" />
              </div>

              <div className="space-y-3.5 mt-5">
                {(courts && courts.length > 0
                  ? courts.slice(0, 6).map((c) => ({
                      name: c.name,
                      rate: `${formatCurrency(c.hourlyRate || 800)}/hr`,
                      status: c.isActive !== false ? 'Available' : 'Booked',
                    }))
                  : [
                      { name: 'Tennis Clay 1', rate: '₹800/hr', status: 'Booked' },
                      { name: 'Tennis Hard 2', rate: '₹800/hr', status: 'Available' },
                      { name: 'Padel Glass 1', rate: '₹1200/hr', status: 'Available' },
                      { name: 'Badminton Court 1', rate: '₹400/hr', status: 'Booked' },
                      { name: 'Badminton Court 2', rate: '₹400/hr', status: 'Available' },
                      { name: 'Box Cricket Net', rate: '₹1500/hr', status: 'Available' },
                    ]
                ).map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-[11px]">{c.rate}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          c.status === 'Available'
                            ? 'bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/40'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link to="/availability" className="block pt-4">
              <button className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-white/10">
                View Live 7-Day Grid
              </button>
            </Link>
          </div>
        </div>

        {/* Action Banner: "READY TO JOIN 50,000+ PLAYERS?" (Reference Bar) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#12161D] via-[#1A202C] to-[#0F141C] border border-white/15 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-black uppercase text-white font-display">
              READY TO PLAY WITH <span className="text-[#CCFF00]">4,000+ ATHLETES</span>?
            </h3>
            <p className="text-xs text-slate-400">
              Start connecting, reserving courts, and improving your game today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTrialModalOpen(true)}
              className="px-6 py-3 rounded-full bg-[#CCFF00] hover:bg-[#B4E600] text-black font-extrabold text-xs shadow-lg shadow-[#CCFF00]/25 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              Book Complimentary Trial
            </button>
            <Link to="/plans">
              <button className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-colors cursor-pointer">
                Explore Plans
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. SECTION 4: "YOUR COMMAND CENTER ALL IN ONE PLACE" (Reference Section) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] text-xs font-bold uppercase tracking-wider">
            <span>• DASHBOARD PREVIEW</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight font-display">
            YOUR COMMAND CENTER <br />
            <span className="text-[#CCFF00]">ALL IN ONE PLACE</span>
          </h2>

          <p className="text-sm text-slate-400 leading-relaxed">
            Control everything from our intuitive operating portals. View match statistics, manage bookings, order post-match dining, and track club financials.
          </p>
        </div>

        {/* Interactive Command Center Portal Mock */}
        <div className="rounded-3xl bg-[#0D1015] border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-[#CCFF00]" />
              <span className="text-xs font-mono text-slate-400 ml-2">app.championsclub.in</span>
            </div>

            {/* Quick Portal Tabs */}
            <div className="flex items-center gap-2">
              <Link to="/app">
                <button className="px-3 py-1 rounded-lg bg-[#CCFF00] text-black text-xs font-extrabold hover:scale-105 transition-transform cursor-pointer">
                  Athlete Portal (/app)
                </button>
              </Link>
              <Link to="/staff/bookings">
                <button className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors cursor-pointer">
                  Staff Console (/staff)
                </button>
              </Link>
              <Link to="/bar">
                <button className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors cursor-pointer">
                  Bar & KDS (/bar)
                </button>
              </Link>
              <Link to="/owner">
                <button className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors cursor-pointer">
                  Owner Executive (/owner)
                </button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#14181F] border border-white/10 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400">Athlete Invariant</span>
              <h4 className="text-base font-extrabold text-white">Zero Double-Booking Guarantee</h4>
              <p className="text-xs text-slate-400">
                PostgreSQL btree_gist database exclusion constraint strictly guarantees two players can never reserve the same court.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#14181F] border border-white/10 space-y-2">
              <span className="text-[10px] font-bold uppercase text-[#CCFF00]">Retail Invariant</span>
              <h4 className="text-base font-extrabold text-white">Single-Shelf Unified Stock</h4>
              <p className="text-xs text-slate-400">
                What a member buys at the front counter and what they order from home draw from the exact same inventory ledger.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#14181F] border border-white/10 space-y-2">
              <span className="text-[10px] font-bold uppercase text-amber-400">Executive Invariant</span>
              <h4 className="text-base font-extrabold text-white">Single Revenue Ledger</h4>
              <p className="text-xs text-slate-400">
                100% of money arrives across courts, pro shop, and bar directly into a unified P&L reporting engine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MEMBERSHIP TIERS MATRIX (Gold VIP Highlight in Cyber-Volt) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <span>• MEMBERSHIP PRIVILEGES</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight font-display">
            TIERED PASSES FOR <br />
            <span className="text-[#CCFF00]">ELITE PERFORMANCE</span>
          </h2>

          <p className="text-sm text-slate-400 leading-relaxed">
            Choose your athletic tier. Unlock 100% complimentary court access, pro shop discounts, and priority booking windows.
          </p>

          {/* Billing Switch */}
          <div className="inline-flex items-center gap-2 mt-4 p-1 rounded-full bg-white/10 border border-white/15">
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-[#CCFF00] text-black shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Annual Pass (Save 20%)
            </button>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-[#CCFF00] text-black shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Quarterly Flex
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.slice(0, 3).map((p) => {
            const isGold = p.code?.toLowerCase().includes('gold')
            const price = billingCycle === 'annual' ? p.price : Math.round(p.price * 0.3)

            return (
              <div
                key={p.id}
                className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                  isGold
                    ? 'bg-[#12161D] border-2 border-[#CCFF00] shadow-2xl scale-102 glow-volt z-10'
                    : 'bg-[#0E1116] border border-white/10 hover:border-white/20'
                }`}
              >
                {isGold && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#CCFF00] text-black text-[10px] font-black uppercase tracking-widest shadow-lg">
                    ★ FLAGSHIP GOLD TIER
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-white font-display uppercase">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {isGold ? '100% Free Court Access & Maximum Privileges' : 'Competitive athlete membership'}
                    </p>
                  </div>

                  <div className="py-4 border-y border-white/10 space-y-1">
                    <div className="flex items-baseline">
                      <span className="text-3xl sm:text-4xl font-black text-white tabular-nums font-display">
                        {formatCurrency(price)}
                      </span>
                      <span className="text-xs text-slate-400 ml-1.5">
                        / {billingCycle === 'annual' ? 'year' : 'quarter'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <span className="text-slate-400 font-medium">
                        Equivalent to <strong className="text-white font-bold">{formatCurrency(Math.round(billingCycle === 'annual' ? p.price / 12 : price / 3))}</strong> / mo
                      </span>
                      <span className="text-[#CCFF00] font-bold">GST Inclusive</span>
                    </div>
                    <div className="mt-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Est. Facility Value:</span>
                      <span className="font-extrabold text-[#CCFF00]">
                        {isGold ? '₹1,80,000+/yr' : p.code?.toLowerCase().includes('silver') ? '₹75,000+/yr' : '₹45,000+/yr'}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
                      <span>
                        <strong className="text-white">{p.court_discount_pct}% Court Discount</strong>{' '}
                        {p.court_discount_pct === 100 ? '(Free Unlimited Play)' : ''}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
                      <span>{p.shop_discount_pct}% Off Pro Shop Gear & Restringing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
                      <span>{p.bar_discount_pct}% Off Clubhouse Café & Energy Bar</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
                      <span>Max {p.max_bookings_per_day} Sessions Per Day Allowance</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <Link to={`/register?plan=${p.code?.toLowerCase() || 'gold'}`}>
                    <button
                      className={`w-full py-3.5 rounded-full font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        isGold
                          ? 'bg-[#CCFF00] hover:bg-[#B4E600] text-black shadow-lg shadow-[#CCFF00]/25'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                      }`}
                    >
                      Join as {p.name.split(' ')[0]}
                    </button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 6. TRIAL MODAL */}
      <Modal
        isOpen={isTrialModalOpen}
        onClose={() => {
          setIsTrialModalOpen(false)
          setTrialConfirmed(null)
        }}
        title="Book a Complimentary Trial Session"
        subtitle="Experience Bengaluru's premier sports sanctuary with a free trial match."
      >
        {trialConfirmed ? (
          <div className="space-y-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full bg-[#CCFF00]/20 text-[#CCFF00] flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white">Trial Request Logged!</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Our front-desk concierge has received your booking and logged it into our CRM. A staff member will confirm your court slot shortly.
            </p>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-[#CCFF00]">
              Ref ID: {trialConfirmed.id || trialConfirmed.leadId || 'CHAMP-TRIAL-OK'}
            </div>
            <Button
              variant="volt"
              onClick={() => {
                setIsTrialModalOpen(false)
                setTrialConfirmed(null)
              }}
              className="mt-2 w-full"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleTrialSubmit} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                value={trialForm.name}
                onChange={(e) => setTrialForm({ ...trialForm, name: e.target.value })}
                placeholder="e.g. Arun Kumar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#CCFF00]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={trialForm.phone}
                  onChange={(e) => setTrialForm({ ...trialForm, phone: e.target.value })}
                  placeholder="+91 98765 00000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#CCFF00]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={trialForm.email}
                  onChange={(e) => setTrialForm({ ...trialForm, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#CCFF00]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Sport</label>
                <select
                  value={trialForm.sport}
                  onChange={(e) => setTrialForm({ ...trialForm, sport: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#CCFF00]"
                >
                  <option value="tennis">Tennis (Clay / Hard)</option>
                  <option value="padel">Padel Arena</option>
                  <option value="badminton">Badminton (BWF Court)</option>
                  <option value="cricket">Box Cricket</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Skill Level</label>
                <select
                  value={trialForm.experience}
                  onChange={(e) => setTrialForm({ ...trialForm, experience: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#CCFF00]"
                >
                  <option value="beginner">Beginner (First Time)</option>
                  <option value="intermediate">Intermediate (Club Player)</option>
                  <option value="advanced">Advanced / Tournament</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  value={trialForm.date}
                  onChange={(e) => setTrialForm({ ...trialForm, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#CCFF00]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot</label>
                <select
                  value={trialForm.preferredTime}
                  onChange={(e) => setTrialForm({ ...trialForm, preferredTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#090B0E] text-white text-xs font-medium focus:ring-2 focus:ring-[#CCFF00]"
                >
                  <option value="07:00" className="bg-[#111418] text-white">07:00 AM (Morning)</option>
                  <option value="09:00" className="bg-[#111418] text-white">09:00 AM (Morning)</option>
                  <option value="17:00" className="bg-[#111418] text-white">05:00 PM (Evening)</option>
                  <option value="18:00" className="bg-[#111418] text-white">06:00 PM (Prime Evening)</option>
                  <option value="19:30" className="bg-[#111418] text-white">07:30 PM (Night Lights)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsTrialModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="volt"
                size="sm"
                loading={submittingTrial}
                className="font-bold uppercase text-xs"
              >
                Submit Trial Request
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* 7. WATCH DEMO MODAL */}
      <Modal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        title="Experience The Champions Club"
        subtitle="A quick overview of our world-class digital athletics operating system."
      >
        <div className="space-y-4 py-2">
          <div className="rounded-2xl overflow-hidden bg-black aspect-video relative flex items-center justify-center border border-white/10">
            <img
              src="https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=800&q=80"
              alt="Club Arena Overview"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#CCFF00] text-black flex items-center justify-center shadow-2xl animate-pulse">
                <Play className="w-6 h-6 fill-black ml-1" />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">What makes The Champions Club unique:</h4>
            <p>• Zero double-booking guarantee backed by strict SQLite/PostgreSQL database locking.</p>
            <p>• 1-hour sessions starting every 30 minutes (:00 & :30 grid).</p>
            <p>• Single-shelf pro shop inventory shared between front counter and web orders.</p>
            <p>• Live Kitchen Display System (KDS) & running tabs for post-match dining.</p>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="volt" size="sm" onClick={() => setIsVideoModalOpen(false)}>
              Got It
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Landing
