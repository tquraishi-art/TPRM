import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Plus, X, Search, AlertTriangle, ChevronDown, ChevronRight, CheckSquare, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Static checklist template ───────────────────────────────────────────────

const TEMPLATE_ITEMS = [
  { category:'Access & Credentials',  title:'Revoke all user accounts and SSO access',              owner:'IT Security',  daysFromNotice: 1 },
  { category:'Access & Credentials',  title:'Rotate shared API keys and service account credentials',owner:'IT Security',  daysFromNotice: 1 },
  { category:'Access & Credentials',  title:'Revoke VPN / network access certificates',             owner:'IT Security',  daysFromNotice: 2 },
  { category:'Access & Credentials',  title:'Disable physical access badges and MFA tokens',        owner:'Facilities',   daysFromNotice: 2 },
  { category:'Data & Systems',        title:'Retrieve all company data / terminate data processing', owner:'Legal',        daysFromNotice: 5 },
  { category:'Data & Systems',        title:'Confirm data deletion or return per contract / GDPR',  owner:'Legal',        daysFromNotice: 30 },
  { category:'Data & Systems',        title:'Remove vendor from all system integrations / APIs',    owner:'Engineering',  daysFromNotice: 7 },
  { category:'Data & Systems',        title:'Archive or migrate data held in vendor environment',   owner:'Engineering',  daysFromNotice: 14 },
  { category:'Contracts & Legal',     title:'Issue formal termination notice per contractual terms',owner:'Legal',        daysFromNotice: 0 },
  { category:'Contracts & Legal',     title:'Confirm notice period and exit fee obligations',       owner:'Finance',      daysFromNotice: 0 },
  { category:'Contracts & Legal',     title:'Return or destroy confidential information (NDA)',     owner:'Legal',        daysFromNotice: 14 },
  { category:'Contracts & Legal',     title:'Obtain signed data deletion certificate',              owner:'Legal',        daysFromNotice: 30 },
  { category:'Finance',               title:'Process final invoice and reconcile outstanding payments', owner:'Finance',   daysFromNotice: 14 },
  { category:'Finance',               title:'Release or draw performance bonds / guarantees',       owner:'Finance',      daysFromNotice: 30 },
  { category:'Finance',               title:'Close procurement records and PO lines',               owner:'Procurement',  daysFromNotice: 7 },
  { category:'Risk & Compliance',     title:'Re-assess risks previously owned by this vendor',      owner:'TPRM',         daysFromNotice: 7 },
  { category:'Risk & Compliance',     title:'Close or reassign open issues linked to this vendor',  owner:'TPRM',         daysFromNotice: 14 },
  { category:'Risk & Compliance',     title:'Update regulatory registers (GDPR, DORA sub-processors)',owner:'Compliance', daysFromNotice: 14 },
  { category:'Risk & Compliance',     title:'Notify regulators if vendor was a critical DORA sub-processor', owner:'Compliance', daysFromNotice: 5 },
  { category:'Transition',            title:'Confirm replacement vendor or insourcing plan in place',owner:'Procurement',  daysFromNotice: -30 },
  { category:'Transition',            title:'Validate knowledge transfer / documentation handover', owner:'Operations',   daysFromNotice: 7 },
  { category:'Transition',            title:'Service continuity confirmed with successor',           owner:'Operations',   daysFromNotice: 14 },
  { category:'Lessons Learned',       title:'Conduct exit debrief and lessons-learned review',      owner:'TPRM',         daysFromNotice: 45 },
  { category:'Lessons Learned',       title:'Update vendor selection criteria based on exit findings', owner:'Procurement', daysFromNotice: 60 },
]

const CATEGORIES = [...new Set(TEMPLATE_ITEMS.map(i => i.category))]
const OWNERS = [...new Set(TEMPLATE_ITEMS.map(i => i.owner))]

const VENDORS = [
  { id:'v1', name:'CloudSystems Inc',    tier:'Tier 1' },
  { id:'v2', name:'DataSecure LLC',      tier:'Tier 1' },
  { id:'v3', name:'GlobalPay Corp',      tier:'Tier 2' },
  { id:'v4', name:'LegalEagle LLP',      tier:'Tier 2' },
  { id:'v5', name:'FastShip Logistics',  tier:'Tier 3' },
  { id:'v6', name:'MedConsult Group',    tier:'Tier 4' },
]

const STATUSES = ['Not Started', 'In Progress', 'Completed', 'N/A', 'Blocked']

const STATUS_COLORS = {
  'Not Started': 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Completed':   'bg-green-100 text-green-700',
  'N/A':         'bg-gray-50 text-gray-400',
  'Blocked':     'bg-red-100 text-red-700',
}

const TODAY = '2026-09-09'
function addDays(dateStr, n) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.round((new Date(dateStr) - new Date(TODAY)) / 86400000)
}

function buildChecklist(noticeDate) {
  return TEMPLATE_ITEMS.map((t, i) => ({
    id: 'ci' + i,
    ...t,
    dueDate: noticeDate ? addDays(noticeDate, t.daysFromNotice) : '',
    status: 'Not Started',
    assignee: '',
    notes: '',
  }))
}

// Seed: one active offboarding in progress
const SEED_ENGAGEMENTS = [
  {
    id: 'ob1',
    vendor: 'v5',
    reason: 'Contract not renewed — service consolidated internally',
    noticeDate: '2026-08-15',
    targetDate: '2026-10-31',
    status: 'In Progress',
    owner: 'J. Lee',
    items: buildChecklist('2026-08-15').map((item, i) => ({
      ...item,
      status: i < 6 ? 'Completed' : i === 6 ? 'In Progress' : i === 11 ? 'Blocked' : 'Not Started',
      assignee: i < 8 ? ['S. Kim','S. Kim','S. Kim','S. Kim','R. Brown','Finance','Engineering','Engineering'][i] : '',
      notes: i === 11 ? 'Waiting on vendor confirmation of deletion scope' : '',
    })),
  },
]

const BLANK_ENG = {
  vendor: 'v1', reason: '', noticeDate: '', targetDate: '', owner: '', status: 'Not Started',
}

export default function OffboardingChecklist() {
  const navigate = useNavigate()
  const [engagements, setEngagements] = useLocalStorage('tprm:offboarding', SEED_ENGAGEMENTS)
  const [q, setQ]                     = useState('')
  const [filterSt, setFilterSt]       = useState('')
  const [expandedId, setExpandedId]   = useState('ob1')
  const [modal, setModal]             = useState(null)
  const [form, setForm]               = useState(BLANK_ENG)
  const [filterCat, setFilterCat]     = useState('')

  const filtered = engagements.filter(e => {
    const vname = VENDORS.find(v => v.id === e.vendor)?.name || ''
    if (q && !vname.toLowerCase().includes(q.toLowerCase()) && !e.reason.toLowerCase().includes(q.toLowerCase())) return false
    if (filterSt && e.status !== filterSt) return false
    return true
  })

  function progress(items) {
    const done = items.filter(i => i.status === 'Completed' || i.status === 'N/A').length
    return Math.round((done / items.length) * 100)
  }
  function openAdd() { setForm({ ...BLANK_ENG }); setModal({ mode: 'add' }) }
  function saveEng() {
    if (!form.vendor || !form.noticeDate) return
    const newEng = {
      ...form,
      id: 'ob' + Math.random().toString(36).slice(2, 8),
      items: buildChecklist(form.noticeDate),
    }
    setEngagements(prev => [...prev, newEng])
    setModal(null)
  }
  function updateItem(engId, itemId, patch) {
    setEngagements(prev => prev.map(e => e.id !== engId ? e : {
      ...e,
      items: e.items.map(i => i.id !== itemId ? i : { ...i, ...patch }),
    }))
  }
  function cycleStatus(engId, itemId, current) {
    const next = { 'Not Started':'In Progress', 'In Progress':'Completed', 'Completed':'N/A', 'N/A':'Not Started', 'Blocked':'In Progress' }
    updateItem(engId, itemId, { status: next[current] || 'Not Started' })
  }

  const active   = engagements.filter(e => e.status === 'In Progress').length
  const complete = engagements.filter(e => e.status === 'Completed').length
  const blocked  = engagements.flatMap(e => e.items).filter(i => i.status === 'Blocked').length
  const overdue  = engagements.flatMap(e => e.items).filter(i => {
    const d = daysUntil(i.dueDate)
    return d !== null && d < 0 && i.status !== 'Completed' && i.status !== 'N/A'
  }).length

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Vendor Offboarding Checklist</h1>
          <p className="text-xs text-gray-400 mt-0.5">Structured exit management — track every step from notice to closure</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#0176d3] text-white text-xs font-medium px-3 py-2 rounded hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5" /> Start Offboarding
        </button>
      </div>

      {/* Alert */}
      {(blocked > 0 || overdue > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            {blocked > 0 && <span><strong>{blocked} item{blocked > 1 ? 's' : ''} blocked</strong> — action required to unblock. </span>}
            {overdue > 0 && <span><strong>{overdue} item{overdue > 1 ? 's' : ''} overdue</strong> — past due date and not completed.</span>}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Active Offboardings', value: active,    color: 'text-blue-600' },
          { label:'Completed',           value: complete,  color: 'text-green-600' },
          { label:'Blocked Items',       value: blocked,   color: blocked > 0 ? 'text-red-600' : 'text-green-600' },
          { label:'Overdue Items',       value: overdue,   color: overdue > 0 ? 'text-orange-500' : 'text-green-600' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{k.label}</div>
            <div className={cn('text-2xl font-bold', k.color)}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400" placeholder="Search vendor or reason…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterSt} onChange={e => setFilterSt(e.target.value)}>
          <option value="">All Status</option>
          {['Not Started','In Progress','Completed'].map(s => <option key={s}>{s}</option>)}
        </select>
        {(q || filterSt) && <button onClick={() => { setQ(''); setFilterSt('') }} className="text-xs text-blue-500 hover:text-blue-700 px-2">Clear</button>}
      </div>

      {/* Engagement cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-8 text-center text-xs text-gray-400">No offboarding engagements found</div>
        )}
        {filtered.map(eng => {
          const vname = VENDORS.find(v => v.id === eng.vendor)?.name || eng.vendor
          const vtier = VENDORS.find(v => v.id === eng.vendor)?.tier || ''
          const pct   = progress(eng.items)
          const isOpen = expandedId === eng.id
          const visItems = filterCat ? eng.items.filter(i => i.category === filterCat) : eng.items

          return (
            <div key={eng.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Header */}
              <button
                className="w-full px-4 py-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
                onClick={() => setExpandedId(v => v === eng.id ? null : eng.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <button className="text-sm font-semibold text-blue-500 hover:underline" onClick={e => { e.stopPropagation(); navigate('/vendors', { state: { openVendorName: vname } }) }}>{vname}</button>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{vtier}</span>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', STATUS_COLORS[eng.status])}>{eng.status}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">{eng.reason}</div>
                  <div className="flex items-center gap-4 text-[11px] text-gray-400">
                    {eng.noticeDate && <span>Notice: {eng.noticeDate}</span>}
                    {eng.targetDate && <span>Target close: {eng.targetDate}</span>}
                    {eng.owner && <span>Owner: {eng.owner}</span>}
                  </div>
                </div>
                {/* Progress bar */}
                <div className="flex flex-col items-end gap-1 shrink-0 min-w-[80px]">
                  <span className="text-xs font-bold text-gray-700">{pct}%</span>
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-orange-400')} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-400">{eng.items.filter(i => i.status === 'Completed' || i.status === 'N/A').length}/{eng.items.length} done</span>
                </div>
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 mt-1 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 mt-1 shrink-0" />}
              </button>

              {/* Expanded checklist */}
              {isOpen && (
                <div className="border-t border-gray-100">
                  {/* Category filter */}
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mr-1">Filter by category:</span>
                    <button onClick={() => setFilterCat('')} className={cn('text-[10px] px-2.5 py-1 rounded-full border transition-colors', !filterCat ? 'bg-blue-100 border-blue-300 text-blue-700 font-semibold' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300')}>All</button>
                    {CATEGORIES.map(cat => {
                      const catItems = eng.items.filter(i => i.category === cat)
                      const blocked  = catItems.filter(i => i.status === 'Blocked').length
                      const overdue  = catItems.filter(i => { const d = daysUntil(i.dueDate); return d !== null && d < 0 && i.status !== 'Completed' && i.status !== 'N/A' }).length
                      return (
                        <button key={cat} onClick={() => setFilterCat(v => v === cat ? '' : cat)} className={cn('text-[10px] px-2.5 py-1 rounded-full border transition-colors', filterCat === cat ? 'bg-blue-100 border-blue-300 text-blue-700 font-semibold' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300')}>
                          {cat}{blocked > 0 ? <span className="ml-1 text-red-500">●</span> : overdue > 0 ? <span className="ml-1 text-orange-400">●</span> : null}
                        </button>
                      )
                    })}
                  </div>

                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['', 'Task', 'Category', 'Owner Team', 'Due Date', 'Assignee', 'Status', 'Notes'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visItems.map(item => {
                        const d = daysUntil(item.dueDate)
                        const pastDue = d !== null && d < 0 && item.status !== 'Completed' && item.status !== 'N/A'
                        return (
                          <tr key={item.id} className={cn('border-b border-gray-50 hover:bg-gray-50/60 transition-colors', item.status === 'Blocked' && 'bg-red-50/30', pastDue && 'bg-orange-50/20')}>
                            <td className="px-3 py-2.5">
                              <button onClick={() => cycleStatus(eng.id, item.id, item.status)} title="Click to cycle status">
                                {item.status === 'Completed'
                                  ? <CheckSquare className="w-4 h-4 text-green-500" />
                                  : item.status === 'N/A'
                                  ? <CheckSquare className="w-4 h-4 text-gray-300" />
                                  : <Square className="w-4 h-4 text-gray-300 hover:text-blue-400" />
                                }
                              </button>
                            </td>
                            <td className="px-3 py-2.5 text-gray-800 max-w-[280px]">{item.title}</td>
                            <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{item.category}</td>
                            <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{item.owner}</td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              {item.dueDate
                                ? <span className={cn('font-medium', pastDue ? 'text-orange-500' : d !== null && d <= 5 ? 'text-yellow-600' : 'text-gray-600')}>{item.dueDate}{pastDue && ' ⚠'}</span>
                                : <span className="text-gray-300">—</span>
                              }
                            </td>
                            <td className="px-3 py-2.5">
                              <input
                                className="w-24 text-xs border-b border-gray-200 focus:outline-none focus:border-blue-400 bg-transparent"
                                placeholder="Assign…"
                                value={item.assignee}
                                onChange={e => updateItem(eng.id, item.id, { assignee: e.target.value })}
                                onClick={e => e.stopPropagation()}
                              />
                            </td>
                            <td className="px-3 py-2.5">
                              <select
                                className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold border-0 cursor-pointer focus:outline-none', STATUS_COLORS[item.status])}
                                value={item.status}
                                onChange={e => updateItem(eng.id, item.id, { status: e.target.value })}
                                onClick={e => e.stopPropagation()}
                              >
                                {STATUSES.map(s => <option key={s}>{s}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-2.5">
                              <input
                                className="w-36 text-xs border-b border-gray-200 focus:outline-none focus:border-blue-400 bg-transparent text-gray-500"
                                placeholder="Notes…"
                                value={item.notes}
                                onChange={e => updateItem(eng.id, item.id, { notes: e.target.value })}
                                onClick={e => e.stopPropagation()}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Start Vendor Offboarding</h3>
              <button onClick={() => setModal(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label:'Vendor',          key:'vendor',     type:'select', opts: VENDORS.map(v => ({ val: v.id, label: v.name })) },
                { label:'Reason for Exit', key:'reason',     type:'textarea' },
                { label:'Notice Date',     key:'noticeDate', type:'date' },
                { label:'Target Close Date',key:'targetDate',type:'date' },
                { label:'Engagement Owner',key:'owner',      type:'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.label}</label>
                  {f.type === 'select'
                    ? <select className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400" value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}>
                        {f.opts.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                      </select>
                    : f.type === 'textarea'
                    ? <textarea rows={2} className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400 resize-none" value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    : <input type={f.type} className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400" value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  }
                </div>
              ))}
              <p className="text-[11px] text-gray-400">A standard 24-item checklist will be generated automatically with due dates calculated from the notice date.</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="text-xs border border-gray-200 rounded px-4 py-2 hover:bg-gray-50">Cancel</button>
              <button onClick={saveEng} className="text-xs bg-[#0176d3] text-white rounded px-4 py-2 hover:bg-blue-700">Create Checklist</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
