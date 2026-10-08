import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { clearCart, setFulfilment, setDeliveryAddress } from '@/feature/shop/cartSlice'
import shopService from '@/service/shopService'
import { formatCurrency } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import { Store, Truck, CheckCircle2, ShieldCheck, CreditCard, AlertCircle, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import FakePaymentModal from '@/components/common/FakePaymentModal'

export const Checkout = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()

  const { items, fulfilment, deliveryAddress } = useSelector((state) => state.cart)
  const user = useSelector((state) => state.auth.user)

  const [quote, setQuote] = useState(null)
  const [loadingQuote, setLoadingQuote] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('pay_at_club')
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const hasOutOfStock = quote?.hasOutOfStock || quote?.lines?.some((l) => l.isOutOfStock || l.exceedsStock)

  useEffect(() => {
    if (items.length === 0 && !orderSuccess) {
      navigate('/shop')
      return
    }

    const getQuote = async () => {
      setLoadingQuote(true)
      try {
        const data = await shopService.getQuote({
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
          fulfilment,
        })
        setQuote(data)
      } catch {
        toast.error('Failed to calculate server order quote')
      } finally {
        setLoadingQuote(false)
      }
    }

    if (items.length > 0) {
      getQuote()
    }
  }, [items, fulfilment, navigate, orderSuccess, toast])

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (hasOutOfStock) {
      toast.error('One or more items in your cart are out of stock. Please adjust quantities.')
      return
    }
    if (fulfilment === 'delivery' && !deliveryAddress.trim()) {
      toast.error('Please enter your delivery address')
      return
    }

    setSubmitting(true)
    try {
      const res = await shopService.createOrder({
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        fulfilment,
        deliveryAddress: fulfilment === 'delivery' ? deliveryAddress : null,
        paymentMethod: paymentMethod,
        customerName: user?.name || user?.full_name || user?.email?.split('@')[0],
        customerPhone: user?.phone || null,
      })

      const placedOrder = res.order || res
      setOrderSuccess(placedOrder)
      setPendingPaymentOrder(placedOrder)
      dispatch(clearCart())

      if (paymentMethod === 'online') {
        setShowPaymentModal(true)
      } else {
        toast.success('Order placed successfully!')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadReceiptPdf = (ord) => {
    if (!ord) return
    try {
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text('THE CHAMPIONS CLUB', 105, 18, { align: 'center' })
      doc.setFontSize(10)
      doc.text('Official Pro Shop Equipment Receipt', 105, 24, { align: 'center' })
      doc.text(`Order No: ${ord.orderNo || ord.order_no || 'ORD'}`, 14, 34)
      doc.text(`Fulfilment: ${ord.fulfilment === 'delivery' ? 'Home Delivery' : 'Club Reception Pickup'}`, 14, 40)
      doc.text(`Payment Status: ${(ord.paymentStatus || ord.payment_status || 'Pending').toUpperCase()}`, 14, 46)

      const rows = (ord.items || items || []).map((i) => [
        i.name || i.productName || 'Pro Item',
        i.qty || 1,
        formatCurrency(i.price || i.unitPrice || 0),
        formatCurrency((i.price || i.unitPrice || 0) * (i.qty || 1)),
      ])

      autoTable(doc, {
        startY: 54,
        head: [['Item Description', 'Qty', 'Unit Rate', 'Line Total']],
        body: rows.length > 0 ? rows : [['Pro Shop Equipment Item', '1', formatCurrency(ord.total), formatCurrency(ord.total)]],
        theme: 'grid',
      })

      const finalY = (doc.lastAutoTable?.finalY ?? 54) + 10
      doc.text(`Subtotal: ${formatCurrency(ord.subtotal || ord.total)}`, 140, finalY)
      if (Number(ord.discount) > 0) {
        doc.text(`Member Discount: -${formatCurrency(ord.discount)}`, 140, finalY + 6)
      }
      doc.setFontSize(12)
      doc.text(`TOTAL: ${formatCurrency(ord.total)}`, 140, finalY + 14)

      doc.save(`Receipt-${ord.orderNo || ord.order_no || 'Order'}.pdf`)
      toast.success('Order Receipt PDF downloaded')
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate Receipt PDF')
    }
  }

  if (orderSuccess) {
    const isPaid =
      orderSuccess.paymentStatus === 'paid' || orderSuccess.payment_status === 'paid'

    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6 font-sans">
        <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            {isPaid ? 'Order Confirmed & Paid!' : 'Order Confirmed!'}
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your Pro Shop order has been placed. You can view your receipt and status in your past orders history.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111418] border border-white/10 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Order Number:</span>
            <strong className="font-mono text-white text-sm">
              {orderSuccess.orderNo || orderSuccess.order_no}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Fulfilment:</span>
            <strong className="capitalize text-white">{orderSuccess.fulfilment}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Order Total:</span>
            <strong className="text-[#CCFF00] text-sm tabular-nums font-mono font-black">
              {formatCurrency(orderSuccess.total)}
            </strong>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-white/10">
            <span className="text-slate-400">Payment Status:</span>
            <div className="flex items-center gap-2">
              <span
                className={`font-bold capitalize px-2.5 py-0.5 rounded-full text-[11px] ${
                  isPaid
                    ? 'bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isPaid ? 'Paid' : 'Pending'}
              </span>
              {!isPaid && (
                <Button
                  size="xs"
                  variant="volt"
                  className="font-bold cursor-pointer"
                  onClick={() => {
                    setPendingPaymentOrder(orderSuccess)
                    setShowPaymentModal(true)
                  }}
                >
                  Pay Now (Simulate)
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="volt"
            className="font-black gap-2"
            onClick={() => handleDownloadReceiptPdf(orderSuccess)}
          >
            <Download className="w-4 h-4" /> Download Receipt (PDF)
          </Button>
          <Link to="/shop?tab=orders">
            <Button variant="outline" className="font-bold">Past Orders</Button>
          </Link>
          <Link to="/shop">
            <Button variant="ghost">Continue Shopping</Button>
          </Link>
        </div>

        {showPaymentModal && pendingPaymentOrder && (
          <FakePaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            amount={pendingPaymentOrder.total || quote?.total || 0}
            title={`Pro Shop Order #${pendingPaymentOrder.orderNo || pendingPaymentOrder.order_no || pendingPaymentOrder.id?.slice(0, 8)}`}
            description="Instant sports equipment checkout simulation"
            sourceType="shop_order"
            sourceId={pendingPaymentOrder.id}
            customerName={user?.name || user?.full_name || 'Valued Member'}
            onSuccess={() => {
              setOrderSuccess((prev) => ({
                ...(prev || pendingPaymentOrder),
                paymentStatus: 'paid',
                payment_status: 'paid',
              }))
              setShowPaymentModal(false)
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 font-sans">
      <div className="border-b border-white/10 pb-5">
        <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#CCFF00] text-black">
          Secure Checkout
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mt-3">
          Review & Place Order
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Form: Fulfilment & Payment */}
        <div className="md:col-span-2 space-y-6">
          {/* Fulfilment Toggle */}
          <Card className="border-white/10 bg-[#111418]">
            <CardHeader title="1. Fulfilment Options" subtitle="Choose how to receive your items" />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => dispatch(setFulfilment('pickup'))}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    fulfilment === 'pickup'
                      ? 'border-[#CCFF00] bg-[#CCFF00]/10 ring-1 ring-[#CCFF00]'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Store className={`w-4 h-4 ${fulfilment === 'pickup' ? 'text-[#CCFF00]' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs text-white">Club Reception Pickup</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Free • Ready in 15 mins</span>
                </button>

                <button
                  type="button"
                  onClick={() => dispatch(setFulfilment('delivery'))}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    fulfilment === 'delivery'
                      ? 'border-[#CCFF00] bg-[#CCFF00]/10 ring-1 ring-[#CCFF00]'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Truck className={`w-4 h-4 ${fulfilment === 'delivery' ? 'text-[#CCFF00]' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs text-white">Home Delivery</span>
                  </div>
                  <span className="text-[11px] text-slate-400">₹50.00 standard delivery</span>
                </button>
              </div>

              {fulfilment === 'delivery' && (
                <div className="pt-2 animate-in fade-in">
                  <Input
                    label="Delivery Street Address & Pincode *"
                    placeholder="Flat 402, Oakwood Apts, 12th Main Indiranagar, Bengaluru 560038"
                    value={deliveryAddress}
                    onChange={(e) => dispatch(setDeliveryAddress(e.target.value))}
                    required
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="border-white/10 bg-[#111418]">
            <CardHeader title="2. Payment Preference" subtitle="Choose your preferred payment method" />
            <CardContent className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="pay_at_club"
                    checked={paymentMethod === 'pay_at_club'}
                    onChange={() => setPaymentMethod('pay_at_club')}
                    className="accent-[#CCFF00]"
                  />
                  <div>
                    <span className="font-bold text-xs text-white block">
                      Pay at Club Reception / On Delivery
                    </span>
                    <span className="text-[11px] text-slate-400">Cash, Card, or UPI on pickup</span>
                  </div>
                </div>
                <CreditCard className="w-4 h-4 text-slate-400" />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="accent-[#CCFF00]"
                  />
                  <div>
                    <span className="font-bold text-xs text-white block">
                      Pay Online (Dummy Simulation Gateway)
                    </span>
                    <span className="text-[11px] text-slate-400">Instant Card, UPI / QR, NetBanking simulation</span>
                  </div>
                </div>
                <ShieldCheck className="w-4 h-4 text-[#CCFF00]" />
              </label>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Order Summary */}
        <div>
          <Card className="border-white/10 bg-[#111418] sticky top-20">
            <CardHeader title="Order Summary" subtitle={`${items.length} unique items in bag`} />
            <CardContent className="space-y-4">
              <div className="divide-y divide-white/5 max-h-56 overflow-y-auto pr-1">
                {items.map((i) => {
                  const line = quote?.lines?.find((l) => l.productId === i.productId)
                  const isOut = line?.isOutOfStock || line?.exceedsStock
                  return (
                    <div key={i.productId} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-white truncate">{i.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-slate-400">Qty: {i.qty}</span>
                          {isOut && (
                            <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 px-1.5 py-0.2 rounded border border-rose-500/40">
                              Out of stock (Max: {line?.stockQty ?? 0})
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#CCFF00] tabular-nums">
                        {formatCurrency(i.price * i.qty)}
                      </span>
                    </div>
                  )
                })}
              </div>

              {hasOutOfStock && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Items exceed available inventory</p>
                    <p className="text-[11px] text-rose-300 mt-0.5">
                      Please adjust your cart before placing this order.
                    </p>
                    <Link to="/shop" className="text-[11px] font-bold text-[#CCFF00] underline mt-1 block">
                      ← Return to Pro Shop
                    </Link>
                  </div>
                </div>
              )}

              <div className="space-y-1.5 text-xs pt-3 border-t border-white/10">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-mono font-medium text-white">
                    {formatCurrency(quote?.subtotal || 0)}
                  </span>
                </div>
                {quote?.discount > 0 && (
                  <div className="flex justify-between text-[#CCFF00] font-semibold">
                    <span>Member Discount ({quote.discountPct}%)</span>
                    <span className="tabular-nums font-mono">-{formatCurrency(quote.discount)}</span>
                  </div>
                )}
                {fulfilment === 'delivery' && (
                  <div className="flex justify-between text-slate-400">
                    <span>Delivery Fee</span>
                    <span className="tabular-nums font-mono">{formatCurrency(quote?.deliveryFee || 50)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-white/10">
                  <span>Total Amount</span>
                  <span className="text-[#CCFF00] font-mono tabular-nums font-black">
                    {formatCurrency(quote?.total || 0)}
                  </span>
                </div>
              </div>

              <Button
                variant="volt"
                size="lg"
                loading={submitting}
                disabled={loadingQuote || hasOutOfStock}
                onClick={handlePlaceOrder}
                className="w-full font-black shadow-md"
              >
                {hasOutOfStock ? 'Out of Stock — Adjust Items' : 'Confirm & Place Order'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Checkout
