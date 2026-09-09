import { useState, useEffect, Fragment } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Plus, Pencil, X, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Data ─────────────────────────────────────────────────────────────────────

const VENDORS = [
  {id:'v1',name:'CloudSystems Inc',tier:'Tier 1',cat:'Cloud / SaaS'},
  {id:'v2',name:'DataSecure LLC',tier:'Tier 1',cat:'Technology'},
  {id:'v3',name:'GlobalPay Corp',tier:'Tier 2',cat:'Financial Services'},
  {id:'v4',name:'LegalEagle LLP',tier:'Tier 2',cat:'Legal'},
  {id:'v5',name:'FastShip Logistics',tier:'Tier 3',cat:'Logistics'},
  {id:'v6',name:'MedConsult Group',tier:'Tier 4',cat:'Healthcare'},
]

const RISKS_REF = [
  {id:'r1', name:'Unpatched software vulnerabilities in cloud platform'},
  {id:'r2', name:'Inadequate data encryption at rest'},
  {id:'r3', name:'PCI-DSS compliance gap – network segmentation'},
  {id:'r4', name:'Vendor financial instability'},
  {id:'r5', name:'Single point of failure – cloud dependency'},
  {id:'r6', name:'Subprocessor data sharing without consent'},
  {id:'r7', name:'Shipping delays impacting SLA commitments'},
  {id:'r8', name:'GDPR right-to-erasure non-compliance'},
  {id:'r9', name:'Insider threat from contractor broad access'},
  {id:'r10',name:'Contract renewal pricing risk'},
]

const INIT_ISSUES = [
  {id:'i1',name:'Deploy patches for CloudSystems API CVEs',   riskId:'r1',vendor:'v1',pr:'Critical',owner:'S. Kim',    due:'2026-09-01',st:'In Progress',ev:'Ticket PLAT-8821',  desc:'Coordinate emergency patching across 3 production services.',
   milestones:[
     {id:'m1a',title:'Identify all affected services',         owner:'S. Kim',    dueDate:'2026-08-25',st:'Done',   notes:'3 services confirmed'},
     {id:'m1b',title:'Apply patches to staging environment',   owner:'S. Kim',    dueDate:'2026-08-28',st:'Done',   notes:'Passed smoke tests'},
     {id:'m1c',title:'Deploy to production (blue/green)',      owner:'S. Kim',    dueDate:'2026-09-01',st:'In Progress',notes:'Scheduled for 02:00 UTC maintenance window'},
     {id:'m1d',title:'Verify patch via vulnerability re-scan', owner:'T. Wilson', dueDate:'2026-09-03',st:'To Do',  notes:''},
   ]},
  {id:'i2',name:'AES-256 encryption rollout – DataSecure',    riskId:'r2',vendor:'v2',pr:'High',    owner:'T. Wilson', due:'2026-08-30',st:'In Progress',ev:'SEC-1042',           desc:'Enable encryption at rest on all data stores.',
   milestones:[
     {id:'m2a',title:'Inventory all unencrypted data stores',  owner:'T. Wilson', dueDate:'2026-08-10',st:'Done',   notes:'14 stores identified'},
     {id:'m2b',title:'Encryption key provisioning (HSM)',      owner:'S. Kim',    dueDate:'2026-08-20',st:'Done',   notes:'Keys provisioned in EU-West HSM'},
     {id:'m2c',title:'Encrypt production databases',           owner:'T. Wilson', dueDate:'2026-08-30',st:'In Progress',notes:'7 of 14 complete'},
     {id:'m2d',title:'Encrypt backup stores',                  owner:'T. Wilson', dueDate:'2026-09-15',st:'To Do',  notes:''},
     {id:'m2e',title:'Independent verification & sign-off',    owner:'R. Brown',  dueDate:'2026-09-20',st:'To Do',  notes:''},
   ]},
  {id:'i3',name:'PCI remediation plan submission',            riskId:'r3',vendor:'v3',pr:'Critical',owner:'R. Brown',  due:'2026-08-15',st:'Overdue',     ev:'',                  desc:'Vendor to submit remediation plan for PCI audit failures.',
   milestones:[
     {id:'m3a',title:'Request remediation plan from GlobalPay',owner:'R. Brown',  dueDate:'2026-07-25',st:'Done',   notes:'Requested; vendor acknowledged'},
     {id:'m3b',title:'Receive and review plan',                owner:'R. Brown',  dueDate:'2026-08-15',st:'Blocked',notes:'Plan received 2026-08-01 — insufficient detail on timeline'},
     {id:'m3c',title:'Approve or escalate plan',               owner:'R. Brown',  dueDate:'2026-08-20',st:'To Do',  notes:''},
   ]},
  {id:'i4',name:'Identify backup payment processor',          riskId:'r4',vendor:'v3',pr:'High',    owner:'M. Davis',  due:'2026-10-01',st:'Open',        ev:'',                  desc:'RFP to 3 alternative processors.',
   milestones:[
     {id:'m4a',title:'Define RFP requirements',                owner:'M. Davis',  dueDate:'2026-09-15',st:'To Do',  notes:''},
     {id:'m4b',title:'Issue RFP to 3 processors',              owner:'M. Davis',  dueDate:'2026-09-20',st:'To Do',  notes:''},
     {id:'m4c',title:'Evaluate responses',                     owner:'M. Davis',  dueDate:'2026-09-28',st:'To Do',  notes:''},
     {id:'m4d',title:'Select backup processor + contract',     owner:'M. Davis',  dueDate:'2026-10-01',st:'To Do',  notes:''},
   ]},
  {id:'i5',name:'Multi-cloud DR pilot',                       riskId:'r5',vendor:'v1',pr:'High',    owner:'S. Kim',    due:'2026-12-01',st:'In Progress',ev:'Project Charter v1', desc:'Pilot 20% workload failover to secondary cloud.',
   milestones:[
     {id:'m5a',title:'DR architecture design sign-off',        owner:'S. Kim',    dueDate:'2026-09-30',st:'In Progress',notes:'Architecture review scheduled'},
     {id:'m5b',title:'Provision secondary cloud environment',  owner:'S. Kim',    dueDate:'2026-10-15',st:'To Do',  notes:''},
     {id:'m5c',title:'Failover test (20% workload)',           owner:'S. Kim',    dueDate:'2026-11-15',st:'To Do',  notes:''},
     {id:'m5d',title:'Post-test review and report',            owner:'T. Wilson', dueDate:'2026-12-01',st:'To Do',  notes:''},
   ]},
  {id:'i6',name:'Least-privilege access review – LegalEagle', riskId:'r9',vendor:'v4',pr:'Medium',  owner:'M. Davis',  due:'2026-11-15',st:'Open',        ev:'',                  desc:'Review and restrict contractor system access.',
   milestones:[
     {id:'m6a',title:'Enumerate contractor accounts',          owner:'M. Davis',  dueDate:'2026-10-01',st:'To Do',  notes:''},
     {id:'m6b',title:'Map access to business need',            owner:'M. Davis',  dueDate:'2026-10-15',st:'To Do',  notes:''},
     {id:'m6c',title:'Revoke excess permissions',              owner:'IT Sec',    dueDate:'2026-11-01',st:'To Do',  notes:''},
     {id:'m6d',title:'Confirm and document via access review', owner:'M. Davis',  dueDate:'2026-11-15',st:'To Do',  notes:''},
   ]},
  {id:'i7',name:'DPA renewal – DataSecure subprocessors',     riskId:'r6',vendor:'v2',pr:'Low',     owner:'L. Park',   due:'2026-12-31',st:'Closed',      ev:'DPA v2 signed',     desc:'Annual DPA review completed.',
   milestones:[
     {id:'m7a',title:'Review DPA against GDPR Art.28 checklist',owner:'L. Park', dueDate:'2026-06-01',st:'Done',   notes:'All 8 clauses confirmed'},
     {id:'m7b',title:'Negotiate updated terms',                owner:'R. Brown',  dueDate:'2026-06-15',st:'Done',   notes:''},
     {id:'m7c',title:'Execute DPA v2',                         owner:'L. Park',   dueDate:'2026-07-01',st:'Done',   notes:'Signed by both parties'},
   ]},
]

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_BADGE = {
  'Critical': 'bg-red-100 text-red-700',
  'High':     'bg-orange-100 text-orange-700',
  'Medium':   'bg-yellow-100 text-yellow-700',
  'Low':      'bg-blue-100 text-blue-700',
}

const PRIORITY_DOT = {
  'Critical': 'bg-red-500',
  'High':     'bg-orange-400',
  'Medium':   'bg-yellow-400',
  'Low':      'bg-blue-400',
}

const STATUS_BADGE = {
  'Open':        'bg-gray-100 text-gray-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Overdue':     'bg-red-100 text-red-700',
  'Closed':      'bg-green-100 text-green-700',
}

const PRIORITIES = ['Critical','High','Medium','Low']
const STATUSES   = ['Open','In Progress','Overdue','Closed']

const inputCls = 'w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white'
const BLANK = { id:'', name:'', riskId:'', vendor:'v1', pr:'Medium', owner:'', due:'', st:'Open', ev:'', desc:'', milestones:[] }

const MS_STATUS = ['To Do','In Progress','Done','Blocked']
const MS_STATUS_COLORS = {
  'To Do':       'bg-gray-100 text-gray-500',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Done':        'bg-green-100 text-green-700',
  'Blocked':     'bg-red-100 text-red-700',
}

function vname(id) { return VENDORS.find(v => v.id === id)?.name || id }
function vtier(id) { return VENDORS.find(v => v.id === id)?.tier || '' }
function rname(id) { return RISKS_REF.find(r => r.id === id)?.name || '—' }

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiTile({ label, value, colorClass, bg }) {
  return (
    <div className={cn('rounded-lg border border-gray-200 px-5 py-4', bg || 'bg-white')}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</div>
      <div className={cn('text-3xl font-bold leading-none', colorClass)}>{value}</div>
    </div>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Issues() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [issues, setIssues]             = useLocalStorage('tprm:issues', INIT_ISSUES)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPr, setFilterPr]         = useState('')
  const [expandedId, setExpandedId]     = useState(null)
  const [modalOpen, setModalOpen]       = useState(false)
  const [editIssue, setEditIssue]       = useState(null)
  const [form, setForm]                 = useState(BLANK)

  useEffect(() => {
    if (!state) return
    if (state.filterStatus) setFilterStatus(state.filterStatus)
    if (state.filterPr)     setFilterPr(state.filterPr)
  }, [state])

  // KPI counts
  const total         = issues.length
  const activeCount   = issues.filter(i => i.st === 'Open' || i.st === 'In Progress').length
  const overdueCount  = issues.filter(i => i.st === 'Overdue').length
  const closedCount   = issues.filter(i => i.st === 'Closed').length

  const filtered = issues.filter(i => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !vname(i.vendor).toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus && i.st !== filterStatus) return false
    if (filterPr     && i.pr !== filterPr) return false
    return true
  })

  function openAdd() {
    setEditIssue(null)
    setForm({ ...BLANK, id: 'i' + Date.now() })
    setModalOpen(true)
  }

  function openEdit(iss, e) {
    e.stopPropagation()
    setEditIssue(iss)
    setForm({ ...iss })
    setModalOpen(true)
  }

  function saveForm() {
    if (editIssue) {
      setIssues(prev => prev.map(i => i.id === form.id ? { ...form } : i))
    } else {
      setIssues(prev => [...prev, { ...form }])
    }
    setModalOpen(false)
  }

  const hasFilters = search || filterStatus || filterPr

  function updateMilestone(issueId, msId, patch) {
    setIssues(prev => prev.map(i => i.id !== issueId ? i : {
      ...i,
      milestones: (i.milestones||[]).map(m => m.id !== msId ? m : { ...m, ...patch }),
    }))
  }
  function addMilestone(issueId, title) {
    if (!title.trim()) return
    setIssues(prev => prev.map(i => i.id !== issueId ? i : {
      ...i,
      milestones: [...(i.milestones||[]), { id:'m'+Math.random().toString(36).slice(2,8), title, owner:'', dueDate:'', st:'To Do', notes:'' }],
    }))
  }
  function removeMilestone(issueId, msId) {
    setIssues(prev => prev.map(i => i.id !== issueId ? i : {
      ...i,
      milestones: (i.milestones||[]).filter(m => m.id !== msId),
    }))
  }
  const [msInputs, setMsInputs] = useState({})

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Issue Tracker</h1>
          <p className="text-xs text-gray-400 mt-0.5">{issues.length} issues · {activeCount} active</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Issue
        </button>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiTile label="Total Issues"      value={total}        colorClass="text-gray-800" />
        <KpiTile label="Open / In Progress" value={activeCount}  colorClass="text-blue-600" />
        <KpiTile label="Overdue"            value={overdueCount} colorClass={overdueCount > 0 ? 'text-red-600' : 'text-gray-400'} />
        <KpiTile label="Closed"             value={closedCount}  colorClass="text-green-600" />
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-gray-700">
            <strong className="text-red-600">{overdueCount} issue{overdueCount > 1 ? 's are' : ' is'} overdue.</strong>{' '}
            Review and update remediation status immediately.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search issues or vendors…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-600">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPr} onChange={e => setFilterPr(e.target.value)} className="text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-600">
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterPr('') }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Issue','Linked Risk','Vendor','Priority','Owner','Due','Evidence','Status',''].map((h, idx) => (
                  <th key={idx} className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-xs">
                    No issues match the current filters.
                  </td>
                </tr>
              )}
              {filtered.map((iss, i) => {
                const open = expandedId === iss.id
                return (
                  <Fragment key={iss.id}>
                    <tr
                      onClick={() => setExpandedId(prev => prev === iss.id ? null : iss.id)}
                      className={cn(
                        'border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors',
                        i % 2 === 1 && !open && iss.st !== 'Overdue' ? 'bg-gray-50/50' : '',
                        iss.st === 'Overdue' && !open ? 'bg-red-50/30 hover:bg-red-50/60' : '',
                        open ? 'bg-blue-50/40' : ''
                      )}
                    >
                      {/* Issue name + desc snippet */}
                      <td className="px-3 py-2.5 max-w-[220px]">
                        <div className="flex items-start gap-1.5">
                          <span className={cn('mt-1 w-1.5 h-1.5 rounded-full shrink-0', PRIORITY_DOT[iss.pr])} />
                          <div>
                            <div className="font-medium text-gray-800 leading-snug">{iss.name}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{iss.desc}</div>
                          </div>
                        </div>
                      </td>
                      {/* Linked risk */}
                      <td className="px-3 py-2.5 max-w-[180px]">
                        {iss.riskId
                          ? (
                            <button
                              onClick={e => { e.stopPropagation(); navigate('/risks', { state: { openRiskId: iss.riskId } }) }}
                              className="text-blue-600 hover:underline leading-snug line-clamp-2 text-[11px] cursor-pointer text-left"
                              title="Go to linked risk"
                            >{rname(iss.riskId)}</button>
                          )
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      {/* Vendor */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <button
                          onClick={e => { e.stopPropagation(); navigate('/vendors', { state: { openVendorName: vname(iss.vendor) } }) }}
                          className="text-blue-600 font-medium cursor-pointer hover:underline text-left"
                          title="Go to vendor"
                        >{vname(iss.vendor)}</button>
                        <div className="text-[10px] text-gray-400">{vtier(iss.vendor)}</div>
                      </td>
                      {/* Priority */}
                      <td className="px-3 py-2.5">
                        <button
                          onClick={e => { e.stopPropagation(); setFilterPr(iss.pr) }}
                          className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded cursor-pointer', PRIORITY_BADGE[iss.pr] || 'bg-gray-100 text-gray-600')}
                          title="Filter by priority"
                        >{iss.pr}</button>
                      </td>
                      {/* Owner */}
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{iss.owner}</td>
                      {/* Due */}
                      <td className={cn('px-3 py-2.5 whitespace-nowrap', iss.st === 'Overdue' ? 'text-red-600 font-semibold' : 'text-gray-400')}>
                        {iss.due}
                      </td>
                      {/* Evidence */}
                      <td className="px-3 py-2.5">
                        {iss.ev
                          ? <span className="text-blue-500 underline underline-offset-2 cursor-pointer hover:text-blue-700 text-[11px]">{iss.ev}</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      {/* Status */}
                      <td className="px-3 py-2.5">
                        <button
                          onClick={e => { e.stopPropagation(); setFilterStatus(iss.st) }}
                          className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded cursor-pointer', STATUS_BADGE[iss.st] || 'bg-gray-100 text-gray-600')}
                          title="Filter by status"
                        >{iss.st}</button>
                      </td>
                      {/* Edit */}
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={e => openEdit(iss, e)}
                          className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>

                    {open && (
                      <tr className="bg-blue-50/30 border-b border-blue-100">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 text-xs mb-4">
                            <div className="lg:col-span-2">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Description</p>
                              <p className="text-gray-700 leading-relaxed">{iss.desc || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Linked Risk</p>
                              <button className="text-blue-500 hover:underline text-left leading-snug" onClick={() => navigate('/risks', { state:{ openRiskId: iss.riskId } })}>{iss.riskId ? rname(iss.riskId) : '—'}</button>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Evidence</p>
                              <p className="text-gray-600">{iss.ev || '—'}</p>
                            </div>
                          </div>

                          {/* Milestones */}
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                              Remediation Milestones
                              {(iss.milestones||[]).length > 0 && (
                                <span className="ml-2 font-normal normal-case text-gray-400">
                                  {(iss.milestones||[]).filter(m=>m.st==='Done').length}/{(iss.milestones||[]).length} done
                                  {' · '}
                                  <span className="text-gray-500">{Math.round(((iss.milestones||[]).filter(m=>m.st==='Done').length/Math.max(1,(iss.milestones||[]).length))*100)}%</span>
                                </span>
                              )}
                            </p>
                            {/* Progress bar */}
                            {(iss.milestones||[]).length > 0 && (
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3 w-full max-w-sm">
                                <div className="h-full bg-blue-500 rounded-full transition-all"
                                  style={{width:`${Math.round(((iss.milestones||[]).filter(m=>m.st==='Done').length/Math.max(1,(iss.milestones||[]).length))*100)}%`}} />
                              </div>
                            )}
                            <table className="w-full text-xs mb-3">
                              <thead className="bg-white/60 border-b border-gray-200">
                                <tr>
                                  {['Milestone','Owner','Due','Status','Notes',''].map(h=>(
                                    <th key={h} className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(iss.milestones||[]).length === 0 && (
                                  <tr><td colSpan={6} className="px-2 py-3 text-gray-400 text-center">No milestones yet</td></tr>
                                )}
                                {(iss.milestones||[]).map(ms => (
                                  <tr key={ms.id} className="border-b border-gray-100/60 hover:bg-white/50">
                                    <td className="px-2 py-1.5 text-gray-700">{ms.title}</td>
                                    <td className="px-2 py-1.5">
                                      <input className="w-20 text-[11px] border-b border-gray-200 focus:outline-none focus:border-blue-400 bg-transparent" value={ms.owner} placeholder="Owner" onChange={e=>updateMilestone(iss.id,ms.id,{owner:e.target.value})} />
                                    </td>
                                    <td className="px-2 py-1.5">
                                      <input type="date" className="text-[11px] border-b border-gray-200 focus:outline-none focus:border-blue-400 bg-transparent" value={ms.dueDate} onChange={e=>updateMilestone(iss.id,ms.id,{dueDate:e.target.value})} />
                                    </td>
                                    <td className="px-2 py-1.5">
                                      <select className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full border-0 focus:outline-none', MS_STATUS_COLORS[ms.st])} value={ms.st} onChange={e=>updateMilestone(iss.id,ms.id,{st:e.target.value})}>
                                        {MS_STATUS.map(s=><option key={s}>{s}</option>)}
                                      </select>
                                    </td>
                                    <td className="px-2 py-1.5">
                                      <input className="w-32 text-[11px] border-b border-gray-200 focus:outline-none focus:border-blue-400 bg-transparent text-gray-500" value={ms.notes} placeholder="Notes…" onChange={e=>updateMilestone(iss.id,ms.id,{notes:e.target.value})} />
                                    </td>
                                    <td className="px-2 py-1.5">
                                      <button onClick={()=>removeMilestone(iss.id,ms.id)} className="text-gray-300 hover:text-red-400 text-[10px]">✕</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {/* Add milestone */}
                            <div className="flex gap-2" onClick={e=>e.stopPropagation()}>
                              <input
                                className="flex-1 text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
                                placeholder="Add milestone…"
                                value={msInputs[iss.id]||''}
                                onChange={e => { const v=e.target.value; setMsInputs(p => { const n={...p}; n[iss.id]=v; return n }) }}
                                onKeyDown={e => { if(e.key==='Enter'){ addMilestone(iss.id, msInputs[iss.id]||''); setMsInputs(p => { const n={...p}; n[iss.id]=''; return n }) } }}
                              />
                              <button
                                onClick={() => { addMilestone(iss.id, msInputs[iss.id]||''); setMsInputs(p => { const n={...p}; n[iss.id]=''; return n }) }}
                                className="text-xs bg-[#0176d3] text-white rounded px-3 py-1.5 hover:bg-blue-700"
                              >Add</button>
                            </div>
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
          Showing {filtered.length} of {issues.length} issues
        </div>
      </div>

      {/* Add / Edit modal — right-side panel */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setModalOpen(false)} />
          <div className="w-[440px] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-sm font-semibold text-gray-800">{editIssue ? 'Edit Issue' : 'Add Issue'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              <FormField label="Issue Name">
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Describe the issue…"
                  className={inputCls}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Vendor">
                  <select value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} className={inputCls}>
                    {VENDORS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Linked Risk">
                  <select value={form.riskId} onChange={e => setForm(f => ({ ...f, riskId: e.target.value }))} className={inputCls}>
                    <option value="">— None —</option>
                    {RISKS_REF.map(r => <option key={r.id} value={r.id}>{r.id.toUpperCase()}: {r.name.slice(0, 36)}{r.name.length > 36 ? '…' : ''}</option>)}
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Priority">
                  <select value={form.pr} onChange={e => setForm(f => ({ ...f, pr: e.target.value }))} className={inputCls}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
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

              <FormField label="Evidence">
                <input value={form.ev} onChange={e => setForm(f => ({ ...f, ev: e.target.value }))} placeholder="Ticket #, document ref…" className={inputCls} />
              </FormField>

              <FormField label="Description">
                <textarea rows={4} value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="Issue description…" className={cn(inputCls, 'resize-none')} />
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
                {editIssue ? 'Save Changes' : 'Add Issue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
