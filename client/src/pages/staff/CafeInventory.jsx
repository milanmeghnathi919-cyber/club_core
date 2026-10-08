import React, { useEffect, useState, useMemo } from 'react'
import cafeService from '@/service/cafeService'
import { formatCurrency } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import {
  Coffee,
  Utensils,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  AlertTriangle,
  Flame,
  Layers,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  Zap,
} from 'lucide-react'

const CAFE_CATEGORIES = [
  'All',
  'Coffee & Brews',
  'Protein Shakes',
  'Recovery Smoothies',
  'Fresh Juices',
  'Wellness Teas',
  'Protein Bowls',
  'Fresh Salads',
  'Artisan Toasts',
  'Gourmet Sandwiches',
  'Healthy Snacks',
]

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80'

export const CafeInventory = () => {
  const toast = useToast()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [stationFilter, setStationFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('all') // all, in_stock, out_of_stock

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'Coffee & Brews',
    price: '',
    taxRatePct: 5,
    station: 'bar',
    isAvailable: true,
    imageUrl: '',
  })
  const [saving, setSaving] = useState(false)

  // Delete Modal State
  const [deleteItemTarget, setDeleteItemTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchMenu = async () => {
    setLoading(true)
    try {
      const data = await cafeService.getMenuItems()
      setItems(data || [])
    } catch {
      toast.error('Failed to load café inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenu()
  }, [])

  const handleOpenAddModal = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      category: 'Coffee & Brews',
      price: '',
      taxRatePct: 5,
      station: 'bar',
      isAvailable: true,
      imageUrl: '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name || '',
      category: item.category || 'Coffee & Brews',
      price: item.price || '',
      taxRatePct: item.tax_rate_pct ?? item.taxRatePct ?? 5,
      station: item.station || 'bar',
      isAvailable: item.is_available ?? item.isAvailable ?? true,
      imageUrl: item.image_url || item.imageUrl || '',
    })
    setIsModalOpen(true)
  }

  const handleSaveItem = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.price) {
      toast.error('Please enter name and price')
    }

    setSaving(true)
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        price: Number(formData.price),
        taxRatePct: Number(formData.taxRatePct),
        station: formData.station,
        isAvailable: Boolean(formData.isAvailable),
        imageUrl: formData.imageUrl.trim() || DEFAULT_IMAGE,
      }

      if (editingItem) {
        await cafeService.updateMenuItem(editingItem.id, payload)
        toast.success(`Updated ${payload.name}`)
      } else {
        await cafeService.createMenuItem(payload)
        toast.success(`Added ${payload.name} to Café Inventory`)
      }

      setIsModalOpen(false)
      fetchMenu()
    } catch (err) {
      toast.error(err.message || 'Failed to save café item')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAvailability = async (item) => {
    const nextState = !(item.is_available ?? item.isAvailable ?? true)
    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, is_available: nextState, isAvailable: nextState } : i,
      ),
    )

    try {
      await cafeService.updateMenuItem(item.id, { isAvailable: nextState })
      toast.success(`${item.name} marked as ${nextState ? 'In Stock (Available)' : 'Out of Stock'}`)
    } catch {
      toast.error('Failed to update stock status')
      fetchMenu()
    }
  }

  const handleDeleteItem = async () => {
    if (!deleteItemTarget) return
    setDeleting(true)
    try {
      await cafeService.deleteMenuItem(deleteItemTarget.id)
      toast.success(`Removed ${deleteItemTarget.name}`)
      setDeleteItemTarget(null)
      fetchMenu()
    } catch {
      toast.error('Failed to remove item')
    } finally {
      setDeleting(false)
    }
  }

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())

      const matchesCat =
        selectedCategory === 'All' ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase()

      const isAvail = item.is_available ?? item.isAvailable ?? true
      const matchesAvail =
        availabilityFilter === 'all' ||
        (availabilityFilter === 'in_stock' && isAvail) ||
        (availabilityFilter === 'out_of_stock' && !isAvail)

      const matchesStation =
        stationFilter === 'all' ||
        item.station?.toLowerCase() === stationFilter.toLowerCase()

      return matchesSearch && matchesCat && matchesAvail && matchesStation
    })
  }, [items, search, selectedCategory, availabilityFilter, stationFilter])

  // Metrics
  const totalItems = items.length
  const inStockCount = items.filter((i) => i.is_available ?? i.isAvailable ?? true).length
  const outOfStockCount = totalItems - inStockCount
  const baristaCount = items.filter((i) => i.station === 'bar').length
  const kitchenCount = items.filter((i) => i.station === 'kitchen').length

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00] flex items-center gap-1.5">
            <Coffee className="w-3.5 h-3.5" /> Café Management & Dining
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
            Café Menu & Stock Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time food & beverage inventory, barista station routing, and kitchen stock status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchMenu}
            className="text-xs font-bold uppercase"
          >
            Refresh
          </Button>
          <Button
            variant="volt"
            size="sm"
            icon={Plus}
            onClick={handleOpenAddModal}
            className="font-black uppercase text-xs"
          >
            Add Café Item
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-[#111418] border border-white/10 p-5 shadow-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Items</p>
            <h3 className="text-2xl font-black font-mono text-white mt-1 tabular-nums">
              {totalItems}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#CCFF00]">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-3xl bg-[#111418] border border-white/10 p-5 shadow-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#CCFF00]">In Stock</p>
            <h3 className="text-2xl font-black font-mono text-[#CCFF00] mt-1 tabular-nums">
              {inStockCount}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 flex items-center justify-center text-[#CCFF00]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-3xl bg-[#111418] border border-white/10 p-5 shadow-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-400">Out of Stock</p>
            <h3 className="text-2xl font-black font-mono text-rose-400 mt-1 tabular-nums">
              {outOfStockCount}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-3xl bg-[#111418] border border-white/10 p-5 shadow-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Routing Stations</p>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold">
              <span className="px-2 py-0.5 rounded-full bg-[#CCFF00]/15 text-[#CCFF00] font-mono">{baristaCount} Bar</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-mono">{kitchenCount} Kitchen</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#CCFF00]">
            <Flame className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-[#111418] p-4 sm:p-5 rounded-3xl border border-white/10 shadow-2xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search dishes, coffee, smoothies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090B0E] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#CCFF00]/60 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-[#090B0E] rounded-xl border border-white/10 text-white focus:outline-none"
            >
              <option value="all">All Stations</option>
              <option value="bar">Barista Bar</option>
              <option value="kitchen">Kitchen Line</option>
            </select>

            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-[#090B0E] rounded-xl border border-white/10 text-white focus:outline-none"
            >
              <option value="all">All Availability</option>
              <option value="in_stock">In Stock Only</option>
              <option value="out_of_stock">Out of Stock Only</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          {CAFE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#CCFF00] text-black shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-16 text-center bg-[#111418] rounded-3xl border border-white/10 space-y-3 shadow-2xl">
          <Coffee className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-black uppercase tracking-tight text-white text-base">No café items matched your filter</h3>
          <p className="text-xs text-slate-400">Try adjusting your search keywords or category filters.</p>
          <Button variant="outline" size="sm" onClick={() => { setSearch(''); setSelectedCategory('All'); setStationFilter('all'); setAvailabilityFilter('all') }}>
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isAvailable = item.is_available ?? item.isAvailable ?? true
            const isDrink = item.station === 'bar'

            return (
              <div
                key={item.id}
                className={`bg-[#111418] rounded-3xl border transition-all overflow-hidden flex flex-col justify-between group hover:border-[#CCFF00]/50 hover:shadow-[0_0_20px_rgba(204,255,0,0.15)] duration-300 ${
                  isAvailable ? 'border-white/10' : 'border-rose-500/30 opacity-80'
                }`}
              >
                <div>
                  {/* Image */}
                  <div className="h-40 w-full bg-[#161a22] relative overflow-hidden">
                    <img
                      src={item.image_url || item.imageUrl || DEFAULT_IMAGE}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = DEFAULT_IMAGE
                      }}
                    />
                    {/* Badge */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-md ${
                          isDrink
                            ? 'bg-[#111418]/90 text-[#CCFF00] border border-[#CCFF00]/40'
                            : 'bg-[#111418]/90 text-blue-400 border border-blue-400/40'
                        }`}
                      >
                        {isDrink ? 'Barista' : 'Kitchen'}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/80 text-white backdrop-blur-md border border-white/10">
                        GST {item.tax_rate_pct ?? item.taxRatePct ?? 5}%
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1 shadow-md ${
                          isAvailable
                            ? 'bg-[#CCFF00] text-black'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {isAvailable ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.category}
                    </span>
                    <h4 className="font-black uppercase tracking-tight text-sm text-white line-clamp-1 group-hover:text-[#CCFF00] transition-colors" title={item.name}>
                      {item.name}
                    </h4>
                    <p className="text-base font-black font-mono text-[#CCFF00] tabular-nums">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-3 border-t border-white/10 bg-white/5 flex items-center justify-between gap-2">
                  {/* Stock Toggle Switch */}
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border transition-all ${
                      isAvailable
                        ? 'bg-[#CCFF00]/15 text-[#CCFF00] border-[#CCFF00]/40 hover:bg-[#CCFF00] hover:text-black'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500 hover:text-white'
                    }`}
                    title="Click to toggle availability"
                  >
                    {isAvailable ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>In Stock</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Out of Stock</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteItemTarget(item)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Café Item' : 'Add New Café Item'}
        subtitle="Manage recipe dish pricing, routing station, and GST categorization."
      >
        <form onSubmit={handleSaveItem} className="space-y-4 py-2">
          <Input
            label="Item Name *"
            placeholder="e.g. Avocado Toast with Poached Eggs"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Menu Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full py-2.5 px-3 bg-[#111418] rounded-xl border border-white/10 text-white text-xs focus:outline-none"
              >
                {CAFE_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c} className="bg-[#111418] text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Station Routing *
              </label>
              <select
                value={formData.station}
                onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                className="w-full py-2.5 px-3 bg-[#111418] rounded-xl border border-white/10 text-white text-xs focus:outline-none"
              >
                <option value="bar" className="bg-[#111418] text-white">Barista Bar Station</option>
                <option value="kitchen" className="bg-[#111418] text-white">Kitchen Prep Line</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Selling Price (INR) *"
              type="number"
              placeholder="e.g. 240"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                GST Tax Rate *
              </label>
              <select
                value={formData.taxRatePct}
                onChange={(e) => setFormData({ ...formData, taxRatePct: e.target.value })}
                className="w-full py-2.5 px-3 bg-[#111418] rounded-xl border border-white/10 text-white text-xs focus:outline-none"
              >
                <option value={5} className="bg-[#111418] text-white">5% (F&B / Prepared Food)</option>
                <option value={18} className="bg-[#111418] text-white">18% (Packaged Beverages / Mocktails)</option>
              </select>
            </div>
          </div>

          <Input
            label="Image URL (Unsplash / CDN)"
            placeholder="https://images.unsplash.com/..."
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isAvailableCheckbox"
              checked={formData.isAvailable}
              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              className="w-4 h-4 rounded text-[#CCFF00] focus:ring-[#CCFF00]"
            />
            <label htmlFor="isAvailableCheckbox" className="text-xs font-bold text-slate-300">
              Immediately Available on POS & Kitchen Display
            </label>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="volt" type="submit" loading={saving} className="font-black uppercase text-xs">
              {editingItem ? 'Save Changes' : 'Add to Menu'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteItemTarget}
        onClose={() => setDeleteItemTarget(null)}
        title="Delete Café Item?"
        subtitle={`Are you sure you want to remove "${deleteItemTarget?.name}" from the active café catalog?`}
      >
        <div className="py-2 space-y-4">
          <p className="text-xs text-slate-400">
            This will permanently remove this item from the Café POS and Kitchen Queue. Past orders and sales history will remain unaffected.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteItemTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteItem}
              loading={deleting}
              className="font-bold uppercase text-xs"
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CafeInventory
