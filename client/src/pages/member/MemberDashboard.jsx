import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import authService from '@/service/authService'
import courtService from '@/service/courtService'
import { formatDate, formatTime } from '@/utils/format'
import {
  Trophy,
  Calendar,
  Clock,
  Users,
  ShoppingBag,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Coffee,
  Utensils,
  AlertCircle,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

export const MemberDashboard = () => {
  const user = useSelector((state) => state.auth.user)
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)
  const [membership, setMembership] = useState(null)
  const [, setLoadingMembership] = useState(true)

  useEffect(() => {
    authService
      .me()
      .then((data) => {
        if (data?.membership) {
          setMembership(data.membership)
        } else {
          setMembership(null)
        }
      })
      .catch(() => {
        setMembership(null)
      })
      .finally(() => setLoadingMembership(false))

    courtService
      .getMyBookings(true)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.items || data?.data || []
        setUpcoming(list)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const nextBooking = upcoming.find((b) => b.status === 'confirmed')
  const hasActiveMembership = Boolean(membership && membership.status === 'active')

  return (
    <div className="space-y-6 font-sans text-white">
      {/* Welcome Hero Card */}
      <div className="rounded-3xl bg-[#111418] text-white p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-white/10">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[#CCFF00]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
          <div className="space-y-2.5">
            {hasActiveMembership ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CCFF00]/15 text-[#CCFF00] text-xs font-black uppercase tracking-wider border border-[#CCFF00]/30 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Active {membership.plan_name || 'Gold'} Pass • {membership.court_discount_pct ?? 100}% Court Discount</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-slate-300 text-xs font-bold border border-white/10">
                <AlertCircle className="w-3.5 h-3.5 text-[#CCFF00]" />
                <span>Standard Club Guest • No Active Membership Tier</span>
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display uppercase">
              Welcome back, {user?.name || 'Champion'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              {hasActiveMembership
                ? `Your ${membership.plan_name || 'membership'} entitles you to priority booking, complimentary court access on clay & hard courts, and ${membership.shop_discount_pct ?? 15}% off at the Pro Shop & Café.`
                : 'You currently do not have an active membership subscription. Subscribe to a tier to unlock complimentary court sessions, 15% discounts at the Pro Shop & Café, and priority reservations.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasActiveMembership ? (
              <>
                <Link to="/app/book">
                  <Button variant="volt" size="lg" className="font-black shadow-lg shadow-[#CCFF00]/25">
                    <Calendar className="w-4 h-4 mr-1.5 stroke-[3]" /> Book a Court
                  </Button>
                </Link>
                <Link to="/app/pass">
                  <Button variant="dark" size="lg" className="border-white/15 text-white">
                    <CreditCard className="w-4 h-4 mr-1.5" /> Digital Pass
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/plans">
                  <Button variant="volt" size="lg" className="font-black shadow-lg shadow-[#CCFF00]/25">
                    <Sparkles className="w-4 h-4 mr-1.5 stroke-[3]" /> Explore Plans
                  </Button>
                </Link>
                <Link to="/app/book">
                  <Button variant="dark" size="lg" className="border-white/15 text-white">
                    <Calendar className="w-4 h-4 mr-1.5" /> Book Court
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Next Session Widget + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Upcoming Booking */}
        <div className="lg:col-span-2">
          <Card className="bg-[#111418] border-white/10 rounded-3xl h-full flex flex-col justify-between">
            <CardHeader
              title="Next Scheduled Session"
              subtitle="Your upcoming match or practice booking"
              action={
                <Link to="/app/bookings" className="text-xs font-black text-[#CCFF00] hover:underline flex items-center gap-1">
                  View All ({upcoming.length}) <ArrowRight className="w-3 h-3 stroke-[3]" />
                </Link>
              }
            />
            <CardContent>
              {loading ? (
                <Skeleton className="h-28 rounded-2xl bg-white/5" />
              ) : nextBooking ? (
                <div className="p-4 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/30 flex items-center justify-center font-bold text-sm shrink-0">
                      <Trophy className="w-6 h-6 text-[#CCFF00]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-black bg-[#CCFF00] px-2 py-0.5 rounded-full">
                        {nextBooking.court?.sport || nextBooking.court_sport || 'Court'}
                      </span>
                      <h4 className="font-bold text-base text-white mt-1">
                        {nextBooking.court?.name || nextBooking.court_name || 'Championship Court'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(nextBooking.startAt || nextBooking.start_at)} • {formatTime(nextBooking.startAt || nextBooking.start_at)} – {formatTime(nextBooking.endAt || nextBooking.end_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center">
                    <span className="text-xs font-black uppercase text-black bg-[#CCFF00] px-3 py-1.5 rounded-xl shadow-xs">
                      Confirmed
                    </span>
                    <Link to="/app/bookings">
                      <Button variant="dark" size="sm" className="text-xs border-white/15">
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 space-y-3">
                  <Clock className="w-10 h-10 text-slate-600 mx-auto" />
                  <div>
                    <p className="text-sm font-bold text-white">No upcoming court sessions</p>
                    <p className="text-xs text-slate-400 mt-0.5">Your courts are waiting. Reserve a session today.</p>
                  </div>
                  <Link to="/app/book">
                    <Button variant="volt" size="sm" className="font-black">
                      Reserve a Court
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Privileges Tile */}
        <div>
          <Card className="bg-[#111418] border-white/10 rounded-3xl h-full flex flex-col justify-between">
            <CardHeader
              title={hasActiveMembership ? `Your ${membership.plan_name || 'Member'} Entitlements` : 'Club Guest Status'}
              subtitle={hasActiveMembership ? `Tier: ${membership.plan_name || 'Active Member'}` : 'Tier: No Active Plan'}
            />
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-slate-400 font-medium">Court Booking:</span>
                <strong className={hasActiveMembership ? 'text-[#CCFF00] font-bold' : 'text-slate-300 font-bold'}>
                  {hasActiveMembership ? `${membership.court_discount_pct ?? 100}% Discount` : 'Standard Rates (0% Off)'}
                </strong>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-slate-400 font-medium">Daily Limit:</span>
                <strong className="text-white font-bold">
                  {hasActiveMembership ? `Up to ${membership.max_bookings_per_day || 2} Bookings / Day` : '2 Bookings / Day'}
                </strong>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-slate-400 font-medium">Pro Shop Discount:</span>
                <strong className="text-[#CCFF00] font-bold">
                  {hasActiveMembership ? `${membership.shop_discount_pct ?? 15}% Off All Gear` : '0% Off (Standard)'}
                </strong>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-slate-400 font-medium">Club Cafe & Bar:</span>
                <strong className="text-[#CCFF00] font-bold">
                  {hasActiveMembership ? `${membership.bar_discount_pct ?? 15}% Off Food & Drink` : '0% Off (Standard)'}
                </strong>
              </div>
            </CardContent>
            <div className="p-4 border-t border-white/10 bg-white/[0.02]">
              {hasActiveMembership ? (
                <Link to="/app/pass">
                  <Button variant="dark" size="sm" className="w-full text-xs border-white/15">
                    View Pass QR Code
                  </Button>
                </Link>
              ) : (
                <Link to="/plans">
                  <Button variant="volt" size="sm" className="w-full text-xs font-black">
                    Unlock Membership Perks
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Club Café & Athlete Fuel Banner */}
      <div className="rounded-3xl bg-[#111418] text-white p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30 flex items-center justify-center shrink-0">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#CCFF00] text-black px-2.5 py-0.5 rounded-full">
                {hasActiveMembership
                  ? `${membership.bar_discount_pct ?? 15}% Member Discount Applied`
                  : 'Standard Café Rates • Subscribe for 15% Off'}
              </span>
              <span className="text-xs text-[#CCFF00]">Court-Side Delivery Available</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              Fuel Up at The Club Café & Recovery Lounge
            </h3>
            <p className="text-xs text-slate-400 max-w-xl mt-0.5">
              Order fresh artisanal pour-overs, cold-pressed juices, protein superbowls, or recovery shakes from your phone. Pre-order for post-match pickup.
            </p>
          </div>
        </div>
        <Link to="/app/cafe" className="shrink-0 w-full md:w-auto">
          <Button variant="volt" className="w-full md:w-auto font-black shadow-lg shadow-[#CCFF00]/20 gap-2">
            <Utensils className="w-4 h-4 stroke-[3]" /> Order from Café
          </Button>
        </Link>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Link to="/app/book" className="group">
          <Card hover className="p-4 bg-[#111418] border-white/10 group-hover:border-[#CCFF00]/50 rounded-2xl h-full flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/15 text-[#CCFF00] flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Book Court</h4>
              <p className="text-xs text-slate-400 mt-1">Select court & time slot</p>
            </div>
          </Card>
        </Link>

        <Link to="/app/cafe" className="group">
          <Card hover className="p-4 bg-[#111418] border-white/10 group-hover:border-[#CCFF00]/50 rounded-2xl h-full flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/15 text-[#CCFF00] flex items-center justify-center mb-3">
                <Coffee className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm text-white">Club Café</h4>
                {hasActiveMembership && (
                  <span className="text-[9px] font-black uppercase bg-[#CCFF00] text-black px-1.5 py-0.2 rounded">
                    {membership.bar_discount_pct || 15}% Off
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">Order food & recovery fuel</p>
            </div>
          </Card>
        </Link>

        <Link to="/app/social" className="group">
          <Card hover className="p-4 bg-[#111418] border-white/10 group-hover:border-[#CCFF00]/50 rounded-2xl h-full flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Friday Social</h4>
              <p className="text-xs text-slate-400 mt-1">Join the weekly mixer</p>
            </div>
          </Card>
        </Link>

        <Link to="/shop" className="group">
          <Card hover className="p-4 bg-[#111418] border-white/10 group-hover:border-[#CCFF00]/50 rounded-2xl h-full flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/15 text-[#CCFF00] flex items-center justify-center mb-3">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Pro Shop</h4>
              <p className="text-xs text-slate-400 mt-1">
                {hasActiveMembership ? `${membership.shop_discount_pct || 15}% member discount` : 'Official club equipment'}
              </p>
            </div>
          </Card>
        </Link>

        <Link to="/app/pass" className="group">
          <Card hover className="p-4 bg-[#111418] border-white/10 group-hover:border-[#CCFF00]/50 rounded-2xl h-full flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <CreditCard className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Digital Pass</h4>
              <p className="text-xs text-slate-400 mt-1">Check-in at clubhouse</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}

export default MemberDashboard
