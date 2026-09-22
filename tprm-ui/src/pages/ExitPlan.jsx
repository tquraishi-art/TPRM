import { useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Pencil, X, Check, ChevronDown, ChevronRight, AlertTriangle, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VENDORS_INIT } from '@/lib/seedData'

// ─── Seed data ────────────────────────────────────────────────────────────────

const INIT_PLANS = [
  {
    id: 'ep1', vendor: 'Amazon Web Services', priority: 'Critical',
    triggerConditions: [
      'Sustained SLA breach > 4h per quarter',
      'Material security incident attributable to AWS platform failure',
      'AWS price increase > 40% at contract renewal',
      'AWS sanctioned or restricted by relevant regulatory authority',
    ],
    replacementOptions: [
      { name: 'Google Cloud Platform (GCP)', readiness: 'Partial', notes: 'GCP used for analytics workloads already; full compute migration estimated 18–24 months' },
      { name: 'Microsoft Azure', readiness: 'Partial', notes: 'Azure used for M365; IaaS workload migration feasible but complex at $15.3B scale' },
    ],
    dataMigrationSteps: [
      'Export S3 data inventory and classify by workload criticality',
      'Provision equivalent storage/compute on target cloud',
      'Run parallel workloads for 30-day validation period',
      'Migrate DNS and traffic routing incrementally',
      'Decommission AWS resources after 90-day parallel run',
    ],
    exitTimeline: '18–24 months for full migration; 6 months for critical workloads',
    estimatedCost: '$50M–$150M migration cost estimate',
    owner: 'S. Kim',
    lastReviewed: '2026-09-01',
    status: 'Draft',
    notes: 'AWS concentration risk is the highest single-vendor exposure in the portfolio. Multi-cloud pilot in progress (see Issue i5). Exit plan requires CTO sign-off.',
  },
  {
    id: 'ep2', vendor: 'Okta', priority: 'Critical',
    triggerConditions: [
      'Okta SSO outage > 2 hours affecting all authenticated systems',
      'Critical security breach of Okta admin tenant',
      'Okta product discontinuation or acquisition with unfavourable terms',
    ],
    replacementOptions: [
      { name: 'Ping Identity', readiness: 'Low', notes: 'Enterprise IdP with SAML/OIDC support; 6–9 month migration timeline' },
      { name: 'Microsoft Entra ID (Azure AD)', readiness: 'Medium', notes: 'Already used for M365; could be extended to full SSO; tightest integration path' },
    ],
    dataMigrationSteps: [
      'Export all application integrations list from Okta admin console',
      'Provision secondary IdP in parallel (break-glass first)',
      'Migrate applications in tiers: low-criticality first',
      'Migrate MFA enrollments or re-enroll users',
      'Update DNS/SAML endpoints across all applications',
      'Decommission Okta after 60-day parallel run',
    ],
    exitTimeline: '6–9 months',
    estimatedCost: '$2M–$5M migration and re-integration cost',
    owner: 'M. Davis',
    lastReviewed: '2026-09-01',
    status: 'Draft',
    notes: 'Okta is sole SSO provider for all authenticated systems — exit would require coordinated effort across all product and IT teams. Break-glass procedures must be in place before exit is viable.',
  },
  {
    id: 'ep3', vendor: 'Google', priority: 'High',
    triggerConditions: [
      'Google Workspace GDPR/CCPA enforcement action with binding remediation order',
      'Google price increase > 50% at renewal',
      'Google AI data processing terms found non-compliant after DPA audit',
    ],
    replacementOptions: [
      { name: 'Microsoft 365', readiness: 'High', notes: 'Already in use; full Workspace → M365 migration feasible in 6–12 months' },
      { name: 'Zoho Workplace', readiness: 'Low', notes: 'Alternative for collaboration; limited enterprise feature parity' },
    ],
    dataMigrationSteps: [
      'Export Gmail, Drive, Calendar, Contacts per user via Google Takeout',
      'Provision M365 mailboxes and OneDrive for target users',
      'Run parallel mail routing for 30 days',
      'Migrate shared drives and convert Docs → Office formats',
      'Update DNS MX and SPF/DKIM records',
    ],
    exitTimeline: '6–12 months',
    estimatedCost: '$5M–$15M for migration tooling and labour',
    owner: 'T. Wilson',
    lastReviewed: '2026-08-15',
    status: 'Draft',
    notes: 'GCP workloads add complexity beyond Workspace exit. GCP exit is a separate, longer-term workstream.',
  },
  {
    id: 'ep4', vendor: 'NTT DATA INTELLILINK', priority: 'High',
    triggerConditions: [
      'Critical data breach attributable to NTT DATA personnel',
      'NTT DATA fails to pass annual security assessment two consecutive years',
      'Regulatory finding requiring cessation of offshore access to Restricted/PII data',
    ],
    replacementOptions: [
      { name: 'Infosys / Wipro', readiness: 'Medium', notes: 'Established TPRM-cleared vendors with equivalent multi-region capabilities' },
      { name: 'Internal resourcing', readiness: 'Low', notes: 'Partial insourcing feasible for highest-risk functions; full replacement not viable at scale' },
    ],
    dataMigrationSteps: [
      'Document all active SOWs and knowledge dependencies',
      'Identify critical personnel with unique system knowledge',
      'Run 90-day knowledge transfer period',
      'Revoke all contractor access and recover credentials/hardware',
      'Onboard replacement vendor through standard TPRM due-diligence',
    ],
    exitTimeline: '3–6 months',
    estimatedCost: '$3M–$8M for transition and onboarding',
    owner: 'M. Davis',
    lastReviewed: '2026-07-01',
    status: 'Draft',
    notes: 'Multi-region SOW complexity (AMER, EMEA, APAC, Japan) makes exit planning particularly important. PAM enforcement in progress.',
  },
  {
    id: 'ep5', vendor: 'Microsoft', priority: 'High',
    triggerConditions: [
      'Copilot AI data access causes regulatory enforcement action',
      'Microsoft E5 licensing audit results in material penalty',
      'Microsoft terminates enterprise agreement or materially changes terms',
    ],
    replacementOptions: [
      { name: 'Google Workspace + GCP', readiness: 'High', notes: 'Functionally equivalent; migration path well-understood' },
      { name: 'Open-source stack (LibreOffice, Nextcloud)', readiness: 'Low', notes: 'Not viable for enterprise scale without significant investment' },
    ],
    dataMigrationSteps: [
      'Export all Teams, SharePoint, OneDrive, Exchange data',
      'Provision Google Workspace or equivalent for target users',
      'Migrate email history and calendar data',
      'Reconfigure all enterprise integrations',
    ],
    exitTimeline: '9–18 months',
    estimatedCost: '$8M–$20M',
    owner: 'T. Wilson',
    lastReviewed: '2026-08-01',
    status: 'Draft',
    notes: 'M365 is deeply embedded across the enterprise. Exit is feasible but requires executive sponsorship.',
  },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS = {
  'Critical': 'bg-red-100 text-red-700',
  'High':     'bg-orange-100 text-orange-700',
  'Medium':   'bg-yellow-100 text-yellow-700',
  'Low':      'bg-gray-100 text-gray-500',
}

const STATUS_COLORS = {
  'Draft':    'bg-gray-100 text-gray-500',
  'Approved': 'bg-green-100 text-green-700',
  'Testing':  'bg-blue-100 text-blue-700',
  'Executed': 'bg-purple-100 text-purple-700',
}

const READINESS_COLORS = {
  'High':    'text-green-600',
  'Medium':  'text-yellow-600',
  'Partial': 'text-orange-600',
  'Low':     'text-red-600',
}

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low']
const STATUSES   = ['Draft', 'Approved', 'Testing', 'Executed']
const inputCls = 'w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white'

const BLANK = {
  id:'', vendor:'Amazon Web Services', priority:'High', owner:'', lastReviewed:'', status:'Draft', notes:'',
  triggerConditions:[], replacementOptions:[], dataMigrationSteps:[], exitTimeline:'', estimatedCost:'',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExitPlan() {
  const navigate = useNavigate()
  const [plans, setPlans]             = useLocalStorage('tprm:exitplans', INIT_PLANS)
  const [search, setSearch]           = useState('')
  const [filterPr, setFilterPr]       = useState('')
  const [filterSt, setFilterSt]       = useState('')
  const [expandedId, setExpandedId]   = useState(null)
  const [modalOpen, setModalOpen]     = useState(false)
  const [editPlan, setEditPlan]       = useState(null)
  const [form, setForm]               = useState(BLANK)

  const filtered = plans.filter(p => {
    if (search && !p.vendor.toLowerCase().includes(search.toLowerCase())) return false
    if (filterPr && p.priority !== filterPr) return false
    if (filterSt && p.status  !== filterSt)  return false
    return true
  })

  function openAdd() {
    setEditPlan(null)
    setForm({ ...BLANK, id: 'ep' + Date.now() })
    setModalOpen(true)
  }
  function openEdit(p, e) {
    e.stopPropagation()
    setEditPlan(p)
    setForm({ ...p })
    setModalOpen(true)
  }
  function saveForm() {
    if (editPlan) {
      setPlans(prev => prev.map(p => p.id === form.id ? { ...form } : p))
    } else {
      setPlans(prev => [...prev, { ...form }])
    }
    setModalOpen(false)
  }

  const criticalCount = plans.filter(p => p.priority === 'Critical').length
  const approvedCount = plans.filter(p => p.status === 'Approved' || p.status === 'Testing').length

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Vendor Exit & Contingency Planning</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Exit trigger conditions, replacement options, and migration steps for critical vendors
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Plan
        </button>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Exit Plans',     value:plans.length,   color:'text-gray-800' },
          { label:'Critical',       value:criticalCount,  color:'text-red-600' },
          { label:'Approved / Testing', value:approvedCount, color:'text-green-600' },
          { label:'Draft',          value:plans.filter(p=>p.status==='Draft').length, color:'text-gray-500' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-lg px-4 py-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{k.label}</div>
            <div className={cn('text-3xl font-bold leading-none', k.color)}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Alert: plans still in Draft */}
      {plans.filter(p => p.priority === 'Critical' && p.status === 'Draft').length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-700">
            <strong className="text-amber-700">{plans.filter(p => p.priority === 'Critical' && p.status === 'Draft').length} Critical exit plan{plans.filter(p => p.priority === 'Critical' && p.status === 'Draft').length > 1 ? 's are' : ' is'} still in Draft status.</strong>
            {' '}Review, approve, and test before a trigger event occurs.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
            placeholder="Search vendor…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterPr} onChange={e => setFilterPr(e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterSt} onChange={e => setFilterSt(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        {(search || filterPr || filterSt) && (
          <button onClick={() => { setSearch(''); setFilterPr(''); setFilterSt('') }} className="text-xs text-gray-400 hover:text-gray-600 underline">Clear</button>
        )}
      </div>

      {/* Plans */}
      <div className="space-y-3">
        {filtered.map(p => {
          const open = expandedId === p.id
          const vendor = VENDORS_INIT.find(v => v.name === p.vendor)
          return (
            <div key={p.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                className="w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(v => v === p.id ? null : p.id)}
              >
                <div className="mt-0.5 shrink-0">
                  <Building2 className="w-5 h-5 text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-800">{p.vendor}</span>
                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', PRIORITY_COLORS[p.priority])}>{p.priority}</span>
                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', STATUS_COLORS[p.status])}>{p.status}</span>
                    {vendor?.tier && <span className="text-[10px] text-gray-400">{vendor.tier}</span>}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Exit timeline: <span className="font-medium text-gray-700">{p.exitTimeline || '—'}</span>
                    {' · '}{p.replacementOptions.length} replacement option{p.replacementOptions.length !== 1 ? 's' : ''}
                    {' · '}{p.triggerConditions.length} trigger condition{p.triggerConditions.length !== 1 ? 's' : ''}
                    {' · '}Owner: <span className="font-medium text-gray-700">{p.owner || '—'}</span>
                    {p.lastReviewed && <> · Last reviewed: <span className="font-medium text-gray-700">{p.lastReviewed}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={e => openEdit(p, e)} className="text-gray-300 hover:text-blue-500 p-1 rounded hover:bg-gray-100 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {open && (
                <div className="border-t border-gray-100 px-5 py-5 bg-gray-50/40">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">

                    {/* Trigger conditions */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Exit Trigger Conditions</p>
                      <ul className="space-y-1.5">
                        {p.triggerConditions.map((t, i) => (
                          <li key={i} className="flex gap-2 text-gray-700">
                            <span className="w-4 h-4 rounded-full bg-red-100 text-red-600 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                            {t}
                          </li>
                        ))}
                        {p.triggerConditions.length === 0 && <li className="text-gray-400">No triggers documented</li>}
                      </ul>
                    </div>

                    {/* Replacement options */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Replacement Options</p>
                      <div className="space-y-2">
                        {p.replacementOptions.map((r, i) => (
                          <div key={i} className="bg-white border border-gray-100 rounded p-2">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-semibold text-gray-800">{r.name}</span>
                              <span className={cn('text-[10px] font-semibold', READINESS_COLORS[r.readiness] || 'text-gray-500')}>({r.readiness})</span>
                            </div>
                            <div className="text-[11px] text-gray-500">{r.notes}</div>
                          </div>
                        ))}
                        {p.replacementOptions.length === 0 && <div className="text-gray-400">No alternatives documented</div>}
                      </div>
                    </div>

                    {/* Migration steps + metadata */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Data Migration Steps</p>
                        <ol className="space-y-1">
                          {p.dataMigrationSteps.map((s, i) => (
                            <li key={i} className="flex gap-2 text-gray-700">
                              <span className="text-[10px] text-gray-400 font-semibold w-4 shrink-0">{i+1}.</span>
                              {s}
                            </li>
                          ))}
                          {p.dataMigrationSteps.length === 0 && <li className="text-gray-400">No steps documented</li>}
                        </ol>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 mb-0.5">Timeline</p>
                          <p className="text-gray-700 font-medium">{p.exitTimeline || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 mb-0.5">Est. Cost</p>
                          <p className="text-gray-700 font-medium">{p.estimatedCost || '—'}</p>
                        </div>
                      </div>
                      {p.notes && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 mb-0.5">Notes</p>
                          <p className="text-gray-600 leading-relaxed">{p.notes}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate('/vendors', { state: { openVendorName: p.vendor } })}
                          className="text-[11px] text-blue-500 hover:underline"
                        >
                          View vendor profile →
                        </button>
                        <button
                          onClick={() => navigate('/risks', { state: { filterVendor: p.vendor } })}
                          className="text-[11px] text-blue-500 hover:underline"
                        >
                          View risks →
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-8 text-center text-xs text-gray-400">
            No exit plans match filters
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setModalOpen(false)} />
          <div className="w-[480px] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-sm font-semibold text-gray-800">{editPlan ? 'Edit Exit Plan' : 'Add Exit Plan'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Vendor</label>
                <select value={form.vendor} onChange={e => setForm(f => ({...f, vendor: e.target.value}))} className={inputCls}>
                  {VENDORS_INIT.map(v => <option key={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))} className={inputCls}>
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={inputCls}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Owner</label>
                  <input value={form.owner} onChange={e => setForm(f => ({...f, owner: e.target.value}))} placeholder="e.g. M. Davis" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Last Reviewed</label>
                  <input type="date" value={form.lastReviewed} onChange={e => setForm(f => ({...f, lastReviewed: e.target.value}))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Exit Timeline</label>
                <input value={form.exitTimeline} onChange={e => setForm(f => ({...f, exitTimeline: e.target.value}))} placeholder="e.g. 12–18 months" className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Estimated Cost</label>
                <input value={form.estimatedCost} onChange={e => setForm(f => ({...f, estimatedCost: e.target.value}))} placeholder="e.g. $5M–$15M" className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Notes</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className={cn(inputCls, 'resize-none')} placeholder="Key considerations…" />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2 shrink-0">
              <button onClick={() => setModalOpen(false)} className="text-xs px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={saveForm}
                className="flex items-center gap-1.5 text-xs px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Check className="w-3 h-3" />{editPlan ? 'Save Changes' : 'Add Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
