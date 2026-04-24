import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Star, ChevronLeft, LogIn, UserPlus } from 'lucide-react'
import { registerAsAstrologer } from '../../api/astrologers'
import useAuthStore from '../../store/authStore'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import Layout from '../../components/layout/Layout'
import { getErrorMessage, getFieldErrors } from '../../utils/errorHandler'
import toast from 'react-hot-toast'

const SPECIALIZATIONS = [
  'vedic', 'numerology', 'tarot', 'vastu', 'palmistry',
  'kundali', 'career', 'relationship',
]
const LANGUAGES = ['Nepali', 'Hindi', 'English', 'Maithili', 'Bhojpuri']

export default function AstrologerRegister() {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [form, setForm] = useState({
    display_name: user ? `${user.first_name} ${user.last_name}`.trim() : '',
    bio: '',
    experience_years: '',
    rate_per_min_npr: '50',
    rate_per_min_usd: '1',
    specializations: [],
    languages: ['Nepali'],
  })

  const toggleSpec = (s) => setForm(f => ({
    ...f,
    specializations: f.specializations.includes(s)
      ? f.specializations.filter(x => x !== s)
      : [...f.specializations, s],
  }))

  const toggleLang = (l) => setForm(f => ({
    ...f,
    languages: f.languages.includes(l)
      ? f.languages.filter(x => x !== l)
      : [...f.languages, l],
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})
    if (!form.specializations.length) {
      toast.error('Please select at least one specialization.')
      return
    }
    setLoading(true)
    try {
      await registerAsAstrologer(form)
      setUser({ ...user, role: 'astrologer' })
      toast.success('Astrologer profile created! Pending admin verification.')
      navigate('/astrologer/dashboard')
    } catch (err) {
      const fields = getFieldErrors(err)
      if (Object.keys(fields).length) setFieldErrors(fields)
      else toast.error(getErrorMessage(err, 'Registration failed.'))
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#2d5a8e] flex items-center justify-center mx-auto mb-5">
              <Star className="w-8 h-8 text-white fill-white" />
            </div>
            <h2 className="text-2xl font-bold text-white font-serif mb-2">Join as an Astrologer</h2>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Share your Vedic wisdom with thousands of seekers. Create an account or sign in to set up your astrologer profile.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register?role=astrologer">
                <Button size="lg" className="w-full sm:w-auto">
                  <UserPlus className="w-4 h-4" /> Create Account
                </Button>
              </Link>
              <Link to="/login" state={{ from: '/astrologer/register' }}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <LogIn className="w-4 h-4" /> Sign In
                </Button>
              </Link>
            </div>
            <p className="text-xs text-gray-600 mt-6">
              Already a user?{' '}
              <Link to="/login" state={{ from: '/astrologer/register' }} className="text-[#c9a84c] hover:underline">
                Sign in and apply from your account
              </Link>
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
    <div className="min-h-screen px-4 py-10 max-w-2xl mx-auto">
      <Link to="/astrologers" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back
      </Link>

      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#2d5a8e] flex items-center justify-center mx-auto mb-4">
          <Star className="w-7 h-7 text-white fill-white" />
        </div>
        <h1 className="text-3xl font-bold text-white font-serif">Become an Astrologer</h1>
        <p className="text-gray-400 text-sm mt-2">Share your Vedic wisdom and help thousands of seekers</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-white">Basic Information</h2>
          <Input label="Display Name" value={form.display_name}
            onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
            error={fieldErrors.display_name} placeholder="Your professional name" required />
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Bio</label>
            <textarea value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={4} required
              placeholder="Describe your expertise, background, and approach to astrology..."
              className="w-full px-4 py-2.5 rounded-lg bg-[#0d1b2a] border border-[#2d5a8e]/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50 resize-none"
            />
            {fieldErrors.bio && <p className="text-xs text-red-400 mt-1">{fieldErrors.bio}</p>}
          </div>
          <Input label="Years of Experience" type="number" min="0" max="60"
            value={form.experience_years}
            onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))}
            error={fieldErrors.experience_years} placeholder="e.g. 5" required />
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-white">Consultation Rates</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Rate per minute (NPR)" type="number" min="10"
              value={form.rate_per_min_npr}
              onChange={e => setForm(f => ({ ...f, rate_per_min_npr: e.target.value }))}
              error={fieldErrors.rate_per_min_npr} placeholder="50" required />
            <Input label="Rate per minute (USD)" type="number" min="0.5" step="0.5"
              value={form.rate_per_min_usd}
              onChange={e => setForm(f => ({ ...f, rate_per_min_usd: e.target.value }))}
              error={fieldErrors.rate_per_min_usd} placeholder="1" required />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-white">Specializations</h2>
          <p className="text-xs text-gray-400">Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map(s => (
              <button key={s} type="button" onClick={() => toggleSpec(s)}
                className={`px-4 py-2 rounded-full text-sm capitalize transition-all ${
                  form.specializations.includes(s)
                    ? 'bg-[#c9a84c] text-[#0d1b2a] font-medium'
                    : 'bg-[#1a2f4a] border border-[#2d5a8e]/30 text-gray-300 hover:border-[#c9a84c]/40'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-white">Languages</h2>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(l => (
              <button key={l} type="button" onClick={() => toggleLang(l)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  form.languages.includes(l)
                    ? 'bg-[#2d5a8e] text-white font-medium'
                    : 'bg-[#1a2f4a] border border-[#2d5a8e]/30 text-gray-300 hover:border-[#2d5a8e]/60'
                }`}>
                {l}
              </button>
            ))}
          </div>
        </Card>

        <div className="p-4 rounded-xl bg-[#c9a84c]/5 border border-[#c9a84c]/20 text-sm text-gray-400">
          ⚠️ Your profile will be reviewed by our team before being listed publicly. This usually takes 1–2 business days.
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Submit Application
        </Button>
      </form>
    </div>
    </Layout>
  )
}
