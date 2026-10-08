import React, { useEffect, useState } from 'react'
import shopService from '@/service/shopService'
import { formatCurrency } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Package, AlertTriangle, Plus, Search, ArrowUpDown, CheckCircle2, Zap } from 'lucide-react'

export const ProductsAdmin = () => {
  const toast = useToast()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  // Stock Adjustment Modal
  const [adjustProduct, setAdjustProduct] = useState(null)
  const [adjustDelta, setAdjustDelta] = useState(5)
  const [adjustReason, setAdjustReason] = useState('restock')
  const [adjustNote, setAdjustNote] = useState('')
  const [adjusting, setAdjusting] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await shopService.getProducts({
        q: search || undefined,
        lowStock: lowStockOnly ? 'true' : undefined,
        limit: 100,
      })
      setProducts(res.items || [])
    } catch {
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 200)
    return () => clearTimeout(timer)
  }, [search, lowStockOnly])

  const handleAdjustStock = async (e) => {
    e.preventDefault()
    if (!adjustProduct || adjustDelta === 0) return

    setAdjusting(true)
    try {
      await shopService.adjustStock(adjustProduct.id, {
        delta: Number(adjustDelta),
        reason: adjustReason,
        note: adjustNote.trim() || undefined,
      })
      toast.success(`Updated stock for ${adjustProduct.name} (${adjustDelta > 0 ? '+' : ''}${adjustDelta})`)
      setAdjustProduct(null)
      fetchProducts()
    } catch (err) {
      toast.error(err.message || 'Failed to adjust stock')
    } finally {
      setAdjusting(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Inventory Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
            Shop Products & Stock
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Atomic shared stock across counter sales and online member orders.
          </p>
        </div>

        <button
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
            lowStockOnly
              ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-md shadow-[#CCFF00]/10'
              : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
          }`}
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${lowStockOnly ? 'text-black' : 'text-[#CCFF00]'}`} />
          <span>Low Stock Filter</span>
        </button>
      </div>

      {/* Search */}
      <div className="max-w-md relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by SKU or product name..."
          className="w-full pl-10 pr-3.5 py-2.5 bg-[#111418] rounded-xl border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00]/60 transition-colors"
        />
      </div>

      {/* Inventory Table */}
      <div className="rounded-3xl bg-[#111418] border border-white/10 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">Product & SKU</th>
                  <th className="py-3.5 px-5">Price</th>
                  <th className="py-3.5 px-5">Current Stock</th>
                  <th className="py-3.5 px-5">Threshold</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {products.map((p) => {
                  const stock = p.stockQty ?? p.stock_qty ?? 0
                  const threshold = p.lowStockThreshold ?? p.low_stock_threshold ?? 5
                  const isLow = stock <= threshold

                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-5">
                        <span className="font-bold text-white block">{p.name}</span>
                        <span className="font-mono text-[10px] text-[#CCFF00] font-bold">{p.sku}</span>
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-white tabular-nums">
                        {formatCurrency(p.price)}
                      </td>

                      <td className="py-3.5 px-5">
                        <span
                          className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg ${
                            isLow ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/10 text-white'
                          }`}
                        >
                          {stock} units
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-slate-400 font-mono">
                        ≤ {threshold}
                      </td>

                      <td className="py-3.5 px-5">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30 uppercase">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#CCFF00] bg-[#CCFF00]/10 px-2.5 py-0.5 rounded-full border border-[#CCFF00]/30 uppercase">
                            In Stock
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => {
                            setAdjustProduct(p)
                            setAdjustDelta(5)
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-[#CCFF00] hover:text-black transition-colors inline-flex items-center gap-1 border border-white/10 hover:border-[#CCFF00]"
                        >
                          <ArrowUpDown className="w-3 h-3" /> Adjust Stock
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={!!adjustProduct}
        onClose={() => setAdjustProduct(null)}
        title="Adjust Inventory Stock"
        subtitle={`${adjustProduct?.name} (${adjustProduct?.sku})`}
      >
        <form onSubmit={handleAdjustStock} className="space-y-4 py-2">
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex justify-between text-xs">
            <span className="text-slate-400">Current On-Hand Quantity:</span>
            <strong className="font-mono text-[#CCFF00] text-sm">
              {adjustProduct?.stockQty ?? adjustProduct?.stock_qty ?? 0} units
            </strong>
          </div>

          <Input
            label="Adjustment Delta (+ to add, - to subtract) *"
            type="number"
            value={adjustDelta}
            onChange={(e) => setAdjustDelta(parseInt(e.target.value, 10) || 0)}
            required
            helperText="e.g. +10 for fresh supplier shipment, -1 for floor damage"
          />

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Reason for Adjustment *
            </label>
            <select
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full py-2.5 px-3.5 bg-[#111418] rounded-xl border border-white/10 text-white text-xs focus:outline-none focus:border-[#CCFF00]/60 transition-colors"
            >
              <option value="restock" className="bg-[#111418] text-white">Restock from Supplier</option>
              <option value="adjustment" className="bg-[#111418] text-white">Stock Count Audit Correction</option>
              <option value="damage" className="bg-[#111418] text-white">Damaged or Expired Item</option>
              <option value="return" className="bg-[#111418] text-white">Customer Return</option>
            </select>
          </div>

          <Input
            label="Optional Audit Note"
            placeholder="e.g. Supplier PO #8841 received"
            value={adjustNote}
            onChange={(e) => setAdjustNote(e.target.value)}
          />

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setAdjustProduct(null)}>
              Cancel
            </Button>
            <Button variant="volt" type="submit" loading={adjusting} className="font-black uppercase text-xs">
              Commit Stock Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ProductsAdmin
