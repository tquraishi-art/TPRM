import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Building2, X, ChevronRight, Search, LayoutGrid, List, Edit2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VENDORS_INIT, RISKS_SEED, IRQ_INIT, residualScore, levelFromScore } from '@/lib/seedData'

function residual(r) { return residualScore(r) }
function level(s)    { return levelFromScore(s) }
function irqComposite(q) { return +(q.sec*0.4 + q.priv*0.2 + q.bcm*0.3 + q.fin*0.1).toFixed(2) }

const TIER_COLORS = {
  'Tier 1': 'bg-red-100 text-red-700',
  'Tier 2': 'bg-orange-100 text-orange-700',
  'Tier 3': 'bg-yellow-100 text-yellow-700',
  'Tier 4': 'bg-gray-100 text-gray-500',
}

const FH_COLORS = {
  'Strong':       'bg-green-100 text-green-700',
  'Stable':       'bg-blue-100 text-blue-700',
  'Deteriorating':'bg-red-100 text-red-700',
  'Unknown':      'bg-gray-100 text-gray-500',
}
const STATUS_COLORS = {
  'Active':       'bg-green-100 text-green-700',
  'Under Review': 'bg-orange-100 text-orange-700',
  'Inactive':     'bg-gray-100 text-gray-400',
}
const LEVEL_COLORS = {
  'Very High': 'bg-red-100 text-red-700',
  'High':      'bg-orange-100 text-orange-700',
  'Moderate':  'bg-yellow-100 text-yellow-700',
  'Low':       'bg-blue-100 text-blue-700',
  'Very Low':  'bg-green-100 text-green-700',
}

function Badge({ label, colorClass }) {
  return <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', colorClass)}>{label}</span>
}

function ScoreBar({ value, max = 25, color = '#4f8ef7' }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.round(value/max*100)}%`, background: color }} />
      </div>
      <span className="text-[11px] font-semibold w-4 text-right" style={{ color }}>{value}</span>
    </div>
  )
}

const EMPTY_VENDOR = { name:'', tier:'Tier 1', cat:'Technology', st:'Active', con:'', email:'', cs:'', ce:'', sp:'', dc:'None', svc:'' }

export default function Vendors() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [vendors, setVendors] = useLocalStorage('tprm:vendors', VENDORS_INIT)
  const [allRisks]             = useLocalStorage('tprm:risks',   RISKS_SEED)
  const [allIRQ]               = useLocalStorage('tprm:irq',     IRQ_INIT)
  const [q, setQ] = useState('')
  const [filterTier, setFilterTier] = useState('')
  const [filterSt, setFilterSt] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [view, setView] = useState('grid')
  const [drawer, setDrawer] = useState(null)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_VENDOR)

  useEffect(() => {
    if (!state) return
    if (state.filterTier) setFilterTier(state.filterTier)
    if (state.filterSt)   setFilterSt(state.filterSt)
    if (state.filterCat)  setFilterCat(state.filterCat)
    if (state.openVendorName) {
      const v = vendors.find(v => v.name === state.openVendorName)
      if (v) setDrawer({ id: v.id })
    }
  }, [state])

  const filtered = vendors.filter(v => {
    if (q && !v.name.toLowerCase().includes(q.toLowerCase()) && !v.cat.toLowerCase().includes(q.toLowerCase())) return false
    if (filterTier && v.tier !== filterTier) return false
    if (filterSt   && v.st  !== filterSt)   return false
    if (filterCat  && v.cat !== filterCat)  return false
    return true
  })

  // Risks are stored by vendor name in the live data
  function vendorRisks(v) {
    return allRisks.filter(r => r.vendor === v.name || r.vendor === v.id)
  }
  function maxResidual(v) {
    const vr = vendorRisks(v)
    return vr.length ? Math.max(...vr.map(r => residual(r))) : 0
  }
  function irqScore(v) {
    const entry = allIRQ.find(x => x.vendor === v.name || x.vendor === v.id)
    return entry && entry.st === 'Scored' ? irqComposite(entry) : null
  }
  function hasEscalation(v) {
    return vendorRisks(v).some(r => {
      const rl = level(residual(r))
      return rl === 'Very High' || (rl === 'High' && v?.tier === 'Tier 1')
    })
  }

  function openEdit(v) { setForm({ ...v }); setModal({ mode: 'edit', id: v.id }) }
  function openAdd()    { setForm({ ...EMPTY_VENDOR }); setModal({ mode: 'add' }) }
  function saveForm() {
    if (!form.name.trim()) return
    if (modal.mode === 'add') {
      setVendors(prev => [...prev, { ...form, id: '_' + Math.random().toString(36).slice(2,8) }])
    } else {
      setVendors(prev => prev.map(v => v.id === modal.id ? { ...form, id: modal.id } : v))
    }
    setModal(null)
  }

  const drawerVendor = drawer ? vendors.find(v => v.id === drawer.id) : null
  const drawerIRQ    = drawerVendor ? allIRQ.find(x => x.vendor === drawerVendor.name || x.vendor === drawerVendor.id) : null
  const drawerRisks  = drawerVendor ? vendorRisks(drawerVendor) : []

  const kpis = [
    { label:'Total Vendors', value: vendors.length,                              color:'text-gray-800'  },
    { label:'Tier 1',        value: vendors.filter(v=>v.tier==='Tier 1').length, color:'text-red-600'   },
    { label:'Active',        value: vendors.filter(v=>v.st==='Active').length,   color:'text-green-600' },
    { label:'Under Review',  value: vendors.filter(v=>v.st==='Under Review').length, color:'text-orange-500' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Vendor Criticality</h1>
          <p className="text-xs text-gray-400 mt-0.5">Third-party vendor inventory and risk profiles</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#0176d3] text-white text-xs font-medium px-3 py-2 rounded hover:bg-blue-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Vendor
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{k.label}</div>
            <div className={cn('text-2xl font-bold', k.color)}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400" placeholder="Search vendors…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterTier} onChange={e=>setFilterTier(e.target.value)}>
          <option value="">All Tiers</option>
          {['Tier 1','Tier 2','Tier 3','Tier 4'].map(t=><option key={t}>{t}</option>)}
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterSt} onChange={e=>setFilterSt(e.target.value)}>
          <option value="">All Status</option>
          {['Active','Under Review','Inactive'].map(s=><option key={s}>{s}</option>)}
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {[...new Set(vendors.map(v=>v.cat))].sort().map(c=><option key={c}>{c}</option>)}
        </select>
        <div className="flex border border-gray-200 rounded overflow-hidden ml-auto">
          <button onClick={()=>setView('grid')} className={cn('px-3 py-2', view==='grid' ? 'bg-[#0176d3] text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}><LayoutGrid className="w-3.5 h-3.5" /></button>
          <button onClick={()=>setView('list')} className={cn('px-3 py-2', view==='list' ? 'bg-[#0176d3] text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}><List className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(v => {
            const mr = maxResidual(v); const irq = irqScore(v); const esc = hasEscalation(v)
            return (
              <div key={v.id} onClick={()=>setDrawer({id:v.id})} className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-gray-800 text-sm leading-snug">
                    {v.name}{esc && <span className="ml-1.5 w-2 h-2 bg-red-500 rounded-full inline-block align-middle" />}
                  </div>
                  <button onClick={e=>{e.stopPropagation();openEdit(v)}} className="text-gray-300 hover:text-blue-500 ml-2 shrink-0"><Edit2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="text-[11px] text-gray-500 mb-3">{v.cat}</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  <button
                    onClick={e=>{e.stopPropagation();setDrawer(null);setFilterTier(v.tier)}}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Badge label={v.tier} colorClass={TIER_COLORS[v.tier]} />
                  </button>
                  <button
                    onClick={e=>{e.stopPropagation();setFilterSt(v.st)}}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Badge label={v.st} colorClass={STATUS_COLORS[v.st]} />
                  </button>
                  {v.fh && <Badge label={v.fh} colorClass={FH_COLORS[v.fh] || 'bg-gray-100 text-gray-500'} />}
                </div>
                <div className="flex items-end justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-gray-400 mb-0.5">Max Residual</div>
                    <Badge label={mr > 0 ? level(mr) : 'None'} colorClass={mr > 0 ? LEVEL_COLORS[level(mr)] : 'bg-gray-100 text-gray-400'} />
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 mb-0.5">IRQ Score</div>
                    <div className={cn('text-base font-bold', irq ? (irq>=3.5?'text-red-500':irq>=2.5?'text-orange-500':'text-green-600') : 'text-gray-300')}>{irq ? irq.toFixed(1) : 'Pending'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 mb-0.5">Annual Spend</div>
                    <div className="text-xs font-semibold text-gray-600">{v.sp ? '$'+Number(v.sp).toLocaleString() : '—'}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view === 'list' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Vendor','Category','Tier','Status','Max Residual','IRQ Score','Fin. Health','Spend','Contract End',''].map(h=>(
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => {
                const mr = maxResidual(v); const irq = irqScore(v)
                return (
                  <tr key={v.id} onClick={()=>setDrawer({id:v.id})} className={cn('border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors', i%2===1&&'bg-gray-50/40')}>
                    <td className="px-3 py-2.5 font-medium text-gray-800">{v.name}</td>
                    <td className="px-3 py-2.5 text-gray-500">{v.cat}</td>
                    <td className="px-3 py-2.5" onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>{setDrawer(null);setFilterTier(v.tier)}} className="hover:opacity-80 transition-opacity">
                        <Badge label={v.tier} colorClass={TIER_COLORS[v.tier]} />
                      </button>
                    </td>
                    <td className="px-3 py-2.5" onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>setFilterSt(v.st)} className="hover:opacity-80 transition-opacity">
                        <Badge label={v.st} colorClass={STATUS_COLORS[v.st]} />
                      </button>
                    </td>
                    <td className="px-3 py-2.5">{mr>0 ? <Badge label={level(mr)} colorClass={LEVEL_COLORS[level(mr)]} /> : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2.5 font-bold" style={{color:irq?(irq>=3.5?'#ef4444':irq>=2.5?'#f97316':'#22c55e'):'#d1d5db'}}>{irq?irq.toFixed(2):'—'}</td>
                    <td className="px-3 py-2.5">{v.fh ? <Badge label={v.fh} colorClass={FH_COLORS[v.fh]||'bg-gray-100 text-gray-500'} /> : <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2.5 text-gray-500">{v.sp?'$'+Number(v.sp).toLocaleString():'—'}</td>
                    <td className="px-3 py-2.5 text-gray-400">{v.ce||'—'}</td>
                    <td className="px-3 py-2.5" onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>openEdit(v)} className="text-gray-400 hover:text-blue-500"><Edit2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Vendor Detail Drawer */}
      {drawerVendor && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/30" onClick={()=>setDrawer(null)} />
          <div className="w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-base font-semibold text-gray-800">{drawerVendor.name}</h2>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  <Badge label={drawerVendor.cat} colorClass="bg-gray-100 text-gray-600" />
                  <Badge label={drawerVendor.tier} colorClass={TIER_COLORS[drawerVendor.tier]} />
                  <Badge label={drawerVendor.st}   colorClass={STATUS_COLORS[drawerVendor.st]} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>openEdit(drawerVendor)} className="text-xs border border-gray-200 rounded px-2 py-1.5 hover:bg-gray-50 flex items-center gap-1"><Edit2 className="w-3 h-3" />Edit</button>
                <button onClick={()=>setDrawer(null)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {/* KPI mini-tiles */}
              <div className="grid grid-cols-5 gap-2">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-gray-400 mb-1">Risks</div>
                  <div className="text-lg font-bold text-gray-800">{drawerRisks.length}</div>
                </div>
                <button
                  className="bg-gray-50 rounded-lg p-3 text-center hover:bg-red-50 transition-colors"
                  onClick={()=>{setDrawer(null);navigate('/risks',{state:{openVendorName:drawerVendor.name,filterLevel:'Very High'}})}}
                >
                  <div className="text-[10px] text-gray-400 mb-1">Very High</div>
                  <div className="text-lg font-bold text-red-600">{drawerRisks.filter(r=>level(residual(r))==='Very High').length}</div>
                </button>
                <button
                  className="bg-gray-50 rounded-lg p-3 text-center hover:bg-orange-50 transition-colors"
                  onClick={()=>{setDrawer(null);navigate('/risks',{state:{openVendorName:drawerVendor.name,filterLevel:'High'}})}}
                >
                  <div className="text-[10px] text-gray-400 mb-1">High</div>
                  <div className="text-lg font-bold text-orange-500">{drawerRisks.filter(r=>level(residual(r))==='High').length}</div>
                </button>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-gray-400 mb-1">IRQ Score</div>
                  <div className={cn('text-lg font-bold', irqScore(drawerVendor)?'text-orange-500':'text-gray-400')}>
                    {irqScore(drawerVendor)?irqScore(drawerVendor).toFixed(2):'Pending'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-gray-400 mb-1">Spend</div>
                  <div className="text-lg font-bold text-gray-800">{drawerVendor.sp?'$'+Number(drawerVendor.sp).toLocaleString():'—'}</div>
                </div>
              </div>
              {/* Financial health + access flags in drawer */}
              <div className="flex items-center gap-3 flex-wrap">
                {drawerVendor.fh && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Financial Health</span>
                    <Badge label={drawerVendor.fh} colorClass={FH_COLORS[drawerVendor.fh]||'bg-gray-100 text-gray-500'} />
                    {drawerVendor.fh === 'Deteriorating' && (
                      <span className="text-[10px] text-red-600 font-semibold">⚠ Elevated exit risk</span>
                    )}
                  </div>
                )}
                {(drawerVendor.flags||[]).length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Access Flags</span>
                    {drawerVendor.flags.map(f => (
                      <span key={f} className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{f}</span>
                    ))}
                  </div>
                )}
                {(drawerVendor.regions||[]).length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Regions</span>
                    {drawerVendor.regions.map(r => (
                      <span key={r} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{r}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[['Contact',drawerVendor.con],['Email',drawerVendor.email],['Contract Start',drawerVendor.cs],['Contract End',drawerVendor.ce],['Annual Spend',drawerVendor.sp?'$'+Number(drawerVendor.sp).toLocaleString():'—'],['Data Classification',drawerVendor.dc],['Services',drawerVendor.svc]].map(([l,v])=>(
                  <div key={l}><div className="text-[10px] text-gray-400 mb-0.5">{l}</div><div className="text-gray-700 font-medium">{v||'—'}</div></div>
                ))}
              </div>
              {drawerIRQ && drawerIRQ.st==='Scored' && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-gray-600 mb-3">IRQ Domain Scores</h4>
                  {[{l:'Security (40%)',v:drawerIRQ.sec,c:'#ef4444'},{l:'Privacy (20%)',v:drawerIRQ.priv,c:'#7c5cbf'},{l:'BCM (30%)',v:drawerIRQ.bcm,c:'#f97316'},{l:'Financial (10%)',v:drawerIRQ.fin,c:'#eab308'}].map(d=>(
                    <div key={d.l} className="flex items-center gap-3 mb-2">
                      <div className="w-28 text-[11px] text-gray-500 shrink-0">{d.l}</div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${d.v/5*100}%`,background:d.c}} /></div>
                      <div className="w-8 text-right text-[11px] font-semibold" style={{color:d.c}}>{d.v}/5</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">Risks ({drawerRisks.length})</div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Risk','Inherent','Residual','Treatment','Status'].map(h=>(
                        <th key={h} className="px-3 py-2 text-left text-[10px] text-gray-400 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {drawerRisks.length===0
                      ? <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-400">No risks</td></tr>
                      : drawerRisks.map(r=>{
                          const res=residual(r)
                          const lv=level(res)
                          return (
                            <tr key={r.id} className="border-b border-gray-100">
                              <td className="px-3 py-2 max-w-[180px]">
                                <button
                                  onClick={()=>{setDrawer(null);navigate('/risks',{state:{openRiskId:r.id}})}}
                                  className="font-medium text-gray-700 text-left hover:text-blue-600 hover:underline"
                                >
                                  {r.name}
                                </button>
                              </td>
                              <td className="px-3 py-2 w-20"><ScoreBar value={r.lik*r.imp} color="#f97316" /></td>
                              <td className="px-3 py-2 w-28">
                                <ScoreBar value={res} />
                                <button
                                  onClick={()=>{setDrawer(null);navigate('/risks',{state:{filterLevel:lv}})}}
                                  className="mt-1 block hover:opacity-80 transition-opacity"
                                >
                                  <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded-full', LEVEL_COLORS[lv])}>{lv}</span>
                                </button>
                              </td>
                              <td className="px-3 py-2"><span className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded">{r.treat}</span></td>
                              <td className="px-3 py-2"><span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded">{r.st}</span></td>
                            </tr>
                          )
                        })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">{modal.mode==='add'?'Add Vendor':'Edit Vendor'}</h3>
              <button onClick={()=>setModal(null)} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              {[
                {label:'Vendor Name',key:'name',type:'text',span:2},
                {label:'Tier',key:'tier',type:'select',opts:['Tier 1','Tier 2','Tier 3','Tier 4']},
                {label:'Category',key:'cat',type:'select',opts:['Technology','Cloud / SaaS','Financial Services','Legal','Logistics','Healthcare','Consulting','Real Estate']},
                {label:'Status',key:'st',type:'select',opts:['Active','Under Review','Inactive']},
                {label:'Data Classification',key:'dc',type:'select',opts:['None','Internal','Confidential','Restricted','Restricted / PII']},
                {label:'Contact Name',key:'con',type:'text'},{label:'Contact Email',key:'email',type:'email'},
                {label:'Contract Start',key:'cs',type:'date'},{label:'Contract End',key:'ce',type:'date'},
                {label:'Annual Spend ($)',key:'sp',type:'number'},
                {label:'Services',key:'svc',type:'text',span:2},
              ].map(f=>(
                <div key={f.key} className={f.span===2?'col-span-2':''}>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.label}</label>
                  {f.type==='select'
                    ? <select className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:border-blue-400" value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}>{f.opts.map(o=><option key={o}>{o}</option>)}</select>
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
