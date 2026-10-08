import React, { useEffect, useState } from 'react'
import hrService from '@/service/hrService'
import { formatDate } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import { Clock, CheckCircle2, LogIn, LogOut, Calendar, Zap, Sparkles } from 'lucide-react'

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
      <div className="border-b border-white/10 pb-5">
        <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00] flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> Roster & Attendance
        </span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
          Staff Shifts & Time Clock
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review duty assignments and record attendance check-ins.
        </p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-3xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : shifts.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-[#111418] border border-white/10 text-slate-500 shadow-2xl">
            <Clock className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="font-bold text-white uppercase">No shifts scheduled</p>
          </div>
        ) : (
          shifts.map((s) => {
            const isCompleted = s.status === 'completed'
            const isScheduled = s.status === 'scheduled'

            return (
              <div
                key={s.id}
                className="p-5 rounded-3xl bg-[#111418] border border-white/10 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#CCFF00] shrink-0 font-bold">
                    <Clock className="w-5 h-5 text-[#CCFF00]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-black uppercase tracking-tight text-sm text-white">
                        {s.area || 'Front Desk Operations'}
                      </h4>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-[#CCFF00] border border-[#CCFF00]/30">
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDate(s.date)} • <span className="font-mono text-white">{s.start_time || s.startTime} – {s.end_time || s.endTime}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isScheduled && (
                    <Button
                      variant="volt"
                      size="sm"
                      icon={LogIn}
                      onClick={() => handleCheckIn(s.id)}
                      className="text-xs font-black uppercase"
                    >
                      Check In
                    </Button>
                  )}
                  {s.status === 'in_progress' && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={LogOut}
                      onClick={() => handleCheckOut(s.id)}
                      className="text-xs font-black uppercase"
                    >
                      Check Out
                    </Button>
                  )}
                  {isCompleted && (
                    <span className="text-xs font-bold text-[#CCFF00] flex items-center gap-1.5 uppercase tracking-wider bg-[#CCFF00]/10 px-3 py-1.5 rounded-full border border-[#CCFF00]/30">
                      <CheckCircle2 className="w-4 h-4" /> Shift Completed
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default StaffShifts
