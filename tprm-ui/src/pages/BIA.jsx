import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Plus, X, Edit2, Save, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Data ─────────────────────────────────────────────────────────────────────

// Criticality dimension weights
const DIMS = [
  { key:'businessProcess', label:'Business Process Criticality', weight:0.30, help:'Does failure of this vendor directly halt core business operations?' },
  { key:'dataVolume',      label:'Data Volume & Sensitivity',    weight:0.25, help:'Volume and sensitivity of data processed (PII, financial, health)' },
  { key:'substitutability',label:'Substitutability',             weight:0.20, help:'Ease of switching to an alternative provider (1=easy, 5=very hard)' },
  { key:'regulatoryExp',   label:'Regulatory Exposure',          weight:0.15, help:'Would failure trigger a regulatory notification or breach obligation?' },
  { key:'reputational',    label:'Reputational Impact',          weight:0.10, help:'Level of customer/media impact if this vendor has a public failure' },
]

// Score → label
function critLabel(score) {
  if (score >= 4.5) return 'Mission Critical'
  if (score >= 3.5) return 'Business Critical'
  if (score >= 2.5) return 'Important'
  if (score >= 1.5) return 'Standard'
  return 'Low Importance'
}
function critColor(score) {
  if (score >= 4.5) return { badge:'bg-red-100 text-red-700 border-red-200', text:'text-red-600' }
  if (score >= 3.5) return { badge:'bg-orange-100 text-orange-700 border-orange-200', text:'text-orange-500' }
  if (score >= 2.5) return { badge:'bg-yellow-100 text-yellow-700 border-yellow-200', text:'text-yellow-600' }
  if (score >= 1.5) return { badge:'bg-blue-100 text-blue-700 border-blue-200', text:'text-blue-600' }
  return { badge:'bg-gray-100 text-gray-500 border-gray-200', text:'text-gray-500' }
}

function computeScore(dims) {
  return DIMS.reduce((sum, d) => sum + (dims[d.key] || 1) * d.weight, 0)
}

const RTO_OPTIONS = ['< 1 hour', '1–4 hours', '4–8 hours', '8–24 hours', '1–3 days', '> 3 days']
const RPO_OPTIONS = ['< 15 min', '15 min–1 hr', '1–4 hours', '4–24 hours', '1–3 days', '> 3 days']

const INIT = [
  {
    id:'bia1', vendor:'CloudSystems Inc', tier:'Tier 1',
    processOwner:'Engineering', reviewDate:'2026-09-01',
    rto:'1–4 hours', rpo:'< 15 min',
    businessProcesses:'Core application hosting, CI/CD pipeline, database infrastructure',
    dims:{ businessProcess:5, dataVolume:5, substitutability:5, regulatoryExp:4, reputational:4 },
    notes:'Primary cloud provider. Immediate failover to secondary region possible but DR not tested for full outage scenario.',
  },
  {
    id:'bia2', vendor:'DataSecure LLC', tier:'Tier 1',
    processOwner:'Security', reviewDate:'2026-08-15',
    rto:'4–8 hours', rpo:'1–4 hours',
    businessProcesses:'DLP, encryption key management, security monitoring',
    dims:{ businessProcess:4, dataVolume:5, substitutability:4, regulatoryExp:5, reputational:4 },
    notes:'Key management failure would render encrypted data inaccessible. HSM failover in place.',
  },
  {
    id:'bia3', vendor:'GlobalPay Corp', tier:'Tier 2',
    processOwner:'Finance', reviewDate:'2026-07-10',
    rto:'< 1 hour', rpo:'< 15 min',
    businessProcesses:'Payment processing, card authorisation, settlement',
    dims:{ businessProcess:5, dataVolume:4, substitutability:3, regulatoryExp:5, reputational:5 },
    notes:'Payment downtime directly impacts revenue. PCI-DSS obligations in scope. Secondary processor SLA reviewed.',
  },
  {
    id:'bia4', vendor:'LegalEagle LLP', tier:'Tier 2',
    processOwner:'Legal', reviewDate:'2026-06-01',
    rto:'8–24 hours', rpo:'4–24 hours',
    businessProcesses:'Contract management, litigation support, regulatory advice',
    dims:{ businessProcess:3, dataVolume:3, substitutability:3, regulatoryExp:3, reputational:2 },
    notes:'Important but substitutable. Alternative counsel identified. 24h replacement SLA feasible.',
  },
  {
    id:'bia5', vendor:'FastShip Logistics', tier:'Tier 3',
    processOwner:'Operations', reviewDate:'2026-05-01',
    rto:'1–3 days', rpo:'1–3 days',
    businessProcesses:'Physical document delivery, courier services',
    dims:{ businessProcess:2, dataVolume:1, substitutability:2, regulatoryExp:1, reputational:2 },
    notes:'Non-digital service. Multiple alternative couriers available.',
  },
  {
    id:'bia6', vendor:'MedConsult Group', tier:'Tier 4',
    processOwner:'Operations', reviewDate:'2026-04-01',
    rto:'> 3 days', rpo:'> 3 days',
    businessProcesses:'Occasional medical/occupational health advisory',
    dims:{ businessProcess:1, dataVolume:2, substitutability:2, regulatoryExp:2, reputational:1 },
    notes:'Low criticality — ad hoc consulting engagement.',
  },
]

const BLANK = {
  vendor:'', tier:'Tier 2', processOwner:'', reviewDate:'', rto:'4–8 hours', rpo:'4–24 hours',
  businessProcesses:'', dims:{ businessProcess:3, dataVolume:3, substitutability:3, regulatoryExp:3, reputational:3 }, notes:'',
}

export default function BIA() {
  const navigate = useNavigate()
  const [records, setRecords]   = useLocalStorage('tprm:bia', INIT)
  const [editing, setEditing]   = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [modal, setModal]       = useState(false)
  const [newForm, setNewForm]   = useState(BLANK)
  const [filterTier, setFilterTier] = useState('')
  const [filterCrit, setFilterCrit] = useState('')

  const enriched = records.map(r => {
    const score = computeScore(r.dims)
    return { ...r, score: Math.round(score * 100) / 100, label: critLabel(score), colors: critColor(score) }
  }).sort((a, b) => b.score - a.score)

  const filtered = enriched.filter(r => {
    if (filterTier && r.tier !== filterTier) return false
    if (filterCrit && r.label !== filterCrit) return false
    return true
  })

  const missionCritical = enriched.filter(r => r.score >= 4.5)
  const bizCritical     = enriched.filter(r => r.score >= 3.5 && r.score < 4.5)
  const avgRTO = ['< 1 hour','1–4 hours'].filter(rto => enriched.some(r => r.rto === rto)).length

  function startEdit(r) {
    setEditing(r.id)
    setEditForm({ ...r, dims: { ...r.dims } })
  }
  function saveEdit() {
    setRecords(prev => prev.map(r => r.id === editing ? { ...editForm, id: editing } : r))
    setEditing(null)
  }
  function saveNew() {
    if (!newForm.vendor.trim()) return
    setRecords(prev => [...prev, { ...newForm, id:'bia'+Math.random().toString(36).slice(2,8), dims:{...newForm.dims} }])
    setModal(false)
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">BIA / Criticality Scoring</h1>
          <p className="text-xs text-gray-400 mt-0.5">Business Impact Analysis — RTO, RPO, and criticality independent of risk score</p>
        </div>
        <button onClick={() => { setNewForm(BLANK); setModal(true) }} className="flex items-center gap-1.5 bg-[#0176d3] text-white text-xs font-medium px-3 py-2 rounded hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5" /> Add BIA
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Mission Critical Vendors',  value: missionCritical.length, color: missionCritical.length > 0 ? 'text-red-600' : 'text-gray-400',  filter:'Mission Critical' },
          { label:'Business Critical Vendors', value: bizCritical.length,     color: bizCritical.length > 0 ? 'text-orange-500' : 'text-gray-400',    filter:'Business Critical' },
          { label:'Vendors with RTO < 4 hours',value: enriched.filter(r=>['< 1 hour','1–4 hours'].includes(r.rto)).length, color:'text-blue-600' },
          { label:'BIA Records',               value: records.length,          color:'text-gray-800' },
        ].map(k => (
          <button key={k.label} onClick={() => k.filter && setFilterCrit(v => v === k.filter ? '' : k.filter)}
            className={cn('bg-white border border-gray-200 rounded-lg p-4 text-left transition-all', k.filter && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer')}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{k.label}</div>
            <div className={cn('text-2xl font-bold', k.color)}>{k.value}</div>
          </button>
        ))}
      </div>

      {/* Alert: high RTO/RPO mismatches */}
      {missionCritical.filter(r => !['< 1 hour','1–4 hours'].includes(r.rto)).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            <strong>Criticality / RTO mismatch:</strong> one or more Mission Critical vendors have an RTO greater than 4 hours. Review DR arrangements.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterTier} onChange={e=>setFilterTier(e.target.value)}>
          <option value="">All Tiers</option>
          {['Tier 1','Tier 2','Tier 3','Tier 4'].map(t=><option key={t}>{t}</option>)}
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterCrit} onChange={e=>setFilterCrit(e.target.value)}>
          <option value="">All Criticality</option>
          {['Mission Critical','Business Critical','Important','Standard','Low Importance'].map(c=><option key={c}>{c}</option>)}
        </select>
        {(filterTier||filterCrit) && <button onClick={()=>{setFilterTier('');setFilterCrit('')}} className="text-xs text-blue-500 hover:text-blue-700 px-2">Clear</button>}
      </div>

      {/* BIA cards */}
      <div className="space-y-3">
        {filtered.map(r => {
          const isEditing = editing === r.id
          const ef = editForm

          return (
            <div key={r.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Header row */}
              <div className="px-4 py-3 flex items-center gap-3 bg-gray-50 border-b border-gray-100">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button className="text-sm font-semibold text-blue-500 hover:underline" onClick={() => navigate('/vendors', { state:{ openVendorName: r.vendor } })}>{r.vendor}</button>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{r.tier}</span>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', r.colors.badge)}>{r.label}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5 flex gap-3 flex-wrap">
                    <span>Owner: {r.processOwner}</span>
                    <span>RTO: <strong className="text-gray-600">{r.rto}</strong></span>
                    <span>RPO: <strong className="text-gray-600">{r.rpo}</strong></span>
                    {r.reviewDate && <span>Reviewed: {r.reviewDate}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-gray-400">Criticality Score</span>
                  <span className={cn('text-xl font-bold', r.colors.text)}>{r.score.toFixed(2)}</span>
                </div>
                {isEditing
                  ? <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex items-center gap-1 text-xs bg-[#0176d3] text-white px-3 py-1.5 rounded hover:bg-blue-700"><Save className="w-3 h-3"/>Save</button>
                      <button onClick={()=>setEditing(null)} className="flex items-center gap-1 text-xs border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50"><X className="w-3 h-3"/>Cancel</button>
                    </div>
                  : <button onClick={()=>startEdit(r)} className="text-xs text-blue-500 hover:underline flex items-center gap-1"><Edit2 className="w-3 h-3"/>Edit</button>
                }
              </div>

              {/* Detail */}
              <div className="px-4 py-4">
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Editable RTO / RPO / owner */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label:'Vendor Name', key:'vendor', type:'text' },
                        { label:'Tier', key:'tier', type:'select', opts:['Tier 1','Tier 2','Tier 3','Tier 4'] },
                        { label:'Process Owner', key:'processOwner', type:'text' },
                        { label:'Review Date', key:'reviewDate', type:'date' },
                        { label:'RTO', key:'rto', type:'select', opts: RTO_OPTIONS },
                        { label:'RPO', key:'rpo', type:'select', opts: RPO_OPTIONS },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.label}</label>
                          {f.type==='select'
                            ? <select className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" value={ef[f.key]||''} onChange={e=>setEditForm(p=>({...p,[f.key]:e.target.value}))}>
                                {f.opts.map(o=><option key={o}>{o}</option>)}
                              </select>
                            : <input type={f.type} className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" value={ef[f.key]||''} onChange={e=>setEditForm(p=>({...p,[f.key]:e.target.value}))} />
                          }
                        </div>
                      ))}
                    </div>
                    {/* Dimension sliders */}
                    <div>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Criticality Dimensions (1–5)</p>
                      <div className="space-y-3">
                        {DIMS.map(d => (
                          <div key={d.key} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex justify-between mb-0.5">
                                <label className="text-[10px] font-medium text-gray-600">{d.label}</label>
                                <span className="text-[10px] text-gray-400">{d.weight*100}% weight</span>
                              </div>
                              <input type="range" min={1} max={5} step={1} className="w-full accent-blue-500"
                                value={ef.dims[d.key]||3}
                                onChange={e=>setEditForm(p=>({...p,dims:{...p.dims,[d.key]:+e.target.value}}))}
                              />
                            </div>
                            <span className="w-6 text-center font-bold text-gray-800 text-sm">{ef.dims[d.key]||3}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">Weighted score preview:</span>
                        <span className={cn('text-sm font-bold', critColor(computeScore(ef.dims)).text)}>{computeScore(ef.dims).toFixed(2)} — {critLabel(computeScore(ef.dims))}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Business Processes Covered</label>
                      <input type="text" className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400" value={ef.businessProcesses||''} onChange={e=>setEditForm(p=>({...p,businessProcesses:e.target.value}))} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</label>
                      <textarea rows={2} className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400 resize-none" value={ef.notes||''} onChange={e=>setEditForm(p=>({...p,notes:e.target.value}))} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Dimension bars */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {DIMS.map(d => (
                        <div key={d.key}>
                          <div className="text-[10px] font-medium text-gray-500 mb-1" title={d.help}>{d.label}</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={cn('h-full rounded-full', r.dims[d.key]>=4?'bg-red-400':r.dims[d.key]>=3?'bg-amber-400':'bg-green-400')}
                                style={{width:`${(r.dims[d.key]/5)*100}%`}} />
                            </div>
                            <span className="text-xs font-bold text-gray-700 w-3">{r.dims[d.key]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {r.businessProcesses && (
                      <div className="text-xs">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mr-2">Processes:</span>
                        <span className="text-gray-600">{r.businessProcesses}</span>
                      </div>
                    )}
                    {r.notes && (
                      <p className="text-xs text-gray-500 leading-relaxed">{r.notes}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Methodology note */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-[11px] text-gray-500">
        <strong className="text-gray-700">Scoring methodology:</strong> Weighted average across 5 dimensions (1–5 scale). Mission Critical ≥4.5 · Business Critical ≥3.5 · Important ≥2.5 · Standard ≥1.5 · Low Importance &lt;1.5. BIA criticality is independent of the IRQ risk score and should inform vendor tier assignment.
      </div>

      {/* Add modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Add BIA Record</h3>
              <button onClick={()=>setModal(false)}><X className="w-4 h-4 text-gray-400"/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label:'Vendor Name', key:'vendor', type:'text' },
                  { label:'Tier', key:'tier', type:'select', opts:['Tier 1','Tier 2','Tier 3','Tier 4'] },
                  { label:'Process Owner', key:'processOwner', type:'text' },
                  { label:'Review Date', key:'reviewDate', type:'date' },
                  { label:'RTO', key:'rto', type:'select', opts:RTO_OPTIONS },
                  { label:'RPO', key:'rpo', type:'select', opts:RPO_OPTIONS },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.label}</label>
                    {f.type==='select'
                      ? <select className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" value={newForm[f.key]||''} onChange={e=>setNewForm(p=>({...p,[f.key]:e.target.value}))}>
                          {f.opts.map(o=><option key={o}>{o}</option>)}
                        </select>
                      : <input type={f.type} className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" value={newForm[f.key]||''} onChange={e=>setNewForm(p=>({...p,[f.key]:e.target.value}))} />
                    }
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Criticality Dimensions (1–5)</p>
                {DIMS.map(d => (
                  <div key={d.key} className="flex items-center gap-3 mb-2">
                    <label className="text-[10px] font-medium text-gray-600 w-48 shrink-0">{d.label}</label>
                    <input type="range" min={1} max={5} step={1} className="flex-1 accent-blue-500" value={newForm.dims[d.key]||3} onChange={e=>setNewForm(p=>({...p,dims:{...p.dims,[d.key]:+e.target.value}}))} />
                    <span className="w-4 text-center font-bold text-gray-800 text-sm">{newForm.dims[d.key]||3}</span>
                  </div>
                ))}
                <p className="text-[11px] text-gray-500 mt-1">Score preview: <strong>{computeScore(newForm.dims).toFixed(2)}</strong> — {critLabel(computeScore(newForm.dims))}</p>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Business Processes</label>
                <input type="text" className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400" value={newForm.businessProcesses||''} onChange={e=>setNewForm(p=>({...p,businessProcesses:e.target.value}))} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</label>
                <textarea rows={2} className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400 resize-none" value={newForm.notes||''} onChange={e=>setNewForm(p=>({...p,notes:e.target.value}))} />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={()=>setModal(false)} className="text-xs border border-gray-200 rounded px-4 py-2 hover:bg-gray-50">Cancel</button>
              <button onClick={saveNew} className="text-xs bg-[#0176d3] text-white rounded px-4 py-2 hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
