import React, { useEffect, useState, useMemo } from 'react'
import cafeService from '@/service/cafeService'
import { formatCurrency } from '@/utils/format'
import useToast from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
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
      return
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E] flex items-center gap-1.5">
            <Coffee className="w-3.5 h-3.5" /> Café Management & Dining
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Café Menu & Stock Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time food & beverage inventory, barista station routing, and kitchen stock status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchMenu}
            className="text-slate-600 hover:text-slate-900"
          >
            Refresh
          </Button>
          <Button
            variant="lawn"
            size="sm"
            icon={Plus}
            onClick={handleOpenAddModal}
            className="font-bold shadow-xs"
          >
            Add Café Item
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200/90 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Café Items</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5 tabular-nums">
                {totalItems}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Layers className="w-5 h-5 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-700">In Stock (Available)</p>
              <h3 className="text-2xl font-black text-emerald-800 mt-0.5 tabular-nums">
                {inStockCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-200/60">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-rose-700">Stock Depleted</p>
              <h3 className="text-2xl font-black text-rose-800 mt-0.5 tabular-nums">
                {outOfStockCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-700 border border-rose-200/60">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-700">Routing Stations</p>
              <h3 className="text-xs font-bold text-slate-800 mt-1 space-x-1">
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">{baristaCount} Barista</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">{kitchenCount} Kitchen</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-200/60">
              <Flame className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search dishes, coffee, smoothies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4D2E]/20 focus:border-[#1B4D2E]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="text-xs py-1.5"
            >
              <option value="all">All Stations</option>
              <option value="bar">Barista Bar</option>
              <option value="kitchen">Kitchen Line</option>
            </Select>

            <Select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="text-xs py-1.5"
            >
              <option value="all">All Availability</option>
              <option value="in_stock">In Stock Only</option>
              <option value="out_of_stock">Out of Stock Only</option>
            </Select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          {CAFE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#1B4D2E] text-white shadow-2xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
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
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Coffee className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No café items matched your filter</h3>
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
                className={`bg-white rounded-xl border transition-all overflow-hidden flex flex-col justify-between group hover:shadow-md ${
                  isAvailable ? 'border-slate-200' : 'border-rose-200 bg-rose-50/20 opacity-90'
                }`}
              >
                <div>
                  {/* Image */}
                  <div className="h-36 w-full bg-slate-100 relative overflow-hidden">
                    <img
                      src={item.image_url || item.imageUrl || DEFAULT_IMAGE}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = DEFAULT_IMAGE
                      }}
                    />
                    {/* Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md shadow-xs ${
                          isDrink
                            ? 'bg-amber-900/80 text-amber-200'
                            : 'bg-emerald-900/80 text-emerald-200'
                        }`}
                      >
                        {isDrink ? 'Barista' : 'Kitchen'}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900/70 text-white backdrop-blur-md">
                        GST {item.tax_rate_pct ?? item.taxRatePct ?? 5}%
                      </span>
                    </div>

                    <div className="absolute top-2 right-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1 shadow-xs ${
                          isAvailable
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
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
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1" title={item.name}>
                      {item.name}
                    </h4>
                    <p className="text-base font-extrabold text-[#1B4D2E] tabular-nums">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2">
                  {/* Stock Toggle Switch */}
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
                      isAvailable
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                    title="Click to toggle availability"
                  >
                    {isAvailable ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>In Stock</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Unavailable</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteItemTarget(item)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
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
            <Select
              label="Menu Category *"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {CAFE_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>

            <Select
              label="Station Routing *"
              value={formData.station}
              onChange={(e) => setFormData({ ...formData, station: e.target.value })}
            >
              <option value="bar">Barista Bar Station</option>
              <option value="kitchen">Kitchen Prep Line</option>
            </Select>
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

            <Select
              label="GST Tax Rate *"
              value={formData.taxRatePct}
              onChange={(e) => setFormData({ ...formData, taxRatePct: e.target.value })}
            >
              <option value={5}>5% (F&B / Prepared Food)</option>
              <option value={18}>18% (Packaged Beverages / Mocktails)</option>
            </Select>
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
              className="w-4 h-4 rounded text-[#1B4D2E] focus:ring-[#1B4D2E]"
            />
            <label htmlFor="isAvailableCheckbox" className="text-xs font-semibold text-slate-700">
              Immediately Available on POS & Kitchen Display
            </label>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="lawn" type="submit" loading={saving} className="font-bold">
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
          <p className="text-xs text-slate-600">
            This will permanently remove this item from the Café POS and Kitchen Queue. Past orders and sales history will remain unaffected.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteItemTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteItem}
              loading={deleting}
              className="text-rose-600 hover:bg-rose-50 border-rose-200 hover:border-rose-300 font-bold"
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
