import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Star, Users, CheckCircle, Clock, DollarSign, ToggleLeft, ToggleRight, Calendar, Edit } from 'lucide-react'
import { getAstrologerDashboard, toggleAvailability } from '../../api/astrologers'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import QueryError from '../../components/ui/QueryError'
import useAuthStore from '../../store/authStore'
import { toastError } from '../../utils/errorHandler'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useState } from 'react'

export default function AstrologerDashboard() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [toggling, setToggling] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['astrologer-dashboard'],
    queryFn: () => getAstrologerDashboard().then(r => r.data),
  })

  const handleToggle = async () => {
    setToggling(true)
    try {
      const { data: res } = await toggleAvailability()
      queryClient.invalidateQueries({ queryKey: ['astrologer-dashboard'] })
      toast.success(res.is_available ? 'You are now Online' : 'You are now Offline')
    } catch (err) {
      toastError(err, 'Failed to update availability.')
    } finally {
      setToggling(false)
    }
  }

  if (isLoading) return <Layout><Spinner size="lg" className="py-40" /></Layout>
  if (error) return <Layout><QueryError error={error} onRetry={refetch} /></Layout>

  const stats = [
    { label: 'Total Consultations', value: data.total_consultations, icon: <Users className="w-5 h-5" />, color: 'text-blue-400' },
    { label: 'Completed', value: data.completed_count, icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-400' },
    { label: 'Pending', value: data.pending_count, icon: <Clock className="w-5 h-5" />, color: 'text-yellow-400' },
    { label: 'Earnings (NPR)', value: `Rs ${data.total_earnings_npr.toLocaleString()}`, icon: <DollarSign className="w-5 h-5" />, color: 'text-[#c9a84c]' },
  ]

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white font-serif">
              Welcome, {user?.first_name} 🌟
            </h1>
            <p className="text-gray-400 mt-1">Astrologer Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            {!data.is_verified && (
              <Badge color="gold">Pending Verification</Badge>
            )}
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                data.is_available
                  ? 'bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30'
                  : 'bg-gray-500/20 border border-gray-500/40 text-gray-400 hover:bg-gray-500/30'
              }`}
            >
              {data.is_available
                ? <><ToggleRight className="w-4 h-4" /> Online</>
                : <><ToggleLeft className="w-4 h-4" /> Offline</>
              }
            </button>
            <Link to="/astrologer/profile">
              <Button variant="outline" size="sm"><Edit className="w-4 h-4" /> Edit Profile</Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <Card key={s.label} className="p-5">
              <div className={`${s.color} mb-2`}>{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rating */}
          <Card className="p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-[#c9a84c]" /> Your Rating
            </h3>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold text-[#c9a84c]">{data.rating || '—'}</div>
              <div>
                <div className="flex gap-0.5 mb-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= Math.round(data.rating) ? 'text-[#c9a84c] fill-[#c9a84c]' : 'text-gray-600'}`} />
                  ))}
                </div>
                <p className="text-sm text-gray-400">{data.rating_count} reviews</p>
              </div>
            </div>
          </Card>

          {/* Quick links */}
          <Card className="p-6">
            <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'My Consultations', path: '/astrologer/consultations', icon: <Calendar className="w-4 h-4" /> },
                { label: 'Availability', path: '/astrologer/availability', icon: <Clock className="w-4 h-4" /> },
                { label: 'Edit Profile', path: '/astrologer/profile', icon: <Edit className="w-4 h-4" /> },
                { label: 'View Public Profile', path: `/astrologers/${data.id}`, icon: <Star className="w-4 h-4" /> },
              ].map(({ label, path, icon }) => (
                <Link key={label} to={path}
                  className="flex items-center gap-2 p-3 rounded-xl bg-[#0d1b2a]/60 border border-[#2d5a8e]/20 hover:border-[#c9a84c]/30 text-sm text-gray-300 hover:text-white transition-all">
                  <span className="text-[#c9a84c]">{icon}</span> {label}
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Upcoming consultations */}
        {data.upcoming?.length > 0 && (
          <Card className="p-6 mt-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#c9a84c]" /> Upcoming Consultations
            </h3>
            <div className="space-y-3">
              {data.upcoming.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0d1b2a]/60 border border-[#2d5a8e]/20">
                  <div>
                    <p className="text-sm font-medium text-white">{c.user_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(c.scheduled_at), 'MMM d, yyyy · HH:mm')} · {c.duration_minutes} min · {c.consultation_type}
                    </p>
                  </div>
                  <Badge color={c.status === 'confirmed' ? 'green' : 'gold'}>{c.status}</Badge>
                </div>
              ))}
            </div>
            <Link to="/astrologer/consultations" className="block mt-4">
              <Button variant="outline" size="sm" className="w-full">View All Consultations</Button>
            </Link>
          </Card>
        )}
      </div>
    </Layout>
  )
}
