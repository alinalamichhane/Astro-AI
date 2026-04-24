import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Calendar, Star, MessageCircle, Video, Phone, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getMyConsultations, reviewConsultation } from '../../api/astrologers'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import QueryError from '../../components/ui/QueryError'
import StarRating from '../../components/ui/StarRating'
import { toastError } from '../../utils/errorHandler'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_COLORS = {
  pending: 'gold', confirmed: 'blue', ongoing: 'purple',
  completed: 'green', cancelled: 'red',
}

const TYPE_ICONS = {
  chat: <MessageCircle className="w-3.5 h-3.5" />,
  video: <Video className="w-3.5 h-3.5" />,
  phone: <Phone className="w-3.5 h-3.5" />,
}

export default function Consultations() {
  const [filter, setFilter] = useState('all')
  const [reviewingId, setReviewingId] = useState(null)
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-consultations', filter],
    queryFn: () => getMyConsultations().then(r => r.data),
  })

  const consultations = (data?.results ?? data ?? []).filter(c =>
    filter === 'all' || c.status === filter
  )

  const handleReview = async (id) => {
    try {
      await reviewConsultation(id, { rating, review })
      queryClient.invalidateQueries({ queryKey: ['my-consultations'] })
      toast.success('Review submitted!')
      setReviewingId(null)
      setRating(5)
      setReview('')
    } catch (err) {
      toastError(err, 'Failed to submit review.')
    }
  }

  const FILTERS = ['all', 'pending', 'confirmed', 'ongoing', 'completed', 'cancelled']

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white font-serif mb-6">My Consultations</h1>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm capitalize transition-all ${
                filter === f
                  ? 'bg-[#c9a84c] text-[#0d1b2a] font-medium'
                  : 'bg-[#1a2f4a]/60 border border-[#2d5a8e]/30 text-gray-300 hover:border-[#c9a84c]/40'
              }`}>{f}</button>
          ))}
        </div>

        {isLoading && <Spinner size="lg" className="py-20" />}
        {error && <QueryError error={error} onRetry={refetch} />}

        {!isLoading && consultations.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No consultations found.</p>
            <Link to="/astrologers" className="block mt-4">
              <Button variant="outline">Book a Consultation</Button>
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {consultations.map(c => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start gap-4">
                {/* Astrologer avatar */}
                {c.astrologer_image ? (
                  <img src={c.astrologer_image} alt={c.astrologer_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#2d5a8e]/50 flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2d5a8e] to-[#c9a84c] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {c.astrologer_name?.[0]}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-white">{c.astrologer_name}</h3>
                    <Badge color={STATUS_COLORS[c.status]}>{c.status}</Badge>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      {TYPE_ICONS[c.consultation_type]} {c.consultation_type}
                    </span>
                  </div>

                  <p className="text-sm text-gray-400">
                    {format(new Date(c.scheduled_at), 'MMM d, yyyy · HH:mm')}
                    {' · '}{c.duration_minutes} min
                    {' · '}{c.currency} {c.amount}
                  </p>

                  {c.notes && (
                    <p className="text-xs text-gray-500 mt-2 italic">"{c.notes}"</p>
                  )}

                  {/* Cancellation reason — shown when declined */}
                  {c.status === 'cancelled' && c.cancellation_reason && (
                    <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
                      <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-300 leading-relaxed">
                        <span className="font-medium">Reason: </span>{c.cancellation_reason}
                      </p>
                    </div>
                  )}

                  {/* Review section */}
                  {c.status === 'completed' && (
                    <div className="mt-3 pt-3 border-t border-[#2d5a8e]/20">
                      {c.user_rating ? (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <StarRating rating={c.user_rating} size="md" />
                            <span className="text-sm text-[#c9a84c]">{c.user_rating}/5</span>
                          </div>
                          {c.user_review && (
                            <p className="text-sm text-gray-400 mt-1">"{c.user_review}"</p>
                          )}
                        </div>
                      ) : reviewingId === c.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1.5">Your Rating</label>
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map(r => (
                                <button key={r} type="button" onClick={() => setRating(r)}
                                  className="p-1 hover:scale-110 transition-transform">
                                  <Star className={`w-6 h-6 ${r <= rating ? 'text-[#c9a84c] fill-[#c9a84c]' : 'text-gray-600'}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1.5">Review (optional)</label>
                            <textarea value={review} onChange={e => setReview(e.target.value)}
                              rows={2} placeholder="Share your experience..."
                              className="w-full px-3 py-2 rounded-lg bg-[#0d1b2a] border border-[#2d5a8e]/50 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50 resize-none" />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleReview(c.id)}>Submit Review</Button>
                            <Button size="sm" variant="outline" onClick={() => setReviewingId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setReviewingId(c.id)}>
                          <Star className="w-3.5 h-3.5" /> Leave a Review
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  )
}
