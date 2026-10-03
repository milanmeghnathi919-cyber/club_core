import React from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { clearCredentials } from '@/feature/auth/slices/authSlice'
import authService from '@/service/authService'
import MemberQuickSearch from '@/components/common/MemberQuickSearch'
import RoleSwitcher from '@/components/common/RoleSwitcher'
import {
  Trophy,
  Calendar,
  Users,
  ShoppingBag,
  Package,
  ListOrdered,
  Wine,
  UserPlus,
  Clock,
  LogOut,
  Sparkles,
  ClipboardList,
} from 'lucide-react'
import Button from '@/components/ui/Button'

export const StaffLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)

  const handleLogout = async () => {
    await authService.logout()
    dispatch(clearCredentials())
    navigate('/login')
  }

  const staffNav = [
    { label: 'Court Schedule', path: '/staff/bookings', icon: Calendar },
    { label: 'Members CRM', path: '/staff/members', icon: Users },
    { label: 'Counter POS', path: '/staff/pos', icon: ShoppingBag },
    { label: 'Bar & Tabs POS', path: '/staff/bar', icon: Wine },
    { label: 'Shop Inventory', path: '/staff/products', icon: Package },
    { label: 'Shop Orders', path: '/staff/orders', icon: ListOrdered },
    { label: 'Leads Pipeline', path: '/staff/leads', icon: Sparkles },
    { label: 'Friday Social', path: '/staff/social', icon: Users },
    { label: 'Staff Shifts', path: '/staff/shifts', icon: Clock },
    { label: 'My Leave', path: '/staff/leave', icon: ClipboardList },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAF6] text-slate-900 flex font-sans">
      {/* Sidebar (Desktop / Tablet) */}
      <aside className="w-64 bg-slate-950 text-white shrink-0 hidden lg:flex flex-col border-r border-slate-800">
        {/* Brand */}
        <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1B4D2E] flex items-center justify-center text-white">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm leading-tight text-white tracking-tight">
              THE CHAMPIONS CLUB
            </h2>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Staff Console
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {staffNav.map((item) => {
            const active = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#1B4D2E] text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Staff User Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-900 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Staff'}</p>
              <p className="text-[10px] text-emerald-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Member Quick Search with Ctrl+K */}
          <div className="flex-1 max-w-md">
            <MemberQuickSearch />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <Link to="/staff/members/new">
              <Button variant="lawn" size="sm" icon={UserPlus} className="text-xs">
                New Member
              </Button>
            </Link>

            {/* Mobile / Tablet Logout */}
            <button
              onClick={handleLogout}
              className="lg:hidden p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tablet / Mobile Navigation Strip */}
        <div className="lg:hidden bg-slate-900 text-white px-3 py-2 overflow-x-auto flex items-center gap-2 border-b border-slate-800">
          {staffNav.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active ? 'bg-[#1B4D2E] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Viewport Outlet */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Presenter Widget */}
      <RoleSwitcher />
    </div>
  )
}

export default StaffLayout
