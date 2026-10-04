import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import courtService from '@/service/courtService'
import { formatCurrency, formatDate, formatTime } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Calendar, Clock, Trophy, XCircle, AlertCircle, Plus } from 'lucide-react'
import FakePaymentModal from '@/components/common/FakePaymentModal'

export const MyBookings = () => {
  const toast = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelModalBooking, setCancelModalBooking] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [paymentTargetBooking, setPaymentTargetBooking] = useState(null)

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const data = await courtService.getMyBookings()
      const list = Array.isArray(data) ? data : data?.items || data?.data || []
      setBookings(list)
    } catch (err) {
      toast.error('Failed to load your bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleCancel = async () => {
    if (!cancelModalBooking) return
    setCancelling(true)
    try {
      await courtService.cancelBooking(cancelModalBooking.id, 'Member requested cancellation')
      toast.success('Court booking cancelled successfully')
      setCancelModalBooking(null)
      fetchBookings()
    } catch (err) {
      if (err.code === 'CANCEL_WINDOW_PASSED') {
        toast.error('Cancellation window passed (must cancel at least 2 hours before start)')
      } else {
        toast.error(err.message || 'Failed to cancel booking')
      }
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
            Schedule History
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">My Court Bookings</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review upcoming court reservations and match history.
          </p>
        </div>

        <Link to="/app/book">
          <Button variant="lawn" size="sm" icon={Plus} className="font-bold">
            Book Another Court
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="font-bold text-slate-800 text-base">No court bookings found</h3>
            <p className="text-xs text-slate-400 mt-1">You haven&rsquo;t booked any courts yet.</p>
          </div>
          <Link to="/app/book">
            <Button variant="lawn" size="md">
              Reserve First Court
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const isConfirmed = b.status === 'confirmed'
            const start = b.startAt || b.start_at
            const end = b.endAt || b.end_at
            const isPast = start ? new Date(start) < new Date() : false
            const courtName = b.court?.name || b.court_name || 'Championship Court'
            const courtSport = b.court?.sport || b.court_sport || ''
            const bookingRef = b.bookingNo || b.booking_no || (b.id ? b.id.slice(0, 8) : 'CONFIRMED')

            return (
              <Card key={b.id} className="border-slate-200 hover:border-slate-300 transition-colors">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#1B4D2E]/10 text-[#1B4D2E] flex items-center justify-center font-bold text-sm shrink-0">
                      <Trophy className="w-6 h-6 text-[#1B4D2E]" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-slate-900">
                          {courtName}
                        </h4>
                        {courtSport && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {courtSport}
                          </span>
                        )}
                        <Badge status={b.status}>{b.status}</Badge>
                      </div>

                      <p className="text-xs font-semibold text-slate-700">
                        {formatDate(start)} • {formatTime(start)} – {formatTime(end)}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono">
                        <span>Ref: {bookingRef}</span>
                        <span>•</span>
                        <span>Amount: {formatCurrency(b.price || 0)}</span>
                        <span>•</span>
                        <span
                          className={`capitalize font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                            b.payment_status === 'paid' || b.payment_status === 'waived'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Payment: {b.payment_status || 'Unpaid'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {b.payment_status === 'unpaid' && Number(b.price) > 0 && (
                      <Button
                        variant="lawn"
                        size="sm"
                        onClick={() => setPaymentTargetBooking(b)}
                        className="text-xs font-bold cursor-pointer"
                      >
                        Pay Online (Simulate)
                      </Button>
                    )}

                    {isConfirmed && !isPast && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancelModalBooking(b)}
                        className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200 hover:border-rose-300"
                      >
                        Cancel Booking
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Cancellation Modal */}
      <Modal
        isOpen={!!cancelModalBooking}
        onClose={() => setCancelModalBooking(null)}
        title="Cancel Court Reservation?"
        subtitle={`Court: ${cancelModalBooking?.court?.name || cancelModalBooking?.court_name || 'Court'} on ${formatDate(cancelModalBooking?.startAt || cancelModalBooking?.start_at)}`}
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setCancelModalBooking(null)}
              disabled={cancelling}
            >
              Keep Booking
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={cancelling}
              onClick={handleCancel}
              className="font-bold"
            >
              Confirm Cancellation
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-2 text-xs text-slate-600">
          <p>
            Are you sure you want to cancel this booking? The slot will immediately become available for other club members to book.
          </p>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
            Please note that cancellations are subject to our 2-hour advance cutoff policy.
          </div>
        </div>
      </Modal>

      {paymentTargetBooking && (
        <FakePaymentModal
          isOpen={Boolean(paymentTargetBooking)}
          onClose={() => setPaymentTargetBooking(null)}
          amount={paymentTargetBooking.price || 0}
          title={`Court Reservation #${paymentTargetBooking.bookingNo || paymentTargetBooking.booking_no || paymentTargetBooking.id?.slice(0, 8)}`}
          description={`${paymentTargetBooking.court?.name || paymentTargetBooking.court_name || 'Court'} Session`}
          sourceType="booking"
          sourceId={paymentTargetBooking.id}
          customerName="Club Member"
          onSuccess={() => {
            fetchBookings()
            setPaymentTargetBooking(null)
          }}
        />
      )}
    </div>
  )
}

export default MyBookings
