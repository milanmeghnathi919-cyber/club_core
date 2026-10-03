import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

// Layouts
import PublicLayout from '@/layout/PublicLayout'
import MemberLayout from '@/layout/MemberLayout'
import StaffLayout from '@/layout/StaffLayout'
import OwnerLayout from '@/layout/OwnerLayout'

// Public Pages
import Landing from '@/pages/public/Landing'
import Availability from '@/pages/public/Availability'
import Plans from '@/pages/public/Plans'
import Shop from '@/pages/public/Shop'
import Contact from '@/pages/public/Contact'
import Login from '@/pages/public/Login'
import Register from '@/pages/public/Register'

// Member Pages
import MemberDashboard from '@/pages/member/MemberDashboard'
import MemberBook from '@/pages/member/MemberBook'
import MyBookings from '@/pages/member/MyBookings'
import MemberSocial from '@/pages/member/MemberSocial'
import Checkout from '@/pages/member/Checkout'
import DigitalPass from '@/pages/member/DigitalPass'
import MemberCafe from '@/pages/member/MemberCafe'

// Staff Pages
import StaffBookings from '@/pages/staff/StaffBookings'
import MemberList from '@/pages/staff/MemberList'
import MemberDetail from '@/pages/staff/MemberDetail'
import MemberNew from '@/pages/staff/MemberNew'
import CounterPos from '@/pages/staff/CounterPos'
import ProductsAdmin from '@/pages/staff/ProductsAdmin'
import OrdersAdmin from '@/pages/staff/OrdersAdmin'
import LeadsCrm from '@/pages/staff/LeadsCrm'
import StaffShifts from '@/pages/staff/StaffShifts'
import StaffLeave from '@/pages/staff/StaffLeave'

// Café POS & Inventory Pages
import CafeInventory from '@/pages/staff/CafeInventory'
import BarPos from '@/pages/bar/BarPos'
import KitchenDisplay from '@/pages/bar/KitchenDisplay'
import BarSummary from '@/pages/bar/BarSummary'

// Owner Pages
import OwnerDashboard from '@/pages/owner/OwnerDashboard'
import InvoicesPage from '@/pages/owner/InvoicesPage'
import ExpensesPage from '@/pages/owner/ExpensesPage'
import TaxReportsPage from '@/pages/owner/TaxReportsPage'
import PayrollPage from '@/pages/owner/PayrollPage'
import HrEmployees from '@/pages/owner/HrEmployees'
import ClubSettingsPage from '@/pages/owner/ClubSettingsPage'

// Common / Universal Pages
import Profile from '@/pages/common/Profile'

const UniversalProfileRedirect = () => {
  let role = 'member'
  try {
    const raw = localStorage.getItem('cc_user')
    if (raw) role = JSON.parse(raw)?.role || 'member'
  } catch {}
  if (role === 'owner') return <Navigate to="/owner/profile" replace />
  if (role !== 'member') return <Navigate to="/staff/profile" replace />
  return <Navigate to="/app/profile" replace />
}

export const router = createBrowserRouter([
  // Universal Profile Shortcut
  {
    path: '/profile',
    element: <UniversalProfileRedirect />,
  },

  // Public Surfaces
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'availability', element: <Availability /> },
      { path: 'plans', element: <Plans /> },
      { path: 'shop', element: <Shop /> },
      { path: 'contact', element: <Contact /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
    ],
  },

  // Member Portal
  {
    path: '/app',
    element: <MemberLayout />,
    children: [
      { index: true, element: <MemberDashboard /> },
      { path: 'book', element: <MemberBook /> },
      { path: 'bookings', element: <MyBookings /> },
      { path: 'cafe', element: <MemberCafe /> },
      { path: 'social', element: <MemberSocial /> },
      { path: 'shop', element: <Shop /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'pass', element: <DigitalPass /> },
      { path: 'profile', element: <Profile /> },
    ],
  },

  // Staff Console
  {
    path: '/staff',
    element: <StaffLayout />,
    children: [
      { index: true, element: <StaffBookings /> },
      { path: 'bookings', element: <StaffBookings /> },
      { path: 'members', element: <MemberList /> },
      { path: 'members/new', element: <MemberNew /> },
      { path: 'members/:id', element: <MemberDetail /> },
      { path: 'pos', element: <CounterPos /> },
      { path: 'products', element: <ProductsAdmin /> },
      { path: 'orders', element: <OrdersAdmin /> },
      { path: 'leads', element: <LeadsCrm /> },
      { path: 'social', element: <MemberSocial /> },
      { path: 'shifts', element: <StaffShifts /> },
      { path: 'leave', element: <StaffLeave /> },
      { path: 'cafe', element: <BarPos /> },
      { path: 'cafe/pos', element: <BarPos /> },
      { path: 'cafe/inventory', element: <CafeInventory /> },
      { path: 'cafe-inventory', element: <CafeInventory /> },
      { path: 'cafe/kitchen', element: <KitchenDisplay /> },
      { path: 'cafe/summary', element: <BarSummary /> },
      { path: 'bar', element: <BarPos /> },
      { path: 'bar/kitchen', element: <KitchenDisplay /> },
      { path: 'bar/summary', element: <BarSummary /> },
      { path: 'profile', element: <Profile /> },
    ],
  },

  // Owner Executive Console
  {
    path: '/owner',
    element: <OwnerLayout />,
    children: [
      { index: true, element: <OwnerDashboard /> },
      { path: 'invoices', element: <InvoicesPage /> },
      { path: 'expenses', element: <ExpensesPage /> },
      { path: 'tax', element: <TaxReportsPage /> },
      { path: 'payroll', element: <PayrollPage /> },
      { path: 'employees', element: <HrEmployees /> },
      { path: 'cafe-inventory', element: <CafeInventory /> },
      { path: 'shifts', element: <StaffShifts /> },
      { path: 'leave', element: <StaffLeave /> },
      { path: 'settings', element: <ClubSettingsPage /> },
      { path: 'profile', element: <Profile /> },
    ],
  },

  // Catch-all
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export default router