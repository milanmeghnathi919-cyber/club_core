import React, { useEffect, useState, useCallback } from 'react'
import barService from '@/service/barService'
import { formatTime } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Card, { CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Utensils, RefreshCw, Clock, CheckCircle2, Flame, BellRing } from 'lucide-react'

export const KitchenDisplay = () => {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
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
    // 5-second live polling (Requirement D-F6)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
              Café Kitchen & Barista Production
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live 5s Polling
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Café Kitchen & Barista KDS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time ticket queue for chefs and baristas. Oldest tickets prioritized first.
          </p>
        </div>

        {/* Station Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStationFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !stationFilter ? 'bg-slate-900 text-white' : 'bg-white border text-slate-700'
            }`}
          >
            All Stations ({items.length})
          </button>
          <button
            onClick={() => setStationFilter('kitchen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              stationFilter === 'kitchen' ? 'bg-[#C85A32] text-white' : 'bg-white border text-slate-700'
            }`}
          >
            Hot Kitchen Line
          </button>
          <button
            onClick={() => setStationFilter('bar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              stationFilter === 'bar' ? 'bg-[#1B4D2E] text-white' : 'bg-white border text-slate-700'
            }`}
          >
            Barista Coffee Bar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-16 text-center border-slate-200">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">All orders have been prepared & served</h3>
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
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all shadow-xs ${
                  isNew
                    ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-400/30'
                    : isPreparing
                      ? 'border-blue-300 bg-blue-50/30'
                      : 'border-emerald-300 bg-emerald-50/30'
                }`}
              >
                <div className="space-y-3">
                  {/* Ticket Header */}
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {item.tableLabel || 'Table'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTime(item.placedAt || item.created_at)}
                    </span>
                  </div>

                  {/* Item Description */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {item.name || item.name_snapshot}
                      </h4>
                      <span className="font-mono font-extrabold text-sm px-2 py-0.5 rounded bg-slate-900 text-white shrink-0">
                        ×{item.qty}
                      </span>
                    </div>

                    {item.notes && (
                      <div className="mt-2 p-2 rounded-lg bg-white border border-amber-300/80 text-amber-900 text-[11px] font-semibold italic">
                        &ldquo;{item.notes}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Advancement Buttons */}
                <div className="pt-4 mt-3 border-t border-slate-200/80 flex items-center gap-2">
                  {isNew && (
                    <Button
                      variant="clay"
                      size="sm"
                      onClick={() => handleUpdateStatus(item.itemId || item.id, 'preparing')}
                      className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700"
                    >
                      Start Prep
                    </Button>
                  )}
                  {isPreparing && (
                    <Button
                      variant="lawn"
                      size="sm"
                      onClick={() => handleUpdateStatus(item.itemId || item.id, 'ready')}
                      className="w-full text-xs font-bold bg-blue-600 hover:bg-blue-700"
                    >
                      Mark Ready
                    </Button>
                  )}
                  {isReady && (
                    <Button
                      variant="lawn"
                      size="sm"
                      onClick={() => handleUpdateStatus(item.itemId || item.id, 'served')}
                      className="w-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800"
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
