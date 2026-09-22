import { useState, Fragment, useEffect } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Plus, Pencil, X, Check, AlertTriangle, Grid3x3, List, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VENDORS_INIT, RISKS_SEED } from '@/lib/seedData'

// ─── Data ─────────────────────────────────────────────────────────────────────

const INIT_RISKS = RISKS_SEED

// ─── Utilities ────────────────────────────────────────────────────────────────

const CTRL_REDUCTION = [0, 0.25, 0.50, 0.75, 0.90]
function inherent(r) { return r.lik * r.imp }
function residual(r) { return Math.max(1, Math.round(inherent(r) * (1 - (CTRL_REDUCTION[r.ctrl] || 0)))) }
function level(score) {
  if (score >= 20) return 'Very High'
  if (score >= 12) return 'High'
  if (score >= 6)  return 'Moderate'
  if (score >= 2)  return 'Low'
  return 'Very Low'
}
// Risks may store vendor as name string OR legacy id — resolve both
function vname(idOrName) {
  if (!idOrName) return 'Unknown'
  const byId   = VENDORS_INIT.find(v => v.id   === idOrName)
  const byName = VENDORS_INIT.find(v => v.name === idOrName)
  return (byId || byName)?.name || idOrName
}
function vtier(idOrName) {
  if (!idOrName) return ''
  const byId   = VENDORS_INIT.find(v => v.id   === idOrName)
  const byName = VENDORS_INIT.find(v => v.name === idOrName)
  return (byId || byName)?.tier || ''
}
function needsEscalation(r) {
  const rl = level(residual(r))
  if (rl === 'Very High') return true
  const v = VENDORS_INIT.find(v => v.id === r.vendor || v.name === r.vendor)
  if (v?.tier === 'Tier 1' && (rl === 'Very High' || rl === 'High')) return true
  if (rl === 'High' && r.due && new Date(r.due) < new Date()) return true
  return false
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_COLOR = {
  'Very High': '#ef4444',
  'High':      '#f97316',
  'Moderate':  '#eab308',
  'Low':       '#4f8ef7',
  'Very Low':  '#22c55e',
}

const LEVEL_BADGE_CLS = {
  'Very High': 'bg-red-100 text-red-700',
  'High':      'bg-orange-100 text-orange-700',
  'Moderate':  'bg-yellow-100 text-yellow-700',
  'Low':       'bg-blue-100 text-blue-700',
  'Very Low':  'bg-green-100 text-green-700',
}

const STATUS_BADGE_CLS = {
  'Open':        'bg-gray-100 text-gray-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Mitigated':   'bg-green-100 text-green-700',
  'Accepted':    'bg-purple-100 text-purple-700',
  'Closed':      'bg-gray-200 text-gray-500',
}

const TREAT_BADGE_CLS = {
  'Mitigate': 'bg-orange-100 text-orange-700',
  'Transfer': 'bg-blue-100 text-blue-700',
  'Accept':   'bg-purple-100 text-purple-700',
  'Avoid':    'bg-red-100 text-red-700',
}

const CATS     = ['Cybersecurity','Privacy & Data','Business Continuity','Financial','Operational','Compliance','Reputational','Strategic']
const STATUSES = ['Open','In Progress','Mitigated','Accepted','Closed']
const LEVELS   = ['Very High','High','Moderate','Low','Very Low']

const inputCls = 'w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white'
const BLANK_RISK = {id:'',name:'',vendor:'Amazon Web Services',cat:'Cybersecurity',lik:3,imp:3,ctrl:0,treat:'Mitigate',st:'Open',owner:'',due:'',desc:'',plan:'',ev:''}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ value, color, max = 25 }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="flex items-center gap-1.5 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-semibold w-4 text-right" style={{ color }}>{value}</span>
    </div>
  )
}

function LevelBadge({ score }) {
  const l = level(score)
  return (
    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap', LEVEL_BADGE_CLS[l])}>{l}</span>
  )
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

// ─── 5×5 Heatmap ──────────────────────────────────────────────────────────────

const CELL_COLOR = (score) => {
  if (score >= 20) return '#fecaca' // red-200
  if (score >= 12) return '#fed7aa' // orange-200
  if (score >= 6)  return '#fef08a' // yellow-200
  if (score >= 2)  return '#bfdbfe' // blue-200
  return '#bbf7d0'                  // green-200
}
const CELL_TEXT = (score) => {
  if (score >= 20) return '#991b1b'
  if (score >= 12) return '#9a3412'
  if (score >= 6)  return '#854d0e'
  if (score >= 2)  return '#1e40af'
  return '#166534'
}

function RiskHeatmap({ risks }) {
  const [hover, setHover] = useState(null) // {row,col,type}
  const [tooltip, setTooltip] = useState(null) // {risks:[...], x, y, label}

  function getRisksAt(lik, imp, type) {
    return risks.filter(r => {
      if (r.lik !== lik || r.imp !== imp) return false
      if (type === 'inherent') return true
      return true // residual: lik/imp might differ after ctrl, so group by inherent coords for visual clarity
    })
  }

  function getResidualAt(resScore) {
    // find risks whose residual score equals the given cell's score
    return risks.filter(r => residual(r) === resScore)
  }

  // Build cell data for inherent (lik × imp) and residual (grouped by residual score)
  function inherentCell(lik, imp) {
    const score = lik * imp
    const rs = risks.filter(r => r.lik === lik && r.imp === imp)
    return { score, rs }
  }
  function residualCell(lik, imp) {
    // For residual heatmap, we use inherent coords but show residual score in the cell
    // The color is driven by residual score range
    const rs = risks.filter(r => r.lik === lik && r.imp === imp)
    if (rs.length === 0) return { score: lik * imp, rs: [] }
    const avgRes = Math.round(rs.reduce((s, r) => s + residual(r), 0) / rs.length)
    return { score: avgRes, rs }
  }

  const likelihoods = [5, 4, 3, 2, 1]
  const impacts     = [1, 2, 3, 4, 5]

  function Cell({ cellData, type, lik, imp }) {
    const { score, rs } = cellData
    const bg = CELL_COLOR(score)
    const tc = CELL_TEXT(score)
    return (
      <td
        className="relative border border-white cursor-pointer transition-all"
        style={{ background: bg, width: 68, height: 52 }}
        onMouseEnter={e => {
          if (rs.length > 0) {
            const rect = e.currentTarget.getBoundingClientRect()
            setTooltip({ rs, x: rect.left + rect.width / 2, y: rect.top, type, lik, imp })
          }
        }}
        onMouseLeave={() => setTooltip(null)}
      >
        <div className="flex flex-col items-center justify-center h-full gap-0.5">
          {rs.length > 0 && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: tc }}>
              {rs.length}
            </div>
          )}
          <div className="text-[9px] font-semibold" style={{ color: tc }}>{score}</div>
        </div>
      </td>
    )
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[10px]">
        {[['Very High', '#fecaca', '#991b1b'], ['High', '#fed7aa', '#9a3412'], ['Moderate', '#fef08a', '#854d0e'], ['Low', '#bfdbfe', '#1e40af'], ['Very Low', '#bbf7d0', '#166534']].map(([l, bg, tc]) => (
          <div key={l} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm border border-gray-200" style={{ background: bg }} />
            <span style={{ color: tc }} className="font-semibold">{l}</span>
          </div>
        ))}
        <span className="text-gray-400 ml-2">· Circle = # risks · Number = score</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[['Inherent Risk', 'inherent', inherentCell], ['Residual Risk (after controls)', 'residual', residualCell]].map(([title, type, cellFn]) => (
          <div key={type}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
            <div className="flex gap-3">
              {/* Y axis label */}
              <div className="flex flex-col items-center justify-center w-5">
                <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Likelihood →</span>
              </div>
              <div>
                <table className="border-collapse">
                  <tbody>
                    {likelihoods.map(lik => (
                      <tr key={lik}>
                        <td className="pr-2 text-[10px] font-semibold text-gray-500 text-right w-4">{lik}</td>
                        {impacts.map(imp => (
                          <Cell key={imp} cellData={cellFn(lik, imp)} type={type} lik={lik} imp={imp} />
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <td />
                      {impacts.map(imp => (
                        <td key={imp} className="pt-1 text-center text-[10px] font-semibold text-gray-500">{imp}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
                <div className="text-center text-[9px] text-gray-400 font-semibold uppercase tracking-widest mt-1">Impact →</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && tooltip.rs.length > 0 && (
        <div
          className="fixed z-50 bg-white border border-gray-200 shadow-xl rounded-lg p-3 text-xs max-w-xs pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y - 8, transform: 'translate(-50%, -100%)' }}
        >
          <div className="font-semibold text-gray-700 mb-1.5 text-[10px] uppercase tracking-wide">
            {tooltip.type === 'inherent' ? `Inherent L${tooltip.lik}×I${tooltip.imp} = ${tooltip.lik * tooltip.imp}` : `Residual (L${tooltip.lik}×I${tooltip.imp})`}
          </div>
          <ul className="space-y-1">
            {tooltip.rs.slice(0, 5).map(r => (
              <li key={r.id} className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                <span className="text-gray-700 leading-snug">{r.name.slice(0, 50)}{r.name.length > 50 ? '…' : ''}</span>
              </li>
            ))}
            {tooltip.rs.length > 5 && <li className="text-gray-400">+{tooltip.rs.length - 5} more</li>}
          </ul>
        </div>
      )}

      {/* Summary table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Control Effectiveness Summary</span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Risk', 'Vendor', 'Inherent', 'Control', 'Residual', 'Reduction'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...risks].sort((a, b) => (inherent(b) - residual(b)) - (inherent(a) - residual(a))).slice(0, 10).map(r => {
              const inh = inherent(r)
              const res = residual(r)
              const reduction = Math.round(((inh - res) / inh) * 100)
              return (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate">{r.name}</td>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.vendor}</td>
                  <td className="px-3 py-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: CELL_COLOR(inh), color: CELL_TEXT(inh) }}>{inh}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-500">{['None','Low','Moderate','Strong','Very Strong'][r.ctrl] || r.ctrl}</td>
                  <td className="px-3 py-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: CELL_COLOR(res), color: CELL_TEXT(res) }}>{res}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[60px]">
                        <div className="h-full bg-green-400 rounded-full" style={{ width: `${reduction}%` }} />
                      </div>
                      <span className="text-[10px] text-green-600 font-semibold">{reduction}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-4 py-2 text-[10px] text-gray-400 border-t border-gray-100">Showing top 10 risks by control reduction. Residual = Inherent × (1 − control effectiveness).</div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Risks() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [risks, setRisks]               = useLocalStorage('tprm:risks', INIT_RISKS)
  const [search, setSearch]             = useState('')
  const [filterLevel, setFilterLevel]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCat, setFilterCat]       = useState('')
  const [filterTreat, setFilterTreat]   = useState('')
  const [filterEsc, setFilterEsc]       = useState(false)
  const [filterVendor, setFilterVendor] = useState('')
  const [expandedId, setExpandedId]     = useState(null)

  useEffect(() => {
    if (!state) return
    if (state.filterLevel)  setFilterLevel(state.filterLevel)
    if (state.filterStatus) setFilterStatus(state.filterStatus)
    if (state.filterCat)    setFilterCat(state.filterCat)
    if (state.filterTreat)  setFilterTreat(state.filterTreat)
    if (state.filterEsc)    setFilterEsc(true)
    if (state.filterVendor) setFilterVendor(state.filterVendor)
    if (state.openRiskId)   setExpandedId(state.openRiskId)
  }, [state])
  const [modalOpen, setModalOpen]       = useState(false)
  const [editRisk, setEditRisk]         = useState(null)
  const [form, setForm]                 = useState(BLANK_RISK)

  const filtered = risks.filter(r => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !vname(r.vendor).toLowerCase().includes(search.toLowerCase())) return false
    if (filterLevel  && level(residual(r)) !== filterLevel) return false
    if (filterStatus && r.st !== filterStatus) return false
    if (filterCat    && r.cat !== filterCat) return false
    if (filterTreat  && r.treat !== filterTreat) return false
    if (filterEsc    && !needsEscalation(r)) return false
    if (filterVendor && vname(r.vendor) !== filterVendor) return false
    return true
  })

  const activeCount = risks.filter(r => r.st === 'Open' || r.st === 'In Progress').length
  const [view, setView] = useState('list') // 'list' | 'heatmap'

  function openAdd() {
    setEditRisk(null)
    setForm({ ...BLANK_RISK, id: 'r' + Date.now() })
    setModalOpen(true)
  }

  function openEdit(r, e) {
    e.stopPropagation()
    setEditRisk(r)
    setForm({ ...r })
    setModalOpen(true)
  }

  function saveForm() {
    const parsed = { ...form, lik: +form.lik, imp: +form.imp, ctrl: +form.ctrl }
    if (editRisk) {
      setRisks(prev => prev.map(r => r.id === parsed.id ? parsed : r))
    } else {
      setRisks(prev => [...prev, parsed])
    }
    setModalOpen(false)
  }

  const hasFilters = search || filterLevel || filterStatus || filterCat || filterTreat || filterEsc

  // live score preview in modal
  const previewRes = residual({ lik: +form.lik || 1, imp: +form.imp || 1, ctrl: +form.ctrl || 0 })

  return (
    <div className="space-y-4">

      {/* From-dashboard filter banner */}
      {state && hasFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs">
          <span className="text-blue-700">
            <strong>Filtered from Dashboard</strong>
            {filterLevel  && <> · Level: <strong>{filterLevel}</strong></>}
            {filterStatus && <> · Status: <strong>{filterStatus}</strong></>}
            {filterCat    && <> · Category: <strong>{filterCat}</strong></>}
            {filterTreat  && <> · Treatment: <strong>{filterTreat}</strong></>}
            {filterEsc    && <> · <strong>Escalated only</strong></>}
          </span>
          <button onClick={() => { setFilterLevel(''); setFilterStatus(''); setFilterCat(''); setFilterTreat(''); setFilterEsc(false) }} className="text-blue-500 hover:text-blue-700 font-semibold">Clear filter</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Risk Register</h1>
          <p className="text-xs text-gray-400 mt-0.5">{risks.length} risks · {activeCount} active</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            <button onClick={() => setView('list')} className={cn('flex items-center gap-1.5 px-3 py-2 transition-colors', view === 'list' ? 'bg-blue-50 text-[#0176d3] font-semibold' : 'text-gray-500 hover:bg-gray-50')}>
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button onClick={() => setView('heatmap')} className={cn('flex items-center gap-1.5 px-3 py-2 border-l border-gray-200 transition-colors', view === 'heatmap' ? 'bg-blue-50 text-[#0176d3] font-semibold' : 'text-gray-500 hover:bg-gray-50')}>
              <Grid3x3 className="w-3.5 h-3.5" /> Heatmap
            </button>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Risk
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search risks or vendors…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-600">
          <option value="">All Levels</option>
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-600">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-600">
          <option value="">All Categories</option>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterTreat} onChange={e => setFilterTreat(e.target.value)} className="text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-600">
          <option value="">All Treatments</option>
          {['Mitigate','Transfer','Accept','Avoid'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          onClick={() => setFilterEsc(prev => !prev)}
          className={cn(
            'flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border transition-colors',
            filterEsc
              ? 'bg-red-50 border-red-300 text-red-700 font-semibold'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          )}
        >
          <AlertTriangle className="w-3 h-3" /> Escalation
        </button>
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilterLevel(''); setFilterStatus(''); setFilterCat(''); setFilterTreat(''); setFilterEsc(false) }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Heatmap view */}
      {view === 'heatmap' && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <RiskHeatmap risks={filtered} />
        </div>
      )}

      {/* Table */}
      {view === 'list' && (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[960px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Risk','Vendor','Category','L','I','Inherent','Residual','Treatment','Status','Owner','Due',''].map((h, idx) => (
                  <th key={idx} className={cn(
                    'px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap',
                    (h === 'L' || h === 'I') && 'text-center w-8'
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-gray-400 text-xs">
                    No risks match the current filters.
                  </td>
                </tr>
              )}
              {filtered.map((r, i) => {
                const inh  = inherent(r)
                const res  = residual(r)
                const rl   = level(res)
                const esc  = needsEscalation(r)
                const open = expandedId === r.id
                return (
                  <Fragment key={r.id}>
                    <tr
                      onClick={() => setExpandedId(prev => prev === r.id ? null : r.id)}
                      className={cn(
                        'border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors',
                        i % 2 === 1 && !open ? 'bg-gray-50/50' : '',
                        open ? 'bg-blue-50/40' : ''
                      )}
                    >
                      <td className="px-3 py-2.5 max-w-[220px]">
                        <div className="flex items-start gap-1.5">
                          {esc && <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Escalation required" />}
                          <span className="font-medium text-gray-800 leading-snug line-clamp-2">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <button
                          onClick={e => { e.stopPropagation(); navigate('/vendors', { state: { openVendorName: vname(r.vendor) } }) }}
                          className="text-blue-600 font-medium cursor-pointer hover:underline text-left"
                          title="Go to vendor"
                        >{vname(r.vendor)}</button>
                        <div className="text-[10px] text-gray-400">{vtier(r.vendor)}</div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <button
                          onClick={e => { e.stopPropagation(); setFilterCat(r.cat) }}
                          className="text-gray-600 cursor-pointer hover:underline text-left"
                          title="Filter by category"
                        >{r.cat}</button>
                      </td>
                      <td className="px-3 py-2.5 text-center font-semibold text-gray-700">{r.lik}</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-gray-700">{r.imp}</td>
                      <td className="px-3 py-2.5"><ScoreBar value={inh} color="#f97316" /></td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <ScoreBar value={res} color={LEVEL_COLOR[rl]} />
                          <button
                            onClick={e => { e.stopPropagation(); setFilterLevel(level(res)) }}
                            className="cursor-pointer text-left"
                            title="Filter by level"
                          >
                            <LevelBadge score={res} />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={e => { e.stopPropagation(); setFilterTreat(r.treat) }}
                          className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded cursor-pointer', TREAT_BADGE_CLS[r.treat] || 'bg-gray-100 text-gray-600')}
                          title="Filter by treatment"
                        >{r.treat}</button>
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={e => { e.stopPropagation(); setFilterStatus(r.st) }}
                          className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded cursor-pointer', STATUS_BADGE_CLS[r.st] || 'bg-gray-100 text-gray-600')}
                          title="Filter by status"
                        >{r.st}</button>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{r.owner}</td>
                      <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{r.due}</td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={e => openEdit(r, e)}
                          className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>

                    {open && (
                      <tr className="bg-blue-50/30 border-b border-blue-100">
                        <td colSpan={12} className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Description</p>
                              <p className="text-gray-700 leading-relaxed">{r.desc || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Treatment Plan</p>
                              <p className="text-gray-700 leading-relaxed">{r.plan || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Evidence</p>
                              <p className="text-gray-600">{r.ev || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Due Date</p>
                              <p className="text-gray-700 font-medium">{r.due || '—'}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              onClick={e => { e.stopPropagation(); navigate('/issues', { state: { spawnFromRisk: r } }) }}
                              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                              <GitBranch className="w-3 h-3" /> Raise Issue from this Risk
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); navigate('/issues', { state: { filterRiskId: r.id } }) }}
                              className="text-[11px] px-3 py-1.5 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              View Linked Issues
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-gray-100 text-[11px] text-gray-400">
          Showing {filtered.length} of {risks.length} risks
        </div>
      </div>
      )}

      {/* Add / Edit modal — right-side sliding panel */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setModalOpen(false)} />
          <div className="w-[460px] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-sm font-semibold text-gray-800">{editRisk ? 'Edit Risk' : 'Add Risk'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              <FormField label="Risk Name">
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Describe the risk…"
                  className={inputCls}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Vendor">
                  <select value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} className={inputCls}>
                    {VENDORS_INIT.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Category">
                  <select value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))} className={inputCls}>
                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <FormField label="Likelihood (1–5)">
                  <input type="number" min={1} max={5} value={form.lik} onChange={e => setForm(f => ({ ...f, lik: e.target.value }))} className={inputCls} />
                </FormField>
                <FormField label="Impact (1–5)">
                  <input type="number" min={1} max={5} value={form.imp} onChange={e => setForm(f => ({ ...f, imp: e.target.value }))} className={inputCls} />
                </FormField>
                <FormField label="Control (0–4)">
                  <input type="number" min={0} max={4} value={form.ctrl} onChange={e => setForm(f => ({ ...f, ctrl: e.target.value }))} className={inputCls} />
                </FormField>
              </div>

              {/* Live score preview */}
              <div className="bg-gray-50 rounded-md px-3 py-2 flex items-center gap-3 text-xs">
                <span className="text-gray-400">Inherent: <strong className="text-orange-500">{(+form.lik||1) * (+form.imp||1)}</strong></span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-400">Residual: <strong style={{ color: LEVEL_COLOR[level(previewRes)] }}>{previewRes}</strong></span>
                <span className="text-gray-300">|</span>
                <LevelBadge score={previewRes} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Treatment">
                  <select value={form.treat} onChange={e => setForm(f => ({ ...f, treat: e.target.value }))} className={inputCls}>
                    {['Avoid','Mitigate','Transfer','Accept'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>
                <FormField label="Status">
                  <select value={form.st} onChange={e => setForm(f => ({ ...f, st: e.target.value }))} className={inputCls}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Owner">
                  <input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} placeholder="e.g. S. Kim" className={inputCls} />
                </FormField>
                <FormField label="Due Date">
                  <input type="date" value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))} className={inputCls} />
                </FormField>
              </div>

              <FormField label="Description">
                <textarea rows={3} value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="Risk description…" className={cn(inputCls, 'resize-none')} />
              </FormField>

              <FormField label="Treatment Plan">
                <textarea rows={3} value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} placeholder="Remediation steps…" className={cn(inputCls, 'resize-none')} />
              </FormField>

              <FormField label="Evidence">
                <input value={form.ev} onChange={e => setForm(f => ({ ...f, ev: e.target.value }))} placeholder="Ticket, document ref…" className={inputCls} />
              </FormField>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2 shrink-0">
              <button onClick={() => setModalOpen(false)} className="text-xs px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={saveForm}
                disabled={!form.name.trim()}
                className="flex items-center gap-1.5 text-xs px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Check className="w-3 h-3" />
                {editRisk ? 'Save Changes' : 'Add Risk'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
