import React from 'react'
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { clearCredentials } from '@/feature/auth/slices/authSlice'
import authService from '@/service/authService'
import MemberQuickSearch from '@/components/common/MemberQuickSearch'
import RoleSwitcher from '@/components/common/RoleSwitcher'
import {
  Trophy,
  BarChart3,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  Users2,
  CalendarCheck,
  ClipboardList,
  Coffee,
  Sliders,
  LogOut,
  ExternalLink,
  ShieldAlert,
  UserCheck,
} from 'lucide-react'

export const OwnerLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)

  // Route Protection Guard
  if (!user) {
    return <Navigate to="/login?redirect=/owner" replace />
  }

  if (user.role !== 'owner') {
    return <Navigate to="/app" replace />
  }

  const handleLogout = async () => {
    await authService.logout()
    dispatch(clearCredentials())
    navigate('/login')
  }

  const ownerNav = [
    { label: 'Executive Analytics', path: '/owner', icon: BarChart3 },
    { label: 'Invoices & Billing', path: '/owner/invoices', icon: Receipt },
    { label: 'Expenses & Payables', path: '/owner/expenses', icon: CreditCard },
    { label: 'Tax & GST Reports', path: '/owner/tax', icon: FileSpreadsheet },
    { label: 'Employee Staff', path: '/owner/employees', icon: Users2 },
    { label: 'Café Inventory', path: '/owner/cafe-inventory', icon: Coffee },
    { label: 'Club Settings', path: '/owner/settings', icon: Sliders },
    { label: 'Executive Profile', path: '/owner/profile', icon: UserCheck },
  ]

  return (
    <div className="min-h-screen bg-[#090B0E] text-white flex font-sans selection:bg-[#CCFF00] selection:text-black">
      {/* Executive Dark Sidebar */}
      <aside className="w-64 bg-[#0B0E14] text-white shrink-0 hidden lg:flex flex-col border-r border-white/10 shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30 flex items-center justify-center font-black shadow-md shadow-[#CCFF00]/20">
              <Trophy className="w-5 h-5 text-[#CCFF00]" />
            </div>
            <div>
              <h2 className="font-black text-sm leading-tight text-white tracking-tight font-display">
                CHAMPIONS CLUB
              </h2>
              <p className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest">
                Owner Executive
              </p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {ownerNav.map((item) => {
            const active = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-[#CCFF00] text-black font-black shadow-md shadow-[#CCFF00]/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-black' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            )
          })}

          <div className="pt-3 mt-3 border-t border-white/10">
            <Link
              to="/staff/bookings"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-[#CCFF00] hover:bg-white/5 transition-colors"
            >
              <span>Staff Operations Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </nav>

        {/* Owner Profile Footer */}
        <div className="p-3 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <Link
            to="/owner/profile"
            className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
            title="View Executive Profile"
          >
            <div className="w-8 h-8 rounded-full bg-[#CCFF00]/20 text-[#CCFF00] font-black text-xs flex items-center justify-center border border-[#CCFF00]/30 shrink-0">
              {user?.name?.slice(0, 2)?.toUpperCase() || 'RS'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Club Owner'}</p>
              <p className="text-[10px] text-[#CCFF00] uppercase tracking-wider font-bold">Executive Owner</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-[#0E1217]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <MemberQuickSearch placeholder="Quick member lookup across ledger..." />
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" /> Live Single Ledger
            </span>

            <Link
              to="/owner/profile"
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors border border-white/10"
              title="Executive Profile"
            >
              <UserCheck className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLogout}
              className="lg:hidden p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-white/5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tablet / Mobile Navigation Strip */}
        <div className="lg:hidden bg-[#0B0E14] text-white px-3 py-2 overflow-x-auto flex items-center gap-2 border-b border-white/10">
          {ownerNav.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                  active ? 'bg-[#CCFF00] text-black font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
        <RoleSwitcher />
      </div>
    </div>
  )
}

export default OwnerLayout
