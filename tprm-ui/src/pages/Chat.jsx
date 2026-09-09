import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, MessageSquare, RefreshCw, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const SUGGESTED_QUESTIONS = [
  { cat: 'Risk', q: 'How many critical vendors have unresolved high risks?' },
  { cat: 'Risk', q: 'Which risks are currently escalated above threshold?' },
  { cat: 'Vendor', q: 'Which vendors are rated Tier 1 with Very High residual risk?' },
  { cat: 'Vendor', q: 'Show me the IRQ scores for all Tier-1 vendors' },
  { cat: 'Issues', q: 'Summarize all overdue remediation issues' },
  { cat: 'Issues', q: 'Which issues are linked to data security risks?' },
  { cat: 'Intelligence', q: 'What are the top 3 emerging risk themes this quarter?' },
  { cat: 'Performance', q: 'Which suppliers scored below 3.0 on their SBR this quarter?' },
]

const MOCK = {
  default: "I'm your TPRM AI assistant. I can help you analyze vendor risks, review open issues, check supplier performance scores, and surface emerging intelligence. What would you like to explore?",
  critical: "Based on current data: **9 vendors** carry Very High residual risk with open issues. Highest concentration is in **Technology** (4), followed by **Real Estate** (2). Top escalations involve data security and business continuity gaps for Tier-1 suppliers.\n\nRecommended action: Schedule executive review for CloudSystems Inc and DataSecure LLC within 5 business days.",
  sbr: "**14 suppliers** scored below 3.0 this quarter — concentrated in Technology (6) and Consulting (4). Portfolio average is **3.8 / 5.0**, up 0.12 from last quarter.\n\nBottom performers:\n• FastShip Logistics — 2.1\n• MedConsult Group — 2.4\n• GlobalPay Corp — 2.7\n\nRecommend scheduling performance improvement plans for the bottom quartile within 30 days.",
  issues: "There are **7 tracked issues** across all portfolios:\n• **Critical (2):** PCI-DSS remediation plan overdue (GlobalPay), CloudSystems CVE patching in progress\n• **High (2):** AES-256 encryption rollout, backup processor identification\n• **Medium (1):** Least-privilege access review (LegalEagle)\n• **Low (1):** DPA renewal completed\n\n**1 issue is currently overdue.** Immediate escalation recommended.",
  themes: "Top 3 emerging risk themes this quarter:\n\n1. **AI Supply Chain Exposure** — Vendors adopting GenAI without governance frameworks. 6 Tier-1 vendors identified as high exposure. Recommend issuing updated IRQ addendum by end of Q3.\n\n2. **Regulatory Divergence** — New SEC/EU disclosure requirements creating compliance gaps across 3 financial sector vendors. Legal review pending.\n\n3. **Concentration Risk** — Single-vendor dependency exceeding 40% threshold in cloud infrastructure and payment processing. Business continuity impact: critical.",
  irq: "IRQ composite scores across scored vendors:\n\n• CloudSystems Inc — **3.60** (High) — Security 4/5, Privacy 3/5, BCM 4/5, Financial 2/5\n• DataSecure LLC — **3.10** (Moderate) — Privacy strong at 4/5; Security needs improvement\n• GlobalPay Corp — **3.30** (Moderate) — Financial risk elevated (4/5); PCI gap active\n• LegalEagle LLP — **2.00** (Low) — Low exposure across all domains\n• FastShip Logistics — **1.40** (Very Low) — Minimal risk profile\n\nAverage composite: **2.68 (Moderate)**",
  escalated: "Currently escalated risks:\n\n1. **Unpatched CVEs — CloudSystems Inc** — Very High residual (24/25). Patches in progress, ETA Sept 1.\n2. **PCI-DSS network segmentation gap — GlobalPay Corp** — High residual (18/25). Remediation plan overdue.\n3. **Inadequate encryption at rest — DataSecure LLC** — High residual (16/25). AES-256 rollout underway.\n\nAll 3 require executive sign-off before next board reporting cycle.",
}

function match(text) {
  const t = text.toLowerCase()
  if (t.includes('critical') || t.includes('unresolved') || t.includes('very high')) return MOCK.critical
  if (t.includes('sbr') || t.includes('supplier') || t.includes('performance') || t.includes('below')) return MOCK.sbr
  if (t.includes('issue') || t.includes('overdue') || t.includes('remediation')) return MOCK.issues
  if (t.includes('emerging') || t.includes('theme') || t.includes('trend') || t.includes('intelligence')) return MOCK.themes
  if (t.includes('irq') || t.includes('composite') || t.includes('questionnaire') || t.includes('score')) return MOCK.irq
  if (t.includes('escalat') || t.includes('threshold') || t.includes('high risk')) return MOCK.escalated
  return MOCK.default
}

function Message({ role, content }) {
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
        dangerouslySetInnerHTML={{
          __html: content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        }}
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
  const [messages, setMessages] = useState([
    { role: 'assistant', content: MOCK.default }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeCat, setActiveCat] = useState('All')
  const endRef = useRef(null)
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
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: match(msg) }])
      setLoading(false)
    }, 800)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function reset() {
    setMessages([{ role: 'assistant', content: MOCK.default }])
    setInput('')
  }

  const cats = ['All', ...Array.from(new Set(SUGGESTED_QUESTIONS.map(q => q.cat)))]
  const visibleSuggestions = activeCat === 'All'
    ? SUGGESTED_QUESTIONS
    : SUGGESTED_QUESTIONS.filter(q => q.cat === activeCat)

  return (
    <div className="flex gap-5 h-[calc(100vh-120px)]">
      {/* Sidebar: suggested questions */}
      <div className="w-64 shrink-0 flex flex-col gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex-1 flex flex-col gap-3 overflow-hidden">
          <div>
            <h2 className="text-xs font-semibold text-gray-700 mb-0.5">Suggested Questions</h2>
            <p className="text-[10px] text-gray-400">Click to ask instantly</p>
          </div>
          {/* Category filter pills */}
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
          {/* Question list */}
          <div className="flex-1 overflow-y-auto space-y-1.5">
            {visibleSuggestions.map((item, i) => (
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

        {/* Demo note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="text-[10px] font-semibold text-amber-700 mb-0.5">Demo Mode</div>
          <p className="text-[10px] text-amber-600 leading-snug">Responses are simulated. Connect to live data API to enable real-time analysis.</p>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col gap-0 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
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
                Online · Powered by Claude
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
                Analyzing…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 py-3.5 border-t border-gray-200 bg-white shrink-0">
          <div className="flex gap-2.5 items-end">
            <textarea
              ref={inputRef}
              rows={1}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none leading-relaxed"
              placeholder="Ask about risks, vendors, compliance, or emerging threats…"
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
