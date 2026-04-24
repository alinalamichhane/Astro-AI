import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Save, User, MapPin, Calendar, Clock, ChevronLeft } from 'lucide-react'
import { getProfile, updateProfile } from '../../api/auth'
import { generateBirthChart } from '../../api/horoscope'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import useAuthStore from '../../store/authStore'
import { getErrorMessage, getFieldErrors, toastError } from '../../utils/errorHandler'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'

const TIMEZONES = [
  'Asia/Kathmandu', 'Asia/Kolkata', 'UTC', 'America/New_York',
  'America/Los_Angeles', 'Europe/London', 'Asia/Dubai', 'Australia/Sydney',
]

export default function Profile() {
  const { setUser } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile().then((r) => r.data),
  })

  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', bio: '',
    gender: '', date_of_birth: '', time_of_birth: '',
    place_of_birth: '', latitude: '', longitude: '', timezone: 'Asia/Kathmandu',
  })

  // Populate form once profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        gender: profile.gender || '',
        date_of_birth: profile.date_of_birth || '',
        time_of_birth: profile.time_of_birth || '',
        place_of_birth: profile.place_of_birth || '',
        latitude: profile.latitude || '',
        longitude: profile.longitude || '',
        timezone: profile.timezone || 'UTC',
      })
    }
  }, [profile])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await updateProfile(form)
      setUser(data)
      queryClient.setQueryData(['profile'], data)
      toast.success('Profile updated!')
      navigate('/dashboard')
    } catch (err) {
      const fields = getFieldErrors(err)
      if (Object.keys(fields).length > 0) {
        Object.values(fields).forEach((msg) => toast.error(msg))
      } else {
        toastError(err, 'Failed to update profile.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateChart = async () => {
    if (!form.date_of_birth || !form.time_of_birth || !form.latitude || !form.longitude) {
      toast.error('Please fill in date of birth, time of birth, and coordinates first, then save.')
      return
    }
    setGenerating(true)
    try {
      await generateBirthChart()
      queryClient.invalidateQueries(['birth-chart'])
      toast.success('Birth chart generated! 🌟')
    } catch (err) {
      toastError(err, 'Failed to generate birth chart.')
    } finally {
      setGenerating(false)
    }
  }

  const handleGeocode = () => {
    if (!form.place_of_birth) { toast.error('Enter place of birth first'); return }
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.place_of_birth)}&format=json&limit=1`)
      .then((r) => {
        if (!r.ok) throw new Error('Geocoding service unavailable')
        return r.json()
      })
      .then((data) => {
        if (data.length > 0) {
          setForm((f) => ({
            ...f,
            latitude: parseFloat(data[0].lat).toFixed(6),
            longitude: parseFloat(data[0].lon).toFixed(6),
          }))
          toast.success(`Coordinates found for ${data[0].display_name.split(',')[0]}`)
        } else {
          toast.error('Location not found. Please enter coordinates manually.')
        }
      })
      .catch(() => toast.error('Geocoding failed. Please enter coordinates manually.'))
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-40">
          <div className="w-8 h-8 border-2 border-[#2d5a8e] border-t-[#c9a84c] rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  const birthDataComplete = form.date_of_birth && form.time_of_birth && form.latitude && form.longitude

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors text-sm">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-white font-serif mb-8">Edit Profile</h1>

        <form onSubmit={handleSave} className="space-y-6">

          {/* Basic Info */}
          <Card className="p-6">
            <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
              <User className="w-4 h-4 text-[#c9a84c]" /> Basic Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name" value={form.first_name} onChange={set('first_name')} placeholder="John" />
              <Input label="Last Name" value={form.last_name} onChange={set('last_name')} placeholder="Doe" />
              <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+977 98XXXXXXXX" />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-300">Gender</label>
                <select
                  value={form.gender}
                  onChange={set('gender')}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0d1b2a] border border-[#2d5a8e]/50 text-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50"
                >
                  <option value="">Select gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={set('bio')}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0d1b2a] border border-[#2d5a8e]/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50 resize-none"
                />
              </div>
            </div>
          </Card>

          {/* Birth Details — required for chart */}
          <Card className="p-6">
            <h2 className="font-semibold text-white mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#c9a84c]" /> Birth Details
            </h2>
            <p className="text-xs text-gray-400 mb-5">Required to generate your Vedic birth chart and personalized horoscope</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Date of Birth"
                type="date"
                value={form.date_of_birth}
                onChange={set('date_of_birth')}
              />
              <Input
                label="Time of Birth"
                type="time"
                value={form.time_of_birth}
                onChange={set('time_of_birth')}
              />
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Place of Birth</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.place_of_birth}
                    onChange={set('place_of_birth')}
                    placeholder="e.g. Kathmandu, Nepal"
                    className="flex-1 px-4 py-2.5 rounded-lg bg-[#0d1b2a] border border-[#2d5a8e]/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50"
                  />
                  <Button type="button" variant="secondary" size="md" onClick={handleGeocode}>
                    <MapPin className="w-4 h-4" /> Find
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Click "Find" to auto-fill coordinates from place name</p>
              </div>
              <Input
                label="Latitude"
                type="number"
                step="0.000001"
                value={form.latitude}
                onChange={set('latitude')}
                onBlur={e => setForm(f => ({ ...f, latitude: e.target.value ? parseFloat(e.target.value).toFixed(6) : '' }))}
                placeholder="e.g. 27.700769"
              />
              <Input
                label="Longitude"
                type="number"
                step="0.000001"
                value={form.longitude}
                onChange={set('longitude')}
                onBlur={e => setForm(f => ({ ...f, longitude: e.target.value ? parseFloat(e.target.value).toFixed(6) : '' }))}
                placeholder="e.g. 85.314940"
              />
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Timezone</label>
                <select
                  value={form.timezone}
                  onChange={set('timezone')}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0d1b2a] border border-[#2d5a8e]/50 text-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Generate chart button */}
            <div className={`mt-5 p-4 rounded-xl border ${birthDataComplete ? 'border-[#c9a84c]/30 bg-[#c9a84c]/5' : 'border-[#2d5a8e]/20 bg-[#0d1b2a]/40'}`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-medium text-white">Generate Birth Chart</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {birthDataComplete
                      ? 'Save your profile first, then generate your chart'
                      : 'Fill in all birth details above to unlock'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={birthDataComplete ? 'primary' : 'outline'}
                  size="sm"
                  onClick={handleGenerateChart}
                  loading={generating}
                  disabled={!birthDataComplete}
                >
                  ✨ Generate Chart
                </Button>
              </div>
            </div>
          </Card>

          {/* Save */}
          <div className="flex justify-end gap-3">
            <Link to="/dashboard">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" loading={saving}>
              <Save className="w-4 h-4" /> Save Profile
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
