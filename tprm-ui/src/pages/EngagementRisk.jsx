import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Plus, X, Search, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Seed data ────────────────────────────────────────────────────────────────

const VENDORS = [
  { id:'v1', name:'CloudSystems Inc',    tier:'Tier 1' },
  { id:'v2', name:'DataSecure LLC',      tier:'Tier 1' },
  { id:'v3', name:'GlobalPay Corp',      tier:'Tier 2' },
  { id:'v4', name:'LegalEagle LLP',      tier:'Tier 2' },
  { id:'v5', name:'FastShip Logistics',  tier:'Tier 3' },
  { id:'v6', name:'MedConsult Group',    tier:'Tier 4' },
]

const RISK_CATEGORIES = [
  'Cybersecurity', 'Data Privacy', 'Operational', 'Financial',
  'Compliance', 'Reputational', 'Concentration',
]

const LEVEL_FROM = s => s >= 20 ? 'Very High' : s >= 12 ? 'High' : s >= 6 ? 'Moderate' : s >= 2 ? 'Low' : 'Very Low'
const LEVEL_COLORS = {
  'Very High': { text:'text-red-600',    badge:'bg-red-100 text-red-700 border-red-200'    },
  'High':      { text:'text-orange-500', badge:'bg-orange-100 text-orange-700 border-orange-200' },
  'Moderate':  { text:'text-yellow-600', badge:'bg-yellow-100 text-yellow-700 border-yellow-200' },
  'Low':       { text:'text-blue-600',   badge:'bg-blue-100 text-blue-700 border-blue-200'   },
  'Very Low':  { text:'text-green-600',  badge:'bg-green-100 text-green-700 border-green-200'  },
}

const ENGAGEMENTS = [
  // CloudSystems Inc
  {
    id:'eng1', vendorId:'v1', product:'Core Application Hosting',
    description:'Production hosting of all customer-facing web and API services on AWS infrastructure managed by CloudSystems.',
    dataClassification:'Confidential', annualValue:2800000,
    inherent:24, residual:14, category:'Cybersecurity',
    contractExpiry:'2028-03-31', reviewDate:'2026-09-30', status:'Active',
    keyRisks:['Unpatched CVEs in managed AMIs','No customer-side control over patch cadence'],
    controls:['Monthly vulnerability scan','Contractual 30-day SLA patch window','Quarterly security review'],
  },
  {
    id:'eng2', vendorId:'v1', product:'CI/CD Pipeline as a Service',
    description:'CloudSystems manages build, test and deployment pipelines for all product releases.',
    dataClassification:'Internal', annualValue:800000,
    inherent:16, residual:10, category:'Operational',
    contractExpiry:'2028-03-31', reviewDate:'2026-09-30', status:'Active',
    keyRisks:['Pipeline compromise could inject malicious code into releases','Secrets in pipeline environment'],
    controls:['Code signing enforced','Secrets manager integration','SAST on every build'],
  },
  {
    id:'eng3', vendorId:'v1', product:'Managed Database (RDS)',
    description:'CloudSystems manages RDS clusters for transactional and analytics workloads.',
    dataClassification:'Restricted', annualValue:600000,
    inherent:20, residual:12, category:'Data Privacy',
    contractExpiry:'2028-03-31', reviewDate:'2026-09-30', status:'Under Review',
    keyRisks:['Encryption at rest partially enabled','DBA access not fully logged'],
    controls:['AES-256 migration in progress','CloudWatch audit logging enabled'],
  },
  // DataSecure LLC
  {
    id:'eng4', vendorId:'v2', product:'DLP & Encryption Platform',
    description:'DataSecure provides data loss prevention scanning and encryption key management services.',
    dataClassification:'Restricted', annualValue:1200000,
    inherent:18, residual:8, category:'Data Privacy',
    contractExpiry:'2027-06-30', reviewDate:'2026-10-15', status:'Active',
    keyRisks:['HSM failover not tested in 12 months','Key escrow policy unclear for acquisition scenario'],
    controls:['FIPS 140-2 HSM','Dual-control key ceremony','Annual SOC 2 Type II'],
  },
  {
    id:'eng5', vendorId:'v2', product:'Security Event Monitoring (SIEM)',
    description:'DataSecure ingests and correlates security logs from all production environments.',
    dataClassification:'Internal', annualValue:600000,
    inherent:14, residual:6, category:'Cybersecurity',
    contractExpiry:'2027-06-30', reviewDate:'2026-10-15', status:'Active',
    keyRisks:['Log retention below regulatory minimum if acquisition changes platform'],
    controls:['24/7 SOC coverage','180-day log retention','SIEM SLA 99.9%'],
  },
  // GlobalPay Corp
  {
    id:'eng6', vendorId:'v3', product:'Card Payment Processing',
    description:'GlobalPay processes all card-present and card-not-present transactions.',
    dataClassification:'Restricted', annualValue:3100000,
    inherent:24, residual:16, category:'Compliance',
    contractExpiry:'2027-01-31', reviewDate:'2026-09-15', status:'Under Review',
    keyRisks:['PCI-DSS network segmentation gap','FCA fine signals wider control weakness'],
    controls:['Tokenisation for stored card data','PCI-DSS RoC (expired — renewal in progress)','Fraud monitoring'],
  },
  // LegalEagle LLP
  {
    id:'eng7', vendorId:'v4', product:'Contract Management & Litigation',
    description:'LegalEagle provides contract lifecycle management and litigation support services.',
    dataClassification:'Confidential', annualValue:420000,
    inherent:10, residual:6, category:'Reputational',
    contractExpiry:'2026-07-01', reviewDate:'2026-10-01', status:'Overdue Review',
    keyRisks:['Senior partner named in civil litigation','Contract expired — operating on holdover'],
    controls:['NDA in place','Conflict of interest review annually'],
  },
  // FastShip Logistics
  {
    id:'eng8', vendorId:'v5', product:'Document Courier Network',
    description:'FastShip handles physical document delivery and sensitive mail.',
    dataClassification:'Internal', annualValue:480000,
    inherent: 8, residual: 4, category:'Operational',
    contractExpiry:'2027-09-30', reviewDate:'2026-11-01', status:'Active',
    keyRisks:['6-hour outage Sep 2026','No alternative courier SLA in contract'],
    controls:['Alternative courier identified','Track-and-trace for all sensitive items'],
  },
  // MedConsult Group
  {
    id:'eng9', vendorId:'v6', product:'Occupational Health Advisory',
    description:'Ad hoc occupational health consulting — low frequency, low data exposure.',
    dataClassification:'Internal', annualValue:210000,
    inherent: 4, residual: 2, category:'Operational',
    contractExpiry:'2027-03-31', reviewDate:'2027-01-01', status:'Active',
    keyRisks:['Financial instability — profit warning filed Aug 2026'],
    controls:['Annual financial review','Low data classification — limited exposure'],
  },
]

const STATUS_COLORS = {
  'Active':         'bg-green-100 text-green-700',
  'Under Review':   'bg-amber-100 text-amber-700',
  'Overdue Review': 'bg-red-100 text-red-700',
  'Suspended':      'bg-gray-100 text-gray-500',
}

const DC_COLORS = {
  'Restricted':   'bg-red-50 text-red-700 border-red-200',
  'Confidential': 'bg-orange-50 text-orange-700 border-orange-200',
  'Internal':     'bg-blue-50 text-blue-700 border-blue-200',
  'Public':       'bg-gray-50 text-gray-500 border-gray-200',
}

function fmt(n) { return n >= 1000000 ? `£${(n/1000000).toFixed(1)}M` : `£${(n/1000).toFixed(0)}K` }

const BLANK_ENG = {
  vendorId:'v1', product:'', description:'', dataClassification:'Internal',
  annualValue:'', inherent:12, residual:6, category:'Cybersecurity',
  contractExpiry:'', reviewDate:'', status:'Active',
  keyRisks:'', controls:'',
}

export default function EngagementRisk() {
  const navigate       = useNavigate()
  const { state }      = useLocation()
  const [filterV, setFilterV]   = useState(state?.filterVendorId || '')
  const [filterCat, setFilterCat] = useState('')
  const [filterSt, setFilterSt] = useState('')
  const [q, setQ]               = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState(BLANK_ENG)
  const [engagements, setEngagements] = useLocalStorage('tprm:engagements', ENGAGEMENTS)

  useEffect(() => {
    if (state?.filterVendorId) setFilterV(state.filterVendorId)
  }, [state])

  const filtered = engagements.filter(e => {
    const vname = VENDORS.find(v=>v.id===e.vendorId)?.name||''
    if (q && !e.product.toLowerCase().includes(q.toLowerCase()) && !vname.toLowerCase().includes(q.toLowerCase())) return false
    if (filterV   && e.vendorId  !== filterV)   return false
    if (filterCat && e.category  !== filterCat) return false
    if (filterSt  && e.status    !== filterSt)  return false
    return true
  })

  // Group by vendor
  const byVendor = VENDORS.reduce((acc, v) => {
    const items = filtered.filter(e => e.vendorId === v.id)
    if (items.length) acc[v.id] = items
    return acc
  }, {})

  const highRisk       = engagements.filter(e => LEVEL_FROM(e.residual) === 'Very High' || LEVEL_FROM(e.residual) === 'High')
  const overdueReview  = engagements.filter(e => e.status === 'Overdue Review')
  const restrictedData = engagements.filter(e => e.dataClassification === 'Restricted')
  const totalValue     = engagements.reduce((s,e)=>s+e.annualValue,0)

  function openAdd()   { setForm({...BLANK_ENG, keyRisks:'', controls:''}); setModal({mode:'add'}) }
  function openEdit(e) { setForm({...e, keyRisks: e.keyRisks.join('\n'), controls: e.controls.join('\n')}); setModal({mode:'edit', id:e.id}) }
  function save() {
    if (!form.product.trim() || !form.vendorId) return
    const entry = {
      ...form,
      annualValue: +form.annualValue || 0,
      inherent:    +form.inherent    || 12,
      residual:    +form.residual    || 6,
      keyRisks: typeof form.keyRisks === 'string' ? form.keyRisks.split('\n').filter(Boolean) : form.keyRisks,
      controls:  typeof form.controls === 'string' ? form.controls.split('\n').filter(Boolean) : form.controls,
    }
    if (modal.mode === 'add') {
      setEngagements(prev => [...prev, { ...entry, id:'eng'+Math.random().toString(36).slice(2,8) }])
    } else {
      setEngagements(prev => prev.map(e => e.id === modal.id ? { ...entry, id:modal.id } : e))
    }
    setModal(null)
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Engagement-level Risk</h1>
          <p className="text-xs text-gray-400 mt-0.5">Risk at the product / service level — beyond the vendor-level score</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#0176d3] text-white text-xs font-medium px-3 py-2 rounded hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5" /> Add Engagement
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'High / Very High Engagements', value: highRisk.length,      color: highRisk.length > 0 ? 'text-red-600' : 'text-green-600' },
          { label:'Restricted Data Engagements',  value: restrictedData.length,color:'text-orange-500' },
          { label:'Overdue Reviews',              value: overdueReview.length, color: overdueReview.length > 0 ? 'text-amber-500' : 'text-green-600' },
          { label:'Total Annual Engagement Value',value: fmt(totalValue),      color:'text-gray-800' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{k.label}</div>
            <div className={cn('text-xl font-bold', k.color)}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Alert */}
      {overdueReview.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            <strong>{overdueReview.length} engagement{overdueReview.length>1?'s':''} overdue for review</strong> — {overdueReview.map(e=>e.product).join(', ')}.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400" placeholder="Search product or vendor…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterV} onChange={e=>setFilterV(e.target.value)}>
          <option value="">All Vendors</option>
          {VENDORS.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {RISK_CATEGORIES.map(c=><option key={c}>{c}</option>)}
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterSt} onChange={e=>setFilterSt(e.target.value)}>
          <option value="">All Status</option>
          {['Active','Under Review','Overdue Review','Suspended'].map(s=><option key={s}>{s}</option>)}
        </select>
        {(q||filterV||filterCat||filterSt) && <button onClick={()=>{setQ('');setFilterV('');setFilterCat('');setFilterSt('')}} className="text-xs text-blue-500 hover:text-blue-700 px-2">Clear</button>}
      </div>

      {/* Content grouped by vendor */}
      {Object.keys(byVendor).length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-8 text-center text-xs text-gray-400">No engagements match filters</div>
      )}

      {VENDORS.filter(v => byVendor[v.id]).map(vendor => {
        const items = byVendor[vendor.id]
        const vendorHighRisk = items.filter(e => ['Very High','High'].includes(LEVEL_FROM(e.residual))).length
        return (
          <div key={vendor.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Vendor header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="text-sm font-semibold text-blue-500 hover:underline"
                  onClick={()=>navigate('/vendors',{state:{openVendorName:vendor.name}})}>{vendor.name}</button>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{vendor.tier}</span>
                {vendorHighRisk > 0 && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">{vendorHighRisk} high-risk engagement{vendorHighRisk>1?'s':''}</span>}
                <span className="text-[10px] text-gray-400">{items.length} engagement{items.length>1?'s':''}</span>
              </div>
              <span className="text-[10px] text-gray-400">
                Total value: <strong className="text-gray-600">{fmt(items.reduce((s,e)=>s+e.annualValue,0))}</strong>
              </span>
            </div>

            {/* Engagement rows */}
            <div className="divide-y divide-gray-50">
              {items.map(eng => {
                const level = LEVEL_FROM(eng.residual)
                const lc    = LEVEL_COLORS[level]
                const isOpen = expandedId === eng.id

                return (
                  <div key={eng.id}>
                    <button
                      className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
                      onClick={()=>setExpandedId(v=>v===eng.id?null:eng.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-semibold text-gray-800">{eng.product}</span>
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', lc.badge)}>{level}</span>
                          <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', DC_COLORS[eng.dataClassification]||'bg-gray-50 text-gray-500 border-gray-200')}>{eng.dataClassification}</span>
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', STATUS_COLORS[eng.status]||'bg-gray-100 text-gray-500')}>{eng.status}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-3 flex-wrap">
                          <span>{eng.category}</span>
                          <span>Inherent: <strong>{eng.inherent}</strong></span>
                          <span>Residual: <strong className={lc.text}>{eng.residual}</strong></span>
                          <span>Value: {fmt(eng.annualValue)}</span>
                          {eng.reviewDate && <span>Review: {eng.reviewDate}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={e=>{e.stopPropagation();openEdit(eng)}} className="text-[10px] text-blue-500 hover:underline">Edit</button>
                        {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400"/> : <ChevronRight className="w-4 h-4 text-gray-400"/>}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 bg-gray-50/40 border-t border-gray-100">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
                          <div className="lg:col-span-2 space-y-3">
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                              <p className="text-gray-700 leading-relaxed">{eng.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Key Risks</p>
                                <ul className="space-y-0.5">
                                  {eng.keyRisks.map((r,i)=><li key={i} className="flex gap-1.5 text-gray-700"><span className="text-red-400 shrink-0 mt-0.5">·</span>{r}</li>)}
                                </ul>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Controls in Place</p>
                                <ul className="space-y-0.5">
                                  {eng.controls.map((c,i)=><li key={i} className="flex gap-1.5 text-gray-700"><span className="text-green-400 shrink-0 mt-0.5">✓</span>{c}</li>)}
                                </ul>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2 text-[11px]">
                              {[
                                ['Inherent Score', `${eng.inherent} (${LEVEL_FROM(eng.inherent)})`, LEVEL_COLORS[LEVEL_FROM(eng.inherent)].text],
                                ['Residual Score', `${eng.residual} (${level})`, lc.text],
                                ['Data Classification', eng.dataClassification, null],
                                ['Annual Value', fmt(eng.annualValue), null],
                                ['Contract Expiry', eng.contractExpiry||'—', null],
                                ['Next Review', eng.reviewDate||'—', eng.status==='Overdue Review'?'text-red-500':null],
                              ].map(([label, val, color])=>(
                                <div key={label} className="flex justify-between">
                                  <span className="text-gray-400">{label}</span>
                                  <span className={cn('font-semibold text-gray-700', color||'')}>{val}</span>
                                </div>
                              ))}
                            </div>
                            <button onClick={()=>navigate('/vendors',{state:{openVendorName:vendor.name}})} className="text-xs text-blue-500 hover:underline w-full text-left">View vendor profile →</button>
                            <button onClick={()=>navigate('/risks',{state:{filterCat:eng.category}})} className="text-xs text-blue-500 hover:underline w-full text-left">View related risks →</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Add/Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">{modal.mode==='add'?'Add Engagement':'Edit Engagement'}</h3>
              <button onClick={()=>setModal(null)}><X className="w-4 h-4 text-gray-400"/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label:'Vendor',              key:'vendorId',           type:'select', opts: VENDORS.map(v=>({val:v.id,label:v.name})) },
                  { label:'Product / Service',   key:'product',            type:'text' },
                  { label:'Risk Category',       key:'category',           type:'select', opts: RISK_CATEGORIES.map(c=>({val:c,label:c})) },
                  { label:'Status',              key:'status',             type:'select', opts:['Active','Under Review','Overdue Review','Suspended'].map(s=>({val:s,label:s})) },
                  { label:'Data Classification', key:'dataClassification', type:'select', opts:['Restricted','Confidential','Internal','Public'].map(s=>({val:s,label:s})) },
                  { label:'Annual Value (£)',    key:'annualValue',        type:'number' },
                  { label:'Inherent Score',      key:'inherent',           type:'number' },
                  { label:'Residual Score',      key:'residual',           type:'number' },
                  { label:'Contract Expiry',     key:'contractExpiry',     type:'date' },
                  { label:'Next Review Date',    key:'reviewDate',         type:'date' },
                  { label:'Description',         key:'description',        type:'textarea', span:2 },
                  { label:'Key Risks (one per line)', key:'keyRisks',      type:'textarea', span:2 },
                  { label:'Controls (one per line)',  key:'controls',      type:'textarea', span:2 },
                ].map(f=>(
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
