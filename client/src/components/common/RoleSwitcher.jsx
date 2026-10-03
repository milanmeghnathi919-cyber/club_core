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
    email: 'courts@championsclub.in',
    password: 'Staff@123',
    path: '/staff/bookings',
    badge: 'Court Staff',
    color: 'bg-emerald-700',
  },
  {
    role: 'shop_staff',
    label: 'Vikram Singh',
    email: 'shop@championsclub.in',
    password: 'Staff@123',
    path: '/staff/products',
    badge: 'Shop Staff',
    color: 'bg-blue-700',
  },
  {
    role: 'cafe_staff',
    label: 'Ananya Rao',
    email: 'cafe@championsclub.in',
    password: 'Staff@123',
    path: '/staff/cafe/inventory',
    badge: 'Café Staff',
    color: 'bg-amber-700',
  },
  {
    role: 'owner',
    label: 'Rajesh Sharma',
    email: 'owner@championsclub.in',
    password: 'Admin@123',
    path: '/owner',
    badge: 'Club Owner',
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

  // Disabled: Development demo switcher removed for production
  return null
}

export default RoleSwitcher
