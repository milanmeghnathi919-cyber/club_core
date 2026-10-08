import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import SlotGrid from '@/components/common/SlotGrid'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import useToast from '@/components/ui/Toast'
import courtService from '@/service/courtService'
import memberService from '@/service/memberService'
import { formatCurrency, formatTime, formatDate } from '@/utils/format'
import {
  Calendar,
  UserPlus,
  Phone,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  ListOrdered,
  Search,
  ExternalLink,
  Clock,
  CreditCard,
  RefreshCw,
  XCircle,
  ShieldCheck,
  Filter,
  Eye,
  Trophy,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export const StaffBookings = () => {
  const toast = useToast()
  const navigate = useNavigate()
  const todayStr = new Date().toISOString().split('T')[0]

  // View Mode: 'grid' (visual slot schedule) or 'directory' (all bookings table)
  const [viewMode, setViewMode] = useState('grid')

  // Common filters
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [sport, setSport] = useState('')
  const [courtsList, setCourtsList] = useState([])

  // Walk-in booking state (grid click -> available slot)
  const [selectedSlotInfo, setSelectedSlotInfo] = useState(null)
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)

  // Booking Form State
  const [isMemberMode, setIsMemberMode] = useState(false)
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [matchedMembers, setMatchedMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  // Reservation & Member Details Modal state
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [payMethodForBooking, setPayMethodForBooking] = useState('cash')

  // All Bookings Directory state
  const [bookings, setBookings] = useState([])
  const [directoryLoading, setDirectoryLoading] = useState(false)
  const [directorySearch, setDirectorySearch] = useState('')
  const [directoryCourtFilter, setDirectoryCourtFilter] = useState('')
  const [directoryStatusFilter, setDirectoryStatusFilter] = useState('all')
  const [directoryDateFilter, setDirectoryDateFilter] = useState(todayStr)
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch courts list for dropdowns
  useEffect(() => {
    courtService
      .getCourts()
      .then((data) => {
        setCourtsList(Array.isArray(data) ? data : data?.items || [])
      })
      .catch(() => {})
  }, [])

  // Fetch All Bookings Directory
  const fetchDirectoryBookings = useCallback(async () => {
    setDirectoryLoading(true)
    try {
      const params = { limit: 100 }
      if (directoryDateFilter) params.date = directoryDateFilter
      if (directoryCourtFilter) params.courtId = directoryCourtFilter
      if (directoryStatusFilter && directoryStatusFilter !== 'all') params.status = directoryStatusFilter

      const res = await courtService.getAllBookings(params)
      setBookings(res.items || [])
    } catch {
      toast.error('Failed to load court bookings directory')
    } finally {
      setDirectoryLoading(false)
    }
  }, [directoryDateFilter, directoryCourtFilter, directoryStatusFilter, toast])

  useEffect(() => {
    if (viewMode === 'directory') {
      fetchDirectoryBookings()
    }
  }, [viewMode, fetchDirectoryBookings, refreshKey])

  // Slot click handler in Grid view
  const handleSelectSlot = async ({ court, slot, isBooked, booking }) => {
    if (isBooked) {
      // If slot is booked, open reservation & member inspection modal!
      const bookingId = booking?.id || slot.bookingId
      if (booking) {
        setSelectedBooking(booking)
        setIsDetailsModalOpen(true)
      } else if (bookingId) {
        setLoadingDetails(true)
        setIsDetailsModalOpen(true)
        try {
          const fullBooking = await courtService.getBookingById(bookingId)
          setSelectedBooking(fullBooking)
        } catch {
          toast.error('Failed to fetch reservation details')
          setIsDetailsModalOpen(false)
        } finally {
          setLoadingDetails(false)
        }
      }
    } else {
      // If slot is available, open walk-in court reservation modal
      setSelectedSlotInfo({ court, slot })
      setIsWalkInModalOpen(true)
    }
  }

  // Inspect full booking from Directory view
  const handleInspectBooking = async (bookingItem) => {
    setLoadingDetails(true)
    setIsDetailsModalOpen(true)
    try {
      const full = await courtService.getBookingById(bookingItem.id)
      setSelectedBooking(full)
    } catch {
      setSelectedBooking(bookingItem)
    } finally {
      setLoadingDetails(false)
    }
  }

  // Member search for walk-in modal
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

  // Confirm walk-in booking
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

    setBookingLoading(true)
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
        `Court booked! Ref: ${res.booking?.bookingNo || res.booking?.booking_no || 'CONFIRMED'} (${paymentMethod.toUpperCase()})`,
      )
      setIsWalkInModalOpen(false)
      setSelectedSlotInfo(null)
      setSelectedMember(null)
      setGuestName('')
      setGuestPhone('')
      setRefreshKey((k) => k + 1)
    } catch (err) {
      if (err.code === 'SLOT_TAKEN') {
        toast.error('Court slot already taken. Refreshing schedule.')
      } else if (err.code === 'DAILY_LIMIT_REACHED') {
        toast.error('Member has already reached their daily court booking limit.')
      } else {
        toast.error(err.message || 'Failed to create booking')
      }
    } finally {
      setBookingLoading(false)
    }
  }

  // Mark booking as paid
  const handleMarkAsPaid = async () => {
    if (!selectedBooking) return
    setActionLoading(true)
    try {
      const updated = await courtService.payBooking(selectedBooking.id, payMethodForBooking)
      setSelectedBooking(updated)
      toast.success(`Booking ${updated.bookingNo || updated.booking_no} marked as paid via ${payMethodForBooking.toUpperCase()}!`)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast.error(err.message || 'Failed to mark payment as paid')
    } finally {
      setActionLoading(false)
    }
  }

  // Cancel reservation
  const handleCancelBooking = async () => {
    if (!selectedBooking) return
    if (!window.confirm(`Are you sure you want to cancel reservation ${selectedBooking.bookingNo || selectedBooking.booking_no}?`)) {
      return
    }

    setActionLoading(true)
    try {
      const updated = await courtService.cancelBooking(selectedBooking.id, 'Front desk staff cancellation')
      setSelectedBooking(updated)
      toast.success('Reservation successfully cancelled.')
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast.error(err.message || 'Failed to cancel reservation')
    } finally {
      setActionLoading(false)
    }
  }

  // Filter directory bookings in memory for fast client-side query matching
  const filteredBookings = bookings.filter((b) => {
    if (!directorySearch.trim()) return true
    const term = directorySearch.toLowerCase()
    const memberName = b.memberName || b.member?.fullName || b.member?.name || ''
    const guestName = b.guestName || b.guest?.name || ''
    const memberPhone = b.memberPhone || b.member?.phone || b.guestPhone || ''
    const memberCode = b.memberCode || b.member?.memberCode || ''
    const bookingNo = b.bookingNo || b.booking_no || ''
    const courtName = b.court?.name || b.court_name || ''

    return (
      memberName.toLowerCase().includes(term) ||
      guestName.toLowerCase().includes(term) ||
      memberPhone.toLowerCase().includes(term) ||
      memberCode.toLowerCase().includes(term) ||
      bookingNo.toLowerCase().includes(term) ||
      courtName.toLowerCase().includes(term)
    )
  })

  // Directory KPI metrics
  const totalCount = bookings.length
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length
  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((acc, curr) => acc + Number(curr.price || 0), 0)
  const pendingCollectionCount = bookings.filter((b) => b.paymentStatus === 'unpaid' && b.status === 'confirmed').length

  return (
    <div className="space-y-6 font-sans">
      {/* Title & View Navigation Toolbar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#CCFF00] text-black">
              Front Desk Operations
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#CCFF00]/15 text-[#CCFF00] font-black border border-[#CCFF00]/30">
              Live Club Schedule
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mt-3">
            Court Bookings & Schedule
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time court availability, instant walk-in reservations, and comprehensive member booking directory.
          </p>
        </div>

        {/* View Mode Switcher Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-[#111418] rounded-xl border border-white/10 shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#CCFF00] text-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Schedule Grid</span>
            </button>
            <button
              onClick={() => setViewMode('directory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                viewMode === 'directory'
                  ? 'bg-[#CCFF00] text-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>All Bookings Directory</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: Visual Interactive Court Grid */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {/* Grid Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#111418] rounded-xl border border-white/10 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-[#0D1117] px-3 py-1.5 rounded-lg border border-white/15 text-xs shadow-2xs">
                <Calendar className="w-4 h-4 text-[#CCFF00]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="font-bold text-white focus:outline-none bg-transparent"
                />
              </div>

              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-bold border transition-all ${
                  selectedDate === todayStr
                    ? 'bg-[#CCFF00] text-black border-[#CCFF00]'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/20'
                }`}
              >
                Today
              </button>

              <Select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="text-xs py-1.5 min-w-[130px]"
                placeholder="All Sports"
              >
                <option value="">All Sports</option>
                <option value="tennis">Tennis</option>
                <option value="padel">Padel</option>
                <option value="badminton">Badminton</option>
                <option value="cricket">Cricket</option>
              </Select>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
              <span>Click any <strong className="text-white">available</strong> slot to book • Click any <strong className="text-white">booked</strong> slot to inspect member</span>
            </div>
          </div>

          {/* Live Court Matrix */}
          <SlotGrid
            key={`${selectedDate}-${sport}-${refreshKey}`}
            selectedDate={selectedDate}
            sport={sport}
            mode="staff"
            onSelectSlot={handleSelectSlot}
          />
        </div>
      )}

      {/* VIEW 2: All Bookings Directory (Comprehensive List/Table View) */}
      {viewMode === 'directory' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-[#111418] rounded-xl border border-white/10 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Bookings</span>
              <p className="text-xl sm:text-2xl font-black text-white font-mono mt-1">{totalCount}</p>
            </div>
            <div className="p-3.5 bg-[#111418] rounded-xl border border-white/10 shadow-2xs">
              <span className="text-[11px] font-bold text-[#CCFF00] uppercase tracking-wider">Active / Confirmed</span>
              <p className="text-xl sm:text-2xl font-black text-[#CCFF00] font-mono mt-1">{confirmedCount}</p>
            </div>
            <div className="p-3.5 bg-[#111418] rounded-xl border border-white/10 shadow-2xs">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Paid Revenue</span>
              <p className="text-xl sm:text-2xl font-black text-blue-400 mt-1 tabular-nums font-mono">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="p-3.5 bg-[#111418] rounded-xl border border-white/10 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Pending Collect</span>
              <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-1">{pendingCollectionCount}</p>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="p-4 bg-[#111418] rounded-xl border border-white/10 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by member name, phone, member code, or ref..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-white/15 bg-[#0D1117] text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]"
                />
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-[#0D1117] px-2.5 py-1.5 rounded-lg border border-white/15 text-xs w-full">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={directoryDateFilter}
                    onChange={(e) => setDirectoryDateFilter(e.target.value)}
                    className="font-semibold text-white focus:outline-none bg-transparent w-full"
                  />
                </div>
                {directoryDateFilter && (
                  <button
                    type="button"
                    onClick={() => setDirectoryDateFilter('')}
                    className="text-[10px] text-slate-400 hover:text-white font-bold px-2 py-1 bg-white/10 rounded"
                    title="Clear date to show all bookings"
                  >
                    All
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Select
                  value={directoryStatusFilter}
                  onChange={(e) => setDirectoryStatusFilter(e.target.value)}
                  className="text-xs py-1.5 w-full"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>

                <button
                  type="button"
                  onClick={fetchDirectoryBookings}
                  className="p-2 rounded-lg border border-white/10 hover:border-white/20 text-slate-300"
                  title="Refresh bookings"
                >
                  <RefreshCw className={`w-4 h-4 ${directoryLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Quick Filter Court Dropdown */}
            {courtsList.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Court:</span>
                <button
                  type="button"
                  onClick={() => setDirectoryCourtFilter('')}
                  className={`text-xs px-2.5 py-1 rounded-md font-bold transition-all ${
                    !directoryCourtFilter
                      ? 'bg-[#CCFF00] text-black shadow-xs'
                      : 'bg-white/5 text-slate-300 hover:text-white'
                  }`}
                >
                  All Courts
                </button>
                {courtsList.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setDirectoryCourtFilter(c.id)}
                    className={`text-xs px-2.5 py-1 rounded-md font-bold transition-all ${
                      directoryCourtFilter === c.id
                        ? 'bg-[#CCFF00] text-black shadow-xs'
                        : 'bg-white/5 text-slate-300 hover:text-white'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bookings Directory Table */}
          <div className="bg-[#111418] rounded-xl border border-white/10 shadow-xs overflow-hidden">
            {directoryLoading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#CCFF00]" />
                <p className="text-xs font-semibold">Loading court reservations...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-12 text-center">
                <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h4 className="font-bold text-white">No reservations found</h4>
                <p className="text-xs text-slate-400 mt-1">Try clearing your date or search filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Ref & Time</th>
                      <th className="py-3 px-4">Court</th>
                      <th className="py-3 px-4">Member / Booker</th>
                      <th className="py-3 px-4">Price & Payment</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredBookings.map((b) => {
                      const memberName = b.memberName || b.member?.fullName || b.member?.name || (b.guestName ? `${b.guestName} (Guest)` : 'Club Member')
                      const memberPhone = b.memberPhone || b.member?.phone || b.guestPhone || '—'
                      const memberCode = b.memberCode || b.member?.memberCode
                      const planName = b.planName || b.member?.planName
                      const isGuest = !b.memberId && !b.member_id

                      return (
                        <tr key={b.id} className="hover:bg-white/[0.03] transition-colors">
                          <td className="py-3.5 px-4 font-mono">
                            <span className="font-bold text-white">{b.bookingNo || b.booking_no || 'BK-—'}</span>
                            <div className="text-[11px] text-slate-400 font-sans mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{formatDate(b.startAt || b.start_at)}</span>
                              <span>•</span>
                              <span className="font-bold text-slate-200">{formatTime(b.startAt || b.start_at)}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{b.court?.name || b.court_name || 'Championship Court'}</div>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-300 border border-white/10">
                              {b.court?.sport || b.court_sport || 'Tennis'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#CCFF00] text-black flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                {memberName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-white truncate flex items-center gap-1.5">
                                  <span>{memberName}</span>
                                  {isGuest ? (
                                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                                      Guest
                                    </span>
                                  ) : planName ? (
                                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/30 rounded">
                                      {planName}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  {memberPhone !== '—' && (
                                    <a
                                      href={`tel:${memberPhone}`}
                                      className="hover:text-[#CCFF00] hover:underline flex items-center gap-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Phone className="w-2.5 h-2.5" />
                                      <span>{memberPhone}</span>
                                    </a>
                                  )}
                                  {memberCode && (
                                    <span className="font-mono text-slate-500">#{memberCode}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-[#CCFF00] tabular-nums">
                              {b.price === 0 ? '₹0.00 (Waived)' : formatCurrency(b.price)}
                            </div>
                            <span
                              className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                b.paymentStatus === 'paid'
                                  ? 'bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/30'
                                  : b.paymentStatus === 'waived'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {b.paymentStatus || 'unpaid'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                b.status === 'confirmed'
                                  ? 'bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/40'
                                  : b.status === 'completed'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              {b.status === 'confirmed' && <CheckCircle2 className="w-3 h-3 text-[#CCFF00]" />}
                              {b.status === 'cancelled' && <XCircle className="w-3 h-3 text-rose-400" />}
                              <span>{b.status}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleInspectBooking(b)}
                              className="px-3 py-1.5 rounded-lg border border-white/15 hover:border-[#CCFF00] hover:text-[#CCFF00] text-slate-300 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Court Reservation & Member Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Court Reservation & Member Details"
        subtitle={selectedBooking ? `Ref: ${selectedBooking.bookingNo || selectedBooking.booking_no || 'CONFIRMED'}` : 'Loading...'}
      >
        {loadingDetails || !selectedBooking ? (
          <div className="p-8 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1B4D2E]" />
            <p className="text-xs font-semibold">Retrieving member & reservation data...</p>
          </div>
        ) : (
          <div className="space-y-4 py-2 text-xs">
            {/* Status Header Badge Bar */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300">Reservation Status:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    selectedBooking.status === 'confirmed'
                      ? 'bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/40'
                      : selectedBooking.status === 'completed'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {selectedBooking.status}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-400">Payment:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    selectedBooking.paymentStatus === 'paid'
                      ? 'bg-[#CCFF00]/20 text-[#CCFF00]'
                      : selectedBooking.paymentStatus === 'waived'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {selectedBooking.paymentStatus}
                </span>
              </div>
            </div>

            {/* Court & Session Detail */}
            <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Court & Session Schedule</span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Court Name:</span>
                  <strong className="text-white text-sm">
                    {selectedBooking.court?.name || selectedBooking.court_name || 'Championship Court'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Sport:</span>
                  <span className="font-black uppercase tracking-wider text-[11px] text-[#CCFF00]">
                    {selectedBooking.court?.sport || selectedBooking.court_sport || 'Tennis'}
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-white/10 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-200">
                    {formatDate(selectedBooking.startAt || selectedBooking.start_at)} •{' '}
                    {formatTime(selectedBooking.startAt || selectedBooking.start_at)} –{' '}
                    {formatTime(selectedBooking.endAt || selectedBooking.end_at)}
                  </span>
                  <span className="text-slate-500 font-normal">(60 mins session)</span>
                </div>
              </div>
            </div>

            {/* Member Profile Details Card */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#CCFF00] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#CCFF00]" />
                  <span>Booker & Member Profile</span>
                </span>
                {selectedBooking.memberId && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailsModalOpen(false)
                      navigate(`/staff/members/${selectedBooking.memberId}`)
                    }}
                    className="text-[11px] font-bold text-[#CCFF00] hover:underline flex items-center gap-1"
                  >
                    <span>View CRM Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-[#CCFF00] text-black flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                  {(selectedBooking.memberName || selectedBooking.member?.fullName || selectedBooking.guestName || 'M').charAt(0)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-white text-sm">
                      {selectedBooking.memberName || selectedBooking.member?.fullName || selectedBooking.guestName || 'Club Member'}
                    </h3>
                    {selectedBooking.memberId ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/40">
                        {selectedBooking.planName || selectedBooking.member?.planName || 'Registered Member'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Walk-in Guest
                      </span>
                    )}
                  </div>

                  {selectedBooking.memberCode && (
                    <p className="text-[11px] text-slate-400 font-mono">
                      Member Code: <strong className="text-white">#{selectedBooking.memberCode}</strong>
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                    {(selectedBooking.memberPhone || selectedBooking.member?.phone || selectedBooking.guestPhone) && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                        <span className="text-slate-400">Phone:</span>
                        <a
                          href={`tel:${selectedBooking.memberPhone || selectedBooking.member?.phone || selectedBooking.guestPhone}`}
                          className="font-bold text-[#CCFF00] hover:underline"
                        >
                          {selectedBooking.memberPhone || selectedBooking.member?.phone || selectedBooking.guestPhone}
                        </a>
                      </div>
                    )}

                    {(selectedBooking.memberEmail || selectedBooking.member?.email) && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                        <span className="text-slate-400">Email:</span>
                        <a
                          href={`mailto:${selectedBooking.memberEmail || selectedBooking.member?.email}`}
                          className="font-bold text-[#CCFF00] hover:underline truncate"
                        >
                          {selectedBooking.memberEmail || selectedBooking.member?.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Ledger & Payment Action */}
            <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Financial Summary</span>
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Court Base Rate (1 hr):</span>
                  <span className="tabular-nums font-mono font-semibold text-white">{formatCurrency(selectedBooking.basePrice || selectedBooking.court?.ratePerHour || 600)}</span>
                </div>
                {Number(selectedBooking.discountPct || 0) > 0 && (
                  <div className="flex justify-between text-[#CCFF00] font-semibold">
                    <span>Membership Discount ({selectedBooking.discountPct}%):</span>
                    <span className="font-mono">- {formatCurrency(((selectedBooking.basePrice || 600) * selectedBooking.discountPct) / 100)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold border-t border-white/10 pt-1.5">
                  <span>Net Price Payable:</span>
                  <span className="tabular-nums text-sm font-mono font-black text-[#CCFF00]">
                    {selectedBooking.price === 0 ? '₹0.00 (Waived)' : formatCurrency(selectedBooking.price)}
                  </span>
                </div>
              </div>

              {/* If Unpaid, offer immediate counter payment collection */}
              {selectedBooking.paymentStatus === 'unpaid' && selectedBooking.status === 'confirmed' && (
                <div className="mt-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Payment Pending at Counter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={payMethodForBooking}
                      onChange={(e) => setPayMethodForBooking(e.target.value)}
                      className="py-1 text-xs"
                    >
                      <option value="cash">Cash Tender</option>
                      <option value="upi">UPI / QR Code</option>
                      <option value="card">Credit / Debit Card</option>
                    </Select>
                    <Button
                      variant="volt"
                      size="sm"
                      onClick={handleMarkAsPaid}
                      loading={actionLoading}
                      className="font-bold shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Mark as Paid
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              {selectedBooking.status !== 'cancelled' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelBooking}
                  loading={actionLoading}
                  className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 font-bold"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Cancel Reservation
                </Button>
              ) : (
                <span className="text-[11px] text-rose-400 font-semibold italic">Reservation was cancelled</span>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailsModalOpen(false)}
                className="font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: Front Desk Walk-In Booking Modal */}
      <Modal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        title="Front Desk Court Reservation"
        subtitle={`${selectedSlotInfo?.court?.courtName || selectedSlotInfo?.court?.name} • ${formatDate(selectedDate)} at ${formatTime(selectedSlotInfo?.slot?.startAt)}`}
      >
        <form onSubmit={handleConfirmBooking} className="space-y-4 py-2 font-sans">
          {/* Toggle Member vs Walk-in Guest */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setIsMemberMode(false)}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                !isMemberMode ? 'bg-[#CCFF00] text-black shadow-xs font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Walk-in Guest
            </button>
            <button
              type="button"
              onClick={() => setIsMemberMode(true)}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                isMemberMode ? 'bg-[#CCFF00] text-black shadow-xs font-black' : 'text-slate-400 hover:text-white'
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
                <div className="border border-white/10 rounded-xl max-h-36 overflow-y-auto divide-y divide-white/5 text-xs bg-[#0D1117]">
                  {matchedMembers.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => {
                        setSelectedMember(m)
                        setMatchedMembers([])
                        setMemberSearchQuery(m.fullName)
                      }}
                      className="w-full p-2.5 text-left hover:bg-white/5 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-white">{m.fullName}</span>
                        <span className="text-slate-400 text-[10px] ml-2 font-mono">#{m.memberCode}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/30 px-2 py-0.5 rounded">
                        {m.membership?.planCode || 'Member'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {selectedMember && (
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{selectedMember.fullName}</span>
                    <span className="text-[#CCFF00] ml-2">({selectedMember.membership?.planName})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMember(null)
                      setMemberSearchQuery('')
                    }}
                    className="text-xs text-rose-400 font-semibold"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Court Fee:</span>
              <strong className="text-white font-mono tabular-nums">
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
              disabled={bookingLoading}
            >
              Cancel
            </Button>
            <Button variant="volt" size="md" type="submit" loading={bookingLoading} className="font-black">
              Confirm & Book Court
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default StaffBookings
