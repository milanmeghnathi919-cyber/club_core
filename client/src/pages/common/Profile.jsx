import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { setCredentials } from '@/feature/auth/slices/authSlice'
import authService from '@/service/authService'
import { formatDate, formatCurrency } from '@/utils/format'
import {
  getStaffDepartment,
  getDepartmentHome,
  getDepartmentTitle,
} from '@/utils/staffRoles'
import Button from '@/components/ui/Button'
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
  Utensils,
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
  BarChart3,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  Users2,
  Users,
  Package,
  ListOrdered,
  CalendarCheck,
  ClipboardList,
  Sliders,
  ArrowRight,
  LayoutDashboard,
  Trophy,
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
        <div className="h-44 bg-white/5 rounded-3xl animate-pulse border border-white/10" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-white/5 rounded-2xl animate-pulse border border-white/10" />
          <div className="md:col-span-2 h-64 bg-white/5 rounded-2xl animate-pulse border border-white/10" />
        </div>
      </div>
    )
  }

  const user = profileData?.user || currentUser || {}
  const member = profileData?.member
  const membership = profileData?.membership
  const membershipHistory = profileData?.membershipHistory || []
  const employee = profileData?.employee

  // Role Checks: strictly differentiate Owner vs Staff vs Member
  const isOwner = user.role === 'owner'
  const isStaff = !isOwner && user.role && user.role !== 'member'
  const isMember = !isOwner && !isStaff
  const staffDept = getStaffDepartment(user)

  // Calculate validity days (only relevant for Member)
  let validityDaysRemaining = null
  let validityPercent = 100
  let isExpired = false
  let isExpiringSoon = false

  if (isMember && membership?.end_date) {
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
        <div className="p-4 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/40 text-[#CCFF00] text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#CCFF00] shrink-0" />
            <span className="font-bold">{saveSuccess}</span>
          </div>
          <button onClick={() => setSaveSuccess('')} className="text-[#CCFF00] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-400 text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-bold">{saveError}</span>
          </div>
          <button onClick={() => setSaveError('')} className="text-rose-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          HERO PROFILE HEADER (CYBER VOLT ATHLETIC BADGE)
          ========================================================================= */}
      <div className="relative rounded-3xl bg-[#111418] border border-white/10 p-6 sm:p-8 shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Glow shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#CCFF00]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-[#CCFF00]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl font-black text-3xl sm:text-4xl flex items-center justify-center shadow-xl border-2 border-[#CCFF00]/40 bg-gradient-to-tr from-[#161a22] to-[#202733] text-[#CCFF00] group-hover:scale-105 transition-transform duration-300">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'CC'}
              </div>
              <div className="absolute -bottom-2 -right-2 p-1.5 rounded-xl border border-[#CCFF00]/40 bg-[#CCFF00] text-black shadow-md">
                {isOwner ? (
                  <Trophy className="w-4 h-4 text-black" />
                ) : isStaff ? (
                  <Briefcase className="w-4 h-4 text-black" />
                ) : (
                  <Award className="w-4 h-4 text-black" />
                )}
              </div>
            </div>

            {/* Title & Identity */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
                  {user?.name || (isOwner ? 'Rajesh Sharma' : 'Staff Member')}
                </h1>
                {isMember && member?.member_code && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#CCFF00] border border-[#CCFF00]/30 text-xs font-mono font-bold">
                    {member.member_code}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#CCFF00]" /> {user?.email}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {isOwner ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> Club Owner & Executive
                  </span>
                ) : isStaff ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30">
                    <Briefcase className="w-3.5 h-3.5" />
                    {employee?.title || user.role?.replace('_', ' ').toUpperCase() || 'Staff Operations'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {membership?.plan_name || 'Active Member'}
                  </span>
                )}

                <span className="text-xs text-slate-400">
                  {isOwner || isStaff ? 'Onboarded on' : 'Member since'}{' '}
                  {formatDate(employee?.joined_on || member?.created_at || user?.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs in Header */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
              title="Change Password"
            >
              <KeyRound className="w-4 h-4 text-[#CCFF00]" />
              <span>Security</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION: OWNER EXECUTIVE DASHBOARD ACCESS & PORTAL (ONLY FOR OWNER)
          ========================================================================= */}
      {isOwner && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#111418] border border-white/10 p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#CCFF00]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#CCFF00]">
                  <ShieldCheck className="w-4 h-4 text-[#CCFF00]" /> Club Owner Executive Hub
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">Owner Executive Dashboard</h2>
                <p className="text-xs text-slate-400 max-w-xl">
                  You are logged in with Owner executive rights. Access real-time revenue analytics, invoices, single ledger reconciliation, staff payroll, and club administration.
                </p>
              </div>

              <Link to="/owner" className="shrink-0">
                <Button
                  variant="volt"
                  size="md"
                  icon={BarChart3}
                  className="font-black text-xs px-6 py-2.5"
                >
                  Access Owner Dashboard &rarr;
                </Button>
              </Link>
            </div>

            {/* Executive Tools Shortcuts Grid */}
            <div className="relative z-10 space-y-3">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Direct Executive Console Tools
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <Link
                  to="/owner"
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                >
                  <BarChart3 className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold uppercase text-white">Executive Analytics</p>
                  <p className="text-[10px] text-slate-400">Revenue & KPI Trends</p>
                </Link>

                <Link
                  to="/owner/invoices"
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                >
                  <Receipt className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold uppercase text-white">Invoices & Billing</p>
                  <p className="text-[10px] text-slate-400">Single ledger billing</p>
                </Link>

                <Link
                  to="/owner/expenses"
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                >
                  <CreditCard className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold uppercase text-white">Expenses & Payables</p>
                  <p className="text-[10px] text-slate-400">Vendor disbursements</p>
                </Link>

                <Link
                  to="/owner/tax"
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                >
                  <FileSpreadsheet className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold uppercase text-white">Tax & GST Reports</p>
                  <p className="text-[10px] text-slate-400">Statutory tax summaries</p>
                </Link>

                <Link
                  to="/owner/payroll"
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                >
                  <Users2 className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold uppercase text-white">Payroll Runs</p>
                  <p className="text-[10px] text-slate-400">Staff salary disbursements</p>
                </Link>

                <Link
                  to="/owner/employees"
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                >
                  <Users className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold uppercase text-white">Employee Staff</p>
                  <p className="text-[10px] text-slate-400">Roster & staff directory</p>
                </Link>

                <Link
                  to="/owner/cafe-inventory"
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                >
                  <Coffee className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold uppercase text-white">Café Inventory</p>
                  <p className="text-[10px] text-slate-400">Stock & replenishment</p>
                </Link>

                <Link
                  to="/owner/settings"
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                >
                  <Sliders className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold uppercase text-white">Club Settings</p>
                  <p className="text-[10px] text-slate-400">Pricing & configuration</p>
                </Link>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-white/10">
              <span>Looking for front-line operations?</span>
              <Link
                to="/staff"
                className="text-[#CCFF00] hover:underline font-bold inline-flex items-center gap-1"
              >
                Switch to Staff Operations Console &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION: STAFF OPERATIONS DASHBOARD ACCESS & PORTAL (ONLY FOR STAFF)
          ========================================================================= */}
      {isStaff && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#111418] border border-white/10 p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#CCFF00]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#CCFF00]">
                  <Briefcase className="w-4 h-4 text-[#CCFF00]" /> {getDepartmentTitle(staffDept)}
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                  {staffDept === 'shop'
                    ? 'Pro Shop Operations Hub'
                    : staffDept === 'cafe'
                    ? 'Club Café & Bar Operations Hub'
                    : 'Court Operations Dashboard'}
                </h2>
                <p className="text-xs text-slate-400 max-w-xl">
                  {staffDept === 'shop'
                    ? 'Authorized Pro Shop staff console. Manage shop inventory, catalog items, customer orders, and counter POS sales.'
                    : staffDept === 'cafe'
                    ? 'Authorized Club Café staff console. Manage café inventory, ingredient stock levels, POS order tabs, and kitchen queue.'
                    : 'Authorized Court staff console. Manage court schedules, reservations, member check-ins, and leads pipeline.'}
                </p>
              </div>

              <Link to={getDepartmentHome(staffDept)} className="shrink-0">
                <Button
                  variant="volt"
                  size="md"
                  icon={LayoutDashboard}
                  className="font-black text-xs px-6 py-2.5"
                >
                  {staffDept === 'shop'
                    ? 'Access Shop Inventory →'
                    : staffDept === 'cafe'
                    ? 'Access Café Inventory →'
                    : 'Access Court Schedule →'}
                </Button>
              </Link>
            </div>

            {/* Staff Operations Shortcuts Grid - Tailored to Department */}
            <div className="relative z-10 space-y-3">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Authorized Department Shortcuts
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* 1. COURT STAFF SHORTCUTS */}
                {staffDept === 'court' && (
                  <>
                    <Link
                      to="/staff/bookings"
                      className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                    >
                      <Calendar className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold uppercase text-white">Court Schedule</p>
                      <p className="text-[10px] text-slate-400">Daily slot allocations</p>
                    </Link>

                    <Link
                      to="/staff/members"
                      className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                    >
                      <Users className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold uppercase text-white">Members CRM</p>
                      <p className="text-[10px] text-slate-400">Search & member profiles</p>
                    </Link>

                    <Link
                      to="/staff/members/new"
                      className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                    >
                      <CheckCircle2 className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold uppercase text-white">New Member</p>
                      <p className="text-[10px] text-slate-400">Onboard walk-in member</p>
                    </Link>

                    <Link
                      to="/staff/leads"
                      className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                    >
                      <Sparkles className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold uppercase text-white">Leads Pipeline</p>
                      <p className="text-[10px] text-slate-400">Inbound trial leads</p>
                    </Link>

                    <Link
                      to="/staff/social"
                      className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                    >
                      <Users className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold uppercase text-white">Friday Social</p>
                      <p className="text-[10px] text-slate-400">Mixer & tournament list</p>
                    </Link>
                  </>
                )}

                {/* 2. SHOP STAFF SHORTCUTS */}
                {staffDept === 'shop' && (
                  <>
                    <Link
                      to="/staff/products"
                      className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                    >
                      <Package className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold uppercase text-white">Shop Inventory</p>
                      <p className="text-[10px] text-slate-400">Catalog & stock levels</p>
                    </Link>

                    <Link
                      to="/staff/orders"
                      className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                    >
                      <ListOrdered className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold uppercase text-white">Shop Orders</p>
                      <p className="text-[10px] text-slate-400">Member order fulfillment</p>
                    </Link>

                    <Link
                      to="/staff/pos"
                      className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                    >
                      <ShoppingBag className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold uppercase text-white">Counter POS</p>
                      <p className="text-[10px] text-slate-400">Quick shop checkout</p>
                    </Link>
                  </>
                )}

                {/* 3. CAFÉ STAFF SHORTCUTS */}
                {staffDept === 'cafe' && (
                  <>
                    <Link
                      to="/staff/cafe/inventory"
                      className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                    >
                      <Utensils className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold uppercase text-white">Café Inventory</p>
                      <p className="text-[10px] text-slate-400">Stock & replenishment</p>
                    </Link>

                    <Link
                      to="/staff/cafe/pos"
                      className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                    >
                      <Coffee className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold uppercase text-white">Café POS & Tabs</p>
                      <p className="text-[10px] text-slate-400">Order taking & bills</p>
                    </Link>

                    <Link
                      to="/staff/cafe/kitchen"
                      className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                    >
                      <Coffee className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold uppercase text-white">Kitchen Display</p>
                      <p className="text-[10px] text-slate-400">Live order tickets</p>
                    </Link>

                    <Link
                      to="/staff/cafe/summary"
                      className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                    >
                      <Utensils className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold uppercase text-white">Daily Summary</p>
                      <p className="text-[10px] text-slate-400">End-of-day report</p>
                    </Link>
                  </>
                )}

                {/* UNIVERSAL STAFF SHORTCUTS */}
                <Link
                  to="/staff/shifts"
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                >
                  <Clock className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold uppercase text-white">Staff Shifts</p>
                  <p className="text-[10px] text-slate-400">Assigned shift roster</p>
                </Link>

                <Link
                  to="/staff/leave"
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300 group block space-y-1.5"
                >
                  <ClipboardList className="w-5 h-5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold uppercase text-white">My Leave</p>
                  <p className="text-[10px] text-slate-400">Apply for time off</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION: STAFF / EMPLOYEE OFFICIAL RECORD (FOR OWNER & STAFF ONLY)
          ========================================================================= */}
      {(isOwner || isStaff) && (
        <div className="space-y-4">
          <div className="space-y-0.5">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#CCFF00]">
              Employment Record
            </span>
            <h2 className="text-xl font-black uppercase tracking-tight text-white">Official HR & Staff Details</h2>
          </div>

          <div className="rounded-3xl bg-[#111418] border border-white/10 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Official Designation
                </span>
                <h3 className="text-xl font-black uppercase text-white flex items-center gap-2">
                  {employee?.title || (isOwner ? 'Club Owner & Executive' : user.role?.replace('_', ' ').toUpperCase())}
                </h3>
                <p className="text-xs text-slate-400">
                  Registered employee record with The Champions Club administration.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30">
                <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
                {employee?.status || 'Active'}
              </span>
            </div>

            {/* Official Staff Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Building className="w-4 h-4 text-[#CCFF00]" /> Department
                </div>
                <p className="text-sm font-bold text-white capitalize">
                  {isOwner ? 'Executive Management' : user.role?.replace('_', ' ') || 'Operations'}
                </p>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-[#CCFF00]" /> Date of Joining
                </div>
                <p className="text-sm font-bold text-white">
                  {employee?.joined_on ? formatDate(employee.joined_on) : formatDate(user.created_at)}
                </p>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <DollarSign className="w-4 h-4 text-[#CCFF00]" /> Base Remuneration
                </div>
                <p className="text-sm font-bold font-mono text-[#CCFF00]">
                  {employee?.base_salary ? `${formatCurrency(employee.base_salary)} / mo` : 'Executive Remuneration'}
                </p>
              </div>
            </div>

            {/* Staff ID code */}
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-slate-400 flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#CCFF00]" /> Official Employee ID:
              </span>
              <span className="font-mono font-bold text-[#CCFF00]">
                {employee?.id || user.id}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION: MEMBERSHIP DETAILS & VALIDITY (FOR MEMBERS ONLY)
          ========================================================================= */}
      {isMember && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#CCFF00]">
                Subscription & Validity
              </span>
              <h2 className="text-xl font-black uppercase tracking-tight text-white">Active Membership Status</h2>
            </div>
            <Link
              to="/app/pass"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#CCFF00] hover:underline"
            >
              <QrCode className="w-4 h-4" /> View Digital Pass &rarr;
            </Link>
          </div>

          {membership ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Validity Spotlight Card */}
              <div className="lg:col-span-2 rounded-3xl bg-[#111418] border border-white/10 p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Current Plan
                    </span>
                    <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                      {membership.plan_name || 'Champions Club Membership'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {membership.plan_description || 'Unlimited sports club privileges & priority reservations.'}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Expired
                      </span>
                    ) : isExpiringSoon ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Expiring Soon
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#CCFF00]" /> Active Membership
                      </span>
                    )}
                  </div>
                </div>

                {/* START DATE & END DATE HIGHLIGHT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 p-5 rounded-2xl border border-white/10">
                  {/* Start Date */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Calendar className="w-4 h-4 text-[#CCFF00]" />
                      Membership Start Date
                    </div>
                    <p className="text-lg font-black text-white">
                      {formatDate(membership.start_date)}
                    </p>
                    <p className="text-[11px] text-slate-400">Official subscription activation date</p>
                  </div>

                  {/* End Date (Validity) */}
                  <div className="space-y-1 sm:border-l sm:border-white/10 sm:pl-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#CCFF00] uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-[#CCFF00]" />
                      End Date (Validity)
                    </div>
                    <p className="text-lg font-black text-white">
                      {formatDate(membership.end_date)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {validityDaysRemaining !== null && validityDaysRemaining >= 0 ? (
                        <span className="font-semibold text-[#CCFF00]">
                          {validityDaysRemaining} days remaining in this cycle
                        </span>
                      ) : (
                        <span className="font-semibold text-rose-400">Validity period expired</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Validity Remaining Progress Bar */}
                {validityDaysRemaining !== null && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#CCFF00]" /> Membership Validity Progress
                      </span>
                      <span className="font-bold font-mono text-[#CCFF00]">
                        {isExpired ? '0 days remaining' : `${validityDaysRemaining} Days Left`}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden border border-white/10">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isExpired
                            ? 'bg-rose-500 w-0'
                            : isExpiringSoon
                            ? 'bg-amber-400'
                            : 'bg-[#CCFF00]'
                        }`}
                        style={{ width: `${validityPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Plan Perks Breakdown */}
                {membership.perks && Array.isArray(membership.perks) && membership.perks.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Included Privileges & Perks
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {membership.perks.map((perk, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30"
                        >
                          <Check className="w-3.5 h-3.5 text-[#CCFF00]" />
                          {perk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Member Discounts Snapshot */}
              <div className="rounded-3xl bg-[#111418] border border-white/10 p-6 space-y-5 flex flex-col justify-between shadow-2xl">
                <div>
                  <h4 className="font-black uppercase tracking-tight text-white text-sm pb-3 border-b border-white/10 flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#CCFF00]" /> Member Benefits & Discounts
                  </h4>

                  <div className="divide-y divide-white/10 text-xs">
                    <div className="py-3 flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Court Booking Discount</span>
                      <span className="font-black text-[#CCFF00] bg-[#CCFF00]/10 px-2.5 py-0.5 rounded-full border border-[#CCFF00]/30">
                        {membership.court_discount_pct}% OFF
                      </span>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-400" /> Pro-Shop Discount
                      </span>
                      <span className="font-black text-[#CCFF00] bg-[#CCFF00]/10 px-2.5 py-0.5 rounded-full border border-[#CCFF00]/30">
                        {membership.shop_discount_pct}% OFF
                      </span>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <Coffee className="w-3.5 h-3.5 text-slate-400" /> Café Discount
                      </span>
                      <span className="font-black text-[#CCFF00] bg-[#CCFF00]/10 px-2.5 py-0.5 rounded-full border border-[#CCFF00]/30">
                        {membership.bar_discount_pct}% OFF
                      </span>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Daily Court Limit</span>
                      <span className="font-bold text-white">
                        {membership.max_bookings_per_day || 2} bookings/day
                      </span>
                    </div>

                    {membership.price_paid && (
                      <div className="py-3 flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Subscription Fee Paid</span>
                        <span className="font-mono font-bold text-white">
                          {formatCurrency(membership.price_paid)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <Link to="/plans">
                    <Button variant="volt" size="sm" className="w-full text-xs font-bold">
                      Upgrade / Renew Membership
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-[#111418] border border-white/10 text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-[#CCFF00]/10 text-[#CCFF00] flex items-center justify-center mx-auto border border-[#CCFF00]/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase text-white">No Active Membership Subscription</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  You are registered as a club guest or your membership has expired. Choose a membership plan to unlock free court sessions, pro shop discounts, and café perks.
                </p>
              </div>
              <Link to="/plans">
                <Button variant="volt" size="sm" className="font-black uppercase text-xs">
                  Browse Membership Plans
                </Button>
              </Link>
            </div>
          )}

          {/* Membership History Table */}
          {membershipHistory.length > 1 && (
            <div className="rounded-3xl bg-[#111418] border border-white/10 shadow-2xl p-6 space-y-4">
              <h4 className="font-black uppercase tracking-tight text-white text-sm">Membership Subscription History</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-slate-400 uppercase tracking-wider font-bold border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Plan</th>
                      <th className="py-3 px-4">Start Date</th>
                      <th className="py-3 px-4">End Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium text-slate-300">
                    {membershipHistory.map((m, idx) => (
                      <tr key={m.id || idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{m.plan_name || 'Standard'}</td>
                        <td className="py-3.5 px-4">{formatDate(m.start_date)}</td>
                        <td className="py-3.5 px-4">{formatDate(m.end_date)}</td>
                        <td className="py-3.5 px-4 font-mono">{m.price_paid ? formatCurrency(m.price_paid) : '-'}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              m.status === 'active'
                                ? 'bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30'
                                : 'bg-white/10 text-slate-400'
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
          SECTION: PERSONAL INFORMATION & EDIT PROFILE
          ========================================================================= */}
      <div className="rounded-3xl bg-[#111418] border border-white/10 shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-white">Personal Information</h3>
            <p className="text-xs text-slate-400">Contact details and identification records.</p>
          </div>

          {!editMode && (
            <Button
              variant="outline"
              size="sm"
              icon={Edit3}
              onClick={() => setEditMode(true)}
              className="text-xs font-bold uppercase"
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Official Email (Cannot be changed)
                </label>
                <Input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="bg-white/5 cursor-not-allowed opacity-60 text-slate-400"
                />
              </div>

              {isMember && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
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
                variant="volt"
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
              <p className="text-sm font-bold text-white">{user?.name || '-'}</p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-slate-400 uppercase tracking-wider">Registered Email</p>
              <p className="text-sm font-bold text-white flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#CCFF00]" /> {user?.email || '-'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-slate-400 uppercase tracking-wider">Phone Number</p>
              <p className="text-sm font-bold text-white flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#CCFF00]" /> {user?.phone || member?.phone || '-'}
              </p>
            </div>

            {isMember && (
              <div className="space-y-1">
                <p className="font-semibold text-slate-400 uppercase tracking-wider">Date of Birth</p>
                <p className="text-sm font-bold text-white">
                  {member?.dob ? formatDate(member.dob) : 'Not specified'}
                </p>
              </div>
            )}

            <div className="space-y-1 sm:col-span-2">
              <p className="font-semibold text-slate-400 uppercase tracking-wider">Address</p>
              <p className="text-sm font-medium text-slate-300 flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-[#CCFF00] shrink-0 mt-0.5" />
                {member?.address || 'No residential address on file. Click Edit Details to add.'}
              </p>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <p className="font-semibold text-slate-400 uppercase tracking-wider">Emergency Contact</p>
              <p className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-rose-400 shrink-0" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#111418] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-white/15 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-black uppercase tracking-tight text-white text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#CCFF00]" /> Change Account Password
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pwdMessage.text && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold ${
                  pwdMessage.type === 'success'
                    ? 'bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {pwdMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">
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
                <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">
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
                <label className="block font-bold text-slate-400 uppercase tracking-wider mb-1">
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
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
                  variant="volt"
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
