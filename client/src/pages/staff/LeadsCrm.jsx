import React, { useEffect, useState } from 'react'
import leadService from '@/service/leadService'
import memberService from '@/service/memberService'
import { formatCurrency, formatDate } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
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
  Zap,
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
      <div className="border-b border-white/10 pb-5">
        <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00] flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> Membership Growth
        </span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
          Leads & Enquiries Pipeline
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Capture enquiries from web visitors, log prospect touchpoints, and convert to active members.
        </p>
      </div>

      {/* Status Pipeline Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['new', 'contacted', 'quoted', 'won', 'lost'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              statusFilter === st
                ? 'bg-[#CCFF00] text-black shadow-md shadow-[#CCFF00]/10'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
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
                <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <div className="rounded-3xl bg-[#111418] border border-white/10 p-12 text-center shadow-2xl">
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <h4 className="font-black uppercase tracking-tight text-white text-sm">No {statusFilter} leads</h4>
              <p className="text-xs text-slate-400 mt-1">New web submissions appear here automatically.</p>
            </div>
          ) : (
            leads.map((l) => (
              <div
                key={l.id}
                onClick={() => handleSelectLead(l)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  leadObj?.id === l.id
                    ? 'border-[#CCFF00] bg-[#CCFF00]/10 shadow-[0_0_20px_rgba(204,255,0,0.15)]'
                    : 'border-white/10 bg-[#111418] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-black uppercase tracking-tight text-sm text-white">{l.full_name || l.name}</h4>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/10 text-[#CCFF00] border border-[#CCFF00]/30">
                        {l.status}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                        {l.interest}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      {l.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#CCFF00]" /> {l.phone}
                        </span>
                      )}
                      {l.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#CCFF00]" /> {l.email}
                        </span>
                      )}
                      <span>Received: {formatDate(l.created_at)}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Side: Lead Detail & Conversion Console */}
        <div className="space-y-4">
          {leadObj ? (
            <div className="rounded-3xl bg-[#111418] border border-white/10 shadow-2xl sticky top-20 overflow-hidden">
              <div className="p-5 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-black uppercase tracking-tight text-white text-base">{leadObj.full_name || leadObj.name}</h3>
                  <span className="text-xs text-[#CCFF00] font-bold capitalize">{leadObj.interest} Lead</span>
                </div>
                {leadObj.status !== 'won' && (
                  <Button
                    variant="volt"
                    size="sm"
                    icon={UserPlus}
                    onClick={() => setIsConvertModalOpen(true)}
                    className="font-black uppercase text-xs"
                  >
                    Convert
                  </Button>
                )}
              </div>

              <div className="space-y-4 p-5 text-xs">
                {/* Contact info */}
                <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase">Phone:</span>
                    <strong className="text-white font-mono">{leadObj.phone || '-'}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase">Email:</span>
                    <strong className="text-white">{leadObj.email || '-'}</strong>
                  </p>
                  {leadObj.sport && (
                    <p className="flex justify-between">
                      <span className="text-slate-400 font-bold uppercase">Preferred Sport:</span>
                      <strong className="capitalize text-[#CCFF00]">{leadObj.sport}</strong>
                    </p>
                  )}
                  {leadObj.message && (
                    <div className="pt-2.5 border-t border-white/10 mt-1">
                      <span className="text-slate-400 font-bold uppercase block mb-1">Enquiry Message:</span>
                      <p className="text-slate-200 italic bg-[#090B0E] p-3 rounded-xl border border-white/5">&ldquo;{leadObj.message}&rdquo;</p>
                    </div>
                  )}
                </div>

                {/* Log Activity */}
                <form onSubmit={handleLogActivity} className="space-y-2.5 pt-2 border-t border-white/10">
                  <span className="font-black text-slate-300 uppercase tracking-wider text-[10px] block">
                    Log Touchpoint Activity
                  </span>
                  <div className="flex gap-2">
                    <select
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value)}
                      className="text-xs py-2 px-2.5 bg-[#090B0E] rounded-xl border border-white/10 text-white focus:outline-none"
                    >
                      <option value="call" className="bg-[#090B0E] text-white">Call</option>
                      <option value="visit" className="bg-[#090B0E] text-white">Club Tour</option>
                      <option value="email" className="bg-[#090B0E] text-white">Email</option>
                      <option value="note" className="bg-[#090B0E] text-white">Note</option>
                    </select>
                    <input
                      placeholder="e.g. Called, interested in Gold..."
                      value={activityText}
                      onChange={(e) => setActivityText(e.target.value)}
                      className="flex-1 text-xs py-2 px-3 bg-[#090B0E] rounded-xl border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00]/60"
                    />
                    <button type="submit" disabled={loggingActivity} className="p-2.5 rounded-xl bg-[#CCFF00] text-black hover:bg-[#b8e600] transition-colors shrink-0">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>

                {/* Historic Activity Feed */}
                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <span className="font-black text-slate-300 uppercase tracking-wider text-[10px] block">
                    Timeline History ({activities.length})
                  </span>
                  <div className="divide-y divide-white/5 max-h-48 overflow-y-auto pr-1">
                    {activities.length === 0 ? (
                      <p className="text-slate-500 py-3 text-center">No touchpoints logged yet.</p>
                    ) : (
                      activities.map((a) => (
                        <div key={a.id} className="py-2.5 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-black uppercase text-[#CCFF00]">{a.type}</span>
                            <span>{formatDate(a.createdAt || a.created_at)}</span>
                          </div>
                          <p className="text-slate-200">{a.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-3xl bg-[#111418] border border-white/10 text-slate-500 shadow-2xl">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs">Select a lead from the list to view touchpoints and convert.</p>
            </div>
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
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Select Membership Plan Tier *
            </label>
            <select
              value={convertPlanId}
              onChange={(e) => setConvertPlanId(e.target.value)}
              required
              className="w-full py-2.5 px-3.5 bg-[#111418] rounded-xl border border-white/10 text-white text-xs focus:outline-none focus:border-[#CCFF00]/60 transition-colors"
            >
              <option value="" className="bg-[#111418] text-white">Choose plan...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#111418] text-white">
                  {p.name} ({formatCurrency(p.price)}/yr)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Payment Tender Method *
            </label>
            <select
              value={convertPayment}
              onChange={(e) => setConvertPayment(e.target.value)}
              className="w-full py-2.5 px-3.5 bg-[#111418] rounded-xl border border-white/10 text-white text-xs focus:outline-none focus:border-[#CCFF00]/60 transition-colors"
            >
              <option value="cash" className="bg-[#111418] text-white">Cash Tender</option>
              <option value="upi" className="bg-[#111418] text-white">UPI / Instant QR</option>
              <option value="card" className="bg-[#111418] text-white">Credit / Debit Card</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsConvertModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="volt" type="submit" loading={converting} className="font-black uppercase text-xs">
              Enroll & Issue Member Pass
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default LeadsCrm
