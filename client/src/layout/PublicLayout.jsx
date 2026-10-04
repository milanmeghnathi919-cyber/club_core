import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { toggleCartDrawer } from '@/feature/shop/cartSlice'
import CartDrawer from '@/components/common/CartDrawer'
import { Trophy, ShoppingBag, User, Calendar, MapPin, Phone, Mail, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'

export const PublicLayout = () => {
  const location = useLocation()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const cartItems = useSelector((state) => state.cart.items)

  const cartCount = cartItems.reduce((acc, curr) => acc + curr.qty, 0)

  const navLinks = [
    { label: 'Club & Sports', path: '/' },
    { label: 'Court Availability', path: '/availability' },
    { label: 'Membership Plans', path: '/plans' },
    { label: 'Pro Shop', path: '/shop' },
    { label: 'Book Trial / Contact', path: '/contact' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF6] text-slate-900 font-sans selection:bg-[#1B4D2E] selection:text-white">
      {/* Top Athletic Utility Bar */}
      <div className="bg-[#070B12] text-slate-300 text-xs py-2 px-4 sm:px-8 flex items-center justify-between border-b border-white/10 relative z-30">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Indiranagar, Bengaluru
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Open 06:00 – 22:00 Daily
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:flex items-center gap-1.5 text-slate-400">
            <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" /> +91 98765 43210
          </span>
          {user ? (
            <Link
              to={
                user.role === 'owner'
                  ? '/owner'
                  : user.role === 'member' || user.role === 'user'
                  ? '/app'
                  : user.role === 'shop_staff'
                  ? '/staff/products'
                  : user.role === 'cafe_staff' || user.role === 'bar_staff'
                  ? '/staff/cafe/inventory'
                  : '/staff/bookings'
              }
              className="text-amber-400 font-bold hover:text-amber-300 flex items-center gap-1.5 transition-colors"
            >
              <User className="w-3.5 h-3.5" /> Portal ({user.name?.split(' ')[0] || 'User'})
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-white hover:text-amber-300 font-semibold transition-colors">
                Sign In
              </Link>
              <span className="text-white/20 select-none">•</span>
              <Link to="/register" className="text-amber-400 hover:text-amber-300 font-bold transition-colors">
                Join Club
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B4D2E] to-[#123821] flex items-center justify-center text-white shadow-md group-hover:shadow-[#1B4D2E]/25 transition-all duration-200 group-hover:scale-105 border border-[#143B23]/40">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="font-extrabold text-slate-950 tracking-tight text-lg sm:text-xl block leading-tight font-display">
                THE CHAMPIONS CLUB
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                Sports & Racquets Sanctuary
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold">
            {navLinks.map((item) => {
              const active = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-2 rounded-xl transition-all duration-150 ${
                    active
                      ? 'text-[#1B4D2E] bg-[#1B4D2E]/10 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {/* Cart Trigger */}
            <button
              onClick={() => dispatch(toggleCartDrawer(true))}
              className="relative p-2.5 rounded-xl border border-slate-200/90 hover:bg-slate-50 text-slate-700 transition-all duration-150 active:scale-95 cursor-pointer hover:border-slate-300 shadow-2xs"
              title="Open Pro Shop Bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#C85A32] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <Button
                variant="lawn"
                size="sm"
                onClick={() =>
                  window.location.assign(
                    user.role === 'owner'
                      ? '/owner'
                      : user.role === 'member' || user.role === 'user'
                      ? '/app'
                      : user.role === 'shop_staff'
                      ? '/staff/products'
                      : user.role === 'cafe_staff' || user.role === 'bar_staff'
                      ? '/staff/cafe/inventory'
                      : '/staff/bookings',
                  )
                }
              >
                Go to Portal
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="clay" size="sm">
                    Join Club
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Global Presenter & Cart Overlays */}
      <CartDrawer />

      {/* Footer */}
      <footer className="bg-[#070B12] text-white pt-16 pb-12 border-t border-white/10 relative overflow-hidden">
        {/* Subtle decorative court vector lines background */}
        <div className="absolute inset-0 bg-court-mesh-dark opacity-10 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1B4D2E] flex items-center justify-center text-white border border-white/10">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <span className="font-extrabold text-lg text-white font-display">THE CHAMPIONS CLUB</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bengaluru&rsquo;s premier multi-sport athletics club. Featuring clay tennis courts, panoramic padel, tournament badminton, professional coaching, and club dining.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-xs text-white uppercase tracking-widest mb-4 font-display">Athletic Disciplines</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• Roland Garros Clay & Hard Tennis</li>
              <li>• Panoramic Padel Arenas</li>
              <li>• BWF Standard Badminton Courts</li>
              <li>• Floodlit Box Cricket Pitch</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-xs text-white uppercase tracking-widest mb-4 font-display">Quick Links</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="/#cafe" className="hover:text-amber-400 transition-colors">Club Café & Recovery Lounge</a>
              </li>
              <li>
                <Link to="/plans" className="hover:text-amber-400 transition-colors">Membership Tiers</Link>
              </li>
              <li>
                <Link to="/availability" className="hover:text-amber-400 transition-colors">Court Availability Strip</Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-amber-400 transition-colors">Pro Equipment Shop</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-amber-400 transition-colors">Trial Booking & Enquiries</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-xs text-white uppercase tracking-widest mb-4 font-display">Club House</h4>
            <p className="text-xs text-slate-400 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              123 Sports Way, Indiranagar, Bengaluru, KA 560038
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-500 shrink-0" />
              +91 98765 43210
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-500 shrink-0" />
              concierge@championsclub.in
            </p>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 The Champions Club. Built for championship performance.</p>
          <p className="mt-2 sm:mt-0 font-medium">Single Revenue Ledger • Zero Double Booking Guarantee</p>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout
