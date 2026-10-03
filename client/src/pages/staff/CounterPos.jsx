import React, { useState, useEffect } from 'react'
import shopService from '@/service/shopService'
import memberService from '@/service/memberService'
import { formatCurrency, formatDateTime } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardContent } from '@/components/ui/Card'
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  X,
  CreditCard,
  CheckCircle2,
  Printer,
  ShieldCheck,
} from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const CounterPos = () => {
  const toast = useToast()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCat, setSelectedCat] = useState('')
  const [search, setSearch] = useState('')
  const [cartItems, setCartItems] = useState([])

  // Member Attachment
  const [memberQuery, setMemberQuery] = useState('')
  const [matchedMembers, setMatchedMembers] = useState([])
  const [attachedMember, setAttachedMember] = useState(null)

  // Tender & Checkout
  const [tenderMethod, setTenderMethod] = useState('cash')
  const [quote, setQuote] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [completedOrder, setCompletedOrder] = useState(null)

  useEffect(() => {
    Promise.all([shopService.getCategories(), shopService.getProducts({ limit: 100 })])
      .then(([cats, prods]) => {
        setCategories(cats)
        setProducts(prods.items || [])
      })
      .catch(console.error)
  }, [])

  // Recalculate quote whenever items or attached member changes
  useEffect(() => {
    if (cartItems.length === 0) {
      setQuote(null)
      return
    }

    const fetchQuote = async () => {
      try {
        const q = await shopService.getQuote({
          items: cartItems.map((i) => ({ productId: i.id, qty: i.qty })),
          memberId: attachedMember?.id || undefined,
          fulfilment: 'in_store',
        })
        setQuote(q)
      } catch {
        // fallback
      }
    }
    fetchQuote()
  }, [cartItems, attachedMember])

  const handleMemberSearch = async (val) => {
    setMemberQuery(val)
    if (val.trim().length >= 2) {
      try {
        const res = await memberService.lookupMembers(val.trim())
        setMatchedMembers(res)
      } catch {
        // ignore
      }
    } else {
      setMatchedMembers([])
    }
  }

  const handleAddToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const handleUpdateQty = (id, delta) => {
    setCartItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    )
  }

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) return
    setSubmitting(true)

    try {
      const res = await shopService.createOrder({
        items: cartItems.map((i) => ({ productId: i.id, qty: i.qty })),
        fulfilment: 'in_store',
        memberId: attachedMember?.id || undefined,
        customerName: attachedMember ? attachedMember.fullName : 'Walk-in Counter Customer',
        paymentMethod: tenderMethod,
      })

      setCompletedOrder(res.order || res)
      toast.success('Sale completed and recorded in single revenue ledger!')
    } catch (err) {
      toast.error(err.message || 'Failed to process counter sale')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrintReceipt = () => {
    if (!completedOrder) return
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text('THE CHAMPIONS CLUB', 105, 18, { align: 'center' })
    doc.setFontSize(10)
    doc.text('Official Pro Shop Counter Receipt', 105, 24, { align: 'center' })
    doc.text(`Receipt No: ${completedOrder.orderNo}`, 14, 34)
    doc.text(`Date: ${formatDateTime(completedOrder.createdAt)}`, 14, 40)
    doc.text(`Customer: ${attachedMember?.fullName || 'Walk-in Customer'}`, 14, 46)
    doc.text(`Payment Tender: ${tenderMethod.toUpperCase()}`, 14, 52)

    const tableRows = (completedOrder.items || cartItems).map((i) => [
      i.name,
      i.qty,
      formatCurrency(i.unitPrice || i.price),
      formatCurrency((i.unitPrice || i.price) * i.qty),
    ])

    doc.autoTable({
      startY: 58,
      head: [['Item Description', 'Qty', 'Unit Price', 'Line Total']],
      body: tableRows,
      theme: 'grid',
    })

    const finalY = doc.lastAutoTable.finalY + 10
    doc.text(`Subtotal: ${formatCurrency(completedOrder.subtotal || quote?.subtotal)}`, 140, finalY)
    if (completedOrder.discount > 0 || quote?.discount > 0) {
      doc.text(`Member Discount: -${formatCurrency(completedOrder.discount || quote?.discount)}`, 140, finalY + 6)
    }
    doc.setFontSize(12)
    doc.text(`TOTAL PAID: ${formatCurrency(completedOrder.total || quote?.total)}`, 140, finalY + 14)

    doc.save(`Receipt-${completedOrder.orderNo}.pdf`)
  }

  const filteredProducts = products.filter((p) => {
    const matchesCat = !selectedCat || p.categoryId === selectedCat || p.category_id === selectedCat
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
          Front Desk POS
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Counter Shop Terminal
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Product Picker */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Scan SKU or search equipment..."
                className="w-full pl-9 pr-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D2E]/20"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCat('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  !selectedCat ? 'bg-[#1B4D2E] text-white font-bold' : 'bg-white border text-slate-600'
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCat(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    selectedCat === c.id ? 'bg-[#1B4D2E] text-white font-bold' : 'bg-white border text-slate-600'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => handleAddToCart(p)}
                className="p-3 bg-white rounded-xl border border-slate-200 hover:border-[#1B4D2E] hover:shadow-sm text-left flex flex-col justify-between transition-all group"
              >
                <div>
                  <span className="font-mono text-[10px] text-slate-400">{p.sku}</span>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-2 mt-0.5 group-hover:text-[#1B4D2E]">
                    {p.name}
                  </h4>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-extrabold text-xs text-[#1B4D2E] tabular-nums">
                    {formatCurrency(p.price)}
                  </span>
                  <span className="text-[10px] text-slate-400">Stock: {p.stockQty ?? p.stock_qty ?? 12}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Active Counter Cart */}
        <div className="space-y-4">
          <Card className="border-slate-200">
            <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Attached Member
                </span>
                {attachedMember && (
                  <button
                    onClick={() => setAttachedMember(null)}
                    className="text-[11px] text-rose-600 font-semibold"
                  >
                    Detach
                  </button>
                )}
              </div>

              {attachedMember ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-emerald-900 block">{attachedMember.fullName}</strong>
                    <span className="text-[10px] text-emerald-700 font-mono">{attachedMember.memberCode}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    15% Discount
                  </span>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={memberQuery}
                    onChange={(e) => handleMemberSearch(e.target.value)}
                    placeholder="Search member for discount..."
                    className="w-full pl-3 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  {matchedMembers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-36 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {matchedMembers.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setAttachedMember(m)
                            setMatchedMembers([])
                            setMemberQuery('')
                          }}
                          className="w-full p-2 text-left hover:bg-slate-50 flex justify-between"
                        >
                          <span className="font-bold text-slate-800">{m.fullName}</span>
                          <span className="text-slate-400 text-[10px] font-mono">{m.memberCode}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Line Items */}
            <CardContent className="p-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold">Cart is currently empty</p>
                  <p className="text-[10px]">Click any product from the catalog</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1 text-xs">
                  {cartItems.map((i) => (
                    <div key={i.id} className="py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 truncate">{i.name}</p>
                        <span className="text-[10px] text-slate-500 tabular-nums">
                          {formatCurrency(i.price)} × {i.qty}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleUpdateQty(i.id, -1)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-bold tabular-nums">{i.qty}</span>
                        <button
                          onClick={() => handleUpdateQty(i.id, 1)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Price Calculations */}
              {cartItems.length > 0 && (
                <div className="pt-3 border-t border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="tabular-nums font-medium text-slate-900">
                      {formatCurrency(quote?.subtotal || cartItems.reduce((a, b) => a + b.price * b.qty, 0))}
                    </span>
                  </div>
                  {quote?.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Member Discount ({quote.discountPct}%):</span>
                      <span className="tabular-nums">-{formatCurrency(quote.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Due:</span>
                    <span className="text-[#1B4D2E] tabular-nums">
                      {formatCurrency(quote?.total || cartItems.reduce((a, b) => a + b.price * b.qty, 0))}
                    </span>
                  </div>

                  {/* Tender Options */}
                  <div className="pt-3 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                      Tender Method
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['cash', 'upi', 'card'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTenderMethod(m)}
                          className={`py-1.5 rounded-lg text-xs font-bold uppercase border transition-all ${
                            tenderMethod === m
                              ? 'bg-[#1B4D2E] text-white border-[#1B4D2E]'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    <Button
                      variant="lawn"
                      size="lg"
                      loading={submitting}
                      onClick={handleCompleteSale}
                      className="w-full font-bold mt-2"
                    >
                      Complete Sale ({tenderMethod.toUpperCase()})
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Success Receipt Modal */}
          {completedOrder && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Sale Completed • {completedOrder.orderNo}</span>
              </div>
              <p className="text-slate-600">
                Amount Paid: <strong>{formatCurrency(completedOrder.total)}</strong> ({tenderMethod.toUpperCase()})
              </p>
              <div className="flex items-center gap-2">
                <Button variant="lawn" size="sm" icon={Printer} onClick={handlePrintReceipt}>
                  Print Receipt PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCompletedOrder(null)
                    setCartItems([])
                    setAttachedMember(null)
                  }}
                >
                  New Sale
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CounterPos
