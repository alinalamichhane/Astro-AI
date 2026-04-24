import { useNavigate, Link } from 'react-router-dom'
import { Trash2, ShoppingCart, ChevronLeft, Plus, Minus } from 'lucide-react'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import useCartStore from '../../store/cartStore'

export default function Cart() {
  const { items, currency, setCurrency, updateQuantity, removeItem, clearCart } = useCartStore()
  const navigate = useNavigate()

  const total = items.reduce((sum, i) => {
    const price = currency === 'USD' ? i.product.price_usd : i.product.price_npr
    return sum + parseFloat(price) * i.quantity
  }, 0)

  if (items.length === 0) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white font-serif mb-2">Your cart is empty</h2>
            <p className="text-gray-400 mb-6">Add some spiritual items to get started.</p>
            <Link to="/marketplace"><Button>Browse Marketplace</Button></Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <button onClick={() => navigate('/marketplace')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Continue Shopping
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white font-serif">Shopping Cart</h1>
          <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-300 transition-colors">
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map(({ product, quantity }) => {
              const price = currency === 'USD' ? product.price_usd : product.price_npr
              const symbol = currency === 'USD' ? '$' : 'Rs'
              return (
                <Card key={product.id} className="p-4">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#0d1b2a]/60 flex-shrink-0">
                      {product.all_images?.[0] ?? product.images?.[0]
                        ? <img src={product.all_images?.[0] ?? product.images?.[0]} alt={product.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-3xl">💎</div>
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link to={`/marketplace/${product.slug}`}
                        className="font-semibold text-white hover:text-[#c9a84c] transition-colors line-clamp-1">
                        {product.name}
                      </Link>
                      {product.planet_association && (
                        <p className="text-xs text-[#c9a84c] mt-0.5">✨ {product.planet_association}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">Stock: {product.stock}</p>

                      <div className="flex items-center justify-between mt-3">
                        {/* Qty controls */}
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-[#1a2f4a] border border-[#2d5a8e]/30 text-white hover:bg-[#2d5a8e]/30 flex items-center justify-center transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-white text-sm font-medium">{quantity}</span>
                          <button onClick={() => updateQuantity(product.id, quantity + 1)}
                            disabled={quantity >= product.stock}
                            className="w-7 h-7 rounded-lg bg-[#1a2f4a] border border-[#2d5a8e]/30 text-white hover:bg-[#2d5a8e]/30 flex items-center justify-center transition-colors disabled:opacity-40">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#c9a84c]">
                            {symbol} {(parseFloat(price) * quantity).toFixed(2)}
                          </span>
                          <button onClick={() => removeItem(product.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Summary */}
          <div>
            <Card className="p-5 sticky top-20">
              <h3 className="font-semibold text-white mb-4">Order Summary</h3>

              {/* Currency toggle */}
              <div className="flex gap-2 mb-4">
                {['NPR', 'USD'].map(c => (
                  <button key={c} onClick={() => setCurrency(c)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      currency === c
                        ? 'bg-[#c9a84c] text-[#0d1b2a]'
                        : 'bg-[#1a2f4a] border border-[#2d5a8e]/30 text-gray-300'
                    }`}>{c}</button>
                ))}
              </div>

              <div className="space-y-2 mb-4">
                {items.map(({ product, quantity }) => {
                  const price = currency === 'USD' ? product.price_usd : product.price_npr
                  return (
                    <div key={product.id} className="flex justify-between text-sm">
                      <span className="text-gray-400 truncate mr-2">{product.name} ×{quantity}</span>
                      <span className="text-white flex-shrink-0">
                        {currency === 'USD' ? '$' : 'Rs'} {(parseFloat(price) * quantity).toFixed(2)}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-between font-bold text-white pt-3 border-t border-[#2d5a8e]/20 mb-5">
                <span>Total</span>
                <span className="text-[#c9a84c]">
                  {currency === 'USD' ? '$' : 'Rs'} {total.toFixed(2)}
                </span>
              </div>

              <Button className="w-full" size="lg" onClick={() => navigate('/marketplace/checkout')}>
                Proceed to Checkout
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}
