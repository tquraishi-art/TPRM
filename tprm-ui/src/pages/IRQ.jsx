import { useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { X, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VENDORS_INIT, IRQ_INIT } from '@/lib/seedData'

const VENDORS = VENDORS_INIT

function composite(q) { return +(q.sec*0.4 + q.priv*0.2 + q.bcm*0.3 + q.fin*0.1).toFixed(2) }
function irqLevel(c) {
  if (c >= 4.5) return 'Very High'
  if (c >= 3.5) return 'High'
  if (c >= 2.5) return 'Moderate'
  if (c >= 1.5) return 'Low'
  return 'Very Low'
}
function levelColor(l) {
  return {
    'Very High':'#ef4444','High':'#f97316','Moderate':'#eab308','Low':'#4f8ef7','Very Low':'#22c55e'
  }[l] || '#9ca3af'
}
const LEVEL_BG = {
  'Very High':'bg-red-100 text-red-700','High':'bg-orange-100 text-orange-700',
  'Moderate':'bg-yellow-100 text-yellow-700','Low':'bg-blue-100 text-blue-700','Very Low':'bg-green-100 text-green-700',
}
const ST_BG = { 'Scored':'bg-green-100 text-green-700','Pending':'bg-gray-100 text-gray-500','Not in Scope':'bg-gray-50 text-gray-400' }

function DomainBar({ value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width:`${value/5*100}%`, background:color }} />
      </div>
      <span className="text-[11px] font-semibold w-6 text-right" style={{color}}>{value}/5</span>
    </div>
  )
}

const EMPTY = { vendor:'Amazon Web Services', sec:3, priv:3, bcm:3, fin:3, st:'Pending', notes:'' }

export default function IRQ() {
  const [data, setData] = useLocalStorage('tprm:irq', IRQ_INIT)
  const [q, setQ] = useState('')
  const [filterSt, setFilterSt] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const scored    = data.filter(x => x.st==='Scored')
  const pending   = data.filter(x => x.st==='Pending')
  const notScope  = data.filter(x => x.st==='Not in Scope')
  const avgComp   = scored.length ? (scored.reduce((s,x)=>s+composite(x),0)/scored.length).toFixed(2) : '—'

  const filtered = data.filter(x => {
    const vname = VENDORS.find(v=>v.id===x.vendor || v.name===x.vendor)?.name || x.vendor
    if (q && !vname.toLowerCase().includes(q.toLowerCase())) return false
    if (filterSt && x.st !== filterSt) return false
    return true
  })

  const liveComp = composite(form)

  function openAdd()    { setForm({...EMPTY}); setModal({mode:'add'}) }
  function openEdit(x)  { setForm({...x});     setModal({mode:'edit',id:x.id}) }
  function saveForm() {
    if (modal.mode==='add') {
      setData(prev=>[...prev,{...form,id:'_'+Math.random().toString(36).slice(2,8)}])
    } else {
      setData(prev=>prev.map(x=>x.id===modal.id?{...form,id:modal.id}:x))
    }
    setModal(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">IRQ Scoring</h1>
          <p className="text-xs text-gray-400 mt-0.5">Inherent Risk Questionnaire · Security 40% · Privacy 20% · BCM 30% · Financial 10%</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#0176d3] text-white text-xs font-medium px-3 py-2 rounded hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5" /> Score Vendor
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {label:'Total Scored',  value:scored.length,   color:'text-blue-600'},
          {label:'Avg Composite', value:avgComp,          color:'text-orange-500'},
          {label:'Pending',       value:pending.length,   color:'text-gray-500'},
          {label:'Not in Scope',  value:notScope.length,  color:'text-gray-400'},
        ].map(k=>(
          <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{k.label}</div>
            <div className={cn('text-2xl font-bold', k.color)}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400" placeholder="Search by vendor…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterSt} onChange={e=>setFilterSt(e.target.value)}>
          <option value="">All Status</option>
          {['Scored','Pending','Not in Scope'].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Vendor','Tier','Security (40%)','Privacy (20%)','BCM (30%)','Financial (10%)','Composite','Level','Status','Notes',''].map(h=>(
                <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={11} className="px-3 py-8 text-center text-gray-400">No records found</td></tr>}
            {filtered.map((x, i) => {
              const vname = VENDORS.find(v=>v.id===x.vendor || v.name===x.vendor)?.name || x.vendor
              const vtier = VENDORS.find(v=>v.id===x.vendor || v.name===x.vendor)?.tier || ''
              const comp  = x.st==='Scored' ? composite(x) : null
              const lvl   = comp ? irqLevel(comp) : null
              return (
                <tr key={x.id} className={cn('border-b border-gray-100', i%2===1&&'bg-gray-50/40')}>
                  <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{vname}</td>
                  <td className="px-3 py-2.5"><span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{vtier}</span></td>
                  <td className="px-3 py-2.5 w-28">{x.st==='Scored' ? <DomainBar value={x.sec}  color="#ef4444" /> : <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 py-2.5 w-28">{x.st==='Scored' ? <DomainBar value={x.priv} color="#7c5cbf" /> : <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 py-2.5 w-28">{x.st==='Scored' ? <DomainBar value={x.bcm}  color="#f97316" /> : <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 py-2.5 w-28">{x.st==='Scored' ? <DomainBar value={x.fin}  color="#eab308" /> : <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 py-2.5">
                    {comp ? <span className="text-base font-bold" style={{color:levelColor(lvl)}}>{comp}</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    {lvl ? <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', LEVEL_BG[lvl])}>{lvl}</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', ST_BG[x.st]||'bg-gray-100 text-gray-500')}>{x.st}</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 max-w-[160px] truncate">{x.notes||'—'}</td>
                  <td className="px-3 py-2.5">
                    <button onClick={()=>openEdit(x)} className="text-[10px] text-blue-500 hover:underline">Edit</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">{modal.mode==='add'?'Score Vendor IRQ':'Edit IRQ Score'}</h3>
              <button onClick={()=>setModal(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Vendor</label>
                <select className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400" value={form.vendor} onChange={e=>setForm(p=>({...p,vendor:e.target.value}))}>
                  {VENDORS.map(v=><option key={v.id} value={v.name}>{v.name} ({v.tier})</option>)}
                </select>
              </div>
              {[
                {label:'Security (40%) — Cybersecurity controls, certifications, incident history',key:'sec',color:'#ef4444'},
                {label:'Privacy (20%) — Data handling, GDPR/CCPA compliance, DPA status',       key:'priv',color:'#7c5cbf'},
                {label:'BCM (30%) — Business continuity, DR testing, RTO/RPO commitments',      key:'bcm',color:'#f97316'},
                {label:'Financial (10%) — Financial stability, insurance, credit risk',          key:'fin',color:'#eab308'},
              ].map(f=>(
                <div key={f.key}>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1.5">{f.label}</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={1} max={5} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:parseInt(e.target.value)}))} className="flex-1" />
                    <span className="text-sm font-bold w-6 text-center" style={{color:f.color}}>{form[f.key]}</span>
                  </div>
                </div>
              ))}
              {/* Live composite preview */}
              <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">Composite Score</span>
                <span className="text-xl font-bold" style={{color:levelColor(irqLevel(liveComp))}}>{liveComp} <span className="text-xs font-normal text-gray-400">({irqLevel(liveComp)})</span></span>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</label>
                <select className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400" value={form.st} onChange={e=>setForm(p=>({...p,st:e.target.value}))}>
                  {['Scored','Pending','Not in Scope'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</label>
                <textarea rows={2} className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400 resize-none" value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} />
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
