import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader, Star } from 'lucide-react'
import api from '../../api/axios'
import Layout from '../../components/layout/Layout'
import Button from '../../components/ui/Button'
import useAuthStore from '../../store/authStore'

export default function PaymentCallback() {
  const [searchParams] = useSearchParams()
  const { gateway } = useParams()
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [status, setStatus] = useState('verifying')
  const [tokensAdded, setTokensAdded] = useState(0)

  useEffect(() => {
    const verify = async () => {
      try {
        let resp
        if (gateway === 'khalti') {
          const pidx = searchParams.get('pidx')
          const txn = searchParams.get('purchase_order_id')
          if (!pidx || !txn) { setStatus('failed'); return }
          resp = await api.get(`/subscriptions/callback/khalti/?pidx=${pidx}&purchase_order_id=${txn}`)
        } else if (gateway === 'esewa') {
          const data = searchParams.get('data')
          if (!data) { setStatus('failed'); return }
          resp = await api.get(`/subscriptions/callback/esewa/?data=${data}`)
        }

        // Refresh user profile to get updated token count and sync store
        try {
          const profileResp = await api.get('/auth/profile/')
          const freshData = profileResp.data
          const oldTokens = user?.ai_tokens || 0
          setTokensAdded(Math.max(0, freshData.ai_tokens - oldTokens))
          setUser({ ...user, ...freshData })  // full sync, not just tokens
        } catch {}

        setStatus('success')
      } catch {
        setStatus('failed')
      }
    }
    verify()
  }, [gateway])

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">

          {status === 'verifying' && (
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center mx-auto">
                <Loader className="w-10 h-10 text-[#c9a84c] animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white font-serif">Verifying Payment</h2>
              <p className="text-gray-400">Please wait while we confirm your payment with {gateway}...</p>
              <p className="text-xs text-gray-600">Do not close this page</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white font-serif">Payment Successful!</h2>
              <p className="text-gray-400">Your subscription has been activated.</p>

              {tokensAdded > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30">
                  <Star className="w-4 h-4 text-[#c9a84c] fill-[#c9a84c]" />
                  <span className="text-[#c9a84c] font-semibold">+{tokensAdded} AI tokens added!</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
                <Button variant="outline" onClick={() => navigate('/chat')}>Start AI Chat</Button>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white font-serif">Payment Failed</h2>
              <p className="text-gray-400">
                Something went wrong with your payment. Your account has not been charged.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button onClick={() => navigate('/plans')}>Try Again</Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  )
}
