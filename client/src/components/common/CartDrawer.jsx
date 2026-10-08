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
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => dispatch(toggleCartDrawer(false))}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0E1217] text-white shadow-2xl flex flex-col border-l border-white/10 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-6 py-4 bg-[#12161F] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#CCFF00]" />
              <h3 className="font-black text-white text-base font-display uppercase tracking-tight">Pro Shop Equipment Bag</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#CCFF00] text-black text-xs font-black">
                {items.reduce((acc, curr) => acc + curr.qty, 0)}
              </span>
            </div>
            <button
              onClick={() => dispatch(toggleCartDrawer(false))}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-600 stroke-1" />
                <p className="font-bold text-white text-sm">Your equipment bag is empty</p>
                <p className="text-xs text-slate-400 mt-1">Browse rackets, apparel, strings, and balls.</p>
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
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-colors ${
                      exceedsStock || isOutOfStock
                        ? 'border-rose-500/40 bg-rose-950/30'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-6 h-6 text-slate-500" />
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white uppercase tracking-wider text-center px-1">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-white truncate" title={item.name}>
                          {item.name}
                        </h4>
                        <button
                          onClick={() => dispatch(removeFromCart(item.productId))}
                          className="text-slate-400 hover:text-rose-400 p-0.5 transition-colors shrink-0 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs font-bold text-[#CCFF00] mt-0.5 tabular-nums font-mono">
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
            <div className="p-6 bg-[#12161F] border-t border-white/10 space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Fulfilment Method
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => dispatch(setFulfilment('pickup'))}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      fulfilment === 'pickup'
                        ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-md shadow-[#CCFF00]/25'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" /> Club Pickup
                  </button>
                  <button
                    onClick={() => dispatch(setFulfilment('delivery'))}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      fulfilment === 'delivery'
                        ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-md shadow-[#CCFF00]/25'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" /> Home Delivery
                  </button>
                </div>
              </div>

              {/* Price Breakdown from Server Quote */}
              <div className="space-y-1 text-xs border-t border-white/10 pt-3">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium text-white font-mono">
                    {formatCurrency(quote?.subtotal || items.reduce((a, b) => a + b.price * b.qty, 0))}
                  </span>
                </div>
                {quote?.discount > 0 && (
                  <div className="flex justify-between text-[#CCFF00] font-bold">
                    <span>Member Privilege ({quote.discountPct}%)</span>
                    <span className="tabular-nums font-mono">-{formatCurrency(quote.discount)}</span>
                  </div>
                )}
                {fulfilment === 'delivery' && (
                  <div className="flex justify-between text-slate-400">
                    <span>Delivery Fee</span>
                    <span className="tabular-nums font-mono">{formatCurrency(quote?.deliveryFee || 50)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
                  <span className="font-display uppercase tracking-tight">Total Amount</span>
                  <span className="text-[#CCFF00] tabular-nums font-mono font-black text-lg">
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
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-rose-300">Items exceed available stock</p>
                    <p className="text-[11px] text-rose-400 leading-relaxed">
                      Please adjust quantities or remove out-of-stock items before checkout.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        items.forEach((it) => {
                          dispatch(capItemToStock(it.productId))
                        })
                      }}
                      className="text-[11px] font-bold text-black bg-[#CCFF00] hover:bg-[#B4E600] px-2.5 py-1 rounded-lg transition-colors inline-block mt-1 cursor-pointer"
                    >
                      Auto-adjust all items to available stock
                    </button>
                  </div>
                </div>
              )}

              <Button
                variant="volt"
                size="lg"
                disabled={hasOutOfStockError}
                className={`w-full gap-2 font-black shadow-lg shadow-[#CCFF00]/25 cursor-pointer ${
                  hasOutOfStockError ? 'opacity-60 cursor-not-allowed' : ''
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
                  <>Proceed to Checkout <ArrowRight className="w-4 h-4 stroke-[3]" /></>
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
