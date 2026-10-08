import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import memberService from '@/service/memberService'
import { formatCurrency } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { UserPlus, Trophy, CheckCircle2, ShieldCheck, ArrowRight, Key, Sparkles } from 'lucide-react'

export const MemberNew = () => {
  const navigate = useNavigate()
  const toast = useToast()

  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [createdResult, setCreatedResult] = useState(null)

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    dob: '',
    planId: '',
    paymentMethod: 'cash',
    createLogin: true,
  })

  useEffect(() => {
    memberService.getPlans().then(setPlans).catch(console.error)
  }, [])

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!form.fullName || !form.phone || !form.planId) {
      toast.error('Please complete name, phone, and plan tier')
      return
    }

    // Client-side Junior Age check (BR-05)
    if (form.dob) {
      const birthDate = new Date(form.dob)
      const ageDiff = Date.now() - birthDate.getTime()
      const age = new Date(ageDiff).getUTCFullYear() - 1970
      const selectedPlan = plans.find((p) => p.id === form.planId)

      if (selectedPlan?.code?.toUpperCase() === 'JUNIOR' && age >= 18) {
        toast.error('Junior plan requires age strictly under 18')
        return
      }
      if (selectedPlan?.code?.toUpperCase() !== 'JUNIOR' && age < 18) {
        toast.error('Members under 18 must be enrolled under the Junior plan')
        return
      }
    }

    setLoading(true)
    try {
      const res = await memberService.createMember({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        dob: form.dob || undefined,
        planId: form.planId,
        paymentMethod: form.paymentMethod,
        createLogin: form.createLogin,
      })

      setCreatedResult(res)
      toast.success(`Member registered! Member Code: ${res.member?.memberCode}`)
    } catch (err) {
      if (err.code === 'PHONE_EXISTS') {
        toast.error('A member with this phone number is already registered.')
      } else if (err.code === 'JUNIOR_AGE_MISMATCH') {
        toast.error('Junior plan age mismatch: applicant must be under 18.')
      } else {
        toast.error(err.message || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  if (createdResult) {
    const m = createdResult.member || createdResult
    return (
      <div className="max-w-lg mx-auto py-12 px-4 space-y-6 font-sans">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#CCFF00]/15 text-[#CCFF00] flex items-center justify-center mx-auto shadow-xl border border-[#CCFF00]/40">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">Member Successfully Enrolled!</h1>
          <p className="text-xs text-slate-400">
            Official profile created and single ledger membership payment recorded.
          </p>
        </div>

        {/* Member Pass Preview */}
        <div className="rounded-3xl bg-[#111418] text-white p-6 sm:p-8 shadow-2xl border-2 border-[#CCFF00]/40 space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#CCFF00]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#CCFF00]" />
              <span className="font-black text-xs uppercase tracking-wider text-slate-300">
                The Champions Club Pass
              </span>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#CCFF00]/15 text-[#CCFF00] text-[10px] font-black uppercase border border-[#CCFF00]/30">
              Active Member
            </span>
          </div>

          <div className="relative z-10">
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">{m.fullName}</h3>
            <p className="font-mono text-base font-bold text-[#CCFF00] mt-1">{m.memberCode}</p>
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-between text-xs text-slate-400 relative z-10">
            <span>Phone: {m.phone}</span>
            {m.email && <span>Email: {m.email}</span>}
          </div>

          {createdResult.tempPassword && (
            <div className="p-3.5 bg-[#CCFF00]/10 border border-[#CCFF00]/30 rounded-2xl flex items-center justify-between text-xs text-[#CCFF00] relative z-10">
              <div className="flex items-center gap-2 font-bold">
                <Key className="w-4 h-4 text-[#CCFF00]" />
                <span>Temporary Portal Password:</span>
              </div>
              <strong className="font-mono text-black text-sm bg-[#CCFF00] px-2.5 py-0.5 rounded-lg">
                {createdResult.tempPassword}
              </strong>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link to={`/staff/members/${m.id}`} className="flex-1">
            <Button variant="volt" className="w-full font-black uppercase text-xs">
              View Profile
            </Button>
          </Link>
          <Button
            variant="outline"
            className="flex-1 font-bold uppercase text-xs"
            onClick={() => {
              setCreatedResult(null)
              setForm({
                fullName: '',
                phone: '',
                email: '',
                dob: '',
                planId: '',
                paymentMethod: 'cash',
                createLogin: true,
              })
            }}
          >
            Register Another
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans">
      <div className="border-b border-white/10 pb-4">
        <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Front Desk Concierge
        </span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
          New Member Quick Registration
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Complete intake and initialize membership plan in under 60 seconds.
        </p>
      </div>

      <div className="rounded-3xl bg-[#111418] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="pb-4 border-b border-white/10">
          <h2 className="text-lg font-black uppercase tracking-tight text-white">Applicant Profile</h2>
          <p className="text-xs text-slate-400">Personal and contact information</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              placeholder="e.g. Ananya Sen"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
            <Input
              label="Mobile Phone *"
              placeholder="e.g. +91 98765 00000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. ananya@gmail.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Date of Birth"
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              helperText="Required if enrolling under the Junior (<18) tier"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-white/5 border border-white/10">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Membership Plan Tier *
              </label>
              <select
                value={form.planId}
                onChange={(e) => setForm({ ...form, planId: e.target.value })}
                required
                className="w-full py-2.5 px-3.5 bg-[#111418] rounded-xl border border-white/10 text-white text-xs focus:outline-none focus:border-[#CCFF00]/60 transition-colors"
              >
                <option value="" className="bg-[#111418] text-white">Select Plan...</option>
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
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full py-2.5 px-3.5 bg-[#111418] rounded-xl border border-white/10 text-white text-xs focus:outline-none focus:border-[#CCFF00]/60 transition-colors"
              >
                <option value="cash" className="bg-[#111418] text-white">Cash Tender</option>
                <option value="upi" className="bg-[#111418] text-white">UPI / QR Code</option>
                <option value="card" className="bg-[#111418] text-white">Credit / Debit Card</option>
                <option value="later" className="bg-[#111418] text-white">Invoice Later</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs text-slate-300 font-medium cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={form.createLogin}
              onChange={(e) => setForm({ ...form, createLogin: e.target.checked })}
              className="rounded border-white/20 text-[#CCFF00] focus:ring-[#CCFF00]"
            />
            <span>Generate portal credentials & issue temporary password</span>
          </label>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => navigate('/staff/members')}>
              Cancel
            </Button>
            <Button variant="volt" type="submit" loading={loading} className="font-black uppercase text-xs">
              Complete Registration
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MemberNew
