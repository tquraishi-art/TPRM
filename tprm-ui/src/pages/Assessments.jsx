import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Plus, X, Search, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const VENDORS = [
  { id:'v1', name:'CloudSystems Inc',   tier:'Tier 1' },
  { id:'v2', name:'DataSecure LLC',     tier:'Tier 1' },
  { id:'v3', name:'GlobalPay Corp',     tier:'Tier 2' },
  { id:'v4', name:'LegalEagle LLP',     tier:'Tier 2' },
  { id:'v5', name:'FastShip Logistics', tier:'Tier 3' },
  { id:'v6', name:'MedConsult Group',   tier:'Tier 4' },
]

const STAGES = [
  'Not Started',
  'Questionnaire Sent',
  'In Progress',
  'Under Review',
  'Approved',
  'Overdue',
]

const STAGE_COLORS = {
  'Not Started':       { dot:'bg-gray-400',   badge:'bg-gray-100 text-gray-600',       track:'bg-gray-200'    },
  'Questionnaire Sent':{ dot:'bg-blue-400',   badge:'bg-blue-100 text-blue-700',       track:'bg-blue-400'    },
  'In Progress':       { dot:'bg-indigo-400', badge:'bg-indigo-100 text-indigo-700',   track:'bg-indigo-400'  },
  'Under Review':      { dot:'bg-amber-400',  badge:'bg-amber-100 text-amber-700',     track:'bg-amber-400'   },
  'Approved':          { dot:'bg-green-500',  badge:'bg-green-100 text-green-700',     track:'bg-green-500'   },
  'Overdue':           { dot:'bg-red-500',    badge:'bg-red-100 text-red-700',         track:'bg-red-500'     },
}

const STAGE_IDX = Object.fromEntries(STAGES.map((s,i) => [s, i]))
const ACTIVE_STAGES = STAGES.filter(s => s !== 'Not Started' && s !== 'Overdue')

const ASSESSMENT_TYPES = ['Annual DDQ', 'ISO 27001 Review', 'PCI-DSS Audit', 'GDPR Assessment', 'BCP Review', 'Ad Hoc Review']
const OWNERS = ['S. Kim', 'T. Wilson', 'R. Brown', 'M. Davis', 'L. Park', 'A. Nguyen']

const TODAY = '2026-09-09'

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.round((new Date(dateStr) - new Date(TODAY)) / 86400000)
}

const INIT = [
  {
    id:'a1', vendorId:'v1', type:'Annual DDQ', cycle:'2026',
    stage:'Under Review', owner:'S. Kim',
    sentDate:'2026-07-01', responseDate:'2026-07-28', reviewDate:'2026-08-10', dueDate:'2026-09-30',
    score:null, findings:3, criticalFindings:0,
    notes:'Vendor responded promptly. Reviewing evidence pack for patch management and BCDR.',
    history:[
      { date:'2026-07-01', stage:'Questionnaire Sent', by:'S. Kim',  note:'DDQ dispatched via email' },
      { date:'2026-07-28', stage:'In Progress',        by:'S. Kim',  note:'Response received — 94 questions answered' },
      { date:'2026-08-10', stage:'Under Review',       by:'T. Wilson',note:'Initial scoring complete, 3 findings raised' },
    ],
  },
  {
    id:'a2', vendorId:'v2', type:'ISO 27001 Review', cycle:'2026',
    stage:'Approved', owner:'T. Wilson',
    sentDate:'2026-04-01', responseDate:'2026-04-20', reviewDate:'2026-05-05', dueDate:'2026-06-30',
    score:88, findings:1, criticalFindings:0,
    notes:'Strong control environment. One minor finding on HSM failover testing — remediation accepted.',
    history:[
      { date:'2026-04-01', stage:'Questionnaire Sent', by:'T. Wilson', note:'ISO review initiated' },
      { date:'2026-04-20', stage:'In Progress',        by:'T. Wilson', note:'Responses and ISO cert received' },
      { date:'2026-05-05', stage:'Under Review',       by:'L. Park',   note:'Scoring in progress' },
      { date:'2026-05-18', stage:'Approved',           by:'L. Park',   note:'Approved — minor finding accepted' },
    ],
  },
  {
    id:'a3', vendorId:'v3', type:'PCI-DSS Audit', cycle:'2026',
    stage:'Overdue', owner:'R. Brown',
    sentDate:'2026-05-15', responseDate:null, reviewDate:null, dueDate:'2026-08-01',
    score:null, findings:0, criticalFindings:0,
    notes:'Vendor has not responded. FCA fine investigation may be related. Escalation sent 2026-08-10.',
    history:[
      { date:'2026-05-15', stage:'Questionnaire Sent', by:'R. Brown', note:'PCI audit DDQ sent' },
      { date:'2026-08-01', stage:'Overdue',            by:'System',   note:'Auto-flagged: past due date, no response' },
      { date:'2026-08-10', stage:'Overdue',            by:'R. Brown', note:'Escalation email sent to vendor CRO' },
    ],
  },
  {
    id:'a4', vendorId:'v4', type:'Annual DDQ', cycle:'2026',
    stage:'In Progress', owner:'M. Davis',
    sentDate:'2026-08-01', responseDate:'2026-08-20', reviewDate:null, dueDate:'2026-10-15',
    score:null, findings:0, criticalFindings:0,
    notes:'Vendor submitted partial response. Chasing outstanding contract and litigation disclosures.',
    history:[
      { date:'2026-08-01', stage:'Questionnaire Sent', by:'M. Davis', note:'Annual DDQ sent' },
      { date:'2026-08-20', stage:'In Progress',        by:'M. Davis', note:'Partial response received — 60% complete' },
    ],
  },
  {
    id:'a5', vendorId:'v5', type:'BCP Review', cycle:'2026',
    stage:'Questionnaire Sent', owner:'T. Wilson',
    sentDate:'2026-09-01', responseDate:null, reviewDate:null, dueDate:'2026-10-31',
    score:null, findings:0, criticalFindings:0,
    notes:'BCP review triggered by September service disruption incident.',
    history:[
      { date:'2026-09-01', stage:'Questionnaire Sent', by:'T. Wilson', note:'BCP questionnaire sent following incident inc1' },
    ],
  },
  {
    id:'a6', vendorId:'v6', type:'Ad Hoc Review', cycle:'2026',
    stage:'Not Started', owner:'L. Park',
    sentDate:null, responseDate:null, reviewDate:null, dueDate:'2026-11-30',
    score:null, findings:0, criticalFindings:0,
    notes:'Triggered by profit warning. Financial health and continuity checks required.',
    history:[],
  },
]

const BLANK = {
  vendorId:'v1', type:'Annual DDQ', cycle:'2026',
  stage:'Not Started', owner:'S. Kim',
  sentDate:'', responseDate:'', reviewDate:'', dueDate:'',
  score:'', findings:0, criticalFindings:0, notes:'',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stageProgress(stage) {
  const nonOverdue = STAGES.filter(s => s !== 'Overdue')
  const i = nonOverdue.indexOf(stage === 'Overdue' ? 'Not Started' : stage)
  return Math.round((i / (nonOverdue.length - 1)) * 100)
}

function StagePip({ stage, current }) {
  const isCompleted = STAGE_IDX[current] > STAGE_IDX[stage] && current !== 'Overdue'
  const isCurrent   = stage === current
  const isOverdue   = current === 'Overdue'
  const sc          = STAGE_COLORS[stage]
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn(
        'w-3 h-3 rounded-full border-2 transition-all',
        isCompleted ? 'bg-green-500 border-green-500' :
        isCurrent && !isOverdue ? `${sc.dot} border-transparent` :
        isCurrent && isOverdue ? 'bg-red-500 border-red-500' :
        'bg-white border-gray-300'
      )} />
      <span className={cn('text-[9px] text-center leading-tight w-14',
        isCurrent ? 'font-semibold text-gray-800' : 'text-gray-400'
      )}>{stage}</span>
    </div>
  )
}

function ProgressTrack({ stage }) {
  const activeStages = ['Not Started','Questionnaire Sent','In Progress','Under Review','Approved']
  const idx = activeStages.indexOf(stage === 'Overdue' ? 'Not Started' : stage)
  const pct = idx < 0 ? 0 : Math.round((idx / (activeStages.length - 1)) * 100)
  const color = stage === 'Overdue' ? 'bg-red-400' : stage === 'Approved' ? 'bg-green-500' : 'bg-[#0176d3]'
  return (
    <div className="relative flex items-center justify-between w-full px-1.5 mb-5">
      {/* track line */}
      <div className="absolute left-4 right-4 top-1.5 h-0.5 bg-gray-200 z-0" />
      <div className={cn('absolute left-4 top-1.5 h-0.5 z-0 transition-all', color)} style={{ width:`calc(${pct}% - 1rem)` }} />
      {activeStages.map(s => <StagePip key={s} stage={s} current={stage} />)}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Assessments() {
  const navigate = useNavigate()
  const [assessments, setAssessments] = useLocalStorage('tprm:assessments', INIT)
  const [q, setQ]                 = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [filterVendor, setFilterVendor] = useState('')
  const [filterOwner, setFilterOwner]   = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [modal, setModal]         = useState(null)
  const [form, setForm]           = useState(BLANK)
  const [advanceTarget, setAdvanceTarget] = useState(null) // { id, note }
  const [advanceNote, setAdvanceNote]     = useState('')

  const filtered = assessments.filter(a => {
    const vname = VENDORS.find(v=>v.id===a.vendorId)?.name||''
    if (q && !vname.toLowerCase().includes(q.toLowerCase()) && !a.type.toLowerCase().includes(q.toLowerCase())) return false
    if (filterStage  && a.stage    !== filterStage)  return false
    if (filterVendor && a.vendorId !== filterVendor) return false
    if (filterOwner  && a.owner    !== filterOwner)  return false
    return true
  })

  // KPIs
  const overdue      = assessments.filter(a => a.stage === 'Overdue').length
  const inFlight     = assessments.filter(a => !['Not Started','Approved','Overdue'].includes(a.stage)).length
  const approved     = assessments.filter(a => a.stage === 'Approved').length
  const critFindings = assessments.reduce((s,a) => s + a.criticalFindings, 0)

  function openAdd() { setForm(BLANK); setModal({ mode:'add' }) }
  function openEdit(a) { setForm({ ...a, score: a.score??'' }); setModal({ mode:'edit', id:a.id }) }

  function save() {
    if (!form.vendorId || !form.type) return
    const entry = { ...form, score: form.score === '' ? null : +form.score, findings: +form.findings||0, criticalFindings: +form.criticalFindings||0 }
    if (modal.mode === 'add') {
      setAssessments(prev => [...prev, { ...entry, id:'a'+Math.random().toString(36).slice(2,8), history:[] }])
    } else {
      setAssessments(prev => prev.map(a => a.id === modal.id ? { ...entry, id:modal.id, history: a.history } : a))
    }
    setModal(null)
  }

  function nextStage(a) {
    const nonOverdue = STAGES.filter(s => s !== 'Overdue')
    const idx = nonOverdue.indexOf(a.stage)
    if (idx < 0 || idx === nonOverdue.length - 1) return null
    return nonOverdue[idx + 1]
  }

  function advance(id, note) {
    setAssessments(prev => prev.map(a => {
      if (a.id !== id) return a
      const next = nextStage(a)
      if (!next) return a
      const histEntry = { date: TODAY, stage: next, by: a.owner, note: note || `Moved to ${next}` }
      return { ...a, stage: next, history: [...a.history, histEntry] }
    }))
    setAdvanceTarget(null)
    setAdvanceNote('')
  }

  function markOverdue(id) {
    setAssessments(prev => prev.map(a => {
      if (a.id !== id) return a
      const histEntry = { date: TODAY, stage: 'Overdue', by: 'System', note: 'Manually flagged as overdue' }
      return { ...a, stage: 'Overdue', history: [...a.history, histEntry] }
    }))
  }

  // Group by stage for kanban
  const byStage = STAGES.reduce((acc, s) => {
    acc[s] = filtered.filter(a => a.stage === s)
    return acc
  }, {})

  const [view, setView] = useState('list') // 'list' | 'kanban'

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Assessment Pipeline</h1>
          <p className="text-xs text-gray-400 mt-0.5">Third-party due diligence lifecycle — questionnaire to sign-off</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex text-xs border border-gray-200 rounded overflow-hidden">
            {['list','kanban'].map(v => (
              <button key={v} onClick={()=>setView(v)} className={cn('px-3 py-1.5 capitalize', view===v ? 'bg-[#0176d3] text-white' : 'text-gray-500 hover:bg-gray-50')}>{v}</button>
            ))}
          </div>
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#0176d3] text-white text-xs font-medium px-3 py-2 rounded hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" /> New Assessment
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Overdue',          value: overdue,      color: overdue>0 ? 'text-red-600' : 'text-green-600', click: ()=>setFilterStage('Overdue')   },
          { label:'In-Flight',        value: inFlight,     color:'text-[#0176d3]',                               click: ()=>setFilterStage('')           },
          { label:'Approved (cycle)', value: approved,     color:'text-green-600',                               click: ()=>setFilterStage('Approved')  },
          { label:'Critical Findings',value: critFindings, color: critFindings>0 ? 'text-red-600':'text-green-600', click: ()=>{} },
        ].map(k => (
          <button key={k.label} onClick={k.click} className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:border-blue-300 transition-colors">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{k.label}</div>
            <div className={cn('text-xl font-bold', k.color)}>{k.value}</div>
          </button>
        ))}
      </div>

      {/* Overdue alert */}
      {overdue > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">
            <strong>{overdue} assessment{overdue>1?'s':''} overdue</strong> — {assessments.filter(a=>a.stage==='Overdue').map(a=>VENDORS.find(v=>v.id===a.vendorId)?.name).join(', ')}.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400" placeholder="Search vendor or type…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterVendor} onChange={e=>setFilterVendor(e.target.value)}>
          <option value="">All Vendors</option>
          {VENDORS.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterStage} onChange={e=>setFilterStage(e.target.value)}>
          <option value="">All Stages</option>
          {STAGES.map(s=><option key={s}>{s}</option>)}
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterOwner} onChange={e=>setFilterOwner(e.target.value)}>
          <option value="">All Owners</option>
          {OWNERS.map(o=><option key={o}>{o}</option>)}
        </select>
        {(q||filterStage||filterVendor||filterOwner) && (
          <button onClick={()=>{setQ('');setFilterStage('');setFilterVendor('');setFilterOwner('')}} className="text-xs text-blue-500 hover:text-blue-700 px-2">Clear</button>
        )}
      </div>

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-8 text-center text-xs text-gray-400">No assessments match filters</div>
          )}
          {filtered.map(a => {
            const vendor = VENDORS.find(v=>v.id===a.vendorId)
            const sc     = STAGE_COLORS[a.stage]
            const isOpen = expandedId === a.id
            const due    = daysUntil(a.dueDate)
            const next   = nextStage(a)

            return (
              <div key={a.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <button
                  className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
                  onClick={()=>setExpandedId(v=>v===a.id?null:a.id)}
                >
                  <div className={cn('w-2 h-2 rounded-full shrink-0 mt-1.5', sc.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-semibold text-gray-800">{vendor?.name}</span>
                      <span className="text-[10px] text-gray-400">{vendor?.tier}</span>
                      <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{a.type}</span>
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', sc.badge)}>{a.stage}</span>
                      {a.criticalFindings > 0 && <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{a.criticalFindings} critical finding{a.criticalFindings>1?'s':''}</span>}
                    </div>
                    <div className="text-[11px] text-gray-400 flex flex-wrap gap-3">
                      <span>Owner: <strong className="text-gray-600">{a.owner}</strong></span>
                      {a.dueDate && <span className={cn(due !== null && due < 0 ? 'text-red-500' : due !== null && due <= 14 ? 'text-amber-500' : '')}>Due: <strong>{a.dueDate}</strong>{due!==null && ` (${due<0?`${Math.abs(due)}d overdue`:`${due}d`})`}</span>}
                      {a.score !== null && <span>Score: <strong className="text-green-600">{a.score}/100</strong></span>}
                      {a.findings > 0 && <span>Findings: <strong>{a.findings}</strong></span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={e=>{e.stopPropagation();openEdit(a)}} className="text-[10px] text-blue-500 hover:underline">Edit</button>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400"/> : <ChevronRight className="w-4 h-4 text-gray-400"/>}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-5 pb-5 pt-4 bg-gray-50/40">
                    {/* Progress track */}
                    <ProgressTrack stage={a.stage} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
                      {/* Left: dates + notes */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            ['Sent',        a.sentDate     || '—'],
                            ['Response',    a.responseDate || '—'],
                            ['Review Start',a.reviewDate   || '—'],
                            ['Due Date',    a.dueDate      || '—'],
                          ].map(([label, val])=>(
                            <div key={label} className="bg-white border border-gray-100 rounded p-2.5">
                              <div className="text-[10px] text-gray-400 mb-0.5">{label}</div>
                              <div className="font-semibold text-gray-700">{val}</div>
                            </div>
                          ))}
                        </div>

                        {a.notes && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                            <p className="text-gray-600 leading-relaxed">{a.notes}</p>
                          </div>
                        )}

                        {/* Timeline */}
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Timeline</p>
                          {a.history.length === 0
                            ? <p className="text-gray-400 text-[11px]">No history yet</p>
                            : (
                              <div className="space-y-2">
                                {[...a.history].reverse().map((h,i) => (
                                  <div key={i} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                      <div className={cn('w-2 h-2 rounded-full shrink-0 mt-1', STAGE_COLORS[h.stage]?.dot || 'bg-gray-400')} />
                                      {i < a.history.length-1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                                    </div>
                                    <div className="pb-2">
                                      <div className="flex items-center gap-2">
                                        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', STAGE_COLORS[h.stage]?.badge || 'bg-gray-100 text-gray-600')}>{h.stage}</span>
                                        <span className="text-[10px] text-gray-400">{h.date} · {h.by}</span>
                                      </div>
                                      {h.note && <p className="text-[11px] text-gray-500 mt-0.5">{h.note}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          }
                        </div>
                      </div>

                      {/* Right: scorecard + actions */}
                      <div className="space-y-3">
                        <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2 text-[11px]">
                          <div className="flex justify-between"><span className="text-gray-400">Assessment Type</span><span className="font-semibold text-gray-700">{a.type}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Cycle</span><span className="font-semibold text-gray-700">{a.cycle}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Owner</span><span className="font-semibold text-gray-700">{a.owner}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Score</span><span className={cn('font-semibold', a.score!==null ? (a.score>=80?'text-green-600':a.score>=60?'text-amber-500':'text-red-600') : 'text-gray-400')}>{a.score!==null?`${a.score}/100`:'Pending'}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Findings</span><span className="font-semibold text-gray-700">{a.findings}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Critical</span><span className={cn('font-semibold', a.criticalFindings>0?'text-red-600':'text-gray-700')}>{a.criticalFindings}</span></div>
                        </div>

                        {/* Advance / overdue actions */}
                        <div className="space-y-1.5">
                          {next && a.stage !== 'Overdue' && (
                            <button
                              onClick={()=>setAdvanceTarget({id:a.id, next})}
                              className="w-full flex items-center justify-center gap-1.5 text-xs bg-[#0176d3] text-white rounded py-2 hover:bg-blue-700"
                            >
                              <ArrowRight className="w-3.5 h-3.5" /> Advance to "{next}"
                            </button>
                          )}
                          {a.stage !== 'Overdue' && a.stage !== 'Approved' && (
                            <button onClick={()=>markOverdue(a.id)} className="w-full text-xs border border-red-200 text-red-600 rounded py-2 hover:bg-red-50">
                              Flag as Overdue
                            </button>
                          )}
                          <button onClick={()=>navigate('/vendors',{state:{openVendorName:vendor?.name}})} className="w-full text-xs text-blue-500 hover:underline text-left">View vendor profile →</button>
                          <button onClick={()=>navigate('/evidence',{state:{filterVendor:vendor?.name}})} className="w-full text-xs text-blue-500 hover:underline text-left">View evidence register →</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── KANBAN VIEW ── */}
      {view === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGES.map(stage => {
            const cards   = byStage[stage] || []
            const sc      = STAGE_COLORS[stage]
            return (
              <div key={stage} className="flex-shrink-0 w-56">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className={cn('w-2 h-2 rounded-full', sc.dot)} />
                  <span className="text-xs font-semibold text-gray-700">{stage}</span>
                  <span className="ml-auto text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{cards.length}</span>
                </div>
                <div className="space-y-2 min-h-[60px]">
                  {cards.length === 0 && (
                    <div className="border-2 border-dashed border-gray-200 rounded-lg h-16 flex items-center justify-center text-[10px] text-gray-300">empty</div>
                  )}
                  {cards.map(a => {
                    const vendor = VENDORS.find(v=>v.id===a.vendorId)
                    const next   = nextStage(a)
                    const due    = daysUntil(a.dueDate)
                    return (
                      <div key={a.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="font-semibold text-[11px] text-gray-800 mb-0.5">{vendor?.name}</div>
                        <div className="text-[10px] text-gray-400 mb-2">{a.type} · {a.cycle}</div>
                        {a.criticalFindings > 0 && (
                          <div className="text-[10px] bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full mb-2 inline-block">{a.criticalFindings} critical</div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">{a.owner}</span>
                          {due !== null && <span className={cn('text-[10px] font-semibold', due<0?'text-red-500':due<=14?'text-amber-500':'text-gray-400')}>{due<0?`${Math.abs(due)}d late`:`${due}d`}</span>}
                        </div>
                        {next && a.stage !== 'Overdue' && (
                          <button
                            onClick={()=>setAdvanceTarget({id:a.id, next})}
                            className="mt-2 w-full text-[10px] bg-gray-50 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 rounded py-1 flex items-center justify-center gap-1 transition-colors"
                          >
                            <ArrowRight className="w-3 h-3" /> {next}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Advance confirmation mini-modal */}
      {advanceTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Advance Stage</h3>
            <p className="text-xs text-gray-500 mb-3">Moving to <strong className="text-gray-800">{advanceTarget.next}</strong>. Add an optional note:</p>
            <input
              autoFocus
              className="w-full text-xs border border-gray-200 rounded px-3 py-2 mb-4 focus:outline-none focus:border-blue-400"
              placeholder="e.g. Response received — reviewing now"
              value={advanceNote}
              onChange={e=>setAdvanceNote(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&advance(advanceTarget.id,advanceNote)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={()=>setAdvanceTarget(null)} className="text-xs border border-gray-200 rounded px-4 py-2 hover:bg-gray-50">Cancel</button>
              <button onClick={()=>advance(advanceTarget.id,advanceNote)} className="text-xs bg-[#0176d3] text-white rounded px-4 py-2 hover:bg-blue-700">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">{modal.mode==='add'?'New Assessment':'Edit Assessment'}</h3>
              <button onClick={()=>setModal(null)}><X className="w-4 h-4 text-gray-400"/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label:'Vendor',           key:'vendorId',   type:'select', opts: VENDORS.map(v=>({val:v.id,label:v.name})) },
                  { label:'Assessment Type',  key:'type',       type:'select', opts: ASSESSMENT_TYPES.map(t=>({val:t,label:t})) },
                  { label:'Stage',            key:'stage',      type:'select', opts: STAGES.map(s=>({val:s,label:s})) },
                  { label:'Owner',            key:'owner',      type:'select', opts: OWNERS.map(o=>({val:o,label:o})) },
                  { label:'Cycle / Year',     key:'cycle',      type:'text' },
                  { label:'Score (0–100)',     key:'score',      type:'number' },
                  { label:'Findings',         key:'findings',   type:'number' },
                  { label:'Critical Findings',key:'criticalFindings', type:'number' },
                  { label:'Questionnaire Sent',key:'sentDate',  type:'date' },
                  { label:'Response Received', key:'responseDate',type:'date' },
                  { label:'Review Start',     key:'reviewDate', type:'date' },
                  { label:'Due Date',         key:'dueDate',    type:'date' },
                  { label:'Notes',            key:'notes',      type:'textarea', span:2 },
                ].map(f=>(
                  <div key={f.key} className={f.span===2?'col-span-2':''}>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.label}</label>
                    {f.type==='select'
                      ? <select className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400" value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}>
                          {f.opts.map(o=><option key={o.val} value={o.val}>{o.label}</option>)}
                        </select>
                      : f.type==='textarea'
                      ? <textarea rows={3} className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400 resize-none" value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} />
                      : <input type={f.type} className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400" value={form[f.key]??''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} />
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
