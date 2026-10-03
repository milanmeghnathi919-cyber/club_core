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
import { ShoppingBag, Store, Truck, CheckCircle2, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react'

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
      } catch (err) {
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
      })

      setOrderSuccess(res.order || res)
      dispatch(clearCart())
      toast.success('Order placed successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  if (orderSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6 font-sans">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Order Confirmed!</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your Pro Shop order has been placed. You will receive an SMS confirmation once your gear is ready.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Order Number:</span>
            <strong className="font-mono text-slate-900 text-sm">{orderSuccess.orderNo}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Fulfilment:</span>
            <strong className="capitalize text-slate-900">{orderSuccess.fulfilment}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Order Total:</span>
            <strong className="text-[#1B4D2E] text-sm tabular-nums">
              {formatCurrency(orderSuccess.total)}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Payment Status:</span>
            <span className="font-semibold capitalize text-amber-700">
              {orderSuccess.paymentStatus || 'Pending on pickup'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link to="/app">
            <Button variant="lawn">Back to Dashboard</Button>
          </Link>
          <Link to="/shop">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 font-sans">
      <div className="border-b border-slate-200 pb-5">
        <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
          Secure Checkout
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Review & Place Order
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Form: Fulfilment & Payment */}
        <div className="md:col-span-2 space-y-6">
          {/* Fulfilment Toggle */}
          <Card className="border-slate-200">
            <CardHeader title="1. Fulfilment Options" subtitle="Choose how to receive your items" />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => dispatch(setFulfilment('pickup'))}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    fulfilment === 'pickup'
                      ? 'border-[#1B4D2E] bg-emerald-50/60 ring-1 ring-[#1B4D2E]'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#1B4D2E]" />
                    <span className="font-bold text-xs text-slate-900">Club Reception Pickup</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Free • Ready in 15 mins</span>
                </button>

                <button
                  type="button"
                  onClick={() => dispatch(setFulfilment('delivery'))}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    fulfilment === 'delivery'
                      ? 'border-[#1B4D2E] bg-emerald-50/60 ring-1 ring-[#1B4D2E]'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#1B4D2E]" />
                    <span className="font-bold text-xs text-slate-900">Home Delivery</span>
                  </div>
                  <span className="text-[11px] text-slate-500">₹50.00 standard delivery</span>
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
          <Card className="border-slate-200">
            <CardHeader title="2. Payment Preference" subtitle="Choose your preferred payment method" />
            <CardContent className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="pay_at_club"
                    checked={paymentMethod === 'pay_at_club'}
                    onChange={() => setPaymentMethod('pay_at_club')}
                    className="text-[#1B4D2E] focus:ring-[#1B4D2E]"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      Pay at Club Reception / On Delivery
                    </span>
                    <span className="text-[11px] text-slate-500">Cash, Card, or UPI on pickup</span>
                  </div>
                </div>
                <CreditCard className="w-4 h-4 text-slate-400" />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="text-[#1B4D2E] focus:ring-[#1B4D2E]"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      Razorpay Online Gateway (Test Mode)
                    </span>
                    <span className="text-[11px] text-slate-500">UPI, NetBanking, Cards</span>
                  </div>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </label>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Order Summary */}
        <div>
          <Card className="border-slate-200 sticky top-20">
            <CardHeader title="Order Summary" subtitle={`${items.length} unique items in bag`} />
            <CardContent className="space-y-4">
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                {items.map((i) => (
                  <div key={i.productId} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-800 truncate">{i.name}</p>
                      <span className="text-slate-400">Qty: {i.qty}</span>
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatCurrency(i.price * i.qty)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 text-xs pt-3 border-t border-slate-200">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium text-slate-800">
                    {formatCurrency(quote?.subtotal || 0)}
                  </span>
                </div>
                {quote?.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Member Discount ({quote.discountPct}%)</span>
                    <span className="tabular-nums">-{formatCurrency(quote.discount)}</span>
                  </div>
                )}
                {fulfilment === 'delivery' && (
                  <div className="flex justify-between text-slate-500">
                    <span>Delivery Fee</span>
                    <span className="tabular-nums">{formatCurrency(quote?.deliveryFee || 50)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-[#1B4D2E] tabular-nums">
                    {formatCurrency(quote?.total || 0)}
                  </span>
                </div>
              </div>

              <Button
                variant="lawn"
                size="lg"
                loading={submitting}
                disabled={loadingQuote}
                onClick={handlePlaceOrder}
                className="w-full font-bold shadow-md"
              >
                Confirm & Place Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Checkout
