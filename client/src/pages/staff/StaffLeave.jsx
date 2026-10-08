import React, { useEffect, useState } from 'react'
import hrService from '@/service/hrService'
import { formatDate } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { ClipboardList, Plus, Calendar, Zap } from 'lucide-react'

export const StaffLeave = () => {
  const toast = useToast()
  const [leaveRequests, setLeaveRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    type: 'casual',
    fromDate: '',
    toDate: '',
    reason: '',
  })

  const fetchLeave = async () => {
    setLoading(true)
    try {
      const data = await hrService.getMyLeaveRequests()
      setLeaveRequests(data || [])
    } catch {
      toast.error('Failed to load leave history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeave()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fromDate || !form.toDate) {
      toast.error('Please specify start and end dates')
      return
    }

    setSubmitting(true)
    try {
      await hrService.submitLeaveRequest(form)
      toast.success('Leave request submitted to club management!')
      setIsModalOpen(false)
      setForm({ type: 'casual', fromDate: '', toDate: '', reason: '' })
      fetchLeave()
    } catch (err) {
      toast.error(err.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Employee HR
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
            My Leave Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Request scheduled time off and review management approval decisions.
          </p>
        </div>

        <Button variant="volt" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)} className="font-black uppercase text-xs">
          New Leave Request
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-3xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : leaveRequests.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-[#111418] border border-white/10 text-slate-500 shadow-2xl">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="font-bold text-white uppercase">No leave requests submitted</p>
          </div>
        ) : (
          leaveRequests.map((l) => (
            <div key={l.id} className="p-5 rounded-3xl bg-[#111418] border border-white/10 shadow-2xl flex items-center justify-between hover:border-white/20 transition-all">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-black uppercase tracking-tight text-sm text-white">
                    {l.type} Leave ({l.days || 1} day{l.days > 1 ? 's' : ''})
                  </span>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-[#CCFF00] border border-[#CCFF00]/30">
                    {l.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  <span className="font-mono text-white">{formatDate(l.fromDate || l.from_date)}</span> – <span className="font-mono text-white">{formatDate(l.toDate || l.to_date)}</span>
                </p>
                {l.reason && <p className="text-xs text-slate-300 mt-2 italic bg-[#090B0E] px-3 py-1.5 rounded-xl border border-white/5">&ldquo;{l.reason}&rdquo;</p>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Submit Leave Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Time Off Request"
        subtitle="Forwarded to Rajesh Sharma for executive approval"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Leave Classification *
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full py-2.5 px-3.5 bg-[#111418] rounded-xl border border-white/10 text-white text-xs focus:outline-none"
            >
              <option value="casual" className="bg-[#111418] text-white">Casual Paid Leave</option>
              <option value="sick" className="bg-[#111418] text-white">Medical / Sick Leave</option>
              <option value="unpaid" className="bg-[#111418] text-white">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="From Date *"
              type="date"
              value={form.fromDate}
              onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
              required
            />
            <Input
              label="To Date *"
              type="date"
              value={form.toDate}
              onChange={(e) => setForm({ ...form, toDate: e.target.value })}
              required
            />
          </div>

          <Input
            label="Reason / Notes"
            placeholder="e.g. Family wedding in Delhi"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="volt" type="submit" loading={submitting} className="font-black uppercase text-xs">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default StaffLeave
