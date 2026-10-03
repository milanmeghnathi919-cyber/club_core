import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import memberService from '@/service/memberService'
import { formatDate } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Card, { CardContent } from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { UserPlus, Search, Phone, Mail, ChevronRight, Users, ShieldCheck, Trash2, AlertTriangle } from 'lucide-react'

export const MemberList = () => {
  const toast = useToast()
  const currentUser = useSelector((state) => state.auth.user)
  const isOwner = currentUser?.role === 'owner'

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planCode, setPlanCode] = useState('')
  const [status, setStatus] = useState('')

  // Member Delete State
  const [memberToDelete, setMemberToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteMember = async () => {
    if (!memberToDelete) return
    setDeleting(true)
    try {
      await memberService.deleteMember(memberToDelete.id)
      toast.success(`Member "${memberToDelete.fullName}" deleted successfully`)
      setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id))
      setMemberToDelete(null)
    } catch (err) {
      toast.error(err.message || 'Failed to delete member')
    } finally {
      setDeleting(false)
    }
  }

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.q = search
      if (planCode) params.planCode = planCode
      if (status) params.status = status

      const res = await memberService.getMembers(params)
      setMembers(res.items || [])
    } catch (err) {
      toast.error('Failed to load member records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchMembers, 200)
    return () => clearTimeout(timer)
  }, [search, planCode, status])

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
            Member Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Club Members & Passes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search, recognize members, and review active memberships.
          </p>
        </div>

        <Link to="/staff/members/new">
          <Button variant="lawn" size="sm" icon={UserPlus} className="font-bold">
            Register Member
          </Button>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] max-w-sm relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone or code..."
            className="w-full pl-9 pr-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D2E]/20 focus:border-[#1B4D2E]"
          />
        </div>

        <Select
          value={planCode}
          onChange={(e) => setPlanCode(e.target.value)}
          placeholder="All Plans"
          className="text-xs py-1.5"
        >
          <option value="GOLD">Gold</option>
          <option value="SILVER">Silver</option>
          <option value="JUNIOR">Junior</option>
        </Select>

        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder="All Statuses"
          className="text-xs py-1.5"
        >
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </Select>
      </div>

      {/* Members Table */}
      <Card className="border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700">No member records match your query</h4>
            <p className="text-xs text-slate-400">Try adjusting your filters or register a new member.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Member Code</th>
                  <th className="py-3 px-4">Phone / Contact</th>
                  <th className="py-3 px-4">Active Plan</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => {
                  const plan = m.membership || m.currentMembership

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1B4D2E]/10 text-[#1B4D2E] font-bold text-xs flex items-center justify-center shrink-0">
                            {m.fullName?.charAt(0) || 'M'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{m.fullName}</span>
                            <span className="text-[11px] text-slate-400">{m.email || 'No email'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                        {m.memberCode}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {m.phone || '-'}
                      </td>

                      <td className="py-3 px-4">
                        {plan ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            <ShieldCheck className="w-3 h-3 text-amber-600" />
                            {plan.planName || plan.planCode}
                          </span>
                        ) : (
                          <span className="text-slate-400">No active plan</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {plan?.endDate ? formatDate(plan.endDate) : '-'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/staff/members/${m.id}`}>
                            <Button variant="outline" size="sm" className="text-xs">
                              Profile <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Button>
                          </Link>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => setMemberToDelete(m)}
                              className="inline-flex items-center justify-center p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/60 hover:border-rose-300 transition-colors cursor-pointer shadow-2xs"
                              title={`Delete ${m.fullName}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Member Confirmation Modal */}
      <Modal
        isOpen={!!memberToDelete}
        onClose={() => !deleting && setMemberToDelete(null)}
        title="Delete Member"
        subtitle="Permanent removal of member record"
      >
        {memberToDelete && (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs leading-relaxed">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-rose-900 mb-0.5">Permanent Deletion Warning</span>
                Are you sure you want to delete member <strong className="font-semibold text-rose-950">{memberToDelete.fullName}</strong> ({memberToDelete.memberCode})?
                This will delete their membership profile, linked member account, and associated entitlements.
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Member:</span>
                <span className="font-bold text-slate-800">{memberToDelete.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Member Code:</span>
                <span className="font-mono font-bold text-slate-700">{memberToDelete.memberCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="text-slate-700">{memberToDelete.phone || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-700">{memberToDelete.email || 'None'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMemberToDelete(null)}
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
        )}
      </Modal>
    </div>
  )
}

export default MemberList
