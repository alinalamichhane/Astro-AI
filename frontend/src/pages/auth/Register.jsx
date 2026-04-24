import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Star, ArrowLeft, User, Sparkles, Check } from 'lucide-react'
import { register } from '../../api/auth'
import { registerAsAstrologer } from '../../api/astrologers'
import useAuthStore from '../../store/authStore'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import { getErrorMessage, getFieldErrors } from '../../utils/errorHandler'
import toast from 'react-hot-toast'

const SPECIALIZATIONS = [
  'vedic', 'numerology', 'tarot', 'vastu',
  'palmistry', 'kundali', 'career', 'relationship',
]
const LANGUAGES = ['Nepali', 'Hindi', 'English', 'Maithili', 'Bhojpuri']

// ── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ step, isAstrologer }) {
  const steps = isAstrologer
    ? ['Choose Role', 'Account Details', 'Astrologer Profile']
    : ['Choose Role', 'Account Details']

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const num = i + 1
        const done = step > num
        const active = step === num
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? 'bg-green-500 text-white' :
                active ? 'bg-[#c9a84c] text-[#0d1b2a]' :
                'bg-[#1a2f4a] border border-[#2d5a8e]/40 text-gray-500'
              }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : num}
              </div>
              <span className={`text-xs hidden sm:block ${active ? 'text-white' : 'text-gray-500'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px ${step > num ? 'bg-green-500' : 'bg-[#2d5a8e]/30'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Register() {
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') === 'astrologer' ? 'astrologer' : 'user'

  // step 1 = role selection, step 2 = account form, step 3 = astrologer profile
  const [step, setStep] = useState(1)
  const [role, setRole] = useState(defaultRole)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  // Step 2 — account fields
  const [account, setAccount] = useState({
    first_name: '', last_name: '', username: '',
    email: '', password: '', password2: '', phone: '',
  })

  // Step 3 — astrologer profile fields
  const [profile, setProfile] = useState({
    display_name: '',
    bio: '',
    experience_years: '',
    rate_per_min_npr: '50',
    rate_per_min_usd: '1',
    specializations: [],
    languages: ['Nepali'],
  })

  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const setAcc = (k) => (e) => setAccount(a => ({ ...a, [k]: e.target.value }))

  const toggleSpec = (s) => setProfile(p => ({
    ...p,
    specializations: p.specializations.includes(s)
      ? p.specializations.filter(x => x !== s)
      : [...p.specializations, s],
  }))

  const toggleLang = (l) => setProfile(p => ({
    ...p,
    languages: p.languages.includes(l)
      ? p.languages.filter(x => x !== l)
      : [...p.languages, l],
  }))

  // ── Step 1 → 2: just pick role ──────────────────────────────────────────
  const handleRoleSelect = (chosen) => {
    setRole(chosen)
    setStep(2)
  }

  // ── Step 2: create account ──────────────────────────────────────────────
  const handleAccountSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})
    if (account.password !== account.password2) {
      setFieldErrors({ password2: 'Passwords do not match.' })
      return
    }
    setLoading(true)
    try {
      // Pass role so the backend sets it immediately on account creation
      const { data } = await register({ ...account, role })
      setAuth(data.user, data.tokens.access, data.tokens.refresh)

      if (role === 'astrologer') {
        setProfile(p => ({
          ...p,
          display_name: `${account.first_name} ${account.last_name}`.trim(),
        }))
        toast.success('Account created! Now set up your astrologer profile.')
        setStep(3)
      } else {
        toast.success('Account created! Welcome to AstroAI 🌟')
        navigate('/dashboard')
      }
    } catch (err) {
      const fields = getFieldErrors(err)
      if (Object.keys(fields).length > 0) setFieldErrors(fields)
      else toast.error(getErrorMessage(err, 'Registration failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: create astrologer profile ──────────────────────────────────
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})
    if (!profile.specializations.length) {
      toast.error('Please select at least one specialization.')
      return
    }
    setLoading(true)
    try {
      await registerAsAstrologer(profile)
      toast.success('Astrologer profile submitted! Pending admin verification.')
      navigate('/astrologer/dashboard')
    } catch (err) {
      const fields = getFieldErrors(err)
      if (Object.keys(fields).length > 0) setFieldErrors(fields)
      else toast.error(getErrorMessage(err, 'Profile setup failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1b2a]">

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#2d5a8e]/20 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#2d5a8e] flex items-center justify-center">
            <Star className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-lg font-bold text-white font-serif">
            Astro<span className="text-[#c9a84c]">AI</span>
          </span>
        </Link>
        <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white font-serif">Create Your Account</h1>
            <p className="text-gray-400 text-sm mt-1">Start your cosmic journey with AstroAI</p>
          </div>

          <StepBar step={step} isAstrologer={role === 'astrologer'} />

          {/* ── Step 1: Role selection ─────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-center text-sm text-gray-400 mb-6">How do you want to use AstroAI?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleRoleSelect('user')}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-[#2d5a8e]/30 bg-[#1a2f4a]/40 hover:border-[#c9a84c]/60 hover:bg-[#1a2f4a]/80 transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-[#2d5a8e]/30 flex items-center justify-center group-hover:bg-[#2d5a8e]/50 transition-colors">
                    <User className="w-7 h-7 text-[#c9a84c]" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-base">I'm a User</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Get daily horoscopes, consult astrologers, explore gemstones and courses
                    </p>
                  </div>
                  <span className="text-xs text-[#c9a84c] font-medium">Get Started →</span>
                </button>

                <button
                  onClick={() => handleRoleSelect('astrologer')}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-[#2d5a8e]/30 bg-[#1a2f4a]/40 hover:border-[#c9a84c]/60 hover:bg-[#1a2f4a]/80 transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-[#c9a84c]/20 flex items-center justify-center group-hover:bg-[#c9a84c]/30 transition-colors">
                    <Sparkles className="w-7 h-7 text-[#c9a84c]" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-base">I'm an Astrologer</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Offer consultations, manage bookings, and earn income from your expertise
                    </p>
                  </div>
                  <span className="text-xs text-[#c9a84c] font-medium">Apply Now →</span>
                </button>
              </div>

              <p className="text-center text-sm text-gray-500 mt-4">
                Already have an account?{' '}
                <Link to="/login" className="text-[#c9a84c] hover:underline">Sign in</Link>
              </p>
            </div>
          )}

          {/* ── Step 2: Account details ────────────────────────────────── */}
          {step === 2 && (
            <div>
              {/* Role badge */}
              <div className="flex items-center justify-center gap-2 mb-5">
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium ${
                  role === 'astrologer'
                    ? 'bg-[#c9a84c]/20 border border-[#c9a84c]/40 text-[#c9a84c]'
                    : 'bg-[#2d5a8e]/20 border border-[#2d5a8e]/40 text-blue-300'
                }`}>
                  {role === 'astrologer' ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  Registering as {role === 'astrologer' ? 'Astrologer' : 'User'}
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-gray-500 hover:text-gray-300 underline transition-colors"
                >
                  Change
                </button>
              </div>

              <div className="bg-[#1a2f4a]/60 border border-[#2d5a8e]/30 rounded-2xl p-8 backdrop-blur-sm">
                <form onSubmit={handleAccountSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="First Name" placeholder="John" value={account.first_name}
                      onChange={setAcc('first_name')} error={fieldErrors.first_name} required />
                    <Input label="Last Name" placeholder="Doe" value={account.last_name}
                      onChange={setAcc('last_name')} error={fieldErrors.last_name} />
                  </div>
                  <Input label="Username" placeholder="johndoe" value={account.username}
                    onChange={setAcc('username')} error={fieldErrors.username} required />
                  <Input label="Email" type="email" placeholder="you@example.com" value={account.email}
                    onChange={setAcc('email')} error={fieldErrors.email} required />
                  <Input label="Phone (optional)" type="tel" placeholder="+977 98XXXXXXXX"
                    value={account.phone} onChange={setAcc('phone')} error={fieldErrors.phone} />
                  <Input label="Password" type="password" placeholder="Min 8 characters"
                    value={account.password} onChange={setAcc('password')} error={fieldErrors.password} required />
                  <Input label="Confirm Password" type="password" placeholder="Repeat password"
                    value={account.password2} onChange={setAcc('password2')} error={fieldErrors.password2} required />

                  <Button type="submit" className="w-full mt-2" loading={loading}>
                    {role === 'astrologer' ? 'Create Account & Continue →' : 'Create Account'}
                  </Button>
                </form>

                <p className="text-center text-sm text-gray-400 mt-5">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#c9a84c] hover:underline font-medium">Sign in</Link>
                </p>
              </div>
            </div>
          )}

          {/* ── Step 3: Astrologer profile ─────────────────────────────── */}
          {step === 3 && (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <p className="text-center text-sm text-gray-400 -mt-2 mb-2">
                Tell us about your expertise. This will be reviewed before you go live.
              </p>

              <Card className="p-5 space-y-4">
                <h3 className="font-semibold text-white text-sm">Basic Info</h3>
                <Input label="Display Name" value={profile.display_name}
                  onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))}
                  error={fieldErrors.display_name} placeholder="Your professional name" required />
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1.5">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    rows={3} required
                    placeholder="Describe your expertise and approach to Vedic astrology..."
                    className="w-full px-4 py-2.5 rounded-lg bg-[#0d1b2a] border border-[#2d5a8e]/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50 resize-none text-sm"
                  />
                  {fieldErrors.bio && <p className="text-xs text-red-400 mt-1">{fieldErrors.bio}</p>}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Experience (yrs)" type="number" min="0"
                    value={profile.experience_years}
                    onChange={e => setProfile(p => ({ ...p, experience_years: e.target.value }))}
                    error={fieldErrors.experience_years} placeholder="5" required />
                  <Input label="NPR / min" type="number" min="10"
                    value={profile.rate_per_min_npr}
                    onChange={e => setProfile(p => ({ ...p, rate_per_min_npr: e.target.value }))}
                    error={fieldErrors.rate_per_min_npr} required />
                  <Input label="USD / min" type="number" min="0.5" step="0.5"
                    value={profile.rate_per_min_usd}
                    onChange={e => setProfile(p => ({ ...p, rate_per_min_usd: e.target.value }))}
                    error={fieldErrors.rate_per_min_usd} required />
                </div>
              </Card>

              <Card className="p-5 space-y-3">
                <h3 className="font-semibold text-white text-sm">Specializations <span className="text-red-400">*</span></h3>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map(s => (
                    <button key={s} type="button" onClick={() => toggleSpec(s)}
                      className={`px-3 py-1.5 rounded-full text-xs capitalize transition-all ${
                        profile.specializations.includes(s)
                          ? 'bg-[#c9a84c] text-[#0d1b2a] font-medium'
                          : 'bg-[#1a2f4a] border border-[#2d5a8e]/30 text-gray-300 hover:border-[#c9a84c]/40'
                      }`}>{s}</button>
                  ))}
                </div>
              </Card>

              <Card className="p-5 space-y-3">
                <h3 className="font-semibold text-white text-sm">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <button key={l} type="button" onClick={() => toggleLang(l)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                        profile.languages.includes(l)
                          ? 'bg-[#2d5a8e] text-white font-medium'
                          : 'bg-[#1a2f4a] border border-[#2d5a8e]/30 text-gray-300 hover:border-[#2d5a8e]/60'
                      }`}>{l}</button>
                  ))}
                </div>
              </Card>

              <div className="p-3 rounded-xl bg-[#c9a84c]/5 border border-[#c9a84c]/20 text-xs text-gray-400">
                ⚠️ Your profile will be reviewed before being listed publicly (1–2 business days).
              </div>

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                Submit Application
              </Button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
