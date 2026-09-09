import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { AlertTriangle, CheckCircle, Edit2, Save, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Appetite definitions ────────────────────────────────────────────────────

const RISK_CATEGORIES = [
  'Cybersecurity', 'Data Privacy', 'Business Continuity',
  'Financial Risk', 'Concentration Risk', 'Operational Resilience',
  'Compliance', 'Reputational', 'Vendor Performance',
]

const INITIAL_APPETITE = [
  { category:'Cybersecurity',           maxResidual:12, maxInherent:25, escalationRequired: true,  acceptanceAllowed: false, notes:'Zero tolerance for unmitigated high-severity vulnerabilities in Tier 1 vendors.' },
  { category:'Data Privacy',            maxResidual:10, maxInherent:20, escalationRequired: true,  acceptanceAllowed: false, notes:'No acceptance of residual risks involving personal data of EU data subjects.' },
  { category:'Business Continuity',     maxResidual:15, maxInherent:24, escalationRequired: true,  acceptanceAllowed: true,  notes:'Accept residual up to Moderate where cost of mitigation exceeds risk exposure.' },
  { category:'Financial Risk',          maxResidual:14, maxInherent:24, escalationRequired: true,  acceptanceAllowed: true,  notes:'Board-level accept required for any risk above Moderate threshold.' },
  { category:'Concentration Risk',      maxResidual:12, maxInherent:20, escalationRequired: true,  acceptanceAllowed: false, notes:'Single-vendor spend >40% or single-tech >40% triggers mandatory diversification plan.' },
  { category:'Operational Resilience',  maxResidual:14, maxInherent:24, escalationRequired: false, acceptanceAllowed: true,  notes:'Tolerance for Moderate residual where compensating controls are in place.' },
  { category:'Compliance',              maxResidual: 6, maxInherent:20, escalationRequired: true,  acceptanceAllowed: false, notes:'No residual above Low for regulatory-mapped obligations.' },
  { category:'Reputational',            maxResidual:10, maxInherent:20, escalationRequired: true,  acceptanceAllowed: true,  notes:'CRO approval required for acceptance.' },
  { category:'Vendor Performance',      maxResidual:14, maxInherent:24, escalationRequired: false, acceptanceAllowed: true,  notes:'Accept within Moderate for non-critical vendors. Review at next SBR cycle.' },
]

// Seed risks (subset from risk register)
const RISKS = [
  { id:'r1', name:'Unpatched vulnerabilities in cloud platform',      cat:'Cybersecurity',         inherent:24, residual:14 },
  { id:'r2', name:'Inadequate data encryption at rest',               cat:'Data Privacy',           inherent:18, residual:10 },
  { id:'r3', name:'PCI-DSS compliance gap – network segmentation',    cat:'Compliance',             inherent:20, residual:12 },
  { id:'r4', name:'Vendor lock-in – single cloud provider',           cat:'Concentration Risk',     inherent:16, residual:10 },
  { id:'r5', name:'Single point of failure – cloud dependency',       cat:'Business Continuity',    inherent:20, residual:14 },
  { id:'r6', name:'Late SLA breach notifications from vendor',        cat:'Vendor Performance',     inherent:12, residual: 8 },
  { id:'r7', name:'Cross-border data transfer without SCCs',          cat:'Data Privacy',           inherent:16, residual: 6 },
  { id:'r8', name:'Ransomware impact on operational continuity',      cat:'Operational Resilience', inherent:24, residual:16 },
  { id:'r9', name:'Insider threat from contractor broad access',      cat:'Cybersecurity',          inherent:12, residual: 8 },
  { id:'r10',name:'Negative press coverage – vendor data breach',     cat:'Reputational',           inherent:16, residual:10 },
  { id:'r11',name:'Minor SLA latency variance – non-critical vendor', cat:'Vendor Performance',     inherent: 4, residual: 1 },
  { id:'r12',name:'AI tool data retention gap',                       cat:'Data Privacy',           inherent:14, residual:12 },
]

function appetiteStatus(risk, appetite) {
  if (!appetite) return 'uncategorised'
  if (risk.residual > appetite.maxResidual) return 'breach'
  if (risk.inherent > appetite.maxInherent) return 'watch'
  return 'within'
}

const STATUS_META = {
  breach:        { label:'Appetite Breach',    badge:'bg-red-100 text-red-700 border-red-200',    row:'bg-red-50/30',    dot:'bg-red-500'    },
  watch:         { label:'Inherent Watch',     badge:'bg-amber-100 text-amber-700 border-amber-200', row:'bg-amber-50/20', dot:'bg-amber-400'  },
  within:        { label:'Within Appetite',    badge:'bg-green-100 text-green-700 border-green-200', row:'',              dot:'bg-green-500'  },
  uncategorised: { label:'Not Mapped',         badge:'bg-gray-100 text-gray-500 border-gray-200',  row:'',               dot:'bg-gray-300'   },
}

const LEVEL_FROM_SCORE = s => s >= 20 ? 'Very High' : s >= 12 ? 'High' : s >= 6 ? 'Moderate' : s >= 2 ? 'Low' : 'Very Low'
const LEVEL_COLORS = { 'Very High':'text-red-600', 'High':'text-orange-500', 'Moderate':'text-yellow-600', 'Low':'text-blue-600', 'Very Low':'text-green-600' }

export default function RiskAppetite() {
  const navigate = useNavigate()
  const [appetite, setAppetite] = useLocalStorage('tprm:appetite', INITIAL_APPETITE)
  const [editingCat, setEditingCat] = useState(null)
  const [editForm, setEditForm]     = useState({})
  const [activeTab, setActiveTab]   = useState('breaches') // 'breaches' | 'settings'
  const [filterCat, setFilterCat]   = useState('')

  const enriched = RISKS.map(r => {
    const ap = appetite.find(a => a.category === r.cat)
    return { ...r, ap, status: appetiteStatus(r, ap) }
  })

  const breaches = enriched.filter(r => r.status === 'breach')
  const watches  = enriched.filter(r => r.status === 'watch')
  const within   = enriched.filter(r => r.status === 'within')

  const filtered = filterCat ? enriched.filter(r => r.cat === filterCat) : enriched
  const sorted   = [...filtered].sort((a, b) => {
    const ord = { breach:0, watch:1, within:2, uncategorised:3 }
    return ord[a.status] - ord[b.status] || b.residual - a.residual
  })

  function startEdit(ap) {
    setEditingCat(ap.category)
    setEditForm({ ...ap })
  }
  function saveEdit() {
    setAppetite(prev => prev.map(a => a.category === editingCat ? { ...editForm } : a))
    setEditingCat(null)
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Risk Appetite</h1>
          <p className="text-xs text-gray-400 mt-0.5">Board-defined thresholds — automatically flags risks that breach appetite by category</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[['breaches','Breach Monitor'], ['settings','Appetite Settings']].map(([k,l]) => (
            <button key={k} onClick={() => setActiveTab(k)}
              className={cn('text-xs px-3 py-1.5 rounded-md font-medium transition-colors', activeTab===k ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700')}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Appetite Breaches',  value: breaches.length, color: breaches.length > 0 ? 'text-red-600' : 'text-green-600',
            onClick:() => { setFilterCat(''); setActiveTab('breaches') } },
          { label:'Inherent Watch',     value: watches.length,  color: watches.length > 0 ? 'text-amber-500' : 'text-green-600' },
          { label:'Within Appetite',    value: within.length,   color: 'text-green-600' },
          { label:'Categories Defined', value: appetite.length, color: 'text-gray-800' },
        ].map(k => (
          <button key={k.label} onClick={k.onClick}
            className={cn('bg-white border border-gray-200 rounded-lg p-4 text-left', k.onClick && 'hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer')}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{k.label}</div>
            <div className={cn('text-2xl font-bold', k.color)}>{k.value}</div>
          </button>
        ))}
      </div>

      {/* Breach alert */}
      {breaches.length > 0 && activeTab === 'breaches' && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="text-xs text-red-700">
            <strong>{breaches.length} risk{breaches.length > 1 ? 's exceed' : ' exceeds'} defined appetite thresholds.</strong>
            {' '}Each breach requires escalation to the Risk Committee or CRO for review and formal decision (mitigate, transfer, or board-level accept).
          </div>
        </div>
      )}

      {activeTab === 'breaches' && (
        <>
          {/* Category filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Category:</span>
            <button onClick={() => setFilterCat('')} className={cn('text-[10px] px-2.5 py-1 rounded-full border', !filterCat ? 'bg-blue-100 border-blue-300 text-blue-700 font-semibold' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300')}>All</button>
            {RISK_CATEGORIES.map(c => {
              const catBreaches = enriched.filter(r => r.cat === c && r.status === 'breach').length
              return (
                <button key={c} onClick={() => setFilterCat(v => v === c ? '' : c)}
                  className={cn('text-[10px] px-2.5 py-1 rounded-full border transition-colors', filterCat === c ? 'bg-blue-100 border-blue-300 text-blue-700 font-semibold' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300')}>
                  {c}{catBreaches > 0 && <span className="ml-1 text-red-500">●</span>}
                </button>
              )
            })}
          </div>

          {/* Risk table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Risk', 'Category', 'Inherent', 'Residual', 'Appetite (Residual Max)', 'Status', 'Escalation Required', ''].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No risks</td></tr>
                )}
                {sorted.map(r => {
                  const sm = STATUS_META[r.status]
                  const over = r.ap ? r.residual - r.ap.maxResidual : 0
                  return (
                    <tr key={r.id} className={cn('border-b border-gray-100 hover:bg-gray-50 transition-colors', sm.row)}>
                      <td className="px-3 py-2.5">
                        <button className="text-blue-500 hover:underline text-left" onClick={() => navigate('/risks', { state:{ openRiskId: r.id } })}>{r.name}</button>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                        <button onClick={() => setFilterCat(v => v === r.cat ? '' : r.cat)} className="hover:text-blue-500">{r.cat}</button>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('font-semibold', LEVEL_COLORS[LEVEL_FROM_SCORE(r.inherent)])}>
                          {r.inherent} <span className="font-normal text-gray-400">({LEVEL_FROM_SCORE(r.inherent)})</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('font-semibold', LEVEL_COLORS[LEVEL_FROM_SCORE(r.residual)])}>
                          {r.residual} <span className="font-normal text-gray-400">({LEVEL_FROM_SCORE(r.residual)})</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {r.ap
                          ? <span className="text-gray-700">&le;{r.ap.maxResidual} {over > 0 && <span className="text-red-500 font-semibold">(+{over} over)</span>}</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-semibold', sm.badge)}>{sm.label}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        {r.ap?.escalationRequired
                          ? <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-semibold">Required</span>
                          : <span className="text-[10px] text-gray-400">No</span>
                        }
                      </td>
                      <td className="px-3 py-2.5">
                        {r.status === 'breach' && (
                          <button onClick={() => navigate('/approvals', { state:{ openRiskId: r.id } })} className="text-[10px] text-blue-500 hover:underline whitespace-nowrap">Record decision →</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 pb-1">Edit thresholds below. Changes apply immediately to the breach monitor. Changes should be approved by the Board / Risk Committee before saving in production.</p>
          {appetite.map(ap => {
            const isEditing = editingCat === ap.category
            const catBreaches = enriched.filter(r => r.cat === ap.category && r.status === 'breach').length

            return (
              <div key={ap.category} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">{ap.category}</span>
                    {catBreaches > 0 && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">{catBreaches} breach{catBreaches > 1 ? 'es' : ''}</span>
                    )}
                  </div>
                  {isEditing
                    ? <div className="flex gap-2">
                        <button onClick={saveEdit} className="flex items-center gap-1 text-xs bg-[#0176d3] text-white px-3 py-1.5 rounded hover:bg-blue-700"><Save className="w-3 h-3" />Save</button>
                        <button onClick={() => setEditingCat(null)} className="flex items-center gap-1 text-xs border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50"><X className="w-3 h-3" />Cancel</button>
                      </div>
                    : <button onClick={() => startEdit(ap)} className="flex items-center gap-1 text-xs text-blue-500 hover:underline"><Edit2 className="w-3 h-3" />Edit</button>
                  }
                </div>
                <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Max Residual Score</label>
                        <input type="number" min={1} max={25} className="w-full border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" value={editForm.maxResidual} onChange={e => setEditForm(p=>({...p, maxResidual: +e.target.value}))} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Max Inherent Score</label>
                        <input type="number" min={1} max={25} className="w-full border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" value={editForm.maxInherent} onChange={e => setEditForm(p=>({...p, maxInherent: +e.target.value}))} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Escalation Required</label>
                        <select className="w-full border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" value={editForm.escalationRequired ? 'yes' : 'no'} onChange={e => setEditForm(p=>({...p, escalationRequired: e.target.value === 'yes'}))}>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Acceptance Allowed</label>
                        <select className="w-full border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400" value={editForm.acceptanceAllowed ? 'yes' : 'no'} onChange={e => setEditForm(p=>({...p, acceptanceAllowed: e.target.value === 'yes'}))}>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                      <div className="col-span-2 sm:col-span-4">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Board Guidance / Notes</label>
                        <textarea rows={2} className="w-full border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400 resize-none text-xs" value={editForm.notes} onChange={e => setEditForm(p=>({...p, notes: e.target.value}))} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Max Residual</span>
                        <span className="font-bold text-gray-800">&le;{ap.maxResidual}</span>
                        <span className="text-gray-400 ml-1">({LEVEL_FROM_SCORE(ap.maxResidual)})</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Max Inherent</span>
                        <span className="font-bold text-gray-800">&le;{ap.maxInherent}</span>
                        <span className="text-gray-400 ml-1">({LEVEL_FROM_SCORE(ap.maxInherent)})</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Escalation Required</span>
                        {ap.escalationRequired
                          ? <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-semibold">Required</span>
                          : <span className="text-gray-400">No</span>
                        }
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Acceptance Allowed</span>
                        {ap.acceptanceAllowed
                          ? <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">Yes</span>
                          : <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">No</span>
                        }
                      </div>
                      {ap.notes && (
                        <div className="col-span-2 sm:col-span-4">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Board Guidance</span>
                          <p className="text-gray-600 leading-relaxed">{ap.notes}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
