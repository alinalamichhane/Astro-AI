import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Star, RefreshCw, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getBirthChart, generateBirthChart } from '../../api/horoscope'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import KundaliChart from '../../components/horoscope/KundaliChart'
import useAuthStore from '../../store/authStore'
import { toastError } from '../../utils/errorHandler'
import toast from 'react-hot-toast'

const PLANET_DESCRIPTIONS = {
  Sun:       { symbol: '☉', color: '#f59e0b', desc: 'Soul, ego, vitality, father, authority' },
  Moon:      { symbol: '☽', color: '#94a3b8', desc: 'Mind, emotions, mother, intuition' },
  Mars:      { symbol: '♂', color: '#ef4444', desc: 'Energy, courage, ambition, siblings' },
  Mercury:   { symbol: '☿', color: '#22c55e', desc: 'Intelligence, communication, business' },
  Jupiter:   { symbol: '♃', color: '#f97316', desc: 'Wisdom, expansion, luck, spirituality' },
  Venus:     { symbol: '♀', color: '#ec4899', desc: 'Love, beauty, luxury, relationships' },
  Saturn:    { symbol: '♄', color: '#8b5cf6', desc: 'Discipline, karma, delays, longevity' },
  Rahu:      { symbol: '☊', color: '#6b7280', desc: 'Ambition, illusion, foreign matters' },
  Ketu:      { symbol: '☋', color: '#6b7280', desc: 'Spirituality, liberation, past karma' },
  Uranus:    { symbol: '⛢', color: '#06b6d4', desc: 'Innovation, rebellion, sudden changes' },
  Neptune:   { symbol: '♆', color: '#3b82f6', desc: 'Dreams, spirituality, illusions' },
  Pluto:     { symbol: '♇', color: '#a855f7', desc: 'Transformation, power, regeneration' },
  Ascendant: { symbol: 'Asc', color: '#c9a84c', desc: 'Physical appearance, personality, first impressions' },
}

export default function BirthChart() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [generating, setGenerating] = useState(false)

  const { data: chart, isLoading, error } = useQuery({
    queryKey: ['birth-chart'],
    queryFn: () => getBirthChart().then(r => r.data),
    retry: false,
    enabled: !!user,
  })

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await generateBirthChart()
      queryClient.invalidateQueries({ queryKey: ['birth-chart'] })
      toast.success('Birth chart generated! 🌟')
    } catch (err) {
      toastError(err, 'Failed to generate birth chart.')
    } finally {
      setGenerating(false)
    }
  }

  // Not logged in
  if (!user) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-8 h-8 text-[#c9a84c]" />
            </div>
            <h2 className="text-2xl font-bold text-white font-serif mb-2">Sign In to View Your Birth Chart</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Your Vedic birth chart (Kundali) is generated from your exact date, time, and place of birth. Create a free account to get yours.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/login"><Button variant="outline">Sign In</Button></Link>
              <Link to="/register"><Button>Create Free Account</Button></Link>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white font-serif mb-3">Your Birth Chart</h1>
          <p className="text-gray-400">Vedic Kundali — a cosmic map of the sky at your birth moment</p>
        </div>

        {isLoading && <Spinner size="lg" className="py-20" />}

        {/* No chart yet */}
        {!isLoading && !chart && (
          <Card className="p-8 text-center max-w-lg mx-auto">
            <Star className="w-12 h-12 text-[#c9a84c] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Generate Your Kundali</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Your birth chart requires your date of birth, time of birth, and place of birth.
              Complete your profile first, then generate your chart.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/dashboard/profile">
                <Button variant="outline">Complete Profile</Button>
              </Link>
              <Button onClick={handleGenerate} loading={generating}>
                <Star className="w-4 h-4" /> Generate Chart
              </Button>
            </div>
          </Card>
        )}

        {/* Chart exists */}
        {chart && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visual chart */}
            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-[#c9a84c]" /> Kundali Chart
                  </h2>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#c9a84c] transition-colors"
                    title="Regenerate chart"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                </div>
                <div className="flex justify-center">
                  <KundaliChart
                    chartData={chart.chart_data}
                    ascendantSign={chart.ascendant}
                    size={450}
                  />
                </div>
              </Card>

              {/* Key placements */}
              <Card className="p-5">
                <h3 className="font-semibold text-white mb-3">Key Placements</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Sun Sign',  value: chart.sun_sign },
                    { label: 'Moon Sign', value: chart.moon_sign },
                    { label: 'Ascendant', value: chart.ascendant },
                    { label: 'Nakshatra', value: chart.nakshatra || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center p-3 rounded-xl bg-[#0d1b2a]/60 border border-[#2d5a8e]/20">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-sm font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Planet positions */}
            <div>
              <Card className="p-5">
                <h3 className="font-semibold text-white mb-4">Planetary Positions</h3>
                <div className="space-y-2">
                  {Object.entries(chart.chart_data || {}).map(([planet, data]) => {
                    const info = PLANET_DESCRIPTIONS[planet]
                    if (!info || !data?.sign) return null
                    return (
                      <div key={planet}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[#0d1b2a]/60 border border-[#2d5a8e]/20 hover:border-[#2d5a8e]/40 transition-colors">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                          style={{ background: `${info.color}20`, color: info.color, border: `1px solid ${info.color}40` }}>
                          {info.symbol}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{planet}</span>
                            <span className="text-xs text-gray-400">in {data.sign}</span>
                            <span className="text-xs text-gray-600">{data.degree?.toFixed(1)}°</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{info.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
