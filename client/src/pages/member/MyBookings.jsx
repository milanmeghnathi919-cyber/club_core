import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import courtService from '@/service/courtService'
import { formatCurrency, formatDate, formatTime } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Calendar, Trophy, Plus, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
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
    } catch {
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

  const handleDownloadBookingPdf = (b) => {
    if (!b) return
    try {
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text('THE CHAMPIONS CLUB', 105, 18, { align: 'center' })
      doc.setFontSize(10)
      doc.text('Official Court Access Pass & Reservation Voucher', 105, 24, { align: 'center' })
      doc.text(`Booking Ref: ${b.bookingNo || b.booking_no || b.id?.slice(0, 8)}`, 14, 34)
      doc.text(`Court Arena: ${b.court?.name || b.court_name || 'Champions Court'}`, 14, 40)
      doc.text(`Sport: ${(b.court?.sport || b.sport || 'Racquet').toUpperCase()}`, 14, 46)
      doc.text(`Scheduled Date: ${formatDate(b.startAt || b.start_at)}`, 14, 52)
      doc.text(`Time Slot: ${formatTime(b.startAt || b.start_at)} - ${formatTime(b.endAt || b.end_at)}`, 14, 58)
      doc.text(`Reservation Status: ${(b.status || 'Confirmed').toUpperCase()}`, 14, 64)
      doc.text(`Payment: ${(b.payment_status || 'Paid').toUpperCase()}`, 14, 70)

      autoTable(doc, {
        startY: 76,
        head: [['Arena Item', 'Duration', 'Rate / Fee', 'Amount']],
        body: [[
          b.court?.name || 'Exclusive Club Court Reservation',
          '60 Minutes',
          formatCurrency(b.price || 0),
          formatCurrency(b.price || 0),
        ]],
        theme: 'grid',
      })

      const finalY = (doc.lastAutoTable?.finalY ?? 76) + 12
      doc.setFontSize(12)
      doc.text(`TOTAL TENDER: ${formatCurrency(b.price || 0)}`, 14, finalY)
      doc.setFontSize(9)
      doc.text('Please present this digital pass or QR voucher at the club reception kiosk upon arrival.', 14, finalY + 8)

      doc.save(`CourtPass-${b.bookingNo || 'Reservation'}.pdf`)
      toast.success('Court Pass PDF downloaded')
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate Court Pass PDF')
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#CCFF00] text-black">
            Schedule History
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mt-3">
            My Court Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review upcoming court reservations and match history.
          </p>
        </div>

        <Link to="/app/book">
          <Button variant="volt" size="sm" icon={Plus} className="font-extrabold">
            Book Another Court
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-16 text-center bg-[#111418] rounded-2xl border border-white/10 space-y-4">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
          <div>
            <h3 className="font-bold text-white text-base">No court bookings found</h3>
            <p className="text-xs text-slate-400 mt-1">You haven&rsquo;t booked any courts yet.</p>
          </div>
          <Link to="/app/book">
            <Button variant="volt" size="md">
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
              <Card key={b.id} className="border-white/10 bg-[#111418] hover:border-[#CCFF00]/40 transition-colors">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/20 flex items-center justify-center font-bold text-sm shrink-0">
                      <Trophy className="w-6 h-6 text-[#CCFF00]" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-white">
                          {courtName}
                        </h4>
                        {courtSport && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                            {courtSport}
                          </span>
                        )}
                        <Badge status={b.status}>{b.status}</Badge>
                      </div>

                      <p className="text-xs font-semibold text-slate-300">
                        {formatDate(start)} • {formatTime(start)} – {formatTime(end)}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span>Ref: <strong className="text-white">{bookingRef}</strong></span>
                        <span>•</span>
                        <span>Amount: <strong className="text-[#CCFF00]">{formatCurrency(b.price || 0)}</strong></span>
                        <span>•</span>
                        <span
                          className={`capitalize font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                            b.payment_status === 'paid' || b.payment_status === 'waived'
                              ? 'bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          Payment: {b.payment_status || 'Unpaid'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadBookingPdf(b)}
                      className="text-xs font-bold gap-1.5 cursor-pointer text-[#CCFF00] border-[#CCFF00]/30 hover:bg-[#CCFF00]/10"
                      title="Download Official Court Pass PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Pass PDF</span>
                    </Button>

                    {b.payment_status === 'unpaid' && Number(b.price) > 0 && (
                      <Button
                        variant="volt"
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
                        className="text-xs text-rose-400 hover:bg-rose-500/10 border-rose-500/30"
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
        <div className="space-y-3 py-2 text-xs text-slate-300">
          <p>
            Are you sure you want to cancel this booking? The slot will immediately become available for other club members to book.
          </p>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
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
