import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Star, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { login } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { getErrorMessage, getFieldErrors } from '../../utils/errorHandler'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect back to where the user came from, but never back to /login itself
  const from = (location.state?.from && location.state.from !== '/login')
    ? location.state.from
    : null  // null means we'll decide after login based on role

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})
    setLoading(true)
    try {
      const { data } = await login(form.email, form.password)
      setAuth(data.user, data.access, data.refresh)
      toast.success('Welcome back!')

      if (data.user?.role === 'astrologer') {
        // Profile not complete yet → send to profile setup
        if (!data.astrologer_profile_complete) {
          navigate('/astrologer/profile', { replace: true })
        } else {
          navigate(from || '/astrologer/dashboard', { replace: true })
        }
      } else {
        navigate(from || '/dashboard', { replace: true })
      }
    } catch (err) {
      const fields = getFieldErrors(err)
      if (Object.keys(fields).length > 0) {
        setFieldErrors(fields)
      } else {
        toast.error(getErrorMessage(err, 'Invalid email or password.'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1b2a]">

      {/* Minimal top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#2d5a8e]/20">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#2d5a8e] flex items-center justify-center">
            <Star className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-lg font-bold text-white font-serif">
            Astro<span className="text-[#c9a84c]">AI</span>
          </span>
        </Link>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white font-serif">Welcome Back</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to your AstroAI account</p>
          </div>

          <div className="bg-[#1a2f4a]/60 border border-[#2d5a8e]/30 rounded-2xl p-8 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={fieldErrors.email}
                required
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 pr-11 rounded-lg bg-[#0d1b2a] border border-[#2d5a8e]/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" loading={loading}>
                Sign In
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-[#2d5a8e]/20 space-y-3 text-center text-sm text-gray-400">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="text-[#c9a84c] hover:underline font-medium">
                  Create one free
                </Link>
              </p>
              <p>
                Want to offer consultations?{' '}
                <Link to="/register?role=astrologer" className="text-[#c9a84c] hover:underline font-medium">
                  Join as Astrologer
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
