import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, LabelList,
} from 'recharts'
import {
  AlertTriangle, ChevronRight, Newspaper, ExternalLink, ArrowUpRight
} from 'lucide-react'
import { cn, RISK_COLORS, fmt } from '@/lib/utils'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { RISKS_SEED, VENDORS_INIT, CTRL_REDUCTION, residualScore, levelFromScore } from '@/lib/seedData'

const level = levelFromScore

function residualFromRaw(r) {
  return residualScore(r)
}

function inherentFromRaw(r) {
  if (r.inherent != null) return r.inherent
  return r.lik * r.imp
}

function statusFromRaw(r) {
  return r.status || r.st || 'Open'
}

const SCA_SUMMARY = { veryHigh:1, high:7, moderate:2, low:8, nonCompliant:'42/90' }

const NEWS_ITEMS = [
  { id:1, date:'2026-08-22', source:'Gartner Research',  tag:'Emerging Tech',      title:'AI-Driven Third-Party Risk: How GenAI is Reshaping TPRM Programs in 2026', summary:'Organizations are integrating AI into supplier due diligence workflows, reducing assessment cycle times by 40% while expanding continuous monitoring coverage.' },
  { id:2, date:'2026-08-18', source:'Regulatory Update', tag:'Regulatory',         title:'SEC Updates Cybersecurity Disclosure Requirements for Third-Party Incidents', summary:'New SEC guidance requires material third-party cyber events to be disclosed within 4 business days, expanding scope beyond direct breaches.' },
  { id:3, date:'2026-08-14', source:'Gartner Research',  tag:'Market Insight',     title:'TPRM Market Guide 2026: Consolidation and Platform Convergence Accelerate', summary:'Gartner identifies 12 leading TPRM platforms converging toward integrated GRC suites, with AI-assisted risk scoring now a baseline expectation.' },
  { id:4, date:'2026-08-08', source:'Industry Alert',    tag:'Concentration Risk', title:'Critical Infrastructure Sector Reports Rise in Supplier Concentration Risk', summary:'Four critical technology categories now have single-vendor concentration exceeding 60% across surveyed enterprise clients.' },
  { id:5, date:'2026-07-30', source:'Gartner Research',  tag:'Best Practice',      title:'Continuous Control Monitoring Replaces Point-in-Time Assessments for Tier-1 Suppliers', summary:'Leading TPRM programs have shifted to automated, continuous monitoring for their top 50 suppliers, flagging risk events within hours.' },
  { id:6, date:'2026-07-21', source:'Industry Alert',    tag:'Regulatory',         title:'EU DORA Enforcement Begins: Financial Sector Third-Party ICT Risk Scrutiny Intensifies', summary:'European regulators begin formal audits of DORA compliance for financial institutions\' critical ICT third-party providers.' },
]

const TAG_COLORS = {
  'Emerging Tech':      'bg-purple-50 text-purple-700 border-purple-200',
  'Regulatory':         'bg-red-50 text-red-700 border-red-200',
  'Market Insight':     'bg-blue-50 text-blue-700 border-blue-200',
  'Concentration Risk': 'bg-orange-50 text-orange-700 border-orange-200',
  'Best Practice':      'bg-green-50 text-green-700 border-green-200',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, desc, colorClass, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg px-5 py-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group w-full"
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</div>
      <div className={cn('text-3xl font-bold leading-none mb-1.5', colorClass)}>{value}</div>
      <div className="text-[11px] text-gray-400">{desc}</div>
    </button>
  )
}

function ChartCard({ title, children, action, onAction }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-gray-700">{title}</h3>
        {action && (
          <button onClick={onAction} className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5">
            {action} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function ScoreBar({ value, max = 25, color = '#4f8ef7' }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-semibold w-5 text-right" style={{ color }}>{value}</span>
    </div>
  )
}

function LevelBadge({ value }) {
  const l = level(value)
  const cls = {
    'Very High': 'bg-red-100 text-red-700',
    'High':      'bg-orange-100 text-orange-700',
    'Moderate':  'bg-yellow-100 text-yellow-700',
    'Low':       'bg-blue-100 text-blue-700',
    'Very Low':  'bg-green-100 text-green-700',
  }
  return <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', cls[l])}>{l}</span>
}

const PORTFOLIO_CELL_COLORS = {
  veryHigh: (i) => `rgba(220,38,38,${0.12 + i * 0.70})`,
  high:     (i) => `rgba(234,88,12,${0.10 + i * 0.58})`,
  moderate: (i) => `rgba(202,138,4,${0.10 + i * 0.52})`,
  low:      (i) => `rgba(79,142,247,${0.10 + i * 0.48})`,
  veryLow:  (i) => `rgba(34,197,94,${0.10 + i * 0.42})`,
}
const PORTFOLIO_MAX = { veryHigh: 4, high: 6, moderate: 5, low: 5, veryLow: 5 }

function PortfolioCell({ count, level }) {
  const intensity = count === 0 ? 0 : Math.min(count / PORTFOLIO_MAX[level], 1)
  const bg = count === 0 ? 'rgba(0,0,0,0.04)' : PORTFOLIO_CELL_COLORS[level](intensity)
  return (
    <div
      className="w-full h-9 rounded flex items-center justify-center text-xs font-semibold"
      style={{ background: bg, color: count === 0 ? '#ccc' : '#333' }}
    >
      {count > 0 ? count : '—'}
    </div>
  )
}


const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded shadow-md px-3 py-2 text-xs">
      {label && <div className="font-semibold text-gray-700 mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name || p.dataKey}: <strong>{p.value}</strong></div>
      ))}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const [rawRisks]   = useLocalStorage('tprm:risks',   RISKS_SEED)
  const [rawVendors] = useLocalStorage('tprm:vendors', VENDORS_INIT)

  const RISKS = useMemo(() => rawRisks.map(r => ({
    ...r,
    residual: residualFromRaw(r),
    inherent: inherentFromRaw(r),
    status:   statusFromRaw(r),
    vendor:   r.vendor || r.vendorId || 'Unknown',
    escalate: r.escalate || r.esc || false,
  })), [rawRisks])

  // Compute heatmap dynamically: group vendors by category, find each vendor's max
  // residual risk level, count vendors per level per portfolio category
  const PORTFOLIO_HEATMAP = useMemo(() => {
    // Build a map: vendor name → max residual level
    const vendorMaxLevel = {}
    for (const r of RISKS) {
      const vname = r.vendor
      const lv = level(r.residual)
      const lvOrder = ['Very High','High','Moderate','Low','Very Low']
      if (!vendorMaxLevel[vname] || lvOrder.indexOf(lv) < lvOrder.indexOf(vendorMaxLevel[vname])) {
        vendorMaxLevel[vname] = lv
      }
    }
    // Group vendors by category, count levels
    const catGroups = {}
    for (const v of rawVendors) {
      if (!catGroups[v.cat]) catGroups[v.cat] = { veryHigh:0, high:0, moderate:0, low:0, veryLow:0 }
      const lv = vendorMaxLevel[v.name] || 'Very Low'
      if      (lv === 'Very High') catGroups[v.cat].veryHigh++
      else if (lv === 'High')      catGroups[v.cat].high++
      else if (lv === 'Moderate')  catGroups[v.cat].moderate++
      else if (lv === 'Low')       catGroups[v.cat].low++
      else                         catGroups[v.cat].veryLow++
    }
    // Map internal category names to display names
    const DISPLAY = {
      'Cloud / Infrastructure': 'Cloud Infra', 'Cloud / SaaS': 'Cloud / SaaS',
      'AI / Technology': 'AI / Tech', 'Identity & Access': 'Identity & Access',
      'Cybersecurity': 'Cybersecurity', 'Technology Services': 'Tech Services',
      'Data Center / Facilities': 'Data Centre', 'Financial Services': 'Financial',
      'Network / Connectivity': 'Network', 'Marketing / Consulting': 'Marketing',
    }
    return Object.entries(catGroups)
      .map(([cat, counts]) => ({ portfolio: DISPLAY[cat] || cat, ...counts, _cat: cat }))
      .sort((a,b) => (b.veryHigh + b.high) - (a.veryHigh + a.high))
  }, [rawVendors, RISKS])

  const escalated = RISKS.filter(r => r.escalate)
  const vhCount   = RISKS.filter(r => level(r.residual) === 'Very High').length
  const hCount    = RISKS.filter(r => level(r.residual) === 'High').length
  const openCount = RISKS.filter(r => r.status === 'Open' || r.status === 'In Progress').length
  const mitCount  = RISKS.filter(r => r.status === 'Mitigated' || r.status === 'Closed').length

  const LEVEL_ORDER     = ['Very High','High','Moderate','Low','Very Low']
  const LEVEL_COLOR_MAP = { 'Very High':'#ef4444', 'High':'#f97316', 'Moderate':'#eab308', 'Low':'#4f8ef7', 'Very Low':'#22c55e' }

  const SEV_DATA = LEVEL_ORDER.map(l => ({
    name: l, value: RISKS.filter(r => level(r.residual) === l).length, fill: LEVEL_COLOR_MAP[l]
  })).filter(d => d.value > 0)

  const TREND_DATA = [
    { month:'Mar', open:6, mitigated:1 },
    { month:'Apr', open:7, mitigated:2 },
    { month:'May', open:9, mitigated:3 },
    { month:'Jun', open:8, mitigated:4 },
    { month:'Jul', open:9, mitigated:5 },
    { month:'Sep', open: openCount, mitigated: mitCount },
  ]

  const allCats = [...new Set(RISKS.map(r => r.cat))]
  const CAT_DATA = allCats.map(cat => {
    const catRisks = RISKS.filter(r => r.cat === cat)
    const row = { name: cat, _total: catRisks.length }
    LEVEL_ORDER.forEach(l => { row[l] = catRisks.filter(r => level(r.residual) === l).length })
    return row
  }).sort((a,b) => (b['Very High'] + b['High']) - (a['Very High'] + a['High']))

  const vendors = [...new Set(RISKS.map(r => r.vendor))]
  const IR_DATA = vendors.map(v => {
    const vr = RISKS.filter(r => r.vendor === v)
    const inh = +(vr.reduce((s,r)=>s+r.inherent,0)/vr.length).toFixed(1)
    const res = +(vr.reduce((s,r)=>s+r.residual,0)/vr.length).toFixed(1)
    const reduction = inh > 0 ? Math.round((1 - res/inh)*100) : 0
    return { name: v.split(' ')[0], fullName: v, inherent: inh, residual: res, reduction }
  }).sort((a,b) => b.residual - a.residual)

  const TREAT_STATUSES     = ['Open', 'In Progress', 'Mitigated', 'Accepted', 'Closed']
  const TREAT_STATUS_COLORS = { 'Open':'#ef4444', 'In Progress':'#4f8ef7', 'Mitigated':'#22c55e', 'Accepted':'#f97316', 'Closed':'#9ca3af' }
  const TREAT_DATA = ['Mitigate','Transfer','Accept','Avoid'].map(treat => {
    const row = { name: treat }
    TREAT_STATUSES.forEach(st => { row[st] = RISKS.filter(r => r.treat === treat && r.status === st).length })
    row._total = RISKS.filter(r => r.treat === treat).length
    return row
  }).filter(r => r._total > 0)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-800">Risk Dashboard</h1>
        <p className="text-xs text-gray-400 mt-0.5">Executive view · August 2026</p>
      </div>

      {/* Alert banner */}
      {escalated.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <span className="text-red-500 text-sm mt-0.5">🔴</span>
          <div className="text-xs text-gray-700">
            <strong className="text-red-600">{escalated.length} risk(s) require escalation.</strong>
            {' '}Very High residual risks must be reviewed monthly by TPRM leadership. High overdue risks require immediate attention.{' '}
            <button onClick={() => navigate('/risks', { state:{ filterEsc:true } })} className="text-red-600 underline font-semibold hover:text-red-800">View escalated risks →</button>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Very High (Residual)" value={vhCount}  desc="Immediate action required"  colorClass="text-red-600"    onClick={() => navigate('/risks',  { state:{ filterLevel:'Very High' } })} />
        <KpiCard label="High (Residual)"      value={hCount}   desc="Quarterly review cadence"    colorClass="text-orange-500" onClick={() => navigate('/risks',  { state:{ filterLevel:'High' } })} />
        <KpiCard label="Open / In Progress"   value={openCount}desc="Active remediation"          colorClass="text-blue-600"   onClick={() => navigate('/issues', { state:{ filterStatus:'Open' } })} />
        <KpiCard label="Mitigated / Closed"   value={mitCount} desc="Successfully resolved"       colorClass="text-green-600"  onClick={() => navigate('/risks',  { state:{ filterStatus:'Mitigated' } })} />
        <KpiCard label="Escalation Required"  value={escalated.length} desc={`${vendors.length} vendors monitored`} colorClass={escalated.length ? 'text-red-600' : 'text-green-600'} onClick={() => navigate('/risks', { state:{ filterEsc:true } })} />
      </div>

      {/* Chart row 1: Severity donut + Trend line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Residual Risk by Level">
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SEV_DATA}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  dataKey="value"
                  style={{ cursor:'pointer' }}
                  onClick={(d) => navigate('/risks', { state:{ filterLevel: d.name } })}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                    const RADIAN = Math.PI / 180
                    const r = innerRadius + (outerRadius - innerRadius) * 0.5
                    const x = cx + r * Math.cos(-midAngle * RADIAN)
                    const y = cy + r * Math.sin(-midAngle * RADIAN)
                    return value > 0 ? <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>{value}</text> : null
                  }}
                  labelLine={false}
                >
                  {SEV_DATA.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: '#718096' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Risk Trend (6 months)">
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND_DATA} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#718096' }} />
                <YAxis tick={{ fontSize: 11, fill: '#718096' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: '#718096' }} />
                <Line type="monotone" dataKey="open"      name="Open"      stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} fill="rgba(239,68,68,.08)" />
                <Line type="monotone" dataKey="mitigated" name="Mitigated" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Chart row 2: Category bar + Inherent vs Residual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Risk Register: Open Risks by Category &amp; Severity">
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CAT_DATA} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 80 }} style={{ cursor:'pointer' }} onClick={(d) => d?.activePayload && navigate('/risks', { state:{ filterCat: d.activePayload[0]?.payload?.name } })}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#718096' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#718096' }} width={80} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const row = CAT_DATA.find(d => d.name === label)
                    return (
                      <div className="bg-white border border-gray-200 rounded shadow-md px-3 py-2 text-xs space-y-0.5">
                        <div className="font-semibold text-gray-700 mb-1">{label} <span className="text-gray-400 font-normal">({row?._total} total)</span></div>
                        {payload.filter(p => p.value > 0).map((p, i) => (
                          <div key={i} style={{ color: p.fill }}>{p.name}: <strong>{p.value}</strong></div>
                        ))}
                      </div>
                    )
                  }}
                />
                <Legend iconSize={9} wrapperStyle={{ fontSize: 10, color: '#718096' }} />
                {LEVEL_ORDER.map((l, li) => (
                  <Bar key={l} dataKey={l} stackId="a" fill={LEVEL_COLOR_MAP[l]} name={l} minPointSize={0}>
                    <LabelList
                      dataKey={l}
                      position="center"
                      style={{ fontSize: 10, fontWeight: 600, fill: '#fff' }}
                      formatter={v => v > 0 ? v : ''}
                    />
                    {li === LEVEL_ORDER.length - 1 && (
                      <LabelList
                        dataKey="_total"
                        position="right"
                        style={{ fontSize: 10, fill: '#718096', fontWeight: 600 }}
                        formatter={v => v > 0 ? v : ''}
                      />
                    )}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1.5 text-[10px] text-gray-400">Source: Risk Register · {RISKS.length} risks across {allCats.length} categories · Residual scores as of Aug 2026</div>
        </ChartCard>

        <ChartCard title="Control Effectiveness by Vendor" action="Risk Register" onAction={() => navigate('/risks')}>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={IR_DATA} layout="vertical"
                margin={{ top: 0, right: 40, bottom: 0, left: 52 }}
                style={{ cursor:'pointer' }}
                onClick={d => {
                  if (!d?.activePayload) return
                  const vendorName = d.activePayload[0]?.payload?.fullName
                  navigate('/risks', { state:{ filterVendor: vendorName } })
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" domain={[0, 25]} tick={{ fontSize: 10, fill: '#718096' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#718096' }} width={52} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const row = IR_DATA.find(d => d.name === label)
                    return (
                      <div className="bg-white border border-gray-200 rounded shadow-md px-3 py-2 text-xs space-y-0.5">
                        <div className="font-semibold text-gray-700 mb-1">{row?.fullName || label}</div>
                        <div style={{ color:'#f97316' }}>Inherent: <strong>{row?.inherent}</strong></div>
                        <div style={{ color:'#4f8ef7' }}>Residual: <strong>{row?.residual}</strong></div>
                        <div className="text-gray-500 border-t border-gray-100 pt-0.5 mt-0.5">Controls reduced risk by <strong className="text-green-600">{row?.reduction}%</strong></div>
                        <div className="text-[10px] text-blue-500 pt-0.5">Click to view vendor's risks →</div>
                      </div>
                    )
                  }}
                />
                <Legend iconSize={9} wrapperStyle={{ fontSize: 10, color: '#718096' }} />
                <Bar dataKey="inherent" name="Inherent" fill="rgba(249,115,22,0.35)" radius={[0,2,2,0]} />
                <Bar dataKey="residual" name="Residual" fill="rgba(79,142,247,0.85)" radius={[0,2,2,0]}>
                  <LabelList dataKey="reduction" position="right" style={{ fontSize: 10, fill: '#16a34a', fontWeight: 600 }} formatter={v => `−${v}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1.5 text-[10px] text-gray-400">Click a vendor bar to view its risks · % label = control reduction · Sorted by residual risk</div>
        </ChartCard>
      </div>

      {/* Chart row 3: Vendor Risk Heatmap + Treatment donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <ChartCard title="Vendor Risk Heatmap — by Portfolio" action="Vendor details" onAction={() => navigate('/vendors')}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[320px]">
              <thead>
                <tr>
                  <th className="text-left text-gray-500 font-semibold pb-2 pr-3">Portfolio</th>
                  <th className="pb-2 text-center text-red-600    font-semibold">VH</th>
                  <th className="pb-2 text-center text-orange-500 font-semibold">H</th>
                  <th className="pb-2 text-center text-yellow-600 font-semibold">M</th>
                  <th className="pb-2 text-center text-blue-500   font-semibold">L</th>
                  <th className="pb-2 text-center text-green-600  font-semibold">VL</th>
                  <th className="pb-2 text-right  text-gray-400   font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {PORTFOLIO_HEATMAP.map(row => {
                  const total = row.veryHigh + row.high + row.moderate + row.low + row.veryLow
                  return (
                    <tr key={row.portfolio} className="cursor-pointer hover:bg-gray-50 transition-colors group" onClick={() => navigate('/vendors', { state:{ filterCat: row._cat } })}>
                      <td className="pr-3 py-1 font-medium text-gray-700 whitespace-nowrap group-hover:text-blue-600 transition-colors">{row.portfolio}</td>
                      <td className="px-0.5 py-1"><PortfolioCell count={row.veryHigh} level="veryHigh" /></td>
                      <td className="px-0.5 py-1"><PortfolioCell count={row.high}     level="high"     /></td>
                      <td className="px-0.5 py-1"><PortfolioCell count={row.moderate} level="moderate" /></td>
                      <td className="px-0.5 py-1"><PortfolioCell count={row.low}      level="low"      /></td>
                      <td className="px-0.5 py-1"><PortfolioCell count={row.veryLow}  level="veryLow"  /></td>
                      <td className="pl-2 py-1 text-right font-semibold text-gray-500">{total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-gray-400">
              {[
                { label:'Very High', bg:'rgba(220,38,38,0.65)'  },
                { label:'High',      bg:'rgba(234,88,12,0.50)'  },
                { label:'Moderate',  bg:'rgba(202,138,4,0.45)'  },
                { label:'Low',       bg:'rgba(79,142,247,0.40)' },
                { label:'Very Low',  bg:'rgba(34,197,94,0.35)'  },
              ].map(({ label, bg }) => (
                <span key={label} className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded inline-block" style={{ background: bg }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Treatment Execution Status" action="Risk Register" onAction={() => navigate('/risks')}>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={TREAT_DATA} layout="vertical"
                margin={{ top: 0, right: 28, bottom: 0, left: 52 }}
                style={{ cursor:'pointer' }}
                onClick={d => {
                  if (!d?.activePayload) return
                  const treat  = d.activePayload[0]?.payload?.name
                  const status = d.activePayload[0]?.name
                  navigate('/risks', { state:{ filterTreat: treat, filterStatus: status } })
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#718096' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#718096' }} width={52} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const row = TREAT_DATA.find(d => d.name === label)
                    const hovered = payload.find(p => p.value > 0)
                    return (
                      <div className="bg-white border border-gray-200 rounded shadow-md px-3 py-2 text-xs space-y-0.5">
                        <div className="font-semibold text-gray-700 mb-1">{label} <span className="text-gray-400 font-normal">({row?._total} risks)</span></div>
                        {payload.filter(p => p.value > 0).map((p, i) => (
                          <div key={i} style={{ color: p.fill }}>{p.name}: <strong>{p.value}</strong></div>
                        ))}
                        {hovered && <div className="text-[10px] text-blue-500 border-t border-gray-100 pt-0.5 mt-0.5">Click to view {label} · {hovered.name} risks →</div>}
                      </div>
                    )
                  }}
                />
                <Legend iconSize={9} wrapperStyle={{ fontSize: 10, color: '#718096' }} />
                {TREAT_STATUSES.map((st, si) => (
                  <Bar key={st} dataKey={st} stackId="a" fill={TREAT_STATUS_COLORS[st]} name={st} minPointSize={0}>
                    <LabelList dataKey={st} position="center" style={{ fontSize: 10, fontWeight: 600, fill: '#fff' }} formatter={v => v > 0 ? v : ''} />
                    {si === TREAT_STATUSES.length - 1 && (
                      <LabelList dataKey="_total" position="right" style={{ fontSize: 10, fill: '#718096', fontWeight: 600 }} formatter={v => v > 0 ? v : ''} />
                    )}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1.5 text-[10px] text-gray-400">Click a segment to filter Risk Register by treatment type AND execution status</div>
        </ChartCard>
      </div>

      {/* Top Escalations table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-gray-700">Top Escalations</h3>
          <button onClick={() => navigate('/risks')} className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700">
            View Register <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Risk','Vendor','Inherent','Residual','Treatment','Owner','Due','Escalation'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...RISKS].sort((a,b) => b.residual - a.residual).slice(0, 6).map((r, i) => {
                const TREAT_COLORS = { Mitigate:'bg-blue-100 text-blue-700', Transfer:'bg-purple-100 text-purple-700', Accept:'bg-amber-100 text-amber-700', Avoid:'bg-red-100 text-red-700' }
                return (
                <tr
                  key={r.id}
                  className={cn('border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors', i % 2 === 1 && 'bg-gray-50/50')}
                  onClick={() => navigate('/risks', { state:{ openRiskId: r.id } })}
                >
                  <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[180px]">{r.name}</td>
                  <td className="px-3 py-2.5">
                    <button className="text-blue-600 font-medium hover:underline text-left" onClick={e => { e.stopPropagation(); navigate('/vendors', { state:{ openVendorName: r.vendor } }) }}>{r.vendor}</button>
                    <div className="text-[10px] text-gray-400">{r.tier}</div>
                  </td>
                  <td className="px-3 py-2.5 w-28"><ScoreBar value={r.inherent} color="#f97316" /></td>
                  <td className="px-3 py-2.5 w-28"><ScoreBar value={r.residual} /></td>
                  <td className="px-3 py-2.5">
                    <button
                      className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full hover:opacity-80', TREAT_COLORS[r.treat] || 'bg-gray-100 text-gray-600')}
                      onClick={e => { e.stopPropagation(); navigate('/risks', { state:{ filterTreat: r.treat } }) }}
                      title={`View all ${r.treat} risks`}
                    >{r.treat}</button>
                    <div className="mt-0.5"><LevelBadge value={r.residual} /></div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{r.owner}</td>
                  <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{r.due}</td>
                  <td className="px-3 py-2.5">
                    {r.escalate
                      ? <span className="flex items-center gap-1 text-red-600 font-semibold text-[10px]"><AlertTriangle className="w-3 h-3" />Escalate</span>
                      : <span className="text-gray-300">—</span>
                    }
                  </td>
                </tr>
              )})}

            </tbody>
          </table>
        </div>
      </div>

      {/* TPRM Intelligence Briefing */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-blue-500" />
            <h3 className="text-[13px] font-semibold text-gray-700">TPRM Intelligence Briefing</h3>
          </div>
          <button onClick={() => navigate('/intelligence')} className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700">
            Full Briefing <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          {NEWS_ITEMS.map(item => (
            <div key={item.id} onClick={() => navigate('/intelligence', { state:{ openArticleId: item.id } })} className="px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer group border-b border-gray-100">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className={cn('text-[10px] border rounded px-1.5 py-0.5 shrink-0 font-medium', TAG_COLORS[item.tag] || 'bg-gray-50 text-gray-500 border-gray-200')}>
                  {item.tag}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400">{item.date}</span>
                  <ExternalLink className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="text-xs font-semibold text-gray-800 leading-snug group-hover:text-blue-700 transition-colors mb-1">
                {item.title}
              </div>
              <div className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">{item.summary}</div>
              <div className="text-[10px] text-gray-400 mt-1.5">{item.source}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SCA Summary */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-gray-700">Supplier Compliance Audit · Vantage Advisory July 2026</h3>
          <button onClick={() => navigate('/sca')} className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700">
            View Full Report <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-5 divide-x divide-gray-100">
          {[
            { label: 'Very High', value: SCA_SUMMARY.veryHigh, color: 'text-red-600',    path: '/sca', state:{ filterLevel:'Very High' } },
            { label: 'High',      value: SCA_SUMMARY.high,     color: 'text-orange-500', path: '/sca', state:{ filterLevel:'High' } },
            { label: 'Moderate',  value: SCA_SUMMARY.moderate, color: 'text-yellow-600', path: '/sca', state:{ filterLevel:'Moderate' } },
            { label: 'Low / No Risk', value: SCA_SUMMARY.low, color: 'text-green-600',   path: '/sca' },
            { label: "Non-Compliant T&C's", value: SCA_SUMMARY.nonCompliant, color: 'text-blue-600', path: '/sca' },
          ].map(({ label, value, color, path, state }) => (
            <button
              key={label}
              onClick={() => navigate(path, state ? { state } : undefined)}
              className="text-center py-4 px-3 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className={cn('text-2xl font-bold', color)}>{value}</div>
              <div className="text-[10px] text-gray-400 mt-1">{label}</div>
            </button>
          ))}
        </div>
        <div className="px-4 py-2.5 border-t border-gray-100 text-[11px] text-gray-500">
          Top concerns: Data Privacy &amp; Info Security (10/29 compliant), Immigration &amp; Labor (3/10), Insurance &amp; Liability (6/11).
          GlobalPay Financial rated Very High — immediate audit required. CloudComm Networks, EventPro Management, Indigo Tech Solutions rated High.
        </div>
      </div>

    </div>
  )
}
