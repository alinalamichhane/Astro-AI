import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Video, MessageCircle, Phone, Star } from 'lucide-react'
import { getAstrologers } from '../../api/astrologers'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StarRating from '../../components/ui/StarRating'
import Spinner from '../../components/ui/Spinner'
import QueryError from '../../components/ui/QueryError'
import Button from '../../components/ui/Button'

const SPECIALIZATIONS = ['All', 'vedic', 'numerology', 'tarot', 'vastu', 'kundali', 'career', 'relationship']

export default function Astrologers() {
  const [search, setSearch] = useState('')
  const [spec, setSpec] = useState('All')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['astrologers', spec, onlineOnly],
    queryFn: () => getAstrologers({
      ...(spec !== 'All' && { search: spec }),
      ...(onlineOnly && { is_available: true }),
    }).then((r) => r.data),
  })

  const filtered = data?.results?.filter((a) =>
    a.display_name.toLowerCase().includes(search.toLowerCase())
  ) || data?.filter?.((a) => a.display_name.toLowerCase().includes(search.toLowerCase())) || []

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white font-serif mb-3">Expert Astrologers</h1>
          <p className="text-gray-400">Connect with verified Vedic astrology experts</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search astrologers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#1a2f4a]/60 border border-[#2d5a8e]/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50"
            />
          </div>
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1a2f4a]/60 border border-[#2d5a8e]/30 cursor-pointer">
            <input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} className="accent-[#c9a84c]" />
            <span className="text-sm text-gray-300">Online Now</span>
          </label>
        </div>

        {/* Specialization tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {SPECIALIZATIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSpec(s)}
              className={`px-4 py-1.5 rounded-full text-sm capitalize transition-all ${
                spec === s
                  ? 'bg-[#c9a84c] text-[#0d1b2a] font-medium'
                  : 'bg-[#1a2f4a]/60 border border-[#2d5a8e]/30 text-gray-300 hover:border-[#c9a84c]/40'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {isLoading && <Spinner size="lg" className="py-20" />}
        {!isLoading && data?.error && <QueryError error={data} onRetry={() => {}} />}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <Star className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No astrologers found.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((astrologer) => (
            <Card key={astrologer.id} hover className="p-6 flex flex-col gap-4">
              {/* Profile */}
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  {astrologer.profile_image ? (
                    <img src={astrologer.profile_image} alt={astrologer.display_name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#2d5a8e]/50" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2d5a8e] to-[#c9a84c] flex items-center justify-center text-white text-xl font-bold">
                      {astrologer.display_name[0]}
                    </div>
                  )}
                  {astrologer.is_available && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1a2f4a]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white truncate">{astrologer.display_name}</h3>
                    {astrologer.is_verified && <Badge color="gold">✓</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={astrologer.rating} />
                    <span className="text-xs text-gray-400">({astrologer.rating_count})</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{astrologer.experience_years}+ years experience</p>
                </div>
              </div>

              {/* Bio */}
              <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">{astrologer.bio}</p>

              {/* Specializations */}
              <div className="flex flex-wrap gap-1.5">
                {(astrologer.specializations || []).slice(0, 3).map((s) => (
                  <Badge key={s} color="blue">{s}</Badge>
                ))}
              </div>

              {/* Languages */}
              {astrologer.languages?.length > 0 && (
                <p className="text-xs text-gray-500">
                  Speaks: {astrologer.languages.join(', ')}
                </p>
              )}

              {/* Rate & Book */}
              <div className="flex items-center justify-between pt-2 border-t border-[#2d5a8e]/20">
                <div>
                  <span className="text-[#c9a84c] font-bold">Rs {astrologer.rate_per_min_npr}</span>
                  <span className="text-gray-500 text-xs">/min</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/astrologers/${astrologer.id}`)}
                    className="p-2 rounded-lg bg-[#2d5a8e]/20 hover:bg-[#2d5a8e]/40 text-[#2d5a8e] hover:text-white transition-colors"
                    title="View Profile"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/astrologers/${astrologer.id}`)}
                    disabled={!astrologer.is_available}
                  >
                    {astrologer.is_available ? 'Book Now' : 'Offline'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  )
}
