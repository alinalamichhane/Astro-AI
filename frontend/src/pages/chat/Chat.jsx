import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, Plus, Trash2, Star, User, MessageSquare, Clock } from 'lucide-react'
import { getSessions, getSession, sendMessage, deleteSession } from '../../api/chat'
import Layout from '../../components/layout/Layout'
import Spinner from '../../components/ui/Spinner'
import useAuthStore from '../../store/authStore'
import { toastError } from '../../utils/errorHandler'
import toast from 'react-hot-toast'
import { format, isToday, isYesterday } from 'date-fns'

// Format session timestamp nicely
function sessionTime(dateStr) {
  const d = new Date(dateStr)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d')
}

export default function Chat() {
  const [activeSession, setActiveSession] = useState(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sidebarOpen] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()

  // ── Fetch session list ──────────────────────────────────────────────────
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => getSessions().then((r) => r.data),
    refetchOnWindowFocus: false,
  })

  // API returns paginated { count, results: [...] } — extract the array
  const sessions = sessionsData?.results ?? sessionsData ?? []

  // ── Fetch active session messages ───────────────────────────────────────
  const { data: sessionDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['chat-session', activeSession],
    queryFn: () => getSession(activeSession).then((r) => r.data),
    enabled: !!activeSession,
    refetchOnWindowFocus: false,
  })

  const messages = sessionDetail?.messages || []

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, sending])

  // Focus input when session changes
  useEffect(() => {
    if (activeSession) inputRef.current?.focus()
  }, [activeSession])

  // ── Send message ────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || sending) return
    if (!user?.ai_tokens || user.ai_tokens < 1) {
      toast.error('No AI tokens left. Please upgrade your plan.')
      return
    }
    const msg = input.trim()
    setInput('')
    setSending(true)
    try {
      const { data } = await sendMessage(msg, activeSession)
      setActiveSession(data.session_id)
      setUser({ ...user, ai_tokens: data.remaining_tokens })
      // Refresh both the session detail and the sidebar list
      queryClient.invalidateQueries({ queryKey: ['chat-session', data.session_id] })
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
    } catch (err) {
      toastError(err, 'Failed to send message.')
      setInput(msg)
    } finally {
      setSending(false)
    }
  }

  // ── Delete session ──────────────────────────────────────────────────────
  const handleDelete = async (id, e) => {
    e.stopPropagation()
    try {
      await deleteSession(id)
      if (activeSession === id) setActiveSession(null)
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      toast.success('Conversation deleted')
    } catch (err) {
      toastError(err, 'Failed to delete conversation.')
    }
  }

  // ── Suggestion chips ────────────────────────────────────────────────────
  const SUGGESTIONS = [
    'What does my birth chart say about my career?',
    'Which gemstone is good for me?',
    'Tell me about my moon sign',
    'What is my lucky day this week?',
    'How is my love life this month?',
    'What remedies can improve my finances?',
  ]

  return (
    <Layout noFooter>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <div className={`
          flex-shrink-0 bg-[#060f1a] border-r border-[#2d5a8e]/20 flex flex-col
          transition-all duration-300
          ${sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}
          md:w-72
        `}>
          {/* Header */}
          <div className="p-4 border-b border-[#2d5a8e]/20 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#c9a84c]" />
                Conversations
              </h2>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30"
                title="AI tokens remaining">
                <Star className="w-3 h-3 text-[#c9a84c] fill-[#c9a84c]" />
                <span className="text-xs text-[#c9a84c] font-medium">{user?.ai_tokens ?? 0}</span>
              </div>
            </div>

            {/* New conversation button */}
            <button
              onClick={() => setActiveSession(null)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg
                bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-[#c9a84c] text-sm font-medium
                hover:bg-[#c9a84c]/20 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Conversation
            </button>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto py-2">
            {sessionsLoading && <Spinner className="py-8" />}

            {!sessionsLoading && sessions.length === 0 && (
              <div className="px-4 py-8 text-center">
                <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No conversations yet.</p>
                <p className="text-xs text-gray-600 mt-1">Start a new one above!</p>
              </div>
            )}

            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => setActiveSession(s.id)}
                className={`
                  group mx-2 mb-1 flex items-start gap-2 px-3 py-2.5 rounded-xl
                  cursor-pointer transition-all duration-150
                  ${activeSession === s.id
                    ? 'bg-[#2d5a8e]/30 border border-[#2d5a8e]/50'
                    : 'hover:bg-white/5 border border-transparent'}
                `}
              >
                {/* Icon */}
                <div className={`
                  w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5
                  ${activeSession === s.id ? 'bg-[#2d5a8e]' : 'bg-[#1a2f4a]'}
                `}>
                  <Star className="w-3.5 h-3.5 text-[#c9a84c]" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm text-white truncate font-medium leading-tight">
                      {s.title || 'New Chat'}
                    </p>
                    <span className="text-[10px] text-gray-500 flex-shrink-0 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {sessionTime(s.updated_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5 leading-tight">
                    {s.last_message || '...'}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {s.message_count} {s.message_count === 1 ? 'message' : 'messages'}
                  </p>
                </div>

                {/* Delete button — shows on hover */}
                <button
                  onClick={(e) => handleDelete(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded
                    text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Chat area ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">

            {/* Welcome / empty state */}
            {!activeSession && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2d5a8e] to-[#c9a84c]
                  flex items-center justify-center mb-4 shadow-lg shadow-[#c9a84c]/20">
                  <Star className="w-8 h-8 text-white fill-white" />
                </div>
                <h3 className="text-xl font-semibold text-white font-serif mb-2">AstroAI Assistant</h3>
                <p className="text-gray-400 max-w-sm text-sm leading-relaxed mb-6">
                  Ask me anything about Vedic astrology, your birth chart, love, career, or life guidance.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                  {SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); inputRef.current?.focus() }}
                      className="px-4 py-3 rounded-xl bg-[#1a2f4a]/60 border border-[#2d5a8e]/30
                        text-sm text-gray-300 hover:border-[#c9a84c]/40 hover:text-white
                        text-left transition-all leading-snug"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading messages */}
            {activeSession && detailLoading && (
              <Spinner size="lg" className="py-20" />
            )}

            {/* Message bubbles */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`
                  w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
                  ${msg.role === 'user'
                    ? 'bg-[#2d5a8e]'
                    : 'bg-gradient-to-br from-[#c9a84c] to-[#2d5a8e]'}
                `}>
                  {msg.role === 'user'
                    ? <User className="w-4 h-4 text-white" />
                    : <Star className="w-4 h-4 text-white fill-white" />
                  }
                </div>

                {/* Bubble */}
                <div className={`
                  max-w-[75%] flex flex-col gap-1
                  ${msg.role === 'user' ? 'items-end' : 'items-start'}
                `}>
                  <div className={`
                    px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.role === 'user'
                      ? 'bg-[#2d5a8e] text-white rounded-tr-sm'
                      : 'bg-[#1a2f4a]/80 border border-[#2d5a8e]/30 text-gray-200 rounded-tl-sm'}
                  `}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-600 px-1">
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {sending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#2d5a8e]
                  flex items-center justify-center">
                  <Star className="w-4 h-4 text-white fill-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#1a2f4a]/80
                  border border-[#2d5a8e]/30">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-[#c9a84c] rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input bar ──────────────────────────────────────────────── */}
          <div className="flex-shrink-0 p-3 md:p-4 border-t border-[#2d5a8e]/20 bg-[#060f1a]">
            <div className="flex gap-2 max-w-4xl mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask about your stars, birth chart, or life guidance..."
                className="flex-1 px-4 py-3 rounded-xl bg-[#1a2f4a]/60 border border-[#2d5a8e]/30
                  text-white placeholder-gray-500 text-sm
                  focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50 focus:border-[#c9a84c]/50
                  transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="px-4 py-3 rounded-xl bg-[#c9a84c] hover:bg-[#e8c96d] text-[#0d1b2a]
                  disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                title="Send (Enter)"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center text-xs text-gray-600 mt-2">
              <span className={user?.ai_tokens < 3 ? 'text-red-400' : ''}>
                {user?.ai_tokens ?? 0} tokens remaining
              </span>
              {' · '}
              <a href="/plans" className="text-[#c9a84c] hover:underline">Get more</a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

