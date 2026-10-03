import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SlotGrid from '@/components/common/SlotGrid'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import useToast from '@/components/ui/Toast'
import courtService from '@/service/courtService'
import { formatCurrency, formatTime, formatDate } from '@/utils/format'
import { Calendar, Trophy, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'

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
    } catch (err) {
      if (err.code === 'DAILY_LIMIT_REACHED') {
        toast.error('Daily booking limit reached for today (max active bookings reached).')
      } else if (err.code === 'SLOT_TAKEN') {
        toast.error('This slot was just booked by another player. Schedule updated.')
      } else {
        toast.error(err.message || 'Failed to book slot')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Title & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
            Court Reservations
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Book Championship Court
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gold Pass: 100% complimentary access applied automatically across all courts.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {SPORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSport(s.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  sport === s.value
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Success Modal if just booked */}
      {bookingSuccess && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-base">Booking Confirmed!</h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Booking Reference:{' '}
                <strong className="font-mono">{bookingSuccess.bookingNo || bookingSuccess.booking_no || 'CONFIRMED'}</strong> •{' '}
                {bookingSuccess.court?.name || bookingSuccess.court_name || 'Court'} at {formatTime(bookingSuccess.startAt || bookingSuccess.start_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="lawn" size="sm" onClick={() => navigate('/app/bookings')}>
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
              variant="lawn"
              size="md"
              loading={loading}
              onClick={handleConfirmBooking}
              className="font-bold"
            >
              Confirm Reservation (Free)
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Court Arena:</span>
              <strong className="text-slate-900 font-bold">
                {selectedSlotInfo?.court?.courtName || selectedSlotInfo?.court?.name}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Time Slot:</span>
              <strong className="text-slate-900 font-bold tabular-nums">
                {formatTime(selectedSlotInfo?.slot?.startAt)} – {formatTime(selectedSlotInfo?.slot?.endAt)} (60 min)
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Standard Walk-In Rate:</span>
              <span className="text-slate-400 line-through tabular-nums">
                {formatCurrency(selectedSlotInfo?.court?.ratePerHour || 600)}
              </span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold border-t border-slate-200 pt-2">
              <span>Member Gold Discount:</span>
              <span>100% Off (-{formatCurrency(selectedSlotInfo?.court?.ratePerHour || 600)})</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
              <span>Payable Amount:</span>
              <span className="text-emerald-700 tabular-nums">₹0.00 (Waived)</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
            <strong>Cancellation Policy:</strong> You may cancel up to 2 hours before the start time without penalty.
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MemberBook
