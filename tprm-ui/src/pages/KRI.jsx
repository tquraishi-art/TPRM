import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Edit2, Plus, X, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const KRIS_INIT = [
  {id:'k1',name:'% Tier 1 vendors with overdue assessments',vendor:'',cat:'Operational',val:33,unit:'%',warn:20,crit:40,trend:'Deteriorating'},
  {id:'k2',name:'Open Critical/Very High risks (residual)',vendor:'',cat:'Cybersecurity',val:3,unit:'count',warn:3,crit:5,trend:'Stable'},
  {id:'k3',name:'Average days to remediate High risk',vendor:'',cat:'Operational',val:47,unit:'days',warn:45,crit:60,trend:'Deteriorating'},
  {id:'k4',name:'Vendors with expired contracts',vendor:'',cat:'Compliance',val:1,unit:'count',warn:1,crit:3,trend:'Stable'},
  {id:'k5',name:'Issues overdue',vendor:'',cat:'Operational',val:1,unit:'count',warn:2,crit:5,trend:'Improving'},
  {id:'k6',name:'Vendors under financial stress',vendor:'',cat:'Financial',val:1,unit:'count',warn:1,crit:2,trend:'Stable'},
  {id:'k7',name:'4th-party concentration ratio',vendor:'',cat:'Concentration',val:62,unit:'%',warn:50,crit:70,trend:'Deteriorating'},
  {id:'k8',name:'IRQ assessments due for renewal',vendor:'',cat:'Operational',val:2,unit:'count',warn:2,crit:4,trend:'Stable'},
]

const CATS   = ['Operational','Cybersecurity','Compliance','Financial','Concentration']
const TRENDS = ['Improving','Stable','Deteriorating']
const EMPTY_FORM = { name:'', cat:'Operational', val:'', unit:'', warn:'', crit:'', trend:'Stable' }

function getStatus(kri) {
  if (kri.val >= kri.crit) return 'Critical'
  if (kri.val >= kri.warn) return 'Warning'
  return 'Normal'
}

function statusStyles(status) {
  if (status === 'Critical') return { badge:'bg-red-100 text-red-700 border border-red-200', bar:'bg-red-500', text:'text-red-600' }
  if (status === 'Warning')  return { badge:'bg-orange-100 text-orange-700 border border-orange-200', bar:'bg-orange-400', text:'text-orange-500' }
  return { badge:'bg-green-100 text-green-700 border border-green-200', bar:'bg-green-500', text:'text-green-600' }
}

function TrendBadge({ trend }) {
  if (trend === 'Improving')     return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200"><TrendingUp size={11}/>Improving</span>
  if (trend === 'Deteriorating') return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200"><TrendingDown size={11}/>Deteriorating</span>
  return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200"><Minus size={11}/>Stable</span>
}

function DetailPanel({ kri, navigate, onClose }) {
  const st = getStatus(kri)
  const s  = statusStyles(st)
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-semibold text-gray-800 leading-snug">{kri.name}</div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0"><X size={14}/></button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div><div className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">Category</div><div className="font-medium text-gray-700">{kri.cat}</div></div>
        <div><div className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">Current Value</div><div className={cn('font-bold', s.text)}>{kri.val} <span className="text-gray-400 font-normal">{kri.unit}</span></div></div>
        <div><div className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">Warning Threshold</div><div className="font-medium text-orange-500">{kri.warn} {kri.unit}</div></div>
        <div><div className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">Critical Threshold</div><div className="font-medium text-red-600">{kri.crit} {kri.unit}</div></div>
        <div><div className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">Trend</div><TrendBadge trend={kri.trend}/></div>
        <div><div className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">Status</div><span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', s.badge)}>{st}</span></div>
      </div>
      <button
        onClick={() => navigate('/risks', { state: { filterCat: kri.cat } })}
        className="inline-flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
      >
        View related risks
      </button>
    </div>
  )
}

export default function KRI() {
  const navigate = useNavigate()
  const [kris, setKris]           = useLocalStorage('tprm:kri', KRIS_INIT)
  const [filterStatus, setFilter] = useState(null)
  const [filterCat, setFilterCat] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [modal, setModal]         = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)

  const counts = {
    Critical: kris.filter(k => getStatus(k) === 'Critical').length,
    Warning:  kris.filter(k => getStatus(k) === 'Warning').length,
    Normal:   kris.filter(k => getStatus(k) === 'Normal').length,
  }
  const filtered = kris.filter(k => {
    if (filterStatus && getStatus(k) !== filterStatus) return false
    if (filterCat && k.cat !== filterCat) return false
    return true
  })

  function openAdd() { setForm(EMPTY_FORM); setModal({ mode:'add' }) }
  function openEdit(kri) {
    setForm({ name:kri.name, cat:kri.cat, val:String(kri.val), unit:kri.unit, warn:String(kri.warn), crit:String(kri.crit), trend:kri.trend })
    setModal({ mode:'edit', id:kri.id })
  }
  function saveModal() {
    const entry = { name:form.name, cat:form.cat, val:Number(form.val), unit:form.unit, warn:Number(form.warn), crit:Number(form.crit), trend:form.trend }
    if (modal.mode === 'add') {
      setKris(prev => [...prev, { ...entry, id:'k'+Date.now(), vendor:'' }])
    } else {
      setKris(prev => prev.map(k => k.id === modal.id ? { ...k, ...entry } : k))
    }
    setModal(null)
  }

  function toggleExpand(id) {
    setExpandedId(prev => prev === id ? null : id)
  }

  const TILE_DEFS = [
    { label:'Critical', status:'Critical', count:counts.Critical, num:'text-red-600',    bg:'bg-red-50 border-red-200 hover:bg-red-100' },
    { label:'Warning',  status:'Warning',  count:counts.Warning,  num:'text-orange-500', bg:'bg-orange-50 border-orange-200 hover:bg-orange-100' },
    { label:'Normal',   status:'Normal',   count:counts.Normal,   num:'text-green-600',  bg:'bg-green-50 border-green-200 hover:bg-green-100' },
    { label:'Total',    status:null,       count:kris.length,     num:'text-gray-700',   bg:'bg-gray-50 border-gray-200 hover:bg-gray-100' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KRI Monitor</h1>
          <p className="text-sm text-gray-500 mt-0.5">Key Risk Indicators — threshold tracking across all vendor risk domains</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={15}/> Add KRI
        </button>
      </div>

      {/* Status summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {TILE_DEFS.map(t => (
          <button
            key={t.label}
            onClick={() => setFilter(filterStatus === t.status ? null : t.status)}
            className={cn('border rounded-xl p-4 text-left transition-all cursor-pointer', t.bg, filterStatus === t.status && 'ring-2 ring-blue-400')}
          >
            <div className={cn('text-3xl font-bold', t.num)}>{t.count}</div>
            <div className="text-sm text-gray-600 mt-1">{t.label}</div>
          </button>
        ))}
      </div>

      {/* KRI Cards grid */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Indicator Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {kris.map(kri => {
            const st  = getStatus(kri)
            const s   = statusStyles(st)
            const pct = Math.min(100, Math.round((kri.val / Math.max(kri.crit, 1)) * 100))
            const isExpanded = expandedId === kri.id
            return (
              <div key={kri.id} className="flex flex-col gap-2">
                <div
                  onClick={() => toggleExpand(kri.id)}
                  className={cn(
                    'bg-white border rounded-xl p-3 shadow-sm flex flex-col gap-2 cursor-pointer transition-all',
                    isExpanded ? 'border-blue-300 shadow-md' : 'border-gray-100 hover:border-blue-200 hover:shadow'
                  )}
                >
                  <div className="text-xs text-gray-500 leading-snug min-h-[2.5rem] line-clamp-3">{kri.name}</div>
                  <div className={cn('text-2xl font-bold', s.text)}>
                    {kri.val}<span className="text-sm font-normal ml-1 text-gray-400">{kri.unit}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Warn: {kri.warn}</span>
                    <span>Crit: {kri.crit}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', s.bar)} style={{ width:`${pct}%` }}/>
                  </div>
                  <TrendBadge trend={kri.trend}/>
                  <div className="flex items-center justify-between gap-1">
                    <button
                      onClick={e => { e.stopPropagation(); setFilterCat(filterCat === kri.cat ? '' : kri.cat) }}
                      className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full border transition-colors',
                        filterCat === kri.cat
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-blue-50 hover:text-blue-600'
                      )}
                    >
                      {kri.cat}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setFilter(filterStatus === st ? null : st) }}
                      className={cn('text-xs font-medium px-2 py-0.5 rounded-full border transition-colors hover:opacity-80', s.badge)}
                    >
                      {st}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    {isExpanded
                      ? <ChevronUp size={12} className="text-blue-400"/>
                      : <ChevronDown size={12} className="text-gray-300"/>
                    }
                  </div>
                </div>
                {isExpanded && (
                  <DetailPanel
                    kri={kri}
                    navigate={navigate}
                    onClose={() => setExpandedId(null)}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Full table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            All Indicators{filterStatus && ` — ${filterStatus}`}{filterCat && ` — ${filterCat}`}
          </h2>
          <div className="flex items-center gap-2">
            {/* Category filter dropdown */}
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400"
            >
              <option value="">All Categories</option>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
            {(filterStatus || filterCat) && (
              <button
                onClick={() => { setFilter(null); setFilterCat('') }}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <X size={12}/> Clear filters
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                {['Indicator','Category','Current Value','Warn / Crit','Status','Trend','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(kri => {
                const st = getStatus(kri)
                const s  = statusStyles(st)
                const isExpanded = expandedId === kri.id
                return (
                  <React.Fragment key={kri.id}>
                    <tr
                      onClick={() => toggleExpand(kri.id)}
                      className={cn('hover:bg-gray-50 transition-colors cursor-pointer', isExpanded && 'bg-blue-50')}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          {isExpanded
                            ? <ChevronUp size={12} className="text-blue-400 shrink-0"/>
                            : <ChevronDown size={12} className="text-gray-300 shrink-0"/>
                          }
                          {kri.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setFilterCat(filterCat === kri.cat ? '' : kri.cat)}
                          className={cn('text-xs font-medium px-2 py-0.5 rounded-full border transition-colors',
                            filterCat === kri.cat
                              ? 'bg-blue-100 text-blue-700 border-blue-300'
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-blue-50 hover:text-blue-600'
                          )}
                        >
                          {kri.cat}
                        </button>
                      </td>
                      <td className={cn('px-4 py-3 font-bold', s.text)}>
                        {kri.val} <span className="text-xs font-normal text-gray-400">{kri.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{kri.warn} / {kri.crit}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setFilter(filterStatus === st ? null : st)}
                          className={cn('text-xs font-medium px-2 py-0.5 rounded-full transition-colors hover:opacity-80', s.badge)}
                        >
                          {st}
                        </button>
                      </td>
                      <td className="px-4 py-3"><TrendBadge trend={kri.trend}/></td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(kri)} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors">
                          <Edit2 size={13}/> Edit
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${kri.id}-detail`}>
                        <td colSpan={7} className="px-4 py-3 bg-blue-50/50">
                          <DetailPanel
                            kri={kri}
                            navigate={navigate}
                            onClose={() => setExpandedId(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">No indicators match the selected filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{modal.mode === 'add' ? 'Add KRI' : 'Edit KRI'}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Indicator Name</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="KRI name"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.cat} onChange={e => setForm(f => ({...f, cat:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Trend</label>
                  <select value={form.trend} onChange={e => setForm(f => ({...f, trend:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {TRENDS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Current Value</label>
                  <input type="number" value={form.val} onChange={e => setForm(f => ({...f, val:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="0"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                  <input value={form.unit} onChange={e => setForm(f => ({...f, unit:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="%, count, days…"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Warning Threshold</label>
                  <input type="number" value={form.warn} onChange={e => setForm(f => ({...f, warn:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Critical Threshold</label>
                  <input type="number" value={form.crit} onChange={e => setForm(f => ({...f, crit:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={saveModal} disabled={!form.name} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
