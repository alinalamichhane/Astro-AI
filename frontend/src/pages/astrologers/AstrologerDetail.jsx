import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Star, Clock, MessageCircle, Video, Phone, ChevronLeft } from 'lucide-react'
import { getAstrologer, bookConsultation } from '../../api/astrologers'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StarRating from '../../components/ui/StarRating'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import useAuthStore from '../../store/authStore'
import { toastError } from '../../utils/errorHandler'
import toast from 'react-hot-toast'

const CONSULTATION_TYPES = [
  { value: 'chat', label: 'Chat', icon: <MessageCircle className="w-4 h-4" /> },
  { value: 'video', label: 'Video Call', icon: <Video className="w-4 h-4" /> },
  { value: 'phone', label: 'Phone Call', icon: <Phone className="w-4 h-4" /> },
]

const DURATIONS = [15, 30, 45, 60]

export default function AstrologerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [type, setType] = useState('chat')
  const [duration, setDuration] = useState(30)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [booking, setBooking] = useState(false)

  const { data: astrologer, isLoading } = useQuery({
    queryKey: ['astrologer', id],
    queryFn: () => getAstrologer(id).then((r) => r.data),
  })

  const handleBook = async () => {
    if (!user) { navigate('/login'); return }
    if (!date || !time) { toast.error('Please select date and time'); return }
    setBooking(true)
    try {
      await bookConsultation({
        astrologer: id,
        consultation_type: type,
        scheduled_at: `${date}T${time}:00`,
        duration_minutes: duration,
        currency: 'NPR',
      })
      toast.success('Consultation booked successfully!')
      navigate('/dashboard')
    } catch (err) {
      toastError(err, 'Booking failed. Please try again.')
    } finally {
      setBooking(false)
    }
  }

  if (isLoading) return <Layout><Spinner size="lg" className="py-40" /></Layout>
  if (!astrologer) return <Layout><div className="text-center py-40 text-gray-400">Astrologer not found</div></Layout>

  const totalCost = astrologer.rate_per_min_npr * duration

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Astrologers
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-start gap-5">
                <div className="relative">
                  {astrologer.profile_image ? (
                    <img src={astrologer.profile_image} alt={astrologer.display_name}
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-[#2d5a8e]/50" />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#2d5a8e] to-[#c9a84c] flex items-center justify-center text-white text-3xl font-bold">
                      {astrologer.display_name[0]}
                    </div>
                  )}
                  {astrologer.is_available && (
                    <div className="absolute -bottom-1 -right-1 flex items-center gap-1 px-2 py-0.5 bg-green-500 rounded-full text-xs text-white">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Online
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-white font-serif">{astrologer.display_name}</h1>
                    {astrologer.is_verified && <Badge color="gold">Verified</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <StarRating rating={astrologer.rating} size="md" />
                    <span className="text-gray-400 text-sm">{astrologer.rating} ({astrologer.rating_count} reviews)</span>
                  </div>
                  <div className="flex gap-4 mt-3 text-sm text-gray-400">
                    <span><strong className="text-white">{astrologer.experience_years}+</strong> years</span>
                    <span><strong className="text-white">{astrologer.total_consultations}</strong> consultations</span>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-gray-300 leading-relaxed">{astrologer.bio}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {(astrologer.specializations || []).map((s) => (
                  <Badge key={s} color="blue">{s}</Badge>
                ))}
              </div>

              {astrologer.languages?.length > 0 && (
                <p className="mt-4 text-sm text-gray-400">
                  Languages: <span className="text-white">{astrologer.languages.join(', ')}</span>
                </p>
              )}
            </Card>

            {/* Availability */}
            {astrologer.availability?.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#c9a84c]" /> Availability
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {astrologer.availability.filter(a => a.is_active).map((slot) => (
                    <div key={slot.id} className="p-3 rounded-lg bg-[#0d1b2a]/60 border border-[#2d5a8e]/20 text-sm">
                      <div className="text-white font-medium">{slot.day_name}</div>
                      <div className="text-gray-400 text-xs mt-0.5">{slot.start_time} – {slot.end_time}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Booking — only for regular users */}
          <div>
            <Card className="p-6 sticky top-20">
              {user?.role === 'astrologer' ? (
                /* Astrologer viewing another astrologer's profile — read-only */
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6 text-[#c9a84c]" />
                  </div>
                  <p className="text-sm font-medium text-white">Rate</p>
                  <p className="text-2xl font-bold text-[#c9a84c]">
                    Rs {astrologer.rate_per_min_npr}
                    <span className="text-sm text-gray-400 font-normal">/min</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    ${astrologer.rate_per_min_usd}/min (USD)
                  </p>
                  <div className="pt-3 border-t border-[#2d5a8e]/20 text-xs text-gray-500">
                    Consultations are available to users only.
                  </div>
                </div>
              ) : (
                /* Regular user — full booking form */
                <>
                  <h3 className="font-semibold text-white mb-5 text-lg">Book a Session</h3>

                  {/* Type */}
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-2 block">Consultation Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CONSULTATION_TYPES.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setType(t.value)}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-lg text-xs transition-all ${
                            type === t.value
                              ? 'bg-[#c9a84c]/20 border border-[#c9a84c]/60 text-[#c9a84c]'
                              : 'bg-[#0d1b2a]/60 border border-[#2d5a8e]/20 text-gray-400 hover:border-[#2d5a8e]/50'
                          }`}
                        >
                          {t.icon} {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-2 block">Duration</label>
                    <div className="grid grid-cols-4 gap-2">
                      {DURATIONS.map((d) => (
                        <button
                          key={d}
                          onClick={() => setDuration(d)}
                          className={`py-2 rounded-lg text-sm transition-all ${
                            duration === d
                              ? 'bg-[#c9a84c]/20 border border-[#c9a84c]/60 text-[#c9a84c]'
                              : 'bg-[#0d1b2a]/60 border border-[#2d5a8e]/20 text-gray-400 hover:border-[#2d5a8e]/50'
                          }`}
                        >
                          {d}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">Date</label>
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2.5 rounded-lg bg-[#0d1b2a] border border-[#2d5a8e]/50 text-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">Time</label>
                      <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-[#0d1b2a] border border-[#2d5a8e]/50 text-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50" />
                    </div>
                  </div>

                  {/* Cost */}
                  <div className="p-3 rounded-lg bg-[#c9a84c]/10 border border-[#c9a84c]/20 mb-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Rs {astrologer.rate_per_min_npr}/min × {duration} min</span>
                      <span className="text-[#c9a84c] font-bold">Rs {totalCost}</span>
                    </div>
                  </div>

                  <Button className="w-full" onClick={handleBook} loading={booking}
                    disabled={!astrologer.is_available}>
                    {astrologer.is_available ? 'Confirm Booking' : 'Currently Offline'}
                  </Button>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}
