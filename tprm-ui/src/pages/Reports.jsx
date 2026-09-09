import { useNavigate } from 'react-router-dom'
import { Printer } from 'lucide-react'
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { cn, RISK_COLORS } from '@/lib/utils'

// ─── Data ─────────────────────────────────────────────────────────────────────

const VENDORS_RPT = [
  {id:'v1',name:'CloudSystems Inc',   tier:'Tier 1',cat:'Cloud / SaaS'},
  {id:'v2',name:'DataSecure LLC',     tier:'Tier 1',cat:'Technology'},
  {id:'v3',name:'GlobalPay Corp',     tier:'Tier 2',cat:'Financial Services'},
  {id:'v4',name:'LegalEagle LLP',     tier:'Tier 2',cat:'Legal'},
  {id:'v5',name:'FastShip Logistics', tier:'Tier 3',cat:'Logistics'},
]

const RISKS_RPT = [
  {id:'r1', name:'Unpatched software vulnerabilities',  vendor:'v1',cat:'Cybersecurity',      lik:4,imp:5,ctrl:1,treat:'Mitigate',st:'Open'},
  {id:'r2', name:'Inadequate data encryption at rest',  vendor:'v2',cat:'Cybersecurity',      lik:3,imp:5,ctrl:1,treat:'Mitigate',st:'In Progress'},
  {id:'r3', name:'PCI-DSS compliance gap',              vendor:'v3',cat:'Compliance',         lik:4,imp:4,ctrl:0,treat:'Mitigate',st:'Open'},
  {id:'r4', name:'Vendor financial instability',        vendor:'v3',cat:'Financial',          lik:3,imp:4,ctrl:1,treat:'Transfer',st:'Open'},
  {id:'r5', name:'Single point of failure – cloud',     vendor:'v1',cat:'Business Continuity',lik:2,imp:5,ctrl:2,treat:'Mitigate',st:'In Progress'},
  {id:'r6', name:'Subprocessor data sharing',           vendor:'v2',cat:'Privacy & Data',     lik:3,imp:4,ctrl:3,treat:'Mitigate',st:'Mitigated'},
  {id:'r7', name:'Shipping delays impacting SLA',       vendor:'v5',cat:'Operational',        lik:3,imp:2,ctrl:1,treat:'Accept',  st:'Accepted'},
  {id:'r8', name:'GDPR erasure non-compliance',         vendor:'v1',cat:'Privacy & Data',     lik:2,imp:4,ctrl:4,treat:'Mitigate',st:'Mitigated'},
  {id:'r9', name:'Insider threat from contractors',     vendor:'v4',cat:'Cybersecurity',      lik:2,imp:3,ctrl:2,treat:'Mitigate',st:'Open'},
  {id:'r10',name:'Contract renewal pricing risk',       vendor:'v1',cat:'Financial',          lik:4,imp:3,ctrl:1,treat:'Accept',  st:'Open'},
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inherent(r) { return r.lik * r.imp }
function residual(r) { return Math.max(1, r.lik * r.imp - r.ctrl * 2) }
function level(score) {
  if (score >= 20) return 'Very High'
  if (score >= 12) return 'High'
  if (score >= 6)  return 'Moderate'
  if (score >= 2)  return 'Low'
  return 'Very Low'
}

const SEV_COLORS   = { 'Very High':'#ef4444', High:'#f97316', Moderate:'#eab308', Low:'#4f8ef7', 'Very Low':'#22c55e' }
const TREAT_COLORS = { Mitigate:'#3b82f6', Transfer:'#22c55e', Accept:'#f97316', Avoid:'#ef4444' }

// ─── Chart data ───────────────────────────────────────────────────────────────

const sevData = ['Very High','High','Moderate','Low','Very Low']
  .map(l => ({ name:l, value: RISKS_RPT.filter(r => level(residual(r)) === l).length }))
  .filter(d => d.value > 0)

const catCounts = {}
RISKS_RPT.forEach(r => { catCounts[r.cat] = (catCounts[r.cat] || 0) + 1 })
const catData = Object.entries(catCounts).map(([name,value]) => ({name,value})).sort((a,b) => b.value-a.value)

const vendorData = VENDORS_RPT.map(v => {
  const vr = RISKS_RPT.filter(r => r.vendor === v.id)
  const avg = arr => arr.length ? Math.round(arr.reduce((s,x) => s+x, 0) / arr.length * 10) / 10 : 0
  return {
    name:         v.name.split(' ')[0],
    avgInherent:  avg(vr.map(r => inherent(r))),
    avgResidual:  avg(vr.map(r => residual(r))),
  }
})

const treatCounts = {}
RISKS_RPT.forEach(r => { treatCounts[r.treat] = (treatCounts[r.treat] || 0) + 1 })
const treatData = Object.entries(treatCounts).map(([name,value]) => ({name,value}))

// ─── KPIs ─────────────────────────────────────────────────────────────────────

const KPIS = [
  { label:'Total Risks',        value: RISKS_RPT.length,                                                                  color:'text-gray-700',   bg:'bg-gray-50 border-gray-200',       navTo:'/risks',  navState: undefined },
  { label:'Very High',          value: RISKS_RPT.filter(r => level(residual(r)) === 'Very High').length,                  color:'text-red-600',    bg:'bg-red-50 border-red-200',         navTo:'/risks',  navState: { state: { filterLevel: 'Very High' } } },
  { label:'High',               value: RISKS_RPT.filter(r => level(residual(r)) === 'High').length,                       color:'text-orange-500', bg:'bg-orange-50 border-orange-200',   navTo:'/risks',  navState: { state: { filterLevel: 'High' } } },
  { label:'Open / In Progress', value: RISKS_RPT.filter(r => r.st === 'Open' || r.st === 'In Progress').length,           color:'text-blue-600',   bg:'bg-blue-50 border-blue-200',       navTo:'/issues', navState: { state: { filterStatus: 'Open' } } },
  { label:'Mitigated / Closed', value: RISKS_RPT.filter(r => r.st === 'Mitigated' || r.st === 'Closed').length,           color:'text-green-600',  bg:'bg-green-50 border-green-200',     navTo:'/risks',  navState: undefined },
  { label:'Escalation Required',value: RISKS_RPT.filter(r => ['Very High','High'].includes(level(residual(r)))).length,   color:'text-red-700',    bg:'bg-red-50 border-red-200',         navTo:'/risks',  navState: { state: { filterEsc: true } } },
]

const sortedRisks = [...RISKS_RPT].sort((a,b) => residual(b) - residual(a))

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ st }) {
  const map = {
    Open:        'bg-red-100 text-red-700 border-red-200',
    'In Progress':'bg-blue-100 text-blue-700 border-blue-200',
    Mitigated:   'bg-green-100 text-green-700 border-green-200',
    Closed:      'bg-gray-100 text-gray-600 border-gray-200',
    Accepted:    'bg-purple-100 text-purple-700 border-purple-200',
  }
  return <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', map[st] ?? 'bg-gray-100 text-gray-600 border-gray-200')}>{st}</span>
}

function TreatBadge({ treat }) {
  const map = { Mitigate:'bg-blue-100 text-blue-700 border-blue-200', Transfer:'bg-green-100 text-green-700 border-green-200', Accept:'bg-orange-100 text-orange-700 border-orange-200', Avoid:'bg-red-100 text-red-700 border-red-200' }
  return <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', map[treat] ?? 'bg-gray-100 text-gray-600 border-gray-200')}>{treat}</span>
}

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <div className="font-semibold text-gray-700 mb-1">{label}</div>
      {payload.map((p,i) => <div key={i} style={{color:p.color ?? p.fill}}>{p.name}: {p.value}</div>)}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Reports() {
  const navigate = useNavigate()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Aggregated risk intelligence across all vendors and categories</p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Printer size={15}/> Export / Print
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPIS.map(k => (
          <button
            key={k.label}
            onClick={() => navigate(k.navTo, k.navState)}
            className={cn('border rounded-xl p-4 text-left cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all', k.bg)}
          >
            <div className={cn('text-3xl font-bold', k.color)}>{k.value}</div>
            <div className="text-xs text-gray-500 mt-1 leading-tight">{k.label}</div>
          </button>
        ))}
      </div>

      {/* 2×2 chart grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Chart 1 — Residual Risk by Level */}
        <div
          className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/risks')}
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Residual Risk by Level</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={sevData} cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
                paddingAngle={3} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                labelLine={false}
              >
                {sevData.map((d,i) => <Cell key={i} fill={SEV_COLORS[d.name]}/>)}
              </Pie>
              <Tooltip content={<ChartTip/>}/>
              <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:'11px'}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2 — Risks by Category (horizontal bar) */}
        <div
          className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/risks')}
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Risks by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={catData} layout="vertical" margin={{left:8,right:16,top:4,bottom:4}}>
              <CartesianGrid horizontal={false} stroke="#f0f0f0"/>
              <XAxis type="number" tick={{fontSize:11}} allowDecimals={false}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:11}} width={135}/>
              <Tooltip content={<ChartTip/>}/>
              <Bar dataKey="value" name="Risks" fill="#3b82f6" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3 — Avg Inherent vs Avg Residual per vendor */}
        <div
          className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/risks')}
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Avg Inherent vs Avg Residual per Vendor</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={vendorData} margin={{left:0,right:16,top:4,bottom:4}}>
              <CartesianGrid vertical={false} stroke="#f0f0f0"/>
              <XAxis dataKey="name" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}} domain={[0,'auto']}/>
              <Tooltip content={<ChartTip/>}/>
              <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:'11px'}}/>
              <Bar dataKey="avgInherent" name="Avg Inherent" fill="#f97316" radius={[4,4,0,0]}/>
              <Bar dataKey="avgResidual" name="Avg Residual" fill="#3b82f6" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 4 — Treatment Distribution */}
        <div
          className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/risks')}
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Treatment Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={treatData} cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
                paddingAngle={3} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                labelLine={false}
              >
                {treatData.map((d,i) => <Cell key={i} fill={TREAT_COLORS[d.name] ?? '#9ca3af'}/>)}
              </Pie>
              <Tooltip content={<ChartTip/>}/>
              <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:'11px'}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk summary table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">All Risks — sorted by residual score</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                {['Risk','Vendor','Inherent','Residual','Level','Treatment','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedRisks.map(r => {
                const vName = VENDORS_RPT.find(v => v.id === r.vendor)?.name ?? '—'
                const inh = inherent(r)
                const res = residual(r)
                const lvl = level(res)
                return (
                  <tr
                    key={r.id}
                    onClick={() => navigate('/risks', { state: { openRiskId: r.id } })}
                    className="cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">{r.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={e => { e.stopPropagation(); navigate('/vendors', { state: { openVendorName: vName } }) }}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {vName}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-semibold text-orange-500">{inh}</td>
                    <td className="px-4 py-3 font-bold text-gray-800">{res}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); navigate('/risks', { state: { filterLevel: lvl } }) }}
                        className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', RISK_COLORS[lvl]?.badge)}
                      >
                        {lvl}
                      </button>
                    </td>
                    <td className="px-4 py-3"><TreatBadge treat={r.treat}/></td>
                    <td className="px-4 py-3"><StatusBadge st={r.st}/></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
