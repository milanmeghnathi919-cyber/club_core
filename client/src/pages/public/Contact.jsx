import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import publicService from '@/service/publicService'
import courtService from '@/service/courtService'
import useToast from '@/components/ui/Toast'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import { Trophy, CheckCircle2, Phone, Mail, MapPin, Sparkles, Calendar, Clock } from 'lucide-react'

export const Contact = () => {
  const [searchParams] = useSearchParams()
  const toast = useToast()

  const isTrial = searchParams.get('trial') === 'true'
  const prefillCourtId = searchParams.get('courtId') || ''
  const prefillDate = searchParams.get('date') || ''
  const prefillTime = searchParams.get('time') || ''
  const prefillPlanName = searchParams.get('planName') || ''

  const [courts, setCourts] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    interest: isTrial ? 'trial' : 'membership',
    sport: 'tennis',
    courtId: prefillCourtId,
    startAt: prefillDate && prefillTime ? `${prefillDate}T${prefillTime}:00` : '',
    message: prefillPlanName ? `Enquiring for ${prefillPlanName}` : '',
  })

  useEffect(() => {
    publicService.getCourts().then(setCourts).catch(console.error)
    publicService.getPlans().then(setPlans).catch(console.error)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || (!form.phone && !form.email)) {
      toast.error('Please provide your name and at least a phone number or email')
      return
    }

    setLoading(true)
    try {
      if (isTrial && form.courtId && form.startAt) {
        // Book guest trial
        const res = await publicService.bookTrial({
          name: form.name,
          phone: form.phone,
          email: form.email,
          courtId: form.courtId,
          startAt: new Date(form.startAt).toISOString(),
        })
        setSubmitted({ type: 'trial', data: res })
        toast.success('Guest trial court booked successfully!')
      } else {
        // Send enquiry
        const res = await publicService.submitEnquiry({
          name: form.name,
          phone: form.phone,
          email: form.email,
          interest: form.interest,
          sport: form.sport,
          message: form.message,
        })
        setSubmitted({ type: 'enquiry', data: res })
        toast.success('Your enquiry has been received! Our concierge will contact you shortly.')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit enquiry')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6 font-sans">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            {submitted.type === 'trial' ? 'Court Trial Reserved!' : 'Enquiry Received!'}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {submitted.type === 'trial'
              ? 'Your championship court session is reserved. Our concierge desk will welcome you at reception.'
              : 'Our sports concierge has logged your request in our CRM. We will get in touch with you shortly.'}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-mono">
          Reference ID: {submitted.data.id || submitted.data.leadId || 'CHAMP-LEAD-2026'}
        </div>
        <Button variant="lawn" onClick={() => setSubmitted(null)}>
          Submit Another Request
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 space-y-12 font-sans">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
          {isTrial ? 'Trial Experience' : 'Concierge & Enquiries'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          {isTrial ? 'Reserve a One-Time Guest Trial' : 'Connect with The Champions Club'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          We welcome athletes of all levels. Reach out to schedule a private walkthrough, membership onboarding, or trial match.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Information Cards */}
        <div className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader title="Clubhouse Concierge" subtitle="Direct front desk helpline" />
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1B4D2E] flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">+91 98765 43210</p>
                  <p className="text-slate-500">Available 06:00 – 22:00 IST</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1B4D2E] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">concierge@championsclub.in</p>
                  <p className="text-slate-500">Enquiries & Corporate Events</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1B4D2E] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">123 Sports Way, Indiranagar</p>
                  <p className="text-slate-500">Bengaluru, KA 560038</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-5 rounded-xl bg-gradient-to-br from-[#1B4D2E] to-[#12351F] text-white space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Zero Waiting Time
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">
              All enquiries feed directly into our front desk CRM with real-time notification alerts.
            </p>
          </div>
        </div>

        {/* Main Interactive Enquiry / Trial Booking Form */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200">
            <CardHeader
              title={isTrial ? 'Guest Trial Booking' : 'Membership & General Enquiry'}
              subtitle="Fill in your details below and our team will get in touch"
            />
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name *"
                    placeholder="e.g. Rohan Mehra"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Phone Number *"
                    placeholder="e.g. +91 98765 00000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="e.g. rohan@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <Select
                    label="Primary Interest"
                    value={form.interest}
                    onChange={(e) => setForm({ ...form, interest: e.target.value })}
                  >
                    <option value="membership">Club Membership Plans</option>
                    <option value="trial">Guest Trial Match</option>
                    <option value="corporate">Corporate Sports Tournament</option>
                    <option value="coaching">Professional Academy Coaching</option>
                  </Select>
                </div>

                {isTrial && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <Select
                      label="Select Championship Court"
                      value={form.courtId}
                      onChange={(e) => setForm({ ...form, courtId: e.target.value })}
                    >
                      <option value="">Choose Court...</option>
                      {courts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.sport})
                        </option>
                      ))}
                    </Select>
                    <Input
                      label="Date & Start Time"
                      type="datetime-local"
                      value={form.startAt}
                      onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Message or Special Requests
                  </label>
                  <textarea
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about your sports background or schedule preferences..."
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D2E]/20 focus:border-[#1B4D2E]"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="lawn"
                    size="lg"
                    loading={loading}
                    className="w-full font-bold"
                  >
                    {isTrial ? 'Confirm Guest Trial Reservation' : 'Submit Enquiry'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Contact
