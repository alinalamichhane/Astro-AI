import { Link } from 'react-router-dom'
import { Star, Mail, Phone } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#060f1a] border-t border-[#2d5a8e]/20 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#2d5a8e] flex items-center justify-center">
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-xl font-bold text-white font-serif">
                Astro<span className="text-[#c9a84c]">AI</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              The all-in-one Vedic astrology platform. AI-powered insights, expert consultations, and spiritual guidance.
            </p>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Features</h4>
            <ul className="space-y-2">
              {[
                ['Horoscope',     '/horoscope'],
                ['Birth Chart',   '/birth-chart'],
                ['AI Chat',       '/chat'],
                ['Kundali Match', '/kundali-match'],
              ].map(([label, path]) => (
                <li key={label}>
                  <Link to={path} className="text-sm text-gray-400 hover:text-[#c9a84c] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Services</h4>
            <ul className="space-y-2">
              {[
                ['Astrologers', '/astrologers'],
                ['Marketplace', '/marketplace'],
                ['Courses', '/courses'],
                ['Subscription Plans', '/plans'],
              ].map(([label, path]) => (
                <li key={label}>
                  <Link to={path} className="text-sm text-gray-400 hover:text-[#c9a84c] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="w-4 h-4 text-[#c9a84c]" />
                support@astroai.com
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="w-4 h-4 text-[#c9a84c]" />
                +977 9800000000
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#2d5a8e]/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} AstroAI. All rights reserved.</p>
          <p className="text-xs text-gray-500">Built with ✨ for the astrology community</p>
        </div>
      </div>
    </footer>
  )
}
