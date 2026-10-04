import React from 'react'
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { clearCredentials } from '@/feature/auth/slices/authSlice'
import { toggleCartDrawer } from '@/feature/shop/cartSlice'
import authService from '@/service/authService'
import CartDrawer from '@/components/common/CartDrawer'
import {
  Trophy,
  Calendar,
  Clock,
  Coffee,
  Users,
  ShoppingBag,
  CreditCard,
  LogOut,
  ChevronRight,
  ShieldCheck,
  User,
} from 'lucide-react'

export const MemberLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)

  // Route Protection Guard
  if (!user) {
    return <Navigate to="/login?redirect=/app" replace />
  }
  const cartItems = useSelector((state) => state.cart.items)
  const cartCount = cartItems.reduce((acc, curr) => acc + curr.qty, 0)

  const handleLogout = async () => {
    await authService.logout()
    dispatch(clearCredentials())
    navigate('/login')
  }

  const navItems = [
    { label: 'Overview', path: '/app', icon: Trophy },
    { label: 'Book Court', path: '/app/book', icon: Calendar },
    { label: 'My Bookings', path: '/app/bookings', icon: Clock },
    { label: 'Club Café', path: '/app/cafe', icon: Coffee },
    { label: 'Pro Shop', path: '/app/shop', icon: ShoppingBag },
    { label: 'Digital Pass', path: '/app/pass', icon: CreditCard },
    { label: 'My Profile', path: '/app/profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAF6] text-slate-900 flex flex-col font-sans pb-16 md:pb-0">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/app" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1B4D2E] to-[#12351F] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div className="hidden sm:block">
                <span className="font-extrabold text-sm sm:text-base text-slate-950 block leading-tight tracking-tight">
                  THE CHAMPIONS CLUB
                </span>
                <span className="text-[10px] font-bold text-[#1B4D2E] uppercase tracking-widest block">
                  Member Portal
                </span>
              </div>
            </Link>

            {/* Member Identity Badge */}
            <Link
              to="/app/profile"
              className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-slate-200 hover:opacity-85 transition-opacity"
              title="View Profile & Membership Validity"
            >
              <div className="w-7 h-7 rounded-full bg-[#1B4D2E]/10 text-[#1B4D2E] font-bold text-xs flex items-center justify-center border border-[#1B4D2E]/20">
                {user?.name?.charAt(0)?.toUpperCase() || 'M'}
              </div>
              <span className="text-xs font-bold text-slate-800">{user?.name || 'Member'}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/90 flex items-center gap-1 shadow-2xs">
                <ShieldCheck className="w-3 h-3 text-amber-600" /> Member Profile
              </span>
            </Link>
          </div>

          {/* Right Header CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => dispatch(toggleCartDrawer(true))}
              className="relative p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="Equipment Bag"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#C85A32] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            <Link
              to="/app/profile"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="My Profile & Membership Validity"
            >
              <User className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop sub-navigation bar */}
        <div className="hidden md:block border-t border-slate-100 bg-slate-50/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1.5 py-1.5">
            {navItems.map((item) => {
              const active = location.pathname === item.path
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[#1B4D2E] text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main Member Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar (Wimbledon Touch Standard) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around py-2 px-1 shadow-lg">
        {navItems.map((item) => {
          const active = location.pathname === item.path
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
                active ? 'text-[#1B4D2E]' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          )
        })}
      </nav>

      {/* Global Overlays */}
      <CartDrawer />
    </div>
  )
}

export default MemberLayout
