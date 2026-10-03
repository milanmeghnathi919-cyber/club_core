import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import publicService from '@/service/publicService'
import shopService from '@/service/shopService'
import { addToCart } from '@/feature/shop/cartSlice'
import { formatCurrency, formatDate, formatTime } from '@/utils/format'
import {
  Search,
  ShoppingBag,
  Plus,
  Check,
  Filter,
  Package,
  History,
  Store,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  ArrowRight,
  ExternalLink,
  Printer,
  ShieldCheck,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import Modal from '@/components/ui/Modal'
import useToast from '@/components/ui/Toast'

export const Shop = () => {
  const dispatch = useDispatch()
  const toast = useToast()
  const location = useLocation()
  const user = useSelector((state) => state.auth.user)
  const cartItems = useSelector((state) => state.cart.items)

  // Tab: 'catalog' | 'orders'
  const [activeTab, setActiveTab] = useState(
    location.search.includes('tab=orders') ? 'orders' : 'catalog'
  )

  // Catalog state
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Past orders state
  const [myOrders, setMyOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState(null)

  useEffect(() => {
    Promise.all([publicService.getCategories(), publicService.getProducts()])
      .then(([cats, prods]) => {
        setCategories(cats)
        setProducts(prods.items || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Sync tab from URL query params if present
  useEffect(() => {
    if (location.search.includes('tab=orders')) {
      setActiveTab('orders')
    }
  }, [location.search])

  // Fetch past orders when user is logged in or switches to orders tab
  const fetchMyOrders = async () => {
    if (!user) return
    setLoadingOrders(true)
    try {
      const data = await shopService.getMyOrders()
      setMyOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load past orders:', err)
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchMyOrders()
    }
  }, [user, activeTab])

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      !selectedCategory || p.categoryId === selectedCategory || p.category_id === selectedCategory
    const matchesSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  const handleAdd = (product) => {
    const rawStock = product.stock_qty ?? product.stockQty ?? product.stock
    const stock =
      rawStock !== undefined && rawStock !== null
        ? Number(rawStock)
        : product.inStock === false
        ? 0
        : 99
    const existing = cartItems.find((i) => i.productId === product.id)
    const currentQty = existing?.qty || 0

    if (product.inStock === false || stock <= 0) {
      toast.error(`${product.name} is currently out of stock`)
      return
    }

    if (currentQty >= stock) {
      toast.error(`Out of stock: Maximum available units already in bag (${stock} available)`)
      return
    }

    dispatch(addToCart({ product, qty: 1 }))
    toast.success(`Added ${product.name} to equipment bag (${currentQty + 1}/${stock})`)
  }

  const getStatusBadge = (status) => {
    const map = {
      delivered: { text: 'Delivered', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      completed: { text: 'Completed', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      confirmed: { text: 'Confirmed', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
      ready: { text: 'Ready for Pickup', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      pending: { text: 'Pending', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
      cancelled: { text: 'Cancelled', bg: 'bg-rose-100 text-rose-800 border-rose-200' },
    }
    const match = map[status?.toLowerCase()] || {
      text: status || 'Pending',
      bg: 'bg-slate-100 text-slate-800 border-slate-200',
    }
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${match.bg}`}
      >
        {match.text}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
            Club Pro Shop
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
            Official Equipment & Gear
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tournament-grade tennis rackets, padel bats, feather shuttles, and club apparel.
          </p>
        </div>

        {/* View Switcher: Catalog vs My Past Orders */}
        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/90 shadow-2xs">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#1B4D2E]" />
              <span>Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'orders'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4 text-[#C85A32]" />
              <span>My Past Orders</span>
              {user && myOrders.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1B4D2E] text-white">
                  {myOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EQUIPMENT CATALOG                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Search & Categories Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none flex-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  !selectedCategory
                    ? 'bg-[#1B4D2E] text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                All Items ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === c.id
                      ? 'bg-[#1B4D2E] text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="w-full md:w-72 relative shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rackets, balls, shoes..."
                className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D2E]/20 focus:border-[#1B4D2E]"
              />
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-xl border border-slate-200">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-700">No equipment found</h4>
              <p className="text-xs text-slate-400 mt-1">Try another category or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((p) => {
                const rawStock = p.stock_qty ?? p.stockQty ?? p.stock
                const stock =
                  rawStock !== undefined && rawStock !== null
                    ? Number(rawStock)
                    : p.inStock === false
                    ? 0
                    : 99
                const cartItem = cartItems.find((i) => i.productId === p.id)
                const cartQty = cartItem?.qty || 0
                const isOutOfStock = p.inStock === false || stock <= 0
                const isMaxInBag = !isOutOfStock && cartQty >= stock

                return (
                  <Card
                    key={p.id}
                    hover
                    className="border-slate-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-44 bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="w-12 h-12 text-slate-300 stroke-1" />
                        )}
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[10px] font-mono text-slate-600 border border-slate-200">
                          {p.sku}
                        </span>

                        {isOutOfStock ? (
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                            Out of Stock
                          </span>
                        ) : isMaxInBag ? (
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold tracking-wider shadow-xs">
                            Max in Bag ({stock})
                          </span>
                        ) : stock <= (p.low_stock_threshold || 4) ? (
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                            Only {stock} left
                          </span>
                        ) : null}
                      </div>

                      <div className="p-4 space-y-1.5">
                        <h3 className="font-bold text-sm text-slate-900 line-clamp-1" title={p.name}>
                          {p.name}
                        </h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-extrabold text-[#1B4D2E] tabular-nums">
                            {formatCurrency(p.price)}
                          </span>
                          <span className="text-[10px] text-slate-400">Tax Incl.</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1">
                          {isOutOfStock ? (
                            <span className="text-rose-600 font-bold">Currently Out of Stock</span>
                          ) : isMaxInBag ? (
                            <span className="text-amber-700 font-medium">
                              All {stock} in equipment bag
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">
                              {stock} units available
                            </span>
                          )}
                          {cartQty > 0 && (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                              In bag: {cartQty}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <Button
                        variant={isOutOfStock ? 'outline' : isMaxInBag ? 'outline' : 'lawn'}
                        size="sm"
                        disabled={isOutOfStock || isMaxInBag}
                        className={`w-full gap-1.5 font-bold ${
                          isOutOfStock
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed hover:bg-slate-100'
                            : isMaxInBag
                            ? 'bg-amber-50 text-amber-800 border-amber-200 cursor-not-allowed hover:bg-amber-50'
                            : ''
                        }`}
                        onClick={() => handleAdd(p)}
                      >
                        {isOutOfStock ? (
                          'Out of Stock'
                        ) : isMaxInBag ? (
                          'Max Stock Reached'
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" /> Add to Bag
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MY PAST ORDERS                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {!user ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
                <Package className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-slate-900">Sign In to View Past Orders</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Sign in with your member account to see your order history, digital receipts, and track gear deliveries.
                </p>
              </div>
              <Link to="/login?redirect=/shop?tab=orders">
                <Button variant="lawn" className="gap-2 font-bold bg-[#1B4D2E] text-white">
                  Sign In to Member Portal <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          ) : loadingOrders ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))}
            </div>
          ) : myOrders.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 max-w-xl mx-auto space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#1B4D2E] border border-emerald-200 flex items-center justify-center mx-auto">
                <Package className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-900">No Past Equipment Orders</h3>
                <p className="text-xs text-slate-500">
                  You haven&rsquo;t placed any Pro Shop orders yet. Browse our tournament gear to grab official equipment!
                </p>
              </div>
              <Button
                variant="lawn"
                onClick={() => setActiveTab('catalog')}
                className="gap-2 bg-[#1B4D2E] text-white font-bold"
              >
                <ShoppingBag className="w-4 h-4" /> Browse Equipment Catalog
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Showing {myOrders.length} order{myOrders.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={fetchMyOrders}
                  className="text-xs font-semibold text-[#1B4D2E] hover:underline"
                >
                  Refresh Orders
                </button>
              </div>

              {myOrders.map((order) => {
                const isDelivery = order.fulfilment === 'delivery'
                const orderItems = order.items || []

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs hover:shadow-sm transition-all space-y-4"
                  >
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-sm shrink-0">
                          <Package className="w-5 h-5 text-[#1B4D2E]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-950">
                              {order.order_no || `#ORD-${order.id.slice(0, 8).toUpperCase()}`}
                            </span>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatDate(order.created_at)} at {formatTime(order.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                          {isDelivery ? (
                            <>
                              <Truck className="w-3.5 h-3.5 text-blue-600" />
                              Home Delivery
                            </>
                          ) : (
                            <>
                              <Store className="w-3.5 h-3.5 text-emerald-600" />
                              Club Pickup
                            </>
                          )}
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5"
                          onClick={() => setSelectedReceipt(order)}
                        >
                          <Receipt className="w-3.5 h-3.5 text-slate-600" />
                          Receipt
                        </Button>
                      </div>
                    </div>

                    {/* Ordered Items List */}
                    <div className="divide-y divide-slate-100">
                      {orderItems.map((item, idx) => (
                        <div key={item.id || idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name_snapshot}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ShoppingBag className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">
                                {item.name_snapshot || item.name || 'Pro Equipment Item'}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {item.qty} × {formatCurrency(item.unit_price)}
                              </p>
                            </div>
                          </div>

                          <span className="font-bold text-slate-900 tabular-nums shrink-0">
                            {formatCurrency(item.line_total || item.unit_price * item.qty)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Financial Footer */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        {isDelivery && order.delivery_address && (
                          <p className="text-[11px] text-slate-500">
                            <strong>Address:</strong> {order.delivery_address}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Payment: <strong className="capitalize">{order.payment_status || 'Paid'}</strong> via{' '}
                          <span className="uppercase">{order.payment_pref || 'Counter / Card'}</span>
                        </p>
                      </div>

                      <div className="flex items-baseline gap-2 sm:text-right">
                        <span className="text-slate-500">Total Paid:</span>
                        <span className="text-base sm:text-lg font-extrabold text-[#1B4D2E] tabular-nums">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIGITAL RECEIPT MODAL                                                     */}
      {/* ========================================================================= */}
      {selectedReceipt && (
        <Modal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          title="Equipment Purchase Receipt"
          subtitle={`The Champions Club Pro Shop • ${selectedReceipt.order_no || 'Receipt'}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 p-2 text-xs font-sans">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedReceipt.order_no}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(selectedReceipt.created_at)} • {formatTime(selectedReceipt.created_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fulfilment:</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {selectedReceipt.fulfilment === 'delivery' ? 'Home Delivery' : 'Club Pickup'}
                </span>
              </div>
              {selectedReceipt.delivery_address && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Address:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">
                    {selectedReceipt.delivery_address}
                  </span>
                </div>
              )}
            </div>

            {/* Items table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              <div className="p-2.5 bg-slate-100/70 font-bold text-[11px] text-slate-700 flex justify-between">
                <span>Item</span>
                <span>Amount</span>
              </div>
              {(selectedReceipt.items || []).map((it, idx) => (
                <div key={it.id || idx} className="p-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">
                      {it.name_snapshot || it.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {it.qty} × {formatCurrency(it.unit_price)}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {formatCurrency(it.line_total || it.unit_price * it.qty)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="tabular-nums font-semibold text-slate-800">
                  {formatCurrency(selectedReceipt.subtotal)}
                </span>
              </div>
              {Number(selectedReceipt.discount) > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Member Discount ({selectedReceipt.discount_pct}%)</span>
                  <span className="tabular-nums">-{formatCurrency(selectedReceipt.discount)}</span>
                </div>
              )}
              {Number(selectedReceipt.delivery_fee) > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Fee</span>
                  <span className="tabular-nums">{formatCurrency(selectedReceipt.delivery_fee)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-950 pt-2 border-t border-slate-200">
                <span>Total Paid</span>
                <span className="text-[#1B4D2E] tabular-nums">
                  {formatCurrency(selectedReceipt.total)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                variant="outline"
                className="w-full gap-1.5 text-xs font-semibold"
                onClick={() => window.print()}
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </Button>
              <Button
                variant="lawn"
                className="w-full bg-[#1B4D2E] text-white text-xs font-semibold"
                onClick={() => setSelectedReceipt(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Shop
