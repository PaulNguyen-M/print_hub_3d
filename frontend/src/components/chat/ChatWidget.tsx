import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Send, MessageCircle, ArrowLeft } from 'lucide-react'
import { useChat } from '../../hooks/useChat'
import { useChatStore } from '../../store/chatStore'
import useAuthStore from '../../store/authStore'
import { useTranslation } from '../../i18n/useTranslation'
import apiClient from '../../api/axios'

interface Conversation {
  peerId: number
  peerName: string
  peerAvatarUrl?: string
  lastMessage: string
  lastSenderId: number
  lastMessageAt: string
  unreadCount: number
}

function Avatar({ name, url }: { name?: string; url?: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-600 text-sm font-bold text-white">
      {url ? <img src={url} alt={name} className="h-full w-full object-cover" /> : (name ?? 'U')[0]?.toUpperCase()}
    </div>
  )
}

export default function ChatWidget() {
  const { t } = useTranslation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const currentUserId = useAuthStore((s) => s.user?.id)
  const { open, peerId, peerName, openChat, close, back } = useChatStore()

  const { connect, disconnect, connected, messages, sendMessage, fetchConversation, onlineUsers } = useChat()
  const [text, setText] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [listLoading, setListLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Connect once while authenticated
  useEffect(() => {
    if (!isAuthenticated) return
    connect()
    return () => disconnect()
  }, [isAuthenticated, connect, disconnect])

  const loadConversations = useCallback(async () => {
    setListLoading(true)
    try {
      const { data } = await apiClient.get('/chat/conversations')
      setConversations(data ?? [])
    } finally {
      setListLoading(false)
    }
  }, [])

  // Inbox: load list whenever we show it (open & no peer), and on new incoming messages
  useEffect(() => {
    if (open && peerId == null) void loadConversations()
  }, [open, peerId, loadConversations, messages.length])

  // Conversation: load history
  useEffect(() => {
    if (open && peerId) void fetchConversation(peerId)
  }, [open, peerId, fetchConversation])

  const convo = useMemo(
    () => messages.filter((m) => m.senderId === peerId || m.recipientId === peerId),
    [messages, peerId]
  )

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [convo.length, open, peerId])

  if (!isAuthenticated) return null

  const peerOnline = peerId != null && onlineUsers.includes(peerId)

  const handleSend = () => {
    const body = text.trim()
    if (!body || !peerId) return
    try {
      sendMessage(peerId, body)
      setText('')
    } catch { /* not connected yet */ }
  }

  const formatTime = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    const today = new Date()
    return d.toDateString() === today.toDateString()
      ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          className="fixed bottom-5 right-5 z-[60] flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-900"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 bg-brand-600 px-4 py-3 text-white dark:border-slate-800">
            {peerId != null ? (
              <>
                <button type="button" onClick={back} className="rounded-lg p-1 transition hover:bg-white/15">
                  <ArrowLeft size={18} />
                </button>
                <div className="relative">
                  <Avatar name={peerName ?? 'C'} />
                  <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-brand-600 ${peerOnline ? 'bg-green-400' : 'bg-slate-300'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{peerName}</p>
                  <p className="text-[11px] text-brand-100">
                    {!connected ? t('chat.connecting') : peerOnline ? t('chat.online') : t('chat.offline')}
                  </p>
                </div>
              </>
            ) : (
              <>
                <MessageCircle size={18} />
                <p className="flex-1 text-sm font-semibold">{t('chat.title')}</p>
              </>
            )}
            <button type="button" onClick={close} className="rounded-lg p-1 transition hover:bg-white/15">
              <X size={18} />
            </button>
          </div>

          {/* ── Conversation list (inbox) ── */}
          {peerId == null ? (
            <div className="flex-1 overflow-y-auto">
              {listLoading && conversations.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">…</div>
              ) : conversations.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-slate-400">
                  <MessageCircle size={32} className="mb-2 text-slate-300" />
                  {t('chat.empty')}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {conversations.map((c) => (
                    <li key={c.peerId}>
                      <button
                        type="button"
                        onClick={() => openChat(c.peerId, c.peerName)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <div className="relative">
                          <Avatar name={c.peerName} url={c.peerAvatarUrl} />
                          {onlineUsers.includes(c.peerId) && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-400 dark:border-slate-900" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{c.peerName}</p>
                            <span className="shrink-0 text-[11px] text-slate-400">{formatTime(c.lastMessageAt)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className={`truncate text-xs ${c.unreadCount > 0 ? 'font-semibold text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
                              {c.lastSenderId === currentUserId ? `${t('chat.you')}: ` : ''}{c.lastMessage}
                            </p>
                            {c.unreadCount > 0 && (
                              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
                                {c.unreadCount > 9 ? '9+' : c.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            /* ── Active conversation ── */
            <>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-3 py-3 dark:bg-slate-950/40">
                {convo.map((m, idx) => {
                  const mine = m.senderId === currentUserId
                  return (
                    <div key={m.messageId ?? idx} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                          mine
                            ? 'rounded-br-sm bg-brand-600 text-white'
                            : 'rounded-bl-sm bg-white text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
                  placeholder={t('chat.placeholder')}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!text.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
