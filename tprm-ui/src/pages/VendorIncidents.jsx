import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { AlertTriangle, Plus, X, Clock, CheckCircle, Search, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Data ─────────────────────────────────────────────────────────────────────

const VENDORS = [
  { id:'v1', name:'CloudSystems Inc',    tier:'Tier 1' },
  { id:'v2', name:'DataSecure LLC',      tier:'Tier 1' },
  { id:'v3', name:'GlobalPay Corp',      tier:'Tier 2' },
  { id:'v4', name:'LegalEagle LLP',      tier:'Tier 2' },
  { id:'v5', name:'FastShip Logistics',  tier:'Tier 3' },
  { id:'v6', name:'MedConsult Group',    tier:'Tier 4' },
]

const LINKED_RISKS = [
  { id:'r1', name:'Unpatched software vulnerabilities in cloud platform' },
  { id:'r2', name:'Inadequate data encryption at rest' },
  { id:'r3', name:'PCI-DSS compliance gap – network segmentation' },
  { id:'r5', name:'Single point of failure – cloud dependency' },
  { id:'r9', name:'Insider threat from contractor broad access' },
]

// Regulatory frameworks and their notification deadlines (hours)
const REG_FRAMEWORKS = {
  'DORA':  { label:'DORA Art.19',   deadline: 72,   desc:'ICT-related incidents — initial notification within 72h' },
  'SEC':   { label:'SEC Rule',      deadline: 96,   desc:'Material cybersecurity incidents — 4 business days (Form 8-K)' },
  'GDPR':  { label:'GDPR Art.33',   deadline: 72,   desc:'Personal data breaches — supervisory authority notification within 72h' },
  'PCI':   { label:'PCI-DSS 12.10', deadline: 24,   desc:'Suspected or confirmed cardholder data compromise — immediate notification' },
  'NIS2':  { label:'NIS2 Art.23',   deadline: 24,   desc:'Significant incidents — early warning within 24h, full report within 72h' },
}

const INIT_INCIDENTS = [
  {
    id:'inc1', vendor:'v1', type:'Cybersecurity', severity:'Critical',
    title:'Ransomware attack on CloudSystems production environment',
    desc:'Ransomware detected on 3 production servers. Attacker gained access via unpatched API vulnerability. Customer data potentially exfiltrated. Systems taken offline at 02:14 UTC.',
    detectedAt:'2026-08-10T02:14', reportedAt:'2026-08-10T06:00',
    status:'Containment', riskId:'r1',
    frameworks:['DORA','GDPR','NIS2'],
    riskImpact:'Very High', owner:'S. Kim',
    timeline:[
      { ts:'2026-08-10T02:14', event:'Incident detected by SOC monitoring alert' },
      { ts:'2026-08-10T06:00', event:'Reported to TPRM. Vendor escalation initiated.' },
      { ts:'2026-08-10T08:30', event:'DORA initial notification submitted to regulator' },
      { ts:'2026-08-10T14:00', event:'Vendor confirmed data exfiltration scope: 12,000 records' },
    ],
    containmentActions:'Affected servers isolated. Patch applied to API vulnerability. Forensic investigation underway.',
    closedAt:'',
  },
  {
    id:'inc2', vendor:'v3', type:'Compliance', severity:'High',
    title:'PCI-DSS audit failure — network segmentation gap confirmed',
    desc:'External QSA audit confirmed GlobalPay failed Requirement 1.3 on network segmentation. Cardholder data environment not fully isolated. Remediation plan required within 30 days.',
    detectedAt:'2026-07-22T09:00', reportedAt:'2026-07-22T11:00',
    status:'Remediation', riskId:'r3',
    frameworks:['PCI'],
    riskImpact:'High', owner:'R. Brown',
    timeline:[
      { ts:'2026-07-22T09:00', event:'QSA audit report received' },
      { ts:'2026-07-22T11:00', event:'TPRM notified. Risk re-scored to High.' },
      { ts:'2026-07-25T10:00', event:'Remediation plan requested from vendor' },
      { ts:'2026-08-01T14:00', event:'Vendor submitted remediation plan — under review' },
    ],
    containmentActions:'Interim compensating controls applied. Quarterly monitoring increased to monthly.',
    closedAt:'',
  },
  {
    id:'inc3', vendor:'v2', type:'Data Breach', severity:'Moderate',
    title:'Unauthorised access to DataSecure logging environment',
    desc:'Misconfigured IAM role allowed read access to application logs containing metadata. No customer PII confirmed in scope. Access revoked within 4 hours.',
    detectedAt:'2026-06-15T16:45', reportedAt:'2026-06-15T18:00',
    status:'Closed', riskId:'r2',
    frameworks:['GDPR'],
    riskImpact:'Moderate', owner:'T. Wilson',
    timeline:[
      { ts:'2026-06-15T16:45', event:'Misconfiguration identified in IAM audit' },
      { ts:'2026-06-15T18:00', event:'TPRM notified' },
      { ts:'2026-06-15T20:30', event:'Access revoked. Scope confirmed — no PII' },
      { ts:'2026-06-16T09:00', event:'GDPR Art.33 assessment: below notification threshold' },
      { ts:'2026-06-20T11:00', event:'Incident closed. Risk score unchanged.' },
    ],
    containmentActions:'IAM policy corrected. All roles audited. DPA review scheduled.',
    closedAt:'2026-06-20T11:00',
  },
]

const SEV_COLORS = {
  'Critical': { badge:'bg-red-100 text-red-700 border-red-200',    dot:'bg-red-500',    text:'text-red-600' },
  'High':     { badge:'bg-orange-100 text-orange-700 border-orange-200', dot:'bg-orange-500', text:'text-orange-600' },
  'Moderate': { badge:'bg-yellow-100 text-yellow-700 border-yellow-200', dot:'bg-yellow-500', text:'text-yellow-600' },
  'Low':      { badge:'bg-blue-100 text-blue-700 border-blue-200',   dot:'bg-blue-500',   text:'text-blue-600' },
}
const STATUS_COLORS = {
  'Triage':       'bg-red-100 text-red-700',
  'Containment':  'bg-orange-100 text-orange-700',
  'Remediation':  'bg-blue-100 text-blue-700',
  'Monitoring':   'bg-purple-100 text-purple-700',
  'Closed':       'bg-green-100 text-green-700',
}
const RISK_IMPACT_COLORS = {
  'Very High': 'text-red-600',
  'High':      'text-orange-500',
  'Moderate':  'text-yellow-600',
  'Low':       'text-blue-600',
  'Very Low':  'text-green-600',
  'Unknown':   'text-gray-400',
}

const BLANK = {
  vendor:'v1', type:'Cybersecurity', severity:'High', title:'', desc:'',
  detectedAt:'', reportedAt:'', status:'Triage', riskId:'',
  frameworks:[], riskImpact:'Unknown', owner:'', containmentActions:'', closedAt:'',
  timeline:[],
}

function hoursElapsed(fromStr) {
  if (!fromStr) return null
  return Math.round((Date.now() - new Date(fromStr).getTime()) / 3600000)
}

function RegClock({ framework, detectedAt }) {
  const rf = REG_FRAMEWORKS[framework]
  if (!rf) return null
  const elapsed = hoursElapsed(detectedAt)
  if (elapsed === null) return null
  const remaining = rf.deadline - elapsed
  const pct = Math.min(100, Math.round((elapsed / rf.deadline) * 100))
  const overdue = remaining <= 0
  const urgent  = remaining > 0 && remaining <= 12

  return (
    <div className={cn('rounded-lg border px-3 py-2.5 text-xs', overdue ? 'bg-red-50 border-red-200' : urgent ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200')}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-semibold text-gray-700">{rf.label}</span>
        <span className={cn('font-bold', overdue ? 'text-red-600' : urgent ? 'text-amber-600' : 'text-green-600')}>
          {overdue ? `${Math.abs(remaining)}h overdue` : `${remaining}h remaining`}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1.5">
        <div className={cn('h-full rounded-full transition-all', overdue ? 'bg-red-500' : urgent ? 'bg-amber-400' : 'bg-green-500')} style={{ width:`${pct}%` }} />
      </div>
      <div className="text-[10px] text-gray-500">{rf.desc}</div>
    </div>
  )
}

export default function VendorIncidents() {
  const navigate = useNavigate()
  const [incidents, setIncidents] = useLocalStorage('tprm:incidents', INIT_INCIDENTS)
  const [q, setQ]                 = useState('')
  const [filterSev, setFilterSev] = useState('')
  const [filterSt, setFilterSt]   = useState('')
  const [filterV, setFilterV]     = useState('')
  const [expandedId, setExpandedId] = useState('inc1') // open most recent by default
  const [modal, setModal]         = useState(null)
  const [form, setForm]           = useState(BLANK)

  const filtered = incidents.filter(i => {
    const vname = VENDORS.find(v=>v.id===i.vendor)?.name || ''
    if (q && !i.title.toLowerCase().includes(q.toLowerCase()) && !vname.toLowerCase().includes(q.toLowerCase())) return false
    if (filterSev && i.severity !== filterSev) return false
    if (filterSt  && i.status   !== filterSt)  return false
    if (filterV   && i.vendor   !== filterV)    return false
    return true
  })

  const active     = incidents.filter(i => i.status !== 'Closed')
  const critical   = incidents.filter(i => i.severity === 'Critical' && i.status !== 'Closed')
  const regBreaches = incidents.filter(i => i.status !== 'Closed' && i.frameworks.some(f => {
    const elapsed = hoursElapsed(i.detectedAt)
    return elapsed !== null && elapsed > REG_FRAMEWORKS[f]?.deadline
  }))

  function openAdd()   { setForm({...BLANK, timeline:[], frameworks:[]}); setModal({mode:'add'}) }
  function openEdit(i) { setForm({...i});  setModal({mode:'edit', id:i.id}) }
  function saveForm() {
    if (!form.title.trim()) return
    if (modal.mode === 'add') {
      setIncidents(prev => [...prev, { ...form, id:'inc'+Math.random().toString(36).slice(2,8) }])
    } else {
      setIncidents(prev => prev.map(i => i.id === modal.id ? { ...form, id:modal.id } : i))
    }
    setModal(null)
  }
  function toggleFramework(f) {
    setForm(prev => ({
      ...prev,
      frameworks: prev.frameworks.includes(f)
        ? prev.frameworks.filter(x=>x!==f)
        : [...prev.frameworks, f]
    }))
  }
  function addTimelineEntry(id, event) {
    setIncidents(prev => prev.map(i => i.id === id
      ? { ...i, timeline: [...i.timeline, { ts: new Date().toISOString().slice(0,16), event }] }
      : i
    ))
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Vendor Incident Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">Log, track, and manage vendor-related incidents with regulatory notification clocks</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#0176d3] text-white text-xs font-medium px-3 py-2 rounded hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5" /> Log Incident
        </button>
      </div>

      {/* Reg breach alert */}
      {regBreaches.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="text-xs text-red-700">
            <strong>{regBreaches.length} incident{regBreaches.length > 1 ? 's have' : ' has'} exceeded regulatory notification deadlines.</strong>
            {' '}Immediate escalation to legal and compliance required.
          </div>
        </div>
      )}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Active Incidents',        value: active.length,           color:'text-gray-800' },
          { label:'Critical / Unresolved',   value: critical.length,         color: critical.length > 0 ? 'text-red-600' : 'text-green-600',
            onClick:() => { setFilterSev(f=>f==='Critical'?'':'Critical'); setFilterSt('') } },
          { label:'Regulatory Deadline Breached', value: regBreaches.length, color: regBreaches.length > 0 ? 'text-red-600' : 'text-green-600' },
          { label:'Closed (All Time)',        value: incidents.filter(i=>i.status==='Closed').length, color:'text-green-600',
            onClick:() => setFilterSt(f=>f==='Closed'?'':'Closed') },
        ].map(k => (
          <button key={k.label} onClick={k.onClick}
            className={cn('bg-white border border-gray-200 rounded-lg p-4 text-left transition-all', k.onClick && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer')}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{k.label}</div>
            <div className={cn('text-2xl font-bold', k.color)}>{k.value}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400" placeholder="Search incidents or vendors…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterV} onChange={e=>setFilterV(e.target.value)}>
          <option value="">All Vendors</option>
          {VENDORS.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterSev} onChange={e=>setFilterSev(e.target.value)}>
          <option value="">All Severity</option>
          {['Critical','High','Moderate','Low'].map(s=><option key={s}>{s}</option>)}
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterSt} onChange={e=>setFilterSt(e.target.value)}>
          <option value="">All Status</option>
          {['Triage','Containment','Remediation','Monitoring','Closed'].map(s=><option key={s}>{s}</option>)}
        </select>
        {(q||filterSev||filterSt||filterV) && <button onClick={()=>{setQ('');setFilterSev('');setFilterSt('');setFilterV('')}} className="text-xs text-blue-500 hover:text-blue-700 px-2">Clear</button>}
      </div>

      {/* Incident cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-8 text-center text-xs text-gray-400">No incidents match filters</div>
        )}
        {filtered.map(inc => {
          const vname = VENDORS.find(v=>v.id===inc.vendor)?.name || inc.vendor
          const vtier = VENDORS.find(v=>v.id===inc.vendor)?.tier || ''
          const sev   = SEV_COLORS[inc.severity] || SEV_COLORS.Low
          const isOpen = expandedId === inc.id

          return (
            <div key={inc.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Card header */}
              <button
                className="w-full px-4 py-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
                onClick={() => setExpandedId(v => v === inc.id ? null : inc.id)}
              >
                <span className={cn('w-2.5 h-2.5 rounded-full mt-1 shrink-0', sev.dot)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', sev.badge)}>{inc.severity}</span>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', STATUS_COLORS[inc.status]||'bg-gray-100 text-gray-500')}>{inc.status}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{inc.type}</span>
                    {inc.frameworks.map(f => (
                      <span key={f} className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium',
                        hoursElapsed(inc.detectedAt) > (REG_FRAMEWORKS[f]?.deadline||999)
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      )}>{REG_FRAMEWORKS[f]?.label}</span>
                    ))}
                  </div>
                  <div className="text-sm font-semibold text-gray-800">{inc.title}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-3">
                    <button className="text-blue-500 hover:underline" onClick={e=>{e.stopPropagation();navigate('/vendors',{state:{openVendorName:vname}})}}>{vname}</button>
                    <span>{vtier}</span>
                    {inc.detectedAt && <span><Clock className="w-3 h-3 inline mr-0.5" />Detected {inc.detectedAt.slice(0,10)}</span>}
                    {inc.owner && <span>Owner: {inc.owner}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={e=>{e.stopPropagation();openEdit(inc)}} className="text-[10px] text-blue-500 hover:underline">Edit</button>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Description + actions */}
                    <div className="lg:col-span-2 space-y-3">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                        <p className="text-xs text-gray-700 leading-relaxed">{inc.desc}</p>
                      </div>
                      {inc.containmentActions && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Containment Actions</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{inc.containmentActions}</p>
                        </div>
                      )}
                      {inc.riskId && (
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Linked Risk:</p>
                          <button onClick={() => navigate('/risks', { state:{ openRiskId: inc.riskId } })} className="text-xs text-blue-500 hover:underline">
                            {LINKED_RISKS.find(r=>r.id===inc.riskId)?.name || inc.riskId}
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Risk Impact Post-Incident:</p>
                        <span className={cn('text-xs font-bold', RISK_IMPACT_COLORS[inc.riskImpact])}>{inc.riskImpact}</span>
                      </div>
                      {/* Timeline */}
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Incident Timeline</p>
                        <div className="space-y-2">
                          {inc.timeline.map((t, i) => (
                            <div key={i} className="flex gap-2.5 text-xs">
                              <span className="text-gray-400 whitespace-nowrap shrink-0">{t.ts.replace('T',' ')}</span>
                              <span className="text-gray-400">·</span>
                              <span className="text-gray-700">{t.event}</span>
                            </div>
                          ))}
                        </div>
                        <AddTimelineEntry incId={inc.id} onAdd={addTimelineEntry} />
                      </div>
                    </div>

                    {/* Regulatory clocks */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Regulatory Notification Clocks</p>
                      {inc.frameworks.length === 0 && <p className="text-xs text-gray-400">No frameworks assigned</p>}
                      {inc.frameworks.map(f => (
                        <RegClock key={f} framework={f} detectedAt={inc.detectedAt} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">{modal.mode==='add'?'Log New Incident':'Edit Incident'}</h3>
              <button onClick={()=>setModal(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label:'Incident Title', key:'title', type:'text', span:2 },
                  { label:'Vendor',  key:'vendor', type:'select', opts:VENDORS.map(v=>({val:v.id,label:v.name})) },
                  { label:'Type',    key:'type',   type:'select', opts:['Cybersecurity','Data Breach','Operational','Compliance','Financial','Reputational'].map(x=>({val:x,label:x})) },
                  { label:'Severity',key:'severity',type:'select', opts:['Critical','High','Moderate','Low'].map(x=>({val:x,label:x})) },
                  { label:'Status',  key:'status', type:'select', opts:['Triage','Containment','Remediation','Monitoring','Closed'].map(x=>({val:x,label:x})) },
                  { label:'Detected At', key:'detectedAt', type:'datetime-local' },
                  { label:'Reported to TPRM', key:'reportedAt', type:'datetime-local' },
                  { label:'Owner',   key:'owner',  type:'text' },
                  { label:'Linked Risk', key:'riskId', type:'select', opts:[{val:'',label:'— None —'},...LINKED_RISKS.map(r=>({val:r.id,label:r.name.slice(0,45)}))] },
                  { label:'Risk Impact', key:'riskImpact', type:'select', opts:['Very High','High','Moderate','Low','Very Low','Unknown'].map(x=>({val:x,label:x})) },
                  { label:'Description', key:'desc', type:'textarea', span:2 },
                  { label:'Containment Actions', key:'containmentActions', type:'textarea', span:2 },
                ].map(f => (
                  <div key={f.key} className={f.span===2?'col-span-2':''}>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.label}</label>
                    {f.type==='select'
                      ? <select className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400" value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}>
                          {f.opts.map(o=><option key={o.val} value={o.val}>{o.label}</option>)}
                        </select>
                      : f.type==='textarea'
                      ? <textarea rows={2} className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400 resize-none" value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} />
                      : <input type={f.type} className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400" value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} />
                    }
                  </div>
                ))}
              </div>
              {/* Framework selection */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Applicable Regulatory Frameworks</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(REG_FRAMEWORKS).map(([key, rf]) => (
                    <button
                      key={key} type="button"
                      onClick={() => toggleFramework(key)}
                      className={cn('text-xs px-3 py-1.5 rounded-lg border transition-colors',
                        form.frameworks.includes(key)
                          ? 'bg-purple-100 border-purple-300 text-purple-700 font-semibold'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                      )}
                    >
                      {rf.label}
                    </button>
                  ))}
                </div>
                {form.frameworks.length > 0 && form.detectedAt && (
                  <div className="mt-3 space-y-2">
                    {form.frameworks.map(f => <RegClock key={f} framework={f} detectedAt={form.detectedAt} />)}
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={()=>setModal(null)} className="text-xs border border-gray-200 rounded px-4 py-2 hover:bg-gray-50">Cancel</button>
              <button onClick={saveForm} className="text-xs bg-[#0176d3] text-white rounded px-4 py-2 hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Inline timeline entry adder ──────────────────────────────────────────────

function AddTimelineEntry({ incId, onAdd }) {
  const [text, setText] = useState('')
  function submit() {
    if (!text.trim()) return
    onAdd(incId, text.trim())
    setText('')
  }
  return (
    <div className="flex gap-2 mt-2">
      <input
        className="flex-1 text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
        placeholder="Add timeline entry…"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
      />
      <button onClick={submit} className="text-xs bg-[#0176d3] text-white rounded px-3 py-1.5 hover:bg-blue-700">Add</button>
    </div>
  )
}
