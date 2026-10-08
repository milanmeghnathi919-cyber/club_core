import React, { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/utils/format'
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
  Copy,
  Check,
  Download,
  RotateCw,
  Banknote,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export const FakePaymentModal = ({
  isOpen,
  onClose,
  amount = 0,
  title = 'The Champions Club Payment',
  description = 'Direct SSL encrypted club payment',
  sourceType = 'general',
  sourceId = null,
  planId = null,
  customerName = 'Club Member',
  onSuccess,
  onFailure,
}) => {
  const toast = useToast()

  const [activeMethod, setActiveMethod] = useState('upi') // 'upi' | 'card' | 'netbanking' | 'cash'
  const [loading, setLoading] = useState(false)
  const [paymentState, setPaymentState] = useState('idle') // 'idle' | 'processing' | 'success' | 'failed'
  const [processStep, setProcessStep] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [lastPaymentId, setLastPaymentId] = useState('')
  const [copiedId, setCopiedId] = useState(false)

  // QR Timer state (60s countdown)
  const [qrTimer, setQrTimer] = useState(60)

  // Card form state
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvv, setCardCvv] = useState('888')
  const [cardHolder, setCardHolder] = useState(customerName || 'Champion Member')
  const [isCardFlipped, setIsCardFlipped] = useState(false)

  // UPI state
  const [upiId, setUpiId] = useState('member@championsclub')

  // Netbanking state
  const [selectedBank, setSelectedBank] = useState('HDFC Bank')

  // Timer countdown effect for UPI QR
  useEffect(() => {
    if (!isOpen || paymentState !== 'idle' || activeMethod !== 'upi') return
    const interval = setInterval(() => {
      setQrTimer((prev) => (prev > 1 ? prev - 1 : 60))
    }, 1000)
    return () => clearInterval(interval)
  }, [isOpen, paymentState, activeMethod])

  useEffect(() => {
    if (isOpen) {
      setPaymentState('idle')
      setProcessStep(0)
      setErrorMessage('')
      setLastPaymentId('')
      setQrTimer(60)
      setIsCardFlipped(false)
      setCardHolder(customerName || 'Champion Member')
    }
  }, [isOpen, customerName])

  const autofillTestCard = () => {
    setCardNumber('4242 4242 4242 4242')
    setCardExpiry('09/29')
    setCardCvv('777')
    setCardHolder(customerName || 'Champion Member')
    toast.success('Test VISA card credentials autofilled')
  }

  const handleCopyTxn = () => {
    if (!lastPaymentId) return
    navigator.clipboard?.writeText(lastPaymentId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleSimulatePayment = async (statusToSimulate = 'success', chosenApp = null) => {
    setLoading(true)
    setPaymentState('processing')
    setErrorMessage('')
    setProcessStep(1)

    try {
      // Step 1: Encrypted handshake simulation
      await new Promise((r) => setTimeout(r, 400))
      setProcessStep(2)

      // Step 2: Clearinghouse / Gateway authorization
      await new Promise((r) => setTimeout(r, 500))
      setProcessStep(3)

      const methodLabel = chosenApp ? `upi_${chosenApp.toLowerCase()}` : activeMethod

      const result = await paymentService.processDummyPayment({
        sourceType,
        sourceId,
        planId,
        amount: Number(amount),
        method: methodLabel,
        simulatedStatus: statusToSimulate,
        notes: `Simulated Payment (${methodLabel.toUpperCase()}) for ${title}`,
      })

      if (result.success) {
        setPaymentState('success')
        const txn = result.paymentId || result.payment_no || `TXN-CC-${Math.floor(100000 + Math.random() * 900000)}`
        setLastPaymentId(txn)
        toast.success(`Payment Confirmed! Reference: ${txn}`)

        // Trigger parent callback after brief viewing interval
        if (onSuccess) {
          setTimeout(() => {
            onSuccess(result)
          }, 1400)
        }
      }
    } catch (err) {
      setPaymentState('failed')
      const msg = err.message || 'Payment simulation was declined by issuing bank'
      setErrorMessage(msg)
      toast.error(msg)
      if (onFailure) onFailure(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPaymentReceipt = () => {
    try {
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text('THE CHAMPIONS CLUB', 105, 18, { align: 'center' })
      doc.setFontSize(10)
      doc.text('Official Digital Payment Voucher', 105, 24, { align: 'center' })
      doc.text(`Receipt / Ref: ${lastPaymentId || 'TXN-CONFIRMED'}`, 14, 34)
      doc.text(`Date & Time: ${formatDate(new Date())}`, 14, 40)
      doc.text(`Customer Name: ${customerName}`, 14, 46)
      doc.text(`Payment Tender: ${activeMethod.toUpperCase()}`, 14, 52)
      doc.text(`Status: SUCCESSFUL (PAID)`, 14, 58)

      autoTable(doc, {
        startY: 64,
        head: [['Service / Transaction Title', 'Amount Paid', 'Ledger Status']],
        body: [[title || 'Club Service Payment', formatCurrency(amount), 'Reconciled & Cleared']],
        theme: 'grid',
      })

      const finalY = (doc.lastAutoTable?.finalY ?? 64) + 12
      doc.setFontSize(12)
      doc.text(`TOTAL AMOUNT PAID: ${formatCurrency(amount)}`, 14, finalY)
      doc.setFontSize(9)
      doc.text('Authorized by The Champions Club automated banking switch.', 14, finalY + 8)

      doc.save(`Payment-Voucher-${lastPaymentId || 'Receipt'}.pdf`)
      toast.success('Official Payment Voucher PDF downloaded')
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF voucher')
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onClose()
      }}
      title="Secure Club Payment Terminal"
      subtitle="The Champions Club • Instant Simulated Payment Gateway"
      maxWidth="max-w-xl"
    >
      <div className="space-y-5 py-1 font-sans text-white">
        {/* Real-time SSL Security Badge */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] animate-pulse" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              256-Bit SSL Encrypted Test Terminal
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/20 px-2 py-0.5 rounded-md">
            Zero Real Charges
          </span>
        </div>

        {/* Order Amount Hero Header */}
        <div className="p-4 rounded-2xl bg-[#090B0E] border border-white/10 text-white flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#CCFF00]/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#CCFF00]">
              Amount Payable
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums">
              {formatCurrency(amount)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[280px]">
              {title}
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(204,255,0,0.2)]">
            <ShieldCheck className="w-7 h-7" />
          </div>
        </div>

        {/* PROCESSING ANIMATION OVERLAY */}
        {paymentState === 'processing' && (
          <div className="p-8 text-center space-y-5 bg-[#090B0E] rounded-2xl border border-[#CCFF00]/40 shadow-[0_0_30px_rgba(204,255,0,0.15)] animate-in fade-in">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#CCFF00]/20 animate-ping" />
              <div className="w-14 h-14 rounded-full border-2 border-[#CCFF00] border-t-transparent animate-spin flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#CCFF00]" />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-white text-base uppercase tracking-wider">
                {processStep === 1 && 'Authenticating Session Handshake...'}
                {processStep === 2 && 'Connecting to Payment Switch...'}
                {processStep === 3 && 'Reconciling Ledger & Authorizing...'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Communicating with encrypted banking gateway. Do not refresh or close this window.
              </p>
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    processStep >= step ? 'w-8 bg-[#CCFF00]' : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* SUCCESS CELEBRATION OVERLAY */}
        {paymentState === 'success' && (
          <div className="p-8 text-center space-y-5 bg-[#090B0E] rounded-2xl border border-[#CCFF00] shadow-[0_0_35px_rgba(204,255,0,0.25)] animate-in zoom-in-95">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#CCFF00]/20 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-[#CCFF00] text-black flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-0.5 rounded-full bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 text-[10px] font-black uppercase tracking-wider">
                Payment Authorized
              </span>
              <h3 className="font-black text-xl text-white uppercase tracking-tight">
                Transaction Successful!
              </h3>
              <p className="text-xs text-slate-400">
                Amount of <strong className="text-[#CCFF00] font-mono">{formatCurrency(amount)}</strong> has been settled to the club single ledger.
              </p>
            </div>

            {/* Transaction Ref Pill */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between max-w-xs mx-auto text-xs">
              <div className="text-left font-mono truncate mr-2">
                <span className="text-[10px] text-slate-400 block uppercase">Reference ID</span>
                <span className="text-white font-bold">{lastPaymentId}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyTxn}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer"
                title="Copy Transaction ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-[#CCFF00]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Actions: Download PDF or Close */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2 max-w-sm mx-auto">
              <Button
                variant="volt"
                size="md"
                onClick={handleDownloadPaymentReceipt}
                className="w-full font-black uppercase tracking-wider text-xs gap-2 justify-center"
              >
                <Download className="w-4 h-4" />
                <span>Download Voucher (PDF)</span>
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={onClose}
                className="w-full text-xs font-bold justify-center"
              >
                Done
              </Button>
            </div>
          </div>
        )}

        {/* PAYMENT METHODS & FORM (IDLE OR FAILED) */}
        {(paymentState === 'idle' || paymentState === 'failed') && (
          <div className="space-y-4">
            {/* Error Message if declined */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in shake">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Transaction Declined</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#090B0E] rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveMethod('upi')}
                className={`py-2 px-2 rounded-lg font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeMethod === 'upi'
                    ? 'bg-[#CCFF00] text-black shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMethod('card')}
                className={`py-2 px-2 rounded-lg font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeMethod === 'card'
                    ? 'bg-[#CCFF00] text-black shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMethod('netbanking')}
                className={`py-2 px-2 rounded-lg font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeMethod === 'netbanking'
                    ? 'bg-[#CCFF00] text-black shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>NetBank</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMethod('cash')}
                className={`py-2 px-2 rounded-lg font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeMethod === 'cash'
                    ? 'bg-[#CCFF00] text-black shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Counter</span>
              </button>
            </div>

            {/* METHOD 1: DUMMY UPI / DYNAMIC QR */}
            {activeMethod === 'upi' && (
              <div className="space-y-4 text-xs">
                {/* QR Scanner Area */}
                <div className="p-4 rounded-2xl bg-[#090B0E] border border-white/10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left relative overflow-hidden">
                  {/* Glowing QR Box with Laser Scan Beam */}
                  <div className="relative w-32 h-32 bg-white rounded-2xl p-2.5 shadow-xl flex items-center justify-center shrink-0 border-2 border-[#CCFF00]/50 overflow-hidden group">
                    {/* SVG QR Code */}
                    <svg viewBox="0 0 100 100" className="w-full h-full text-black fill-current">
                      <rect x="0" y="0" width="30" height="30" rx="3" fill="#000" />
                      <rect x="5" y="5" width="20" height="20" rx="2" fill="#fff" />
                      <rect x="9" y="9" width="12" height="12" rx="1" fill="#000" />
                      <rect x="70" y="0" width="30" height="30" rx="3" fill="#000" />
                      <rect x="75" y="5" width="20" height="20" rx="2" fill="#fff" />
                      <rect x="79" y="9" width="12" height="12" rx="1" fill="#000" />
                      <rect x="0" y="70" width="30" height="30" rx="3" fill="#000" />
                      <rect x="5" y="75" width="20" height="20" rx="2" fill="#fff" />
                      <rect x="9" y="79" width="12" height="12" rx="1" fill="#000" />
                      {/* Matrix data dots */}
                      <rect x="38" y="10" width="6" height="6" fill="#000" />
                      <rect x="48" y="10" width="6" height="6" fill="#000" />
                      <rect x="38" y="24" width="8" height="6" fill="#000" />
                      <rect x="50" y="24" width="6" height="6" fill="#000" />
                      <rect x="10" y="38" width="6" height="6" fill="#000" />
                      <rect x="22" y="38" width="6" height="6" fill="#000" />
                      <rect x="38" y="38" width="24" height="24" rx="4" fill="#000" />
                      <rect x="44" y="44" width="12" height="12" rx="2" fill="#CCFF00" />
                      <rect x="70" y="38" width="10" height="6" fill="#000" />
                      <rect x="84" y="38" width="6" height="6" fill="#000" />
                      <rect x="70" y="50" width="6" height="14" fill="#000" />
                      <rect x="80" y="50" width="10" height="6" fill="#000" />
                      <rect x="38" y="70" width="6" height="8" fill="#000" />
                      <rect x="48" y="70" width="14" height="6" fill="#000" />
                      <rect x="68" y="70" width="6" height="10" fill="#000" />
                      <rect x="80" y="70" width="10" height="6" fill="#000" />
                      <rect x="38" y="84" width="12" height="6" fill="#000" />
                      <rect x="56" y="84" width="8" height="6" fill="#000" />
                      <rect x="70" y="84" width="20" height="6" fill="#000" />
                    </svg>

                    {/* Laser Scan Line animation */}
                    <div
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent shadow-[0_0_12px_#CCFF00]"
                      style={{
                        animation: 'scanLine 2s ease-in-out infinite alternate',
                      }}
                    />
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-[#CCFF00]" /> Dynamic UPI QR
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <RefreshCw className="w-2.5 h-2.5 text-[#CCFF00] animate-spin" />
                        Expires in {qrTimer}s
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Scan with any UPI application or click an instant app button below to simulate immediate biometric authorization.
                    </p>

                    {/* Instant UPI App Clickers */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                      {[
                        { name: 'Google Pay', color: 'hover:border-blue-500 hover:text-blue-400' },
                        { name: 'PhonePe', color: 'hover:border-purple-500 hover:text-purple-400' },
                        { name: 'Paytm', color: 'hover:border-sky-500 hover:text-sky-400' },
                        { name: 'BHIM UPI', color: 'hover:border-[#CCFF00] hover:text-[#CCFF00]' },
                      ].map((app) => (
                        <button
                          key={app.name}
                          type="button"
                          disabled={loading}
                          onClick={() => handleSimulatePayment('success', app.name)}
                          className={`p-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 transition-all ${app.color} hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50`}
                        >
                          {app.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Simulated VPA Input */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                    Simulated UPI Virtual ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@bank"
                      className="flex-1 px-3 py-2 rounded-xl bg-[#090B0E] border border-white/10 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    {['@okhdfcbank', '@ybl', '@paytm', '@icici'].map((suffix) => (
                      <button
                        key={suffix}
                        type="button"
                        onClick={() => setUpiId(`member${suffix}`)}
                        className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[10px] text-slate-400 hover:text-[#CCFF00] font-mono cursor-pointer border border-white/5"
                      >
                        {suffix}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* METHOD 2: DUMMY 3D CARD */}
            {activeMethod === 'card' && (
              <div className="space-y-3.5">
                {/* 3D Holographic Card Widget */}
                <div
                  className="rounded-2xl bg-gradient-to-tr from-[#12161D] via-[#1A222D] to-[#0A0D12] text-white p-5 shadow-2xl relative overflow-hidden border border-[#CCFF00]/40 transition-transform duration-500 group"
                  style={{
                    perspective: '1000px',
                    transform: isCardFlipped ? 'rotateY(180deg)' : 'none',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#CCFF00]/10 rounded-full blur-2xl pointer-events-none" />

                  {!isCardFlipped ? (
                    /* Card Front */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-5 rounded-md bg-amber-400/80 border border-amber-300 shadow-xs flex items-center justify-center">
                            <span className="w-4 h-3 border-t border-b border-amber-700/60 block" />
                          </span>
                          <span className="font-mono text-[10px] tracking-widest uppercase text-[#CCFF00]">
                            CHAMPIONS PRO PASS
                          </span>
                        </div>
                        <span className="font-extrabold italic text-sm tracking-wider text-white">
                          VISA
                        </span>
                      </div>

                      <div className="font-mono text-lg tracking-widest py-1 text-slate-100 font-bold drop-shadow-sm">
                        {cardNumber || '4242 •••• •••• 4242'}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <div>
                          <span className="block uppercase tracking-wider text-[8px] text-slate-500">Cardholder</span>
                          <span className="font-bold text-white uppercase">{cardHolder}</span>
                        </div>
                        <div>
                          <span className="block uppercase tracking-wider text-[8px] text-slate-500">Expires</span>
                          <span className="font-bold text-white font-mono">{cardExpiry}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsCardFlipped(true)}
                          className="flex items-center gap-1 text-[10px] text-[#CCFF00] underline cursor-pointer"
                        >
                          <RotateCw className="w-3 h-3" /> CVV
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Card Back */
                    <div
                      className="space-y-4"
                      style={{ transform: 'rotateY(180deg)' }}
                    >
                      <div className="h-7 -mx-5 bg-black" />
                      <div className="flex items-center justify-between bg-white/10 px-3 py-1.5 rounded-md">
                        <span className="text-[9px] text-slate-400">AUTHORIZED SIGNATURE</span>
                        <span className="font-mono font-bold text-black bg-white px-2 py-0.5 rounded text-xs">
                          {cardCvv || '888'}
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsCardFlipped(false)}
                          className="flex items-center gap-1 text-[10px] text-[#CCFF00] underline cursor-pointer"
                        >
                          <RotateCw className="w-3 h-3" /> Flip to Front
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card input fields */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Test Card Number
                    </label>
                    <button
                      type="button"
                      onClick={autofillTestCard}
                      className="text-[#CCFF00] hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3 h-3 text-[#CCFF00]" /> Autofill Test Card
                    </button>
                  </div>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="w-full px-3 py-2 rounded-xl bg-[#090B0E] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-[#CCFF00]"
                  />

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        className="w-full px-3 py-2 rounded-xl bg-[#090B0E] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-[#CCFF00]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        value={cardCvv}
                        onFocus={() => setIsCardFlipped(true)}
                        onBlur={() => setIsCardFlipped(false)}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-3 py-2 rounded-xl bg-[#090B0E] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-[#CCFF00]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* METHOD 3: DUMMY NETBANKING */}
            {activeMethod === 'netbanking' && (
              <div className="space-y-3 text-xs">
                <label className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                  Select Simulated Bank Switch
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'HDFC Bank',
                    'ICICI Bank',
                    'State Bank of India',
                    'Axis Bank',
                    'Kotak Mahindra',
                    'Punjab National Bank',
                  ].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`p-2.5 rounded-xl border text-left font-bold transition-all flex items-center justify-between cursor-pointer ${
                        selectedBank === bank
                          ? 'border-[#CCFF00] bg-[#CCFF00]/10 text-white ring-1 ring-[#CCFF00]'
                          : 'border-white/10 bg-[#090B0E] text-slate-300 hover:border-white/20'
                      }`}
                    >
                      <span>{bank}</span>
                      {selectedBank === bank && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#CCFF00]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* METHOD 4: CASH / COUNTER POS */}
            {activeMethod === 'cash' && (
              <div className="p-4 rounded-2xl bg-[#090B0E] border border-white/10 space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[#CCFF00] flex items-center justify-center shrink-0">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Pay at Clubhouse Front Desk</h4>
                    <p className="text-[11px] text-slate-400">
                      Generate an instant collection token to settle in person via Cash or POS Terminal.
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 font-mono text-[11px] text-[#CCFF00] flex justify-between">
                  <span>COUNTER TOKEN:</span>
                  <strong>CC-TOKEN-{Math.floor(1000 + Math.random() * 9000)}</strong>
                </div>
              </div>
            )}

            {/* SUBMIT ACTION BUTTONS */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <Button
                variant="volt"
                size="lg"
                loading={loading}
                onClick={() => handleSimulatePayment('success')}
                className="w-full font-black uppercase tracking-wider text-xs shadow-lg shadow-[#CCFF00]/20 gap-2 justify-center"
              >
                <Lock className="w-4 h-4 stroke-[2.5]" />
                <span>Simulate Pay {formatCurrency(amount)} (Authorized)</span>
              </Button>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSimulatePayment('failed')}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer disabled:opacity-50"
                >
                  Test Simulate Decline / Rejection
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={onClose}
                  className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 0%; opacity: 0.8; }
          50% { opacity: 1; }
          100% { top: 96%; opacity: 0.8; }
        }
      `}</style>
    </Modal>
  )
}

export default FakePaymentModal
