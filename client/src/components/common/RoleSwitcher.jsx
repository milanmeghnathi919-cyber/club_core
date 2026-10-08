import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setCredentials, clearCredentials } from '@/feature/auth/slices/authSlice'
import authService from '@/service/authService'
import useToast from '@/components/ui/Toast'
import {
  Trophy,
  Shield,
  Coffee,
  Briefcase,
  User,
  LogOut,
  Sparkles,
  ChevronRight,
  X,
  Zap,
} from 'lucide-react'

export const RoleSwitcher = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()
  const currentUser = useSelector((state) => state.auth.user)
  const [isOpen, setIsOpen] = useState(false)
  const [loadingRole, setLoadingRole] = useState(null)

  const roles = [
    {
      id: 'member-gold',
      title: 'Gold Member (Athlete)',
      subtitle: 'Arun Kumar • Gold Pass Tier',
      description: '100% Free Court Access • 15% Pro Shop & Bar Discount • Max 4 plays/day',
      email: 'member@championsclub.in',
      password: 'Member@123',
      icon: Trophy,
      targetPath: '/app',
      badge: 'Gold Tier',
      badgeColor: 'bg-amber-400/20 text-amber-700 border-amber-300',
      iconColor: 'bg-amber-500 text-slate-950',
    },
    {
      id: 'front-desk',
      title: 'Front Desk Reception',
      subtitle: 'Priya Patel • Operations Officer',
      description: 'Master Scheduling Grid • Counter POS • 3-Click Member 360° • Leads CRM',
      email: 'frontdesk@championsclub.in',
      password: 'Staff@123',
      icon: Shield,
      targetPath: '/staff/bookings',
      badge: 'Staff Console',
      badgeColor: 'bg-emerald-100 text-[#1B4D2E] border-emerald-300',
      iconColor: 'bg-[#1B4D2E] text-white',
    },
    {
      id: 'bar-pos',
      title: 'Clubhouse Bar & Kitchen',
      subtitle: 'Vikram Singh • F&B Lead',
      description: 'Touch Table Map POS • Live Kitchen Display (KDS) • Running Tabs • EOD Ledger',
      email: 'bar@championsclub.in',
      password: 'Staff@123',
      icon: Coffee,
      targetPath: '/bar',
      badge: 'Bar / KDS',
      badgeColor: 'bg-orange-100 text-[#C85A32] border-orange-300',
      iconColor: 'bg-[#C85A32] text-white',
    },
    {
      id: 'club-owner',
      title: 'Executive Club Owner',
      subtitle: 'Rajesh Sharma • Managing Director',
      description: 'Unified P&L Dashboard • "What We Owe" Ledger • Staff Payroll • GST Tax Reports',
      email: 'owner@championsclub.in',
      password: 'Admin@123',
      icon: Briefcase,
      targetPath: '/owner',
      badge: 'Owner Executive',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      iconColor: 'bg-indigo-900 text-amber-400',
    },
  ]

  const handleSwitch = async (role) => {
    setLoadingRole(role.id)
    try {
      const data = await authService.login(role.email, role.password)
      dispatch(setCredentials({ user: data.user, token: data.token }))
      toast.success(`Switched role to: ${role.title}`)
      setIsOpen(false)
      navigate(role.targetPath)
    } catch {
      toast.error('Failed to switch role. Please check connection.')
    } finally {
      setLoadingRole(null)
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
    } finally {
      dispatch(clearCredentials())
      toast.info('Signed out to Public Guest View')
      setIsOpen(false)
      navigate('/')
    }
  }

  return (
    <>
      {/* Floating Demo Trigger Button (Sleek Dark + Neon Volt Dot) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0F1216]/95 backdrop-blur-md text-white text-xs font-bold shadow-2xl border border-[#CCFF00]/40 hover:border-[#CCFF00] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group glow-volt-sm"
        title="Quick Role Demo Switcher"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] animate-ping" />
        <Sparkles className="w-3.5 h-3.5 text-[#CCFF00] group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">Portal Switcher</span>
        <span className="px-2 py-0.5 rounded-md bg-[#CCFF00]/20 text-[10px] text-[#CCFF00] uppercase tracking-wider font-extrabold border border-[#CCFF00]/30">
          {currentUser?.role || 'Guest'}
        </span>
      </button>

      {/* Modern Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-athletic-reveal">
          <div className="w-full max-w-lg bg-[#0F1216] text-white rounded-3xl shadow-2xl border border-white/15 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#07090C] to-[#141A22] text-white p-5 sm:p-6 flex items-start justify-between border-b border-white/10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#CCFF00]/20 text-[#CCFF00] text-[10px] font-extrabold uppercase tracking-wider border border-[#CCFF00]/30">
                  <Zap className="w-3 h-3" /> Live Demo Engine
                </div>
                <h3 className="text-xl font-extrabold text-white mt-1.5 font-display">
                  Experience The Champions Club
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Instant 1-click access to all 5 role-based portals defined in the project plan.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Active Status */}
            <div className="bg-white/5 px-5 py-2.5 border-b border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Currently active as:</span>
              <span className="font-bold text-[#CCFF00] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {currentUser ? `${currentUser.name} (${currentUser.role})` : 'Public Visitor (Guest)'}
              </span>
            </div>

            {/* Role List */}
            <div className="p-5 space-y-2.5 max-h-[60vh] overflow-y-auto">
              {roles.map((role) => {
                const isCurrent = currentUser?.email === role.email
                const IconComponent = role.icon
                return (
                  <button
                    key={role.id}
                    onClick={() => handleSwitch(role)}
                    disabled={loadingRole === role.id}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer group ${
                      isCurrent
                        ? 'bg-[#CCFF00]/10 border-[#CCFF00] shadow-xs ring-1 ring-[#CCFF00]/40'
                        : 'bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${role.iconColor}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-[#CCFF00] transition-colors">
                            {role.title}
                          </h4>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${role.badgeColor}`}
                          >
                            {role.badge}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-300 truncate mt-0.5">
                          {role.subtitle}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {role.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center text-slate-400 group-hover:text-[#CCFF00] group-hover:translate-x-0.5 transition-all">
                      {loadingRole === role.id ? (
                        <span className="text-[10px] font-bold text-[#CCFF00] animate-pulse">
                          Switching...
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Footer actions */}
            <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out to Public Guest
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default RoleSwitcher
