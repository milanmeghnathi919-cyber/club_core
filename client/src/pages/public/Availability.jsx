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
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8 font-sans bg-[#090B0E] text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00]">
            Live Schedule
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white mt-1 font-display uppercase tracking-tight">
            Court Availability Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse real-time open slots across all 6 championship courts with instant confirmation.
          </p>
        </div>

        {/* Controls: Date Picker + Sport Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#12161D] px-3.5 py-2 rounded-xl border border-white/15 text-xs shadow-inner focus-within:ring-2 focus-within:ring-[#CCFF00]/25 focus-within:border-[#CCFF00]">
            <Calendar className="w-4 h-4 text-[#CCFF00]" />
            <input
              type="date"
              value={selectedDate}
              min={todayStr}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-bold text-white bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-xl border border-white/10 shadow-lg">
            {SPORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSport(s.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  sport === s.value
                    ? 'bg-[#CCFF00] text-black shadow-md shadow-[#CCFF00]/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
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
        title="Reserve Your Championship Court"
        subtitle={`${selectedSlotInfo?.court?.courtName || selectedSlotInfo?.court?.name || 'Court'} • ${formatDate(selectedDate)} at ${formatTime(selectedSlotInfo?.slot?.startAt)}`}
      >
        <div className="space-y-5 py-2">
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Duration:</span>
              <strong className="text-white">60 Minutes Standard Session</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Walk-In Court Rate:</span>
              <strong className="text-[#CCFF00] font-mono text-sm">
                {formatCurrency(selectedSlotInfo?.slot?.price || 600)}
              </strong>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Club Member Privilege:</span>
              <strong className="font-bold">₹0.00 (Gold) or 30-50% Off</strong>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="volt"
              size="lg"
              className="w-full justify-between"
              onClick={() => {
                navigate(`/login?redirect=/app/book?date=${selectedDate}`)
              }}
            >
              <span className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 stroke-[3]" /> Sign In as Member to Book
              </span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </Button>

            <Button
              variant="dark"
              size="lg"
              className="w-full justify-between border-white/15"
              onClick={() => {
                navigate(
                  `/contact?trial=true&courtId=${selectedSlotInfo?.court?.courtId || selectedSlotInfo?.court?.id}&date=${selectedDate}&time=${selectedSlotInfo?.slot?.time}`,
                )
              }}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#CCFF00]" /> Book as Guest Trial
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Availability
