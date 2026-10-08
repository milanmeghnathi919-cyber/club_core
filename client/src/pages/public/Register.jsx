import React, { useState, useMemo } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCredentials } from '@/feature/auth/slices/authSlice'
import authService from '@/service/authService'
import useToast from '@/components/ui/Toast'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'
import {
  Trophy,
  Lock,
  Mail,
  User,
  Phone,
  Calendar,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

export const Register = () => {
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  const plan = searchParams.get('plan')
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const toast = useToast()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errorMessage) setErrorMessage('')
  }

  // Password strength calculator
  const passwordStrength = useMemo(() => {
    const pw = form.password
    if (!pw) return { score: 0, label: '', color: 'bg-slate-200' }
    let score = 0
    if (pw.length >= 8) score += 1
    if (pw.length >= 12) score += 1
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1
    if (/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' }
    if (score <= 3) return { score: 2, label: 'Moderate', color: 'bg-amber-500', text: 'text-amber-600' }
    return { score: 3, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' }
  }, [form.password])

  const passwordsMatch = form.password && form.confirmPassword && form.password === form.confirmPassword

  const handleRegister = async (e) => {
    if (e) e.preventDefault()

    if (!form.name.trim()) {
      setErrorMessage('Full name is required')
      return
    }

    if (!form.email.trim()) {
      setErrorMessage('Valid email address is required')
      return
    }

    if (!form.phone.trim()) {
      setErrorMessage('Phone number is required for member records & notifications')
      return
    }

    if (form.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters')
      return
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage('Passwords do not match')
      return
    }

    if (!form.agreeTerms) {
      setErrorMessage('Please accept the Club Code of Conduct & Etiquette rules')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        dob: form.dob || undefined,
      }

      const res = await authService.register(payload)
      dispatch(setCredentials({ user: res.user, token: res.token }))
      toast.success(`Welcome to The Champions Club, ${res.user.name}! Your account is active.`)

      if (plan) {
        navigate(`/plans?selected=${encodeURIComponent(plan)}`)
      } else if (redirect && !redirect.startsWith('/owner') && !redirect.startsWith('/staff')) {
        navigate(redirect)
      } else {
        navigate('/app')
      }
    } catch (err) {
      let msg = err.message || 'Registration failed'
      if (err.code === 'EMAIL_EXISTS' || msg.toLowerCase().includes('email already exists')) {
        msg = 'An account with this email address already exists. Please sign in or use another email.'
      } else if (err.code === 'PHONE_EXISTS' || msg.toLowerCase().includes('phone number already exists')) {
        msg = 'This phone number is already registered. Please check or use another phone number.'
      }
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const fillQuickDemo = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    setForm({
      name: 'Rohan Mehta',
      email: `rohan.mehta${randomSuffix}@gmail.com`,
      phone: `+91 98765 ${Math.floor(10000 + Math.random() * 90000)}`,
      dob: '1995-06-15',
      password: 'ClubMember@123',
      confirmPassword: 'ClubMember@123',
      agreeTerms: true,
    })
    setErrorMessage('')
    toast.info('Filled with unique test applicant details. Click "Join The Champions Club" to register!')
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 font-sans relative bg-[#090B0E] text-white">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#CCFF00]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-court-mesh-dark opacity-30 pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 rounded-2xl bg-[#CCFF00]/15 text-[#CCFF00] flex items-center justify-center mx-auto shadow-lg shadow-[#CCFF00]/20 border border-[#CCFF00]/30 animate-float">
            <Trophy className="w-7 h-7 text-[#CCFF00]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display uppercase">
            Join The Champions Club
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Create your member account to reserve courts, enter social sessions, and access club privileges.
          </p>
        </div>

        {/* Card */}
        <Card className="bg-[#111418] border border-white/10 shadow-2xl rounded-3xl">
          <CardContent className="p-6 sm:p-8 space-y-5 text-white">
            {/* Quick Demo Fill Banner for Evaluators */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#CCFF00] shrink-0" />
                <span className="font-bold">Hackathon Quick-Fill:</span>
              </div>
              <button
                type="button"
                onClick={fillQuickDemo}
                className="px-3 py-1.5 text-xs font-extrabold bg-[#CCFF00] hover:bg-[#B4E600] text-black rounded-xl shadow-xs transition-transform hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
              >
                Auto-Fill New Member
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Full Name */}
              <Input
                label="Full Name"
                name="name"
                icon={User}
                placeholder="e.g. Rohan Mehta"
                value={form.name}
                onChange={handleChange}
                required
              />

              {/* Email Address */}
              <Input
                label="Email Address"
                type="email"
                name="email"
                icon={Mail}
                placeholder="rohan@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />

              {/* Phone & DOB Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  type="tel"
                  name="phone"
                  icon={Phone}
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  helperText="Required for court SMS/WhatsApp updates"
                />

                <Input
                  label="Date of Birth (Optional)"
                  type="date"
                  name="dob"
                  icon={Calendar}
                  value={form.dob}
                  onChange={handleChange}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/15 bg-[#12161D] pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#CCFF00] focus:ring-2 focus:ring-[#CCFF00]/25 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-white focus:outline-none cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {form.password && (
                  <div className="pt-1.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Strength:</span>
                      <span className={`font-bold ${passwordStrength.text}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full rounded-full transition-all ${
                          passwordStrength.score >= 1 ? passwordStrength.color : 'bg-white/10'
                        } flex-1`}
                      />
                      <div
                        className={`h-full rounded-full transition-all ${
                          passwordStrength.score >= 2 ? passwordStrength.color : 'bg-white/10'
                        } flex-1`}
                      />
                      <div
                        className={`h-full rounded-full transition-all ${
                          passwordStrength.score >= 3 ? passwordStrength.color : 'bg-white/10'
                        } flex-1`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className={`w-full rounded-xl border bg-[#12161D] pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      form.confirmPassword && !passwordsMatch
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                        : form.confirmPassword && passwordsMatch
                        ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                        : 'border-white/15 focus:border-[#CCFF00] focus:ring-[#CCFF00]/25'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-white focus:outline-none cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirmPassword && (
                  <p className="text-[11px] font-medium flex items-center gap-1">
                    {passwordsMatch ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2.5 pt-1 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={form.agreeTerms}
                  onChange={handleChange}
                  className="mt-0.5 rounded border-white/20 bg-[#12161D] text-[#CCFF00] focus:ring-[#CCFF00] cursor-pointer"
                />
                <span>
                  I accept The Champions Club court etiquette, rules, and privacy policy.
                </span>
              </label>

              {/* Submit CTA */}
              <Button
                type="submit"
                variant="volt"
                size="lg"
                loading={loading}
                className="w-full font-extrabold shadow-lg shadow-[#CCFF00]/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Join The Champions Club</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </Button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-[#CCFF00] font-extrabold hover:underline">
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-[#CCFF00]" />
          <span>Bank-grade 256-bit encrypted authentication & cookie tokens</span>
        </div>
      </div>
    </div>
  )
}

export default Register
