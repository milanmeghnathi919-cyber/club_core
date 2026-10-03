import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import memberService from '@/service/memberService'
import { formatCurrency } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import { UserPlus, Trophy, CheckCircle2, ShieldCheck, ArrowRight, Key } from 'lucide-react'

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
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Member Successfully Enrolled!</h1>
          <p className="text-xs text-slate-500">
            Official profile created and single ledger membership payment recorded.
          </p>
        </div>

        {/* Member Pass Preview */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-black text-white p-6 shadow-xl border border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
                The Champions Club Pass
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold uppercase">
              Active Member
            </span>
          </div>

          <div>
            <h3 className="text-xl font-bold">{m.fullName}</h3>
            <p className="font-mono text-sm text-amber-400 mt-0.5">{m.memberCode}</p>
          </div>

          <div className="pt-2 border-t border-white/10 flex justify-between text-xs text-slate-400">
            <span>Phone: {m.phone}</span>
            {m.email && <span>Email: {m.email}</span>}
          </div>

          {createdResult.tempPassword && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Temporary Portal Password:</span>
              </div>
              <strong className="font-mono text-white text-sm bg-black/40 px-2 py-0.5 rounded">
                {createdResult.tempPassword}
              </strong>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link to={`/staff/members/${m.id}`} className="flex-1">
            <Button variant="lawn" className="w-full font-bold">
              View Profile
            </Button>
          </Link>
          <Button
            variant="outline"
            className="flex-1"
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
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
          Front Desk Concierge
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          New Member Quick Registration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete intake and initialize membership plan in under 60 seconds.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader title="Applicant Profile" subtitle="Personal and contact information" />
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <Select
                label="Membership Plan Tier *"
                value={form.planId}
                onChange={(e) => setForm({ ...form, planId: e.target.value })}
                required
              >
                <option value="">Select Plan...</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCurrency(p.price)}/yr)
                  </option>
                ))}
              </Select>

              <Select
                label="Payment Tender Method *"
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              >
                <option value="cash">Cash Tender</option>
                <option value="upi">UPI / QR Code</option>
                <option value="card">Credit / Debit Card</option>
                <option value="later">Invoice Later</option>
              </Select>
            </div>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={form.createLogin}
                onChange={(e) => setForm({ ...form, createLogin: e.target.checked })}
                className="rounded border-slate-300 text-[#1B4D2E] focus:ring-[#1B4D2E]"
              />
              <span>Generate portal credentials & issue temporary password</span>
            </label>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => navigate('/staff/members')}>
                Cancel
              </Button>
              <Button variant="lawn" type="submit" loading={loading} className="font-bold">
                Complete Registration
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default MemberNew
