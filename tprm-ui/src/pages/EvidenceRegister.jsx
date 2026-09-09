import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { FileText, Plus, X, Search, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Data ─────────────────────────────────────────────────────────────────────

const VENDORS = [
  'CloudSystems Inc', 'DataSecure LLC', 'GlobalPay Corp',
  'LegalEagle LLP', 'FastShip Logistics', 'MedConsult Group',
]

const DOC_TYPES = [
  'SOC 2 Type II', 'ISO 27001 Certificate', 'PCI-DSS RoC',
  'Penetration Test Report', 'Business Continuity Plan', 'GDPR DPA',
  'Insurance Certificate', 'Financial Statements', 'SLA Agreement',
  'Security Policy', 'Disaster Recovery Plan', 'Vulnerability Scan',
]

const OWNER_TEAMS = ['Security', 'Legal', 'Finance', 'Compliance', 'Procurement', 'Operations']

const TODAY = '2026-09-09'

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.round((new Date(dateStr) - new Date(TODAY)) / 86400000)
}

function expiryStatus(dateStr) {
  const d = daysUntil(dateStr)
  if (d === null) return 'unknown'
  if (d < 0)   return 'expired'
  if (d <= 30) return 'critical'
  if (d <= 90) return 'warning'
  return 'valid'
}

const STATUS_META = {
  expired:  { label: 'Expired',       badge: 'bg-red-100 text-red-700 border-red-200',    row: 'bg-red-50/40' },
  critical: { label: 'Expiring Soon', badge: 'bg-orange-100 text-orange-700 border-orange-200', row: 'bg-orange-50/30' },
  warning:  { label: 'Due in 90d',    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', row: '' },
  valid:    { label: 'Valid',          badge: 'bg-green-100 text-green-700 border-green-200', row: '' },
  unknown:  { label: 'No Expiry',     badge: 'bg-gray-100 text-gray-500 border-gray-200',  row: '' },
}

const INIT = [
  { id:'e1', vendor:'CloudSystems Inc',   docType:'SOC 2 Type II',           version:'2025',  issuedAt:'2025-09-01', expiresAt:'2026-09-30', ownerTeam:'Security',    ownerName:'S. Kim',     notes:'Annual audit; renewal in progress', status:'Received' },
  { id:'e2', vendor:'CloudSystems Inc',   docType:'Penetration Test Report',  version:'Q2-26', issuedAt:'2026-06-10', expiresAt:'2026-12-10', ownerTeam:'Security',    ownerName:'S. Kim',     notes:'External tester: SecureWorks', status:'Received' },
  { id:'e3', vendor:'DataSecure LLC',     docType:'ISO 27001 Certificate',    version:'2024',  issuedAt:'2024-03-15', expiresAt:'2027-03-15', ownerTeam:'Compliance',  ownerName:'T. Wilson',  notes:'Three-year cert; next surveillance audit Nov 2026', status:'Received' },
  { id:'e4', vendor:'DataSecure LLC',     docType:'GDPR DPA',                 version:'v2',    issuedAt:'2024-01-01', expiresAt:'2027-01-01', ownerTeam:'Legal',       ownerName:'R. Brown',   notes:'Reviewed post-Schrems II', status:'Received' },
  { id:'e5', vendor:'GlobalPay Corp',     docType:'PCI-DSS RoC',              version:'2025',  issuedAt:'2025-05-01', expiresAt:'2026-05-01', ownerTeam:'Compliance',  ownerName:'T. Wilson',  notes:'QSA: Verizon. Remediation required for 1.3', status:'Overdue' },
  { id:'e6', vendor:'GlobalPay Corp',     docType:'Insurance Certificate',    version:'2026',  issuedAt:'2026-01-01', expiresAt:'2026-12-31', ownerTeam:'Finance',     ownerName:'M. Patel',   notes:'Cyber liability £10M; public liability £5M', status:'Received' },
  { id:'e7', vendor:'LegalEagle LLP',     docType:'SLA Agreement',            version:'3.0',   issuedAt:'2023-07-01', expiresAt:'2026-07-01', ownerTeam:'Legal',       ownerName:'R. Brown',   notes:'3-year term; auto-renew clause', status:'Overdue' },
  { id:'e8', vendor:'LegalEagle LLP',     docType:'Financial Statements',     version:'FY25',  issuedAt:'2025-04-01', expiresAt:'2026-10-01', ownerTeam:'Finance',     ownerName:'M. Patel',   notes:'Audited FY2025 accounts', status:'Received' },
  { id:'e9', vendor:'FastShip Logistics', docType:'Business Continuity Plan', version:'v4',    issuedAt:'2025-11-01', expiresAt:'2026-11-01', ownerTeam:'Operations',  ownerName:'J. Lee',     notes:'Annual review due; test exercise scheduled Q4', status:'Received' },
  { id:'e10',vendor:'FastShip Logistics', docType:'Insurance Certificate',    version:'2026',  issuedAt:'2026-01-01', expiresAt:'2026-10-01', ownerTeam:'Finance',     ownerName:'M. Patel',   notes:'', status:'Received' },
  { id:'e11',vendor:'MedConsult Group',   docType:'Security Policy',          version:'2024',  issuedAt:'2024-06-01', expiresAt:'2026-06-01', ownerTeam:'Security',    ownerName:'S. Kim',     notes:'Outdated — 2026 version not yet received', status:'Overdue' },
  { id:'e12',vendor:'MedConsult Group',   docType:'Disaster Recovery Plan',   version:'v2',    issuedAt:'2024-09-01', expiresAt:'2026-09-01', ownerTeam:'Operations',  ownerName:'J. Lee',     notes:'DR test last completed Aug 2024', status:'Received' },
]

const BLANK = {
  vendor:'CloudSystems Inc', docType:'SOC 2 Type II', version:'',
  issuedAt:'', expiresAt:'', ownerTeam:'Security', ownerName:'', notes:'', status:'Requested',
}

export default function EvidenceRegister() {
  const navigate = useNavigate()
  const [records, setRecords]     = useLocalStorage('tprm:evidence', INIT)
  const [q, setQ]                 = useState('')
  const [filterV, setFilterV]     = useState('')
  const [filterSt, setFilterSt]   = useState('')
  const [filterOwner, setFilterOwner] = useState('')
  const [expandedId, setExpandedId]   = useState(null)
  const [modal, setModal]         = useState(null)
  const [form, setForm]           = useState(BLANK)

  const enriched = records.map(r => ({ ...r, _expiry: expiryStatus(r.expiresAt) }))

  const filtered = enriched.filter(r => {
    const search = q.toLowerCase()
    if (q && !r.vendor.toLowerCase().includes(search) && !r.docType.toLowerCase().includes(search) && !r.ownerName.toLowerCase().includes(search)) return false
    if (filterV && r.vendor !== filterV) return false
    if (filterOwner && r.ownerTeam !== filterOwner) return false
    if (filterSt) {
      if (filterSt === 'expired'  && r._expiry !== 'expired')  return false
      if (filterSt === 'critical' && r._expiry !== 'critical') return false
      if (filterSt === 'warning'  && r._expiry !== 'warning')  return false
      if (filterSt === 'valid'    && r._expiry !== 'valid')     return false
    }
    return true
  })

  // Sort: expired first, then critical, then warning, then valid
  const ORDER = { expired:0, critical:1, warning:2, valid:3, unknown:4 }
  const sorted = [...filtered].sort((a,b) => {
    const diff = ORDER[a._expiry] - ORDER[b._expiry]
    if (diff !== 0) return diff
    return (a.expiresAt || '').localeCompare(b.expiresAt || '')
  })

  const expired  = enriched.filter(r => r._expiry === 'expired')
  const critical = enriched.filter(r => r._expiry === 'critical')
  const warning  = enriched.filter(r => r._expiry === 'warning')
  const valid    = enriched.filter(r => r._expiry === 'valid')

  function openAdd()   { setForm({ ...BLANK }); setModal({ mode: 'add' }) }
  function openEdit(r) { setForm({ ...r });      setModal({ mode: 'edit', id: r.id }) }
  function save() {
    if (!form.vendor || !form.docType) return
    if (modal.mode === 'add') {
      setRecords(prev => [...prev, { ...form, id: 'e' + Math.random().toString(36).slice(2, 8) }])
    } else {
      setRecords(prev => prev.map(r => r.id === modal.id ? { ...form, id: modal.id } : r))
    }
    setModal(null)
  }
  function remove(id) {
    setRecords(prev => prev.filter(r => r.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Evidence Expiry Register</h1>
          <p className="text-xs text-gray-400 mt-0.5">Track vendor compliance documents, certifications, and evidence — with expiry alerts</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#0176d3] text-white text-xs font-medium px-3 py-2 rounded hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5" /> Add Evidence
        </button>
      </div>

      {/* Alert banner */}
      {(expired.length > 0 || critical.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="text-xs text-red-700">
            {expired.length > 0 && <span><strong>{expired.length} document{expired.length > 1 ? 's' : ''} expired</strong> — immediate renewal required. </span>}
            {critical.length > 0 && <span><strong>{critical.length} document{critical.length > 1 ? 's' : ''} expiring within 30 days</strong> — renewal in progress?</span>}
          </div>
        </div>
      )}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Expired',          value: expired.length,  color: expired.length  > 0 ? 'text-red-600'    : 'text-green-600', filter:'expired'  },
          { label:'Expiring ≤30 days',value: critical.length, color: critical.length > 0 ? 'text-orange-500' : 'text-green-600', filter:'critical' },
          { label:'Expiring ≤90 days',value: warning.length,  color: warning.length  > 0 ? 'text-yellow-600' : 'text-green-600', filter:'warning'  },
          { label:'Valid',            value: valid.length,    color: 'text-green-600',                                           filter:'valid'    },
        ].map(k => (
          <button key={k.label}
            onClick={() => setFilterSt(f => f === k.filter ? '' : k.filter)}
            className={cn('bg-white border rounded-lg p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5', filterSt === k.filter ? 'border-blue-400 ring-1 ring-blue-300' : 'border-gray-200')}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{k.label}</div>
            <div className={cn('text-2xl font-bold', k.color)}>{k.value}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
            placeholder="Search vendor, document type, owner…"
            value={q} onChange={e => setQ(e.target.value)}
          />
        </div>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterV} onChange={e => setFilterV(e.target.value)}>
          <option value="">All Vendors</option>
          {VENDORS.map(v => <option key={v}>{v}</option>)}
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterOwner} onChange={e => setFilterOwner(e.target.value)}>
          <option value="">All Teams</option>
          {OWNER_TEAMS.map(t => <option key={t}>{t}</option>)}
        </select>
        {(q || filterV || filterSt || filterOwner) && (
          <button onClick={() => { setQ(''); setFilterV(''); setFilterSt(''); setFilterOwner('') }} className="text-xs text-blue-500 hover:text-blue-700 px-2">Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Vendor', 'Document Type', 'Version', 'Issued', 'Expires', 'Days Left', 'Status', 'Owner Team', 'Owner', 'Doc Status', ''].map(h => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 text-[10px] uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400">No records match filters</td></tr>
            )}
            {sorted.map(r => {
              const sm = STATUS_META[r._expiry]
              const d  = daysUntil(r.expiresAt)
              const isOpen = expandedId === r.id
              return (
                <>
                  <tr
                    key={r.id}
                    className={cn('border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors', sm.row, isOpen && 'bg-blue-50/30')}
                    onClick={() => setExpandedId(v => v === r.id ? null : r.id)}
                  >
                    <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">
                      <button
                        className="text-blue-500 hover:underline text-left"
                        onClick={e => { e.stopPropagation(); navigate('/vendors', { state: { openVendorName: r.vendor } }) }}
                      >{r.vendor}</button>
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{r.docType}</td>
                    <td className="px-3 py-2.5 text-gray-500">{r.version}</td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{r.issuedAt || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap font-medium">{r.expiresAt || '—'}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {d === null ? <span className="text-gray-400">—</span>
                        : d < 0
                        ? <span className="text-red-600 font-bold">{Math.abs(d)}d ago</span>
                        : <span className={cn('font-semibold', d <= 30 ? 'text-orange-500' : d <= 90 ? 'text-yellow-600' : 'text-green-600')}>{d}d</span>
                      }
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-semibold', sm.badge)}>{sm.label}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        className="text-gray-600 hover:text-blue-500"
                        onClick={e => { e.stopPropagation(); setFilterOwner(v => v === r.ownerTeam ? '' : r.ownerTeam) }}
                        title="Filter by team"
                      >{r.ownerTeam}</button>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{r.ownerName}</td>
                    <td className="px-3 py-2.5">
                      <DocStatusBadge status={r.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(r)} className="text-blue-500 hover:underline text-[10px]">Edit</button>
                        <button onClick={() => remove(r.id)} className="text-gray-300 hover:text-red-400 text-[10px]">✕</button>
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={r.id + '-expand'} className="border-b border-gray-100 bg-blue-50/20">
                      <td colSpan={11} className="px-5 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <div><span className="text-gray-400 uppercase tracking-wide text-[10px] font-semibold block mb-0.5">Document Type</span>{r.docType}</div>
                          <div><span className="text-gray-400 uppercase tracking-wide text-[10px] font-semibold block mb-0.5">Version</span>{r.version || '—'}</div>
                          <div><span className="text-gray-400 uppercase tracking-wide text-[10px] font-semibold block mb-0.5">Issued</span>{r.issuedAt || '—'}</div>
                          <div><span className="text-gray-400 uppercase tracking-wide text-[10px] font-semibold block mb-0.5">Expires</span>{r.expiresAt || '—'}</div>
                          <div><span className="text-gray-400 uppercase tracking-wide text-[10px] font-semibold block mb-0.5">Owner Team</span>{r.ownerTeam}</div>
                          <div><span className="text-gray-400 uppercase tracking-wide text-[10px] font-semibold block mb-0.5">Owner Name</span>{r.ownerName || '—'}</div>
                          <div><span className="text-gray-400 uppercase tracking-wide text-[10px] font-semibold block mb-0.5">Document Status</span><DocStatusBadge status={r.status} /></div>
                          <div>
                            <span className="text-gray-400 uppercase tracking-wide text-[10px] font-semibold block mb-0.5">Vendor Profile</span>
                            <button className="text-blue-500 hover:underline text-xs" onClick={() => navigate('/vendors', { state: { openVendorName: r.vendor } })}>Open vendor →</button>
                          </div>
                          {r.notes && (
                            <div className="col-span-4">
                              <span className="text-gray-400 uppercase tracking-wide text-[10px] font-semibold block mb-0.5">Notes</span>
                              <p className="text-gray-700 leading-relaxed">{r.notes}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 px-1">
        {Object.entries(STATUS_META).filter(([k]) => k !== 'unknown').map(([k, m]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={cn('px-1.5 py-0.5 rounded-full border text-[9px] font-semibold', m.badge)}>{m.label}</span>
            {k === 'expired' ? 'Past expiry date'
              : k === 'critical' ? 'Expires within 30 days'
              : k === 'warning'  ? 'Expires within 90 days'
              : 'More than 90 days remaining'}
          </span>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">{modal.mode === 'add' ? 'Add Evidence Record' : 'Edit Evidence Record'}</h3>
              <button onClick={() => setModal(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label:'Vendor',        key:'vendor',    type:'select', opts: VENDORS.map(v => ({ val: v, label: v })) },
                  { label:'Document Type', key:'docType',   type:'select', opts: DOC_TYPES.map(d => ({ val: d, label: d })) },
                  { label:'Version / Reference', key:'version', type:'text' },
                  { label:'Document Status', key:'status', type:'select', opts:['Requested','Received','Under Review','Accepted','Overdue','Waived'].map(s=>({val:s,label:s})) },
                  { label:'Issued Date',   key:'issuedAt',  type:'date' },
                  { label:'Expiry Date',   key:'expiresAt', type:'date' },
                  { label:'Owner Team',    key:'ownerTeam', type:'select', opts: OWNER_TEAMS.map(t => ({ val: t, label: t })) },
                  { label:'Owner Name',    key:'ownerName', type:'text' },
                  { label:'Notes',         key:'notes',     type:'textarea', span: 2 },
                ].map(f => (
                  <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.label}</label>
                    {f.type === 'select'
                      ? <select className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400" value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}>
                          {f.opts.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                        </select>
                      : f.type === 'textarea'
                      ? <textarea rows={2} className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400 resize-none" value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                      : <input type={f.type} className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400" value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    }
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="text-xs border border-gray-200 rounded px-4 py-2 hover:bg-gray-50">Cancel</button>
              <button onClick={save} className="text-xs bg-[#0176d3] text-white rounded px-4 py-2 hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DocStatusBadge({ status }) {
  const c = {
    'Received':     'bg-green-100 text-green-700',
    'Under Review': 'bg-blue-100 text-blue-700',
    'Requested':    'bg-gray-100 text-gray-600',
    'Accepted':     'bg-emerald-100 text-emerald-700',
    'Overdue':      'bg-red-100 text-red-700',
    'Waived':       'bg-purple-100 text-purple-700',
  }[status] || 'bg-gray-100 text-gray-500'
  return <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', c)}>{status}</span>
}
