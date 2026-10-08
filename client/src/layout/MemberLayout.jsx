import React from 'react'
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { clearCredentials } from '@/feature/auth/slices/authSlice'
import { toggleCartDrawer } from '@/feature/shop/cartSlice'
import authService from '@/service/authService'
import CartDrawer from '@/components/common/CartDrawer'
import RoleSwitcher from '@/components/common/RoleSwitcher'
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
  const cartItems = useSelector((state) => state.cart.items)

  // Route Protection Guard
  if (!user) {
    return <Navigate to="/login?redirect=/app" replace />
  }
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
    <div className="min-h-screen bg-[#090B0E] text-white flex flex-col font-sans pb-16 md:pb-0 selection:bg-[#CCFF00] selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0E1217]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/app" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30 flex items-center justify-center shadow-md shadow-[#CCFF00]/20 group-hover:scale-105 transition-transform">
                <Trophy className="w-5 h-5 text-[#CCFF00]" />
              </div>
              <div className="hidden sm:block">
                <span className="font-black text-sm sm:text-base text-white block leading-tight tracking-tight font-display">
                  THE CHAMPIONS CLUB
                </span>
                <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest block">
                  Member Portal
                </span>
              </div>
            </Link>

            {/* Member Identity Badge */}
            <Link
              to="/app/profile"
              className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-white/10 hover:opacity-85 transition-opacity"
              title="View Profile & Membership Validity"
            >
              <div className="w-7 h-7 rounded-full bg-[#CCFF00]/20 text-[#CCFF00] font-extrabold text-xs flex items-center justify-center border border-[#CCFF00]/40">
                {user?.name?.charAt(0)?.toUpperCase() || 'M'}
              </div>
              <span className="text-xs font-bold text-white">{user?.name || 'Member'}</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-[#CCFF00] border border-[#CCFF00]/30 flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3 h-3 text-[#CCFF00]" /> Member
              </span>
            </Link>
          </div>

          {/* Right Header CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => dispatch(toggleCartDrawer(true))}
              className="relative p-2 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Equipment Bag"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#CCFF00] text-black text-[10px] font-black flex items-center justify-center shadow-md shadow-[#CCFF00]/30">
                  {cartCount}
                </span>
              )}
            </button>

            <Link
              to="/app/profile"
              className="p-2 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
              title="My Profile & Membership Validity"
            >
              <User className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop sub-navigation bar */}
        <div className="hidden md:block border-t border-white/10 bg-[#12161F]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1.5 py-1.5">
            {navItems.map((item) => {
              const active = location.pathname === item.path
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-[#CCFF00] text-black font-black shadow-md shadow-[#CCFF00]/25'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E1217]/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around py-2 px-1 shadow-2xl">
        {navItems.map((item) => {
          const active = location.pathname === item.path
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
                active ? 'text-[#CCFF00]' : 'text-slate-500 hover:text-slate-300'
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
      <RoleSwitcher />
    </div>
  )
}

export default MemberLayout
