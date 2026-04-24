import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, Lock, Plus, Star, ChevronDown, ChevronUp, Info, Pencil, Trash2, X, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getKundaliMatches, createKundaliMatch, updateKundaliMatch, deleteKundaliMatch, recalculateKundaliMatches, recalculateSingleKundaliMatch } from '../../api/horoscope'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import useAuthStore from '../../store/authStore'
import { toastError } from '../../utils/errorHandler'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

// ── Score ring ─────────────────────────────────────────────────────────────
function ScoreRing({ score, max = 36, size = 100 }) {
  const pct = (score / max) * 100
  const r = 42
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct >= 70 ? '#22c55e' : pct >= 55 ? '#f59e0b' : '#ef4444'
  const label = pct >= 70 ? 'Excellent' : pct >= 55 ? 'Good' : pct >= 40 ? 'Average' : 'Low'

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1a2f4a" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)" />
        <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white" fontFamily="sans-serif">
          {score}
        </text>
        <text x="50" y="58" textAnchor="middle" fontSize="9" fill="#6b7280" fontFamily="sans-serif">
          /{max}
        </text>
      </svg>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
    </div>
  )
}

// ── Factor bar ─────────────────────────────────────────────────────────────
function FactorBar({ name, score, max, userValue, partnerValue, description, interpretation }) {
  const pct = (score / max) * 100
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="p-3 rounded-xl bg-[#0d1b2a]/60 border border-[#2d5a8e]/20 hover:border-[#2d5a8e]/40 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{name}</span>
          <span className="text-xs text-gray-500">max {max}</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>{score}/{max}</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#1a2f4a] rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }} />
      </div>

      {/* Values */}
      <div className="grid grid-cols-2 gap-2 mb-1.5">
        <div className="text-xs">
          <span className="text-gray-500">You: </span>
          <span className="text-gray-300">{userValue}</span>
        </div>
        <div className="text-xs">
          <span className="text-gray-500">Partner: </span>
          <span className="text-gray-300">{partnerValue}</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 italic">{interpretation}</p>
    </div>
  )
}

// ── Match card ─────────────────────────────────────────────────────────────
function MatchCard({ match, onEdit, onDelete, onRecalculate }) {
  const [expanded, setExpanded] = useState(false)
  const [recalculating, setRecalculating] = useState(false)

  const handleRecalc = async () => {
    setRecalculating(true)
    await onRecalculate(match.id)
    setRecalculating(false)
  }
  const ashtakoot = match.match_details?.ashtakoot
  const pct = ashtakoot?.percentage ?? Math.round((match.match_score / 36) * 100)
  const verdict = ashtakoot?.verdict ?? (pct >= 70 ? 'Excellent Match' : pct >= 55 ? 'Good Match' : 'Average Match')
  const verdictColor = pct >= 70 ? 'green' : pct >= 55 ? 'gold' : 'red'

  const FACTOR_ORDER = ['Nadi', 'Bhakoot', 'Gana', 'Graha Maitri', 'Yoni', 'Tara', 'Vashya', 'Varna']

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start gap-5">
          <ScoreRing score={match.match_score} size={90} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-lg font-bold text-white">{match.partner_name}</h3>
              <Badge color={verdictColor}>{verdict}</Badge>
              {/* Edit / Delete / Recalculate */}
              <div className="ml-auto flex items-center gap-1">
                <button onClick={handleRecalc} disabled={recalculating}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                  title="Recalculate this match">
                  <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => onEdit(match)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors"
                  title="Edit match">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDelete(match)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete match">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              DOB: {format(new Date(match.partner_dob), 'MMMM d, yyyy')}
              {match.partner_pob && ` · ${match.partner_pob}`}
              {' · '}Matched {format(new Date(match.created_at), 'MMM d, yyyy')}
            </p>

            {/* Nakshatra info */}
            {ashtakoot && (
              <div className="flex gap-3 flex-wrap">
                <div className="px-2.5 py-1 rounded-lg bg-[#2d5a8e]/20 border border-[#2d5a8e]/30">
                  <span className="text-[10px] text-gray-500">Your Nakshatra </span>
                  <span className="text-xs text-white font-medium">{ashtakoot.user_nakshatra}</span>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-[#c9a84c]/10 border border-[#c9a84c]/20">
                  <span className="text-[10px] text-gray-500">Partner's Nakshatra </span>
                  <span className="text-xs text-white font-medium">{ashtakoot.partner_nakshatra}</span>
                </div>
              </div>
            )}

            {match.ai_analysis && (
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">{match.ai_analysis}</p>
            )}
          </div>
        </div>

        {/* Score summary bar */}
        {ashtakoot && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Overall Compatibility</span>
              <span className="font-medium text-white">{match.match_score}/36 ({pct}%)</span>
            </div>
            <div className="h-3 bg-[#1a2f4a] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, #2d5a8e, ${pct >= 70 ? '#22c55e' : pct >= 55 ? '#f59e0b' : '#ef4444'})`,
                }}
              />
            </div>
          </div>
        )}

        {/* Expand toggle */}
        {ashtakoot && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg
              bg-[#1a2f4a]/60 border border-[#2d5a8e]/20 hover:border-[#2d5a8e]/50
              text-xs text-gray-400 hover:text-white transition-all"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Hide' : 'View'} Detailed Ashtakoot Analysis
          </button>
        )}
      </div>

      {/* Expanded Ashtakoot breakdown */}
      {expanded && ashtakoot && (
        <div className="border-t border-[#2d5a8e]/20 p-5 space-y-3 bg-[#060f1a]/40">
          <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-[#c9a84c]" />
            Ashtakoot Factor Breakdown
          </h4>

          {/* Quick score grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {FACTOR_ORDER.map(name => {
              const f = ashtakoot.factors[name]
              if (!f) return null
              const fp = (f.score / f.max) * 100
              const fc = fp >= 70 ? '#22c55e' : fp >= 40 ? '#f59e0b' : '#ef4444'
              return (
                <div key={name} className="text-center p-2 rounded-lg bg-[#0d1b2a]/60 border border-[#2d5a8e]/20">
                  <p className="text-[10px] text-gray-500 mb-0.5">{name}</p>
                  <p className="text-sm font-bold" style={{ color: fc }}>{f.score}/{f.max}</p>
                </div>
              )
            })}
          </div>

          {/* Detailed bars */}
          <div className="space-y-2">
            {FACTOR_ORDER.map(name => {
              const f = ashtakoot.factors[name]
              if (!f) return null
              return (
                <FactorBar
                  key={name}
                  name={name}
                  score={f.score}
                  max={f.max}
                  userValue={f.user_value}
                  partnerValue={f.partner_value}
                  description={f.description}
                  interpretation={f.interpretation}
                />
              )
            })}
          </div>

          {/* Doshas */}
          <div className="mt-4 space-y-2">
            {ashtakoot.factors['Nadi']?.score === 0 && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                <Info className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-400">Nadi Dosha Present</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Both partners share the same Nadi. This may indicate health concerns or difficulty with progeny.
                    Consult an astrologer for remedies.
                  </p>
                </div>
              </div>
            )}
            {ashtakoot.factors['Bhakoot']?.score === 0 && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
                <Info className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-orange-400">Bhakoot Dosha Present</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Moon sign positions may cause financial or health challenges. Remedies recommended.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function KundaliMatch() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingMatch, setEditingMatch] = useState(null)
  const [deletingMatch, setDeletingMatch] = useState(null)
  const [recalculating, setRecalculating] = useState(false)
  const [form, setForm] = useState({
    partner_name: '', partner_dob: '', partner_tob: '', partner_pob: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['kundali-matches'],
    queryFn: () => getKundaliMatches().then(r => r.data),
    enabled: !!user,
  })

  const matches = data?.results ?? data ?? []

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createKundaliMatch(form)
      queryClient.invalidateQueries({ queryKey: ['kundali-matches'] })
      toast.success('Kundali match calculated!')
      setShowForm(false)
      setForm({ partner_name: '', partner_dob: '', partner_tob: '', partner_pob: '' })
    } catch (err) {
      toastError(err, 'Failed to calculate match.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await updateKundaliMatch(editingMatch.id, editingMatch)
      queryClient.invalidateQueries({ queryKey: ['kundali-matches'] })
      toast.success('Match updated and recalculated!')
      setEditingMatch(null)
    } catch (err) {
      toastError(err, 'Failed to update match.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingMatch) return
    try {
      await deleteKundaliMatch(deletingMatch.id)
      queryClient.invalidateQueries({ queryKey: ['kundali-matches'] })
      toast.success('Match deleted.')
      setDeletingMatch(null)
    } catch (err) {
      toastError(err, 'Failed to delete match.')
    }
  }

  const handleRecalculateAll = async () => {
    setRecalculating(true)
    try {
      const { data: res } = await recalculateKundaliMatches()
      queryClient.invalidateQueries({ queryKey: ['kundali-matches'] })
      toast.success(res.message)
    } catch (err) {
      toastError(err, 'Recalculation failed. Make sure your birth chart is generated.')
    } finally {
      setRecalculating(false)
    }
  }

  const handleSingleRecalculate = async (id) => {
    try {
      await recalculateSingleKundaliMatch(id)
      queryClient.invalidateQueries({ queryKey: ['kundali-matches'] })
      toast.success('Match recalculated!')
    } catch (err) {
      toastError(err, 'Recalculation failed. Make sure your birth chart is generated.')
    }
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-8 h-8 text-[#c9a84c]" />
            </div>
            <h2 className="text-2xl font-bold text-white font-serif mb-2">Sign In for Kundali Matching</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Kundali matching (Ashtakoot) analyzes compatibility between two people based on their birth charts.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/login"><Button variant="outline">Sign In</Button></Link>
              <Link to="/register"><Button>Create Free Account</Button></Link>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white font-serif mb-3">Kundali Matching</h1>
          <p className="text-gray-400">Ashtakoot compatibility — 8 factors, 36 points</p>
        </div>

        {/* Score legend */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[
            { range: '26–36', label: 'Excellent', color: '#22c55e' },
            { range: '21–25', label: 'Good',      color: '#f59e0b' },
            { range: '18–20', label: 'Average',   color: '#f97316' },
            { range: '0–17',  label: 'Low',       color: '#ef4444' },
          ].map(({ range, label, color }) => (
            <div key={label} className="text-center p-2.5 rounded-xl bg-[#1a2f4a]/40 border border-[#2d5a8e]/20">
              <p className="text-sm font-bold" style={{ color }}>{range}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mb-5">
          {matches.length > 0 && (
            <button
              onClick={handleRecalculateAll}
              disabled={recalculating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm border
                border-[#2d5a8e]/40 text-gray-400 hover:text-white hover:border-[#2d5a8e]
                disabled:opacity-50 transition-all"
              title="Recalculate all matches using your current birth chart"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
              {recalculating ? 'Recalculating...' : 'Recalculate All'}
            </button>
          )}
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" /> New Match
          </Button>
        </div>

        {/* New match form */}
        {showForm && (
          <Card className="p-6 mb-6">
            <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#c9a84c]" /> Enter Partner's Details
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Partner's Name" value={form.partner_name}
                onChange={e => setForm(f => ({ ...f, partner_name: e.target.value }))}
                placeholder="Full name" required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Date of Birth" type="date" value={form.partner_dob}
                  onChange={e => setForm(f => ({ ...f, partner_dob: e.target.value }))} required />
                <Input label="Time of Birth (optional)" type="time" value={form.partner_tob}
                  onChange={e => setForm(f => ({ ...f, partner_tob: e.target.value }))} />
              </div>
              <Input label="Place of Birth (optional)" value={form.partner_pob}
                onChange={e => setForm(f => ({ ...f, partner_pob: e.target.value }))}
                placeholder="e.g. Kathmandu, Nepal" />
              <p className="text-xs text-gray-500 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#c9a84c]" />
                Your birth details are taken from your profile. Complete your profile for accurate results.
              </p>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" loading={submitting}>
                  <Heart className="w-4 h-4" /> Calculate Match
                </Button>
              </div>
            </form>
          </Card>
        )}

        {isLoading && <Spinner size="lg" className="py-20" />}

        {!isLoading && matches.length === 0 && !showForm && (
          <Card className="p-8 text-center">
            <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No Kundali matches yet.</p>
            <p className="text-sm text-gray-500">Click "New Match" to check your compatibility.</p>
          </Card>
        )}

        <div className="space-y-5">
          {matches.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              onEdit={(m) => setEditingMatch({ ...m })}
              onDelete={(m) => setDeletingMatch(m)}
              onRecalculate={handleSingleRecalculate}
            />
          ))}
        </div>

        {/* Ashtakoot info */}
        <Card className="p-6 mt-8">          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-[#c9a84c]" /> The 8 Ashtakoot Factors
          </h3>
          <div className="space-y-2">
            {[
              { name: 'Nadi',         pts: 8, desc: 'Health & progeny — most critical factor' },
              { name: 'Bhakoot',      pts: 7, desc: 'Love, prosperity & family well-being' },
              { name: 'Gana',         pts: 6, desc: 'Temperament & nature compatibility' },
              { name: 'Graha Maitri', pts: 5, desc: 'Mental & intellectual harmony' },
              { name: 'Yoni',         pts: 4, desc: 'Physical & sexual compatibility' },
              { name: 'Tara',         pts: 3, desc: 'Destiny, health & longevity' },
              { name: 'Vashya',       pts: 2, desc: 'Mutual attraction & dominance' },
              { name: 'Varna',        pts: 1, desc: 'Spiritual & ego compatibility' },
            ].map(({ name, pts, desc }) => (
              <div key={name} className="flex items-center gap-3 py-2 border-b border-[#2d5a8e]/10 last:border-0">
                <div className="w-6 h-6 rounded-full bg-[#c9a84c]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-[#c9a84c]">{pts}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-white">{name}</span>
                  <span className="text-xs text-gray-500 ml-2">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Edit modal ──────────────────────────────────────────────────── */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1b2a] border border-[#2d5a8e]/40 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#2d5a8e]/20">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#c9a84c]" /> Edit Match
              </h2>
              <button onClick={() => setEditingMatch(null)} className="p-1.5 text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <Input label="Partner's Name" value={editingMatch.partner_name}
                onChange={e => setEditingMatch(m => ({ ...m, partner_name: e.target.value }))}
                required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Date of Birth" type="date" value={editingMatch.partner_dob}
                  onChange={e => setEditingMatch(m => ({ ...m, partner_dob: e.target.value }))} required />
                <Input label="Time of Birth" type="time" value={editingMatch.partner_tob || ''}
                  onChange={e => setEditingMatch(m => ({ ...m, partner_tob: e.target.value }))} />
              </div>
              <Input label="Place of Birth" value={editingMatch.partner_pob || ''}
                onChange={e => setEditingMatch(m => ({ ...m, partner_pob: e.target.value }))}
                placeholder="e.g. Kathmandu, Nepal" />
              <p className="text-xs text-gray-500">Saving will recalculate the Ashtakoot score.</p>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditingMatch(null)}>Cancel</Button>
                <Button type="submit" loading={submitting}>
                  <Heart className="w-4 h-4" /> Save & Recalculate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ─────────────────────────────────────────── */}
      {deletingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1b2a] border border-red-500/30 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Delete Match?</h3>
            <p className="text-sm text-gray-400 mb-5">
              Remove the Kundali match with <span className="text-white font-medium">{deletingMatch.partner_name}</span>?
              This cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setDeletingMatch(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
