import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, MapPin, ShoppingBag } from 'lucide-react'
import { createOrder, initiateOrderPayment } from '../../api/marketplace'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import { toastError } from '../../utils/errorHandler'
import toast from 'react-hot-toast'

import khaltiLogo from '../../assets/gateways/khalti.svg'
import esewaLogo from '../../assets/gateways/esewa.svg'
import stripeLogo from '../../assets/gateways/stripe.svg'

const GATEWAYS = [
  { value: 'khalti', label: 'Khalti',     logo: khaltiLogo, desc: 'Khalti wallet' },
  { value: 'esewa',  label: 'eSewa',      logo: esewaLogo,  desc: 'eSewa wallet' },
  { value: 'stripe', label: 'Card (USD)', logo: stripeLogo, desc: 'International card' },
]

export default function Checkout() {
  const { items, currency, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [gateway, setGateway] = useState('khalti')
  const [placing, setPlacing] = useState(false)
  const [address, setAddress] = useState({
    full_name: user?.first_name ? `${user.first_name} ${user.last_name}`.trim() : '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    country: 'Nepal',
  })

  const total = items.reduce((sum, i) => {
    const price = currency === 'USD' ? i.product.price_usd : i.product.price_npr
    return sum + parseFloat(price) * i.quantity
  }, 0)

  if (!user) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center px-4 text-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-3">Sign in to checkout</h2>
            <Link to="/login" state={{ from: '/marketplace/checkout' }}>
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  if (items.length === 0) {
    navigate('/marketplace')
    return null
  }

  const handlePlaceOrder = async () => {
    if (!address.full_name || !address.phone || !address.street || !address.city) {
      toast.error('Please fill in all required address fields.')
      return
    }
    setPlacing(true)
    try {
      // 1. Create the order
      const { data: order } = await createOrder({
        items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
        shipping_address: address,
        currency,
      })

      // 2. Initiate payment
      const { data: payData } = await initiateOrderPayment(order.id, gateway)

      clearCart()

      if (gateway === 'khalti') {
        window.location.href = payData.payment_url
      } else if (gateway === 'esewa') {
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = payData.payment_url
        Object.entries(payData.form_fields).forEach(([k, v]) => {
          const input = document.createElement('input')
          input.type = 'hidden'; input.name = k; input.value = v
          form.appendChild(input)
        })
        document.body.appendChild(form)
        form.submit()
      } else {
        navigate(`/marketplace/orders/${order.id}?paid=1`)
      }
    } catch (err) {
      toastError(err, 'Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  const set = k => e => setAddress(a => ({ ...a, [k]: e.target.value }))

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <button onClick={() => navigate('/marketplace/cart')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Cart
        </button>
        <h1 className="text-3xl font-bold text-white font-serif mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Shipping address */}
            <Card className="p-6">
              <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#c9a84c]" /> Shipping Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name *" value={address.full_name} onChange={set('full_name')} placeholder="John Doe" required />
                <Input label="Phone *" value={address.phone} onChange={set('phone')} placeholder="+977 98XXXXXXXX" required />
                <div className="sm:col-span-2">
                  <Input label="Street Address *" value={address.street} onChange={set('street')} placeholder="House no., Street name" required />
                </div>
                <Input label="City *" value={address.city} onChange={set('city')} placeholder="Kathmandu" required />
                <Input label="State/Province" value={address.state} onChange={set('state')} placeholder="Bagmati" />
                <Input label="Country" value={address.country} onChange={set('country')} placeholder="Nepal" />
              </div>
            </Card>

            {/* Payment method */}
            <Card className="p-6">
              <h3 className="font-semibold text-white mb-5">Payment Method</h3>
              <div className="grid grid-cols-3 gap-3">
                {GATEWAYS.map(g => (
                  <button key={g.value} onClick={() => setGateway(g.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                      gateway === g.value
                        ? 'border-2 border-[#c9a84c] bg-[#c9a84c]/10'
                        : 'border-2 border-[#2d5a8e]/20 bg-[#0d1b2a]/60 hover:border-[#2d5a8e]/50'
                    }`}>
                    <div className="h-8 flex items-center justify-center bg-white rounded-lg px-2 w-full">
                      <img src={g.logo} alt={g.label} className="h-5 w-auto object-contain" />
                    </div>
                    <span className="text-[10px] text-gray-400">{g.desc}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Order summary */}
          <div>
            <Card className="p-5 sticky top-20">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#c9a84c]" /> Order Summary
              </h3>
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
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
              <Button className="w-full" size="lg" onClick={handlePlaceOrder} loading={placing}>
                Place Order & Pay
              </Button>
              <p className="text-center text-xs text-gray-600 mt-3">
                🔒 Secure payment · Stock reserved on order
              </p>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}
