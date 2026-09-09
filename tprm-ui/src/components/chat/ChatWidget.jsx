import { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, Loader2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  'How many critical vendors have unresolved high risks?',
  'Which suppliers have the lowest SBR scores?',
  'Summarize open issues by portfolio',
  'Top 3 emerging risk themes?',
]

const MOCK_RESPONSES = {
  default: "I'm your TPRM AI assistant. Ask me about vendor risks, supplier scores, compliance status, or emerging threats. Once connected to the live database I'll provide real-time answers.",
  critical: "Based on current data: **9 vendors** carry Very High residual risk with open issues. Highest concentration is in **Technology** (4), followed by **Real Estate** (2). Top escalations involve data security and business continuity gaps for Tier-1 suppliers.",
  sbr: "**14 suppliers** scored below 3.0 this quarter — concentrated in Technology (6) and Consulting (4). Portfolio average is **3.8/5.0**, up 0.12 from last quarter. Recommend scheduling performance reviews for the bottom quartile within 30 days.",
  issues: "There are **23 open issues** across all portfolios: Technology (9), Real Estate (5), Consulting (4), Financial Services (3), Other (2). **5 issues** are escalated and pending leadership review.",
  themes: "Top 3 emerging risk themes:\n1. **AI Supply Chain Exposure** — vendors adopting GenAI without governance frameworks\n2. **Regulatory Divergence** — new SEC/EU disclosure requirements creating compliance gaps\n3. **Concentration Risk** — single-vendor dependency exceeding thresholds in 4 critical categories",
}

function matchResponse(text) {
  const t = text.toLowerCase()
  if (t.includes('critical') || t.includes('unresolved') || t.includes('high risk')) return MOCK_RESPONSES.critical
  if (t.includes('sbr') || t.includes('score') || t.includes('supplier')) return MOCK_RESPONSES.sbr
  if (t.includes('issue') || t.includes('open')) return MOCK_RESPONSES.issues
  if (t.includes('emerging') || t.includes('theme') || t.includes('trend')) return MOCK_RESPONSES.themes
  return MOCK_RESPONSES.default
}

function ChatMessage({ role, content }) {
  return (
    <div className={cn('flex gap-2 text-xs', role === 'user' ? 'justify-end' : 'justify-start')}>
      {role === 'assistant' && (
        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
          <MessageSquare className="w-2.5 h-2.5 text-blue-600" />
        </div>
      )}
      <div
        className={cn(
          'rounded-lg px-3 py-2 max-w-[82%] leading-relaxed',
          role === 'user' ? 'bg-[#0176d3] text-white' : 'bg-gray-100 text-gray-800'
        )}
        style={{ whiteSpace: 'pre-line' }}
        dangerouslySetInnerHTML={{
          __html: content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        }}
      />
    </div>
  )
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: MOCK_RESPONSES.default }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, messages])

  function sendMessage(text) {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: matchResponse(msg) }])
      setLoading(false)
    }, 700)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const unread = !open && messages.filter(m => m.role === 'assistant').length > 1

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div
          className="bg-white rounded-xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden"
          style={{ width: 360, height: 480 }}
        >
          {/* Header */}
          <div className="bg-[#0176d3] px-4 py-3 flex items-center gap-2 shrink-0">
            <MessageSquare className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white flex-1">TPRM AI Assistant</span>
            <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded mr-2">Demo</span>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <ChatMessage key={i} role={m.role} content={m.content} />
            ))}
            {loading && (
              <div className="flex gap-2 items-center text-xs text-gray-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                Thinking…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestions — only show if conversation is short */}
          {messages.length <= 2 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-[10px] bg-gray-50 border border-gray-200 text-gray-600 rounded px-2 py-1 hover:border-blue-300 hover:text-blue-600 transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-200 flex gap-2">
            <input
              ref={inputRef}
              className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              placeholder="Ask about vendors, risks, compliance…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="bg-[#0176d3] text-white rounded-lg px-3 py-2 hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-13 h-13 rounded-full shadow-lg flex items-center justify-center transition-all',
          open
            ? 'bg-gray-700 hover:bg-gray-800'
            : 'bg-[#0176d3] hover:bg-blue-700 hover:scale-105'
        )}
        style={{ width: 52, height: 52 }}
        aria-label="Open AI chat"
      >
        {open
          ? <Minimize2 className="w-5 h-5 text-white" />
          : <MessageSquare className="w-5 h-5 text-white" />
        }
        {unread && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>
    </div>
  )
}
