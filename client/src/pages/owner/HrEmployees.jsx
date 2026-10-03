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
import { Users2, UserPlus, Phone, Mail, ShieldCheck } from 'lucide-react'

export const HrEmployees = () => {
  const toast = useToast()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  // Add Employee Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('front_desk')
  const [department, setDepartment] = useState('Operations')
  const [baseSalary, setBaseSalary] = useState('')
  const [adding, setAdding] = useState(false)

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

  const handleAddEmployee = async (e) => {
    e.preventDefault()
    if (!fullName || !baseSalary) return

    setAdding(true)
    try {
      await hrService.createEmployee({
        fullName,
        title: role.replace('_', ' ').toUpperCase(),
        role,
        department,
        baseSalary: Number(baseSalary),
        joinedOn: new Date().toISOString().split('T')[0],
        status: 'active',
      })
      toast.success('Staff member onboarded successfully')
      setIsModalOpen(false)
      setFullName('')
      setBaseSalary('')
      fetchEmployees()
    } catch (err) {
      toast.error(err.message || 'Failed to add employee')
    } finally {
      setAdding(false)
    }
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
            Manage club staff roster, base compensations, and organizational roles.
          </p>
        </div>

        <Button variant="lawn" size="sm" icon={UserPlus} onClick={() => setIsModalOpen(true)} className="font-bold">
          Add Staff Member
        </Button>
      </div>

      <Card className="border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role & Surface</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Base Monthly Compensation</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1B4D2E]/10 text-[#1B4D2E] font-bold text-xs flex items-center justify-center shrink-0">
                          {emp.fullName?.charAt(0) || 'E'}
                        </div>
                        <span className="font-bold text-slate-900">{emp.fullName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700 capitalize">
                      {emp.role?.replace('_', ' ')}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {emp.department || 'Operations'}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(emp.baseSalary || emp.base_salary)}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Onboard Staff Member"
        subtitle="Add employee to payroll roster"
      >
        <form onSubmit={handleAddEmployee} className="space-y-4 py-2">
          <Input
            label="Full Legal Name *"
            placeholder="e.g. Suresh Nair"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select label="Role Classification" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="front_desk">Front Desk Concierge</option>
              <option value="bar_staff">Bar & Kitchen Staff</option>
              <option value="owner">Club Executive</option>
            </Select>

            <Input
              label="Base Monthly Salary (INR) *"
              type="number"
              placeholder="e.g. 30000"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="lawn" type="submit" loading={adding} className="font-bold">
              Confirm Onboarding
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default HrEmployees
