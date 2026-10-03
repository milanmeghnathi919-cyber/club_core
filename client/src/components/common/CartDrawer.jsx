import React, { useEffect, useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  removeFromCart,
  updateQuantity,
  syncItemStock,
  capItemToStock,
  setFulfilment,
  setQuote,
  toggleCartDrawer,
} from '@/feature/shop/cartSlice'
import shopService from '@/service/shopService'
import { formatCurrency } from '@/utils/format'
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Truck, Store, Loader2, AlertCircle } from 'lucide-react'
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
      if (data?.lines) {
        dispatch(syncItemStock(data.lines))
      }
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

  const hasOutOfStockError =
    items.some((item) => {
      const line = quote?.lines?.find((l) => l.productId === item.productId)
      const stock =
        item.stockQty !== undefined
          ? Number(item.stockQty)
          : line?.stockQty !== undefined
          ? Number(line.stockQty)
          : null
      return stock !== null && (stock <= 0 || item.qty > stock)
    }) || Boolean(quote?.hasOutOfStock)

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
              items.map((item) => {
                const line = quote?.lines?.find((l) => l.productId === item.productId)
                const stock =
                  item.stockQty !== undefined
                    ? Number(item.stockQty)
                    : line?.stockQty !== undefined
                    ? Number(line.stockQty)
                    : null

                const isOutOfStock = stock !== null && stock <= 0
                const exceedsStock = stock !== null && item.qty > stock
                const isMaxReached = stock !== null && stock > 0 && item.qty >= stock

                return (
                  <div
                    key={item.productId}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                      exceedsStock || isOutOfStock
                        ? 'border-rose-300 bg-rose-50/40'
                        : 'border-slate-200/80 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-6 h-6 text-slate-300" />
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-2xs flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white uppercase tracking-wider text-center px-1">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 truncate" title={item.name}>
                          {item.name}
                        </h4>
                        <button
                          onClick={() => dispatch(removeFromCart(item.productId))}
                          className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs font-semibold text-[#1B4D2E] mt-0.5 tabular-nums">
                        {formatCurrency(item.price)}
                      </p>

                      {/* Out of stock alert banner for this item */}
                      {isOutOfStock ? (
                        <div className="mt-1.5 flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                            <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                            Out of Stock (0 Available)
                          </span>
                        </div>
                      ) : exceedsStock ? (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                            <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                            Out of stock: Requested {item.qty}, only {stock} in stock
                          </span>
                          <button
                            type="button"
                            onClick={() => dispatch(capItemToStock(item.productId))}
                            className="text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded transition-colors"
                          >
                            Set to {stock}
                          </button>
                        </div>
                      ) : isMaxReached ? (
                        <p className="text-[10px] font-semibold text-amber-700 mt-1">
                          Max available stock reached ({stock} in stock)
                        </p>
                      ) : null}

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-slate-200 rounded-md bg-slate-50">
                          <button
                            onClick={() =>
                              dispatch(updateQuantity({ productId: item.productId, qty: item.qty - 1 }))
                            }
                            className="p-1 hover:bg-slate-200 text-slate-600 rounded-l"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span
                            className={`px-2 text-xs font-bold tabular-nums ${
                              exceedsStock ? 'text-rose-700 font-extrabold' : 'text-slate-800'
                            }`}
                          >
                            {item.qty}
                          </span>

                          <button
                            onClick={() => {
                              if (stock !== null && item.qty >= stock) return
                              dispatch(updateQuantity({ productId: item.productId, qty: item.qty + 1 }))
                            }}
                            disabled={stock !== null && item.qty >= stock}
                            className={`p-1 rounded-r transition-colors ${
                              stock !== null && item.qty >= stock
                                ? 'text-slate-300 bg-slate-100 cursor-not-allowed opacity-50'
                                : 'hover:bg-slate-200 text-slate-600'
                            }`}
                            title={
                              stock !== null && item.qty >= stock
                                ? `Out of stock: Only ${stock} available in stock`
                                : 'Add one more'
                            }
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {stock !== null && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {stock} in stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
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

              {/* Out of stock warning banner */}
              {hasOutOfStockError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-rose-800">Items exceed available stock</p>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      Please adjust quantities or remove out-of-stock items before checkout.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        items.forEach((it) => {
                          dispatch(capItemToStock(it.productId))
                        })
                      }}
                      className="text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded transition-colors inline-block mt-1"
                    >
                      Auto-adjust all items to available stock
                    </button>
                  </div>
                </div>
              )}

              <Button
                variant="lawn"
                size="lg"
                disabled={hasOutOfStockError}
                className={`w-full gap-2 font-bold ${
                  hasOutOfStockError ? 'opacity-60 cursor-not-allowed bg-slate-400 hover:bg-slate-400' : ''
                }`}
                onClick={() => {
                  if (hasOutOfStockError) return
                  dispatch(toggleCartDrawer(false))
                  navigate(user ? '/app/checkout' : '/login?redirect=/app/checkout')
                }}
              >
                {hasOutOfStockError ? (
                  <>Out of Stock — Adjust Items</>
                ) : (
                  <>Proceed to Checkout <ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CartDrawer
