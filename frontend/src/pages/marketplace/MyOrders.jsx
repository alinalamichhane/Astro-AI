import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronLeft, Package, XCircle } from 'lucide-react'
import { getMyOrders, cancelOrder } from '../../api/marketplace'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { toastError } from '../../utils/errorHandler'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_COLORS = {
  pending: 'gold', confirmed: 'blue', shipped: 'purple',
  delivered: 'green', cancelled: 'red',
}

export default function MyOrders() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => getMyOrders().then(r => r.data),
  })

  const orders = data?.results ?? data ?? []

  const handleCancel = async (id) => {
    if (!confirm('Cancel this order? Stock will be restored.')) return
    try {
      await cancelOrder(id)
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      toast.success('Order cancelled.')
    } catch (err) {
      toastError(err, 'Failed to cancel order.')
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link to="/dashboard"
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white font-serif mb-8">My Orders</h1>

        {isLoading && <Spinner size="lg" className="py-20" />}

        {!isLoading && orders.length === 0 && (
          <Card className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No orders yet.</p>
            <Link to="/marketplace"><Button variant="outline">Browse Marketplace</Button></Link>
          </Card>
        )}

        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">Order #{order.id}</h3>
                    <Badge color={STATUS_COLORS[order.status]}>{order.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {format(new Date(order.created_at), 'MMM d, yyyy · HH:mm')}
                    {' · '}{order.currency} {order.total_amount}
                  </p>
                </div>
                {order.status === 'pending' && (
                  <button onClick={() => handleCancel(order.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border
                      bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 transition-all">
                    <XCircle className="w-3.5 h-3.5" /> Cancel Order
                  </button>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2">
                {order.items?.map(item => (
                  <div key={item.id} className="flex justify-between text-sm p-2 rounded-lg bg-[#0d1b2a]/40">
                    <span className="text-gray-300">{item.product_name} ×{item.quantity}</span>
                    <span className="text-white">{order.currency} {item.subtotal}</span>
                  </div>
                ))}
              </div>

              {/* Shipping address */}
              {order.shipping_address && (
                <div className="mt-3 pt-3 border-t border-[#2d5a8e]/20 text-xs text-gray-400">
                  <MapPin className="w-3 h-3 inline mr-1 text-[#c9a84c]" />
                  {order.shipping_address.full_name}, {order.shipping_address.phone}
                  {' · '}{order.shipping_address.street}, {order.shipping_address.city}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  )
}
