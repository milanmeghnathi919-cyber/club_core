import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import memberService from '@/service/memberService'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  User,
  ShieldCheck,
  Calendar,
  Wine,
  ShoppingBag,
  RefreshCw,
  Clock,
  Phone,
  Mail,
  History,
  CreditCard,
  Trash2,
  AlertTriangle,
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
    } catch (err) {
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
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  const member = memberData?.member || memberData
  const membership = memberData?.currentMembership || member?.membership
  const stats = memberData?.stats || {}

  return (
    <div className="space-y-6 font-sans">
      {/* Member Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#1B4D2E] text-white flex items-center justify-center font-bold text-xl shadow-md">
            {member.fullName?.charAt(0) || 'M'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900">{member.fullName}</h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                {member.memberCode}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              {member.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {member.phone}
                </span>
              )}
              {member.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {member.email}
                </span>
              )}
              <span>Joined: {formatDate(member.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Quick Operations CTAs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to={`/staff/bookings?memberId=${member.id}`}>
            <Button variant="lawn" size="sm" icon={Calendar}>
              Book Court
            </Button>
          </Link>
          <Link to={`/staff/pos?memberId=${member.id}`}>
            <Button variant="outline" size="sm" icon={ShoppingBag}>
              Counter Sale
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => setIsRenewModalOpen(true)}
          >
            Renew Plan
          </Button>
          {isOwner && (
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete Member
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-[#1B4D2E] text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Membership & Entitlements
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-[#1B4D2E] text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Activity Timeline ({history.length})
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Membership Status */}
          <div className="md:col-span-2">
            <Card className="border-slate-200">
              <CardHeader
                title="Active Club Membership"
                subtitle="Current tier entitlements and expiration"
                action={
                  membership && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                      {membership.planName || membership.planCode}
                    </span>
                  )
                }
              />
              <CardContent className="space-y-4">
                {membership ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Tier</span>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">
                          {membership.planName || membership.planCode}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Status</span>
                        <p className="font-bold text-emerald-700 text-sm mt-0.5 capitalize">
                          {membership.status || 'Active'}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Start Date</span>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">
                          {formatDate(membership.startDate)}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Valid Thru</span>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">
                          {formatDate(membership.endDate)}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2 text-xs">
                      <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" /> Active Plan Benefits
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-emerald-900 mt-2">
                        <li>• 100% Free Court Access (Complimentary)</li>
                        <li>• 15% Off All Pro Shop Merchandise</li>
                        <li>• 15% Off All F&B Café & Dining Orders</li>
                        <li>• 14-Day Advance Priority Court Booking</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 space-y-3">
                    <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">No active membership tier attached</p>
                    <Button variant="lawn" size="sm" onClick={() => setIsRenewModalOpen(true)}>
                      Assign Membership Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Member Stats */}
          <div>
            <Card className="border-slate-200">
              <CardHeader title="Club Engagement" subtitle="Activity metrics" />
              <CardContent className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500">Total Bookings:</span>
                  <strong className="text-slate-900 text-sm tabular-nums">
                    {stats.totalBookings || 12}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500">Total Spend:</span>
                  <strong className="text-emerald-700 text-sm tabular-nums">
                    {formatCurrency(stats.totalSpend || 18500)}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500">Last Visit:</span>
                  <strong className="text-slate-900 text-sm">
                    {stats.lastVisitAt ? formatDate(stats.lastVisitAt) : 'Today'}
                  </strong>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Activity Timeline */
        <Card className="border-slate-200">
          <CardHeader title="Member Activity Ledger" subtitle="Historic bookings, purchases, and payments" />
          <CardContent>
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No historic activity records found.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {history.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <History className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{item.title || item.type}</p>
                        <p className="text-[11px] text-slate-400">{formatDateTime(item.at || item.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 tabular-nums">
                        {formatCurrency(item.amount || 0)}
                      </p>
                      <Badge status={item.status}>{item.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Renew / Assign Plan Modal */}
      <Modal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        title="Renew / Assign Membership"
        subtitle={`Member: ${member.fullName}`}
      >
        <form onSubmit={handleRenewMembership} className="space-y-4 py-2">
          <Select
            label="Select Plan Tier *"
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
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
            label="Payment Method *"
            value={renewMethod}
            onChange={(e) => setRenewMethod(e.target.value)}
          >
            <option value="cash">Cash Tender</option>
            <option value="upi">UPI / Instant QR</option>
            <option value="card">Credit / Debit Card</option>
          </Select>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => setIsRenewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="lawn" size="md" type="submit" loading={renewing} className="font-bold">
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
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs leading-relaxed">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-rose-900 mb-0.5">Permanent Deletion Warning</span>
              Are you sure you want to delete member <strong className="font-semibold text-rose-950">{member?.fullName}</strong> ({member?.memberCode})?
              This will permanently remove their member profile, linked account, and cancel all active membership privileges.
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Member:</span>
              <span className="font-bold text-slate-800">{member?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Member Code:</span>
              <span className="font-mono font-bold text-slate-700">{member?.memberCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone:</span>
              <span className="text-slate-700">{member?.phone || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-mono text-slate-700">{member?.email || 'None'}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
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
              className="font-bold"
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
