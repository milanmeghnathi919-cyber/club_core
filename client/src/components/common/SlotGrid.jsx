import React, { useEffect, useState, useCallback } from 'react'
import courtService from '@/service/courtService'
import { formatCurrency, formatTime } from '@/utils/format'
import { Skeleton } from '@/components/ui/Skeleton'
import { AlertCircle, RefreshCw, Trophy, Users } from 'lucide-react'

export const SlotGrid = ({
  selectedDate,
  sport = '',
  mode = 'member', // 'member' | 'staff' | 'public'
  memberId = null,
  onSelectSlot,
}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAvailability = useCallback(
    async (isBackground = false) => {
      if (!selectedDate) return
      if (!isBackground) setLoading(true)
      else setRefreshing(true)
      setError(null)

      try {
        const params = { date: selectedDate }
        if (sport) params.sport = sport
        if (memberId && mode === 'staff') params.memberId = memberId

        const res = await courtService.getAvailability(params)
        setData(res)
      } catch (err) {
        setError(err.message || 'Failed to load court availability')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [selectedDate, sport, memberId, mode],
  )

  useEffect(() => {
    fetchAvailability()
    // 20s polling for live concurrency
    const interval = setInterval(() => {
      fetchAvailability(true)
    }, 20000)
    return () => clearInterval(interval)
  }, [fetchAvailability])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-xl">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h4 className="font-semibold text-rose-900">Unable to load court schedule</h4>
        <p className="text-xs text-rose-600 mt-1 mb-4">{error}</p>
        <button
          onClick={() => fetchAvailability()}
          className="text-xs font-semibold px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    )
  }

  const courts = data?.courts || []

  if (courts.length === 0) {
    return (
      <div className="p-12 text-center bg-[#111418] rounded-2xl border border-white/10 text-white">
        <Trophy className="w-10 h-10 text-[#CCFF00] mx-auto mb-3" />
        <h4 className="font-bold text-white font-display">No courts configured for this sport</h4>
        <p className="text-xs text-slate-400 mt-1">Select another sport filter or date.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Indicator bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] shadow-[0_0_8px_#CCFF00]" /> Available
          </span>
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" /> Booked
          </span>
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]" /> Social Play
          </span>
        </div>
        <button
          onClick={() => fetchAvailability(true)}
          className="flex items-center gap-1 text-slate-400 hover:text-[#CCFF00] transition-colors cursor-pointer"
          title="Refresh slot availability"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="font-mono text-[11px]">Live 20s</span>
        </button>
      </div>

      {/* Grid container with horizontal scroll */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0E1217] shadow-2xl">
        <div className="min-w-[760px]">
          {/* Header row: Court Names */}
          <div className="grid border-b border-white/10 bg-[#12161F] sticky top-0 z-10" style={{ gridTemplateColumns: `repeat(${courts.length}, minmax(130px, 1fr))` }}>
            {courts.map((c) => {
              const courtName = c.courtName || c.court?.name || c.name
              const sportName = c.sport || c.court?.sport || 'All'
              const hourlyRate = c.ratePerHour || c.court?.hourly_rate || c.court?.ratePerHour

              return (
                <div key={c.courtId || c.id} className="p-3.5 text-center border-r border-white/10 last:border-r-0">
                  <h4 className="font-extrabold text-white text-xs sm:text-sm truncate font-display" title={courtName}>
                    {courtName}
                  </h4>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/5">
                      {sportName}
                    </span>
                    {hourlyRate && (
                      <span className="text-[10px] text-[#CCFF00] font-mono font-bold">
                        {formatCurrency(hourlyRate)}/hr
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Slots matrix */}
          {courts[0]?.slots && (
            <div className="divide-y divide-white/5">
              {courts[0].slots.map((_, slotIdx) => {
                const timeLabel = courts[0].slots[slotIdx].time || formatTime(courts[0].slots[slotIdx].startAt)

                return (
                  <div
                    key={slotIdx}
                    className="grid hover:bg-white/[0.02] transition-colors"
                    style={{ gridTemplateColumns: `repeat(${courts.length}, minmax(130px, 1fr))` }}
                  >
                    {courts.map((court) => {
                      const slot = court.slots[slotIdx]
                      if (!slot) return <div key={court.courtId || court.id} className="p-2 border-r border-white/5" />

                      const isAvailable = slot.state === 'available'
                      const isBooked = slot.state === 'booked'
                      const isSocial = slot.state === 'social'

                      return (
                        <div
                          key={court.courtId || court.id}
                          className="p-1.5 border-r border-white/5 last:border-r-0 flex items-center justify-center"
                        >
                          {isAvailable ? (
                            <button
                              onClick={() => onSelectSlot && onSelectSlot({ court, slot })}
                              className="w-full py-2 px-2.5 rounded-xl border border-[#CCFF00]/30 bg-[#CCFF00]/10 hover:bg-[#CCFF00] hover:text-black text-[#CCFF00] hover:shadow-lg hover:shadow-[#CCFF00]/25 transition-all flex flex-col items-center justify-center gap-0.5 group cursor-pointer"
                            >
                              <span className="text-xs font-black tabular-nums group-hover:text-black text-white">
                                {timeLabel}
                              </span>
                              <span className="text-[10px] font-bold text-[#CCFF00] group-hover:text-black tabular-nums">
                                {slot.price === 0 ? 'FREE (Pass)' : formatCurrency(slot.price)}
                              </span>
                            </button>
                          ) : isBooked ? (
                            mode === 'staff' ? (
                              <button
                                type="button"
                                onClick={() => onSelectSlot && onSelectSlot({ court, slot, isBooked: true, booking: slot.booking })}
                                className="w-full py-2 px-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 hover:border-rose-500/60 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all shadow-xs group text-left"
                                title={`Booked by: ${slot.booking?.memberName || 'Member'}\nStatus: ${slot.booking?.status || 'Confirmed'}\nClick to view full reservation & member details`}
                              >
                                <div className="flex items-center justify-between w-full px-0.5">
                                  <span className="text-xs font-bold tabular-nums text-rose-300">{timeLabel}</span>
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-rose-500/30 text-rose-200">
                                    Booked
                                  </span>
                                </div>
                                <span className="text-[11px] font-semibold text-rose-200 truncate max-w-full px-0.5 w-full text-center group-hover:underline">
                                  {slot.booking?.memberName || 'Member Booking'}
                                </span>
                              </button>
                            ) : (
                              <div className="w-full py-2 px-2.5 rounded-xl bg-white/[0.03] text-slate-500 border border-white/5 flex flex-col items-center justify-center gap-0.5 select-none cursor-not-allowed">
                                <span className="text-xs font-bold tabular-nums text-slate-400">{timeLabel}</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                  Booked
                                </span>
                              </div>
                            )
                          ) : isSocial ? (
                            <button
                              onClick={() => onSelectSlot && onSelectSlot({ court, slot })}
                              className="w-full py-2 px-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all flex flex-col items-center justify-center gap-0.5 group cursor-pointer"
                            >
                              <span className="text-xs font-bold tabular-nums">{timeLabel}</span>
                              <span className="text-[10px] flex items-center gap-1 font-semibold text-indigo-300 group-hover:text-white">
                                <Users className="w-2.5 h-2.5" /> Social
                              </span>
                            </button>
                          ) : (
                            <div className="w-full py-2 px-2.5 rounded-xl bg-white/[0.02] text-slate-600 flex items-center justify-center text-xs select-none">
                              {timeLabel}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SlotGrid
