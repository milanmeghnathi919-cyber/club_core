import React, { useEffect, useState } from 'react'
import hrService from '@/service/hrService'
import { formatCurrency } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
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
  Trash2,
  AlertTriangle,
  Zap,
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

  // Delete Staff Modal State
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return
    setDeleting(true)
    try {
      await hrService.deleteEmployee(employeeToDelete.id)
      toast.success(`Staff member "${employeeToDelete.fullName}" removed successfully`)
      setEmployees((prev) => prev.filter((e) => e.id !== employeeToDelete.id))
      setEmployeeToDelete(null)
    } catch (err) {
      toast.error(err.message || 'Failed to delete staff member')
    } finally {
      setDeleting(false)
    }
  }

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
      await hrService.createEmployee({
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
      return <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#CCFF00] text-[10px] font-black uppercase border border-[#CCFF00]/30">Executive / Owner</span>
    }
    if (roleCode === 'bar_staff') {
      return <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase border border-amber-400/30">Café Staff</span>
    }
    return <span className="px-2.5 py-0.5 rounded-full bg-[#CCFF00]/15 text-[#CCFF00] text-[10px] font-black uppercase border border-[#CCFF00]/30">Front Desk</span>
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Human Resources
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
            Staff & Employee Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage staff roster, user login credentials, base payroll compensations, and organizational roles.
          </p>
        </div>

        <Button variant="volt" size="sm" icon={UserPlus} onClick={() => setIsModalOpen(true)} className="font-black uppercase text-xs">
          Onboard Staff Member
        </Button>
      </div>

      <div className="rounded-3xl bg-[#111418] border border-white/10 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">Staff Member & Title</th>
                  <th className="py-3.5 px-5">Contact / Login Email</th>
                  <th className="py-3.5 px-5">Role Classification</th>
                  <th className="py-3.5 px-5">Department</th>
                  <th className="py-3.5 px-5">Monthly Salary</th>
                  <th className="py-3.5 px-5">Account Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30 font-black text-xs flex items-center justify-center shrink-0">
                          {emp.fullName?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <span className="font-bold text-white block text-sm">{emp.fullName}</span>
                          <span className="text-[11px] text-slate-400 font-medium">{emp.title || 'Staff Member'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="space-y-0.5">
                        <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <Mail className="w-3 h-3 text-[#CCFF00]" />
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

                    <td className="py-3.5 px-5">
                      {getRoleBadge(emp.role)}
                    </td>

                    <td className="py-3.5 px-5 text-slate-300 font-medium">
                      {emp.department || 'Operations'}
                    </td>

                    <td className="py-3.5 px-5 font-mono font-bold text-white tabular-nums">
                      {formatCurrency(emp.baseSalary || emp.base_salary)}
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30 text-[10px] font-bold uppercase">
                        <ShieldCheck className="w-3 h-3" /> User Active
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      {emp.role === 'owner' ? (
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2 py-1 bg-white/5 rounded-md">
                          Protected
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEmployeeToDelete(emp)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 transition-colors text-xs font-bold uppercase cursor-pointer"
                          title={`Delete ${emp.fullName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onboard Staff Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Onboard Staff Member & Create Account"
        subtitle="Registers full employee profile, provisions system login credentials, and configures payroll roster."
      >
        <form onSubmit={handleAddEmployee} className="space-y-4 py-2">
          {/* Section 1: User & Login Credentials */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#CCFF00] block">
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
                  className="absolute right-3 top-8 text-slate-400 hover:text-white"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#CCFF00]" />}
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
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#CCFF00] block">
              2. Role & Organizational Placement
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Role Classification *
                </label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#111418] rounded-xl border border-white/10 text-white text-xs focus:outline-none"
                >
                  <option value="front_desk" className="bg-[#111418] text-white">Front Desk Concierge</option>
                  <option value="bar_staff" className="bg-[#111418] text-white">Café & Kitchen Staff</option>
                  <option value="owner" className="bg-[#111418] text-white">Club Executive / Owner</option>
                </select>
              </div>

              <Input
                label="Job Title / Designation *"
                placeholder="e.g. Head Barista & Shift Lead"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Department *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#111418] rounded-xl border border-white/10 text-white text-xs focus:outline-none"
                >
                  <option value="Front Desk & Concierge" className="bg-[#111418] text-white">Front Desk & Concierge</option>
                  <option value="Café & Lounge" className="bg-[#111418] text-white">Café, Bistro & Lounge</option>
                  <option value="Sports & Racquets Academy" className="bg-[#111418] text-white">Sports & Racquets Academy</option>
                  <option value="Operations & Maintenance" className="bg-[#111418] text-white">Operations & Maintenance</option>
                  <option value="General Management" className="bg-[#111418] text-white">General Management</option>
                </select>
              </div>

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

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="volt" type="submit" loading={adding} className="font-black uppercase text-xs">
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
          <div className="p-4 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/40 text-white flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#CCFF00] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black uppercase tracking-tight text-white text-sm">Account Activated in Database</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                A login profile for <strong>{createdCredentials?.fullName}</strong> has been created with role{' '}
                <strong className="text-[#CCFF00] uppercase">{createdCredentials?.role}</strong>.
              </p>
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-slate-400 font-sans">Full Name:</span>
              <span className="font-bold text-white">{createdCredentials?.fullName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-slate-400 font-sans">Login Email:</span>
              <span className="font-bold text-white">{createdCredentials?.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-slate-400 font-sans">Initial Password:</span>
              <span className="font-bold text-[#CCFF00]">{createdCredentials?.password}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 font-sans">Designation:</span>
              <span className="font-bold text-white">{createdCredentials?.title}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/10">
            <Button
              variant="outline"
              size="sm"
              icon={copied ? Check : Copy}
              onClick={handleCopyCredentials}
              className="text-xs font-bold uppercase"
            >
              {copied ? 'Copied to Clipboard' : 'Copy Credentials'}
            </Button>
            <Button variant="volt" size="sm" onClick={() => setCreatedCredentials(null)} className="font-black uppercase text-xs">
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Staff Member Confirmation Modal */}
      <Modal
        isOpen={!!employeeToDelete}
        onClose={() => !deleting && setEmployeeToDelete(null)}
        title="Remove Staff Member"
        subtitle="Permanent removal of employee record and staff access"
      >
        {employeeToDelete && (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs leading-relaxed">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-black uppercase tracking-wider block text-rose-200 mb-0.5">Permanent Deletion Warning</span>
                Are you sure you want to remove <strong className="font-bold text-white">{employeeToDelete.fullName}</strong>?
                This will revoke their portal login access, delete their employee profile, and clear associated shifts and schedules.
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Staff Member:</span>
                <span className="font-bold text-white">{employeeToDelete.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Role / Designation:</span>
                <span className="font-semibold text-slate-200">{employeeToDelete.title || employeeToDelete.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono text-slate-200">{employeeToDelete.email || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="text-slate-200 font-medium">{employeeToDelete.department || 'Operations'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEmployeeToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                loading={deleting}
                onClick={handleDeleteEmployee}
                className="font-bold uppercase text-xs"
              >
                Confirm Deletion
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default HrEmployees
