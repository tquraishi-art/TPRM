import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

// ─── Data ─────────────────────────────────────────────────────────────────────

const TODAY = new Date('2026-08-26')

const IRQ_DATA = [
  {id:'q1',vendor:'CloudSystems Inc',            tier:'Tier 1',sec:4,priv:3,bcm:4,fin:2,st:'Scored',      lastReview:'2026-06-15',nextDue:'2027-06-15'},
  {id:'q2',vendor:'DataSecure LLC',              tier:'Tier 1',sec:3,priv:4,bcm:3,fin:2,st:'Scored',      lastReview:'2026-05-01',nextDue:'2027-05-01'},
  {id:'q3',vendor:'GlobalPay Corp',              tier:'Tier 2',sec:3,priv:4,bcm:3,fin:4,st:'Scored',      lastReview:'2026-04-10',nextDue:'2027-04-10'},
  {id:'q4',vendor:'LegalEagle LLP',              tier:'Tier 2',sec:2,priv:2,bcm:2,fin:2,st:'Scored',      lastReview:'2026-03-20',nextDue:'2027-03-20'},
  {id:'q5',vendor:'FastShip Logistics',          tier:'Tier 3',sec:1,priv:1,bcm:2,fin:1,st:'Scored',      lastReview:'2025-11-01',nextDue:'2026-11-01'},
  {id:'q6',vendor:'MedConsult Group',            tier:'Tier 4',sec:1,priv:1,bcm:1,fin:1,st:'Not in Scope',lastReview:'',         nextDue:''},
  {id:'q7',vendor:'Pinnacle Workplace Solutions',tier:'Tier 2',sec:0,priv:0,bcm:0,fin:0,st:'Pending',     lastReview:'',         nextDue:''},
  {id:'q8',vendor:'NetCore Systems',             tier:'Tier 1',sec:0,priv:0,bcm:0,fin:0,st:'In Progress', lastReview:'',         nextDue:''},
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function composite(r) {
  return Math.round((r.sec * 0.4 + r.priv * 0.2 + r.bcm * 0.3 + r.fin * 0.1) * 10) / 10
}

function riskLevel(score) {
  if (score >= 4.5) return 'Very High'
  if (score >= 3.5) return 'High'
  if (score >= 2.5) return 'Moderate'
  if (score >= 1.5) return 'Low'
  return 'Very Low'
}

function isOverdue(row) {
  return row.st === 'Scored' && row.nextDue && new Date(row.nextDue) < TODAY
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusChip({ st }) {
  const map = {
    'Scored':       'bg-green-100 text-green-700 border-green-200',
    'In Progress':  'bg-blue-100 text-blue-700 border-blue-200',
    'Pending':      'bg-gray-100 text-gray-600 border-gray-300',
    'Not in Scope': 'bg-gray-50 text-gray-400 border-gray-200',
  }
  return <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap', map[st] ?? 'bg-gray-100 text-gray-500 border-gray-200')}>{st}</span>
}

function RiskBadge({ score }) {
  const l = riskLevel(score)
  const map = {
    'Very High':'bg-red-100 text-red-700 border-red-200',
    'High':     'bg-orange-100 text-orange-700 border-orange-200',
    'Moderate': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Low':      'bg-blue-100 text-blue-700 border-blue-200',
    'Very Low': 'bg-green-100 text-green-700 border-green-200',
  }
  return <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap', map[l])}>{l}</span>
}

function CompositeScore({ score }) {
  let color = 'text-green-600'
  if (score >= 4.5)      color = 'text-red-600'
  else if (score >= 3.5) color = 'text-orange-500'
  else if (score >= 2.5) color = 'text-yellow-600'
  else if (score >= 1.5) color = 'text-blue-600'
  return <span className={cn('font-bold text-base', color)}>{score > 0 ? score.toFixed(1) : '—'}</span>
}

const DOMAIN_COLORS = {
  sec:  'bg-red-500',
  priv: 'bg-purple-500',
  bcm:  'bg-orange-400',
  fin:  'bg-yellow-400',
}

function DomainBar({ val, domain }) {
  const pct = Math.round((val / 5) * 100)
  return (
    <div className="flex items-center gap-1.5 min-w-[70px]">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', DOMAIN_COLORS[domain])} style={{ width:`${pct}%` }}/>
      </div>
      <span className="text-xs text-gray-500 w-4 text-right">{val || '—'}</span>
    </div>
  )
}

// ─── Expand Panel ─────────────────────────────────────────────────────────────

function ExpandPanel({ row, navigate }) {
  const comp     = composite(row)
  const isScored = row.st === 'Scored'
  const od       = isOverdue(row)
  const notes    = od
    ? 'Review overdue — schedule now'
    : row.st === 'Not in Scope' ? 'Excluded from program'
    : row.st === 'Pending'      ? 'Awaiting vendor response'
    : row.st === 'In Progress'  ? 'Assessment underway'
    : ''

  const domains = [
    { key: 'sec',  label: 'Security (40%)',  val: row.sec,  color: 'bg-red-500' },
    { key: 'priv', label: 'Privacy (20%)',   val: row.priv, color: 'bg-purple-500' },
    { key: 'bcm',  label: 'BCM (30%)',       val: row.bcm,  color: 'bg-orange-400' },
    { key: 'fin',  label: 'Financial (10%)', val: row.fin,  color: 'bg-yellow-400' },
  ]

  return (
    <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Domain scores */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Domain Scores</p>
          <div className="space-y-3">
            {domains.map(d => (
              <div key={d.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 font-medium">{d.label}</span>
                  <span className="font-semibold text-gray-700">{d.val > 0 ? `${d.val} / 5` : '—'}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  {d.val > 0 && (
                    <div className={cn('h-full rounded-full', d.color)} style={{ width: `${(d.val / 5) * 100}%` }} />
                  )}
                </div>
              </div>
            ))}
          </div>
          {isScored && (
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Composite</span>
              <CompositeScore score={comp} />
            </div>
          )}
        </div>
        {/* Meta */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Risk Level</p>
              {isScored ? <RiskBadge score={comp} /> : <span className="text-xs text-gray-400">—</span>}
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <StatusChip st={row.st} />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Last Review</p>
              <p className="text-xs font-semibold text-gray-800">{row.lastReview || '—'}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Next Due</p>
              <p className={cn('text-xs font-semibold', od ? 'text-red-600' : 'text-gray-800')}>
                {row.nextDue || '—'}{od && ' (Overdue)'}
              </p>
            </div>
            {notes && (
              <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-xs text-gray-700">{notes}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => navigate('/vendors', { state: { openVendorName: row.vendor } })}
              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View vendor profile
            </button>
            <button
              onClick={() => navigate('/irq')}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
            >
              View IRQ scoring
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const _scored     = IRQ_DATA.filter(r => r.st === 'Scored')
const _inprogPend = IRQ_DATA.filter(r => r.st === 'In Progress' || r.st === 'Pending')
const _notInScope = IRQ_DATA.filter(r => r.st === 'Not in Scope')
const _overdue    = IRQ_DATA.filter(r => isOverdue(r))

const KPI_TILES = [
  { label:'Scored',               count:_scored.length,     color:'text-green-600', bg:'bg-green-50 border-green-200', filter:'Scored' },
  { label:'In Progress / Pending',count:_inprogPend.length, color:'text-blue-600',  bg:'bg-blue-50 border-blue-200',   filter:'In Progress / Pending' },
  { label:'Not in Scope',         count:_notInScope.length, color:'text-gray-500',  bg:'bg-gray-50 border-gray-200',   filter:'Not in Scope' },
  { label:'Overdue Reviews',      count:_overdue.length,    color:'text-red-600',   bg:'bg-red-50 border-red-200',     filter:'Overdue' },
]

const STATUS_CARDS = [
  { label:'Scored',      items:_scored,                                      headerColor:'bg-green-500', filter:'Scored' },
  { label:'In Progress', items:IRQ_DATA.filter(r => r.st === 'In Progress'), headerColor:'bg-blue-500',  filter:'In Progress / Pending' },
  { label:'Pending',     items:IRQ_DATA.filter(r => r.st === 'Pending'),     headerColor:'bg-gray-400',  filter:'In Progress / Pending' },
]

const ALL_TIERS  = [...new Set(IRQ_DATA.map(r => r.tier))].sort()
const ALL_LEVELS = ['Very High', 'High', 'Moderate', 'Low', 'Very Low']

export default function IRQDash() {
  const navigate = useNavigate()

  const [filterStatus, setFilterStatus] = useState(null)
  const [filterLevel,  setFilterLevel]  = useState(null)
  const [filterTier,   setFilterTier]   = useState(null)
  const [expandedId,   setExpandedId]   = useState(null)

  function handleKpiClick(filter) {
    setFilterStatus(prev => prev === filter ? null : filter)
  }

  function handleCardClick(filter) {
    setFilterStatus(prev => prev === filter ? null : filter)
  }

  const visibleRows = IRQ_DATA.filter(r => {
    if (filterStatus === 'Scored'                && r.st !== 'Scored') return false
    if (filterStatus === 'In Progress / Pending' && r.st !== 'In Progress' && r.st !== 'Pending') return false
    if (filterStatus === 'Not in Scope'          && r.st !== 'Not in Scope') return false
    if (filterStatus === 'Overdue'               && !isOverdue(r)) return false
    if (filterLevel) {
      if (r.st !== 'Scored') return false
      if (riskLevel(composite(r)) !== filterLevel) return false
    }
    if (filterTier && r.tier !== filterTier) return false
    return true
  })

  const hasFilters = filterStatus || filterLevel || filterTier

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">IRQ Working Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Information Risk Questionnaire assessment status across all vendors</p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {KPI_TILES.map(t => (
          <button
            key={t.label}
            onClick={() => handleKpiClick(t.filter)}
            className={cn(
              'border rounded-xl p-4 text-left transition-all',
              t.bg,
              filterStatus === t.filter
                ? 'ring-2 ring-offset-1 ring-blue-400 shadow-md'
                : 'hover:shadow-sm'
            )}
          >
            <div className={cn('text-3xl font-bold', t.color)}>{t.count}</div>
            <div className="text-sm text-gray-600 mt-1">{t.label}</div>
          </button>
        ))}
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATUS_CARDS.map(card => (
          <div key={card.label} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => handleCardClick(card.filter)}
              className={cn(
                'w-full px-4 py-2 text-white text-sm font-semibold text-left transition-opacity',
                card.headerColor,
                filterStatus === card.filter ? 'opacity-90 ring-2 ring-inset ring-white/40' : 'hover:opacity-90'
              )}
            >
              {card.label} ({card.items.length})
            </button>
            <div className="divide-y divide-gray-50">
              {card.items.length === 0 && (
                <div className="px-4 py-4 text-sm text-gray-400 italic">None</div>
              )}
              {card.items.map(r => {
                const comp = composite(r)
                return (
                  <button
                    key={r.id}
                    onClick={() => handleCardClick(card.filter)}
                    className="w-full px-4 py-3 flex items-center justify-between gap-2 hover:bg-gray-50 text-left"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900 leading-tight">{r.vendor}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{r.tier}</div>
                    </div>
                    {r.st === 'Scored' && (
                      <div className="text-right">
                        <CompositeScore score={comp}/>
                        <div className="text-xs text-gray-400">composite</div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Full assessment table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Full Assessment Table</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Domain bars: <span className="text-red-500 font-medium">Security (40%)</span>
            {' · '}<span className="text-purple-500 font-medium">Privacy (20%)</span>
            {' · '}<span className="text-orange-400 font-medium">BCM (30%)</span>
            {' · '}<span className="text-yellow-500 font-medium">Financial (10%)</span>
          </p>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-3 items-center">
          {/* Tier dropdown */}
          <select
            value={filterTier ?? 'All'}
            onChange={e => setFilterTier(e.target.value === 'All' ? null : e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="All">All Tiers</option>
            {ALL_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {/* Risk level dropdown */}
          <select
            value={filterLevel ?? 'All'}
            onChange={e => setFilterLevel(e.target.value === 'All' ? null : e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="All">All Risk Levels</option>
            {ALL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          {/* Active status filter pill */}
          {filterStatus && (
            <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded-full flex items-center gap-1">
              {filterStatus}
              <button onClick={() => setFilterStatus(null)} className="hover:text-blue-900 font-bold ml-0.5">×</button>
            </span>
          )}
          {/* Clear all */}
          {hasFilters && (
            <button
              onClick={() => { setFilterStatus(null); setFilterLevel(null); setFilterTier(null) }}
              className="text-xs text-blue-500 hover:underline"
            >
              Clear all
            </button>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {visibleRows.length} of {IRQ_DATA.length} vendors
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                {['Vendor','Tier','Security','Privacy','BCM','Financial','Composite','Risk Level','Status','Last Review','Next Due','Notes'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visibleRows.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center py-10 text-gray-400 text-sm italic">
                    No vendors match the current filters.
                  </td>
                </tr>
              )}
              {visibleRows.map(r => {
                const comp     = composite(r)
                const isScored = r.st === 'Scored'
                const od       = isOverdue(r)
                const isOpen   = expandedId === r.id
                return (
                  <>
                    <tr
                      key={r.id}
                      onClick={() => setExpandedId(prev => prev === r.id ? null : r.id)}
                      className={cn(
                        'transition-colors cursor-pointer',
                        isOpen ? 'bg-blue-50' : 'hover:bg-gray-50'
                      )}
                    >
                      {/* Vendor */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <button
                          onClick={e => { e.stopPropagation(); navigate('/vendors', { state: { openVendorName: r.vendor } }) }}
                          className="font-medium text-blue-600 hover:underline whitespace-nowrap text-left text-sm"
                        >
                          {r.vendor}
                        </button>
                      </td>
                      {/* Tier */}
                      <td className="px-3 py-3">
                        <button
                          onClick={e => { e.stopPropagation(); setFilterTier(prev => prev === r.tier ? null : r.tier) }}
                          className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full border hover:opacity-80 cursor-pointer',
                            r.tier === 'Tier 1' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            r.tier === 'Tier 2' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                            r.tier === 'Tier 3' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            'bg-gray-100 text-gray-500 border-gray-200'
                          )}
                        >
                          {r.tier}
                        </button>
                      </td>
                      {/* Domain bars */}
                      <td className="px-3 py-3"><DomainBar val={r.sec}  domain="sec"/></td>
                      <td className="px-3 py-3"><DomainBar val={r.priv} domain="priv"/></td>
                      <td className="px-3 py-3"><DomainBar val={r.bcm}  domain="bcm"/></td>
                      <td className="px-3 py-3"><DomainBar val={r.fin}  domain="fin"/></td>
                      {/* Composite */}
                      <td className="px-3 py-3">
                        {isScored ? <CompositeScore score={comp}/> : <span className="text-gray-300 text-sm">—</span>}
                      </td>
                      {/* Risk Level */}
                      <td className="px-3 py-3">
                        {isScored ? (
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              const lvl = riskLevel(comp)
                              setFilterLevel(prev => prev === lvl ? null : lvl)
                            }}
                            className="hover:opacity-80 cursor-pointer"
                          >
                            <RiskBadge score={comp}/>
                          </button>
                        ) : (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
                      </td>
                      {/* Status */}
                      <td className="px-3 py-3"><StatusChip st={r.st}/></td>
                      {/* Last Review */}
                      <td className="px-3 py-3 text-gray-500 whitespace-nowrap text-xs">{r.lastReview || '—'}</td>
                      {/* Next Due */}
                      <td className={cn('px-3 py-3 whitespace-nowrap text-xs font-medium', od ? 'text-red-600' : 'text-gray-500')}>
                        {r.nextDue || '—'}
                        {od && <span className="ml-1 text-xs font-bold text-red-600">(Overdue)</span>}
                      </td>
                      {/* Notes */}
                      <td className="px-3 py-3 text-xs text-gray-400 max-w-[140px]">
                        {od ? 'Review overdue — schedule now' : r.st === 'Not in Scope' ? 'Excluded from program' : r.st === 'Pending' ? 'Awaiting vendor response' : r.st === 'In Progress' ? 'Assessment underway' : ''}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={r.id + '-detail'}>
                        <td colSpan={12} className="p-0">
                          <ExpandPanel row={r} navigate={navigate} />
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-500">
        <span className="font-semibold text-gray-700">Composite formula:</span> Security × 0.4 + Privacy × 0.2 + BCM × 0.3 + Financial × 0.1 (scale 0–5) ·{' '}
        <span className="font-semibold text-gray-700">Risk levels:</span> ≥4.5 Very High · 3.5–4.49 High · 2.5–3.49 Moderate · 1.5–2.49 Low · &lt;1.5 Very Low
      </div>
    </div>
  )
}
