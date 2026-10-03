import React, { useEffect, useState } from 'react'
import leadService from '@/service/leadService'
import memberService from '@/service/memberService'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Card, { CardContent } from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Sparkles,
  Phone,
  Mail,
  Calendar,
  Clock,
  UserPlus,
  Send,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'

export const LeadsCrm = () => {
  const toast = useToast()

  const [leads, setLeads] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('new')
  const [selectedLead, setSelectedLead] = useState(null)

  // Drawer / Modals
  const [activityText, setActivityText] = useState('')
  const [activityType, setActivityType] = useState('call')
  const [loggingActivity, setLoggingActivity] = useState(false)

  // Convert to Member Modal
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false)
  const [convertPlanId, setConvertPlanId] = useState('')
  const [convertPayment, setConvertPayment] = useState('cash')
  const [converting, setConverting] = useState(false)

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const [leadsRes, planRes] = await Promise.all([
        leadService.getLeads({ status: statusFilter || undefined }),
        memberService.getPlans(),
      ])
      setLeads(leadsRes.items || [])
      setPlans(planRes || [])
    } catch {
      toast.error('Failed to load CRM leads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [statusFilter])

  const handleSelectLead = async (lead) => {
    try {
      const full = await leadService.getLeadById(lead.id)
      setSelectedLead(full)
    } catch {
      setSelectedLead(lead)
    }
  }

  const handleLogActivity = async (e) => {
    e.preventDefault()
    if (!activityText.trim() || !selectedLead) return

    setLoggingActivity(true)
    try {
      await leadService.addActivity(selectedLead.lead?.id || selectedLead.id, {
        type: activityType,
        text: activityText.trim(),
      })
      toast.success('Activity logged in lead timeline')
      setActivityText('')
      // Refresh lead details
      const full = await leadService.getLeadById(selectedLead.lead?.id || selectedLead.id)
      setSelectedLead(full)
      fetchLeads()
    } catch (err) {
      toast.error(err.message || 'Failed to log activity')
    } finally {
      setLoggingActivity(false)
    }
  }

  const handleConvertLead = async (e) => {
    e.preventDefault()
    if (!convertPlanId || !selectedLead) return

    setConverting(true)
    try {
      const leadId = selectedLead.lead?.id || selectedLead.id
      const res = await leadService.convertLead(leadId, {
        planId: convertPlanId,
        paymentMethod: convertPayment,
      })
      toast.success(`Lead successfully converted to member! Code: ${res.member?.memberCode}`)
      setIsConvertModalOpen(false)
      setSelectedLead(null)
      fetchLeads()
    } catch (err) {
      if (err.code === 'PHONE_EXISTS') {
        toast.error('A member with this phone number already exists.')
      } else {
        toast.error(err.message || 'Conversion failed')
      }
    } finally {
      setConverting(false)
    }
  }

  const leadObj = selectedLead?.lead || selectedLead
  const activities = selectedLead?.activities || []

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-5">
        <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
          Membership Growth
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Leads & Enquiries Pipeline
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Capture enquiries from web visitors, log prospect touchpoints, and convert to active members.
        </p>
      </div>

      {/* Status Pipeline Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['new', 'contacted', 'quoted', 'won', 'lost'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              statusFilter === st
                ? 'bg-[#1B4D2E] text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Leads List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <Card className="p-12 text-center border-slate-200">
              <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-slate-700 text-sm">No {statusFilter} leads</h4>
              <p className="text-xs text-slate-400 mt-1">New web submissions appear here automatically.</p>
            </Card>
          ) : (
            leads.map((l) => (
              <div
                key={l.id}
                onClick={() => handleSelectLead(l)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  leadObj?.id === l.id
                    ? 'border-[#1B4D2E] bg-emerald-50/50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{l.full_name || l.name}</h4>
                      <Badge status={l.status}>{l.status}</Badge>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {l.interest}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {l.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {l.phone}
                        </span>
                      )}
                      {l.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {l.email}
                        </span>
                      )}
                      <span>Received: {formatDate(l.created_at)}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Side: Lead Detail & Conversion Console */}
        <div className="space-y-4">
          {leadObj ? (
            <Card className="border-slate-200 sticky top-20">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{leadObj.full_name || leadObj.name}</h3>
                  <span className="text-xs text-slate-500 capitalize">{leadObj.interest} Lead</span>
                </div>
                {leadObj.status !== 'won' && (
                  <Button
                    variant="clay"
                    size="sm"
                    icon={UserPlus}
                    onClick={() => setIsConvertModalOpen(true)}
                    className="font-bold text-xs"
                  >
                    Convert to Member
                  </Button>
                )}
              </div>

              <CardContent className="space-y-4 p-4 text-xs">
                {/* Contact info */}
                <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <strong className="text-slate-800">{leadObj.phone || '-'}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <strong className="text-slate-800">{leadObj.email || '-'}</strong>
                  </p>
                  {leadObj.sport && (
                    <p className="flex justify-between">
                      <span className="text-slate-500">Preferred Sport:</span>
                      <strong className="capitalize text-slate-800">{leadObj.sport}</strong>
                    </p>
                  )}
                  {leadObj.message && (
                    <div className="pt-2 border-t border-slate-200 mt-1">
                      <span className="text-slate-500 block mb-0.5">Enquiry Message:</span>
                      <p className="text-slate-700 italic">&ldquo;{leadObj.message}&rdquo;</p>
                    </div>
                  )}
                </div>

                {/* Log Activity */}
                <form onSubmit={handleLogActivity} className="space-y-2 pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                    Log Touchpoint Activity
                  </span>
                  <div className="flex gap-2">
                    <Select
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value)}
                      className="text-xs py-1"
                    >
                      <option value="call">Call</option>
                      <option value="visit">Club Tour</option>
                      <option value="email">Email</option>
                      <option value="note">Note</option>
                    </Select>
                    <Input
                      placeholder="e.g. Called, interested in Gold..."
                      value={activityText}
                      onChange={(e) => setActivityText(e.target.value)}
                      className="text-xs py-1"
                    />
                    <Button type="submit" variant="lawn" size="sm" loading={loggingActivity}>
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </form>

                {/* Historic Activity Feed */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                    Timeline History ({activities.length})
                  </span>
                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                    {activities.length === 0 ? (
                      <p className="text-slate-400 py-3 text-center">No touchpoints logged yet.</p>
                    ) : (
                      activities.map((a) => (
                        <div key={a.id} className="py-2 space-y-0.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-bold uppercase text-emerald-800">{a.type}</span>
                            <span>{formatDate(a.createdAt || a.created_at)}</span>
                          </div>
                          <p className="text-slate-700">{a.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-8 text-center border-slate-200 text-slate-400">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs">Select a lead from the list to view touchpoints and convert.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Convert to Member Modal */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title="Convert Lead to Club Member"
        subtitle={`Applicant: ${leadObj?.full_name || leadObj?.name}`}
      >
        <form onSubmit={handleConvertLead} className="space-y-4 py-2">
          <Select
            label="Select Membership Plan Tier *"
            value={convertPlanId}
            onChange={(e) => setConvertPlanId(e.target.value)}
            required
          >
            <option value="">Choose plan...</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({formatCurrency(p.price)}/yr)
              </option>
            ))}
          </Select>

          <Select
            label="Payment Tender Method *"
            value={convertPayment}
            onChange={(e) => setConvertPayment(e.target.value)}
          >
            <option value="cash">Cash Tender</option>
            <option value="upi">UPI / Instant QR</option>
            <option value="card">Credit / Debit Card</option>
          </Select>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsConvertModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="clay" type="submit" loading={converting} className="font-bold">
              Enroll & Issue Member Pass
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default LeadsCrm
