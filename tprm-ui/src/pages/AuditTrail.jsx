import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Seed data ────────────────────────────────────────────────────────────────

const USERS = ['S. Kim', 'T. Wilson', 'R. Brown', 'M. Patel', 'J. Lee', 'System']

const ACTION_TYPES = [
  'Risk Created', 'Risk Updated', 'Risk Closed',
  'Vendor Created', 'Vendor Updated',
  'Issue Created', 'Issue Updated', 'Issue Closed',
  'Evidence Added', 'Evidence Updated',
  'Incident Logged', 'Incident Updated',
  'Assessment Submitted', 'Assessment Approved',
  'Approval Recorded', 'Approval Rejected',
  'Offboarding Started', 'Checklist Item Updated',
  'Sub-processor Added', 'Sub-processor Removed',
  'Score Recalculated', 'KRI Threshold Breached',
]

const ENTITY_TYPES = ['Risk', 'Vendor', 'Issue', 'Evidence', 'Incident', 'Assessment', 'Approval', 'Offboarding', 'Sub-processor', 'KRI']

const SEED_LOGS = [
  // Risks
  { id:'al001', ts:'2026-09-09T09:14', user:'S. Kim',    action:'Risk Updated',          entity:'Risk',         entityName:'Unpatched software vulnerabilities in cloud platform',  entityId:'r1', field:'Residual Score', oldVal:'18', newVal:'14', notes:'Controls partially implemented; residual lowered after patch cycle Q3.' },
  { id:'al002', ts:'2026-09-08T16:32', user:'T. Wilson', action:'Risk Created',           entity:'Risk',         entityName:'Third-party AI tool data retention gap',               entityId:'r12', field:null, oldVal:null, newVal:null, notes:'New risk identified during AI vendor onboarding review.' },
  { id:'al003', ts:'2026-09-07T11:05', user:'R. Brown',  action:'Risk Updated',           entity:'Risk',         entityName:'PCI-DSS compliance gap – network segmentation',         entityId:'r3', field:'Treatment', oldVal:'Mitigate', newVal:'Transfer', notes:'Decision to transfer residual risk via cyber insurance; approved by CRO.' },
  { id:'al004', ts:'2026-09-05T14:21', user:'System',    action:'Score Recalculated',     entity:'Risk',         entityName:'Inadequate data encryption at rest',                    entityId:'r2', field:'Inherent Score', oldVal:'16', newVal:'18', notes:'Auto-recalculated after control effectiveness review.' },
  // Vendors
  { id:'al005', ts:'2026-09-09T08:50', user:'M. Patel',  action:'Vendor Updated',         entity:'Vendor',       entityName:'CloudSystems Inc',   entityId:'v1', field:'Status', oldVal:'Active', newVal:'Under Review', notes:'Moved to Under Review following ransomware incident.' },
  { id:'al006', ts:'2026-09-06T10:15', user:'T. Wilson', action:'Vendor Created',          entity:'Vendor',       entityName:'FinTech Solutions Ltd', entityId:'v7', field:null, oldVal:null, newVal:null, notes:'New Tier 2 vendor onboarded for payment analytics.' },
  // Issues
  { id:'al007', ts:'2026-09-08T13:44', user:'J. Lee',    action:'Issue Updated',           entity:'Issue',        entityName:'MFA not enforced on admin accounts',                   entityId:'i1', field:'Status', oldVal:'Open', newVal:'In Progress', notes:'Vendor confirmed rollout plan for MFA. Target: 2026-10-01.' },
  { id:'al008', ts:'2026-09-07T09:30', user:'S. Kim',    action:'Issue Closed',            entity:'Issue',        entityName:'Outdated SSL/TLS configuration on API gateway',        entityId:'i4', field:'Status', oldVal:'In Progress', newVal:'Closed', notes:'Verified via re-test. CVE-2024-1234 patched.' },
  // Evidence
  { id:'al009', ts:'2026-09-09T07:55', user:'T. Wilson', action:'Evidence Added',          entity:'Evidence',     entityName:'SOC 2 Type II – CloudSystems Inc 2025',                entityId:'e1', field:null, oldVal:null, newVal:null, notes:'Annual SOC 2 received. Reviewed — no exceptions noted.' },
  { id:'al010', ts:'2026-09-04T15:10', user:'R. Brown',  action:'Evidence Updated',        entity:'Evidence',     entityName:'PCI-DSS RoC – GlobalPay Corp 2025',                    entityId:'e5', field:'Doc Status', oldVal:'Received', newVal:'Overdue', notes:'QSA audit confirmed control gap. Remediation plan requested.' },
  // Incidents
  { id:'al011', ts:'2026-09-09T06:20', user:'System',    action:'Incident Logged',         entity:'Incident',     entityName:'Ransomware attack on CloudSystems production environment', entityId:'inc1', field:null, oldVal:null, newVal:null, notes:'Auto-logged from incident intake form.' },
  { id:'al012', ts:'2026-09-09T08:30', user:'S. Kim',    action:'Incident Updated',        entity:'Incident',     entityName:'Ransomware attack on CloudSystems production environment', entityId:'inc1', field:'Status', oldVal:'Triage', newVal:'Containment', notes:'Servers isolated. DORA 72h notification submitted.' },
  // Assessments & approvals
  { id:'al013', ts:'2026-09-03T11:00', user:'T. Wilson', action:'Assessment Submitted',    entity:'Assessment',   entityName:'CloudSystems Inc – IRQ Q3 2026',                        entityId:'irq1', field:null, oldVal:null, newVal:null, notes:'Annual IRQ assessment submitted for review.' },
  { id:'al014', ts:'2026-09-04T09:00', user:'R. Brown',  action:'Assessment Approved',     entity:'Assessment',   entityName:'CloudSystems Inc – IRQ Q3 2026',                        entityId:'irq1', field:'Status', oldVal:'Submitted', newVal:'Approved', notes:'Approved by Head of TPRM. Score: 3.8 (High).' },
  { id:'al015', ts:'2026-09-02T14:30', user:'M. Patel',  action:'Approval Recorded',       entity:'Approval',     entityName:'Risk Acceptance – Insider Threat (r9)',                 entityId:'r9', field:'Decision', oldVal:null, newVal:'Accepted', notes:'Board-level accept. Risk score 8 — within appetite. Next review 2027-09-02.' },
  // Fourth-party / offboarding
  { id:'al016', ts:'2026-08-28T10:00', user:'J. Lee',    action:'Sub-processor Added',     entity:'Sub-processor',entityName:'Datadog Inc – FastShip Logistics',                      entityId:'sp3', field:null, oldVal:null, newVal:null, notes:'Added to sub-processor register following contract update.' },
  { id:'al017', ts:'2026-08-15T09:00', user:'J. Lee',    action:'Offboarding Started',     entity:'Offboarding',  entityName:'FastShip Logistics',                                    entityId:'ob1', field:null, oldVal:null, newVal:null, notes:'Notice issued. Target exit: 2026-10-31.' },
  { id:'al018', ts:'2026-09-01T14:00', user:'J. Lee',    action:'Checklist Item Updated',  entity:'Offboarding',  entityName:'FastShip Logistics – Revoke VPN access',                entityId:'ob1', field:'Status', oldVal:'Not Started', newVal:'Completed', notes:'' },
  // KRI
  { id:'al019', ts:'2026-09-06T08:00', user:'System',    action:'KRI Threshold Breached',  entity:'KRI',          entityName:'% Critical Vendors with Overdue Assessments',          entityId:'kri4', field:'Value', oldVal:'22%', newVal:'31%', notes:'Auto-alert: threshold 25% breached. Escalation triggered.' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTION_COLORS = {
  'Risk Created':           'bg-blue-100 text-blue-700',
  'Risk Updated':           'bg-blue-50 text-blue-600',
  'Risk Closed':            'bg-green-100 text-green-700',
  'Vendor Created':         'bg-purple-100 text-purple-700',
  'Vendor Updated':         'bg-purple-50 text-purple-600',
  'Issue Created':          'bg-orange-100 text-orange-700',
  'Issue Updated':          'bg-orange-50 text-orange-600',
  'Issue Closed':           'bg-green-100 text-green-700',
  'Evidence Added':         'bg-teal-100 text-teal-700',
  'Evidence Updated':       'bg-teal-50 text-teal-600',
  'Incident Logged':        'bg-red-100 text-red-700',
  'Incident Updated':       'bg-red-50 text-red-600',
  'Assessment Submitted':   'bg-indigo-100 text-indigo-700',
  'Assessment Approved':    'bg-green-100 text-green-700',
  'Approval Recorded':      'bg-green-100 text-green-700',
  'Approval Rejected':      'bg-red-100 text-red-700',
  'Offboarding Started':    'bg-yellow-100 text-yellow-700',
  'Checklist Item Updated': 'bg-yellow-50 text-yellow-600',
  'Sub-processor Added':    'bg-cyan-100 text-cyan-700',
  'Sub-processor Removed':  'bg-red-50 text-red-600',
  'Score Recalculated':     'bg-gray-100 text-gray-600',
  'KRI Threshold Breached': 'bg-red-100 text-red-700',
}

const ENTITY_NAV = {
  'Risk':           (id) => ['/risks',        { openRiskId: id }],
  'Vendor':         (id, name) => ['/vendors', { openVendorName: name }],
  'Issue':          (id) => ['/issues',        { openIssueId: id }],
  'Evidence':       ()   => ['/evidence',      {}],
  'Incident':       ()   => ['/incidents',     {}],
  'Assessment':     ()   => ['/irqdash',       {}],
  'Approval':       (id) => ['/approvals',     { openRiskId: id }],
  'Offboarding':    ()   => ['/offboarding',   {}],
  'Sub-processor':  ()   => ['/fourthparty',   {}],
  'KRI':            (id) => ['/kri',           { openKriId: id }],
}

function datePart(ts) { return ts.slice(0, 10) }
function timePart(ts) { return ts.slice(11, 16) }

export default function AuditTrail() {
  const navigate = useNavigate()
  const [q, setQ]               = useState('')
  const [filterUser, setFilterUser]     = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterEntity, setFilterEntity] = useState('')
  const [fromDate, setFromDate]         = useState('')
  const [toDate, setToDate]             = useState('')
  const [expandedId, setExpandedId]     = useState(null)
  const [showFilters, setShowFilters]   = useState(false)

  const filtered = SEED_LOGS.filter(l => {
    if (filterUser   && l.user   !== filterUser)   return false
    if (filterAction && l.action !== filterAction) return false
    if (filterEntity && l.entity !== filterEntity) return false
    if (fromDate && l.ts < fromDate) return false
    if (toDate   && l.ts > toDate + 'T23:59') return false
    if (q) {
      const s = q.toLowerCase()
      if (!l.entityName.toLowerCase().includes(s) && !l.action.toLowerCase().includes(s) && !l.user.toLowerCase().includes(s) && !(l.notes||'').toLowerCase().includes(s)) return false
    }
    return true
  }).sort((a, b) => b.ts.localeCompare(a.ts))

  // Group by date for timeline view
  const grouped = filtered.reduce((acc, l) => {
    const d = datePart(l.ts)
    if (!acc[d]) acc[d] = []
    acc[d].push(l)
    return acc
  }, {})
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const hasFilters = q || filterUser || filterAction || filterEntity || fromDate || toDate

  function navToEntity(l) {
    const fn = ENTITY_NAV[l.entity]
    if (!fn) return
    const [path, state] = fn(l.entityId, l.entityName)
    navigate(path, { state })
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Audit Trail</h1>
          <p className="text-xs text-gray-400 mt-0.5">Immutable activity log — who changed what, when, and why across the TPRM platform</p>
        </div>
        <div className="text-xs text-gray-400">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Search + filter row */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
              placeholder="Search entity, action, user, notes…"
              value={q} onChange={e => setQ(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={cn('flex items-center gap-1.5 text-xs px-3 py-2 rounded border transition-colors', showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300')}
          >
            <Filter className="w-3.5 h-3.5" /> Filters
            {hasFilters && !q && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-0.5" />}
          </button>
          {hasFilters && <button onClick={() => { setQ(''); setFilterUser(''); setFilterAction(''); setFilterEntity(''); setFromDate(''); setToDate('') }} className="text-xs text-blue-500 hover:text-blue-700 px-2">Clear all</button>}
        </div>

        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">User</label>
              <select className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
                <option value="">All Users</option>
                {USERS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Action</label>
              <select className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
                <option value="">All Actions</option>
                {ACTION_TYPES.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Entity Type</label>
              <select className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" value={filterEntity} onChange={e => setFilterEntity(e.target.value)}>
                <option value="">All Types</option>
                {ENTITY_TYPES.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">From Date</label>
              <input type="date" className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">To Date</label>
              <input type="date" className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      {filtered.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-8 text-center text-xs text-gray-400">No events match filters</div>
      )}

      {dates.map(date => (
        <div key={date}>
          {/* Date heading */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">{date}</span>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] text-gray-300">{grouped[date].length} event{grouped[date].length !== 1 ? 's' : ''}</span>
          </div>

          {/* Events for this date */}
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-50">
            {grouped[date].map(log => {
              const isOpen = expandedId === log.id
              const actionColor = ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'

              return (
                <div key={log.id}>
                  <button
                    className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(v => v === log.id ? null : log.id)}
                  >
                    {/* Time */}
                    <span className="text-[11px] text-gray-400 font-mono w-12 shrink-0 mt-0.5">{timePart(log.ts)}</span>

                    {/* Action badge */}
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 mt-0.5', actionColor)}>{log.action}</span>

                    {/* Entity + summary */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{log.entity}</span>
                        <button
                          className="text-xs font-medium text-blue-500 hover:underline truncate max-w-[320px]"
                          onClick={e => { e.stopPropagation(); navToEntity(log) }}
                          title={log.entityName}
                        >{log.entityName}</button>
                      </div>
                      {log.field && (
                        <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-gray-600">{log.field}:</span>
                          {log.oldVal && <><span className="line-through text-gray-400">{log.oldVal}</span><span className="text-gray-300">→</span></>}
                          {log.newVal && <span className="font-semibold text-gray-700">{log.newVal}</span>}
                        </div>
                      )}
                      {log.notes && !isOpen && (
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[400px]">{log.notes}</p>
                      )}
                    </div>

                    {/* User */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-gray-500 whitespace-nowrap">
                        {log.user === 'System'
                          ? <span className="italic text-gray-400">System</span>
                          : log.user
                        }
                      </span>
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-300" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 bg-gray-50/60 border-t border-gray-100">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mb-3">
                        <div><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Timestamp</span>{log.ts.replace('T', ' ')}</div>
                        <div><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">User</span>{log.user}</div>
                        <div><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Entity Type</span>{log.entity}</div>
                        <div><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Action</span>
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', actionColor)}>{log.action}</span>
                        </div>
                        {log.field && (
                          <>
                            <div><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Field Changed</span>{log.field}</div>
                            {log.oldVal && <div><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Previous Value</span><span className="text-gray-500">{log.oldVal}</span></div>}
                            {log.newVal && <div><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">New Value</span><span className="font-semibold text-gray-800">{log.newVal}</span></div>}
                          </>
                        )}
                      </div>
                      {log.notes && (
                        <div className="text-xs">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Notes / Rationale</span>
                          <p className="text-gray-700 leading-relaxed">{log.notes}</p>
                        </div>
                      )}
                      <div className="mt-3">
                        <button onClick={() => navToEntity(log)} className="text-xs text-blue-500 hover:underline">View {log.entity} →</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Footer note */}
      <div className="text-[10px] text-gray-400 px-1">
        Audit records are append-only. Deletions and reversions are not permitted per DORA Art.25 and SOX Section 802.
      </div>
    </div>
  )
}
