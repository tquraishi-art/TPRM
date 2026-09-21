import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Loader2, MessageSquare, RefreshCw, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildContext, query } from '@/lib/tprmEngine'

const SUGGESTED_QUESTIONS = [
  { cat: 'Risk',       q: 'Which risks are currently escalated above threshold?' },
  { cat: 'Risk',       q: 'Show me all Very High residual risks' },
  { cat: 'Risk',       q: 'Summarize Cybersecurity risks in the register' },
  { cat: 'Risk',       q: 'Are there any risk appetite breaches?' },
  { cat: 'Vendor',     q: 'Give me a profile of Amazon Web Services' },
  { cat: 'Vendor',     q: 'Which Tier 1 vendors have open High risks?' },
  { cat: 'Vendor',     q: 'Show vendor concentration across categories' },
  { cat: 'Issues',     q: 'What open issues are overdue?' },
  { cat: 'Issues',     q: 'Summarize all open issues by priority' },
  { cat: 'Compliance', q: 'Show me Compliance risk findings' },
  { cat: 'Compliance', q: 'Which assessment questionnaires are pending?' },
  { cat: 'KRI',        q: 'Are any KRI thresholds currently breached?' },
  { cat: 'IRQ',        q: 'Show IRQ scores for all scored vendors' },
  { cat: 'Performance',q: 'Which suppliers scored below 3.0 on their SBR?' },
  { cat: 'Overview',   q: 'Give me a full risk register summary' },
]

function Message({ role, content }) {
  const html = content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  return (
    <div className={cn('flex gap-3', role === 'user' ? 'justify-end' : 'justify-start')}>
      {role === 'assistant' && (
        <div className="w-7 h-7 rounded-full bg-[#0176d3] flex items-center justify-center shrink-0 mt-0.5">
          <MessageSquare className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div
        className={cn(
          'rounded-xl px-4 py-3 max-w-[75%] text-sm leading-relaxed',
          role === 'user'
            ? 'bg-[#0176d3] text-white rounded-tr-none'
            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
        )}
        style={{ whiteSpace: 'pre-line' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {role === 'user' && (
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-gray-500">
          You
        </div>
      )}
    </div>
  )
}

export default function Chat() {
  const ctx = useRef(null)

  function getCtx() {
    // Rebuild context on every query so it always reads latest localStorage
    ctx.current = buildContext()
    return ctx.current
  }

  const welcome = useCallback(() => {
    const c = getCtx()
    return query('hello', c)
  }, [])

  const [messages, setMessages] = useState(() => [
    { role: 'assistant', content: welcome() }
  ])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [activeCat, setActiveCat] = useState('All')
  const endRef   = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function send(text) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)

    // Simulate brief processing latency (purely UX — answer is computed synchronously)
    setTimeout(() => {
      const answer = query(msg, getCtx())
      setMessages(prev => [...prev, { role: 'assistant', content: answer }])
      setLoading(false)
    }, 300)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function reset() {
    setMessages([{ role: 'assistant', content: welcome() }])
    setInput('')
  }

  const cats = ['All', ...Array.from(new Set(SUGGESTED_QUESTIONS.map(q => q.cat)))]
  const visible = activeCat === 'All'
    ? SUGGESTED_QUESTIONS
    : SUGGESTED_QUESTIONS.filter(q => q.cat === activeCat)

  // Data freshness indicator — count of items in key stores
  const freshness = (() => {
    try {
      const r = JSON.parse(localStorage.getItem('tprm:risks')   || '[]').length
      const v = JSON.parse(localStorage.getItem('tprm:vendors') || '[]').length
      const i = JSON.parse(localStorage.getItem('tprm:issues')  || '[]').length
      return `${v} vendors · ${r} risks · ${i} issues`
    } catch { return 'Live data' }
  })()

  return (
    <div className="flex gap-5 h-[calc(100vh-120px)]">

      {/* Sidebar */}
      <div className="w-64 shrink-0 flex flex-col gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex-1 flex flex-col gap-3 overflow-hidden">
          <div>
            <h2 className="text-xs font-semibold text-gray-700 mb-0.5">Suggested Questions</h2>
            <p className="text-[10px] text-gray-400">All answers are computed from live platform data</p>
          </div>

          <div className="flex flex-wrap gap-1">
            {cats.map(c => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={cn(
                  'text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors',
                  activeCat === c
                    ? 'bg-[#0176d3] text-white border-[#0176d3]'
                    : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5">
            {visible.map((item, i) => (
              <button
                key={i}
                onClick={() => send(item.q)}
                disabled={loading}
                className="w-full text-left text-xs text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-100 hover:border-blue-200 rounded-lg px-3 py-2 transition-colors leading-snug disabled:opacity-50"
              >
                {item.q}
              </button>
            ))}
          </div>
        </div>

        {/* Live data badge */}
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <Database className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] font-semibold text-green-700">Live Platform Data</div>
            <p className="text-[10px] text-green-600 leading-snug mt-0.5">{freshness}</p>
            <p className="text-[10px] text-green-600 leading-snug">All answers reflect your current register — no external calls.</p>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0176d3] flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800">TPRM AI Assistant</div>
              <div className="text-[10px] text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                Live · Reads all platform data
              </div>
            </div>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-2.5 py-1.5 hover:border-gray-300 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> New conversation
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-gray-50/40">
          {messages.map((m, i) => <Message key={i} role={m.role} content={m.content} />)}
          {loading && (
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-[#0176d3] flex items-center justify-center shrink-0">
                <MessageSquare className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Reading platform data…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3.5 border-t border-gray-200 bg-white shrink-0">
          <div className="flex gap-2.5 items-end">
            <textarea
              ref={inputRef}
              rows={1}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none leading-relaxed"
              placeholder="Ask about risks, vendors, issues, KRIs, assessments, SBR…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              style={{ minHeight: 42, maxHeight: 120 }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="bg-[#0176d3] text-white rounded-xl px-4 py-2.5 hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0 h-[42px] flex items-center gap-1.5 text-sm font-medium"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
          </div>
          <div className="mt-1.5 text-[10px] text-gray-300 text-center">Press Enter to send · Shift+Enter for new line</div>
        </div>
      </div>
    </div>
  )
}
