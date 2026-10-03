import React, { useEffect, useState } from 'react'
import hrService from '@/service/hrService'
import { formatCurrency, formatDate } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Card, { CardContent } from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Users2,
  UserPlus,
  Phone,
  Mail,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle2,
  Coffee,
  Briefcase,
  Calendar,
} from 'lucide-react'

export const HrEmployees = () => {
  const toast = useToast()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  // Onboard Staff Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('Staff@123')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('front_desk')
  const [title, setTitle] = useState('Front Desk Concierge')
  const [department, setDepartment] = useState('Front Desk & Concierge')
  const [baseSalary, setBaseSalary] = useState('')
  const [joinedOn, setJoinedOn] = useState(new Date().toISOString().split('T')[0])
  const [adding, setAdding] = useState(false)

  // Newly Created Credentials Modal State
  const [createdCredentials, setCreatedCredentials] = useState(null)
  const [copied, setCopied] = useState(false)

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const data = await hrService.getEmployees()
      setEmployees(data || [])
    } catch {
      toast.error('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  // Auto-update default title and department when role changes
  const handleRoleChange = (newRole) => {
    setRole(newRole)
    if (newRole === 'front_desk') {
      setTitle('Front Desk Concierge')
      setDepartment('Front Desk & Concierge')
    } else if (newRole === 'bar_staff') {
      setTitle('Café & Kitchen Shift Lead')
      setDepartment('Café & Lounge')
    } else if (newRole === 'owner') {
      setTitle('Club Operations Executive')
      setDepartment('General Management')
    }
  }

  const handleAddEmployee = async (e) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !baseSalary) {
      toast.error('Please fill in all required fields')
      return
    }

    setAdding(true)
    try {
      const res = await hrService.createEmployee({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim() || 'Staff@123',
        phone: phone.trim() || undefined,
        title: title.trim() || role.replace('_', ' ').toUpperCase(),
        role,
        department,
        baseSalary: Number(baseSalary),
        joinedOn: joinedOn || new Date().toISOString().split('T')[0],
        status: 'active',
      })

      toast.success('Staff user account and payroll record created successfully!')
      setIsModalOpen(false)

      // Store credentials for the confirmation modal
      setCreatedCredentials({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim() || 'Staff@123',
        role,
        title: title.trim(),
        salary: Number(baseSalary),
      })

      // Reset form
      setFullName('')
      setEmail('')
      setPassword('Staff@123')
      setPhone('')
      setBaseSalary('')
      fetchEmployees()
    } catch (err) {
      toast.error(err.message || 'Failed to onboard staff member')
    } finally {
      setAdding(false)
    }
  }

  const handleCopyCredentials = () => {
    if (!createdCredentials) return
    const text = `The Champions Club - Staff Portal Credentials\nName: ${createdCredentials.fullName}\nRole: ${createdCredentials.role}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nLogin URL: ${window.location.origin}/login`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Credentials copied to clipboard')
    setTimeout(() => setCopied(false), 2500)
  }

  const getRoleBadge = (roleCode) => {
    if (roleCode === 'owner') {
      return <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">Executive / Owner</span>
    }
    if (roleCode === 'bar_staff') {
      return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">Café Staff</span>
    }
    return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Front Desk</span>
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
            Human Resources
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Staff & Employee Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage staff roster, user login credentials, base payroll compensations, and organizational roles.
          </p>
        </div>

        <Button variant="lawn" size="sm" icon={UserPlus} onClick={() => setIsModalOpen(true)} className="font-bold shadow-xs">
          Onboard Staff Member
        </Button>
      </div>

      <Card className="border-slate-200 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Staff Member & Title</th>
                  <th className="py-3.5 px-4">Contact / Login Email</th>
                  <th className="py-3.5 px-4">Role Classification</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Monthly Salary</th>
                  <th className="py-3.5 px-4">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#1B4D2E]/10 text-[#1B4D2E] font-bold text-xs flex items-center justify-center shrink-0">
                          {emp.fullName?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-sm">{emp.fullName}</span>
                          <span className="text-[11px] text-slate-500 font-medium">{emp.title || 'Staff Member'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {emp.email || 'No email set'}
                        </span>
                        {emp.phone && (
                          <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {emp.phone}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getRoleBadge(emp.role)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {emp.department || 'Operations'}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(emp.baseSalary || emp.base_salary)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3" /> User Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Onboard Staff Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Onboard Staff Member & Create Account"
        subtitle="Registers full employee profile, provisions system login credentials, and configures payroll roster."
      >
        <form onSubmit={handleAddEmployee} className="space-y-4 py-2">
          {/* Section 1: User & Login Credentials */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B4D2E] block">
              1. Identity & Login Credentials
            </span>

            <Input
              label="Full Legal Name *"
              placeholder="e.g. Suresh Nair"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Work Email Address (Username) *"
                type="email"
                placeholder="e.g. suresh@championsclub.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="relative">
                <Input
                  label="Initial Login Password *"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Input
              label="Mobile Phone Number *"
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Section 2: Role & Organizational Assignment */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B4D2E] block">
              2. Role & Organizational Placement
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Role Classification *"
                value={role}
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                <option value="front_desk">Front Desk Concierge</option>
                <option value="bar_staff">Café & Kitchen Staff</option>
                <option value="owner">Club Executive / Owner</option>
              </Select>

              <Input
                label="Job Title / Designation *"
                placeholder="e.g. Head Barista & Shift Lead"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Department *"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="Front Desk & Concierge">Front Desk & Concierge</option>
                <option value="Café & Lounge">Café, Bistro & Lounge</option>
                <option value="Sports & Racquets Academy">Sports & Racquets Academy</option>
                <option value="Operations & Maintenance">Operations & Maintenance</option>
                <option value="General Management">General Management</option>
              </Select>

              <Input
                label="Base Monthly Salary (INR) *"
                type="number"
                placeholder="e.g. 35000"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                required
              />
            </div>

            <Input
              label="Joining Date"
              type="date"
              value={joinedOn}
              onChange={(e) => setJoinedOn(e.target.value)}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="lawn" type="submit" loading={adding} className="font-bold shadow-xs">
              Confirm Onboarding & Provision Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Account Credentials Confirmation Modal */}
      <Modal
        isOpen={!!createdCredentials}
        onClose={() => setCreatedCredentials(null)}
        title="Staff User Account Provisioned!"
        subtitle="The staff member can now sign in using these credentials."
      >
        <div className="py-2 space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Account Activated in Database</h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                A login profile for <strong>{createdCredentials?.fullName}</strong> has been created with role{' '}
                <strong className="uppercase">{createdCredentials?.role}</strong>.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-sans">Full Name:</span>
              <span className="font-bold text-slate-800">{createdCredentials?.fullName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-sans">Login Email:</span>
              <span className="font-bold text-slate-900">{createdCredentials?.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-sans">Initial Password:</span>
              <span className="font-bold text-emerald-700">{createdCredentials?.password}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-sans">Designation:</span>
              <span className="font-bold text-slate-800">{createdCredentials?.title}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={copied ? Check : Copy}
              onClick={handleCopyCredentials}
              className="text-xs font-bold"
            >
              {copied ? 'Copied to Clipboard' : 'Copy Credentials'}
            </Button>
            <Button variant="lawn" size="sm" onClick={() => setCreatedCredentials(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default HrEmployees
