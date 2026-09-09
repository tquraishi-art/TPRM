import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Search, Plus, X, ChevronDown, ChevronRight, AlertTriangle, Globe } from 'lucide-react'
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

const INIT_SUBPROCESSORS = [
  { id:'sp1',  vendor:'v1', name:'Amazon Web Services (AWS)',   svc:'Cloud infrastructure / compute',        region:'us-east-1, eu-west-1', dataClass:'Restricted', critLevel:'Critical',  cert:'ISO 27001, SOC 2',      status:'Active',    lastReview:'2026-06-01', nextReview:'2027-06-01', notes:'Primary compute and storage. All prod workloads.' },
  { id:'sp2',  vendor:'v1', name:'Cloudflare',                  svc:'CDN / DDoS protection',                 region:'Global',               dataClass:'Internal',   critLevel:'High',      cert:'SOC 2 Type II',         status:'Active',    lastReview:'2026-04-10', nextReview:'2027-04-10', notes:'Edge network. No PII in transit.' },
  { id:'sp3',  vendor:'v1', name:'Datadog',                     svc:'Observability / logging',               region:'us-east-1',            dataClass:'Confidential',critLevel:'Moderate',  cert:'SOC 2 Type II',         status:'Active',    lastReview:'2026-03-15', nextReview:'2027-03-15', notes:'Logs may contain metadata — DPA in place.' },
  { id:'sp4',  vendor:'v2', name:'Amazon Web Services (AWS)',   svc:'Data storage / S3',                     region:'eu-west-1',            dataClass:'Restricted',  critLevel:'Critical',  cert:'ISO 27001, SOC 2',      status:'Active',    lastReview:'2026-05-20', nextReview:'2027-05-20', notes:'Encrypted S3 buckets for audit data.' },
  { id:'sp5',  vendor:'v2', name:'Splunk',                      svc:'SIEM / security analytics',             region:'us-west-2',            dataClass:'Confidential',critLevel:'High',      cert:'SOC 2 Type II',         status:'Active',    lastReview:'2026-02-01', nextReview:'2027-02-01', notes:'Security event data only. No customer PII.' },
  { id:'sp6',  vendor:'v3', name:'Visa / Mastercard Networks',  svc:'Card scheme processing',                region:'Global',               dataClass:'Restricted / PII', critLevel:'Critical', cert:'PCI-DSS Level 1',  status:'Active',    lastReview:'2026-07-01', nextReview:'2027-07-01', notes:'Mandatory card scheme dependency.' },
  { id:'sp7',  vendor:'v3', name:'Temenos',                     svc:'Core banking platform',                 region:'eu-central-1',         dataClass:'Restricted',  critLevel:'Critical',  cert:'ISO 27001',             status:'Active',    lastReview:'2026-01-15', nextReview:'2027-01-15', notes:'Payment transaction processing.' },
  { id:'sp8',  vendor:'v3', name:'Equifax',                     svc:'Credit risk scoring',                   region:'us-east-1',            dataClass:'Restricted / PII', critLevel:'High', cert:'SOC 2',             status:'Active',    lastReview:'2026-04-01', nextReview:'2027-04-01', notes:'Consumer credit data — DPA required annually.' },
  { id:'sp9',  vendor:'v4', name:'Microsoft Azure',             svc:'Document management / M365',            region:'eu-west-1',            dataClass:'Confidential',critLevel:'Moderate',  cert:'ISO 27001, SOC 2',      status:'Active',    lastReview:'2026-06-10', nextReview:'2027-06-10', notes:'Legal docs and email. Standard enterprise agreement.' },
  { id:'sp10', vendor:'v5', name:'Oracle Transportation Mgmt',  svc:'Logistics platform',                    region:'us-east-1',            dataClass:'Internal',   critLevel:'Moderate',  cert:'SOC 1 Type II',         status:'Active',    lastReview:'2025-12-01', nextReview:'2026-12-01', notes:'Shipment routing and tracking only.' },
]

const CRIT_COLORS = {
  'Critical': 'bg-red-100 text-red-700 border-red-200',
  'High':     'bg-orange-100 text-orange-700 border-orange-200',
  'Moderate': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Low':      'bg-blue-100 text-blue-700 border-blue-200',
}
const DC_COLORS = {
  'Restricted':        'bg-red-50 text-red-600',
  'Restricted / PII':  'bg-red-50 text-red-600',
  'Confidential':      'bg-orange-50 text-orange-600',
  'Internal':          'bg-gray-50 text-gray-500',
  'None':              'bg-gray-50 text-gray-400',
}
const STATUS_COLORS = {
  'Active':   'bg-green-100 text-green-700',
  'Inactive': 'bg-gray-100 text-gray-400',
  'Under Review': 'bg-blue-100 text-blue-700',
}
const TIER_COLORS = {
  'Tier 1': 'bg-red-100 text-red-700',
  'Tier 2': 'bg-orange-100 text-orange-700',
  'Tier 3': 'bg-yellow-100 text-yellow-700',
  'Tier 4': 'bg-gray-100 text-gray-500',
}

const BLANK = { vendor:'v1', name:'', svc:'', region:'', dataClass:'Internal', critLevel:'Moderate', cert:'', status:'Active', lastReview:'', nextReview:'', notes:'' }

// ─── Concentration analysis ───────────────────────────────────────────────────

function getConcentration(subprocessors) {
  const counts = {}
  subprocessors.filter(s => s.status === 'Active').forEach(s => {
    const key = s.name
    counts[key] = (counts[key] || { name: s.name, vendors: new Set(), critical: 0 })
    counts[key].vendors.add(s.vendor)
    if (s.critLevel === 'Critical') counts[key].critical++
  })
  return Object.values(counts)
    .map(c => ({ ...c, vendors: c.vendors.size }))
    .filter(c => c.vendors > 1)
    .sort((a, b) => b.vendors - a.vendors)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ label, cls }) {
  return <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap', cls)}>{label}</span>
}

const EMPTY_FORM_FIELDS = [
  { label:'Sub-processor Name', key:'name',      type:'text',   span:2 },
  { label:'Vendor',             key:'vendor',    type:'select', opts: VENDORS.map(v => ({ val:v.id, label:`${v.name} (${v.tier})` })) },
  { label:'Service Provided',   key:'svc',       type:'text' },
  { label:'Data Region',        key:'region',    type:'text' },
  { label:'Data Classification',key:'dataClass', type:'select', opts:['Restricted','Restricted / PII','Confidential','Internal','None'].map(x=>({val:x,label:x})) },
  { label:'Criticality',        key:'critLevel', type:'select', opts:['Critical','High','Moderate','Low'].map(x=>({val:x,label:x})) },
  { label:'Certifications',     key:'cert',      type:'text' },
  { label:'Status',             key:'status',    type:'select', opts:['Active','Inactive','Under Review'].map(x=>({val:x,label:x})) },
  { label:'Last Review',        key:'lastReview',type:'date' },
  { label:'Next Review',        key:'nextReview',type:'date' },
  { label:'Notes',              key:'notes',     type:'textarea', span:2 },
]

export default function FourthParty() {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const [data, setData]           = useLocalStorage('tprm:fourthparty', INIT_SUBPROCESSORS)
  const [q, setQ]                 = useState('')
  const [filterVendor, setFilterVendor] = useState('')
  const [filterCrit, setFilterCrit]     = useState('')
  const [filterDC, setFilterDC]         = useState('')
  const [expandedVendor, setExpandedVendor] = useState(null)
  const [modal, setModal]         = useState(null)
  const [form, setForm]           = useState(BLANK)

  useEffect(() => {
    if (state?.filterVendor) setFilterVendor(state.filterVendor)
    if (state?.expandVendor) setExpandedVendor(state.expandVendor)
  }, [state])

  const filtered = data.filter(s => {
    if (q && !s.name.toLowerCase().includes(q.toLowerCase()) && !s.svc.toLowerCase().includes(q.toLowerCase())) return false
    if (filterVendor && s.vendor !== filterVendor) return false
    if (filterCrit   && s.critLevel !== filterCrit) return false
    if (filterDC     && s.dataClass !== filterDC) return false
    return true
  })

  // Group by vendor for accordion view
  const grouped = VENDORS.map(v => ({
    vendor: v,
    items: filtered.filter(s => s.vendor === v.id),
  })).filter(g => g.items.length > 0)

  const concentration = getConcentration(data)
  const criticalCount = data.filter(s => s.critLevel === 'Critical' && s.status === 'Active').length
  const restrictedCount = data.filter(s => (s.dataClass === 'Restricted' || s.dataClass === 'Restricted / PII') && s.status === 'Active').length
  const overdue = data.filter(s => s.nextReview && new Date(s.nextReview) < new Date() && s.status === 'Active').length

  function openAdd()    { setForm({...BLANK}); setModal({ mode:'add' }) }
  function openEdit(s)  { setForm({...s});     setModal({ mode:'edit', id:s.id }) }
  function saveForm() {
    if (!form.name.trim()) return
    if (modal.mode === 'add') {
      setData(prev => [...prev, { ...form, id:'sp'+Math.random().toString(36).slice(2,8) }])
    } else {
      setData(prev => prev.map(s => s.id === modal.id ? { ...form, id:modal.id } : s))
    }
    setModal(null)
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Fourth-Party / Sub-processor Registry</h1>
          <p className="text-xs text-gray-400 mt-0.5">Critical sub-processors and technology dependencies of your third-party vendors · GDPR Art.28 / DORA / PCI-DSS</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#0176d3] text-white text-xs font-medium px-3 py-2 rounded hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5" /> Add Sub-processor
        </button>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Total Sub-processors', value: data.filter(s=>s.status==='Active').length, color:'text-gray-800' },
          { label:'Critical Dependencies', value: criticalCount, color:'text-red-600',
            onClick:() => setFilterCrit(f => f === 'Critical' ? '' : 'Critical') },
          { label:'Restricted Data Access', value: restrictedCount, color:'text-orange-500',
            onClick:() => setFilterDC(f => f === 'Restricted' ? '' : 'Restricted') },
          { label:'Reviews Overdue', value: overdue, color: overdue > 0 ? 'text-red-600' : 'text-green-600' },
        ].map(k => (
          <button key={k.label} onClick={k.onClick}
            className={cn('bg-white border border-gray-200 rounded-lg p-4 text-left transition-all', k.onClick && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer')}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{k.label}</div>
            <div className={cn('text-2xl font-bold', k.color)}>{k.value}</div>
          </button>
        ))}
      </div>

      {/* Concentration Risk Alert */}
      {concentration.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-amber-700">Concentration Risk Detected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {concentration.map(c => (
              <span key={c.name} className="text-[11px] bg-amber-100 text-amber-800 border border-amber-200 rounded px-2 py-1">
                <strong>{c.name}</strong> used by {c.vendors} vendors{c.critical > 0 && <span className="text-red-600 font-bold"> · {c.critical} critical</span>}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-amber-600 mt-2">Multiple critical vendors share the same sub-processor — a single failure could cascade. Review Business Continuity plans.</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400" placeholder="Search sub-processors…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterVendor} onChange={e=>setFilterVendor(e.target.value)}>
          <option value="">All Vendors</option>
          {VENDORS.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterCrit} onChange={e=>setFilterCrit(e.target.value)}>
          <option value="">All Criticality</option>
          {['Critical','High','Moderate','Low'].map(c=><option key={c}>{c}</option>)}
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterDC} onChange={e=>setFilterDC(e.target.value)}>
          <option value="">All Data Classes</option>
          {['Restricted','Restricted / PII','Confidential','Internal'].map(c=><option key={c}>{c}</option>)}
        </select>
        {(q||filterVendor||filterCrit||filterDC) && (
          <button onClick={()=>{setQ('');setFilterVendor('');setFilterCrit('');setFilterDC('')}} className="text-xs text-blue-500 hover:text-blue-700 px-2">Clear</button>
        )}
      </div>

      {/* Accordion grouped by vendor */}
      <div className="space-y-3">
        {grouped.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-8 text-center text-xs text-gray-400">No sub-processors match filters</div>
        )}
        {grouped.map(({ vendor, items }) => {
          const isOpen = expandedVendor === vendor.id || (filterVendor === vendor.id) || grouped.length === 1
          return (
            <div key={vendor.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Vendor header */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedVendor(v => v === vendor.id ? null : vendor.id)}
              >
                <div className="flex items-center gap-3">
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', TIER_COLORS[vendor.tier])}>{vendor.tier}</span>
                  <span className="text-sm font-semibold text-gray-800">{vendor.name}</span>
                  <span className="text-[10px] text-gray-400">{items.length} sub-processor{items.length !== 1 ? 's' : ''}</span>
                  {items.some(s => s.critLevel === 'Critical') && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full border border-red-200">Critical dependency</span>
                  )}
                  {items.some(s => s.nextReview && new Date(s.nextReview) < new Date() && s.status === 'Active') && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200">Review overdue</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); navigate('/vendors', { state:{ openVendorName: vendor.name } }) }}
                    className="text-[10px] text-blue-500 hover:underline mr-2"
                  >View vendor →</button>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {/* Sub-processor table */}
              {isOpen && (
                <div className="border-t border-gray-100 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Sub-processor','Service','Region','Data Classification','Criticality','Certifications','Status','Next Review',''].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((s, i) => {
                        const od = s.nextReview && new Date(s.nextReview) < new Date() && s.status === 'Active'
                        return (
                          <tr key={s.id} className={cn('border-b border-gray-50 hover:bg-blue-50/30 transition-colors', i%2===1 && 'bg-gray-50/30')}>
                            <td className="px-3 py-2.5">
                              <div className="font-medium text-gray-800 flex items-center gap-1.5">
                                <Globe className="w-3 h-3 text-gray-300 shrink-0" />
                                {s.name}
                              </div>
                              {s.notes && <div className="text-[10px] text-gray-400 truncate max-w-[200px] mt-0.5">{s.notes}</div>}
                            </td>
                            <td className="px-3 py-2.5 text-gray-600 max-w-[140px]">
                              <div className="truncate">{s.svc}</div>
                            </td>
                            <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{s.region}</td>
                            <td className="px-3 py-2.5">
                              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded', DC_COLORS[s.dataClass] || 'bg-gray-50 text-gray-500')}>{s.dataClass}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <button onClick={() => setFilterCrit(f => f === s.critLevel ? '' : s.critLevel)} title="Filter by criticality">
                                <Badge label={s.critLevel} cls={cn(CRIT_COLORS[s.critLevel] || 'bg-gray-100 text-gray-500 border-gray-200', 'hover:opacity-80 cursor-pointer')} />
                              </button>
                            </td>
                            <td className="px-3 py-2.5 text-gray-500 max-w-[140px]">
                              <div className="truncate">{s.cert || '—'}</div>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-500')}>{s.status}</span>
                            </td>
                            <td className={cn('px-3 py-2.5 whitespace-nowrap text-xs', od ? 'text-red-600 font-semibold' : 'text-gray-400')}>
                              {s.nextReview || '—'}{od && ' ⚠'}
                            </td>
                            <td className="px-3 py-2.5">
                              <button onClick={() => openEdit(s)} className="text-[10px] text-blue-500 hover:underline">Edit</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary note */}
      <div className="text-[10px] text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        <strong className="text-gray-500">Regulatory basis:</strong> GDPR Article 28 requires controllers to ensure sub-processors provide sufficient guarantees. DORA Article 28 requires financial entities to maintain a register of all ICT third-party and fourth-party dependencies. PCI-DSS Req. 12.8 requires management of all third-party service providers with access to cardholder data.
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">{modal.mode==='add' ? 'Add Sub-processor' : 'Edit Sub-processor'}</h3>
              <button onClick={()=>setModal(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              {EMPTY_FORM_FIELDS.map(f => (
                <div key={f.key} className={f.span===2 ? 'col-span-2' : ''}>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.label}</label>
                  {f.type === 'select'
                    ? <select className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400" value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}>
                        {f.opts.map(o=><option key={o.val} value={o.val}>{o.label}</option>)}
                      </select>
                    : f.type === 'textarea'
                    ? <textarea rows={2} className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400 resize-none" value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} />
                    : <input type={f.type} className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400" value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} />
                  }
                </div>
              ))}
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
