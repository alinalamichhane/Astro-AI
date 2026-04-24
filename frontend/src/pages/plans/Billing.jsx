import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronLeft, CreditCard, Clock, CheckCircle, XCircle, Zap } from 'lucide-react'
import { getMySubscriptions, getPaymentHistory } from '../../api/subscriptions'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { format, differenceInDays } from 'date-fns'

import khaltiLogo from '../../assets/gateways/khalti.svg'
import esewaLogo from '../../assets/gateways/esewa.svg'
import stripeLogo from '../../assets/gateways/stripe.svg'

const GATEWAY_LOGOS = {
  khalti:  khaltiLogo,
  esewa:   esewaLogo,
  stripe:  stripeLogo,
}
const STATUS_COLORS = { completed: 'green', pending: 'gold', failed: 'red', refunded: 'blue' }
const STATUS_ICONS = {
  completed: <CheckCircle className="w-4 h-4 text-green-400" />,
  pending:   <Clock className="w-4 h-4 text-yellow-400" />,
  failed:    <XCircle className="w-4 h-4 text-red-400" />,
}

export default function Billing() {
  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: () => getMySubscriptions().then(r => r.data),
  })

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => getPaymentHistory().then(r => r.data),
  })

  const subscriptions = subsData?.results ?? subsData ?? []
  const payments = paymentsData?.results ?? paymentsData ?? []
  const activeSub = subscriptions.find(s => s.is_active)

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white font-serif mb-8">Billing & Subscriptions</h1>

        {/* Active subscription */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Current Plan</h2>
          {subsLoading ? <Spinner className="py-8" /> : activeSub ? (
            <Card className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">{activeSub.plan.name}</h3>
                    <Badge color="green">Active</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Zap className="w-4 h-4 text-[#c9a84c]" />
                    <span className="text-sm text-gray-300">{activeSub.plan.ai_tokens} AI tokens included</span>
                  </div>
                  {activeSub.expires_at && (
                    <p className="text-sm text-gray-400 mt-1">
                      Expires: {format(new Date(activeSub.expires_at), 'MMMM d, yyyy')}
                      {' '}
                      <span className={`font-medium ${
                        differenceInDays(new Date(activeSub.expires_at), new Date()) <= 7
                          ? 'text-red-400' : 'text-gray-300'
                      }`}>
                        ({differenceInDays(new Date(activeSub.expires_at), new Date())} days left)
                      </span>
                    </p>
                  )}
                  {activeSub.started_at && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Started: {format(new Date(activeSub.started_at), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                <Link to="/plans">
                  <Button variant="outline" size="sm">Upgrade Plan</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="p-5 text-center">
              <p className="text-gray-400 mb-3">You don't have an active subscription.</p>
              <Link to="/plans"><Button size="sm">View Plans</Button></Link>
            </Card>
          )}
        </section>

        {/* Subscription history */}
        {subscriptions.length > 1 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Subscription History</h2>
            <div className="space-y-3">
              {subscriptions.filter(s => !s.is_active).map(sub => (
                <Card key={sub.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{sub.plan.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {sub.started_at && format(new Date(sub.started_at), 'MMM d, yyyy')}
                        {sub.expires_at && ` → ${format(new Date(sub.expires_at), 'MMM d, yyyy')}`}
                      </p>
                    </div>
                    <Badge color={sub.status === 'expired' ? 'red' : 'blue'}>{sub.status}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Payment history */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment History</h2>
          {paymentsLoading ? <Spinner className="py-8" /> : payments.length === 0 ? (
            <Card className="p-5 text-center">
              <CreditCard className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No payments yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {payments.map(p => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-8 bg-white rounded-lg flex items-center justify-center px-1.5 flex-shrink-0">
                        {GATEWAY_LOGOS[p.gateway]
                          ? <img src={GATEWAY_LOGOS[p.gateway]} alt={p.gateway} className="h-5 w-auto object-contain" />
                          : <span className="text-xs font-bold text-gray-700 uppercase">{p.gateway}</span>
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{p.description || p.plan?.name || 'Payment'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(p.created_at), 'MMM d, yyyy · HH:mm')}
                          {' · '}{p.gateway_display || p.gateway}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white">
                        {p.currency} {p.amount}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {STATUS_ICONS[p.status]}
                        <Badge color={STATUS_COLORS[p.status] || 'blue'}>{p.status_display || p.status}</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

      </div>
    </Layout>
  )
}
