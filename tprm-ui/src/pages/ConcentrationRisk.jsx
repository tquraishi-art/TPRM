import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

// ─── Seed data ────────────────────────────────────────────────────────────────

const VENDORS = [
  { name:'CloudSystems Inc',    tier:'Tier 1', spend:4200000, region:'EU-West',  tech:'Cloud (AWS)', category:'Cloud Infrastructure' },
  { name:'DataSecure LLC',      tier:'Tier 1', spend:1800000, region:'EU-West',  tech:'Cloud (Azure)', category:'Data Security' },
  { name:'GlobalPay Corp',      tier:'Tier 2', spend:3100000, region:'US',       tech:'On-Prem', category:'Payment Processing' },
  { name:'LegalEagle LLP',      tier:'Tier 2', spend: 620000, region:'UK',       tech:'SaaS', category:'Legal Services' },
  { name:'FastShip Logistics',  tier:'Tier 3', spend: 480000, region:'APAC',     tech:'SaaS', category:'Logistics' },
  { name:'MedConsult Group',    tier:'Tier 4', spend: 210000, region:'EU-East',  tech:'SaaS', category:'Consulting' },
]

const TOTAL_SPEND = VENDORS.reduce((s, v) => s + v.spend, 0)
const TIER1_SPEND = VENDORS.filter(v => v.tier === 'Tier 1').reduce((s, v) => s + v.spend, 0)

// Spend concentration
const spendData = [...VENDORS]
  .sort((a, b) => b.spend - a.spend)
  .map(v => ({
    name: v.name.split(' ')[0],
    fullName: v.name,
    spend: v.spend,
    pct: Math.round((v.spend / TOTAL_SPEND) * 100),
    tier: v.tier,
  }))

// Technology concentration
const techGroups = VENDORS.reduce((acc, v) => {
  const k = v.tech.includes('AWS') ? 'AWS (Cloud)' : v.tech.includes('Azure') ? 'Azure (Cloud)' : v.tech
  if (!acc[k]) acc[k] = { tech:k, count:0, spend:0, vendors:[] }
  acc[k].count++
  acc[k].spend += v.spend
  acc[k].vendors.push(v.name)
  return acc
}, {})
const techData = Object.values(techGroups).sort((a, b) => b.spend - a.spend).map(t => ({ ...t, pct: Math.round((t.spend / TOTAL_SPEND) * 100) }))

// Geographic concentration
const geoGroups = VENDORS.reduce((acc, v) => {
  if (!acc[v.region]) acc[v.region] = { region:v.region, count:0, spend:0, vendors:[] }
  acc[v.region].count++
  acc[v.region].spend += v.spend
  acc[v.region].vendors.push(v.name)
  return acc
}, {})
const geoData = Object.values(geoGroups).sort((a, b) => b.spend - a.spend).map(g => ({ ...g, pct: Math.round((g.spend / TOTAL_SPEND) * 100) }))

// Sector concentration (category)
const catGroups = VENDORS.reduce((acc, v) => {
  if (!acc[v.category]) acc[v.category] = { category:v.category, count:0, spend:0, vendors:[] }
  acc[v.category].count++
  acc[v.category].spend += v.spend
  acc[v.category].vendors.push(v.name)
  return acc
}, {})
const catData = Object.values(catGroups).sort((a, b) => b.spend - a.spend).map(c => ({ ...c, pct: Math.round((c.spend / TOTAL_SPEND) * 100) }))

const RISK_THRESHOLDS = {
  spend:  { high:40, moderate:25, label:'Single-vendor spend share' },
  tech:   { high:40, moderate:25, label:'Technology stack share' },
  geo:    { high:55, moderate:35, label:'Geographic region share' },
  sector: { high:60, moderate:40, label:'Service category share' },
}

function concentration(pct, key) {
  const t = RISK_THRESHOLDS[key]
  if (pct >= t.high)     return 'high'
  if (pct >= t.moderate) return 'moderate'
  return 'low'
}

const CONC_META = {
  high:     { label:'High Concentration',     color:'text-red-600',    bar:'bg-red-500',    badge:'bg-red-100 text-red-700' },
  moderate: { label:'Moderate Concentration', color:'text-amber-600',  bar:'bg-amber-400',  badge:'bg-amber-100 text-amber-700' },
  low:      { label:'Low Concentration',      color:'text-green-600',  bar:'bg-green-500',  badge:'bg-green-100 text-green-700' },
}

const GEO_COLORS  = ['#0176d3','#1d9bd1','#49c7e0','#7ed4e6','#b2e4ee','#d7f1f8']
const TECH_COLORS = ['#f97316','#fbbf24','#84cc16','#22d3ee','#818cf8','#c084fc']

function fmt(n) {
  if (n >= 1000000) return `£${(n/1000000).toFixed(1)}M`
  if (n >= 1000)    return `£${(n/1000).toFixed(0)}K`
  return `£${n}`
}

function ConcentrationBar({ pct, type }) {
  const level = concentration(pct, type)
  const m = CONC_META[level]
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', m.bar)} style={{ width:`${Math.min(pct, 100)}%` }} />
      </div>
      <span className={cn('text-xs font-bold w-8 text-right', m.color)}>{pct}%</span>
      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-semibold', m.badge)}>{level === 'high' ? 'High' : level === 'moderate' ? 'Mod' : 'Low'}</span>
    </div>
  )
}

const TIER1_PCT = Math.round((TIER1_SPEND / TOTAL_SPEND) * 100)
const TOP_VENDOR_PCT = spendData[0].pct

export default function ConcentrationRisk() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('spend')

  const alerts = [
    spendData[0].pct >= RISK_THRESHOLDS.spend.high && `${spendData[0].fullName} represents ${spendData[0].pct}% of total vendor spend — single-vendor concentration risk.`,
    TIER1_PCT >= 85 && `Tier 1 vendors account for ${TIER1_PCT}% of total spend — review diversification strategy.`,
    techData[0].pct >= RISK_THRESHOLDS.tech.high && `Technology concentration: ${techData[0].tech} underpins ${techData[0].pct}% of spend across ${techData[0].count} vendors.`,
    geoData[0].pct >= RISK_THRESHOLDS.geo.high && `Geographic concentration: ${geoData[0].region} hosts ${geoData[0].pct}% of vendor spend.`,
  ].filter(Boolean)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-800">Concentration Risk Dashboard</h1>
        <p className="text-xs text-gray-400 mt-0.5">Spend, technology, geographic, and sector concentration across the vendor portfolio</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{a}</p>
            </div>
          ))}
        </div>
      )}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Total Vendor Spend',    value: fmt(TOTAL_SPEND),  color:'text-gray-800' },
          { label:'Tier 1 Spend Share',    value: `${TIER1_PCT}%`,  color: TIER1_PCT >= 85 ? 'text-amber-500' : 'text-green-600' },
          { label:'Top Vendor Spend Share',value: `${TOP_VENDOR_PCT}%`, color: TOP_VENDOR_PCT >= 40 ? 'text-red-600' : 'text-green-600' },
          { label:'Active Vendors',        value: VENDORS.length,    color:'text-gray-800' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{k.label}</div>
            <div className={cn('text-2xl font-bold', k.color)}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[['spend','Spend'], ['tech','Technology'], ['geo','Geography'], ['sector','Sector']].map(([k,l]) => (
          <button key={k} onClick={() => setActiveTab(k)}
            className={cn('text-xs px-3 py-1.5 rounded-md font-medium transition-colors', activeTab===k ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700')}>
            {l}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'spend' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bar chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-600 mb-3">Spend Distribution by Vendor</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={spendData} layout="vertical" margin={{ left: 80, right: 30 }}>
                <XAxis type="number" tickFormatter={v => `£${(v/1000000).toFixed(1)}M`} tick={{ fontSize:10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize:10 }} width={80} />
                <Tooltip formatter={(v) => [fmt(v), 'Spend']} labelFormatter={l => spendData.find(d=>d.name===l)?.fullName || l} />
                <Bar dataKey="spend" radius={[0,3,3,0]}>
                  {spendData.map((d, i) => <Cell key={i} fill={d.pct >= 40 ? '#ef4444' : d.pct >= 25 ? '#f59e0b' : '#0176d3'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Vendor','Tier','Spend','% Total','Concentration'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {spendData.map(d => (
                  <tr key={d.fullName} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5">
                      <button className="text-blue-500 hover:underline" onClick={() => navigate('/vendors', { state:{ openVendorName: d.fullName } })}>{d.fullName}</button>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500">{d.tier}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-800">{fmt(d.spend)}</td>
                    <td className="px-3 py-2.5">
                      <ConcentrationBar pct={d.pct} type="spend" />
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', CONC_META[concentration(d.pct,'spend')].badge)}>
                        {CONC_META[concentration(d.pct,'spend')].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tech' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-600 mb-3">Technology Stack Concentration</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={techData} dataKey="spend" nameKey="tech" cx="50%" cy="50%" outerRadius={80} label={({ tech, pct }) => `${tech} ${pct}%`} labelLine={true}>
                  {techData.map((_, i) => <Cell key={i} fill={TECH_COLORS[i % TECH_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => [fmt(v), 'Spend']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Technology','Vendors','Spend','% Total','Concentration'].map(h=><th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody>
                {techData.map(d => (
                  <tr key={d.tech} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-gray-800">{d.tech}</td>
                    <td className="px-3 py-2.5 text-gray-500">{d.vendors.join(', ')}</td>
                    <td className="px-3 py-2.5 font-medium">{fmt(d.spend)}</td>
                    <td className="px-3 py-2.5"><ConcentrationBar pct={d.pct} type="tech" /></td>
                    <td className="px-3 py-2.5"><span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', CONC_META[concentration(d.pct,'tech')].badge)}>{CONC_META[concentration(d.pct,'tech')].label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'geo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-600 mb-3">Geographic Concentration by Spend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={geoData} dataKey="spend" nameKey="region" cx="50%" cy="50%" outerRadius={80} label={({ region, pct }) => `${region} ${pct}%`}>
                  {geoData.map((_, i) => <Cell key={i} fill={GEO_COLORS[i % GEO_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => [fmt(v), 'Spend']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Region','Vendors','Spend','% Total','Concentration'].map(h=><th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody>
                {geoData.map(d => (
                  <tr key={d.region} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-gray-800">{d.region}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-[11px]">{d.vendors.join(', ')}</td>
                    <td className="px-3 py-2.5 font-medium">{fmt(d.spend)}</td>
                    <td className="px-3 py-2.5"><ConcentrationBar pct={d.pct} type="geo" /></td>
                    <td className="px-3 py-2.5"><span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', CONC_META[concentration(d.pct,'geo')].badge)}>{CONC_META[concentration(d.pct,'geo')].label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sector' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-600 mb-3">Service Category Concentration</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={catData} layout="vertical" margin={{ left: 120, right: 30 }}>
                <XAxis type="number" tickFormatter={v => `£${(v/1000000).toFixed(1)}M`} tick={{ fontSize:10 }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize:10 }} width={120} />
                <Tooltip formatter={v => [fmt(v), 'Spend']} />
                <Bar dataKey="spend" radius={[0,3,3,0]}>
                  {catData.map((d, i) => <Cell key={i} fill={d.pct >= 40 ? '#ef4444' : d.pct >= 25 ? '#f59e0b' : '#0176d3'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Category','Vendors','Spend','% Total','Concentration'].map(h=><th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody>
                {catData.map(d => (
                  <tr key={d.category} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-gray-800">{d.category}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-[11px]">{d.vendors.join(', ')}</td>
                    <td className="px-3 py-2.5 font-medium">{fmt(d.spend)}</td>
                    <td className="px-3 py-2.5"><ConcentrationBar pct={d.pct} type="sector" /></td>
                    <td className="px-3 py-2.5"><span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', CONC_META[concentration(d.pct,'sector')].badge)}>{CONC_META[concentration(d.pct,'sector')].label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Threshold legend */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Concentration Thresholds</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-gray-600">
          {Object.entries(RISK_THRESHOLDS).map(([k, t]) => (
            <div key={k}>
              <span className="font-semibold text-gray-700 capitalize">{k === 'geo' ? 'Geography' : k === 'sector' ? 'Sector' : k === 'tech' ? 'Technology' : 'Spend'}:</span>{' '}
              <span className="text-red-500">High ≥{t.high}%</span> · <span className="text-amber-500">Moderate ≥{t.moderate}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
