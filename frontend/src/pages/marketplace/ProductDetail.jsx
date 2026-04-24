import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ShoppingCart, Star, Package, Zap, Heart } from 'lucide-react'
import { getProduct } from '../../api/marketplace'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StarRating from '../../components/ui/StarRating'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import useCartStore from '../../store/cartStore'
import toast from 'react-hot-toast'

const ZODIAC_SYMBOLS = {
  Aries:'♈',Taurus:'♉',Gemini:'♊',Cancer:'♋',Leo:'♌',Virgo:'♍',
  Libra:'♎',Scorpio:'♏',Sagittarius:'♐',Capricorn:'♑',Aquarius:'♒',Pisces:'♓',
}

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCartStore()
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProduct(slug).then(r => r.data),
  })

  if (isLoading) return <Layout><Spinner size="lg" className="py-40" /></Layout>
  if (!product) return <Layout><div className="text-center py-40 text-gray-400">Product not found</div></Layout>

  const handleAddToCart = () => {
    if (product.stock < qty) { toast.error(`Only ${product.stock} in stock`); return }
    addItem(product, qty)
    toast.success(`${product.name} added to cart!`)
  }

  const handleBuyNow = () => {
    handleAddToCart()
    navigate('/marketplace/cart')
  }

  const images = product.all_images ?? product.images ?? []
  const stockColor = product.stock === 0 ? 'red' : product.stock <= 5 ? 'gold' : 'green'
  const stockLabel = product.stock === 0 ? 'Out of Stock' : product.stock <= 5 ? `Only ${product.stock} left` : `${product.stock} in stock`

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Marketplace
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square rounded-2xl overflow-hidden bg-[#0d1b2a]/60 border border-[#2d5a8e]/20">
              {images[activeImg] ? (
                <img src={images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">💎</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImg === i ? 'border-[#c9a84c]' : 'border-[#2d5a8e]/30'
                    }`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div>
              <div className="flex gap-2 mb-2 flex-wrap">
                {product.is_featured && <Badge color="gold">Featured</Badge>}
                {product.category_name && <Badge color="blue">{product.category_name}</Badge>}
                <Badge color={stockColor}>{stockLabel}</Badge>
              </div>
              <h1 className="text-3xl font-bold text-white font-serif mb-2">{product.name}</h1>
              <div className="flex items-center gap-3">
                <StarRating rating={product.rating} size="md" />
                <span className="text-gray-400 text-sm">{product.rating} ({product.rating_count} reviews)</span>
              </div>
            </div>

            {/* Price */}
            <div className="p-4 rounded-xl bg-[#1a2f4a]/60 border border-[#2d5a8e]/20">
              <div className="text-3xl font-bold text-[#c9a84c]">Rs {product.price_npr}</div>
              <div className="text-gray-400 text-sm mt-0.5">${product.price_usd} USD</div>
            </div>

            {/* Planet & Zodiac */}
            {(product.planet_association || product.zodiac_benefits?.length > 0) && (
              <Card className="p-4 space-y-2">
                {product.planet_association && (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#c9a84c]" />
                    <span className="text-sm text-gray-300">Planet: <span className="text-white font-medium">{product.planet_association}</span></span>
                  </div>
                )}
                {product.zodiac_benefits?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Beneficial for:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {product.zodiac_benefits.map(sign => (
                        <span key={sign} className="px-2 py-0.5 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20 text-xs text-[#c9a84c]">
                          {ZODIAC_SYMBOLS[sign]} {sign}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Quantity */}
            {product.stock > 0 && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-400">Quantity:</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg bg-[#1a2f4a] border border-[#2d5a8e]/30 text-white hover:bg-[#2d5a8e]/30 transition-colors">−</button>
                  <span className="w-8 text-center text-white font-medium">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    className="w-8 h-8 rounded-lg bg-[#1a2f4a] border border-[#2d5a8e]/30 text-white hover:bg-[#2d5a8e]/30 transition-colors">+</button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button className="flex-1" onClick={handleAddToCart} disabled={product.stock === 0}>
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </Button>
              <Button variant="secondary" className="flex-1" onClick={handleBuyNow} disabled={product.stock === 0}>
                Buy Now
              </Button>
            </div>

            {/* Description */}
            <Card className="p-5">
              <h3 className="font-semibold text-white mb-3">Description</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{product.description}</p>
            </Card>

            {/* Healing properties */}
            {product.healing_properties && (
              <Card className="p-5">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#c9a84c]" /> Healing Properties
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">{product.healing_properties}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
