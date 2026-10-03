import React, { useEffect, useState } from 'react'
import hrService from '@/service/hrService'
import { formatDate } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Clock, CheckCircle2, LogIn, LogOut, Calendar } from 'lucide-react'

export const StaffShifts = () => {
  const toast = useToast()
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchShifts = async () => {
    setLoading(true)
    try {
      const data = await hrService.getShifts()
      setShifts(data || [])
    } catch {
      toast.error('Failed to load shifts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShifts()
  }, [])

  const handleCheckIn = async (shiftId) => {
    try {
      await hrService.checkInShift(shiftId)
      toast.success('Clocked in for shift!')
      fetchShifts()
    } catch (err) {
      toast.error(err.message || 'Check in failed')
    }
  }

  const handleCheckOut = async (shiftId) => {
    try {
      await hrService.checkOutShift(shiftId)
      toast.success('Clocked out of shift!')
      fetchShifts()
    } catch (err) {
      toast.error(err.message || 'Check out failed')
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-5">
        <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
          Roster & Attendance
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Staff Shifts & Time Clock
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review duty assignments and record attendance check-ins.
        </p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : shifts.length === 0 ? (
          <Card className="p-12 text-center border-slate-200 text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-700">No shifts scheduled</p>
          </Card>
        ) : (
          shifts.map((s) => {
            const isCompleted = s.status === 'completed'
            const isScheduled = s.status === 'scheduled'

            return (
              <Card key={s.id} className="border-slate-200">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 font-bold">
                      <Clock className="w-5 h-5 text-[#1B4D2E]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">
                          {s.area || 'Front Desk Operations'}
                        </h4>
                        <Badge status={s.status}>{s.status}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDate(s.date)} • {s.start_time || s.startTime} – {s.end_time || s.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isScheduled && (
                      <Button
                        variant="lawn"
                        size="sm"
                        icon={LogIn}
                        onClick={() => handleCheckIn(s.id)}
                        className="text-xs font-bold"
                      >
                        Check In
                      </Button>
                    )}
                    {s.status === 'in_progress' && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={LogOut}
                        onClick={() => handleCheckOut(s.id)}
                        className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        Check Out
                      </Button>
                    )}
                    {isCompleted && (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Shift Completed
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

export default StaffShifts
