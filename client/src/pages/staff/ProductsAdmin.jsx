import React, { useEffect, useState } from 'react'
import shopService from '@/service/shopService'
import { formatCurrency } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card, { CardContent } from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Package, AlertTriangle, Plus, Search, Edit3, ArrowUpDown, CheckCircle2 } from 'lucide-react'

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
            Inventory Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Shop Products & Stock
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Atomic shared stock across counter sales and online member orders.
          </p>
        </div>

        <button
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            lowStockOnly
              ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Low Stock Filter Only</span>
        </button>
      </div>

      {/* Search */}
      <div className="max-w-md relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by SKU or product name..."
          className="w-full pl-9 pr-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D2E]/20"
        />
      </div>

      {/* Inventory Table */}
      <Card className="border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Product & SKU</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const stock = p.stockQty ?? p.stock_qty ?? 0
                  const threshold = p.lowStockThreshold ?? p.low_stock_threshold ?? 5
                  const isLow = stock <= threshold

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{p.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">{p.sku}</span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                        {formatCurrency(p.price)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-md ${
                            isLow ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-900'
                          }`}
                        >
                          {stock} units
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono">
                        ≤ {threshold}
                      </td>

                      <td className="py-3 px-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                            In Stock
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={ArrowUpDown}
                          onClick={() => {
                            setAdjustProduct(p)
                            setAdjustDelta(5)
                          }}
                          className="text-xs"
                        >
                          Adjust Stock
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={!!adjustProduct}
        onClose={() => setAdjustProduct(null)}
        title="Adjust Inventory Stock"
        subtitle={`${adjustProduct?.name} (${adjustProduct?.sku})`}
      >
        <form onSubmit={handleAdjustStock} className="space-y-4 py-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between text-xs">
            <span className="text-slate-500">Current On-Hand Quantity:</span>
            <strong className="font-mono text-slate-900 text-sm">
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

          <Select
            label="Reason for Adjustment *"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
          >
            <option value="restock">Restock from Supplier</option>
            <option value="adjustment">Stock Count Audit Correction</option>
            <option value="damage">Damaged or Expired Item</option>
            <option value="return">Customer Return</option>
          </Select>

          <Input
            label="Optional Audit Note"
            placeholder="e.g. Supplier PO #8841 received"
            value={adjustNote}
            onChange={(e) => setAdjustNote(e.target.value)}
          />

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setAdjustProduct(null)}>
              Cancel
            </Button>
            <Button variant="lawn" type="submit" loading={adjusting} className="font-bold">
              Commit Stock Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ProductsAdmin
