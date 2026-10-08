import React, { useEffect, useState } from 'react'
import hrService from '@/service/hrService'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Sliders, Clock, Percent, ShieldCheck, CheckCircle2, Zap } from 'lucide-react'

export const ClubSettingsPage = () => {
  const toast = useToast()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const data = await hrService.getSettings()
      setSettings(data)
    } catch {
      toast.error('Failed to load club settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await hrService.updateSettings(settings)
      toast.success('Club parameters updated successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 font-sans max-w-4xl">
      <div className="border-b border-white/10 pb-5">
        <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00] flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> Operating Configuration
        </span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
          Club Settings & Rules
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure operating hours, booking rules, cancellation cutoffs, and statutory tax rates.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-44 bg-white/5 rounded-3xl animate-pulse" />
          <div className="h-44 bg-white/5 rounded-3xl animate-pulse" />
        </div>
      ) : settings ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Operating Hours & Booking Windows */}
          <div className="rounded-3xl bg-[#111418] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-base font-black uppercase tracking-tight text-white">Operating Hours & Scheduling</h3>
              <p className="text-xs text-slate-400">Court booking window rules</p>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Daily Opening Time"
                  value={settings.openTime || '06:00'}
                  onChange={(e) => setSettings({ ...settings, openTime: e.target.value })}
                />
                <Input
                  label="Daily Closing Time"
                  value={settings.closeTime || '22:00'}
                  onChange={(e) => setSettings({ ...settings, closeTime: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Standard Session Minutes"
                  type="number"
                  value={settings.sessionMinutes || 60}
                  onChange={(e) =>
                    setSettings({ ...settings, sessionMinutes: Number(e.target.value) })
                  }
                />
                <Input
                  label="Advance Booking Priority (Days)"
                  type="number"
                  value={settings.bookingWindowDays || 14}
                  onChange={(e) =>
                    setSettings({ ...settings, bookingWindowDays: Number(e.target.value) })
                  }
                />
                <Input
                  label="Cancellation Cutoff Hours"
                  type="number"
                  value={settings.cancelCutoffHours || 2}
                  onChange={(e) =>
                    setSettings({ ...settings, cancelCutoffHours: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          {/* Statutory Tax Rates */}
          <div className="rounded-3xl bg-[#111418] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-base font-black uppercase tracking-tight text-white">Statutory GST Rates (%)</h3>
              <p className="text-xs text-slate-400">Tax inclusive calculation rates</p>
            </div>
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Input
                  label="Court Hire GST %"
                  type="number"
                  value={settings.taxRates?.court || 18}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      taxRates: { ...settings.taxRates, court: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Pro Shop Equipment GST %"
                  type="number"
                  value={settings.taxRates?.shop || 18}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      taxRates: { ...settings.taxRates, shop: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Membership GST %"
                  type="number"
                  value={settings.taxRates?.membership || 18}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      taxRates: { ...settings.taxRates, membership: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Café Food GST %"
                  type="number"
                  value={settings.taxRates?.barFood || 5}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      taxRates: { ...settings.taxRates, barFood: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Café Beverages GST %"
                  type="number"
                  value={settings.taxRates?.barDrink || 18}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      taxRates: { ...settings.taxRates, barDrink: Number(e.target.value) },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="volt" size="lg" loading={saving} className="font-black uppercase text-xs">
              Save Configuration
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  )
}

export default ClubSettingsPage
