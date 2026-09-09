import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Data ─────────────────────────────────────────────────────────────────────

const SCA_FINDINGS = [
  {id:'s1', vendor:'GlobalPay Financial',          area:'Data Privacy & Info Security', finding:'Missing DPA addendum for EU data transfers',              risk:'Very High', status:'Open',        recommendation:'Execute GDPR-compliant DPA within 30 days'},
  {id:'s2', vendor:'CloudComm Networks',           area:'Immigration & Labor',          finding:'No right-to-work verification process documented',        risk:'High',      status:'Open',        recommendation:'Implement I-9 equivalent verification workflow'},
  {id:'s3', vendor:'EventPro Management',          area:'Insurance & Liability',        finding:'GL insurance certificate expired 3 months ago',           risk:'High',      status:'Overdue',     recommendation:'Obtain updated certificate of insurance immediately'},
  {id:'s4', vendor:'Indigo Tech Solutions',        area:'Data Privacy & Info Security', finding:'Subprocessor list not disclosed per DPA requirements',     risk:'High',      status:'In Progress', recommendation:'Disclose all subprocessors and obtain consent'},
  {id:'s5', vendor:'CyberShield Inc',              area:'Cybersecurity Controls',       finding:'Pen test results not shared per contractual obligation',   risk:'High',      status:'Open',        recommendation:'Provide latest penetration testing report'},
  {id:'s6', vendor:'Waveline Communications',      area:'Business Continuity',          finding:'BCP not tested in 18 months',                             risk:'Moderate',  status:'In Progress', recommendation:'Conduct tabletop exercise within 60 days'},
  {id:'s7', vendor:'Atlas Real Estate Partners',   area:'Insurance & Liability',        finding:'Umbrella policy limit below contractual requirement',      risk:'Moderate',  status:'Open',        recommendation:'Increase umbrella coverage to $5M minimum'},
  {id:'s8', vendor:'Meridian Property Group',      area:'Data Privacy & Info Security', finding:'No employee data security training records',               risk:'Moderate',  status:'Open',        recommendation:'Implement annual security awareness training'},
  {id:'s9', vendor:'Apex Consulting Group',        area:'Anti-Corruption & Ethics',     finding:'No third-party due diligence on subcontractors',           risk:'Moderate',  status:'In Progress', recommendation:'Implement subcontractor screening process'},
  {id:'s10',vendor:'DataVault Technologies',       area:'Cybersecurity Controls',       finding:'MFA not enforced for privileged account access',           risk:'High',      status:'Open',        recommendation:'Enable MFA for all admin accounts within 14 days'},
  {id:'s11',vendor:'NetCore Systems',              area:'Data Privacy & Info Security', finding:'Data retention policy exceeds contractual limits',         risk:'Low',       status:'Closed',      recommendation:'Completed — retention policy updated'},
  {id:'s12',vendor:'Pinnacle Workplace Solutions', area:'Immigration & Labor',          finding:'Contractor classification review outstanding',             risk:'Low',       status:'Open',        recommendation:'Legal review of contractor classification'},
]

const SCA_AREAS = [
  {area:'Data Privacy & Info Security', total:29, compliant:10},
  {area:'Immigration & Labor',          total:10, compliant:3},
  {area:'Insurance & Liability',        total:11, compliant:6},
  {area:'Business Continuity',          total:8,  compliant:6},
  {area:'Cybersecurity Controls',       total:12, compliant:8},
  {area:'Anti-Corruption & Ethics',     total:7,  compliant:5},
  {area:'Environmental & Social',       total:6,  compliant:5},
  {area:'Financial Controls',           total:7,  compliant:5},
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_ORDER = { 'Very High':0, High:1, Moderate:2, Low:3 }

function riskBadge(risk) {
  const map = {
    'Very High': 'bg-red-100 text-red-700 border-red-200',
    'High':      'bg-orange-100 text-orange-700 border-orange-200',
    'Moderate':  'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Low':       'bg-green-100 text-green-700 border-green-200',
  }
  return <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', map[risk] ?? 'bg-gray-100 text-gray-600 border-gray-200')}>{risk}</span>
}

function statusBadge(status) {
  const map = {
    Open:         'bg-red-50 text-red-600 border-red-200',
    Overdue:      'bg-red-200 text-red-800 border-red-300',
    'In Progress':'bg-blue-100 text-blue-700 border-blue-200',
    Closed:       'bg-gray-100 text-gray-500 border-gray-200',
  }
  return <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', map[status] ?? 'bg-gray-100 text-gray-500 border-gray-200')}>{status}</span>
}

const AREAS = [...new Set(SCA_FINDINGS.map(f => f.area))]
const STATUSES = [...new Set(SCA_FINDINGS.map(f => f.status))]

const KPI_DEFS = [
  { label:'Very High', risk:'Very High', count:1,  color:'text-red-600',    bg:'bg-red-50 border-red-200 hover:bg-red-100' },
  { label:'High',      risk:'High',      count:4,  color:'text-orange-500', bg:'bg-orange-50 border-orange-200 hover:bg-orange-100' },
  { label:'Moderate',  risk:'Moderate',  count:4,  color:'text-yellow-600', bg:'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' },
  { label:'Low / No Risk', risk:'Low',   count:2,  color:'text-green-600',  bg:'bg-green-50 border-green-200 hover:bg-green-100' },
]

// Totals for areas table
const areasTotals = SCA_AREAS.reduce((acc, a) => ({ total: acc.total + a.total, compliant: acc.compliant + a.compliant }), { total:0, compliant:0 })

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SCA() {
  const navigate = useNavigate()

  const [filterRisk,   setFilterRisk]   = useState(null)
  const [filterArea,   setFilterArea]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [expandedId,   setExpandedId]   = useState(null)

  const findings = [...SCA_FINDINGS]
    .filter(f => !filterRisk   || f.risk === filterRisk)
    .filter(f => !filterArea   || f.area === filterArea)
    .filter(f => !filterStatus || f.status === filterStatus)
    .sort((a,b) => (RISK_ORDER[a.risk] ?? 99) - (RISK_ORDER[b.risk] ?? 99))

  return (
    <div className="p-6 space-y-6">
      {/* Audit header card */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500"/>
              <h1 className="text-xl font-bold text-gray-900">Supplier Compliance Audit</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">Vantage Advisory · July 2026 · 12 findings across 12 vendors</p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <div className="font-semibold text-gray-600 text-sm">Non-Compliant T&Cs</div>
            <div className="text-2xl font-bold text-red-600">42 <span className="text-base font-normal text-gray-400">/ 90</span></div>
          </div>
        </div>
        {/* KPI tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {KPI_DEFS.map(k => (
            <button
              key={k.label}
              onClick={() => setFilterRisk(filterRisk === k.risk ? null : k.risk)}
              className={cn('border rounded-xl p-3 text-left transition-all cursor-pointer', k.bg, filterRisk === k.risk && 'ring-2 ring-blue-400')}
            >
              <div className={cn('text-2xl font-bold', k.color)}>
                {SCA_FINDINGS.filter(f => f.risk === k.risk).length}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">{k.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Compliance by Area table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Compliance by Area</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                {['Area','Total T&Cs','Compliant','Non-Compliant','Compliance %',''].map((h,i) => (
                  <th key={i} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {SCA_AREAS.map(a => {
                const nonComp = a.total - a.compliant
                const pct     = Math.round((a.compliant / a.total) * 100)
                const isSelected = filterArea === a.area
                return (
                  <tr
                    key={a.area}
                    onClick={() => setFilterArea(isSelected ? '' : a.area)}
                    className={cn(
                      'cursor-pointer hover:bg-blue-50 transition-colors',
                      isSelected && 'bg-blue-50 border-l-4 border-l-blue-500'
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{a.area}</td>
                    <td className="px-4 py-3 text-gray-600">{a.total}</td>
                    <td className="px-4 py-3 text-green-600 font-semibold">{a.compliant}</td>
                    <td className="px-4 py-3 text-red-500 font-semibold">{nonComp}</td>
                    <td className="px-4 py-3 text-gray-700 font-semibold w-16">{pct}%</td>
                    <td className="px-4 py-3 w-44">
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width:`${pct}%` }}/>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {/* Totals row */}
              <tr className="bg-gray-50 font-semibold text-gray-800">
                <td className="px-4 py-3">Totals</td>
                <td className="px-4 py-3">{areasTotals.total}</td>
                <td className="px-4 py-3 text-green-600">{areasTotals.compliant}</td>
                <td className="px-4 py-3 text-red-500">{areasTotals.total - areasTotals.compliant}</td>
                <td className="px-4 py-3">{Math.round((areasTotals.compliant / areasTotals.total) * 100)}%</td>
                <td className="px-4 py-3">
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width:`${Math.round((areasTotals.compliant / areasTotals.total) * 100)}%` }}/>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Findings table with filters */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-base font-semibold text-gray-800 flex-1">Findings</h2>
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterArea}
              onChange={e => setFilterArea(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option value="">All Areas</option>
              {AREAS.map(a => <option key={a}>{a}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            {(filterRisk || filterArea || filterStatus) && (
              <button
                onClick={() => { setFilterRisk(null); setFilterArea(''); setFilterStatus('') }}
                className="text-xs text-blue-600 hover:underline px-2 py-1.5"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                {['Vendor','Area','Finding','Risk','Status','Recommendation'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {findings.map(f => (
                <>
                  <tr
                    key={f.id}
                    onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      <button
                        onClick={e => { e.stopPropagation(); navigate('/vendors', { state: { openVendorName: f.vendor } }) }}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {f.vendor}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px]">
                      <button
                        onClick={e => { e.stopPropagation(); setFilterArea(filterArea === f.area ? '' : f.area) }}
                        className="text-left hover:text-blue-600 hover:underline transition-colors"
                      >
                        {f.area}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-800 max-w-[260px]">{f.finding}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); navigate('/risks', { state: { filterLevel: f.risk } }) }}
                        className="focus:outline-none"
                      >
                        {riskBadge(f.risk)}
                      </button>
                    </td>
                    <td className="px-4 py-3">{statusBadge(f.status)}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[240px] text-xs">{f.recommendation}</td>
                  </tr>
                  {expandedId === f.id && (
                    <tr key={`${f.id}-detail`} className="bg-blue-50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Full Finding</div>
                            <div className="text-gray-800">{f.finding}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Auditor Notes / Recommendation</div>
                            <div className="text-gray-800">{f.recommendation}</div>
                          </div>
                          <div className="flex flex-wrap gap-6">
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Area</div>
                              <div className="text-gray-800">{f.area}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Vendor</div>
                              <div className="text-gray-800">{f.vendor}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Risk Level</div>
                              <div>{riskBadge(f.risk)}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</div>
                              <div>{statusBadge(f.status)}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {findings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">No findings match the selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <span className="font-semibold">Top concerns:</span> Data Privacy &amp; Info Security (10/29 compliant), Immigration &amp; Labor (3/10), Insurance &amp; Liability (6/11). <span className="font-semibold">GlobalPay Financial</span> rated <span className="font-bold text-red-700">Very High</span> — immediate audit required.
      </div>
    </div>
  )
}
