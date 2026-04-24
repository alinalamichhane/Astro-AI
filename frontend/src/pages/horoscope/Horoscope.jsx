import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Star, Heart, Briefcase, Activity, DollarSign } from 'lucide-react'
import { getAllHoroscopes, getHoroscope } from '../../api/horoscope'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'

const SIGNS = [
  { name: 'Aries', symbol: '♈' }, { name: 'Taurus', symbol: '♉' },
  { name: 'Gemini', symbol: '♊' }, { name: 'Cancer', symbol: '♋' },
  { name: 'Leo', symbol: '♌' }, { name: 'Virgo', symbol: '♍' },
  { name: 'Libra', symbol: '♎' }, { name: 'Scorpio', symbol: '♏' },
  { name: 'Sagittarius', symbol: '♐' }, { name: 'Capricorn', symbol: '♑' },
  { name: 'Aquarius', symbol: '♒' }, { name: 'Pisces', symbol: '♓' },
]

const PERIODS = ['daily', 'weekly', 'monthly']

export default function Horoscope() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [period, setPeriod] = useState('daily')
  const selectedSign = searchParams.get('sign') || ''

  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ['horoscopes', period],
    queryFn: () => getAllHoroscopes(period).then((r) => r.data),
    enabled: !selectedSign,
  })

  const { data: signData, isLoading: signLoading } = useQuery({
    queryKey: ['horoscope', selectedSign, period],
    queryFn: () => getHoroscope(selectedSign, period).then((r) => r.data),
    enabled: !!selectedSign,
  })

  const horoscope = selectedSign ? signData : null
  const isLoading = selectedSign ? signLoading : allLoading

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white font-serif mb-3">Daily Horoscope</h1>
          <p className="text-gray-400">Vedic astrology insights for every zodiac sign</p>
        </div>

        {/* Period selector */}
        <div className="flex justify-center gap-2 mb-8">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                period === p
                  ? 'bg-[#c9a84c] text-[#0d1b2a]'
                  : 'bg-[#1a2f4a]/60 border border-[#2d5a8e]/30 text-gray-300 hover:border-[#c9a84c]/40'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Sign selector */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2 mb-10">
          <button
            onClick={() => setSearchParams({})}
            className={`col-span-4 sm:col-span-6 md:col-span-12 py-2 rounded-lg text-sm transition-all ${
              !selectedSign ? 'bg-[#2d5a8e] text-white' : 'bg-[#1a2f4a]/40 text-gray-400 hover:text-white'
            }`}
          >
            All Signs
          </button>
          {SIGNS.map((s) => (
            <button
              key={s.name}
              onClick={() => setSearchParams({ sign: s.name.toLowerCase() })}
              className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                selectedSign === s.name.toLowerCase()
                  ? 'bg-[#c9a84c]/20 border border-[#c9a84c]/60 text-[#c9a84c]'
                  : 'bg-[#1a2f4a]/40 border border-[#2d5a8e]/20 text-gray-300 hover:border-[#c9a84c]/30'
              }`}
            >
              <span className="text-2xl">{s.symbol}</span>
              <span className="text-xs mt-0.5">{s.name}</span>
            </button>
          ))}
        </div>

        {isLoading && <Spinner size="lg" className="py-20" />}

        {/* Single sign detail */}
        {!isLoading && horoscope && (
          <div className="max-w-3xl mx-auto">
            <Card className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-5xl">{SIGNS.find(s => s.name.toLowerCase() === selectedSign)?.symbol}</div>
                <div>
                  <h2 className="text-2xl font-bold text-white font-serif capitalize">{selectedSign}</h2>
                  <p className="text-[#c9a84c] text-sm capitalize">{period} Horoscope</p>
                </div>
                <div className="ml-auto text-center">
                  <div className="text-3xl font-bold text-[#c9a84c]">{horoscope.rating}/10</div>
                  <div className="text-xs text-gray-400">Overall</div>
                </div>
              </div>

              <p className="text-gray-300 leading-relaxed mb-8 text-base">{horoscope.content}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: <Heart className="w-4 h-4" />, label: 'Love', content: horoscope.love, color: 'text-pink-400' },
                  { icon: <Briefcase className="w-4 h-4" />, label: 'Career', content: horoscope.career, color: 'text-blue-400' },
                  { icon: <Activity className="w-4 h-4" />, label: 'Health', content: horoscope.health, color: 'text-green-400' },
                  { icon: <DollarSign className="w-4 h-4" />, label: 'Finance', content: horoscope.finance, color: 'text-yellow-400' },
                ].map(({ icon, label, content, color }) => content && (
                  <div key={label} className="p-4 rounded-xl bg-[#0d1b2a]/60 border border-[#2d5a8e]/20">
                    <div className={`flex items-center gap-2 font-medium mb-2 ${color}`}>
                      {icon} {label}
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{content}</p>
                  </div>
                ))}
              </div>

              {(horoscope.lucky_number || horoscope.lucky_color) && (
                <div className="mt-6 flex gap-4 flex-wrap">
                  {horoscope.lucky_number && (
                    <div className="px-4 py-2 rounded-lg bg-[#c9a84c]/10 border border-[#c9a84c]/30">
                      <span className="text-xs text-gray-400">Lucky Number </span>
                      <span className="text-[#c9a84c] font-bold">{horoscope.lucky_number}</span>
                    </div>
                  )}
                  {horoscope.lucky_color && (
                    <div className="px-4 py-2 rounded-lg bg-[#c9a84c]/10 border border-[#c9a84c]/30">
                      <span className="text-xs text-gray-400">Lucky Color </span>
                      <span className="text-[#c9a84c] font-bold">{horoscope.lucky_color}</span>
                    </div>
                  )}
                  {horoscope.compatibility && (
                    <div className="px-4 py-2 rounded-lg bg-[#c9a84c]/10 border border-[#c9a84c]/30">
                      <span className="text-xs text-gray-400">Compatible with </span>
                      <span className="text-[#c9a84c] font-bold">{horoscope.compatibility}</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* All signs grid */}
        {!isLoading && !selectedSign && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allData?.length > 0 ? allData.map((h) => {
              const sign = SIGNS.find(s => s.name.toLowerCase() === h.zodiac_sign)
              return (
                <Card key={h.id} hover className="p-6" onClick={() => setSearchParams({ sign: h.zodiac_sign })}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{sign?.symbol}</span>
                    <div>
                      <h3 className="font-semibold text-white capitalize">{h.zodiac_sign}</h3>
                      <div className="text-[#c9a84c] text-sm">{h.rating}/10</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">{h.content}</p>
                </Card>
              )
            }) : (
              <div className="col-span-3 text-center py-20 text-gray-500">
                <Star className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Horoscopes will be available soon.</p>
                <p className="text-sm mt-2">Check back tomorrow for your daily reading.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
