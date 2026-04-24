import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Star, Zap, Crown, Shield, Clock, ChevronRight } from 'lucide-react'
import { getPlans, initiatePayment, getMySubscriptions } from '../../api/subscriptions'
import { getProfile } from '../../api/auth'
import Layout from '../../components/layout/Layout'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Card from '../../components/ui/Card'
import useAuthStore from '../../store/authStore'
import { toastError } from '../../utils/errorHandler'
import toast from 'react-hot-toast'
import { useNavigate, Link } from 'react-router-dom'
import { format, differenceInDays } from 'date-fns'

import khaltiLogo from '../../assets/gateways/khalti.svg'
import esewaLogo from '../../assets/gateways/esewa.svg'
import stripeLogo from '../../assets/gateways/stripe.svg'

const GATEWAY_OPTIONS = [
  {
    value: 'khalti',
    label: 'Khalti',
    logo: khaltiLogo,
    bg: 'bg-white',
    desc: 'Khalti wallet / eBanking',
  },
  {
    value: 'esewa',
    label: 'eSewa',
    logo: esewaLogo,
    bg: 'bg-white',
    desc: 'eSewa wallet',
  },
  {
    value: 'stripe',
    label: 'Card (USD)',
    logo: stripeLogo,
    bg: 'bg-white',
    desc: 'International card',
  },
]

const PLAN_STYLES = {
  token:   { gradient: 'from-slate-700 to-slate-800',   icon: <Zap className="w-5 h-5" />,    badge: null },
  basic:   { gradient: 'from-[#1e3a5f] to-[#2d5a8e]',  icon: <Shield className="w-5 h-5" />, badge: null },
  premium: { gradient: 'from-[#4a2d8e] to-[#2d5a8e]',  icon: <Star className="w-5 h-5" />,   badge: 'POPULAR' },
  vip:     { gradient: 'from-[#7a4f1a] to-[#c9a84c]',  icon: <Crown className="w-5 h-5" />,  badge: 'BEST VALUE' },
}

export default function Plans() {
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [gateway, setGateway] = useState('khalti')
  const [paying, setPaying] = useState(false)
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => getPlans().then(r => r.data),
  })

  // Always fetch fresh profile so token count is accurate after payment
  const { data: freshProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile().then(r => r.data),
    enabled: !!user,
    staleTime: 0,
    onSuccess: (data) => {
      // Keep Zustand store in sync
      if (data.ai_tokens !== user?.ai_tokens) {
        setUser({ ...user, ...data })
      }
    },
  })

  // Use fresh profile tokens, fall back to store
  const currentTokens = freshProfile?.ai_tokens ?? user?.ai_tokens ?? 0

  // API may return paginated {count, results:[]} or a plain array
  const planList = plans?.results ?? (Array.isArray(plans) ? plans : [])

  const { data: subsData } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: () => getMySubscriptions().then(r => r.data),
    enabled: !!user,
  })

  // Find the current active subscription
  const activeSub = (subsData?.results ?? subsData ?? []).find(s => s.is_active)

  const handlePay = async () => {
    if (!user) { navigate('/login', { state: { from: '/plans' } }); return }
    if (!selectedPlan) { toast.error('Please select a plan first.'); return }
    setPaying(true)
    try {
      const { data } = await initiatePayment(selectedPlan.id, gateway)

      if (gateway === 'khalti') {
        window.location.href = data.payment_url
      } else if (gateway === 'esewa') {
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = data.payment_url
        Object.entries(data.form_fields).forEach(([k, v]) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = k
          input.value = v
          form.appendChild(input)
        })
        document.body.appendChild(form)
        form.submit()
      } else if (gateway === 'stripe') {
        navigate(`/payment/stripe?txn=${data.transaction_uuid}&secret=${data.client_secret}`)
      }
    } catch (err) {
      const msg = err.response?.data?.error || ''
      if (msg.includes('not configured') || msg.includes('KHALTI_SECRET_KEY') || msg.includes('STRIPE_SECRET_KEY')) {
        toast.error(`${GATEWAY_OPTIONS.find(g => g.value === gateway)?.label} is not configured yet. Please contact support or try another payment method.`)
      } else {
        toastError(err, 'Payment initiation failed. Please try again.')
      }
    } finally {
      setPaying(false)
    }
  }

  if (plansLoading) return <Layout><Spinner size="lg" className="py-40" /></Layout>

  const daysLeft = activeSub?.expires_at
    ? differenceInDays(new Date(activeSub.expires_at), new Date())
    : null

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-white font-serif mb-3">Choose Your Plan</h1>
          <p className="text-gray-400">Unlock AI tokens, consultations, and premium features</p>
        </div>

        {/* Current subscription banner */}
        {activeSub && (
          <div className="max-w-2xl mx-auto mb-10">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    Active: <span className="text-green-400">{activeSub.plan.name}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {daysLeft > 0
                      ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} · ${format(new Date(activeSub.expires_at), 'MMM d, yyyy')}`
                      : 'Expires today'}
                    {' · '}⚡ {currentTokens} tokens remaining
                  </p>
                </div>
              </div>
              <Link to="/dashboard/billing" className="text-xs text-[#c9a84c] hover:underline flex items-center gap-1">
                History <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {planList.map(plan => {
            const style = PLAN_STYLES[plan.plan_type] || PLAN_STYLES.basic
            const isSelected = selectedPlan?.id === plan.id
            const isCurrent = activeSub?.plan?.id === plan.id

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`
                  relative rounded-2xl p-6 cursor-pointer transition-all duration-300 border-2
                  bg-gradient-to-br ${style.gradient}
                  ${isSelected
                    ? 'border-[#c9a84c] scale-[1.03] shadow-2xl shadow-[#c9a84c]/20'
                    : 'border-white/10 hover:border-white/30'}
                `}
              >
                {/* Badge */}
                {style.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#c9a84c] text-[#0d1b2a] text-xs font-bold rounded-full whitespace-nowrap">
                    {style.badge}
                  </div>
                )}

                {/* Selected check */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-[#c9a84c] rounded-full flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-[#0d1b2a]" />
                  </div>
                )}

                {/* Current plan indicator */}
                {isCurrent && !isSelected && (
                  <div className="absolute top-3 right-3">
                    <Badge color="green">Current</Badge>
                  </div>
                )}

                {/* Plan icon + name */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-[#c9a84c]">{style.icon}</div>
                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                </div>

                <p className="text-xs text-gray-300 mb-4 leading-relaxed">{plan.description}</p>

                {/* Price */}
                <div className="mb-4">
                  <div className="text-3xl font-bold text-white">Rs {plan.price_npr}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    ${plan.price_usd} · {plan.duration_days === 365 ? '1 year' : `${plan.duration_days} days`}
                  </div>
                </div>

                {/* Tokens highlight */}
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-black/20">
                  <Zap className="w-4 h-4 text-[#c9a84c] flex-shrink-0" />
                  <span className="text-sm text-white font-semibold">{plan.ai_tokens} AI Tokens</span>
                </div>

                {/* Features */}
                <ul className="space-y-1.5">
                  {(plan.features ?? []).map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-200">
                      <Check className="w-3.5 h-3.5 text-[#c9a84c] flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Payment section — appears when a plan is selected */}
        {selectedPlan ? (
          <div className="max-w-lg mx-auto">
            <Card className="p-6">
              <h3 className="font-semibold text-white mb-5 text-lg">Complete Your Purchase</h3>

              {/* Selected plan summary */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d1b2a]/60 border border-[#2d5a8e]/20 mb-5">
                <div>
                  <p className="text-white font-medium">{selectedPlan.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedPlan.ai_tokens} tokens · {selectedPlan.duration_days} days
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#c9a84c] font-bold text-lg">
                    {gateway === 'stripe' ? `$${selectedPlan.price_usd}` : `Rs ${selectedPlan.price_npr}`}
                  </p>
                  <button onClick={() => setSelectedPlan(null)}
                    className="text-xs text-gray-500 hover:text-gray-300 underline mt-0.5">
                    Change plan
                  </button>
                </div>
              </div>

              {/* Gateway selector */}
              <p className="text-sm text-gray-400 mb-3">Choose payment method</p>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {GATEWAY_OPTIONS.map(g => (
                  <button
                    key={g.value}
                    onClick={() => setGateway(g.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                      gateway === g.value
                        ? 'border-2 border-[#c9a84c] shadow-lg shadow-[#c9a84c]/10'
                        : 'border-2 border-[#2d5a8e]/20 hover:border-[#2d5a8e]/50'
                    } bg-white`}
                  >
                    <img src={g.logo} alt={g.label} className="h-7 w-auto object-contain" />
                    <span className="text-[10px] text-gray-500 text-center leading-tight">{g.desc}</span>
                  </button>
                ))}
              </div>

              {/* Login prompt for guests */}
              {!user ? (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-400 mb-3">Please log in to complete your purchase</p>
                  <Link to="/login" state={{ from: '/plans' }}>
                    <Button className="w-full">Login to Continue</Button>
                  </Link>
                </div>
              ) : (
                <Button className="w-full" size="lg" onClick={handlePay} loading={paying}>
                  Pay {gateway === 'stripe' ? `$${selectedPlan.price_usd}` : `Rs ${selectedPlan.price_npr}`} with {GATEWAY_OPTIONS.find(g => g.value === gateway)?.label}
                </Button>
              )}

              <p className="text-center text-xs text-gray-600 mt-3">
                🔒 Secure payment · Tokens credited instantly after payment
              </p>
            </Card>
          </div>
        ) : (
          <p className="text-center text-gray-500 text-sm">
            ↑ Click any plan above to select it and proceed to payment
          </p>
        )}

        {/* Payment history link */}
        {user && (
          <div className="text-center mt-8">
            <Link to="/dashboard/billing" className="text-sm text-gray-500 hover:text-[#c9a84c] transition-colors">
              View payment history →
            </Link>
          </div>
        )}
      </div>
    </Layout>
  )
}
