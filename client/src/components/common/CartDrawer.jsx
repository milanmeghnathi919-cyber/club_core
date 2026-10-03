import React, { useEffect, useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  removeFromCart,
  updateQuantity,
  setFulfilment,
  setQuote,
  toggleCartDrawer,
} from '@/feature/shop/cartSlice'
import shopService from '@/service/shopService'
import { formatCurrency } from '@/utils/format'
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Truck, Store, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'

export const CartDrawer = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items, fulfilment, quote, isDrawerOpen } = useSelector((state) => state.cart)
  const user = useSelector((state) => state.auth.user)
  const [loadingQuote, setLoadingQuote] = useState(false)

  const fetchServerQuote = useCallback(async () => {
    if (items.length === 0) {
      dispatch(setQuote(null))
      return
    }

    setLoadingQuote(true)
    try {
      const quotePayload = {
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        fulfilment,
      }
      const data = await shopService.getQuote(quotePayload)
      dispatch(setQuote(data))
    } catch (err) {
      console.error('Failed to get cart quote:', err)
    } finally {
      setLoadingQuote(false)
    }
  }, [items, fulfilment, dispatch])

  useEffect(() => {
    if (isDrawerOpen && items.length > 0) {
      fetchServerQuote()
    }
  }, [isDrawerOpen, items, fulfilment, fetchServerQuote])

  if (!isDrawerOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => dispatch(toggleCartDrawer(false))}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#1B4D2E]" />
              <h3 className="font-bold text-slate-900 text-base">Club Pro Shop Cart</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#1B4D2E]/10 text-[#1B4D2E] text-xs font-bold">
                {items.reduce((acc, curr) => acc + curr.qty, 0)}
              </span>
            </div>
            <button
              onClick={() => dispatch(toggleCartDrawer(false))}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
                <p className="font-medium text-slate-600 text-sm">Your equipment bag is empty</p>
                <p className="text-xs text-slate-400 mt-1">Browse rackets, apparel, and strings.</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors"
                >
                  <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                    <p className="text-xs font-semibold text-[#1B4D2E] mt-0.5 tabular-nums">
                      {formatCurrency(item.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-slate-200 rounded-md bg-slate-50">
                        <button
                          onClick={() =>
                            dispatch(updateQuantity({ productId: item.productId, qty: item.qty - 1 }))
                          }
                          className="p-1 hover:bg-slate-200 text-slate-600 rounded-l"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold tabular-nums text-slate-800">
                          {item.qty}
                        </span>
                        <button
                          onClick={() =>
                            dispatch(updateQuantity({ productId: item.productId, qty: item.qty + 1 }))
                          }
                          className="p-1 hover:bg-slate-200 text-slate-600 rounded-r"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => dispatch(removeFromCart(item.productId))}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Fulfilment Toggle & Footer */}
          {items.length > 0 && (
            <div className="p-6 bg-slate-50/90 border-t border-slate-200 space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Fulfilment Method
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => dispatch(setFulfilment('pickup'))}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      fulfilment === 'pickup'
                        ? 'bg-[#1B4D2E] text-white border-[#1B4D2E] shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" /> Club Pickup
                  </button>
                  <button
                    onClick={() => dispatch(setFulfilment('delivery'))}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      fulfilment === 'delivery'
                        ? 'bg-[#1B4D2E] text-white border-[#1B4D2E] shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" /> Home Delivery
                  </button>
                </div>
              </div>

              {/* Price Breakdown from Server Quote */}
              <div className="space-y-1 text-xs border-t border-slate-200/80 pt-3">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium text-slate-800">
                    {formatCurrency(quote?.subtotal || items.reduce((a, b) => a + b.price * b.qty, 0))}
                  </span>
                </div>
                {quote?.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
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
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-[#1B4D2E] tabular-nums">
                    {loadingQuote ? (
                      <Loader2 className="w-4 h-4 animate-spin inline" />
                    ) : (
                      formatCurrency(quote?.total || items.reduce((a, b) => a + b.price * b.qty, 0))
                    )}
                  </span>
                </div>
              </div>

              <Button
                variant="lawn"
                size="lg"
                className="w-full gap-2 font-bold"
                onClick={() => {
                  dispatch(toggleCartDrawer(false))
                  navigate(user ? '/app/checkout' : '/login?redirect=/app/checkout')
                }}
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CartDrawer
