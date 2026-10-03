import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setCredentials, clearCredentials } from '@/feature/auth/slices/authSlice'
import authService from '@/service/authService'
import useToast from '@/components/ui/Toast'
import { Shield, Sparkles, ChevronUp, UserCheck, LogOut } from 'lucide-react'

const ROLES = [
  {
    role: 'public',
    label: 'Public Visitor',
    email: null,
    path: '/',
    badge: 'Guest',
    color: 'bg-slate-700',
  },
  {
    role: 'member',
    label: 'Arun Kumar',
    email: 'member@championsclub.in',
    password: 'Member@123',
    path: '/app',
    badge: 'Gold Member',
    color: 'bg-amber-600',
  },
  {
    role: 'front_desk',
    label: 'Priya Patel',
    email: 'frontdesk@championsclub.in',
    password: 'Staff@123',
    path: '/staff',
    badge: 'Front Desk',
    color: 'bg-emerald-700',
  },
  {
    role: 'bar_staff',
    label: 'Vikram Singh',
    email: 'bar@championsclub.in',
    password: 'Staff@123',
    path: '/staff/bar',
    badge: 'Café Staff',
    color: 'bg-amber-700',
  },
  {
    role: 'owner',
    label: 'Rajesh Sharma',
    email: 'owner@championsclub.in',
    password: 'Admin@123',
    path: '/owner',
    badge: 'Owner / Exec',
    color: 'bg-indigo-700',
  },
]

export const RoleSwitcher = () => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()

  const currentRole = user?.role || 'public'

  const handleSwitch = async (target) => {
    setLoading(true)
    try {
      if (target.role === 'public') {
        await authService.logout()
        dispatch(clearCredentials())
        toast.info('Switched to Public Visitor view')
        navigate('/')
      } else {
        const res = await authService.login(target.email, target.password)
        dispatch(setCredentials({ user: res.user, token: res.token }))
        toast.success(`Active as ${target.label} (${target.badge})`)
        navigate(target.path)
      }
      setOpen(false)
    } catch (err) {
      toast.error(`Switch failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 font-sans">
      {open ? (
        <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700 p-3 mb-2 w-72 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              Demo Role Switcher
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-slate-800"
            >
              Close
            </button>
          </div>
          <div className="space-y-1">
            {ROLES.map((r) => {
              const isActive = (r.role === 'public' && !user) || user?.role === r.role
              return (
                <button
                  key={r.role}
                  disabled={loading}
                  onClick={() => handleSwitch(r)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-all ${
                    isActive
                      ? 'bg-white/15 text-white font-semibold ring-1 ring-white/20'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${r.color}`} />
                    <span>{r.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {r.badge}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white shadow-lg border border-slate-700/80 text-xs font-medium backdrop-blur-xs transition-transform active:scale-95 hover:border-amber-500/50"
        title="Toggle instant demo role switcher"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-slate-300 font-normal">Role:</span>
        <span className="font-semibold text-white capitalize">{user ? user.role.replace('_', ' ') : 'Public'}</span>
        <ChevronUp className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
    </div>
  )
}

export default RoleSwitcher
