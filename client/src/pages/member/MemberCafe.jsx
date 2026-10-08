import React, { useEffect, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import cafeService from '@/service/cafeService'
import { formatCurrency } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import FakePaymentModal from '@/components/common/FakePaymentModal'
import authService from '@/service/authService'
import {
  Coffee,
  ShoppingBag,
  Search,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  Utensils,
  ShieldCheck,
  Receipt,
  History,
} from 'lucide-react'

export const MemberCafe = () => {
  const toast = useToast()
  const user = useSelector((state) => state.auth.user)

  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [membership, setMembership] = useState(null)

  useEffect(() => {
    authService.me().then((res) => {
      if (res?.membership) setMembership(res.membership)
    }).catch(() => {})
  }, [])

  const hasActiveMembership = Boolean(membership && (membership.status === 'active' || !membership.status))
  const discountPct = hasActiveMembership ? Number(membership.bar_discount_pct ?? 15) : 0

  // Order tray state
  const [cart, setCart] = useState({})
  const [deliveryType, setDeliveryType] = useState('pickup')
  const [courtDeliveryLocation, setCourtDeliveryLocation] = useState('Championship Court 1')
  const [orderNotes, setOrderNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('pay_at_counter')
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [placedOrder, setPlacedOrder] = useState(null)
  const [paymentTargetTab, setPaymentTargetTab] = useState(null)

  // Past orders tab
  const [activeTab, setActiveTab] = useState('menu')
  const [myOrders, setMyOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [brokenImageIds, setBrokenImageIds] = useState(() => new Set())

  const fetchMenu = async () => {
    setLoading(true)
    try {
      const data = await cafeService.getMenuItems({ isAvailable: true })
      setMenuItems(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load café menu')
    } finally {
      setLoading(false)
    }
  }

  const fetchMyOrders = async () => {
    setLoadingOrders(true)
    try {
      const orders = await cafeService.getMyOrders()
      setMyOrders(Array.isArray(orders) ? orders : [])
    } catch {
      // ignore
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    fetchMenu()
  }, [])

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchMyOrders()
    }
  }, [activeTab])

  const categories = useMemo(() => {
    const set = new Set()
    menuItems.forEach((item) => {
      const hasImage = Boolean(item.image_url && item.image_url.trim() !== '')
      if (hasImage && !brokenImageIds.has(item.id) && item.category) {
        set.add(item.category)
      }
    })
    return ['all', ...Array.from(set)]
  }, [menuItems, brokenImageIds])

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Remove any item that lacks an image or failed to load
      const hasImage = Boolean(item.image_url && item.image_url.trim() !== '')
      if (!hasImage || brokenImageIds.has(item.id)) return false

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [menuItems, selectedCategory, searchQuery, brokenImageIds])

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev[item.id]
      const newQty = existing ? existing.qty + 1 : 1
      return {
        ...prev,
        [item.id]: {
          item,
          qty: newQty,
          notes: existing?.notes || '',
        },
      }
    })
  }

  const updateQty = (itemId, delta) => {
    setCart((prev) => {
      const existing = prev[itemId]
      if (!existing) return prev
      const newQty = existing.qty + delta
      if (newQty <= 0) {
        const next = { ...prev }
        delete next[itemId]
        return next
      }
      return {
        ...prev,
        [itemId]: { ...existing, qty: newQty },
      }
    })
  }

  const removeFromCart = (itemId) => {
    setCart((prev) => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
  }

  const clearCart = () => setCart({})

  const cartList = Object.values(cart)
  const cartCount = cartList.reduce((acc, c) => acc + c.qty, 0)
  const rawSubtotal = cartList.reduce((acc, c) => acc + Number(c.item.price || 0) * c.qty, 0)
  const discountAmount = Math.round((rawSubtotal * discountPct) / 100)
  const finalTotal = Math.max(0, rawSubtotal - discountAmount)

  const handlePlaceOrder = async () => {
    if (cartList.length === 0) {
      toast.error('Your order tray is empty')
      return
    }

    setSubmittingOrder(true)
    try {
      const payload = {
        items: cartList.map((c) => ({
          menuItemId: c.item.id,
          qty: c.qty,
          notes: c.notes || undefined,
        })),
        paymentMethod,
        delivery: deliveryType,
        notes: deliveryType === 'court' ? `Deliver to ${courtDeliveryLocation}. ${orderNotes}` : orderNotes,
      }

      const res = await cafeService.placeOrder(payload)
      const newOrder = res.order || res
      setPlacedOrder(newOrder)
      clearCart()

      if (paymentMethod === 'upi' || paymentMethod === 'card') {
        setPaymentTargetTab({
          id: newOrder.id || newOrder.tabId,
          tab_no: newOrder.tab_no || newOrder.tabNo,
          total: Number(newOrder.total) || finalTotal,
        })
      } else {
        toast.success('Your Café order has been placed!')
      }
      fetchMyOrders()
    } catch (err) {
      toast.error(err.message || 'Failed to place café order')
    } finally {
      setSubmittingOrder(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#111418] via-[#161B22] to-[#0A0D11] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(204,255,0,0.18),transparent_70%)] pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
          <div className="space-y-2 max-w-2xl">
            {discountPct > 0 ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CCFF00]/15 text-[#CCFF00] text-xs font-black border border-[#CCFF00]/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{membership?.plan_name || 'Member'} Privilege • {discountPct}% Off All Café & Kitchen Items</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#CCFF00] text-xs font-bold border border-white/10">
                <Coffee className="w-3.5 h-3.5" />
                <span>Club Café & Recovery Lounge • Fresh to Order</span>
              </div>
            )}
            <h1 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
              The Club Café & Recovery Lounge
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Locally roasted specialty coffees, high-protein organic bowls, and post-match recovery smoothies. Handcrafted fresh to order for champions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${
                activeTab === 'menu'
                  ? 'bg-[#CCFF00] text-black shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Café Menu</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-[#CCFF00] text-black shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <History className="w-4 h-4" />
              <span>My Orders ({myOrders.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: MENU & ORDERING */}
      {activeTab === 'menu' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Menu Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search & Category Filter Bar */}
            <div className="p-4 bg-[#111418] rounded-2xl border border-white/10 shadow-2xs space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search specialty coffee, protein shakes, sourdough toasts, acai bowls..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-white/15 focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] bg-[#0D1117] text-white placeholder-slate-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#CCFF00] text-black shadow-2xs'
                        : 'bg-white/5 text-slate-300 border border-white/5 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {cat === 'all' ? 'All Items' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-12 text-center bg-[#111418] rounded-2xl border border-white/10 space-y-2">
                <Coffee className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="font-bold text-white text-sm">No café items match your search</h3>
                <p className="text-xs text-slate-400">Try selecting another category or clearing your query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredItems.map((item) => {
                  const inCart = cart[item.id]
                  const basePrice = Number(item.price || 0)
                  const memberPrice = Math.round(basePrice * (1 - discountPct / 100))

                  return (
                    <div
                      key={item.id}
                      className="bg-[#111418] rounded-2xl border border-white/10 overflow-hidden shadow-2xs hover:border-[#CCFF00]/50 hover:shadow-[0_0_20px_rgba(204,255,0,0.15)] transition-all flex flex-col justify-between group"
                    >
                      {/* Product Image */}
                      <div className="h-44 bg-[#090B0E] relative overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          onError={() => {
                            setBrokenImageIds((prev) => new Set(prev).add(item.id))
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-xs text-[#CCFF00] border border-white/10 text-[10px] font-bold uppercase tracking-wider">
                          {item.category || 'Café Item'}
                        </span>
                        {discountPct > 0 && (
                          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#CCFF00] text-black text-[10px] font-black uppercase tracking-wider shadow-xs">
                            {discountPct}% OFF
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h3 className="font-bold text-sm text-white group-hover:text-[#CCFF00] transition-colors leading-snug">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-base font-black text-[#CCFF00] font-mono tabular-nums">
                              {formatCurrency(memberPrice)}
                            </span>
                            {discountPct > 0 && (
                              <>
                                <span className="text-xs text-slate-500 line-through font-mono tabular-nums">
                                  {formatCurrency(basePrice)}
                                </span>
                                <span className="text-[10px] font-bold text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/20 px-1.5 py-0.5 rounded">
                                  Member Rate
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Add / Quantity Button */}
                        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                          {inCart ? (
                            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                              <button
                                onClick={() => updateQty(item.id, -1)}
                                className="w-7 h-7 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors font-bold shadow-2xs"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-bold text-xs px-2 tabular-nums text-white">{inCart.qty}</span>
                              <button
                                onClick={() => updateQty(item.id, 1)}
                                className="w-7 h-7 rounded-lg bg-[#CCFF00] text-black hover:bg-[#b8e600] flex items-center justify-center transition-colors font-bold shadow-2xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="w-full py-2 px-3 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add to Tray</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sticky Order Tray Column */}
          <div className="space-y-4">
            <div className="bg-[#111418] rounded-2xl border border-white/10 p-5 shadow-2xs sticky top-20 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#CCFF00] text-black flex items-center justify-center font-bold">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Your Order Tray</h3>
                    <p className="text-[11px] text-slate-400">{cartCount} items selected</p>
                  </div>
                </div>
                {cartCount > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    Clear Tray
                  </button>
                )}
              </div>

              {cartList.length === 0 ? (
                <div className="py-8 text-center text-slate-500 space-y-2">
                  <Utensils className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs font-medium text-slate-400">Your tray is currently empty.</p>
                  <p className="text-[11px] text-slate-500">Select artisan coffees or protein bowls from the menu.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Item List */}
                  <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 divide-y divide-white/5 text-xs">
                    {cartList.map(({ item, qty }) => (
                      <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-white block truncate">{item.name}</span>
                          <span className="text-[11px] text-slate-400 tabular-nums font-mono">
                            {formatCurrency(Math.round(item.price * (1 - discountPct / 100)))} × {qty}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="w-5 h-5 rounded bg-white/10 text-white hover:bg-white/20 flex items-center justify-center font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold tabular-nums px-1 text-white">{qty}</span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="w-5 h-5 rounded bg-white/10 text-white hover:bg-white/20 flex items-center justify-center font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-500 hover:text-rose-400 ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Fulfillment Choice */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                      Pickup / Delivery
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('pickup')}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          deliveryType === 'pickup'
                            ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-xs'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        Counter Pickup
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType('court')}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          deliveryType === 'court'
                            ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-xs'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        Court-side Delivery
                      </button>
                    </div>

                    {deliveryType === 'court' && (
                      <div className="pt-1">
                        <select
                          value={courtDeliveryLocation}
                          onChange={(e) => setCourtDeliveryLocation(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-white/15 bg-[#0D1117] text-white focus:outline-none"
                        >
                          <option value="Championship Court 1">Deliver to Tennis Court 1</option>
                          <option value="Championship Court 2">Deliver to Tennis Court 2</option>
                          <option value="Padel Glass Court 1">Deliver to Padel Court 1</option>
                          <option value="Badminton Court 1">Deliver to Badminton Court 1</option>
                          <option value="Squash Glass Court 1">Deliver to Squash Court 1</option>
                          <option value="Club Lounge / Terrace">Deliver to Club Lounge</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                      Payment Tender
                    </span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-white/15 bg-[#0D1117] text-white focus:outline-none"
                    >
                      <option value="pay_at_counter">Pay at Counter (Cash / UPI on pickup)</option>
                      <option value="member_charge">Charge to Member Account</option>
                      <option value="upi">UPI / QR Code</option>
                      <option value="card">Credit / Debit Card</option>
                    </select>
                  </div>

                  {/* Special Notes */}
                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="Special instructions (e.g. extra oat milk, iced)..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-white/15 bg-[#0D1117] text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  {/* Price Calculation */}
                  <div className="space-y-1.5 pt-3 border-t border-white/10 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal:</span>
                      <span className="tabular-nums font-semibold font-mono text-white">{formatCurrency(rawSubtotal)}</span>
                    </div>
                    {discountPct > 0 ? (
                      <div className="flex justify-between text-[#CCFF00] font-semibold">
                        <span>{membership?.plan_name || 'Member'} {discountPct}% Discount:</span>
                        <span className="tabular-nums font-mono">- {formatCurrency(discountAmount)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-slate-400 font-medium">
                        <span>Member Discount:</span>
                        <span className="tabular-nums font-mono">₹0.00 (Standard Guest)</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white font-extrabold text-sm pt-2 border-t border-white/10">
                      <span>Total Payable:</span>
                      <span className="tabular-nums text-base text-[#CCFF00] font-mono font-black">{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    variant="volt"
                    size="md"
                    onClick={handlePlaceOrder}
                    loading={submittingOrder}
                    className="w-full font-black text-xs py-2.5"
                  >
                    Place Café Order ({formatCurrency(finalTotal)})
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY PAST CAFÉ ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#111418] rounded-2xl border border-white/10 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">Your Recent Café Orders</h3>
              <p className="text-xs text-slate-400 mt-0.5">Track your kitchen and barista tickets in real-time.</p>
            </div>
            <button
              onClick={fetchMyOrders}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 hover:border-[#CCFF00] hover:text-[#CCFF00] text-slate-300 transition-colors"
            >
              Refresh Orders
            </button>
          </div>

          {loadingOrders ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : myOrders.length === 0 ? (
            <div className="p-16 text-center bg-[#111418] rounded-2xl border border-white/10 space-y-3">
              <Receipt className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="font-bold text-white text-sm">No Café Orders Found</h3>
              <p className="text-xs text-slate-400">You haven&rsquo;t ordered anything from the café yet.</p>
              <Button variant="volt" size="sm" onClick={() => setActiveTab('menu')}>
                Browse Menu & Order
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 bg-[#111418] rounded-2xl border border-white/10 shadow-2xs hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">
                        {ord.tab_no || ord.tabNo || 'ORDER'}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          ord.status === 'settled'
                            ? 'bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/30'
                            : ord.status === 'open'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {ord.status === 'open' ? 'Preparing in Kitchen' : ord.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-0.5">
                      {ord.items && ord.items.length > 0 ? (
                        <p className="font-medium text-white">
                          {ord.items.map((i) => `${i.qty}× ${i.name_snapshot || i.name}`).join(', ')}
                        </p>
                      ) : (
                        <p className="italic text-slate-400">Artisan Café Selection</p>
                      )}
                      {ord.notes && <p className="text-[11px] text-slate-400">Note: {ord.notes}</p>}
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-white/10 gap-2">
                    <span className="text-base font-black text-[#CCFF00] font-mono tabular-nums">
                      {formatCurrency(ord.total || 0)}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(ord.opened_at || ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {ord.status === 'open' && (
                      <Button
                        size="xs"
                        variant="volt"
                        className="font-bold text-xs cursor-pointer"
                        onClick={() => setPaymentTargetTab(ord)}
                      >
                        Pay Online (Simulate)
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUCCESS MODAL ON ORDER PLACED */}
      <Modal
        isOpen={!!placedOrder}
        onClose={() => setPlacedOrder(null)}
        title="Café Order Confirmed!"
        subtitle={`Ticket #${placedOrder?.tab_no || 'TICKET'}`}
      >
        <div className="py-4 space-y-4 text-center font-sans">
          <div className="w-14 h-14 rounded-full bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-white">Your order has been sent to the kitchen!</h3>
            <p className="text-xs text-slate-400">
              Estimated preparation time: <strong className="text-white">10–12 minutes</strong>
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Order Reference:</span>
              <strong className="font-mono text-white">{placedOrder?.tab_no}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Payable:</span>
              <strong className="text-[#CCFF00] font-mono tabular-nums">{formatCurrency(placedOrder?.total || 0)}</strong>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-white/10">
              <span className="text-slate-400">Payment Status:</span>
              <div className="flex items-center gap-2">
                <span
                  className={`font-semibold capitalize px-2 py-0.5 rounded-full text-[11px] ${
                    placedOrder?.status === 'settled'
                      ? 'bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {placedOrder?.status === 'settled' ? 'Paid & Settled' : 'Open / Unpaid'}
                </span>
                {placedOrder?.status !== 'settled' && (
                  <Button
                    size="xs"
                    variant="volt"
                    className="font-bold cursor-pointer"
                    onClick={() => setPaymentTargetTab(placedOrder)}
                  >
                    Pay Online Now
                  </Button>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Instructions:</span>
              <span className="text-slate-300 font-medium">{placedOrder?.notes || 'Counter Pickup'}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="volt"
              size="md"
              onClick={() => {
                setPlacedOrder(null)
                setActiveTab('orders')
              }}
              className="font-bold text-xs"
            >
              Track Order Status
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => setPlacedOrder(null)}
              className="text-xs"
            >
              Order More
            </Button>
          </div>
        </div>
      </Modal>

      {paymentTargetTab && (
        <FakePaymentModal
          isOpen={Boolean(paymentTargetTab)}
          onClose={() => setPaymentTargetTab(null)}
          amount={paymentTargetTab.total || finalTotal || 0}
          title={`Café Order #${paymentTargetTab.tab_no || paymentTargetTab.tabNo || 'ORDER'}`}
          description="Instant Club Café & Lounge checkout simulation"
          sourceType="bar_tab"
          sourceId={paymentTargetTab.id}
          customerName={user?.name || user?.full_name || 'Champion Member'}
          onSuccess={() => {
            fetchMyOrders()
            if (placedOrder && (placedOrder.id === paymentTargetTab.id || placedOrder.tab_no === paymentTargetTab.tab_no)) {
              setPlacedOrder((p) => ({ ...p, status: 'settled' }))
            }
            setPaymentTargetTab(null)
          }}
        />
      )}
    </div>
  )
}

export default MemberCafe
