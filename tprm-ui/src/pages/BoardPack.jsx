import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Download, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Aggregated data (mirrors other pages) ────────────────────────────────────

const REPORT_DATE = '09 September 2026'
const PERIOD = 'Q3 2026 (Jul – Sep 2026)'

const RISK_SUMMARY = {
  total: 12, veryHigh: 2, high: 5, moderate: 3, low: 1, veryLow: 1,
  openIssues: 5, overdueIssues: 1, escalations: 2,
  newThisPeriod: 2, closedThisPeriod: 1,
}
const VENDOR_SUMMARY = {
  total: 6, tier1: 2, tier2: 2, tier3: 1, tier4: 1,
  activeReviews: 2, overdue: 1,
}
const INCIDENT_SUMMARY = {
  active: 2, critical: 1, regulatoryBreaches: 1,
  newThisPeriod: 3, resolvedThisPeriod: 1,
}
const EVIDENCE_SUMMARY = {
  total: 12, expired: 3, expiringSoon: 2, valid: 7,
}
const KRI_BREACHES = [
  { name:'% Critical Vendors with Overdue Assessments', value:'31%', threshold:'25%', trend:'↑' },
  { name:'Open High/Very High Risks',                   value:'7',   threshold:'6',   trend:'↑' },
]
const TOP_RISKS = [
  { id:'r1', name:'Unpatched vulnerabilities in cloud platform', vendor:'CloudSystems Inc', residual:14, level:'High',      treat:'Mitigate', status:'Open' },
  { id:'r3', name:'PCI-DSS compliance gap – network segmentation',vendor:'GlobalPay Corp',  residual:12, level:'High',      treat:'Transfer', status:'In Progress' },
  { id:'r8', name:'Ransomware impact on operational continuity',  vendor:'CloudSystems Inc', residual:16, level:'Very High', treat:'Mitigate', status:'Open' },
  { id:'r5', name:'Single point of failure – cloud dependency',   vendor:'CloudSystems Inc', residual:14, level:'High',      treat:'Mitigate', status:'In Progress' },
  { id:'r2', name:'Inadequate data encryption at rest',           vendor:'DataSecure LLC',   residual:10, level:'Moderate', treat:'Mitigate', status:'In Progress' },
]
const APPETITE_BREACHES = [
  { risk:'Ransomware impact on operational continuity',      residual:16, maxResidual:14, category:'Operational Resilience' },
  { risk:'PCI-DSS compliance gap – network segmentation',   residual:12, maxResidual: 6, category:'Compliance' },
  { risk:'Third-party AI tool data retention gap',           residual:12, maxResidual:10, category:'Data Privacy' },
]
const PENDING_DECISIONS = [
  { risk:'Ransomware impact on operational continuity', type:'Mandatory Mitigation', deadline:'2026-10-20', owner:'CISO' },
  { risk:'AI tool data retention gap',                  type:'Risk Acceptance / Transfer', deadline:'2026-10-01', owner:'DPO' },
]
const REGULATORY_HIGHLIGHTS = [
  { framework:'DORA Art.19', status:'Notified', notes:'72h ICT incident notification submitted for CloudSystems ransomware incident on 10 Aug 2026.' },
  { framework:'GDPR Art.33', status:'Below threshold', notes:'DataSecure IAM misconfiguration — scope confirmed non-PII; no notification required.' },
  { framework:'PCI-DSS Req.12.8', status:'Action required', notes:'GlobalPay PCI RoC expired. Remediation plan under review.' },
]
const UPCOMING_ACTIONS = [
  { action:'GlobalPay PCI remediation plan review',         owner:'R. Brown',  due:'2026-09-20', priority:'Critical' },
  { action:'CloudSystems ransomware — DR test validation',  owner:'S. Kim',    due:'2026-09-30', priority:'High' },
  { action:'DataSecure encryption rollout sign-off',        owner:'T. Wilson', due:'2026-09-20', priority:'High' },
  { action:'AI tool DPA review and risk acceptance',        owner:'R. Brown',  due:'2026-10-01', priority:'High' },
  { action:'3 evidence documents approaching expiry',       owner:'T. Wilson', due:'2026-10-09', priority:'Moderate' },
]

const SECTIONS = [
  { id:'exec',       label:'Executive Summary' },
  { id:'risk',       label:'Risk Portfolio Overview' },
  { id:'appetite',   label:'Risk Appetite & Breaches' },
  { id:'vendor',     label:'Vendor Portfolio Status' },
  { id:'incident',   label:'Incidents & Regulatory' },
  { id:'evidence',   label:'Evidence & Compliance' },
  { id:'kri',        label:'KRI Performance' },
  { id:'actions',    label:'Decisions Required & Actions' },
]

const LEVEL_COLORS = {
  'Very High': 'text-red-600', 'High': 'text-orange-500',
  'Moderate': 'text-yellow-600', 'Low': 'text-blue-600', 'Very Low': 'text-green-600',
}
const PRI_COLORS = {
  'Critical': 'bg-red-100 text-red-700', 'High': 'bg-orange-100 text-orange-700',
  'Moderate': 'bg-yellow-100 text-yellow-700', 'Low': 'bg-blue-100 text-blue-700',
}

function SectionCard({ id, title, children, navigate, navPath, navState }) {
  const [open, setOpen] = useState(true)
  return (
    <div id={id} className="bg-white border border-gray-200 rounded-lg overflow-hidden print:break-inside-avoid">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <button className="flex items-center gap-2" onClick={() => setOpen(v=>!v)}>
          {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-400"/> : <ChevronRight className="w-3.5 h-3.5 text-gray-400"/>}
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        </button>
        {navPath && (
          <button onClick={() => navigate(navPath, navState ? {state:navState} : {})} className="text-[10px] text-blue-500 hover:underline">View detail →</button>
        )}
      </div>
      {open && <div className="px-5 py-4">{children}</div>}
    </div>
  )
}

function Stat({ label, value, color, sub }) {
  return (
    <div className="text-center">
      <div className={cn('text-2xl font-bold', color||'text-gray-800')}>{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-gray-400">{sub}</div>}
    </div>
  )
}

export default function BoardPack() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('exec')
  const [selectedSections, setSelectedSections] = useState(new Set(SECTIONS.map(s=>s.id)))

  function toggleSection(id) {
    setSelectedSections(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function handlePrint() { window.print() }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Board Pack Generator</h1>
          <p className="text-xs text-gray-400 mt-0.5">One-click executive summary — auto-compiled from live platform data</p>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-1.5 bg-[#0176d3] text-white text-xs font-medium px-3 py-2 rounded hover:bg-blue-700 print:hidden">
          <Download className="w-3.5 h-3.5" /> Print / Export PDF
        </button>
      </div>

      {/* Section selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 print:hidden">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Sections to include:</p>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => toggleSection(s.id)}
              className={cn('text-[10px] px-2.5 py-1 rounded-full border transition-colors', selectedSections.has(s.id) ? 'bg-blue-100 border-blue-300 text-blue-700 font-semibold' : 'bg-white border-gray-200 text-gray-400')}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cover */}
      <div className="bg-[#0176d3] text-white rounded-xl px-8 py-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-2">TPRM Platform</div>
            <h2 className="text-2xl font-bold mb-1">Third-Party Risk Management</h2>
            <h3 className="text-lg font-semibold opacity-80">Board & Executive Report</h3>
            <p className="text-sm opacity-60 mt-3">{PERIOD}</p>
          </div>
          <div className="text-right text-sm opacity-70">
            <p>Report date</p>
            <p className="font-bold text-base text-white opacity-100">{REPORT_DATE}</p>
            <p className="mt-3">Classification</p>
            <p className="font-bold text-base text-white opacity-100">CONFIDENTIAL</p>
          </div>
        </div>
      </div>

      {/* Exec summary */}
      {selectedSections.has('exec') && (
        <SectionCard id="exec" title="Executive Summary" navigate={navigate}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-5 pb-5 border-b border-gray-100">
            <Stat label="Active Risks"        value={RISK_SUMMARY.total}       color="text-gray-800" />
            <Stat label="Very High / High"    value={`${RISK_SUMMARY.veryHigh + RISK_SUMMARY.high}`} color="text-red-600" sub={`+${RISK_SUMMARY.newThisPeriod} new this period`}/>
            <Stat label="Active Incidents"    value={INCIDENT_SUMMARY.active}  color={INCIDENT_SUMMARY.critical > 0 ? 'text-red-600' : 'text-gray-800'} sub={`${INCIDENT_SUMMARY.critical} critical`}/>
            <Stat label="Appetite Breaches"   value={APPETITE_BREACHES.length} color={APPETITE_BREACHES.length > 0 ? 'text-red-600' : 'text-green-600'} sub="require board decision"/>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-xs bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="text-red-800">
                <strong>Critical:</strong> CloudSystems Inc ransomware incident (10 Aug 2026) is under active containment. DORA 72h notification submitted. Residual risk re-scored to Very High (16). DR validation required by 30 Sep 2026.
              </div>
            </div>
            <div className="flex items-start gap-3 text-xs bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-amber-800">
                <strong>Action required:</strong> {APPETITE_BREACHES.length} risks breach defined appetite thresholds. {PENDING_DECISIONS.length} formal decisions (accept / transfer / mitigate) are pending Board or CRO sign-off.
              </div>
            </div>
            <div className="flex items-start gap-3 text-xs bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
              <CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-blue-800">
                <strong>Progress:</strong> AES-256 encryption rollout at DataSecure is 50% complete (target 30 Sep). DPA v2 with DataSecure sub-processors executed. Multi-cloud DR pilot scoping approved.
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Risk portfolio */}
      {selectedSections.has('risk') && (
        <SectionCard id="risk" title="Risk Portfolio Overview" navigate={navigate} navPath="/risks">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-5 pb-5 border-b border-gray-100">
            {[
              { label:'Very High', value:RISK_SUMMARY.veryHigh, color:'text-red-600' },
              { label:'High',      value:RISK_SUMMARY.high,     color:'text-orange-500' },
              { label:'Moderate',  value:RISK_SUMMARY.moderate, color:'text-yellow-600' },
              { label:'Low',       value:RISK_SUMMARY.low,      color:'text-blue-600' },
              { label:'Very Low',  value:RISK_SUMMARY.veryLow,  color:'text-green-600' },
              { label:'Total',     value:RISK_SUMMARY.total,    color:'text-gray-800' },
            ].map(s => <Stat key={s.label} {...s} />)}
          </div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Top 5 Risks by Residual Score</p>
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Risk','Vendor','Residual','Level','Treatment','Status'].map(h=><th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody>
              {TOP_RISKS.map(r=>(
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <button className="text-blue-500 hover:underline text-left" onClick={()=>navigate('/risks',{state:{openRiskId:r.id}})}>{r.name}</button>
                  </td>
                  <td className="px-3 py-2 text-gray-500">{r.vendor}</td>
                  <td className="px-3 py-2 font-bold text-gray-800">{r.residual}</td>
                  <td className="px-3 py-2"><span className={cn('font-semibold', LEVEL_COLORS[r.level])}>{r.level}</span></td>
                  <td className="px-3 py-2 text-gray-600">{r.treat}</td>
                  <td className="px-3 py-2 text-gray-600">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      {/* Appetite */}
      {selectedSections.has('appetite') && (
        <SectionCard id="appetite" title="Risk Appetite & Breaches" navigate={navigate} navPath="/appetite">
          {APPETITE_BREACHES.length === 0
            ? <p className="text-xs text-green-600">All risks are within defined appetite thresholds.</p>
            : (
              <>
                <p className="text-xs text-red-700 mb-3"><strong>{APPETITE_BREACHES.length} risks exceed board-defined appetite thresholds</strong> — formal decisions required before next board meeting.</p>
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>{['Risk','Category','Residual','Max Allowed','Excess'].map(h=><th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {APPETITE_BREACHES.map((b,i)=>(
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-3 py-2 text-gray-800">{b.risk}</td>
                        <td className="px-3 py-2 text-gray-500">{b.category}</td>
                        <td className="px-3 py-2 font-bold text-red-600">{b.residual}</td>
                        <td className="px-3 py-2 text-gray-600">≤{b.maxResidual}</td>
                        <td className="px-3 py-2 text-red-500 font-semibold">+{b.residual - b.maxResidual}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )
          }
        </SectionCard>
      )}

      {/* Vendors */}
      {selectedSections.has('vendor') && (
        <SectionCard id="vendor" title="Vendor Portfolio Status" navigate={navigate} navPath="/vendors">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <Stat label="Total Vendors" value={VENDOR_SUMMARY.total}        color="text-gray-800" />
            <Stat label="Tier 1"        value={VENDOR_SUMMARY.tier1}        color="text-red-600" />
            <Stat label="Active Reviews" value={VENDOR_SUMMARY.activeReviews} color="text-blue-600" />
            <Stat label="Overdue Reviews" value={VENDOR_SUMMARY.overdue}    color={VENDOR_SUMMARY.overdue > 0 ? 'text-amber-500' : 'text-green-600'} />
          </div>
          <p className="text-xs text-gray-600">CloudSystems Inc moved to <strong>"Under Review"</strong> status following the ransomware incident. Continuous monitoring frequency increased. Formal review scheduled 30 Sep 2026.</p>
        </SectionCard>
      )}

      {/* Incidents */}
      {selectedSections.has('incident') && (
        <SectionCard id="incident" title="Incidents & Regulatory Notifications" navigate={navigate} navPath="/incidents">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Stat label="Active Incidents"      value={INCIDENT_SUMMARY.active}  color="text-gray-800" />
            <Stat label="Critical"              value={INCIDENT_SUMMARY.critical} color={INCIDENT_SUMMARY.critical>0?'text-red-600':'text-green-600'} />
            <Stat label="Reg Deadline Breached" value={INCIDENT_SUMMARY.regulatoryBreaches} color={INCIDENT_SUMMARY.regulatoryBreaches>0?'text-red-600':'text-green-600'} />
          </div>
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Framework','Status','Notes'].map(h=><th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody>
              {REGULATORY_HIGHLIGHTS.map(r=>(
                <tr key={r.framework} className="border-b border-gray-100">
                  <td className="px-3 py-2 font-semibold text-gray-700 whitespace-nowrap">{r.framework}</td>
                  <td className="px-3 py-2">
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', r.status==='Notified'?'bg-green-100 text-green-700':r.status==='Action required'?'bg-red-100 text-red-700':'bg-gray-100 text-gray-500')}>{r.status}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      {/* Evidence */}
      {selectedSections.has('evidence') && (
        <SectionCard id="evidence" title="Evidence & Compliance Register" navigate={navigate} navPath="/evidence">
          <div className="grid grid-cols-4 gap-4">
            <Stat label="Total Documents" value={EVIDENCE_SUMMARY.total}        color="text-gray-800" />
            <Stat label="Expired"         value={EVIDENCE_SUMMARY.expired}      color={EVIDENCE_SUMMARY.expired>0?'text-red-600':'text-green-600'} />
            <Stat label="Expiring ≤30d"   value={EVIDENCE_SUMMARY.expiringSoon} color={EVIDENCE_SUMMARY.expiringSoon>0?'text-amber-500':'text-green-600'} />
            <Stat label="Valid"           value={EVIDENCE_SUMMARY.valid}        color="text-green-600" />
          </div>
          {EVIDENCE_SUMMARY.expired > 0 && (
            <p className="text-xs text-red-700 mt-3">{EVIDENCE_SUMMARY.expired} documents have expired — immediate renewal required (PCI-DSS RoC, SLA Agreement, Security Policy).</p>
          )}
        </SectionCard>
      )}

      {/* KRI */}
      {selectedSections.has('kri') && (
        <SectionCard id="kri" title="KRI Performance" navigate={navigate} navPath="/kri">
          {KRI_BREACHES.length === 0
            ? <p className="text-xs text-green-600">All KRIs within threshold.</p>
            : (
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>{['KRI','Current Value','Threshold','Trend'].map(h=><th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {KRI_BREACHES.map(k=>(
                    <tr key={k.name} className="border-b border-gray-100">
                      <td className="px-3 py-2 text-gray-800">{k.name}</td>
                      <td className="px-3 py-2 font-bold text-red-600">{k.value}</td>
                      <td className="px-3 py-2 text-gray-500">{k.threshold}</td>
                      <td className="px-3 py-2 font-bold text-red-500">{k.trend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </SectionCard>
      )}

      {/* Actions */}
      {selectedSections.has('actions') && (
        <SectionCard id="actions" title="Decisions Required & Upcoming Actions" navigate={navigate} navPath="/approvals">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Pending Board / CRO Decisions</p>
          <table className="w-full text-xs mb-5">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Risk','Decision Required','Deadline','Owner'].map(h=><th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody>
              {PENDING_DECISIONS.map((d,i)=>(
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-gray-800">{d.risk}</td>
                  <td className="px-3 py-2 text-gray-600">{d.type}</td>
                  <td className="px-3 py-2 font-medium text-amber-600">{d.deadline}</td>
                  <td className="px-3 py-2 text-gray-600">{d.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Next 30-Day Action Plan</p>
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Action','Owner','Due','Priority'].map(h=><th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody>
              {UPCOMING_ACTIONS.map((a,i)=>(
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-gray-800">{a.action}</td>
                  <td className="px-3 py-2 text-gray-500">{a.owner}</td>
                  <td className="px-3 py-2 text-gray-600">{a.due}</td>
                  <td className="px-3 py-2"><span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', PRI_COLORS[a.priority]||'bg-gray-100 text-gray-500')}>{a.priority}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      {/* Footer */}
      <div className="text-[10px] text-gray-400 text-center py-2 print:block">
        TPRM Platform · {REPORT_DATE} · CONFIDENTIAL — FOR BOARD USE ONLY
      </div>
    </div>
  )
}
