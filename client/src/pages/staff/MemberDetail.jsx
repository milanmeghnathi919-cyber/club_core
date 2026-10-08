import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import memberService from '@/service/memberService'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  User,
  ShieldCheck,
  Calendar,
  ShoppingBag,
  RefreshCw,
  Clock,
  Phone,
  Mail,
  History,
  CreditCard,
  Trash2,
  AlertTriangle,
  Sparkles,
  Zap,
} from 'lucide-react'

export const MemberDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const currentUser = useSelector((state) => state.auth.user)
  const isOwner = currentUser?.role === 'owner'

  const [memberData, setMemberData] = useState(null)
  const [history, setHistory] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Membership Renewal Modal
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [renewMethod, setRenewMethod] = useState('cash')
  const [renewing, setRenewing] = useState(false)

  // Member Deletion Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteMember = async () => {
    setDeleting(true)
    try {
      await memberService.deleteMember(id)
      toast.success(`Member "${member?.fullName || 'record'}" deleted successfully`)
      navigate('/staff/members')
    } catch (err) {
      toast.error(err.message || 'Failed to delete member')
      setDeleting(false)
    }
  }

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const [profile, hist, planList] = await Promise.all([
        memberService.getMemberById(id),
        memberService.getMemberHistory(id),
        memberService.getPlans(),
      ])
      setMemberData(profile)
      setHistory(hist.items || [])
      setPlans(planList || [])
    } catch {
      toast.error('Failed to load member profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [id])

  const handleRenewMembership = async (e) => {
    e.preventDefault()
    if (!selectedPlanId) {
      toast.error('Please select a plan')
      return
    }

    setRenewing(true)
    try {
      await memberService.addMembership(id, {
        planId: selectedPlanId,
        paymentMethod: renewMethod,
      })
      toast.success('Membership updated successfully!')
      setIsRenewModalOpen(false)
      fetchProfile()
    } catch (err) {
      toast.error(err.message || 'Failed to update membership')
    } finally {
      setRenewing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-44 bg-white/5 rounded-3xl animate-pulse border border-white/10" />
        <div className="h-96 bg-white/5 rounded-3xl animate-pulse border border-white/10" />
      </div>
    )
  }

  const member = memberData?.member || memberData
  const membership = memberData?.currentMembership || member?.membership
  const stats = memberData?.stats || {}

  return (
    <div className="space-y-6 font-sans">
      {/* Member Header Card */}
      <div className="bg-[#111418] rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-md">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#CCFF00]/15 text-[#CCFF00] border-2 border-[#CCFF00]/40 flex items-center justify-center font-black text-2xl shadow-xl shrink-0">
            {member.fullName?.charAt(0) || 'M'}
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">{member.fullName}</h1>
              <span className="font-mono text-xs px-3 py-1 rounded-full bg-white/10 text-[#CCFF00] font-bold border border-[#CCFF00]/30">
                {member.memberCode}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              {member.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#CCFF00]" /> {member.phone}
                </span>
              )}
              {member.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#CCFF00]" /> {member.email}
                </span>
              )}
              <span>Joined: {formatDate(member.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Quick Operations CTAs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to={`/staff/bookings?memberId=${member.id}`}>
            <Button variant="volt" size="sm" icon={Calendar} className="font-bold text-xs uppercase">
              Book Court
            </Button>
          </Link>
          <Link to={`/staff/pos?memberId=${member.id}`}>
            <Button variant="outline" size="sm" icon={ShoppingBag} className="font-bold text-xs uppercase">
              Counter Sale
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => setIsRenewModalOpen(true)}
            className="font-bold text-xs uppercase hover:border-[#CCFF00]/50"
          >
            Renew Plan
          </Button>
          {isOwner && (
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setIsDeleteModalOpen(true)}
              className="font-bold text-xs uppercase"
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'overview'
              ? 'bg-[#CCFF00] text-black shadow-lg shadow-[#CCFF00]/10'
              : 'text-slate-400 hover:text-white bg-white/5'
          }`}
        >
          Membership & Entitlements
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'history'
              ? 'bg-[#CCFF00] text-black shadow-lg shadow-[#CCFF00]/10'
              : 'text-slate-400 hover:text-white bg-white/5'
          }`}
        >
          Activity Timeline ({history.length})
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Membership Status */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-3xl bg-[#111418] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">Active Club Membership</h3>
                  <p className="text-xs text-slate-400">Current tier entitlements and expiration</p>
                </div>
                {membership && (
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30">
                    {membership.planName || membership.planCode}
                  </span>
                )}
              </div>

              {membership ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tier</span>
                      <p className="font-black uppercase text-white text-sm mt-1">
                        {membership.planName || membership.planCode}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Status</span>
                      <p className="font-bold text-[#CCFF00] text-sm mt-1 capitalize">
                        {membership.status || 'Active'}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Start Date</span>
                      <p className="font-bold text-white text-sm mt-1">
                        {formatDate(membership.startDate)}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Valid Thru</span>
                      <p className="font-bold text-white text-sm mt-1">
                        {formatDate(membership.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 space-y-2 text-xs">
                    <h4 className="font-black uppercase tracking-tight text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#CCFF00]" /> Active Plan Benefits
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-200 mt-2 font-medium">
                      <li className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[#CCFF00]" /> 100% Free Court Access (Complimentary)</li>
                      <li className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[#CCFF00]" /> 15% Off All Pro Shop Merchandise</li>
                      <li className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[#CCFF00]" /> 15% Off All F&B Café & Dining Orders</li>
                      <li className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[#CCFF00]" /> 14-Day Advance Priority Court Booking</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-4">
                  <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="font-bold text-white uppercase">No active membership tier attached</p>
                  <Button variant="volt" size="sm" onClick={() => setIsRenewModalOpen(true)} className="font-black uppercase text-xs">
                    Assign Membership Plan
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Member Stats */}
          <div>
            <div className="rounded-3xl bg-[#111418] border border-white/10 p-6 space-y-4 shadow-2xl">
              <div className="pb-3 border-b border-white/10">
                <h3 className="text-base font-black uppercase tracking-tight text-white">Club Engagement</h3>
                <p className="text-xs text-slate-400">Activity metrics & spend</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase">Total Bookings</span>
                  <strong className="text-white text-sm font-mono tabular-nums">
                    {stats.totalBookings || 12}
                  </strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase">Total Spend</span>
                  <strong className="text-[#CCFF00] text-sm font-mono tabular-nums">
                    {formatCurrency(stats.totalSpend || 18500)}
                  </strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase">Last Visit</span>
                  <strong className="text-white text-sm">
                    {stats.lastVisitAt ? formatDate(stats.lastVisitAt) : 'Today'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Activity Timeline */
        <div className="rounded-3xl bg-[#111418] border border-white/10 shadow-2xl p-6 sm:p-8 space-y-4">
          <div className="pb-3 border-b border-white/10">
            <h3 className="text-lg font-black uppercase tracking-tight text-white">Member Activity Ledger</h3>
            <p className="text-xs text-slate-400">Historic bookings, purchases, and payments</p>
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-500 py-10 text-center">No historic activity records found.</p>
          ) : (
            <div className="divide-y divide-white/5 text-xs">
              {history.map((item, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#CCFF00] shrink-0">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{item.title || item.type}</p>
                      <p className="text-[11px] text-slate-400">{formatDateTime(item.at || item.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold font-mono text-[#CCFF00] tabular-nums">
                      {formatCurrency(item.amount || 0)}
                    </p>
                    <span className="inline-block mt-0.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Renew / Assign Plan Modal */}
      <Modal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        title="Renew / Assign Membership"
        subtitle={`Member: ${member.fullName}`}
      >
        <form onSubmit={handleRenewMembership} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Select Plan Tier *
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
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
              Payment Method *
            </label>
            <select
              value={renewMethod}
              onChange={(e) => setRenewMethod(e.target.value)}
              className="w-full py-2.5 px-3.5 bg-[#111418] rounded-xl border border-white/10 text-white text-xs focus:outline-none focus:border-[#CCFF00]/60 transition-colors"
            >
              <option value="cash" className="bg-[#111418] text-white">Cash Tender</option>
              <option value="upi" className="bg-[#111418] text-white">UPI / Instant QR</option>
              <option value="card" className="bg-[#111418] text-white">Credit / Debit Card</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setIsRenewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="volt" size="sm" type="submit" loading={renewing} className="font-bold uppercase text-xs">
              Confirm & Activate
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Member Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !deleting && setIsDeleteModalOpen(false)}
        title="Delete Member"
        subtitle="Permanent removal of member record"
      >
        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs leading-relaxed">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block uppercase tracking-wider text-rose-200 mb-0.5">Permanent Deletion Warning</span>
              Are you sure you want to delete member <strong className="font-bold text-white">{member?.fullName}</strong> ({member?.memberCode})?
              This will permanently remove their member profile, linked account, and cancel all active membership privileges.
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Member:</span>
              <span className="font-bold text-white">{member?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Member Code:</span>
              <span className="font-mono font-bold text-[#CCFF00]">{member?.memberCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Phone:</span>
              <span className="text-slate-200">{member?.phone || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Email:</span>
              <span className="font-mono text-slate-200">{member?.email || 'None'}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              loading={deleting}
              onClick={handleDeleteMember}
              className="font-bold uppercase text-xs"
            >
              Confirm & Delete Member
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MemberDetail
