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
  Package,
  Store,
  Truck,
  Clock,
  Receipt,
  ArrowRight,
  Printer,
  Download,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import Button from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import Modal from '@/components/ui/Modal'
import useToast from '@/components/ui/Toast'
import FakePaymentModal from '@/components/common/FakePaymentModal'

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
  const [paymentTargetOrder, setPaymentTargetOrder] = useState(null)
  const [brokenImageIds, setBrokenImageIds] = useState(() => new Set())

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

  // Filter out any products that lack an image or whose image failed to load
  const filteredProducts = products.filter((p) => {
    const img = p.imageUrl || p.image_url
    const hasImage = Boolean(img && img.trim() !== '')
    if (!hasImage || brokenImageIds.has(p.id)) return false

    const matchesCat =
      !selectedCategory || p.categoryId === selectedCategory || p.category_id === selectedCategory
    const matchesSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  const handleDownloadOrderPdf = (order) => {
    if (!order) return
    try {
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text('THE CHAMPIONS CLUB', 105, 18, { align: 'center' })
      doc.setFontSize(10)
      doc.text('Official Pro Shop Equipment Receipt', 105, 24, { align: 'center' })
      doc.text(`Receipt No: ${order.order_no || order.orderNo || 'ORD'}`, 14, 34)
      doc.text(`Date: ${formatDate(order.created_at)} ${formatTime(order.created_at)}`, 14, 40)
      doc.text(`Customer: ${user?.name || user?.full_name || 'Club Member'}`, 14, 46)
      doc.text(`Fulfilment: ${order.fulfilment === 'delivery' ? 'Home Delivery' : 'Club Reception Pickup'}`, 14, 52)
      doc.text(`Payment Status: ${(order.payment_status || 'Paid').toUpperCase()}`, 14, 58)

      const tableRows = (order.items || []).map((it) => [
        it.product_name || it.name || 'Pro Equipment Item',
        it.qty || 1,
        formatCurrency(it.unit_price || it.unitPrice || 0),
        formatCurrency((it.unit_price || it.unitPrice || 0) * (it.qty || 1)),
      ])

      autoTable(doc, {
        startY: 64,
        head: [['Item Description', 'Qty', 'Unit Rate', 'Line Total']],
        body: tableRows.length > 0 ? tableRows : [['Pro Equipment Item', '1', formatCurrency(order.total), formatCurrency(order.total)]],
        theme: 'grid',
      })

      const finalY = (doc.lastAutoTable?.finalY ?? 64) + 10
      doc.text(`Subtotal: ${formatCurrency(order.subtotal || order.total)}`, 140, finalY)
      if (Number(order.discount) > 0) {
        doc.text(`Member Discount: -${formatCurrency(order.discount)}`, 140, finalY + 6)
      }
      if (Number(order.delivery_fee) > 0) {
        doc.text(`Delivery Fee: ${formatCurrency(order.delivery_fee)}`, 140, finalY + 12)
      }
      doc.setFontSize(12)
      doc.text(`TOTAL PAID: ${formatCurrency(order.total)}`, 140, finalY + 20)

      doc.save(`Receipt-${order.order_no || 'Order'}.pdf`)
      toast.success('Official Receipt PDF downloaded')
    } catch (err) {
      console.error('PDF error:', err)
      toast.error('Failed to generate PDF receipt')
    }
  }

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
      delivered: { text: 'Delivered', bg: 'bg-[#CCFF00]/20 text-[#CCFF00] border-[#CCFF00]/40' },
      completed: { text: 'Completed', bg: 'bg-[#CCFF00]/20 text-[#CCFF00] border-[#CCFF00]/40' },
      confirmed: { text: 'Confirmed', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
      ready: { text: 'Ready for Pickup', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
      pending: { text: 'Pending', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
      cancelled: { text: 'Cancelled', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    }
    const match = map[status?.toLowerCase()] || {
      text: status || 'Pending',
      bg: 'bg-white/10 text-slate-300 border-white/20',
    }
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${match.bg}`}
      >
        {match.text}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#CCFF00] text-black">
            Official Equipment Hub
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white mt-3">
            Pro Shop & Championship Gear
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tournament-grade tennis rackets, padel bats, feather shuttles, and club apparel backed by real-time inventory.
          </p>
        </div>

        {/* View Switcher: Catalog vs My Past Orders (Shown when user is logged in) */}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="inline-flex p-1 bg-[#111418] rounded-2xl border border-white/10 shadow-2xs">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                  activeTab === 'catalog'
                    ? 'bg-[#CCFF00] text-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Catalog</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                  activeTab === 'orders'
                    ? 'bg-[#CCFF00] text-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>My Past Orders</span>
                {myOrders.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-black text-[#CCFF00]">
                    {myOrders.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <Link to="/login?redirect=/shop?tab=orders">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 text-xs font-semibold text-slate-300 hover:border-[#CCFF00] hover:text-[#CCFF00] transition-colors">
              <Package className="w-3.5 h-3.5" />
              <span>Sign in to view past orders</span>
            </button>
          </Link>
        )}
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  !selectedCategory
                    ? 'bg-[#CCFF00] text-black shadow-sm'
                    : 'bg-[#111418] text-slate-300 border border-white/10 hover:border-[#CCFF00]/40 hover:text-white'
                }`}
              >
                All Items ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === c.id
                      ? 'bg-[#CCFF00] text-black shadow-sm'
                      : 'bg-[#111418] text-slate-300 border border-white/10 hover:border-[#CCFF00]/40 hover:text-white'
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
                placeholder="Search rackets, balls, gear..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-[#0D1117] rounded-xl border border-white/15 text-xs sm:text-sm text-white placeholder-slate-500 transition-all focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]"
              />
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-xl bg-white/5" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-16 text-center bg-[#111418] rounded-2xl border border-white/10">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="font-bold text-white text-base">No equipment found</h4>
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
                  <div
                    key={p.id}
                    className="bg-[#111418] border border-white/10 hover:border-[#CCFF00]/60 hover:shadow-[0_0_25px_rgba(204,255,0,0.18)] transition-all rounded-2xl flex flex-col justify-between overflow-hidden group"
                  >
                    <div>
                      <div className="h-44 bg-[#090B0E] relative overflow-hidden flex items-center justify-center border-b border-white/10">
                        <img
                          src={p.imageUrl || p.image_url}
                          alt={p.name}
                          onError={() => setBrokenImageIds((prev) => new Set(prev).add(p.id))}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-mono text-[#CCFF00] border border-white/10">
                          {p.sku}
                        </span>

                        {isOutOfStock ? (
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase tracking-wider">
                            Out of Stock
                          </span>
                        ) : isMaxInBag ? (
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold tracking-wider">
                            Max in Bag ({stock})
                          </span>
                        ) : stock <= (p.low_stock_threshold || 4) ? (
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                            Only {stock} left
                          </span>
                        ) : null}
                      </div>

                      <div className="p-4 space-y-2">
                        <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-[#CCFF00] transition-colors" title={p.name}>
                          {p.name}
                        </h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-[#CCFF00] font-mono tabular-nums">
                            {formatCurrency(p.price)}
                          </span>
                          <span className="text-[10px] text-slate-400">Tax Incl.</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1">
                          {isOutOfStock ? (
                            <span className="text-rose-400 font-bold">Currently Out of Stock</span>
                          ) : isMaxInBag ? (
                            <span className="text-amber-400 font-medium">
                              All {stock} in equipment bag
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">
                              {stock} units available
                            </span>
                          )}
                          {cartQty > 0 && (
                            <span className="text-[#CCFF00] font-bold bg-[#CCFF00]/10 border border-[#CCFF00]/30 px-1.5 py-0.5 rounded">
                              In bag: {cartQty}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <Button
                        variant={isOutOfStock || isMaxInBag ? 'outline' : 'volt'}
                        size="sm"
                        disabled={isOutOfStock || isMaxInBag}
                        className="w-full gap-1.5 font-bold"
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
                  </div>
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
            <div className="p-12 text-center bg-[#111418] rounded-2xl border border-white/10 max-w-lg mx-auto space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 flex items-center justify-center mx-auto">
                <Package className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-white">Sign In to View Past Orders</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Sign in with your member account to see your order history, digital receipts, and track gear deliveries.
                </p>
              </div>
              <Link to="/login?redirect=/shop?tab=orders">
                <Button variant="volt" className="gap-2 font-bold">
                  Sign In to Member Portal <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          ) : loadingOrders ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : myOrders.length === 0 ? (
            <div className="p-16 text-center bg-[#111418] rounded-2xl border border-white/10 max-w-xl mx-auto space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 flex items-center justify-center mx-auto">
                <Package className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-white">No Past Equipment Orders</h3>
                <p className="text-xs text-slate-400">
                  You haven&rsquo;t placed any Pro Shop orders yet. Browse our tournament gear to grab official equipment!
                </p>
              </div>
              <Button
                variant="volt"
                onClick={() => setActiveTab('catalog')}
                className="gap-2 font-bold"
              >
                <ShoppingBag className="w-4 h-4" /> Browse Equipment Catalog
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Showing {myOrders.length} order{myOrders.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={fetchMyOrders}
                  className="text-xs font-semibold text-[#CCFF00] hover:underline"
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
                    className="bg-[#111418] rounded-2xl border border-white/10 p-5 sm:p-6 hover:border-white/20 transition-all space-y-4"
                  >
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 text-[#CCFF00] flex items-center justify-center font-bold text-sm shrink-0 border border-white/10">
                          <Package className="w-5 h-5 text-[#CCFF00]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-white">
                              {order.order_no || `#ORD-${order.id.slice(0, 8).toUpperCase()}`}
                            </span>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {formatDate(order.created_at)} at {formatTime(order.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 text-slate-300 border border-white/10">
                          {isDelivery ? (
                            <>
                              <Truck className="w-3.5 h-3.5 text-blue-400" />
                              Home Delivery
                            </>
                          ) : (
                            <>
                              <Store className="w-3.5 h-3.5 text-[#CCFF00]" />
                              Club Pickup
                            </>
                          )}
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5"
                          onClick={() => handleDownloadOrderPdf(order)}
                          title="Download Receipt PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-[#CCFF00]" />
                          PDF
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5"
                          onClick={() => setSelectedReceipt(order)}
                        >
                          <Receipt className="w-3.5 h-3.5 text-slate-300" />
                          Receipt
                        </Button>
                      </div>
                    </div>

                    {/* Ordered Items List */}
                    <div className="divide-y divide-white/5">
                      {orderItems.map((item, idx) => (
                        <div key={item.id || idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-[#090B0E] border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name_snapshot}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ShoppingBag className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">
                                {item.name_snapshot || item.name || 'Pro Equipment Item'}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {item.qty} × {formatCurrency(item.unit_price)}
                              </p>
                            </div>
                          </div>

                          <span className="font-mono font-bold text-[#CCFF00] tabular-nums shrink-0">
                            {formatCurrency(item.line_total || item.unit_price * item.qty)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Financial Footer */}
                    <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        {isDelivery && order.delivery_address && (
                          <p className="text-[11px] text-slate-400">
                            <strong className="text-slate-300">Address:</strong> {order.delivery_address}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Payment: <strong className="capitalize text-slate-200">{order.payment_status || 'Paid'}</strong> via{' '}
                          <span className="uppercase text-slate-300">{order.payment_pref || 'Counter / Card'}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-baseline gap-2 sm:text-right">
                          <span className="text-slate-400">
                            {order.payment_status === 'paid' ? 'Total Paid:' : 'Total Amount:'}
                          </span>
                          <span className="text-base sm:text-lg font-black text-[#CCFF00] font-mono tabular-nums">
                            {formatCurrency(order.total)}
                          </span>
                        </div>

                        {order.payment_status !== 'paid' && (
                          <Button
                            size="xs"
                            variant="volt"
                            className="font-bold cursor-pointer shrink-0"
                            onClick={() => setPaymentTargetOrder(order)}
                          >
                            Pay Online (Simulate)
                          </Button>
                        )}
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
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono font-bold text-white">
                  {selectedReceipt.order_no}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date & Time:</span>
                <span className="font-semibold text-slate-200">
                  {formatDate(selectedReceipt.created_at)} • {formatTime(selectedReceipt.created_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fulfilment:</span>
                <span className="font-semibold text-slate-200 capitalize">
                  {selectedReceipt.fulfilment === 'delivery' ? 'Home Delivery' : 'Club Pickup'}
                </span>
              </div>
              {selectedReceipt.delivery_address && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Address:</span>
                  <span className="font-semibold text-slate-200 text-right max-w-[200px] truncate">
                    {selectedReceipt.delivery_address}
                  </span>
                </div>
              )}
            </div>

            {/* Items table */}
            <div className="border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5">
              <div className="p-2.5 bg-white/5 font-bold text-[11px] text-slate-300 flex justify-between">
                <span>Item</span>
                <span>Amount</span>
              </div>
              {(selectedReceipt.items || []).map((it, idx) => (
                <div key={it.id || idx} className="p-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white block">
                      {it.name_snapshot || it.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {it.qty} × {formatCurrency(it.unit_price)}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[#CCFF00] tabular-nums">
                    {formatCurrency(it.line_total || it.unit_price * it.qty)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1.5 pt-2 border-t border-white/10 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="tabular-nums font-semibold text-slate-200">
                  {formatCurrency(selectedReceipt.subtotal)}
                </span>
              </div>
              {Number(selectedReceipt.discount) > 0 && (
                <div className="flex justify-between text-[#CCFF00] font-semibold">
                  <span>Member Discount ({selectedReceipt.discount_pct}%)</span>
                  <span className="tabular-nums">-{formatCurrency(selectedReceipt.discount)}</span>
                </div>
              )}
              {Number(selectedReceipt.delivery_fee) > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Fee</span>
                  <span className="tabular-nums">{formatCurrency(selectedReceipt.delivery_fee)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-white/10">
                <span>Total Paid</span>
                <span className="text-[#CCFF00] font-mono tabular-nums">
                  {formatCurrency(selectedReceipt.total)}
                </span>
              </div>
            </div>

            {selectedReceipt.payment_status !== 'paid' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-amber-300 block">Payment Pending</span>
                  <span className="text-[11px] text-amber-400">Simulate online payment now</span>
                </div>
                <Button
                  size="xs"
                  variant="volt"
                  className="font-bold"
                  onClick={() => {
                    setPaymentTargetOrder(selectedReceipt)
                  }}
                >
                  Pay Now (Simulate)
                </Button>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                variant="volt"
                className="w-full gap-1.5 text-xs font-bold"
                onClick={() => handleDownloadOrderPdf(selectedReceipt)}
              >
                <Download className="w-3.5 h-3.5" /> Download PDF Receipt
              </Button>
              <Button
                variant="outline"
                className="w-full gap-1.5 text-xs font-semibold"
                onClick={() => window.print()}
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
              <Button
                variant="ghost"
                className="w-full text-xs font-semibold"
                onClick={() => setSelectedReceipt(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {paymentTargetOrder && (
        <FakePaymentModal
          isOpen={Boolean(paymentTargetOrder)}
          onClose={() => setPaymentTargetOrder(null)}
          amount={paymentTargetOrder.total || 0}
          title={`Pro Shop Order #${paymentTargetOrder.order_no || paymentTargetOrder.orderNo || paymentTargetOrder.id?.slice(0, 8)}`}
          description="Instant sports equipment checkout simulation"
          sourceType="shop_order"
          sourceId={paymentTargetOrder.id}
          customerName={user?.name || user?.full_name || 'Valued Member'}
          onSuccess={() => {
            fetchMyOrders()
            if (selectedReceipt && selectedReceipt.id === paymentTargetOrder.id) {
              setSelectedReceipt((r) => ({ ...r, payment_status: 'paid' }))
            }
            setPaymentTargetOrder(null)
          }}
        />
      )}
    </div>
  )
}

export default Shop
