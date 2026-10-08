import React, { useEffect, useState, useCallback } from 'react'
import barService from '@/service/barService'
import { formatTime } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Clock, CheckCircle2 } from 'lucide-react'

export const KitchenDisplay = () => {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [, setRefreshing] = useState(false)
  const [stationFilter, setStationFilter] = useState('')

  const fetchKitchenQueue = useCallback(async (isBg = false) => {
    if (!isBg) setLoading(true)
    else setRefreshing(true)

    try {
      const data = await barService.getKitchenQueue({
        station: stationFilter || undefined,
      })
      setItems(data || [])
    } catch {
      // ignore in background
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [stationFilter])

  useEffect(() => {
    fetchKitchenQueue()
    // 5-second live polling
    const interval = setInterval(() => {
      fetchKitchenQueue(true)
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchKitchenQueue])

  const handleUpdateStatus = async (itemId, newStatus) => {
    try {
      await barService.updateKitchenStatus(itemId, newStatus)
      toast.success(`Ticket item marked as ${newStatus}`)
      fetchKitchenQueue(true)
    } catch (err) {
      toast.error(err.message || 'Status update failed')
    }
  }

  const filteredItems = items.filter((i) => {
    return !stationFilter || i.station === stationFilter
  })

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#CCFF00] text-black">
              Production KDS
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#CCFF00]/15 text-[#CCFF00] text-[10px] font-black border border-[#CCFF00]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" /> Live 5s Polling
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mt-3">
            Kitchen & Barista Display (KDS)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time ticket queue for chefs and baristas. Oldest orders prioritized first.
          </p>
        </div>

        {/* Station Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStationFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              !stationFilter
                ? 'bg-[#CCFF00] text-black shadow-xs'
                : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            All Stations ({items.length})
          </button>
          <button
            onClick={() => setStationFilter('kitchen')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              stationFilter === 'kitchen'
                ? 'bg-[#CCFF00] text-black shadow-xs'
                : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            Hot Kitchen Line
          </button>
          <button
            onClick={() => setStationFilter('bar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              stationFilter === 'bar'
                ? 'bg-[#CCFF00] text-black shadow-xs'
                : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            Barista Coffee Bar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-16 text-center border-white/10 bg-[#111418]">
          <CheckCircle2 className="w-12 h-12 text-[#CCFF00] mx-auto mb-3" />
          <h3 className="font-bold text-white text-base">All orders have been prepared & served</h3>
          <p className="text-xs text-slate-400 mt-1">New items sent from the POS table map will appear here live.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isNew = item.kitchenStatus === 'new' || item.kitchen_status === 'new'
            const isPreparing = item.kitchenStatus === 'preparing' || item.kitchen_status === 'preparing'
            const isReady = item.kitchenStatus === 'ready' || item.kitchen_status === 'ready'

            return (
              <div
                key={item.itemId || item.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                  isNew
                    ? 'border-amber-400/80 bg-amber-500/10 ring-1 ring-amber-400/40 text-white'
                    : isPreparing
                      ? 'border-cyan-400/80 bg-cyan-500/10 text-white'
                      : 'border-[#CCFF00] bg-[#CCFF00]/10 ring-1 ring-[#CCFF00]/40 text-white shadow-[0_0_20px_rgba(204,255,0,0.15)]'
                }`}
              >
                <div className="space-y-3">
                  {/* Ticket Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-mono font-black text-xs uppercase tracking-wider text-[#CCFF00] bg-black/60 px-2 py-0.5 rounded border border-white/10">
                      {item.tableLabel || 'Table'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTime(item.placedAt || item.created_at)}
                    </span>
                  </div>

                  {/* Item Description */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-extrabold text-sm text-white leading-tight">
                        {item.name || item.name_snapshot}
                      </h4>
                      <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-[#CCFF00] text-black shrink-0">
                        ×{item.qty}
                      </span>
                    </div>

                    {item.notes && (
                      <div className="mt-2 p-2 rounded-lg bg-black/40 border border-amber-400/40 text-amber-300 text-[11px] font-semibold italic">
                        &ldquo;{item.notes}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Advancement Buttons */}
                <div className="pt-4 mt-3 border-t border-white/10 flex items-center gap-2">
                  {isNew && (
                    <Button
                      variant="volt"
                      size="sm"
                      onClick={() => handleUpdateStatus(item.itemId || item.id, 'preparing')}
                      className="w-full text-xs font-black"
                    >
                      Start Prep
                    </Button>
                  )}
                  {isPreparing && (
                    <Button
                      variant="volt"
                      size="sm"
                      onClick={() => handleUpdateStatus(item.itemId || item.id, 'ready')}
                      className="w-full text-xs font-black"
                    >
                      Mark Ready
                    </Button>
                  )}
                  {isReady && (
                    <Button
                      variant="volt"
                      size="sm"
                      onClick={() => handleUpdateStatus(item.itemId || item.id, 'served')}
                      className="w-full text-xs font-black"
                    >
                      Mark Served
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default KitchenDisplay
