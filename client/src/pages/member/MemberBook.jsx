import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import SlotGrid from '@/components/common/SlotGrid'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import useToast from '@/components/ui/Toast'
import courtService from '@/service/courtService'
import authService from '@/service/authService'
import { formatCurrency, formatTime, formatDate } from '@/utils/format'
import { Calendar, CheckCircle2 } from 'lucide-react'

const SPORTS = [
  { label: 'All Sports', value: '' },
  { label: 'Tennis (Clay/Hard)', value: 'tennis' },
  { label: 'Padel Glass', value: 'padel' },
  { label: 'Badminton', value: 'badminton' },
  { label: 'Box Cricket', value: 'cricket' },
]

export const MemberBook = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [sport, setSport] = useState('')
  const [selectedSlotInfo, setSelectedSlotInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [membership, setMembership] = useState(null)

  useEffect(() => {
    authService.me().then((res) => {
      if (res?.membership) setMembership(res.membership)
    }).catch(() => {})
  }, [])

  const handleSelectSlot = ({ court, slot }) => {
    setSelectedSlotInfo({ court, slot })
  }

  const handleConfirmBooking = async () => {
    if (!selectedSlotInfo) return
    setLoading(true)

    try {
      const courtId = selectedSlotInfo.court?.courtId || selectedSlotInfo.court?.id
      const startAt = selectedSlotInfo.slot?.startAt

      const res = await courtService.createBooking({
        courtId,
        startAt,
        paymentMethod: 'pay_at_club',
      })

      setBookingSuccess(res.booking || res)
      toast.success('Court reserved successfully! Enjoy your match.')
      setSelectedSlotInfo(null)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      if (err.code === 'DAILY_LIMIT_REACHED') {
        toast.error('Daily booking limit reached for today (max active bookings reached).')
      } else if (err.code === 'SLOT_TAKEN') {
        toast.error('This slot was just booked by another player. Schedule updated.')
        setRefreshKey((k) => k + 1)
      } else {
        toast.error(err.message || 'Failed to book slot')
      }
    } finally {
      setLoading(false)
    }
  }

  const hasActiveMembership = Boolean(membership && (membership.status === 'active' || !membership.status))
  const courtDiscountPct = hasActiveMembership ? Number(membership.court_discount_pct ?? 100) : 0
  const ratePerHour = Number(selectedSlotInfo?.court?.ratePerHour || selectedSlotInfo?.court?.rate_per_hour || 600)
  const discountAmount = Math.round((ratePerHour * courtDiscountPct) / 100)
  const payableAmount = Math.max(0, ratePerHour - discountAmount)

  return (
    <div className="space-y-6 font-sans">
      {/* Title & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#CCFF00] text-black">
            Court Reservations
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mt-3">
            Book Championship Court
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {hasActiveMembership
              ? `${membership?.plan_name || 'Member'}: ${courtDiscountPct}% complimentary access applied automatically across all courts.`
              : 'Standard Club Guest: Standard hourly rates apply. Upgrade to a Membership Plan for complimentary court sessions.'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#111418] px-3 py-1.5 rounded-xl border border-white/10 text-xs shadow-2xs">
            <Calendar className="w-4 h-4 text-[#CCFF00]" />
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-bold text-white bg-transparent focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#111418] p-1 rounded-xl border border-white/10">
            {SPORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSport(s.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  sport === s.value
                    ? 'bg-[#CCFF00] text-black shadow-xs font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Success Banner if just booked */}
      {bookingSuccess && (
        <div className="p-5 rounded-2xl bg-[#111418] border border-[#CCFF00] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_25px_rgba(204,255,0,0.15)] animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-[#CCFF00] shrink-0" />
            <div>
              <h4 className="font-extrabold text-base text-white">Booking Confirmed!</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Booking Reference:{' '}
                <strong className="font-mono text-[#CCFF00]">{bookingSuccess.bookingNo || bookingSuccess.booking_no || 'CONFIRMED'}</strong> •{' '}
                {bookingSuccess.court?.name || bookingSuccess.court_name || 'Court'} at {formatTime(bookingSuccess.startAt || bookingSuccess.start_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="volt" size="sm" onClick={() => navigate('/app/bookings')}>
              View My Bookings
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBookingSuccess(null)}>
              Book Another
            </Button>
          </div>
        </div>
      )}

      {/* Slot Grid Matrix */}
      <SlotGrid
        key={refreshKey}
        selectedDate={selectedDate}
        sport={sport}
        mode="member"
        onSelectSlot={handleSelectSlot}
      />

      {/* Booking Confirmation Modal */}
      <Modal
        isOpen={!!selectedSlotInfo}
        onClose={() => setSelectedSlotInfo(null)}
        title="Confirm Court Reservation"
        subtitle={`${selectedSlotInfo?.court?.courtName || selectedSlotInfo?.court?.name} • ${formatDate(selectedDate)}`}
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setSelectedSlotInfo(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="volt"
              size="md"
              loading={loading}
              onClick={handleConfirmBooking}
              className="font-black"
            >
              {payableAmount === 0 ? 'Confirm Reservation (Free)' : `Confirm Reservation (${formatCurrency(payableAmount)})`}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2 font-sans">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Court Arena:</span>
              <strong className="text-white font-bold">
                {selectedSlotInfo?.court?.courtName || selectedSlotInfo?.court?.name}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Time Slot:</span>
              <strong className="text-[#CCFF00] font-mono font-bold tabular-nums">
                {formatTime(selectedSlotInfo?.slot?.startAt)} – {formatTime(selectedSlotInfo?.slot?.endAt)} (60 min)
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Standard Walk-In Rate:</span>
              <span className={`tabular-nums font-mono ${courtDiscountPct > 0 ? 'text-slate-500 line-through' : 'text-white font-semibold'}`}>
                {formatCurrency(ratePerHour)}
              </span>
            </div>
            {courtDiscountPct > 0 ? (
              <div className="flex justify-between text-[#CCFF00] font-semibold border-t border-white/10 pt-2">
                <span>Member {membership?.plan_name || 'Gold'} Discount:</span>
                <span className="font-mono">{courtDiscountPct}% Off (-{formatCurrency(discountAmount)})</span>
              </div>
            ) : (
              <div className="flex justify-between text-slate-400 font-medium border-t border-white/10 pt-2">
                <span>Member Plan Discount:</span>
                <span>₹0.00 (Standard Guest)</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-white border-t border-white/10 pt-2">
              <span>Payable Amount:</span>
              <span className="text-[#CCFF00] font-mono font-black tabular-nums">
                {payableAmount === 0 ? '₹0.00 (Complimentary)' : formatCurrency(payableAmount)}
              </span>
            </div>
          </div>

          {!hasActiveMembership && (
            <div className="p-3 rounded-lg bg-[#111418] border border-[#CCFF00]/30 text-white text-[11px] flex items-center justify-between gap-2">
              <span className="text-slate-300">Want free court access? Subscribe to a membership tier.</span>
              <Link to="/plans" className="font-bold underline text-[#CCFF00] shrink-0">
                View Plans
              </Link>
            </div>
          )}

          <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-[11px] leading-relaxed">
            <strong className="text-white">Cancellation Policy:</strong> You may cancel up to 2 hours before the start time without penalty.
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MemberBook
