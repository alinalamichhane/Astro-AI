import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, Star } from 'lucide-react'
import { getProducts, getCategories } from '../../api/marketplace'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StarRating from '../../components/ui/StarRating'
import Spinner from '../../components/ui/Spinner'
import useCartStore from '../../store/cartStore'
import toast from 'react-hot-toast'

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

export default function Marketplace() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [zodiac, setZodiac] = useState('')
  const [sort, setSort] = useState('')
  const navigate = useNavigate()
  const { addItem, totalItems } = useCartStore()

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then(r => r.data),
  })

  const categoryList = categories?.results ?? (Array.isArray(categories) ? categories : [])

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', category, zodiac, search, sort],
    queryFn: () => getProducts({
      ...(category && { category }),
      ...(zodiac && { zodiac }),
      ...(search && { search }),
      ...(sort && { ordering: sort }),
    }).then(r => r.data),
  })

  const items = products?.results ?? products ?? []

  const handleAddToCart = (e, product) => {
    e.stopPropagation()
    if (product.stock < 1) { toast.error('Out of stock'); return }
    addItem(product, 1)
    toast.success(`${product.name} added to cart`)
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white font-serif mb-2">Spiritual Marketplace</h1>
            <p className="text-gray-400">Gemstones, crystals, and sacred items for your journey</p>
          </div>
          <button onClick={() => navigate('/marketplace/cart')}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-[#c9a84c] hover:bg-[#c9a84c]/20 transition-colors">
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm font-medium">Cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#c9a84c] text-[#0d1b2a] text-xs font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search products..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#1a2f4a]/60 border border-[#2d5a8e]/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50" />
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-[#1a2f4a]/60 border border-[#2d5a8e]/30 text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50">
            <option value="">All Categories</option>
            {categoryList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={zodiac} onChange={e => setZodiac(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-[#1a2f4a]/60 border border-[#2d5a8e]/30 text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50">
            <option value="">All Signs</option>
            {ZODIAC_SIGNS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-[#1a2f4a]/60 border border-[#2d5a8e]/30 text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50">
            <option value="">Sort By</option>
            <option value="price_npr">Price: Low to High</option>
            <option value="-price_npr">Price: High to Low</option>
            <option value="-rating">Top Rated</option>
            <option value="-created_at">Newest</option>
          </select>
        </div>

        {isLoading && <Spinner size="lg" className="py-20" />}

        {!isLoading && items.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No products found.</p>
            <p className="text-sm mt-1">Try adjusting your filters.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map(product => (

            <Card key={product.id} hover className="overflow-hidden flex flex-col group"
              onClick={() => navigate(`/marketplace/${product.slug}`)}>
              {/* Image */}
              <div className="aspect-square bg-[#0d1b2a]/60 flex items-center justify-center overflow-hidden relative">
                {product.all_images?.[0] ? (
                  <img src={product.all_images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="text-6xl">💎</div>
                )}
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-sm font-medium bg-red-500/80 px-3 py-1 rounded-full">Out of Stock</span>
                  </div>
                )}
                {product.stock > 0 && product.stock <= 5 && (
                  <div className="absolute top-2 right-2">
                    <Badge color="red">Only {product.stock} left</Badge>
                  </div>
                )}
              </div>

              <div className="p-4 flex flex-col flex-1 gap-2">
                <div className="flex gap-1 flex-wrap">
                  {product.is_featured && <Badge color="gold">Featured</Badge>}
                  {product.category_name && <Badge color="blue">{product.category_name}</Badge>}
                </div>
                <h3 className="font-semibold text-white leading-tight">{product.name}</h3>
                <p className="text-xs text-gray-400 line-clamp-2">{product.short_description || product.description}</p>
                {product.planet_association && (
                  <p className="text-xs text-[#c9a84c]">✨ {product.planet_association}</p>
                )}
                <div className="flex items-center gap-2">
                  <StarRating rating={product.rating} />
                  <span className="text-xs text-gray-500">({product.rating_count})</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#2d5a8e]/20 mt-auto">
                  <div>
                    <span className="text-[#c9a84c] font-bold">Rs {product.price_npr}</span>
                    <span className="text-gray-500 text-xs ml-1">${product.price_usd}</span>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleAddToCart(e, product);
                    }}
                    disabled={product.stock === 0}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-[#c9a84c] text-xs font-medium hover:bg-[#c9a84c]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  )
}
