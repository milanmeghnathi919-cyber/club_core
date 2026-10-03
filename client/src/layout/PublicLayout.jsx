import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { toggleCartDrawer } from '@/feature/shop/cartSlice'
import CartDrawer from '@/components/common/CartDrawer'
import RoleSwitcher from '@/components/common/RoleSwitcher'
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
    { label: 'The Café', path: '/#cafe' },
    { label: 'Court Availability', path: '/availability' },
    { label: 'Membership Plans', path: '/plans' },
    { label: 'Pro Shop', path: '/shop' },
    { label: 'Book Trial / Contact', path: '/contact' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF6] text-slate-800 font-sans">
      {/* Top utility bar */}
      <div className="bg-[#090D16] text-slate-300 text-xs py-2 px-4 sm:px-8 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-500" /> Indiranagar, Bengaluru
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Open 06:00 – 22:00 Daily
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-amber-500" /> +91 98765 43210
          </span>
          {user ? (
            <Link
              to={user.role === 'owner' ? '/owner' : user.role === 'member' ? '/app' : user.role === 'bar_staff' ? '/bar/pos' : '/staff/bookings'}
              className="text-amber-400 font-semibold hover:text-amber-300 flex items-center gap-1"
            >
              <User className="w-3.5 h-3.5" /> Portal ({user.name?.split(' ')[0] || 'User'})
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-white hover:text-amber-300 font-medium">
                Sign In
              </Link>
              <span className="text-white/30">•</span>
              <Link to="/register" className="text-amber-400 hover:text-amber-300 font-bold">
                Join Club
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#1B4D2E] flex items-center justify-center text-white shadow-md group-hover:bg-[#153E24] transition-colors">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="font-extrabold text-slate-950 tracking-tight text-lg sm:text-xl block leading-tight">
                THE CHAMPIONS CLUB
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                Sports & Racquets Sanctuary
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold">
            {navLinks.map((item) => {
              const active = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-2 rounded-lg transition-colors ${
                    active
                      ? 'text-[#1B4D2E] bg-[#1B4D2E]/8 font-bold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70'
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
              className="relative p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
              title="Open Pro Shop Bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#C85A32] text-white text-[10px] font-bold flex items-center justify-center">
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
                      : user.role === 'member'
                      ? '/app'
                      : user.role === 'bar_staff'
                      ? '/bar/pos'
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
      <RoleSwitcher />

      {/* Footer */}
      <footer className="bg-[#090D16] text-white pt-16 pb-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1B4D2E] flex items-center justify-center text-white">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <span className="font-bold text-lg text-white">THE CHAMPIONS CLUB</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bengaluru&rsquo;s premier multi-sport athletics club. Featuring clay tennis courts, panoramic padel, tournament badminton, professional coaching, and club dining.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Athletic Disciplines</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• Roland Garros Clay & Hard Tennis</li>
              <li>• Panoramic Padel Arenas</li>
              <li>• BWF Standard Badminton Courts</li>
              <li>• Floodlit Box Cricket Pitch</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="/#cafe" className="hover:text-amber-400">Club Café & Recovery Lounge</a>
              </li>
              <li>
                <Link to="/plans" className="hover:text-amber-400">Membership Tiers</Link>
              </li>
              <li>
                <Link to="/availability" className="hover:text-amber-400">Court Availability Strip</Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-amber-400">Pro Equipment Shop</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-amber-400">Trial Booking & Enquiries</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Club House</h4>
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

        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 The Champions Club. Built for championship performance.</p>
          <p className="mt-2 sm:mt-0">Single Revenue Ledger • Zero Double Booking Guarantee</p>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout
