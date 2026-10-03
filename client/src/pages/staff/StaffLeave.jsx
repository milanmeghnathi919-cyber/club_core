import React, { useEffect, useState } from 'react'
import hrService from '@/service/hrService'
import { formatDate } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Card, { CardContent } from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { ClipboardList, Plus, Calendar } from 'lucide-react'

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
            Employee HR
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            My Leave Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Request scheduled time off and review management approval decisions.
          </p>
        </div>

        <Button variant="lawn" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Leave Request
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : leaveRequests.length === 0 ? (
          <Card className="p-12 text-center border-slate-200 text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-700">No leave requests submitted</p>
          </Card>
        ) : (
          leaveRequests.map((l) => (
            <Card key={l.id} className="border-slate-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 capitalize">
                      {l.type} Leave ({l.days || 1} day{l.days > 1 ? 's' : ''})
                    </span>
                    <Badge status={l.status}>{l.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDate(l.fromDate || l.from_date)} – {formatDate(l.toDate || l.to_date)}
                  </p>
                  {l.reason && <p className="text-xs text-slate-600 mt-1 italic">&ldquo;{l.reason}&rdquo;</p>}
                </div>
              </CardContent>
            </Card>
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
          <Select
            label="Leave Classification *"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="casual">Casual Paid Leave</option>
            <option value="sick">Medical / Sick Leave</option>
            <option value="unpaid">Unpaid Leave</option>
          </Select>

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

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="lawn" type="submit" loading={submitting} className="font-bold">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default StaffLeave
