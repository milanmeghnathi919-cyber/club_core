import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import publicService from '@/service/publicService'
import { addToCart } from '@/feature/shop/cartSlice'
import { formatCurrency } from '@/utils/format'
import { Search, ShoppingBag, Plus, Check, Filter } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import useToast from '@/components/ui/Toast'

export const Shop = () => {
  const dispatch = useDispatch()
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([publicService.getCategories(), publicService.getProducts()])
      .then(([cats, prods]) => {
        setCategories(cats)
        setProducts(prods.items || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredProducts = products.filter((p) => {
    const matchesCat = !selectedCategory || p.categoryId === selectedCategory || p.category_id === selectedCategory
    const matchesSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  const handleAdd = (product) => {
    dispatch(addToCart({ product, qty: 1 }))
    toast.success(`Added ${product.name} to equipment bag`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B4D2E]">
            Club Pro Shop
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Official Equipment & Gear</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tournament-grade tennis rackets, padel bats, feather shuttles, and club apparel.
          </p>
        </div>

        {/* Search */}
        <div className="w-full md:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rackets, balls, gear..."
            className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D2E]/20 focus:border-[#1B4D2E]"
          />
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
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
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === c.id
                ? 'bg-[#1B4D2E] text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c.name}
          </button>
        ))}
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
          {filteredProducts.map((p) => (
            <Card key={p.id} hover className="border-slate-200 flex flex-col justify-between">
              <div>
                <div className="h-44 bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-12 h-12 text-slate-300 stroke-1" />
                  )}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[10px] font-mono text-slate-600 border border-slate-200">
                    {p.sku}
                  </span>
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
                  <p className="text-[11px] text-slate-500">
                    Member discount applied automatically at checkout.
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <Button
                  variant="lawn"
                  size="sm"
                  className="w-full gap-1.5 font-bold"
                  onClick={() => handleAdd(p)}
                >
                  <Plus className="w-3.5 h-3.5" /> Add to Bag
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Shop
