import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Plus, X, Search, AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Data ─────────────────────────────────────────────────────────────────────

const VENDORS = ['CloudSystems Inc','DataSecure LLC','GlobalPay Corp','LegalEagle LLP','FastShip Logistics','MedConsult Group']

const ALERT_TYPES = [
  'News Alert',        // Negative press
  'Credit Event',      // Rating downgrade, late filing
  'Regulatory Action', // Regulatory fine, enforcement notice
  'Cyber Threat Intel',// CVE, CISA advisory, breach at similar firms
  'Service Disruption',// Status page downtime, SLA breach
  'Sanctions Screen',  // Ownership/sanctions check result
  'Financial Signal',  // Annual results, profit warning
  'OSINT Finding',     // Other open-source intelligence
]

const SEVERITY = ['Critical','High','Moderate','Low']
const SEV_COLORS = {
  Critical: { badge:'bg-red-100 text-red-700 border-red-200',    dot:'bg-red-500' },
  High:     { badge:'bg-orange-100 text-orange-700 border-orange-200', dot:'bg-orange-500' },
  Moderate: { badge:'bg-yellow-100 text-yellow-700 border-yellow-200', dot:'bg-yellow-500' },
  Low:      { badge:'bg-blue-100 text-blue-700 border-blue-200',   dot:'bg-blue-500' },
}
const ACTION_COLORS = {
  'Escalate':        'bg-red-100 text-red-700',
  'Risk Re-score':   'bg-orange-100 text-orange-700',
  'Monitor':         'bg-blue-100 text-blue-700',
  'No Action':       'bg-gray-100 text-gray-500',
  'Vendor Contact':  'bg-purple-100 text-purple-700',
}

const INIT_ALERTS = [
  {
    id:'cm1', ts:'2026-09-09T07:45', vendor:'CloudSystems Inc', type:'Cyber Threat Intel', severity:'Critical',
    title:'CISA advisory: Active exploitation of CVE-2026-3344 affecting AWS EC2 metadata service',
    body:'CISA issued advisory AA26-251A. CVE-2026-3344 allows server-side request forgery via EC2 Instance Metadata Service v1. CloudSystems uses AWS EC2. Patch available in AWS AMI update 2026-09-08. TPRM validated CloudSystems is running affected AMI.',
    source:'CISA Advisory AA26-251A', sourceUrl:'',
    action:'Escalate', actionedBy:'S. Kim', actionDate:'2026-09-09',
    linkedRiskId:'r1', linkedRisk:'Unpatched vulnerabilities in cloud platform',
    status:'Open',
  },
  {
    id:'cm2', ts:'2026-09-07T14:20', vendor:'GlobalPay Corp', type:'Regulatory Action', severity:'High',
    title:'FCA issued £2.1M fine to GlobalPay Corp for AML control failures',
    body:'Financial Conduct Authority published Final Notice dated 05 Sep 2026 fining GlobalPay Corp £2.1M for anti-money laundering control deficiencies. While unrelated to TPRM scope, indicates broader control environment weakness and possible reputational risk to our relationship.',
    source:'FCA Final Notice 2026/109', sourceUrl:'',
    action:'Risk Re-score', actionedBy:'R. Brown', actionDate:'2026-09-08',
    linkedRiskId:'r3', linkedRisk:'PCI-DSS compliance gap – network segmentation',
    status:'In Review',
  },
  {
    id:'cm3', ts:'2026-09-05T09:30', vendor:'DataSecure LLC', type:'News Alert', severity:'Moderate',
    title:'DataSecure LLC announces acquisition by TechVault Group',
    body:'DataSecure LLC announced it is being acquired by TechVault Group pending regulatory approval (expected Q1 2027). TechVault has no known GDPR or PCI-DSS compliance issues. Contract review required to confirm change-of-control clause provisions and sub-processor implications.',
    source:'PR Newswire', sourceUrl:'',
    action:'Vendor Contact', actionedBy:'T. Wilson', actionDate:'2026-09-06',
    linkedRiskId:'', linkedRisk:'',
    status:'In Review',
  },
  {
    id:'cm4', ts:'2026-09-03T11:00', vendor:'FastShip Logistics', type:'Service Disruption', severity:'Low',
    title:'FastShip Logistics reported 6-hour courier network outage (02 Sep)',
    body:'FastShip Logistics status page reported network outage affecting UK South region from 14:00–20:00 UTC on 02 Sep 2026. No SLA breach for our contractual deliveries. RCA pending from vendor.',
    source:'FastShip status page', sourceUrl:'',
    action:'Monitor', actionedBy:'J. Lee', actionDate:'2026-09-03',
    linkedRiskId:'', linkedRisk:'',
    status:'Closed',
  },
  {
    id:'cm5', ts:'2026-09-02T08:15', vendor:'MedConsult Group', type:'Financial Signal', severity:'Low',
    title:'MedConsult Group files profit warning — FY26 revenue guidance cut by 18%',
    body:'MedConsult Group filed a profit warning citing reduced consulting revenues and rising costs. Engagement is low-value (£210K). No immediate risk but financial instability should be noted in next annual review.',
    source:'LSE Regulatory News', sourceUrl:'',
    action:'No Action', actionedBy:'M. Patel', actionDate:'2026-09-02',
    linkedRiskId:'', linkedRisk:'',
    status:'Closed',
  },
  {
    id:'cm6', ts:'2026-08-28T16:45', vendor:'LegalEagle LLP', type:'OSINT Finding', severity:'Moderate',
    title:'Key partner at LegalEagle LLP named in unrelated civil litigation',
    body:'Open-source search identified a civil complaint filed against a senior partner at LegalEagle LLP in connection with a personal matter. No direct implication to our engagement; however, reputational monitoring appropriate.',
    source:'Court filing search', sourceUrl:'',
    action:'Monitor', actionedBy:'T. Wilson', actionDate:'2026-08-29',
    linkedRiskId:'', linkedRisk:'',
    status:'Monitoring',
  },
]

const BLANK = { vendor:'CloudSystems Inc', type:'News Alert', severity:'Moderate', title:'', body:'', source:'', action:'Monitor', actionedBy:'', actionDate:'', linkedRiskId:'', linkedRisk:'', status:'Open' }

const STATUS_COLORS = {
  'Open':       'bg-red-100 text-red-700',
  'In Review':  'bg-amber-100 text-amber-700',
  'Monitoring': 'bg-blue-100 text-blue-700',
  'Closed':     'bg-green-100 text-green-700',
}

export default function ContinuousMonitoring() {
  const navigate = useNavigate()
  const [alerts, setAlerts]       = useLocalStorage('tprm:monitoring', INIT_ALERTS)
  const [q, setQ]                 = useState('')
  const [filterV, setFilterV]     = useState('')
  const [filterSev, setFilterSev] = useState('')
  const [filterSt, setFilterSt]   = useState('')
  const [filterType, setFilterType] = useState('')
  const [expandedId, setExpandedId] = useState('cm1')
  const [modal, setModal]         = useState(null)
  const [form, setForm]           = useState(BLANK)

  const filtered = alerts.filter(a => {
    if (q && !a.title.toLowerCase().includes(q.toLowerCase()) && !a.vendor.toLowerCase().includes(q.toLowerCase()) && !a.body.toLowerCase().includes(q.toLowerCase())) return false
    if (filterV    && a.vendor   !== filterV)    return false
    if (filterSev  && a.severity !== filterSev)  return false
    if (filterSt   && a.status   !== filterSt)   return false
    if (filterType && a.type     !== filterType)  return false
    return true
  }).sort((a,b) => b.ts.localeCompare(a.ts))

  const openAlerts = alerts.filter(a => a.status === 'Open' || a.status === 'In Review')
  const critical   = alerts.filter(a => a.severity === 'Critical' && a.status !== 'Closed')

  function openAdd()   { setForm({...BLANK}); setModal({mode:'add'}) }
  function save() {
    if (!form.title.trim()) return
    if (modal.mode === 'add') {
      setAlerts(prev => [{ ...form, id:'cm'+Math.random().toString(36).slice(2,8), ts: new Date().toISOString().slice(0,16) }, ...prev])
    } else {
      setAlerts(prev => prev.map(a => a.id === modal.id ? { ...form, id: modal.id } : a))
    }
    setModal(null)
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Continuous Monitoring</h1>
          <p className="text-xs text-gray-400 mt-0.5">Live alert feed — news, regulatory actions, cyber threat intelligence, financial signals</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <RefreshCw className="w-3 h-3" />
            <span>Manual log · API feeds configurable</span>
          </div>
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#0176d3] text-white text-xs font-medium px-3 py-2 rounded hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" /> Log Alert
          </button>
        </div>
      </div>

      {/* Critical banner */}
      {critical.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700"><strong>{critical.length} critical alert{critical.length > 1?'s require':'requires'} immediate action.</strong> Review and escalate to the Risk Committee.</p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Open / In Review', value: openAlerts.length,  color: openAlerts.length > 0 ? 'text-amber-500' : 'text-green-600' },
          { label:'Critical',         value: critical.length,     color: critical.length > 0 ? 'text-red-600' : 'text-green-600' },
          { label:'Total Alerts',     value: alerts.length,       color: 'text-gray-800' },
          { label:'Closed',           value: alerts.filter(a=>a.status==='Closed').length, color: 'text-green-600' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{k.label}</div>
            <div className={cn('text-2xl font-bold', k.color)}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400" placeholder="Search alerts, vendors…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterV} onChange={e=>setFilterV(e.target.value)}>
          <option value="">All Vendors</option>
          {VENDORS.map(v=><option key={v}>{v}</option>)}
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterType} onChange={e=>setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {ALERT_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterSev} onChange={e=>setFilterSev(e.target.value)}>
          <option value="">All Severity</option>
          {SEVERITY.map(s=><option key={s}>{s}</option>)}
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterSt} onChange={e=>setFilterSt(e.target.value)}>
          <option value="">All Status</option>
          {['Open','In Review','Monitoring','Closed'].map(s=><option key={s}>{s}</option>)}
        </select>
        {(q||filterV||filterType||filterSev||filterSt) && <button onClick={()=>{setQ('');setFilterV('');setFilterType('');setFilterSev('');setFilterSt('')}} className="text-xs text-blue-500 hover:text-blue-700 px-2">Clear</button>}
      </div>

      {/* Alert cards */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-8 text-center text-xs text-gray-400">No alerts match filters</div>
        )}
        {filtered.map(a => {
          const sev    = SEV_COLORS[a.severity] || SEV_COLORS.Low
          const isOpen = expandedId === a.id
          return (
            <div key={a.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
                onClick={() => setExpandedId(v => v === a.id ? null : a.id)}
              >
                <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', sev.dot)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', sev.badge)}>{a.severity}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a.type}</span>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', STATUS_COLORS[a.status]||'bg-gray-100 text-gray-500')}>{a.status}</span>
                    {a.action && <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', ACTION_COLORS[a.action]||'bg-gray-100 text-gray-500')}>{a.action}</span>}
                  </div>
                  <div className="text-xs font-semibold text-gray-800 leading-snug">{a.title}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-3">
                    <button className="text-blue-500 hover:underline" onClick={e=>{e.stopPropagation();navigate('/vendors',{state:{openVendorName:a.vendor}})}}>{a.vendor}</button>
                    <span>{a.ts.replace('T',' ')}</span>
                    {a.actionedBy && <span>Actioned: {a.actionedBy}</span>}
                  </div>
                </div>
                <button onClick={e=>{e.stopPropagation();setForm({...a});setModal({mode:'edit',id:a.id})}} className="text-[10px] text-blue-500 hover:underline shrink-0 mt-0.5">Edit</button>
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 bg-gray-50/40 px-4 py-4 space-y-3 text-xs">
                  <p className="text-gray-700 leading-relaxed">{a.body}</p>
                  <div className="flex flex-wrap gap-4">
                    <div><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mr-1">Source:</span><span className="text-gray-600">{a.source || '—'}</span></div>
                    <div><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mr-1">Action:</span><span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', ACTION_COLORS[a.action]||'')}>{a.action}</span></div>
                    {a.actionedBy && <div><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mr-1">By:</span><span className="text-gray-600">{a.actionedBy} · {a.actionDate}</span></div>}
                  </div>
                  {a.linkedRisk && (
                    <div><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mr-1">Linked Risk:</span>
                      <button className="text-blue-500 hover:underline" onClick={()=>navigate('/risks',{state:{openRiskId:a.linkedRiskId}})}>{a.linkedRisk}</button>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={()=>navigate('/vendors',{state:{openVendorName:a.vendor}})} className="text-xs text-blue-500 hover:underline">View vendor →</button>
                    {a.linkedRiskId && <button onClick={()=>navigate('/risks',{state:{openRiskId:a.linkedRiskId}})} className="text-xs text-blue-500 hover:underline">View risk →</button>}
                    {a.severity==='Critical' || a.severity==='High'
                      ? <button onClick={()=>navigate('/incidents')} className="text-xs text-blue-500 hover:underline">Log incident →</button>
                      : null}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="text-[10px] text-gray-400 px-1">
        Manual log mode — integrate with BitSight, SecurityScorecard, Moody's RiskCalc, OSINT feeds, or CISA KEV in production.
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">{modal.mode==='add'?'Log Alert':'Edit Alert'}</h3>
              <button onClick={()=>setModal(null)}><X className="w-4 h-4 text-gray-400"/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label:'Vendor',    key:'vendor',   type:'select', opts: VENDORS.map(v=>({val:v,label:v})) },
                  { label:'Alert Type',key:'type',     type:'select', opts: ALERT_TYPES.map(t=>({val:t,label:t})) },
                  { label:'Severity',  key:'severity', type:'select', opts: SEVERITY.map(s=>({val:s,label:s})) },
                  { label:'Status',    key:'status',   type:'select', opts:['Open','In Review','Monitoring','Closed'].map(s=>({val:s,label:s})) },
                  { label:'Title', key:'title', type:'text', span:2 },
                  { label:'Detail', key:'body', type:'textarea', span:2 },
                  { label:'Source',    key:'source',     type:'text' },
                  { label:'Action',    key:'action',     type:'select', opts:['Escalate','Risk Re-score','Vendor Contact','Monitor','No Action'].map(s=>({val:s,label:s})) },
                  { label:'Actioned By', key:'actionedBy', type:'text' },
                  { label:'Action Date', key:'actionDate', type:'date' },
                  { label:'Linked Risk Name', key:'linkedRisk', type:'text', span:2 },
                ].map(f => (
                  <div key={f.key} className={f.span===2?'col-span-2':''}>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.label}</label>
                    {f.type==='select'
                      ? <select className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400" value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}>
                          {f.opts.map(o=><option key={o.val} value={o.val}>{o.label}</option>)}
                        </select>
                      : f.type==='textarea'
                      ? <textarea rows={3} className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400 resize-none" value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} />
                      : <input type={f.type} className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400" value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} />
                    }
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={()=>setModal(null)} className="text-xs border border-gray-200 rounded px-4 py-2 hover:bg-gray-50">Cancel</button>
              <button onClick={save} className="text-xs bg-[#0176d3] text-white rounded px-4 py-2 hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
