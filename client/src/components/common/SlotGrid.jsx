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
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h4 className="font-bold text-slate-700">No courts configured for this sport</h4>
        <p className="text-xs text-slate-500 mt-1">Select another sport filter or date.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Indicator bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" /> Available
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" /> Booked
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-xs" /> Social Play
          </span>
        </div>
        <button
          onClick={() => fetchAvailability(true)}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
          title="Refresh slot availability"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Live 20s</span>
        </button>
      </div>

      {/* Grid container with horizontal scroll */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs">
        <div className="min-w-[760px]">
          {/* Header row: Court Names */}
          <div className="grid border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10" style={{ gridTemplateColumns: `repeat(${courts.length}, minmax(130px, 1fr))` }}>
            {courts.map((c) => {
              const courtName = c.courtName || c.court?.name || c.name
              const sportName = c.sport || c.court?.sport || 'All'
              const hourlyRate = c.ratePerHour || c.court?.hourly_rate || c.court?.ratePerHour

              return (
                <div key={c.courtId || c.id} className="p-3.5 text-center border-r border-slate-200/70 last:border-r-0">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate" title={courtName}>
                    {courtName}
                  </h4>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                      {sportName}
                    </span>
                    {hourlyRate && (
                      <span className="text-[10px] text-slate-500 tabular-nums">
                        {formatCurrency(hourlyRate)}/hr
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Slots matrix */}
          {/* We determine total slots from the first court */}
          {courts[0]?.slots && (
            <div className="divide-y divide-slate-100">
              {courts[0].slots.map((_, slotIdx) => {
                const timeLabel = courts[0].slots[slotIdx].time || formatTime(courts[0].slots[slotIdx].startAt)

                return (
                  <div
                    key={slotIdx}
                    className="grid hover:bg-slate-50/30 transition-colors"
                    style={{ gridTemplateColumns: `repeat(${courts.length}, minmax(130px, 1fr))` }}
                  >
                    {courts.map((court) => {
                      const slot = court.slots[slotIdx]
                      if (!slot) return <div key={court.courtId || court.id} className="p-2 border-r border-slate-100" />

                      const isAvailable = slot.state === 'available'
                      const isBooked = slot.state === 'booked'
                      const isSocial = slot.state === 'social'
                      const isPast = slot.state === 'past'

                      return (
                        <div
                          key={court.courtId || court.id}
                          className="p-1.5 border-r border-slate-100 last:border-r-0 flex items-center justify-center"
                        >
                          {isAvailable ? (
                            <button
                              onClick={() => onSelectSlot && onSelectSlot({ court, slot })}
                              className="w-full py-2 px-2.5 rounded-lg border border-emerald-300/80 bg-emerald-50/60 hover:bg-[#1B4D2E] hover:text-white hover:border-[#1B4D2E] text-emerald-950 transition-all flex flex-col items-center justify-center gap-0.5 group shadow-2xs"
                            >
                              <span className="text-xs font-bold tabular-nums group-hover:text-white">
                                {timeLabel}
                              </span>
                              <span className="text-[10px] font-medium text-emerald-700 group-hover:text-emerald-100 tabular-nums">
                                {slot.price === 0 ? 'FREE (Pass)' : formatCurrency(slot.price)}
                              </span>
                            </button>
                          ) : isBooked ? (
                            mode === 'staff' ? (
                              <button
                                type="button"
                                onClick={() => onSelectSlot && onSelectSlot({ court, slot, isBooked: true, booking: slot.booking })}
                                className="w-full py-2 px-2 rounded-lg bg-rose-50/95 hover:bg-rose-100 text-rose-900 border border-rose-300 hover:border-rose-400 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all shadow-2xs group text-left"
                                title={`Booked by: ${slot.booking?.memberName || 'Member'}\nStatus: ${slot.booking?.status || 'Confirmed'}\nClick to view full reservation & member details`}
                              >
                                <div className="flex items-center justify-between w-full px-0.5">
                                  <span className="text-xs font-bold tabular-nums text-rose-900">{timeLabel}</span>
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-rose-200/90 text-rose-800">
                                    Booked
                                  </span>
                                </div>
                                <span className="text-[11px] font-semibold text-rose-950 truncate max-w-full px-0.5 w-full text-center group-hover:underline">
                                  {slot.booking?.memberName || 'Member Booking'}
                                </span>
                              </button>
                            ) : (
                              <div className="w-full py-2 px-2.5 rounded-lg bg-rose-50/90 text-rose-700 border border-rose-200/90 flex flex-col items-center justify-center gap-0.5 select-none cursor-not-allowed shadow-2xs">
                                <span className="text-xs font-bold tabular-nums text-rose-800">{timeLabel}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                                  Booked
                                </span>
                              </div>
                            )
                          ) : isSocial ? (
                            <button
                              onClick={() => onSelectSlot && onSelectSlot({ court, slot })}
                              className="w-full py-2 px-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 hover:bg-indigo-600 hover:text-white transition-all flex flex-col items-center justify-center gap-0.5 group"
                            >
                              <span className="text-xs font-bold tabular-nums">{timeLabel}</span>
                              <span className="text-[10px] flex items-center gap-1 font-semibold text-indigo-700 group-hover:text-indigo-100">
                                <Users className="w-2.5 h-2.5" /> Social
                              </span>
                            </button>
                          ) : (
                            <div className="w-full py-2 px-2.5 rounded-lg bg-slate-50 text-slate-300 flex items-center justify-center text-xs select-none">
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
