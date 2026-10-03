import React, { useState } from 'react'
import SlotGrid from '@/components/common/SlotGrid'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import useToast from '@/components/ui/Toast'
import courtService from '@/service/courtService'
import memberService from '@/service/memberService'
import { formatCurrency, formatTime, formatDate } from '@/utils/format'
import { Calendar, UserPlus, Phone, User, CheckCircle2, AlertCircle } from 'lucide-react'

export const StaffBookings = () => {
  const toast = useToast()
  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [sport, setSport] = useState('')
  const [selectedSlotInfo, setSelectedSlotInfo] = useState(null)
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Booking Form State
  const [isMemberMode, setIsMemberMode] = useState(false)
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [matchedMembers, setMatchedMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const handleSelectSlot = ({ court, slot }) => {
    setSelectedSlotInfo({ court, slot })
    setIsWalkInModalOpen(true)
  }

  const handleMemberSearch = async (q) => {
    setMemberSearchQuery(q)
    if (q.trim().length >= 2) {
      try {
        const res = await memberService.lookupMembers(q.trim())
        setMatchedMembers(res)
      } catch {
        // ignore
      }
    } else {
      setMatchedMembers([])
    }
  }

  const handleConfirmBooking = async (e) => {
    e.preventDefault()
    if (!selectedSlotInfo) return

    if (!isMemberMode && !guestName.trim()) {
      toast.error('Please enter guest name')
      return
    }

    if (isMemberMode && !selectedMember) {
      toast.error('Please select a member')
      return
    }

    setLoading(true)
    try {
      const courtId = selectedSlotInfo.court?.courtId || selectedSlotInfo.court?.id
      const startAt = selectedSlotInfo.slot?.startAt

      const payload = {
        courtId,
        startAt,
        paymentMethod: isMemberMode && selectedMember?.membership?.planCode === 'GOLD' ? 'cash' : paymentMethod,
      }

      if (isMemberMode) {
        payload.memberId = selectedMember.id
      } else {
        payload.guest = {
          name: guestName.trim(),
          phone: guestPhone.trim() || undefined,
        }
      }

      const res = await courtService.createBooking(payload)
      toast.success(
        `Court booked! Ref: ${res.booking?.bookingNo || 'CONFIRMED'} (${paymentMethod.toUpperCase()})`,
      )
      setIsWalkInModalOpen(false)
      setSelectedSlotInfo(null)
      setSelectedMember(null)
      setGuestName('')
      setGuestPhone('')
    } catch (err) {
      if (err.code === 'SLOT_TAKEN') {
        toast.error('Court slot already taken. Refreshing schedule.')
      } else if (err.code === 'DAILY_LIMIT_REACHED') {
        toast.error('Member has already reached their daily court booking limit.')
      } else {
        toast.error(err.message || 'Failed to create booking')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Title & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
            Front Desk Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Court Schedule & Booker
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            View live court grid and reserve walk-in sessions in under 4 taps.
          </p>
        </div>

        {/* Date & Sport controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <Select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="text-xs py-1.5"
            placeholder="All Sports"
          >
            <option value="tennis">Tennis</option>
            <option value="padel">Padel</option>
            <option value="badminton">Badminton</option>
            <option value="cricket">Cricket</option>
          </Select>
        </div>
      </div>

      {/* Live Court Matrix */}
      <SlotGrid
        selectedDate={selectedDate}
        sport={sport}
        mode="staff"
        onSelectSlot={handleSelectSlot}
      />

      {/* Front Desk Walk-In Booking Modal */}
      <Modal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        title="Front Desk Court Reservation"
        subtitle={`${selectedSlotInfo?.court?.courtName || selectedSlotInfo?.court?.name} • ${formatDate(selectedDate)} at ${formatTime(selectedSlotInfo?.slot?.startAt)}`}
      >
        <form onSubmit={handleConfirmBooking} className="space-y-4 py-2">
          {/* Toggle Member vs Walk-in Guest */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setIsMemberMode(false)}
              className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                !isMemberMode ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Walk-in Guest
            </button>
            <button
              type="button"
              onClick={() => setIsMemberMode(true)}
              className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                isMemberMode ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Registered Member
            </button>
          </div>

          {!isMemberMode ? (
            <div className="space-y-3">
              <Input
                label="Guest Full Name *"
                placeholder="e.g. Sameer Kapoor"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
              <Input
                label="Guest Phone Number"
                placeholder="e.g. +91 98765 43210"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                label="Search Member"
                placeholder="Type member name, phone or code..."
                value={memberSearchQuery}
                onChange={(e) => handleMemberSearch(e.target.value)}
              />
              {matchedMembers.length > 0 && !selectedMember && (
                <div className="border border-slate-200 rounded-lg max-h-36 overflow-y-auto divide-y divide-slate-100 text-xs bg-white">
                  {matchedMembers.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => {
                        setSelectedMember(m)
                        setMatchedMembers([])
                        setMemberSearchQuery(m.fullName)
                      }}
                      className="w-full p-2.5 text-left hover:bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{m.fullName}</span>
                        <span className="text-slate-400 text-[10px] ml-2 font-mono">{m.memberCode}</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        {m.membership?.planCode || 'Member'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {selectedMember && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-900">{selectedMember.fullName}</span>
                    <span className="text-emerald-700 ml-2">({selectedMember.membership?.planName})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMember(null)
                      setMemberSearchQuery('')
                    }}
                    className="text-xs text-rose-600 font-semibold"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Court Fee:</span>
              <strong className="text-slate-900 tabular-nums">
                {isMemberMode && selectedMember?.membership?.planCode === 'GOLD'
                  ? '₹0.00 (Gold Member Waived)'
                  : formatCurrency(selectedSlotInfo?.court?.ratePerHour || 600)}
              </strong>
            </div>

            {(!isMemberMode || selectedMember?.membership?.planCode !== 'GOLD') && (
              <Select
                label="Payment Tender Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash Tender</option>
                <option value="upi">UPI / QR Code</option>
                <option value="card">Credit / Debit Card</option>
                <option value="pay_at_club">Unpaid (Pay Later)</option>
              </Select>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setIsWalkInModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button variant="lawn" size="md" type="submit" loading={loading} className="font-bold">
              Confirm & Book Court
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default StaffBookings
