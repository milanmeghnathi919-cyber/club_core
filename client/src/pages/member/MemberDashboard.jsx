import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import courtService from '@/service/courtService'
import { formatCurrency, formatDate, formatTime } from '@/utils/format'
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
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

export const MemberDashboard = () => {
  const user = useSelector((state) => state.auth.user)
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  return (
    <div className="space-y-6 font-sans">
      {/* Gold Welcome Hero Card */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1B4D2E] via-[#12351F] to-[#0A1F13] text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.2),transparent_70%)] pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Active Gold Pass • 100% Free Court Access</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, {user?.name || 'Champion'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
              Your membership entitles you to priority booking, complimentary court access on clay & hard courts, and 15% off at the Pro Shop & Café.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/app/book">
              <Button variant="clay" size="lg" className="font-bold shadow-md">
                <Calendar className="w-4 h-4 mr-1.5" /> Book a Court
              </Button>
            </Link>
            <Link to="/app/pass">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                <CreditCard className="w-4 h-4 mr-1.5" /> Digital Pass
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Next Session Widget + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Upcoming Booking */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200">
            <CardHeader
              title="Next Scheduled Session"
              subtitle="Your upcoming match or practice booking"
              action={
                <Link to="/app/bookings" className="text-xs font-bold text-[#1B4D2E] hover:underline flex items-center gap-1">
                  View All ({upcoming.length}) <ArrowRight className="w-3 h-3" />
                </Link>
              }
            />
            <CardContent>
              {loading ? (
                <Skeleton className="h-28 rounded-xl" />
              ) : nextBooking ? (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#1B4D2E] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      <Trophy className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {nextBooking.court?.sport || nextBooking.court_sport || 'Court'}
                      </span>
                      <h4 className="font-bold text-base text-slate-900 mt-0.5">
                        {nextBooking.court?.name || nextBooking.court_name || 'Championship Court'}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {formatDate(nextBooking.startAt || nextBooking.start_at)} • {formatTime(nextBooking.startAt || nextBooking.start_at)} – {formatTime(nextBooking.endAt || nextBooking.end_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-200/60 px-3 py-1.5 rounded-lg">
                      Confirmed
                    </span>
                    <Link to="/app/bookings">
                      <Button variant="outline" size="sm" className="text-xs">
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 space-y-3">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">No upcoming court sessions</p>
                    <p className="text-xs text-slate-400 mt-0.5">Your courts are waiting. Reserve a session today.</p>
                  </div>
                  <Link to="/app/book">
                    <Button variant="lawn" size="sm">
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
          <Card className="border-slate-200 h-full flex flex-col justify-between">
            <CardHeader title="Your Gold Entitlements" subtitle="Tier: Gold Individual" />
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Court Booking:</span>
                <strong className="text-emerald-700 font-bold">100% Free Access</strong>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Daily Limit:</span>
                <strong className="text-slate-900 font-bold">Up to 4 Bookings / Day</strong>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Pro Shop Discount:</span>
                <strong className="text-slate-900 font-bold">15% Off All Gear</strong>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Club Cafe & Bar:</span>
                <strong className="text-slate-900 font-bold">15% Off Food & Drink</strong>
              </div>
            </CardContent>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <Link to="/app/pass">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  View Pass QR Code
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Club Café & Athlete Fuel Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-[#1B4D2E] text-white p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border border-amber-600/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                15% Member Discount Applied
              </span>
              <span className="text-xs text-amber-200">Court-Side Delivery Available</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              Fuel Up at The Club Café & Recovery Lounge
            </h3>
            <p className="text-xs text-slate-300 max-w-xl mt-0.5">
              Order fresh artisanal pour-overs, cold-pressed juices, protein superbowls, or recovery shakes from your phone. Pre-order for post-match pickup.
            </p>
          </div>
        </div>
        <Link to="/app/cafe" className="shrink-0 w-full md:w-auto">
          <Button variant="clay" className="w-full md:w-auto font-bold shadow-md gap-2">
            <Utensils className="w-4 h-4" /> Order from Café
          </Button>
        </Link>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Link to="/app/book" className="group">
          <Card hover className="p-4 border-slate-200 group-hover:border-[#1B4D2E] h-full flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#1B4D2E] flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Book Court</h4>
              <p className="text-xs text-slate-500 mt-1">Select court & time slot</p>
            </div>
          </Card>
        </Link>

        <Link to="/app/cafe" className="group">
          <Card hover className="p-4 border-slate-200 group-hover:border-amber-500 h-full flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                <Coffee className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm text-slate-900">Club Café</h4>
                <span className="text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">15% Off</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Order food & recovery fuel</p>
            </div>
          </Card>
        </Link>

        <Link to="/app/social" className="group">
          <Card hover className="p-4 border-slate-200 group-hover:border-indigo-500 h-full flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Friday Social</h4>
              <p className="text-xs text-slate-500 mt-1">Join the weekly mixer</p>
            </div>
          </Card>
        </Link>

        <Link to="/shop" className="group">
          <Card hover className="p-4 border-slate-200 group-hover:border-[#C85A32] h-full flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center mb-3">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Pro Shop</h4>
              <p className="text-xs text-slate-500 mt-1">15% member discount</p>
            </div>
          </Card>
        </Link>

        <Link to="/app/pass" className="group">
          <Card hover className="p-4 border-slate-200 group-hover:border-amber-500 h-full flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                <CreditCard className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Digital Pass</h4>
              <p className="text-xs text-slate-500 mt-1">Check-in at clubhouse</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}

export default MemberDashboard
