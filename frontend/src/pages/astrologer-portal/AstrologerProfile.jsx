import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Save, Star, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { getAstrologerProfile, updateAstrologerProfile, registerAsAstrologer } from '../../api/astrologers'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import { getErrorMessage, getFieldErrors } from '../../utils/errorHandler'
import toast from 'react-hot-toast'

const SPECIALIZATIONS = ['vedic','numerology','tarot','vastu','palmistry','kundali','career','relationship']
const LANGUAGES = ['Nepali','Hindi','English','Maithili','Bhojpuri']

export default function AstrologerProfile() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [form, setForm] = useState(null)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['astrologer-profile'],
    queryFn: () => getAstrologerProfile().then(r => r.data),
    retry: false,
  })

  // isFirstTime = profile exists but not yet completed
  const isFirstTime = !isLoading && profile && !profile.profile_complete

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        experience_years: profile.experience_years || '',
        rate_per_min_npr: profile.rate_per_min_npr || '50',
        rate_per_min_usd: profile.rate_per_min_usd || '1',
        specializations: profile.specializations || [],
        languages: profile.languages?.length ? profile.languages : ['Nepali'],
        is_available: profile.is_available || false,
      })
    }
  }, [profile])

  const toggle = (field, val) => setForm(f => ({
    ...f,
    [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val],
  }))

  const handleSave = async (e) => {
    e.preventDefault()
    setFieldErrors({})
    setSaving(true)
    try {
      // Always PATCH — the draft record was created at registration
      await updateAstrologerProfile(form)
      queryClient.invalidateQueries({ queryKey: ['astrologer-profile'] })
      queryClient.invalidateQueries({ queryKey: ['astrologer-profile-check'] })
      queryClient.invalidateQueries({ queryKey: ['astrologer-dashboard'] })

      if (isFirstTime) {
        toast.success('Profile saved! Welcome to AstroAI Astrologer Portal 🌟')
        navigate('/astrologer/dashboard')
      } else {
        toast.success('Profile updated!')
      }
    } catch (err) {
      const fields = getFieldErrors(err)
      if (Object.keys(fields).length) setFieldErrors(fields)
      else toast.error(getErrorMessage(err, 'Failed to save profile.'))
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !form) return <Layout><Spinner size="lg" className="py-40" /></Layout>

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link to="/astrologer/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white font-serif mb-8">
          {isFirstTime ? 'Set Up Your Astrologer Profile' : 'Edit Astrologer Profile'}
        </h1>

        {/* First-time welcome banner */}
        {isFirstTime && (
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-[#c9a84c]/10 to-[#2d5a8e]/10 border border-[#c9a84c]/30">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#c9a84c] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium">Welcome to AstroAI Astrologer Portal!</p>
                <p className="text-sm text-gray-400 mt-1">
                  Complete your profile to start accepting consultations. Your profile will be reviewed by our team before going live.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-[#c9a84c]" /> Basic Info
            </h2>
            <Input label="Display Name" value={form.display_name}
              onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              error={fieldErrors.display_name} required />
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Bio</label>
              <textarea value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={4} required
                className="w-full px-4 py-2.5 rounded-lg bg-[#0d1b2a] border border-[#2d5a8e]/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50 resize-none"
              />
            </div>
            <Input label="Years of Experience" type="number" min="0"
              value={form.experience_years}
              onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))}
              error={fieldErrors.experience_years} required />
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-white">Rates</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="NPR / minute" type="number" min="10"
                value={form.rate_per_min_npr}
                onChange={e => setForm(f => ({ ...f, rate_per_min_npr: e.target.value }))}
                error={fieldErrors.rate_per_min_npr} required />
              <Input label="USD / minute" type="number" min="0.5" step="0.5"
                value={form.rate_per_min_usd}
                onChange={e => setForm(f => ({ ...f, rate_per_min_usd: e.target.value }))}
                error={fieldErrors.rate_per_min_usd} required />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-white">Specializations</h2>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map(s => (
                <button key={s} type="button" onClick={() => toggle('specializations', s)}
                  className={`px-4 py-2 rounded-full text-sm capitalize transition-all ${
                    form.specializations.includes(s)
                      ? 'bg-[#c9a84c] text-[#0d1b2a] font-medium'
                      : 'bg-[#1a2f4a] border border-[#2d5a8e]/30 text-gray-300 hover:border-[#c9a84c]/40'
                  }`}>{s}</button>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-white">Languages</h2>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(l => (
                <button key={l} type="button" onClick={() => toggle('languages', l)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    form.languages.includes(l)
                      ? 'bg-[#2d5a8e] text-white font-medium'
                      : 'bg-[#1a2f4a] border border-[#2d5a8e]/30 text-gray-300 hover:border-[#2d5a8e]/60'
                  }`}>{l}</button>
              ))}
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            {!isFirstTime && (
              <Link to="/astrologer/dashboard">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            )}
            <Button type="submit" loading={saving}>
              <Save className="w-4 h-4" />
              {isFirstTime ? 'Save & Go to Dashboard' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
