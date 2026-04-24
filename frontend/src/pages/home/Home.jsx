import { Link } from 'react-router-dom'
import { Star, MessageCircle, Users, ShoppingBag, BookOpen, Zap, Shield, Globe, ArrowRight } from 'lucide-react'
import Button from '../../components/ui/Button'
import useAuthStore from '../../store/authStore'

const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈', dates: 'Mar 21 – Apr 19' },
  { name: 'Taurus', symbol: '♉', dates: 'Apr 20 – May 20' },
  { name: 'Gemini', symbol: '♊', dates: 'May 21 – Jun 20' },
  { name: 'Cancer', symbol: '♋', dates: 'Jun 21 – Jul 22' },
  { name: 'Leo', symbol: '♌', dates: 'Jul 23 – Aug 22' },
  { name: 'Virgo', symbol: '♍', dates: 'Aug 23 – Sep 22' },
  { name: 'Libra', symbol: '♎', dates: 'Sep 23 – Oct 22' },
  { name: 'Scorpio', symbol: '♏', dates: 'Oct 23 – Nov 21' },
  { name: 'Sagittarius', symbol: '♐', dates: 'Nov 22 – Dec 21' },
  { name: 'Capricorn', symbol: '♑', dates: 'Dec 22 – Jan 19' },
  { name: 'Aquarius', symbol: '♒', dates: 'Jan 20 – Feb 18' },
  { name: 'Pisces', symbol: '♓', dates: 'Feb 19 – Mar 20' },
]

const FEATURES = [
  {
    icon: <Star className="w-6 h-6" />,
    title: 'AI-Powered Horoscopes',
    desc: 'Daily, weekly & monthly predictions tailored to your birth chart using advanced AI.',
    path: '/horoscope',
    requiresAuth: false,
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: 'AI Astrology Chat',
    desc: 'Ask anything about your life — love, career, health — and get Vedic-guided answers instantly.',
    path: '/chat',
    requiresAuth: true,
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Expert Astrologers',
    desc: 'Book 1-on-1 sessions with verified Vedic astrologers via chat or video call.',
    path: '/astrologers',
    requiresAuth: false,
  },
  {
    icon: <ShoppingBag className="w-6 h-6" />,
    title: 'Spiritual Marketplace',
    desc: 'Shop gemstones, crystals, and pooja items recommended for your zodiac sign.',
    path: '/marketplace',
    requiresAuth: false,
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: 'Astrology Courses',
    desc: 'Learn Vedic astrology from beginner to advanced with expert-led courses.',
    path: '/courses',
    requiresAuth: false,
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Kundali Matching',
    desc: 'Comprehensive compatibility analysis for marriage and relationships.',
    path: '/kundali-match',
    requiresAuth: true,
  },
]

export default function Home() {
  const { accessToken } = useAuthStore()
  return (
    <div className="overflow-hidden">

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2d5a8e]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#c9a84c]/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1e3a5f]/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-[#c9a84c] text-sm mb-8">
            <Star className="w-4 h-4 fill-[#c9a84c]" />
            The All-in-One Vedic Astrology Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white font-serif leading-tight mb-6">
            Discover Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#c9a84c] to-[#e8c96d]">
              Cosmic Path
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Leverage the timeless wisdom of Vedic science. Get AI-powered horoscopes, consult expert astrologers, and find your purpose through the stars.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto">
                <Star className="w-5 h-5" />
                Start Your Journey
              </Button>
            </Link>
            <Link to="/horoscope">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                View Today's Horoscope
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#c9a84c]" /> Verified Astrologers</div>
            <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-[#c9a84c]" /> Nepal & Worldwide</div>
            <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#c9a84c]" /> AI-Powered</div>
          </div>
        </div>
      </section>

      {/* Zodiac Signs */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white font-serif mb-3">Your Zodiac Sign</h2>
            <p className="text-gray-400">Select your sign to get today's personalized reading</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
            {ZODIAC_SIGNS.map((sign) => (
              <Link
                key={sign.name}
                to={`/horoscope?sign=${sign.name.toLowerCase()}`}
                className="group flex flex-col items-center p-3 rounded-xl bg-[#1a2f4a]/40 border border-[#2d5a8e]/20 hover:border-[#c9a84c]/50 hover:bg-[#1a2f4a]/80 transition-all duration-300"
              >
                <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">{sign.symbol}</span>
                <span className="text-xs font-medium text-gray-300 group-hover:text-[#c9a84c] transition-colors">{sign.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-[#060f1a]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif mb-4">Everything You Need</h2>
            <p className="text-gray-400 max-w-xl mx-auto">One platform for all your spiritual and astrological needs</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              // If feature requires auth and user is not logged in, link to login with redirect
              const to = f.requiresAuth && !accessToken
                ? `/login`
                : f.path

              return (
                <Link
                  key={f.title}
                  to={to}
                  state={f.requiresAuth && !accessToken ? { from: f.path } : undefined}
                  className="p-6 rounded-2xl bg-[#1a2f4a]/40 border border-[#2d5a8e]/20 hover:border-[#c9a84c]/40
                    hover:bg-[#1a2f4a]/70 transition-all duration-300 group flex flex-col"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20
                    flex items-center justify-center text-[#c9a84c] mb-4
                    group-hover:bg-[#c9a84c]/20 transition-colors">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed flex-1">{f.desc}</p>
                  <div className="flex items-center gap-1 mt-4 text-xs text-[#c9a84c] opacity-0 group-hover:opacity-100 transition-opacity">
                    {f.requiresAuth && !accessToken ? 'Sign in to access' : 'Explore'}
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-10 rounded-3xl bg-gradient-to-br from-[#1e3a5f] to-[#0d1b2a] border border-[#2d5a8e]/40">
            <Star className="w-12 h-12 text-[#c9a84c] fill-[#c9a84c] mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif mb-4">
              Begin Your Cosmic Journey
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Join thousands who use AstroAI to navigate life's decisions with Vedic wisdom and AI-powered insights.
            </p>
            <Link to="/register">
              <Button size="lg">Create Free Account</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
