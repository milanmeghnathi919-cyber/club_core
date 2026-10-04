import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SlotGrid from '@/components/common/SlotGrid'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { formatCurrency, formatTime, formatDate } from '@/utils/format'
import { Calendar, Filter, Sparkles, UserCheck, ArrowRight } from 'lucide-react'

const SPORTS = [
  { label: 'All Sports', value: '' },
  { label: 'Tennis', value: 'tennis' },
  { label: 'Padel', value: 'padel' },
  { label: 'Badminton', value: 'badminton' },
  { label: 'Box Cricket', value: 'cricket' },
]

export const Availability = () => {
  const navigate = useNavigate()
  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [sport, setSport] = useState('')
  const [selectedSlotInfo, setSelectedSlotInfo] = useState(null)

  const handleSlotClick = ({ court, slot }) => {
    setSelectedSlotInfo({ court, slot })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/90 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
            Live Schedule
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1 font-display">Court Availability Matrix</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse real-time open slots across all 6 championship courts.
          </p>
        </div>

        {/* Controls: Date Picker + Sport Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-300/90 text-xs shadow-2xs focus-within:ring-2 focus-within:ring-[#1B4D2E]/20 focus-within:border-[#1B4D2E]">
            <Calendar className="w-4 h-4 text-[#1B4D2E]" />
            <input
              type="date"
              value={selectedDate}
              min={todayStr}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-bold text-slate-900 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
            {SPORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSport(s.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sport === s.value
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* The Master Court Slot Matrix */}
      <SlotGrid
        selectedDate={selectedDate}
        sport={sport}
        mode="public"
        onSelectSlot={handleSlotClick}
      />

      {/* Visitor Action Modal */}
      <Modal
        isOpen={!!selectedSlotInfo}
        onClose={() => setSelectedSlotInfo(null)}
        title="Ready to Reserve Your Court?"
        subtitle={`${selectedSlotInfo?.court?.courtName || selectedSlotInfo?.court?.name || 'Court'} • ${formatDate(selectedDate)} at ${formatTime(selectedSlotInfo?.slot?.startAt)}`}
      >
        <div className="space-y-5 py-2">
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Duration:</span>
              <strong className="text-slate-800">60 Minutes Standard Session</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Walk-In Court Rate:</span>
              <strong className="text-slate-900 tabular-nums">
                {formatCurrency(selectedSlotInfo?.slot?.price || 600)}
              </strong>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span className="font-semibold">Gold Member Privilege:</span>
              <strong className="font-bold">100% Free Included</strong>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-600 leading-relaxed">
              Court reservations require an active club membership account or a booked trial session pass.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              variant="lawn"
              className="w-full font-bold shadow-xs"
              onClick={() => {
                const cId = selectedSlotInfo?.court?.courtId || selectedSlotInfo?.court?.id
                const time = selectedSlotInfo?.slot?.startAt?.split('T')[1]?.slice(0, 5) || ''
                navigate(`/contact?trial=true&courtId=${cId}&date=${selectedDate}&time=${time}`)
              }}
            >
              Book as Guest Trial Pass <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              className="w-full font-bold"
              onClick={() => navigate('/login')}
            >
              Sign In to Reserve
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Availability
