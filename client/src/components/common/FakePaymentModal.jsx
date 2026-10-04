import React, { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/utils/format'
import paymentService from '@/service/paymentService'
import useToast from '@/components/ui/Toast'
import {
  CreditCard,
  QrCode,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
  Zap,
  ArrowRight,
  RefreshCw,
  X,
} from 'lucide-react'

export const FakePaymentModal = ({
  isOpen,
  onClose,
  amount = 0,
  title = 'The Champions Club Payment',
  description = 'Secure club payment transaction',
  sourceType = 'general',
  sourceId = null,
  planId = null,
  customerName = 'Club Member',
  onSuccess,
  onFailure,
}) => {
  const toast = useToast()

  const [activeMethod, setActiveMethod] = useState('card') // 'card' | 'upi' | 'netbanking'
  const [loading, setLoading] = useState(false)
  const [paymentState, setPaymentState] = useState('idle') // 'idle' | 'processing' | 'success' | 'failed'
  const [errorMessage, setErrorMessage] = useState('')
  const [lastPaymentId, setLastPaymentId] = useState('')

  // Card form state
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvv, setCardCvv] = useState('888')
  const [cardHolder, setCardHolder] = useState(customerName || 'Champion Member')

  // UPI state
  const [upiId, setUpiId] = useState('member@championsclub')

  // Netbanking state
  const [selectedBank, setSelectedBank] = useState('HDFC Bank')

  useEffect(() => {
    if (isOpen) {
      setPaymentState('idle')
      setErrorMessage('')
      setLastPaymentId('')
      setCardHolder(customerName || 'Champion Member')
    }
  }, [isOpen, customerName])

  const autofillTestCard = () => {
    setCardNumber('4242 4242 4242 4242')
    setCardExpiry('09/29')
    setCardCvv('777')
    setCardHolder(customerName || 'Champion Member')
  }

  const handleSimulatePayment = async (statusToSimulate = 'success') => {
    setLoading(true)
    setPaymentState('processing')
    setErrorMessage('')

    try {
      // Simulate real-world gateway latency (600ms)
      await new Promise((resolve) => setTimeout(resolve, 600))

      const result = await paymentService.processDummyPayment({
        sourceType,
        sourceId,
        planId,
        amount: Number(amount),
        method: activeMethod,
        simulatedStatus: statusToSimulate,
        notes: `Simulated via Dummy Fake Gateway (${activeMethod.toUpperCase()})`,
      })

      if (result.success) {
        setPaymentState('success')
        setLastPaymentId(result.paymentId)
        toast.success(`Payment Authorized! Ref: ${result.paymentId}`)

        // Allow user to see the success checkmark for 1 second before concluding
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(result)
          }
          onClose()
        }, 1200)
      }
    } catch (err) {
      setPaymentState('failed')
      const msg = err.message || 'Simulated payment was declined by issuing bank'
      setErrorMessage(msg)
      toast.error(msg)
      if (onFailure) onFailure(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onClose()
      }}
      title="Secure Club Payment Gateway"
      subtitle="The Champions Club • 256-Bit SSL Encrypted Test Terminal"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5 py-1 font-sans">
        {/* Test Mode Indicator Banner */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-emerald-950 uppercase tracking-wider text-[11px]">
              Dummy Payment System Active
            </span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
            Zero Real Charges
          </span>
        </div>

        {/* Order Amount Hero Header */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-[#10241B] to-slate-950 text-white flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Amount Due
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
              {formatCurrency(amount)}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 truncate max-w-[220px]">
              {title}
            </p>
          </div>

          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          </div>
        </div>

        {/* Processing State Overlay */}
        {paymentState === 'processing' && (
          <div className="p-8 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
            <RefreshCw className="w-10 h-10 text-[#1B4D2E] animate-spin mx-auto" />
            <h4 className="font-bold text-slate-900 text-sm">Authorizing Dummy Payment...</h4>
            <p className="text-xs text-slate-500">
              Simulating secure handshake with banking switch. Please wait a moment.
            </p>
          </div>
        )}

        {/* Success State Overlay */}
        {paymentState === 'success' && (
          <div className="p-8 text-center space-y-3 bg-emerald-50/80 rounded-2xl border border-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-emerald-950 text-base">Payment Authorized Successfully!</h4>
            <p className="text-xs text-emerald-800 font-mono">
              Transaction ID: <strong>{lastPaymentId}</strong>
            </p>
            <p className="text-[11px] text-emerald-700">Updating club single revenue ledger...</p>
          </div>
        )}

        {/* Payment Methods & Form (When idle or failed) */}
        {(paymentState === 'idle' || paymentState === 'failed') && (
          <div className="space-y-4">
            {/* Error Message if declined */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Transaction Declined</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveMethod('card')}
                className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeMethod === 'card'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4 text-[#1B4D2E]" />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMethod('upi')}
                className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeMethod === 'upi'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMethod('netbanking')}
                className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeMethod === 'netbanking'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>NetBanking</span>
              </button>
            </div>

            {/* METHOD 1: DUMMY CARD */}
            {activeMethod === 'card' && (
              <div className="space-y-3.5">
                {/* Visual Dummy Card Widget */}
                <div className="rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white p-4.5 shadow-md relative overflow-hidden border border-slate-700/60">
                  <div className="flex items-center justify-between pb-4">
                    <span className="font-mono text-[10px] tracking-widest uppercase text-amber-400">
                      CHAMPIONS GOLD DEBIT
                    </span>
                    <span className="font-extrabold italic text-sm tracking-wider text-slate-200">
                      VISA
                    </span>
                  </div>
                  <div className="font-mono text-base tracking-widest py-1 text-slate-100">
                    {cardNumber || '4242 •••• •••• 4242'}
                  </div>
                  <div className="flex items-center justify-between pt-3 text-[10px] text-slate-400">
                    <div>
                      <span className="block uppercase tracking-wider text-[8px]">Cardholder</span>
                      <span className="font-semibold text-white uppercase">{cardHolder}</span>
                    </div>
                    <div>
                      <span className="block uppercase tracking-wider text-[8px]">Expires</span>
                      <span className="font-semibold text-white font-mono">{cardExpiry}</span>
                    </div>
                  </div>
                </div>

                {/* Card input fields */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Test Card Number
                    </label>
                    <button
                      type="button"
                      onClick={autofillTestCard}
                      className="text-[#1B4D2E] hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3 h-3 text-amber-500" /> Autofill Test Card
                    </button>
                  </div>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4D2E]/20"
                  />

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4D2E]/20"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4D2E]/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* METHOD 2: DUMMY UPI / QR */}
            {activeMethod === 'upi' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="w-24 h-24 bg-white p-2 rounded-xl border border-slate-300 shadow-2xs flex items-center justify-center shrink-0">
                    <QrCode className="w-20 h-20 text-slate-800" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">Simulated QR Code</h4>
                    <p className="text-[11px] text-slate-500">
                      Scan with Google Pay, PhonePe, Paytm, or BHIM. In this test environment, clicking the button below will immediately simulate a confirmed UPI notification callback.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Simulated UPI Virtual ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@bank"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4D2E]/20"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    {['@okhdfcbank', '@ybl', '@paytm', '@icici'].map((suffix) => (
                      <button
                        key={suffix}
                        type="button"
                        onClick={() => setUpiId(`member${suffix}`)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 font-mono cursor-pointer"
                      >
                        {suffix}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* METHOD 3: DUMMY NETBANKING */}
            {activeMethod === 'netbanking' && (
              <div className="space-y-3 text-xs">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                  Select Simulated Bank
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map(
                    (bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`p-2.5 rounded-xl border text-left font-bold transition-all flex items-center justify-between cursor-pointer ${
                          selectedBank === bank
                            ? 'border-[#1B4D2E] bg-emerald-50 text-[#1B4D2E] ring-1 ring-[#1B4D2E]'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <span>{bank}</span>
                        {selectedBank === bank && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1B4D2E]" />
                        )}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <Button
                variant="lawn"
                size="lg"
                loading={loading}
                onClick={() => handleSimulatePayment('success')}
                className="w-full font-bold shadow-md gap-2 justify-center"
              >
                <Lock className="w-4 h-4" />
                <span>Pay {formatCurrency(amount)} (Simulate Success)</span>
              </Button>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSimulatePayment('failed')}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer disabled:opacity-50"
                >
                  Test Simulate Decline / Failure
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={onClose}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default FakePaymentModal
