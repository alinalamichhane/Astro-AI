import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Calendar, CheckCircle, XCircle, Play, User, X,
         Phone, Mail, MapPin, Star, Clock, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getAstrologerConsultations, updateConsultationStatus, getConsultationClient } from '../../api/astrologers'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import QueryError from '../../components/ui/QueryError'
import Button from '../../components/ui/Button'
import KundaliChart from '../../components/horoscope/KundaliChart'
import { toastError } from '../../utils/errorHandler'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_COLORS = {
  pending: 'gold', confirmed: 'blue', ongoing: 'purple',
  completed: 'green', cancelled: 'red',
}

const NEXT_ACTIONS = {
  pending:   [
    { label: 'Confirm',  status: 'confirmed', icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { label: 'Decline',  status: 'cancelled', icon: <XCircle className="w-3.5 h-3.5" />,    color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  ],
  confirmed: [
    { label: 'Start',    status: 'ongoing',   icon: <Play className="w-3.5 h-3.5" />,        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { label: 'Cancel',   status: 'cancelled', icon: <XCircle className="w-3.5 h-3.5" />,    color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  ],
  ongoing:   [
    { label: 'Complete', status: 'completed', icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  ],
}

const ACTIVE_STATUSES = ['pending', 'confirmed', 'ongoing']

// ── Client Detail Panel ────────────────────────────────────────────────────
function ClientPanel({ consultationId, onClose }) {
  const { data: client, isLoading, error } = useQuery({
    queryKey: ['consultation-client', consultationId],
    queryFn: () => getConsultationClient(consultationId).then(r => r.data),
    enabled: !!consultationId,
  })

  console.log("client",client)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0d1b2a] border border-[#2d5a8e]/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2d5a8e]/20 sticky top-0 bg-[#0d1b2a] z-10">
          <h2 className="text-lg font-bold text-white font-serif flex items-center gap-2">
            <User className="w-5 h-5 text-[#c9a84c]" /> Client Details
          </h2>
          <button onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {isLoading && <Spinner size="lg" className="py-12" />}
          {error && (
            <div className="text-center py-8 text-gray-400">
              <p>Could not load client details.</p>
            </div>
          )}

          {client && (
            <div className="space-y-5">
              {/* Basic info */}
              <Card className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2d5a8e] to-[#c9a84c] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {client.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{client.name}</h3>
                    {client.gender && (
                      <p className="text-sm text-gray-400">{client.gender}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Mail className="w-4 h-4 text-[#c9a84c] flex-shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Phone className="w-4 h-4 text-[#c9a84c] flex-shrink-0" />
                      {client.phone}
                    </div>
                  )}
                  {client.place_of_birth && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="w-4 h-4 text-[#c9a84c] flex-shrink-0" />
                      {client.place_of_birth}
                    </div>
                  )}
                  {client.timezone && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4 text-[#c9a84c] flex-shrink-0" />
                      {client.timezone}
                    </div>
                  )}
                </div>

                {client.bio && (
                  <p className="mt-3 text-sm text-gray-400 leading-relaxed border-t border-[#2d5a8e]/20 pt-3">
                    {client.bio}
                  </p>
                )}
              </Card>

              {/* Birth details */}
              {(client.date_of_birth || client.time_of_birth) && (
                <Card className="p-5">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-[#c9a84c]" /> Birth Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {client.date_of_birth && (
                      <div className="p-3 rounded-lg bg-[#0d1b2a]/60 border border-[#2d5a8e]/20">
                        <p className="text-xs text-gray-500 mb-0.5">Date of Birth</p>
                        <p className="text-sm font-medium text-white">
                          {format(new Date(client.date_of_birth), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    )}
                    {client.time_of_birth && (
                      <div className="p-3 rounded-lg bg-[#0d1b2a]/60 border border-[#2d5a8e]/20">
                        <p className="text-xs text-gray-500 mb-0.5">Time of Birth</p>
                        <p className="text-sm font-medium text-white">{client.time_of_birth}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Birth chart */}
              {client.birth_chart ? (
                <Card className="p-5">
                  <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4 text-[#c9a84c]" /> Kundali / Birth Chart
                  </h4>

                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: 'Sun Sign',  value: client.birth_chart.sun_sign },
                      { label: 'Moon Sign', value: client.birth_chart.moon_sign },
                      { label: 'Ascendant', value: client.birth_chart.ascendant },
                    ].map(({ label, value }) => value && (
                      <div key={label} className="text-center p-2 rounded-lg bg-[#0d1b2a]/60 border border-[#2d5a8e]/20">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
                        <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Visual chart */}
                  {client.birth_chart.chart_data && client.birth_chart.ascendant && (
                    <div className="flex justify-center">
                      <KundaliChart
                        chartData={client.birth_chart.chart_data}
                        ascendantSign={client.birth_chart.ascendant}
                        size={380}
                      />
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="p-5 text-center">
                  <Star className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    This client has not generated their birth chart yet.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Ask them to complete their profile and generate their Kundali.
                  </p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Decline Confirmation Modal ─────────────────────────────────────────────
function DeclineModal({ consultation, onConfirm, onClose, loading }) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0d1b2a] border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-[#2d5a8e]/20">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Decline Consultation</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              with {consultation.user_name} · {format(new Date(consultation.scheduled_at), 'MMM d, yyyy · HH:mm')}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-300">
            The client will be notified of this cancellation. Please provide a reason so they understand why.
          </p>

          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">
              Reason for declining <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. I have a scheduling conflict at this time. Please rebook for another slot."
              className="w-full px-4 py-2.5 rounded-lg bg-[#1a2f4a] border border-[#2d5a8e]/50 text-white
                placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40
                focus:border-red-500/50 resize-none transition-colors"
            />
            {reason.trim().length === 0 && (
              <p className="text-xs text-gray-500 mt-1">A reason is required to decline.</p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Keep Consultation
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => onConfirm(reason)}
              loading={loading}
              disabled={!reason.trim()}
            >
              <XCircle className="w-4 h-4" /> Decline
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AstrologerConsultations() {
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState(null)
  const [viewingClientId, setViewingClientId] = useState(null)
  const [decliningConsultation, setDecliningConsultation] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['astrologer-consultations', filter],
    queryFn: () => getAstrologerConsultations(
      filter !== 'all' ? { status: filter } : {}
    ).then(r => r.data),
  })

  const consultations = data?.results ?? data ?? []

  const handleStatusUpdate = async (id, newStatus, cancellationReason = '') => {
    setUpdating(id)
    try {
      await updateConsultationStatus(id, newStatus, cancellationReason)
      queryClient.invalidateQueries({ queryKey: ['astrologer-consultations'] })
      queryClient.invalidateQueries({ queryKey: ['astrologer-dashboard'] })
      toast.success(`Consultation ${newStatus}`)
      setDecliningConsultation(null)
    } catch (err) {
      toastError(err, 'Failed to update status.')
    } finally {
      setUpdating(null)
    }
  }

  // Intercept cancel actions — show modal instead of acting immediately
  const handleActionClick = (consultation, action) => {
    if (action.status === 'cancelled') {
      setDecliningConsultation(consultation)
    } else {
      handleStatusUpdate(consultation.id, action.status)
    }
  }

  const FILTERS = ['all', 'pending', 'confirmed', 'ongoing', 'completed', 'cancelled']

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link to="/astrologer/dashboard"
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white font-serif mb-6">My Consultations</h1>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm capitalize transition-all ${
                filter === f
                  ? 'bg-[#c9a84c] text-[#0d1b2a] font-medium'
                  : 'bg-[#1a2f4a]/60 border border-[#2d5a8e]/30 text-gray-300 hover:border-[#c9a84c]/40'
              }`}>{f}</button>
          ))}
        </div>

        {isLoading && <Spinner size="lg" className="py-20" />}
        {error && <QueryError error={error} onRetry={refetch} />}

        {!isLoading && consultations.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No consultations found.</p>
          </div>
        )}

        <div className="space-y-4">
          {consultations.map(c => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-white">{c.user_name}</p>
                    <Badge color={STATUS_COLORS[c.status]}>{c.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    {format(new Date(c.scheduled_at), 'MMM d, yyyy · HH:mm')}
                    {' · '}{c.duration_minutes} min
                    {' · '}{c.consultation_type}
                    {' · '}Rs {c.amount}
                  </p>
                  {c.notes && (
                    <p className="text-xs text-gray-500 mt-1 italic">"{c.notes}"</p>
                  )}
                  {c.user_rating && (
                    <p className="text-xs text-[#c9a84c] mt-1">
                      ★ {c.user_rating}/5 {c.user_review && `— ${c.user_review}`}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* View client details — only for active consultations */}
                  {ACTIVE_STATUSES.includes(c.status) && (
                    <button
                      onClick={() => setViewingClientId(c.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border
                        bg-[#2d5a8e]/20 text-blue-300 border-[#2d5a8e]/40 hover:bg-[#2d5a8e]/40 transition-all"
                    >
                      <User className="w-3.5 h-3.5" /> View Client
                    </button>
                  )}

                  {/* Status action buttons */}
                  {NEXT_ACTIONS[c.status]?.map(action => (
                    <button
                      key={action.status}
                      onClick={() => handleActionClick(c, action)}
                      disabled={updating === c.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border
                        transition-all disabled:opacity-50 ${action.color}`}
                    >
                      {action.icon} {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Client detail panel */}
      {viewingClientId && (
        <ClientPanel
          consultationId={viewingClientId}
          onClose={() => setViewingClientId(null)}
        />
      )}

      {/* Decline confirmation modal */}
      {decliningConsultation && (
        <DeclineModal
          consultation={decliningConsultation}
          loading={updating === decliningConsultation.id}
          onConfirm={(reason) => handleStatusUpdate(decliningConsultation.id, 'cancelled', reason)}
          onClose={() => setDecliningConsultation(null)}
        />
      )}
    </Layout>
  )
}
