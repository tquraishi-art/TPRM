import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown,
  BarChart2, Users, Award, AlertTriangle, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Data ─────────────────────────────────────────────────────────────────────

const SBR_DATA = [
  {id:'sbr1', name:'Meridian Property Group',      pf:'Services',  fam:'RE', fy:2027, qt:'Q3', perf:4.2, sust:3.8, resp:4.5, vos:4.0, risk:'Low',       diverse:'Not Diverse', lead:'Jordan Lee',  date:'9/10/2026'},
  {id:'sbr2', name:'Atlas Real Estate Partners',   pf:'Services',  fam:'RE', fy:2027, qt:'Q2', perf:3.5, sust:3.2, resp:3.8, vos:3.5, risk:'Moderate',   diverse:'Diverse',     lead:'Jordan Lee',  date:'6/15/2026'},
  {id:'sbr3', name:'NetCore Systems',              pf:'Technology',fam:'IT', fy:2027, qt:'Q3', perf:2.8, sust:2.5, resp:3.0, vos:2.9, risk:'High',        diverse:'Not Diverse', lead:'Sam Holloway',date:'9/5/2026'},
  {id:'sbr4', name:'DataVault Technologies',       pf:'Technology',fam:'IT', fy:2027, qt:'Q3', perf:4.5, sust:4.2, resp:4.8, vos:4.3, risk:'Low',         diverse:'Not Diverse', lead:'Sam Holloway',date:'9/12/2026'},
  {id:'sbr5', name:'Apex Consulting Group',        pf:'Services',  fam:'CS', fy:2027, qt:'Q2', perf:3.9, sust:4.1, resp:3.7, vos:4.0, risk:'Low',         diverse:'Diverse',     lead:'Dana Chen',   date:'6/20/2026'},
  {id:'sbr6', name:'Pinnacle Workplace Solutions', pf:'Services',  fam:'FM', fy:2027, qt:'Q3', perf:3.1, sust:3.4, resp:2.9, vos:3.2, risk:'Moderate',    diverse:'Not Diverse', lead:'Alex Rivera',  date:'9/8/2026'},
  {id:'sbr7', name:'GlobalPay Financial',          pf:'Financial', fam:'FS', fy:2026, qt:'Q4', perf:2.2, sust:2.8, resp:2.5, vos:2.4, risk:'Very High',   diverse:'Not Diverse', lead:'Morgan Blake', date:'12/10/2025'},
  {id:'sbr8', name:'CloudComm Networks',           pf:'Technology',fam:'IT', fy:2027, qt:'Q1', perf:3.7, sust:3.5, resp:3.9, vos:3.6, risk:'Moderate',    diverse:'Not Diverse', lead:'Sam Holloway',date:'3/15/2026'},
  {id:'sbr9', name:'EventPro Management',          pf:'Services',  fam:'EV', fy:2026, qt:'Q4', perf:4.1, sust:3.9, resp:4.3, vos:4.0, risk:'Low',         diverse:'Diverse',     lead:'Alex Rivera',  date:'12/5/2025'},
  {id:'sbr10',name:'Indigo Tech Solutions',        pf:'Technology',fam:'IT', fy:2026, qt:'Q3', perf:3.3, sust:3.0, resp:3.5, vos:3.2, risk:'High',        diverse:'Not Diverse', lead:'Dana Chen',    date:'9/1/2025'},
  {id:'sbr11',name:'Meridian Property Group',      pf:'Services',  fam:'RE', fy:2026, qt:'Q4', perf:4.0, sust:3.6, resp:4.2, vos:3.9, risk:'Low',         diverse:'Not Diverse', lead:'Jordan Lee',   date:'12/14/2025'},
  {id:'sbr12',name:'NetCore Systems',              pf:'Technology',fam:'IT', fy:2026, qt:'Q4', perf:2.5, sust:2.3, resp:2.7, vos:2.6, risk:'High',        diverse:'Not Diverse', lead:'Sam Holloway', date:'12/8/2025'},
  {id:'sbr13',name:'DataVault Technologies',       pf:'Technology',fam:'IT', fy:2026, qt:'Q2', perf:4.3, sust:4.0, resp:4.6, vos:4.1, risk:'Low',         diverse:'Not Diverse', lead:'Sam Holloway', date:'6/10/2025'},
  {id:'sbr14',name:'Apex Consulting Group',        pf:'Services',  fam:'CS', fy:2026, qt:'Q3', perf:3.7, sust:3.9, resp:3.5, vos:3.8, risk:'Low',         diverse:'Diverse',     lead:'Dana Chen',    date:'9/15/2025'},
  {id:'sbr15',name:'Pinnacle Workplace Solutions', pf:'Services',  fam:'FM', fy:2026, qt:'Q2', perf:2.9, sust:3.1, resp:2.7, vos:3.0, risk:'Moderate',    diverse:'Not Diverse', lead:'Alex Rivera',  date:'6/5/2025'},
  {id:'sbr16',name:'CyberShield Inc',              pf:'Technology',fam:'IT', fy:2027, qt:'Q3', perf:4.0, sust:3.7, resp:4.2, vos:3.9, risk:'Low',         diverse:'Diverse',     lead:'Sam Holloway', date:'9/20/2026'},
  {id:'sbr17',name:'Waveline Communications',      pf:'Technology',fam:'TC', fy:2027, qt:'Q2', perf:3.2, sust:2.9, resp:3.4, vos:3.1, risk:'Moderate',    diverse:'Not Diverse', lead:'Sam Holloway', date:'6/25/2026'},
  {id:'sbr18',name:'Atlas Real Estate Partners',   pf:'Services',  fam:'RE', fy:2026, qt:'Q4', perf:3.3, sust:3.0, resp:3.6, vos:3.3, risk:'Moderate',    diverse:'Diverse',     lead:'Jordan Lee',   date:'12/1/2025'},
  {id:'sbr19',name:'GlobalPay Financial',          pf:'Financial', fam:'FS', fy:2026, qt:'Q3', perf:2.0, sust:2.4, resp:2.2, vos:2.1, risk:'Very High',   diverse:'Not Diverse', lead:'Morgan Blake', date:'9/10/2025'},
  {id:'sbr20',name:'Apex Consulting Group',        pf:'Services',  fam:'CS', fy:2025, qt:'Q4', perf:3.5, sust:3.7, resp:3.3, vos:3.6, risk:'Low',         diverse:'Diverse',     lead:'Dana Chen',    date:'12/20/2024'},
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avg(...vals) {
  const nums = vals.filter(v => v != null && !isNaN(v))
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function overall(r) {
  return avg(r.perf, r.sust, r.resp, r.vos)
}

function scoreFmt(n) {
  if (n == null) return '—'
  return n.toFixed(1)
}

function scoreBarColor(n) {
  if (n == null) return 'bg-gray-200'
  if (n >= 4) return 'bg-green-500'
  if (n >= 3) return 'bg-blue-500'
  if (n >= 2) return 'bg-orange-400'
  return 'bg-red-500'
}

function scoreTextColor(n) {
  if (n == null) return 'text-gray-400'
  if (n >= 4) return 'text-green-600'
  if (n >= 3) return 'text-blue-600'
  if (n >= 2) return 'text-orange-500'
  return 'text-red-600'
}

const RISK_BADGE = {
  'Very High': 'bg-red-100 text-red-700 border-red-200',
  'High':      'bg-orange-100 text-orange-700 border-orange-200',
  'Moderate':  'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Low':       'bg-green-100 text-green-700 border-green-200',
  'Very Low':  'bg-green-50 text-green-600 border-green-100',
}

const ALL_PORTFOLIOS = [...new Set(SBR_DATA.map(r => r.pf))].sort()
const ALL_RISKS      = ['Very High', 'High', 'Moderate', 'Low', 'Very Low']
const ALL_FY         = [...new Set(SBR_DATA.map(r => r.fy))].sort((a,b) => b - a)
const ALL_QT         = ['Q1','Q2','Q3','Q4']
const ALL_DIVERSE    = ['Diverse', 'Not Diverse']

// ─── Inline Score Cell ────────────────────────────────────────────────────────

function ScoreCell({ value }) {
  if (value == null) return <span className="text-gray-400 text-xs">—</span>
  const pct = Math.min(100, (value / 5) * 100)
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className={cn('text-xs font-semibold tabular-nums w-6 flex-shrink-0', scoreTextColor(value))}>
        {value.toFixed(1)}
      </span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', scoreBarColor(value))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Expand Detail Panel ──────────────────────────────────────────────────────

function DetailPanel({ row, navigate, onSetPortfolio }) {
  const ov = overall(row)
  const dims = [
    { label: 'Performance',       value: row.perf },
    { label: 'Sustainability',    value: row.sust },
    { label: 'Responsibility',    value: row.resp },
    { label: 'Voice of Supplier', value: row.vos  },
  ]
  return (
    <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Score dimensions */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Score Dimensions</p>
          <div className="space-y-3">
            {dims.map(d => (
              <div key={d.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 font-medium">{d.label}</span>
                  <span className={cn('font-semibold', scoreTextColor(d.value))}>
                    {d.value != null ? d.value.toFixed(1) : '—'} / 5.0
                  </span>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  {d.value != null && (
                    <div
                      className={cn('h-full rounded-full transition-all', scoreBarColor(d.value))}
                      style={{ width: `${Math.min(100, (d.value / 5) * 100)}%` }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          {ov != null && (
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Overall</span>
              <span className={cn('text-lg font-bold', scoreTextColor(ov))}>{ov.toFixed(2)}</span>
            </div>
          )}
        </div>
        {/* Meta */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Review Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Risk Level</p>
              <button
                onClick={() => navigate('/risks', { state: { filterLevel: row.risk } })}
                className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border hover:opacity-80 cursor-pointer', RISK_BADGE[row.risk] || 'bg-gray-100 text-gray-600')}
              >
                {row.risk}
              </button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Diverse Supplier</p>
              <span className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full border',
                row.diverse === 'Diverse'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-gray-100 text-gray-500 border-gray-200'
              )}>
                {row.diverse}
              </span>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Review Lead</p>
              <p className="text-xs font-semibold text-gray-800">{row.lead}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Review Date</p>
              <p className="text-xs font-semibold text-gray-800">{row.date}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Portfolio</p>
              <button
                onClick={() => onSetPortfolio(row.pf)}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer text-left"
              >
                {row.pf}
              </button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Period</p>
              <p className="text-xs font-semibold text-gray-800">FY{row.fy} {row.qt}</p>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => navigate('/vendors', { state: { openVendorName: row.name } })}
              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View vendor profile
            </button>
            <button
              onClick={() => navigate('/risks', { state: { search: row.name } })}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
            >
              View risks
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sort Icon ─────────────────────────────────────────────────────────────────

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300 ml-0.5 flex-shrink-0" />
  return sortDir === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-blue-500 ml-0.5 flex-shrink-0" />
    : <ChevronDown className="w-3.5 h-3.5 text-blue-500 ml-0.5 flex-shrink-0" />
}

// ─── KPI Tile ─────────────────────────────────────────────────────────────────

function KpiTile({ label, value, sub, icon: Icon, active, onClick, colorClass }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 min-w-0 bg-white border rounded-xl p-4 text-left transition-all hover:shadow-md',
        active
          ? 'border-blue-500 ring-2 ring-blue-200 shadow-md'
          : 'border-gray-200 hover:border-gray-300'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
          <p className={cn('text-2xl font-bold mt-0.5', colorClass)}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {Icon && (
          <div className={cn('p-2 rounded-lg flex-shrink-0', active ? 'bg-blue-50' : 'bg-gray-50')}>
            <Icon className={cn('w-4 h-4', active ? 'text-blue-500' : 'text-gray-400')} />
          </div>
        )}
      </div>
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const SCORE_BAND = { all: null, high: 'high', meets: 'meets', below: 'below' }

export default function SBR() {
  const navigate = useNavigate()

  const [search, setSearch]     = useState('')
  const [fyFilter, setFyFilter] = useState('All')
  const [qtFilter, setQtFilter] = useState('All')
  const [pfFilter, setPfFilter] = useState('All')
  const [rkFilter, setRkFilter] = useState('All')
  const [dvFilter, setDvFilter] = useState('All')
  const [bandFilter, setBandFilter] = useState(SCORE_BAND.all)
  const [sortCol, setSortCol]   = useState('date')
  const [sortDir, setSortDir]   = useState('desc')
  const [expanded, setExpanded] = useState(null)

  // Enrich data with overall score
  const enriched = useMemo(() =>
    SBR_DATA.map(r => ({ ...r, overall: overall(r) }))
  , [])

  // KPI stats
  const avgScore = useMemo(() => {
    const vals = enriched.map(r => r.overall).filter(v => v != null)
    if (!vals.length) return null
    return vals.reduce((a,b) => a+b, 0) / vals.length
  }, [enriched])
  const highCount  = useMemo(() => enriched.filter(r => r.overall != null && r.overall >= 4.0).length, [enriched])
  const meetsCount = useMemo(() => enriched.filter(r => r.overall != null && r.overall >= 3.0 && r.overall < 4.0).length, [enriched])
  const belowCount = useMemo(() => enriched.filter(r => r.overall != null && r.overall < 3.0).length, [enriched])

  // Filters
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return enriched.filter(r => {
      if (q && !r.name.toLowerCase().includes(q)) return false
      if (fyFilter !== 'All' && r.fy !== Number(fyFilter)) return false
      if (qtFilter !== 'All' && r.qt !== qtFilter) return false
      if (pfFilter !== 'All' && r.pf !== pfFilter) return false
      if (rkFilter !== 'All' && r.risk !== rkFilter) return false
      if (dvFilter !== 'All' && r.diverse !== dvFilter) return false
      if (bandFilter === 'high'  && !(r.overall != null && r.overall >= 4.0)) return false
      if (bandFilter === 'meets' && !(r.overall != null && r.overall >= 3.0 && r.overall < 4.0)) return false
      if (bandFilter === 'below' && !(r.overall != null && r.overall < 3.0)) return false
      return true
    })
  }, [enriched, search, fyFilter, qtFilter, pfFilter, rkFilter, dvFilter, bandFilter])

  // Sort
  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol]
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'string') return av.localeCompare(bv) * dir
      return (av - bv) * dir
    })
  }, [filtered, sortCol, sortDir])

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  function handleBand(band) {
    setBandFilter(prev => prev === band ? null : band)
  }

  function toggleExpand(id) {
    setExpanded(prev => prev === id ? null : id)
  }

  const cols = [
    { key: 'name',    label: 'Vendor',          width: 'min-w-[160px]' },
    { key: 'pf',      label: 'Portfolio',        width: 'min-w-[100px]' },
    { key: 'fy',      label: 'FY',               width: 'w-14' },
    { key: 'qt',      label: 'Qtr',              width: 'w-14' },
    { key: 'perf',    label: 'Performance',      width: 'min-w-[120px]' },
    { key: 'sust',    label: 'Sustainability',   width: 'min-w-[120px]' },
    { key: 'resp',    label: 'Responsibility',   width: 'min-w-[120px]' },
    { key: 'vos',     label: 'Voice of Supplier',width: 'min-w-[130px]' },
    { key: 'overall', label: 'Overall',          width: 'min-w-[100px]' },
    { key: 'risk',    label: 'Risk',             width: 'min-w-[100px]' },
    { key: 'diverse', label: 'Diverse',          width: 'min-w-[100px]' },
    { key: 'lead',    label: 'Lead',             width: 'min-w-[120px]' },
    { key: 'date',    label: 'Date',             width: 'min-w-[100px]' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Supplier Scorecard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            Supplier Business Review Scores
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Performance, sustainability, responsibility and voice-of-supplier metrics across review periods.
          </p>
        </div>

        {/* KPI Tiles */}
        <div className="flex flex-wrap gap-3 mb-6">
          <KpiTile
            label="Avg Overall Score"
            value={avgScore != null ? avgScore.toFixed(2) : '—'}
            sub="All records"
            icon={BarChart2}
            active={bandFilter === null}
            onClick={() => setBandFilter(null)}
            colorClass={scoreTextColor(avgScore)}
          />
          <KpiTile
            label="Exceeds Expectations"
            value={highCount}
            sub="Score ≥ 4.0"
            icon={Award}
            active={bandFilter === 'high'}
            onClick={() => handleBand('high')}
            colorClass="text-green-600"
          />
          <KpiTile
            label="Meets Expectations"
            value={meetsCount}
            sub="Score 3.0 – 3.99"
            icon={Users}
            active={bandFilter === 'meets'}
            onClick={() => handleBand('meets')}
            colorClass="text-blue-600"
          />
          <KpiTile
            label="Below Expectations"
            value={belowCount}
            sub="Score < 3.0"
            icon={AlertTriangle}
            active={bandFilter === 'below'}
            onClick={() => handleBand('below')}
            colorClass="text-red-600"
          />
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendor..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
            </div>
            {/* FY */}
            <select
              value={fyFilter}
              onChange={e => setFyFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All FY</option>
              {ALL_FY.map(y => <option key={y} value={y}>FY{y}</option>)}
            </select>
            {/* Quarter */}
            <select
              value={qtFilter}
              onChange={e => setQtFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Quarters</option>
              {ALL_QT.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
            {/* Portfolio */}
            <select
              value={pfFilter}
              onChange={e => setPfFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Portfolios</option>
              {ALL_PORTFOLIOS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {/* Risk */}
            <select
              value={rkFilter}
              onChange={e => setRkFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Risk Levels</option>
              {ALL_RISKS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {/* Diverse */}
            <select
              value={dvFilter}
              onChange={e => setDvFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Suppliers</option>
              {ALL_DIVERSE.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {/* Result count */}
          <div className="mt-2 text-xs text-gray-400">
            Showing <span className="font-semibold text-gray-600">{sorted.length}</span> of {enriched.length} records
            {bandFilter && (
              <button
                onClick={() => setBandFilter(null)}
                className="ml-2 text-blue-500 hover:underline"
              >
                Clear band filter
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {/* Expand toggle col */}
                  <th className="w-8 px-3 py-3" />
                  {cols.map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={cn(
                        'px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap hover:text-gray-800 transition-colors',
                        col.width
                      )}
                    >
                      <div className="flex items-center gap-0.5">
                        {col.label}
                        <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={cols.length + 1} className="text-center py-12 text-gray-400">
                      No records match your filters.
                    </td>
                  </tr>
                ) : sorted.map((row, idx) => {
                  const isOpen = expanded === row.id
                  const ov = row.overall
                  return (
                    <>
                      <tr
                        key={row.id}
                        onClick={() => toggleExpand(row.id)}
                        className={cn(
                          'border-b border-gray-50 cursor-pointer transition-colors',
                          isOpen
                            ? 'bg-blue-50 border-blue-100'
                            : idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/40 hover:bg-gray-100/60'
                        )}
                      >
                        {/* Expand icon */}
                        <td className="px-3 py-3">
                          <ChevronRight className={cn(
                            'w-4 h-4 text-gray-400 transition-transform',
                            isOpen && 'rotate-90 text-blue-500'
                          )} />
                        </td>
                        {/* Vendor */}
                        <td className="px-3 py-3">
                          <button
                            onClick={e => { e.stopPropagation(); navigate('/vendors', { state: { openVendorName: row.name } }) }}
                            className="font-medium text-blue-600 hover:underline whitespace-nowrap text-left text-sm"
                          >
                            {row.name}
                          </button>
                        </td>
                        {/* Portfolio */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <button
                            onClick={e => { e.stopPropagation(); setPfFilter(prev => prev === row.pf ? 'All' : row.pf) }}
                            className="text-gray-600 hover:text-blue-600 hover:underline text-sm text-left"
                          >
                            {row.pf}
                          </button>
                        </td>
                        {/* FY */}
                        <td className="px-3 py-3 text-gray-600">{row.fy}</td>
                        {/* Quarter */}
                        <td className="px-3 py-3 text-gray-600">{row.qt}</td>
                        {/* Score columns */}
                        <td className="px-3 py-3"><ScoreCell value={row.perf} /></td>
                        <td className="px-3 py-3"><ScoreCell value={row.sust} /></td>
                        <td className="px-3 py-3"><ScoreCell value={row.resp} /></td>
                        <td className="px-3 py-3"><ScoreCell value={row.vos} /></td>
                        {/* Overall */}
                        <td className="px-3 py-3">
                          {ov != null ? (
                            <span className={cn('font-bold text-sm', scoreTextColor(ov))}>
                              {ov.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        {/* Risk badge */}
                        <td className="px-3 py-3">
                          <button
                            onClick={e => { e.stopPropagation(); navigate('/risks', { state: { filterLevel: row.risk } }) }}
                            className={cn(
                              'text-xs font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap hover:opacity-80 cursor-pointer',
                              RISK_BADGE[row.risk] || 'bg-gray-100 text-gray-600 border-gray-200'
                            )}
                          >
                            {row.risk}
                          </button>
                        </td>
                        {/* Diverse */}
                        <td className="px-3 py-3">
                          <span className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap',
                            row.diverse === 'Diverse'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          )}>
                            {row.diverse === 'Diverse' ? 'Diverse' : 'Non-Diverse'}
                          </span>
                        </td>
                        {/* Lead */}
                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{row.lead}</td>
                        {/* Date */}
                        <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{row.date}</td>
                      </tr>
                      {/* Expanded detail row */}
                      {isOpen && (
                        <tr key={row.id + '-detail'} className="bg-blue-50/30">
                          <td colSpan={cols.length + 1} className="p-0">
                            <DetailPanel
                              row={row}
                              navigate={navigate}
                              onSetPortfolio={pf => setPfFilter(prev => prev === pf ? 'All' : pf)}
                            />
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
      </div>
    </div>
  )
}
