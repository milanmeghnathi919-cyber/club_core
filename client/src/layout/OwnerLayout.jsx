import React from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { clearCredentials } from '@/feature/auth/slices/authSlice'
import authService from '@/service/authService'
import MemberQuickSearch from '@/components/common/MemberQuickSearch'
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
    { label: 'Payroll Runs', path: '/owner/payroll', icon: Users2 },
    { label: 'Employee Staff', path: '/owner/employees', icon: Users2 },
    { label: 'Café Inventory', path: '/owner/cafe-inventory', icon: Coffee },
    { label: 'Shift Roster', path: '/owner/shifts', icon: CalendarCheck },
    { label: 'Leave Requests', path: '/owner/leave', icon: ClipboardList },
    { label: 'Club Settings', path: '/owner/settings', icon: Sliders },
    { label: 'Executive Profile', path: '/owner/profile', icon: UserCheck },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAF6] text-slate-900 flex font-sans">
      {/* Executive Dark Sidebar */}
      <aside className="w-64 bg-[#090D16] text-white shrink-0 hidden lg:flex flex-col border-r border-slate-800">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm leading-tight text-white tracking-tight">
                CHAMPIONS CLUB
              </h2>
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            )
          })}

          <div className="pt-3 mt-3 border-t border-white/10">
            <Link
              to="/staff"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <span>Staff Operations Console</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
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
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-500/30 shrink-0">
              {user?.name?.slice(0, 2)?.toUpperCase() || 'RS'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Club Owner'}</p>
              <p className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">Club Owner</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <MemberQuickSearch placeholder="Quick member lookup across ledger..." />
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Single Ledger
            </span>

            <Link
              to="/owner/profile"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="Executive Profile"
            >
              <UserCheck className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLogout}
              className="lg:hidden p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tablet / Mobile Navigation Strip */}
        <div className="lg:hidden bg-[#090D16] text-white px-3 py-2 overflow-x-auto flex items-center gap-2 border-b border-slate-800">
          {ownerNav.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
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
      </div>
    </div>
  )
}

export default OwnerLayout
