import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Save, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getAstrologerAvailability, saveAstrologerAvailability } from '../../api/astrologers'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { toastError } from '../../utils/errorHandler'
import toast from 'react-hot-toast'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const defaultSlots = () => DAYS.map((_, i) => ({
  day_of_week: i,
  start_time: '09:00',
  end_time: '18:00',
  is_active: i < 5, // Mon–Fri active by default
}))

export default function AstrologerAvailability() {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [slots, setSlots] = useState(defaultSlots())

  const { data, isLoading } = useQuery({
    queryKey: ['astrologer-availability'],
    queryFn: () => getAstrologerAvailability().then(r => r.data),
  })

  useEffect(() => {
    if (data?.length) {
      // Merge saved slots with defaults
      const merged = defaultSlots().map(def => {
        const saved = data.find(s => s.day_of_week === def.day_of_week)
        return saved ? { ...def, ...saved } : def
      })
      setSlots(merged)
    }
  }, [data])

  const update = (idx, field, value) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveAstrologerAvailability(slots)
      queryClient.invalidateQueries({ queryKey: ['astrologer-availability'] })
      toast.success('Availability saved!')
    } catch (err) {
      toastError(err, 'Failed to save availability.')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <Layout><Spinner size="lg" className="py-40" /></Layout>

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link to="/astrologer/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white font-serif mb-2">Availability Schedule</h1>
        <p className="text-gray-400 text-sm mb-8">Set your weekly working hours. Users can only book during these times.</p>

        <Card className="p-6">
          <div className="space-y-4">
            {slots.map((slot, idx) => (
              <div key={slot.day_of_week} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                slot.is_active ? 'bg-[#1a2f4a]/60 border border-[#2d5a8e]/30' : 'bg-[#0d1b2a]/40 border border-transparent opacity-60'
              }`}>
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => update(idx, 'is_active', !slot.is_active)}
                  className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${
                    slot.is_active ? 'bg-[#c9a84c]' : 'bg-gray-600'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    slot.is_active ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>

                {/* Day name */}
                <span className={`w-24 text-sm font-medium flex-shrink-0 ${slot.is_active ? 'text-white' : 'text-gray-500'}`}>
                  {DAYS[slot.day_of_week]}
                </span>

                {/* Time inputs */}
                <div className="flex items-center gap-2 flex-1">
                  <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <input
                    type="time"
                    value={slot.start_time}
                    onChange={e => update(idx, 'start_time', e.target.value)}
                    disabled={!slot.is_active}
                    className="flex-1 px-2 py-1 rounded-lg bg-[#0d1b2a] border border-[#2d5a8e]/40 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/50 disabled:opacity-40"
                  />
                  <span className="text-gray-500 text-xs">to</span>
                  <input
                    type="time"
                    value={slot.end_time}
                    onChange={e => update(idx, 'end_time', e.target.value)}
                    disabled={!slot.is_active}
                    className="flex-1 px-2 py-1 rounded-lg bg-[#0d1b2a] border border-[#2d5a8e]/40 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/50 disabled:opacity-40"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4" /> Save Schedule
          </Button>
        </div>
      </div>
    </Layout>
  )
}
