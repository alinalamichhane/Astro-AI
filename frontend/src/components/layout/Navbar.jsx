import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Star, Menu, X, User, LogOut, MessageCircle, ChevronDown, LayoutDashboard, Calendar, ShoppingCart } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useCartStore from '../../store/cartStore'
import { logout } from '../../api/auth'
import toast from 'react-hot-toast'

// Cart icon with badge
function CartIcon() {
  const totalItems = useCartStore(state => state.items.reduce((sum, i) => sum + i.quantity, 0))
  return (
    <Link to="/marketplace/cart"
      className="relative p-2 rounded-lg text-gray-300 hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors"
      title="Shopping Cart">
      <ShoppingCart className="w-5 h-5" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#c9a84c] text-[#0d1b2a] text-[10px] font-bold flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </Link>
  )
}

// Nav links shown to regular users
const USER_NAV = [
  { label: 'Horoscope', path: '/horoscope' },
  { label: 'Astrologers', path: '/astrologers' },
  { label: 'Marketplace', path: '/marketplace' },
  { label: 'Courses', path: '/courses' },
  { label: 'Plans', path: '/plans' },
]

// Nav links shown to astrologers — they don't browse the platform as users
const ASTROLOGER_NAV = [
  { label: 'Dashboard', path: '/astrologer/dashboard' },
  { label: 'Consultations', path: '/astrologer/consultations' },
  { label: 'Availability', path: '/astrologer/availability' },
  { label: 'My Profile', path: '/astrologer/profile' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, refreshToken, logout: clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const isAstrologer = user?.role === 'astrologer'
  const navLinks = isAstrologer ? ASTROLOGER_NAV : USER_NAV

  const handleLogout = async () => {
    try { await logout(refreshToken) } catch {}
    clearAuth()
    toast.success('Logged out')
    navigate('/')
  }

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d1b2a]/95 backdrop-blur border-b border-[#2d5a8e]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to={isAstrologer ? '/astrologer/dashboard' : '/'} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#2d5a8e] flex items-center justify-center">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-xl font-bold text-white font-serif">
              Astro<span className="text-[#c9a84c]">AI</span>
            </span>
            {isAstrologer && (
              <span className="hidden sm:block text-xs text-[#c9a84c] border border-[#c9a84c]/40 px-2 py-0.5 rounded-full">
                Astrologer
              </span>
            )}
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-[#c9a84c] bg-[#c9a84c]/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Chat icon — only for regular users */}
                {!isAstrologer && (
                  <>
                    <Link to="/chat"
                      className="p-2 rounded-lg text-gray-300 hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors"
                      title="AI Chat">
                      <MessageCircle className="w-5 h-5" />
                    </Link>
                    <CartIcon />
                  </>
                )}

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      isAstrologer
                        ? 'bg-gradient-to-br from-[#c9a84c] to-[#8e6a2d]'
                        : 'bg-gradient-to-br from-[#2d5a8e] to-[#c9a84c]'
                    }`}>
                      {user.first_name?.[0] || user.email?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-300">{user.first_name || 'Account'}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-[#1a2f4a] border border-[#2d5a8e]/40 rounded-xl shadow-xl overflow-hidden">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-[#2d5a8e]/30">
                        <p className="text-sm font-medium text-white">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        <p className={`text-xs mt-1 font-medium ${isAstrologer ? 'text-[#c9a84c]' : 'text-blue-400'}`}>
                          {isAstrologer ? '⭐ Astrologer' : `⚡ ${user.ai_tokens} tokens`}
                        </p>
                      </div>

                      {/* Astrologer links */}
                      {isAstrologer ? (
                        <>
                          <Link to="/astrologer/dashboard" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                          </Link>
                          <Link to="/astrologer/consultations" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                            <Calendar className="w-4 h-4" /> Consultations
                          </Link>
                          <Link to="/astrologer/profile" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                            <User className="w-4 h-4" /> My Profile
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link to="/dashboard" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                          </Link>
                          <Link to="/astrologer/register" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                            <Star className="w-4 h-4" /> Become an Astrologer
                          </Link>
                        </>
                      )}

                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-[#2d5a8e]/20">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium bg-[#c9a84c] hover:bg-[#e8c96d] text-[#0d1b2a] rounded-lg transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 text-gray-300 hover:text-white" onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#0d1b2a] border-t border-[#2d5a8e]/30 px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} onClick={() => setOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.path) ? 'text-[#c9a84c] bg-[#c9a84c]/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}>
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#2d5a8e]/30 flex flex-col gap-2">
            {user ? (
              <>
                {!isAstrologer && (
                  <Link to="/chat" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white">
                    AI Chat
                  </Link>
                )}
                <button onClick={handleLogout} className="text-left px-4 py-2.5 text-sm text-red-400">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm text-center border border-[#2d5a8e] rounded-lg text-gray-300">Login</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm text-center bg-[#c9a84c] text-[#0d1b2a] rounded-lg font-medium">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

