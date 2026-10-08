import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import memberService from '@/service/memberService'
import { formatDate } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { UserPlus, Search, Phone, Mail, ChevronRight, Users, ShieldCheck, Trash2, AlertTriangle, Sparkles } from 'lucide-react'

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
    } catch {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Member Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
            Club Members & Passes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search, recognize members, and review active memberships in real-time.
          </p>
        </div>

        <Link to="/staff/members/new">
          <Button variant="volt" size="sm" icon={UserPlus} className="font-black uppercase text-xs">
            Register Member
          </Button>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] max-w-sm relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone or code..."
            className="w-full pl-10 pr-3.5 py-2.5 bg-[#111418] rounded-xl border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00]/60 focus:ring-1 focus:ring-[#CCFF00]/40 transition-colors"
          />
        </div>

        <select
          value={planCode}
          onChange={(e) => setPlanCode(e.target.value)}
          className="text-xs py-2.5 px-3.5 bg-[#111418] rounded-xl border border-white/10 text-white focus:outline-none focus:border-[#CCFF00]/60 transition-colors"
        >
          <option value="" className="bg-[#111418] text-white">All Plans</option>
          <option value="GOLD" className="bg-[#111418] text-white">Gold</option>
          <option value="SILVER" className="bg-[#111418] text-white">Silver</option>
          <option value="JUNIOR" className="bg-[#111418] text-white">Junior</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-xs py-2.5 px-3.5 bg-[#111418] rounded-xl border border-white/10 text-white focus:outline-none focus:border-[#CCFF00]/60 transition-colors"
        >
          <option value="" className="bg-[#111418] text-white">All Statuses</option>
          <option value="active" className="bg-[#111418] text-white">Active</option>
          <option value="expired" className="bg-[#111418] text-white">Expired</option>
        </select>
      </div>

      {/* Members Table */}
      <div className="rounded-3xl bg-[#111418] border border-white/10 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="font-black uppercase tracking-tight text-white">No member records match your query</h4>
            <p className="text-xs text-slate-400">Try adjusting your filters or register a new member.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">Member</th>
                  <th className="py-3.5 px-5">Member Code</th>
                  <th className="py-3.5 px-5">Phone / Contact</th>
                  <th className="py-3.5 px-5">Active Plan</th>
                  <th className="py-3.5 px-5">Expiry Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {members.map((m) => {
                  const plan = m.membership || m.currentMembership

                  return (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#CCFF00]/15 text-[#CCFF00] font-black text-xs flex items-center justify-center shrink-0 border border-[#CCFF00]/30">
                            {m.fullName?.charAt(0) || 'M'}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{m.fullName}</span>
                            <span className="text-[11px] text-slate-400">{m.email || 'No email'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-[#CCFF00]">
                        {m.memberCode}
                      </td>

                      <td className="py-3.5 px-5 text-slate-300">
                        {m.phone || '-'}
                      </td>

                      <td className="py-3.5 px-5">
                        {plan ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30">
                            <ShieldCheck className="w-3 h-3 text-[#CCFF00]" />
                            {plan.planName || plan.planCode}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-semibold">No active plan</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-slate-300">
                        {plan?.endDate ? formatDate(plan.endDate) : '-'}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/staff/members/${m.id}`}>
                            <button className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-[#CCFF00] hover:text-black transition-colors flex items-center gap-1 border border-white/10 hover:border-[#CCFF00]">
                              Profile <ChevronRight className="w-3 h-3 ml-0.5" />
                            </button>
                          </Link>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => setMemberToDelete(m)}
                              className="inline-flex items-center justify-center p-2 rounded-xl text-rose-400 hover:text-white hover:bg-rose-600/30 border border-rose-500/20 hover:border-rose-500/50 transition-colors cursor-pointer"
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
      </div>

      {/* Delete Member Confirmation Modal */}
      <Modal
        isOpen={!!memberToDelete}
        onClose={() => !deleting && setMemberToDelete(null)}
        title="Delete Member"
        subtitle="Permanent removal of member record"
      >
        {memberToDelete && (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs leading-relaxed">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-black uppercase tracking-wider block text-rose-200 mb-0.5">Permanent Deletion Warning</span>
                Are you sure you want to delete member <strong className="font-bold text-white">{memberToDelete.fullName}</strong> ({memberToDelete.memberCode})?
                This will delete their membership profile, linked member account, and associated entitlements.
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Member:</span>
                <span className="font-bold text-white">{memberToDelete.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Member Code:</span>
                <span className="font-mono font-bold text-[#CCFF00]">{memberToDelete.memberCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="text-slate-200">{memberToDelete.phone || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono text-slate-200">{memberToDelete.email || 'None'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button
                variant="ghost"
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
                className="font-bold uppercase text-xs"
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
