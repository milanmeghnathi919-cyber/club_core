import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCredentials } from '@/feature/auth/slices/authSlice'
import authService from '@/service/authService'
import useToast from '@/components/ui/Toast'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import {
  Trophy,
  Lock,
  Mail,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Phone,
  ArrowRight,
} from 'lucide-react'

export const Login = () => {
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSubmitted, setForgotSubmitted] = useState(false)

  // Pre-load saved email if rememberMe was previously set
  useEffect(() => {
    const savedEmail = localStorage.getItem('cc_remember_email')
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email address and password')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const cleanEmail = email.trim().toLowerCase()
      const data = await authService.login(cleanEmail, password)

      // Manage remember email
      if (rememberMe) {
        localStorage.setItem('cc_remember_email', cleanEmail)
      } else {
        localStorage.removeItem('cc_remember_email')
      }

      dispatch(setCredentials({ user: data.user, token: data.token }))
      toast.success(`Welcome back, ${data.user.name}!`)

      const userRole = (data.user?.role || '').toLowerCase()

      if (userRole === 'member' || userRole === 'user') {
        // Members must NEVER be redirected to /owner or /staff
        if (redirect && !redirect.startsWith('/owner') && !redirect.startsWith('/staff')) {
          navigate(redirect)
        } else {
          navigate('/app')
        }
      } else if (userRole === 'owner') {
        if (redirect && !redirect.startsWith('/app')) {
          navigate(redirect)
        } else {
          navigate('/owner')
        }
      } else if (userRole === 'shop_staff' || data.user?.email?.toLowerCase().includes('shop')) {
        navigate(redirect && redirect.startsWith('/staff') ? redirect : '/staff/products')
      } else if (
        userRole === 'cafe_staff' ||
        userRole === 'bar_staff' ||
        data.user?.email?.toLowerCase().includes('cafe') ||
        data.user?.email?.toLowerCase().includes('bar')
      ) {
        navigate(redirect && redirect.startsWith('/staff') ? redirect : '/staff/cafe/inventory')
      } else {
        navigate(redirect && redirect.startsWith('/staff') ? redirect : '/staff/bookings')
      }
    } catch (err) {
      let msg = err.message || 'Invalid email or password'
      if (err.code === 'INVALID_CREDENTIALS') {
        msg = 'Invalid email or password. Please verify your credentials.'
      } else if (err.code === 'ACCOUNT_DISABLED') {
        msg = 'Your account has been deactivated. Please contact club administration.'
      }
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = (e) => {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotSubmitted(true)
    toast.success('Password reset instructions dispatched to registered address.')
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-14 font-sans relative bg-[#090B0E] text-white">
      {/* Background glow and subtle court mesh */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#CCFF00]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-court-mesh-dark opacity-30 pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#CCFF00]/15 text-[#CCFF00] flex items-center justify-center mx-auto shadow-lg shadow-[#CCFF00]/20 border border-[#CCFF00]/30 animate-float">
            <Trophy className="w-7 h-7 text-[#CCFF00]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display uppercase">
              THE CHAMPIONS CLUB
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mt-1">
              Sign in to access your court reservations, member privileges & digital pass
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="bg-[#111418] border border-white/10 shadow-2xl rounded-3xl">
          <CardContent className="p-6 sm:p-8 space-y-5 text-white">
            {/* Error Banner */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Quick Demo Access Bar */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#CCFF00] block flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-ping" />
                ⚡ 1-Click Demo Personas (Instant Access)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('member@championsclub.in')
                    setPassword('Member@123')
                  }}
                  className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-[#CCFF00]/15 hover:border-[#CCFF00]/40 text-white hover:text-[#CCFF00] border border-white/10 text-[11px] font-bold text-left transition-all cursor-pointer"
                >
                  👑 Gold Member
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('frontdesk@championsclub.in')
                    setPassword('Staff@123')
                  }}
                  className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-[#CCFF00]/15 hover:border-[#CCFF00]/40 text-white hover:text-[#CCFF00] border border-white/10 text-[11px] font-bold text-left transition-all cursor-pointer"
                >
                  🛡️ Front Desk Staff
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('bar@championsclub.in')
                    setPassword('Staff@123')
                  }}
                  className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-[#CCFF00]/15 hover:border-[#CCFF00]/40 text-white hover:text-[#CCFF00] border border-white/10 text-[11px] font-bold text-left transition-all cursor-pointer"
                >
                  🍽️ Cafe & Bar Staff
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('owner@championsclub.in')
                    setPassword('Admin@123')
                  }}
                  className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-[#CCFF00]/15 hover:border-[#CCFF00]/40 text-white hover:text-[#CCFF00] border border-white/10 text-[11px] font-bold text-left transition-all cursor-pointer"
                >
                  💼 Club Owner
                </button>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4.5">
              <Input
                label="Email Address"
                type="email"
                icon={Mail}
                placeholder="you@championsclub.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errorMessage) setErrorMessage('')
                }}
                required
              />

              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email)
                      setForgotSubmitted(false)
                      setShowForgotModal(true)
                    }}
                    className="text-xs text-[#CCFF00] hover:underline font-bold cursor-pointer"
                    tabIndex={-1}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errorMessage) setErrorMessage('')
                    }}
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
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/20 bg-[#12161D] text-[#CCFF00] focus:ring-[#CCFF00] cursor-pointer"
                  />
                  <span className="font-medium">Remember my email</span>
                </label>
              </div>

              <Button
                type="submit"
                variant="volt"
                size="lg"
                loading={loading}
                className="w-full font-extrabold shadow-lg shadow-[#CCFF00]/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Register CTA */}
        <div className="p-4.5 rounded-2xl bg-[#111418] border border-white/10 shadow-xl text-center space-y-1">
          <p className="text-xs text-slate-400 font-medium">
            Don&apos;t have a membership account yet?
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#CCFF00] hover:underline"
          >
            <span>Create New Member Account / Register</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Reset Account Password"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-left">
          {forgotSubmitted ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900">Check Your Inbox</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If an account exists for <strong className="text-slate-800">{forgotEmail}</strong>, we have sent a secure password reset link. For instant assistance, you may also reach the Front Desk.
              </p>
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowForgotModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your registered email address and we&apos;ll send you instructions to reset your club portal password.
              </p>
              <Input
                label="Registered Email"
                type="email"
                icon={Mail}
                placeholder="name@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-300 flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#CCFF00] shrink-0" />
                <span>Front Desk Concierge Hotline: <strong className="text-white">+91 98765 43210</strong></span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForgotModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="volt" size="sm">
                  Send Reset Link
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Login
