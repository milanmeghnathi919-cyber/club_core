import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { setCredentials } from '@/feature/auth/slices/authSlice'
import authService from '@/service/authService'
import { formatDate, formatCurrency } from '@/utils/format'
import Card, { CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import {
  User,
  ShieldCheck,
  Calendar,
  Clock,
  Mail,
  Phone,
  MapPin,
  HeartHandshake,
  Award,
  Sparkles,
  ShoppingBag,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  X,
  Briefcase,
  DollarSign,
  Building,
  KeyRound,
  ExternalLink,
  QrCode,
  Check,
  Lock,
} from 'lucide-react'

export const Profile = () => {
  const dispatch = useDispatch()
  const currentUser = useSelector((state) => state.auth.user)

  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveError, setSaveError] = useState('')

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pwdCurrent, setPwdCurrent] = useState('')
  const [pwdNew, setPwdNew] = useState('')
  const [pwdConfirm, setPwdConfirm] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMessage, setPwdMessage] = useState({ text: '', type: '' })

  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    emergencyContact: '',
    dob: '',
  })

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await authService.me()
      if (res) {
        setProfileData(res)
        const user = res.user || {}
        const member = res.member || {}
        setFormData({
          name: member.full_name || user.name || '',
          phone: member.phone || user.phone || '',
          address: member.address || '',
          emergencyContact: member.emergency_contact || '',
          dob: member.dob ? member.dob.split('T')[0] : '',
        })
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaveLoading(true)
    setSaveSuccess('')
    setSaveError('')
    try {
      const res = await authService.updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        dob: formData.dob || undefined,
      })

      if (res?.user) {
        dispatch(setCredentials({ user: res.user, token: localStorage.getItem('cc_token') }))
      }
      setProfileData(res)
      setSaveSuccess('Profile information updated successfully.')
      setEditMode(false)
      setTimeout(() => setSaveSuccess(''), 4000)
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to update profile. Please try again.')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwdNew !== pwdConfirm) {
      setPwdMessage({ text: 'New passwords do not match.', type: 'error' })
      return
    }
    if (pwdNew.length < 6) {
      setPwdMessage({ text: 'Password must be at least 6 characters.', type: 'error' })
      return
    }

    setPwdLoading(true)
    setPwdMessage({ text: '', type: '' })
    try {
      await authService.changePassword(pwdCurrent, pwdNew)
      setPwdMessage({ text: 'Password changed successfully!', type: 'success' })
      setTimeout(() => {
        setShowPasswordModal(false)
        setPwdCurrent('')
        setPwdNew('')
        setPwdConfirm('')
        setPwdMessage({ text: '', type: '' })
      }, 1500)
    } catch (err) {
      setPwdMessage({
        text: err.response?.data?.message || 'Failed to change password.',
        type: 'error',
      })
    } finally {
      setPwdLoading(false)
    }
  }

  if (loading && !profileData) {
    return (
      <div className="max-w-5xl mx-auto py-10 space-y-6">
        <div className="h-44 bg-slate-200/80 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200/80 rounded-2xl animate-pulse" />
          <div className="md:col-span-2 h-64 bg-slate-200/80 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  const user = profileData?.user || currentUser || {}
  const member = profileData?.member
  const membership = profileData?.membership
  const membershipHistory = profileData?.membershipHistory || []
  const employee = profileData?.employee
  const isMemberRole = user.role === 'member' || !!member
  const isStaffOrOwner = !isMemberRole || !!employee

  // Calculate validity days
  let validityDaysRemaining = null
  let validityPercent = 100
  let isExpired = false
  let isExpiringSoon = false

  if (membership?.end_date) {
    const end = new Date(membership.end_date)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    validityDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (validityDaysRemaining < 0) {
      isExpired = true
      validityPercent = 0
    } else {
      isExpiringSoon = validityDaysRemaining <= 30
      if (membership.start_date) {
        const start = new Date(membership.start_date)
        const totalDuration = end.getTime() - start.getTime()
        const elapsed = now.getTime() - start.getTime()
        if (totalDuration > 0) {
          validityPercent = Math.max(0, Math.min(100, Math.round(((totalDuration - elapsed) / totalDuration) * 100)))
        }
      }
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-8 space-y-6 sm:space-y-8 font-sans">
      {/* Toast Alert */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccess}</span>
          </div>
          <button onClick={() => setSaveSuccess('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{saveError}</span>
          </div>
          <button onClick={() => setSaveError('')} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Profile Header */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#1B4D2E] via-[#143B23] to-[#0A1F13] text-white p-6 sm:p-8 shadow-xl overflow-hidden border border-emerald-900/40">
        {/* Decorative backdrop shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-[#1B4D2E] font-black text-3xl sm:text-4xl flex items-center justify-center shadow-lg border-2 border-white/20">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-emerald-800 border border-emerald-600 text-white shadow-xs">
                {isMemberRole ? <Award className="w-4 h-4 text-amber-300" /> : <Briefcase className="w-4 h-4 text-emerald-300" />}
              </div>
            </div>

            {/* Title & Identity */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {user?.name || 'Club Member'}
                </h1>
                {member?.member_code && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-200 border border-white/20 text-xs font-mono font-bold">
                    {member.member_code}
                  </span>
                )}
              </div>

              <p className="text-sm text-emerald-200/90 font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-300" /> {user?.email}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isMemberRole
                    ? (membership?.plan_name || 'Active Member')
                    : (employee?.title || user.role?.replace('_', ' ').toUpperCase() || 'Staff Member')}
                </span>

                <span className="text-xs text-white/70">
                  Member since {formatDate(member?.created_at || user?.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs bg-white text-[#1B4D2E] hover:bg-emerald-50"
            >
              {editMode ? (
                <>
                  <X className="w-4 h-4" /> Cancel Edit
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </>
              )}
            </button>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors border border-white/20"
              title="Change Password"
            >
              <KeyRound className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: MEMBERSHIP DETAILS & VALIDITY (FOR MEMBERS)
          ========================================================================= */}
      {isMemberRole && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#1B4D2E]">
                Subscription & Validity
              </span>
              <h2 className="text-xl font-bold text-slate-900">Active Membership Status</h2>
            </div>
            <Link
              to="/app/pass"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1B4D2E] hover:underline"
            >
              <QrCode className="w-4 h-4" /> View Digital Pass &rarr;
            </Link>
          </div>

          {membership ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Validity Spotlight Card */}
              <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/90 shadow-sm p-6 space-y-6 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Current Plan
                    </span>
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      {membership.plan_name || 'Champions Club Membership'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {membership.plan_description || 'Unlimited sports club privileges & priority reservations.'}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Expired
                      </span>
                    ) : isExpiringSoon ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> Expiring Soon
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active Membership
                      </span>
                    )}
                  </div>
                </div>

                {/* START DATE & END DATE (VALIDITY) HIGHLIGHT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F8FAF6] p-5 rounded-xl border border-emerald-900/10">
                  {/* Start Date */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <Calendar className="w-4 h-4 text-[#1B4D2E]" />
                      Membership Start Date
                    </div>
                    <p className="text-lg font-extrabold text-slate-900">
                      {formatDate(membership.start_date)}
                    </p>
                    <p className="text-[11px] text-slate-500">Official subscription activation date</p>
                  </div>

                  {/* End Date (Validity) */}
                  <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#C85A32] uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-[#C85A32]" />
                      End Date (Validity)
                    </div>
                    <p className="text-lg font-extrabold text-slate-900">
                      {formatDate(membership.end_date)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {validityDaysRemaining !== null && validityDaysRemaining >= 0 ? (
                        <span className="font-semibold text-emerald-700">
                          {validityDaysRemaining} days remaining in this cycle
                        </span>
                      ) : (
                        <span className="font-semibold text-rose-600">Validity period expired</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Validity Remaining Progress Bar */}
                {validityDaysRemaining !== null && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Membership Validity Progress
                      </span>
                      <span className="font-bold text-slate-800">
                        {isExpired ? '0 days remaining' : `${validityDaysRemaining} Days Left`}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isExpired
                            ? 'bg-rose-500 w-0'
                            : isExpiringSoon
                            ? 'bg-amber-500'
                            : 'bg-gradient-to-r from-[#1B4D2E] to-emerald-500'
                        }`}
                        style={{ width: `${validityPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Plan Perks Breakdown */}
                {membership.perks && Array.isArray(membership.perks) && membership.perks.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Included Privileges & Perks
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {membership.perks.map((perk, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          {perk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Member Discounts Snapshot */}
              <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-6 space-y-5 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm pb-3 border-b border-slate-100 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" /> Member Benefits & Discounts
                  </h4>

                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="py-3 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Court Booking Discount</span>
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {membership.court_discount_pct}% OFF
                      </span>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <span className="text-slate-600 font-medium flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-400" /> Pro-Shop Discount
                      </span>
                      <span className="font-extrabold text-[#C85A32] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                        {membership.shop_discount_pct}% OFF
                      </span>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <span className="text-slate-600 font-medium flex items-center gap-1.5">
                        <Coffee className="w-3.5 h-3.5 text-slate-400" /> Café Discount
                      </span>
                      <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {membership.bar_discount_pct}% OFF
                      </span>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Daily Court Limit</span>
                      <span className="font-bold text-slate-800">
                        {membership.max_bookings_per_day || 2} bookings/day
                      </span>
                    </div>

                    {membership.price_paid && (
                      <div className="py-3 flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Subscription Fee Paid</span>
                        <span className="font-extrabold text-slate-900">
                          {formatCurrency(membership.price_paid)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link to="/plans">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      Upgrade / Renew Membership
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* No Active Membership Card */
            <div className="p-8 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-amber-900">No Active Membership Subscription</h3>
                <p className="text-xs text-amber-700 max-w-md mx-auto">
                  You are registered as a club guest or your membership has expired. Choose a membership plan to unlock free court sessions, pro shop discounts, and café perks.
                </p>
              </div>
              <Link to="/plans">
                <Button variant="clay" size="sm" className="font-bold text-xs">
                  Browse Membership Plans
                </Button>
              </Link>
            </div>
          )}

          {/* Membership History Table (If available) */}
          {membershipHistory.length > 1 && (
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-6 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">Membership Subscription History</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Plan</th>
                      <th className="py-2.5 px-3">Start Date</th>
                      <th className="py-2.5 px-3">End Date</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {membershipHistory.map((m, idx) => (
                      <tr key={m.id || idx}>
                        <td className="py-3 px-3 font-bold text-slate-900">{m.plan_name || 'Standard'}</td>
                        <td className="py-3 px-3">{formatDate(m.start_date)}</td>
                        <td className="py-3 px-3">{formatDate(m.end_date)}</td>
                        <td className="py-3 px-3">{m.price_paid ? formatCurrency(m.price_paid) : '-'}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              m.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 2: STAFF & EMPLOYEE DETAILS (FOR STAFF / OWNER)
          ========================================================================= */}
      {isStaffOrOwner && (
        <div className="space-y-6">
          <div className="space-y-0.5">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#1B4D2E]">
              Human Resources & Operations
            </span>
            <h2 className="text-xl font-bold text-slate-900">Staff Official Records</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Employment Record Card */}
            <div className="md:col-span-2 rounded-2xl bg-white border border-slate-200/90 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Staff Designation
                  </span>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    {employee?.title || user.role?.replace('_', ' ').toUpperCase() || 'Operations Staff'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    The Champions Club Official Staff Roster
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {employee?.status || 'Active'}
                </span>
              </div>

              {/* Official Staff Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#F8FAF6] p-4 rounded-xl border border-slate-200/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <Building className="w-4 h-4 text-[#1B4D2E]" /> Department
                  </div>
                  <p className="text-sm font-bold text-slate-900 capitalize">
                    {user.role === 'owner' ? 'Club Leadership' : user.role?.replace('_', ' ') || 'Operations'}
                  </p>
                </div>

                <div className="bg-[#F8FAF6] p-4 rounded-xl border border-slate-200/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <Calendar className="w-4 h-4 text-[#1B4D2E]" /> Date of Joining
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {employee?.joined_on ? formatDate(employee.joined_on) : formatDate(user.created_at)}
                  </p>
                </div>

                <div className="bg-[#F8FAF6] p-4 rounded-xl border border-slate-200/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> Base Remuneration
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {employee?.base_salary ? `${formatCurrency(employee.base_salary)} / mo` : 'Executive Remuneration'}
                  </p>
                </div>
              </div>

              {/* Operational Responsibilities */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Authorized Console Access & Privileges
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Real-time Court Roster & Reservations</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Counter & Pro-Shop POS Checkout</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Café & Beverage Inventory Management</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Member Directory & Attendance Ledger</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Operations Shortcuts */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#1B4D2E]" /> Shift & Roster Shortcuts
                </h4>
                <div className="space-y-2">
                  <Link
                    to={user.role === 'owner' ? '/owner/shifts' : '/staff/shifts'}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 transition-colors border border-slate-200/60"
                  >
                    <span>View Scheduled Shifts</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </Link>

                  <Link
                    to={user.role === 'owner' ? '/owner/leave' : '/staff/leave'}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 transition-colors border border-slate-200/60"
                  >
                    <span>My Leave Requests</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </Link>

                  <Link
                    to="/staff/pos"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 transition-colors border border-slate-200/60"
                  >
                    <span>Launch Counter POS</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 space-y-1">
                <span className="font-bold block flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Staff ID: {employee?.id?.slice(0, 8) || user.id?.slice(0, 8)}
                </span>
                <p className="text-amber-700">Official verified credentials registered with club administration.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 3: PERSONAL INFORMATION & EDIT PROFILE
          ========================================================================= */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
            <p className="text-xs text-slate-500">Contact details and emergency identification records.</p>
          </div>

          {!editMode && (
            <Button
              variant="outline"
              size="sm"
              icon={Edit3}
              onClick={() => setEditMode(true)}
              className="text-xs"
            >
              Edit Details
            </Button>
          )}
        </div>

        {editMode ? (
          /* EDIT FORM */
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <Input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Arun Kumar"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Email (Cannot be changed)
                </label>
                <Input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="bg-slate-100 cursor-not-allowed opacity-80"
                />
              </div>

              {isMemberRole && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Residential Address
                </label>
                <Input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, locality, city, pincode"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Emergency Contact (Name & Number)
                </label>
                <Input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="e.g. Priya Sharma (+91 98765 00000)"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditMode(false)}
                disabled={saveLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="lawn"
                size="sm"
                icon={Save}
                loading={saveLoading}
                className="font-bold text-xs"
              >
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          /* READ-ONLY VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1">
              <p className="font-semibold text-slate-400 uppercase tracking-wider">Full Legal Name</p>
              <p className="text-sm font-bold text-slate-900">{user?.name || '-'}</p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-slate-400 uppercase tracking-wider">Registered Email</p>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {user?.email || '-'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-slate-400 uppercase tracking-wider">Phone Number</p>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {user?.phone || member?.phone || '-'}
              </p>
            </div>

            {isMemberRole && (
              <div className="space-y-1">
                <p className="font-semibold text-slate-400 uppercase tracking-wider">Date of Birth</p>
                <p className="text-sm font-bold text-slate-900">
                  {member?.dob ? formatDate(member.dob) : 'Not specified'}
                </p>
              </div>
            )}

            <div className="space-y-1 sm:col-span-2">
              <p className="font-semibold text-slate-400 uppercase tracking-wider">Address</p>
              <p className="text-sm font-medium text-slate-800 flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                {member?.address || 'No residential address on file. Click Edit Details to add.'}
              </p>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <p className="font-semibold text-slate-400 uppercase tracking-wider">Emergency Contact</p>
              <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-rose-500 shrink-0" />
                {member?.emergency_contact || 'None registered. Click Edit Details to add emergency contact.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          CHANGE PASSWORD MODAL
          ========================================================================= */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#1B4D2E]" /> Change Account Password
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pwdMessage.text && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  pwdMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {pwdMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Current Password
                </label>
                <Input
                  type="password"
                  required
                  value={pwdCurrent}
                  onChange={(e) => setPwdCurrent(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <Input
                  type="password"
                  required
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  required
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={pwdLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="lawn"
                  size="sm"
                  loading={pwdLoading}
                  className="font-bold text-xs"
                >
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
