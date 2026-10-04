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

      if (redirect) {
        navigate(redirect)
      } else if (data.user.role === 'owner') {
        navigate('/owner')
      } else if (data.user.role === 'member') {
        navigate('/app')
      } else if (data.user.role === 'shop_staff' || data.user.email?.toLowerCase().includes('shop')) {
        navigate('/staff/products')
      } else if (
        data.user.role === 'cafe_staff' ||
        data.user.role === 'bar_staff' ||
        data.user.email?.toLowerCase().includes('cafe') ||
        data.user.email?.toLowerCase().includes('bar')
      ) {
        navigate('/staff/cafe/inventory')
      } else {
        navigate('/staff/bookings')
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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#1B4D2E] text-white flex items-center justify-center mx-auto shadow-md">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            The Champions Club
          </h1>
          <p className="text-xs text-slate-500">
            Sign in to access your court reservations and member privileges
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-200/90 shadow-lg">
          <CardContent className="p-6 sm:p-7 space-y-5">
            {/* Error Banner */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
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
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email)
                      setForgotSubmitted(false)
                      setShowForgotModal(true)
                    }}
                    className="text-xs text-[#1B4D2E] hover:underline font-medium"
                    tabIndex={-1}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400 pointer-events-none">
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
                    className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-10 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1B4D2E] focus:ring-2 focus:ring-[#1B4D2E]/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#1B4D2E] focus:ring-[#1B4D2E]"
                  />
                  <span>Remember my email</span>
                </label>
              </div>

              <Button
                type="submit"
                variant="lawn"
                size="lg"
                loading={loading}
                className="w-full font-bold shadow-sm flex items-center justify-center gap-2"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Register CTA */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs text-center space-y-1">
          <p className="text-xs text-slate-600">
            Don't have a membership account yet?
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4D2E] hover:text-[#153E24] hover:underline"
          >
            <span>Create New Member Account / Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
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
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your registered email address and we'll send you instructions to reset your club portal password.
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
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Front Desk Assistance: <strong>+91 98765 43210</strong></span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForgotModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="lawn" size="sm">
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
