import React, { useState, useEffect } from 'react'
import shopService from '@/service/shopService'
import memberService from '@/service/memberService'
import { formatCurrency, formatDateTime } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
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
  Flame,
  Zap,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

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
    try {
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

      autoTable(doc, {
        startY: 58,
        head: [['Item Description', 'Qty', 'Unit Price', 'Line Total']],
        body: tableRows,
        theme: 'grid',
      })

      const finalY = (doc.lastAutoTable?.finalY ?? 58) + 10
      doc.text(`Subtotal: ${formatCurrency(completedOrder.subtotal || quote?.subtotal)}`, 140, finalY)
      if (completedOrder.discount > 0 || quote?.discount > 0) {
        doc.text(`Member Discount: -${formatCurrency(completedOrder.discount || quote?.discount)}`, 140, finalY + 6)
      }
      doc.setFontSize(12)
      doc.text(`TOTAL PAID: ${formatCurrency(completedOrder.total || quote?.total)}`, 140, finalY + 14)

      doc.save(`Receipt-${completedOrder.orderNo}.pdf`)
      toast.success('Receipt PDF downloaded')
    } catch (err) {
      console.error('POS Receipt PDF error:', err)
      toast.error('Failed to generate Receipt PDF')
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchesCat = !selectedCat || p.categoryId === selectedCat || p.category_id === selectedCat
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-white/10 pb-4">
        <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00] flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> Front Desk POS
        </span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
          Counter Shop Terminal
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Product Picker */}
        <div className="lg:col-span-2 space-y-4">
          {/* Emergency Match-Ready Quick Action */}
          <div className="p-4 bg-[#111418] border border-[#CCFF00]/30 rounded-3xl flex items-center justify-between gap-4 text-xs shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#CCFF00]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-[#CCFF00] text-black flex items-center justify-center font-bold shrink-0 shadow-lg">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black uppercase tracking-tight text-white leading-tight">
                  Pre-Match Restringing & Quick Grips
                </h4>
                <p className="text-[11px] text-slate-400">
                  Snapped string 10 mins before match? Instant racket checkout or replacement grip.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 relative z-10">
              <button
                type="button"
                onClick={() => {
                  const matchBall = products.find((p) => p.sku === 'DUN-FORT-3') || products[0]
                  if (matchBall) handleAddToCart(matchBall)
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                + Match Balls
              </button>
              <button
                type="button"
                onClick={() => {
                  const grip = products.find((p) => p.sku === 'TRN-GRP-3') || products[1]
                  if (grip) handleAddToCart(grip)
                }}
                className="px-3 py-1.5 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black uppercase tracking-wider text-[11px] transition-colors cursor-pointer shadow-md"
              >
                + Tourna Grip
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Scan SKU or search equipment..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#111418] rounded-xl border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00]/60 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCat('')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  !selectedCat ? 'bg-[#CCFF00] text-black shadow-md' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCat(c.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                    selectedCat === c.id ? 'bg-[#CCFF00] text-black shadow-md' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
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
                className="p-4 bg-[#111418] rounded-2xl border border-white/10 hover:border-[#CCFF00]/50 hover:shadow-[0_0_20px_rgba(204,255,0,0.15)] text-left flex flex-col justify-between transition-all group duration-300"
              >
                <div>
                  <span className="font-mono text-[10px] text-[#CCFF00] font-bold">{p.sku}</span>
                  <h4 className="font-black uppercase tracking-tight text-xs text-white line-clamp-2 mt-1 group-hover:text-[#CCFF00] transition-colors">
                    {p.name}
                  </h4>
                </div>
                <div className="mt-4 flex items-baseline justify-between pt-2 border-t border-white/5">
                  <span className="font-mono font-black text-xs text-[#CCFF00] tabular-nums">
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
          <div className="rounded-3xl bg-[#111418] border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs uppercase tracking-wider text-slate-300">
                  Attached Member
                </span>
                {attachedMember && (
                  <button
                    onClick={() => setAttachedMember(null)}
                    className="text-[11px] text-rose-400 font-bold hover:underline"
                  >
                    Detach
                  </button>
                )}
              </div>

              {attachedMember ? (
                <div className="p-3 bg-[#CCFF00]/10 border border-[#CCFF00]/30 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-white block font-bold">{attachedMember.fullName}</strong>
                    <span className="text-[10px] text-[#CCFF00] font-mono font-bold">{attachedMember.memberCode}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#CCFF00] text-black text-[10px] font-black uppercase">
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
                    className="w-full pl-3.5 pr-3.5 py-2 bg-[#111418] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00]/60 transition-colors"
                  />
                  {matchedMembers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#161a22] border border-white/15 rounded-xl shadow-2xl z-20 max-h-36 overflow-y-auto divide-y divide-white/10 text-xs">
                      {matchedMembers.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setAttachedMember(m)
                            setMatchedMembers([])
                            setMemberQuery('')
                          }}
                          className="w-full p-2.5 text-left hover:bg-white/5 flex justify-between"
                        >
                          <span className="font-bold text-white">{m.fullName}</span>
                          <span className="text-[#CCFF00] text-[10px] font-mono">{m.memberCode}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="p-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cart is currently empty</p>
                  <p className="text-[10px] text-slate-500">Click any product from the catalog</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10 max-h-56 overflow-y-auto pr-1 text-xs">
                  {cartItems.map((i) => (
                    <div key={i.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white truncate">{i.name}</p>
                        <span className="text-[10px] font-mono text-[#CCFF00] tabular-nums">
                          {formatCurrency(i.price)} × {i.qty}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleUpdateQty(i.id, -1)}
                          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-mono font-bold text-white tabular-nums">{i.qty}</span>
                        <button
                          onClick={() => handleUpdateQty(i.id, 1)}
                          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
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
                <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="tabular-nums font-mono font-bold text-white">
                      {formatCurrency(quote?.subtotal || cartItems.reduce((a, b) => a + b.price * b.qty, 0))}
                    </span>
                  </div>
                  {quote?.discount > 0 && (
                    <div className="flex justify-between text-[#CCFF00] font-bold">
                      <span>Member Discount ({quote.discountPct}%):</span>
                      <span className="tabular-nums font-mono">-{formatCurrency(quote.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-white pt-2.5 border-t border-white/10 uppercase tracking-tight">
                    <span>Total Due:</span>
                    <span className="text-[#CCFF00] font-mono tabular-nums text-base">
                      {formatCurrency(quote?.total || cartItems.reduce((a, b) => a + b.price * b.qty, 0))}
                    </span>
                  </div>

                  {/* Tender Options */}
                  <div className="pt-3 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Tender Method
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {['cash', 'upi', 'card'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTenderMethod(m)}
                          className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            tenderMethod === m
                              ? 'bg-[#CCFF00] text-black shadow-md'
                              : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    <Button
                      variant="volt"
                      size="lg"
                      loading={submitting}
                      onClick={handleCompleteSale}
                      className="w-full font-black uppercase tracking-wider text-xs mt-2"
                    >
                      Complete Sale ({tenderMethod.toUpperCase()})
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Success Receipt Modal */}
          {completedOrder && (
            <div className="p-5 bg-[#CCFF00]/10 border border-[#CCFF00]/40 rounded-3xl space-y-3.5 text-xs shadow-2xl animate-in fade-in">
              <div className="flex items-center gap-2 text-[#CCFF00] font-black uppercase">
                <CheckCircle2 className="w-5 h-5 text-[#CCFF00]" />
                <span>Sale Completed • {completedOrder.orderNo}</span>
              </div>
              <p className="text-slate-300">
                Amount Paid: <strong className="font-mono text-[#CCFF00] font-bold">{formatCurrency(completedOrder.total)}</strong> ({tenderMethod.toUpperCase()})
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button variant="volt" size="sm" icon={Printer} onClick={handlePrintReceipt} className="font-black uppercase text-xs">
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
                  className="font-bold uppercase text-xs"
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
