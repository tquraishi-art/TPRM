import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Plus, X, Search, CheckCircle, XCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Seed data ────────────────────────────────────────────────────────────────

const APPROVERS = ['CRO', 'Risk Committee', 'Board', 'Head of TPRM', 'CISO', 'CFO', 'DPO']
const DECISION_TYPES = ['Risk Acceptance', 'Risk Transfer', 'Exception Granted', 'Assessment Approved', 'Vendor Approved', 'Appetite Override', 'Waiver Granted']

const RISKS_REF = [
  { id:'r1', name:'Unpatched vulnerabilities in cloud platform',      residual:14, cat:'Cybersecurity' },
  { id:'r2', name:'Inadequate data encryption at rest',               residual:10, cat:'Data Privacy' },
  { id:'r3', name:'PCI-DSS compliance gap – network segmentation',    residual:12, cat:'Compliance' },
  { id:'r5', name:'Single point of failure – cloud dependency',       residual:14, cat:'Business Continuity' },
  { id:'r8', name:'Ransomware impact on operational continuity',      residual:16, cat:'Operational Resilience' },
  { id:'r9', name:'Insider threat from contractor broad access',      residual: 8, cat:'Cybersecurity' },
  { id:'r10',name:'Negative press coverage – vendor data breach',     residual:10, cat:'Reputational' },
  { id:'r12',name:'AI tool data retention gap',                       residual:12, cat:'Data Privacy' },
]

const INIT_APPROVALS = [
  {
    id:'ap1', riskId:'r9', decisionType:'Risk Acceptance', decision:'Accepted',
    approver:'Risk Committee', approvedBy:'T. Wilson (Head of TPRM) + R. Brown (Legal)',
    decisionDate:'2026-09-02', reviewDate:'2027-09-02',
    residualAtDecision: 8, appetiteThreshold: 12,
    rationale:'Risk score 8 is within appetite threshold of 12 for Cybersecurity. Contractor access controls reviewed; MFA rollout on track for Q4. Residual accepted pending MFA completion.',
    conditions:['MFA must be deployed by 2026-10-31', 'Quarterly access review required', 'Contractor access scope reduced to minimum-necessary'],
    status:'Active',
  },
  {
    id:'ap2', riskId:'r3', decisionType:'Risk Transfer', decision:'Approved',
    approver:'CRO', approvedBy:'M. Patel (CRO)',
    decisionDate:'2026-09-03', reviewDate:'2027-03-03',
    residualAtDecision: 12, appetiteThreshold: 6,
    rationale:'Residual score 12 exceeds appetite threshold of 6 for Compliance. Decision taken to transfer residual risk via cyber insurance policy amendment covering PCI-DSS non-compliance events. Insurance broker engaged.',
    conditions:['Insurance policy amendment confirmed by 2026-10-15', 'Remediation of network segmentation must be completed by 2026-12-31', 'Interim compensating controls to remain active'],
    status:'Active',
  },
  {
    id:'ap3', riskId:'r5', decisionType:'Appetite Override', decision:'Accepted',
    approver:'Board', approvedBy:'Board Risk Sub-Committee – quorum of 4',
    decisionDate:'2026-07-15', reviewDate:'2027-01-15',
    residualAtDecision: 14, appetiteThreshold: 15,
    rationale:'Residual score 14 is within appetite threshold of 15 for Business Continuity. Board satisfied with cloud provider SLA commitments and multi-region DR capability.',
    conditions:['Annual DR test required', 'SLA breach threshold monitoring in place'],
    status:'Active',
  },
  {
    id:'ap4', riskId:'r2', decisionType:'Exception Granted', decision:'Approved',
    approver:'CISO', approvedBy:'S. Kim (CISO)',
    decisionDate:'2026-06-01', reviewDate:'2026-12-01',
    residualAtDecision: 10, appetiteThreshold: 10,
    rationale:'Residual score exactly at appetite threshold. Exception granted for 6 months while vendor migrates to FIPS 140-3 compliant encryption module. Migration plan reviewed and accepted.',
    conditions:['Encryption migration completed by 2026-11-30', 'Bi-monthly progress reports from vendor'],
    status:'Active',
  },
  {
    id:'ap5', riskId:'r8', decisionType:'Risk Acceptance', decision:'Rejected',
    approver:'Risk Committee', approvedBy:'Risk Committee',
    decisionDate:'2026-08-20', reviewDate:null,
    residualAtDecision: 16, appetiteThreshold: 14,
    rationale:'Residual score 16 exceeds appetite. Committee rejected acceptance — mandatory mitigation required. Vendor instructed to implement network isolation controls and endpoint detection within 60 days.',
    conditions:[],
    status:'Closed',
  },
]

const LEVEL_FROM_SCORE = s => s >= 20 ? 'Very High' : s >= 12 ? 'High' : s >= 6 ? 'Moderate' : s >= 2 ? 'Low' : 'Very Low'
const LEVEL_COLORS = { 'Very High':'text-red-600', 'High':'text-orange-500', 'Moderate':'text-yellow-600', 'Low':'text-blue-600', 'Very Low':'text-green-600' }

const DECISION_COLORS = {
  'Accepted': 'bg-blue-100 text-blue-700',
  'Approved': 'bg-green-100 text-green-700',
  'Rejected': 'bg-red-100 text-red-700',
  'Pending':  'bg-amber-100 text-amber-700',
}
const STATUS_COLORS = {
  'Active':  'bg-green-100 text-green-700',
  'Expired': 'bg-gray-100 text-gray-500',
  'Closed':  'bg-gray-100 text-gray-500',
  'Pending': 'bg-amber-100 text-amber-700',
}

const TODAY = '2026-09-09'
function daysUntil(d) { if (!d) return null; return Math.round((new Date(d)-new Date(TODAY))/86400000) }

const BLANK = { riskId:'r1', decisionType:'Risk Acceptance', decision:'Accepted', approver:'Risk Committee', approvedBy:'', decisionDate:'', reviewDate:'', residualAtDecision:'', appetiteThreshold:'', rationale:'', conditions:'', status:'Active' }

export default function Approvals() {
  const navigate   = useNavigate()
  const { state }  = useLocation()
  const [approvals, setApprovals] = useLocalStorage('tprm:approvals', INIT_APPROVALS)
  const [q, setQ]                 = useState('')
  const [filterDt, setFilterDt]   = useState('')
  const [filterSt, setFilterSt]   = useState('')
  const [expandedId, setExpandedId] = useState(state?.openRiskId ? INIT_APPROVALS.find(a => a.riskId === state.openRiskId)?.id : null)
  const [modal, setModal]         = useState(null)
  const [form, setForm]           = useState(BLANK)

  const filtered = approvals.filter(a => {
    const risk = RISKS_REF.find(r => r.id === a.riskId)
    if (q && !(risk?.name||'').toLowerCase().includes(q.toLowerCase()) && !a.rationale.toLowerCase().includes(q.toLowerCase()) && !a.approvedBy.toLowerCase().includes(q.toLowerCase())) return false
    if (filterDt && a.decisionType !== filterDt) return false
    if (filterSt && a.status !== filterSt) return false
    return true
  }).sort((a,b) => (b.decisionDate||'').localeCompare(a.decisionDate||''))

  const active   = approvals.filter(a => a.status === 'Active' && a.decision !== 'Rejected')
  const expiring = active.filter(a => { const d = daysUntil(a.reviewDate); return d !== null && d <= 90 })
  const rejected = approvals.filter(a => a.decision === 'Rejected')

  function openAdd()   { setForm({...BLANK, conditions:''}); setModal({mode:'add'}) }
  function save() {
    if (!form.riskId || !form.decisionDate) return
    const entry = {
      ...form,
      id: 'ap'+Math.random().toString(36).slice(2,8),
      conditions: form.conditions ? form.conditions.split('\n').filter(Boolean) : [],
      residualAtDecision: +form.residualAtDecision || 0,
      appetiteThreshold:  +form.appetiteThreshold  || 0,
    }
    setApprovals(prev => [...prev, entry])
    setModal(null)
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Approval & Sign-off Records</h1>
          <p className="text-xs text-gray-400 mt-0.5">Who approved what, when, at what score — formal decisions on risks, exceptions, and acceptances</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#0176d3] text-white text-xs font-medium px-3 py-2 rounded hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5" /> Record Decision
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Active Approvals',     value: active.length,    color:'text-green-600' },
          { label:'Reviews Due ≤90 days', value: expiring.length,  color: expiring.length > 0 ? 'text-amber-500' : 'text-green-600' },
          { label:'Rejected Decisions',   value: rejected.length,  color: rejected.length > 0 ? 'text-red-600' : 'text-green-600' },
          { label:'Total Records',        value: approvals.length, color:'text-gray-800' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{k.label}</div>
            <div className={cn('text-2xl font-bold', k.color)}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Expiry alert */}
      {expiring.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <strong>{expiring.length} approval{expiring.length > 1 ? 's' : ''} due for review within 90 days.</strong>
            {' '}Re-assess each risk before the review date to confirm conditions remain valid.
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400" placeholder="Search risk, rationale, approver…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterDt} onChange={e=>setFilterDt(e.target.value)}>
          <option value="">All Decision Types</option>
          {DECISION_TYPES.map(d=><option key={d}>{d}</option>)}
        </select>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterSt} onChange={e=>setFilterSt(e.target.value)}>
          <option value="">All Status</option>
          {['Active','Expired','Closed','Pending'].map(s=><option key={s}>{s}</option>)}
        </select>
        {(q||filterDt||filterSt) && <button onClick={()=>{setQ('');setFilterDt('');setFilterSt('')}} className="text-xs text-blue-500 hover:text-blue-700 px-2">Clear</button>}
      </div>

      {/* Approval cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-8 text-center text-xs text-gray-400">No records found</div>
        )}
        {filtered.map(ap => {
          const risk = RISKS_REF.find(r => r.id === ap.riskId)
          const isOpen = expandedId === ap.id
          const reviewDays = daysUntil(ap.reviewDate)
          const reviewUrgent = reviewDays !== null && reviewDays <= 90

          return (
            <div key={ap.id} className={cn('bg-white border rounded-lg overflow-hidden', ap.decision==='Rejected' ? 'border-red-200' : 'border-gray-200')}>
              <button
                className="w-full px-4 py-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
                onClick={() => setExpandedId(v => v===ap.id ? null : ap.id)}
              >
                {/* Decision icon */}
                <div className="shrink-0 mt-0.5">
                  {ap.decision === 'Rejected'
                    ? <XCircle className="w-4 h-4 text-red-400" />
                    : <CheckCircle className="w-4 h-4 text-green-400" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', DECISION_COLORS[ap.decision]||'bg-gray-100 text-gray-500')}>{ap.decision}</span>
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{ap.decisionType}</span>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', STATUS_COLORS[ap.status]||'bg-gray-100 text-gray-500')}>{ap.status}</span>
                  </div>
                  <div className="text-xs font-semibold text-gray-800 mb-0.5">
                    {risk
                      ? <button className="text-blue-500 hover:underline text-left" onClick={e=>{e.stopPropagation();navigate('/risks',{state:{openRiskId:ap.riskId}})}}>{risk.name}</button>
                      : ap.riskId
                    }
                  </div>
                  <div className="text-[11px] text-gray-400 flex items-center gap-3 flex-wrap">
                    <span>By: <strong className="text-gray-600">{ap.approvedBy}</strong></span>
                    <span>{ap.decisionDate}</span>
                    {ap.reviewDate && <span className={cn(reviewUrgent ? 'text-amber-600 font-semibold' : '')}>Review: {ap.reviewDate}{reviewUrgent && ` (${reviewDays}d)`}</span>}
                  </div>
                </div>

                {/* Score at decision */}
                <div className="shrink-0 flex flex-col items-end gap-0.5">
                  <span className="text-[10px] text-gray-400">Score at decision</span>
                  <span className={cn('text-sm font-bold', LEVEL_COLORS[LEVEL_FROM_SCORE(ap.residualAtDecision)])}>{ap.residualAtDecision}</span>
                </div>

                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />}
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/40 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Approver</span>{ap.approver}</div>
                    <div><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Signed Off By</span>{ap.approvedBy}</div>
                    <div><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Decision Date</span>{ap.decisionDate}</div>
                    <div><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Review Date</span>{ap.reviewDate || '—'}</div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Residual at Decision</span>
                      <span className={cn('font-bold', LEVEL_COLORS[LEVEL_FROM_SCORE(ap.residualAtDecision)])}>{ap.residualAtDecision} ({LEVEL_FROM_SCORE(ap.residualAtDecision)})</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Appetite Threshold</span>
                      <span className="font-medium text-gray-700">≤{ap.appetiteThreshold}</span>
                      {ap.residualAtDecision > ap.appetiteThreshold && <span className="text-red-500 ml-1">(breach +{ap.residualAtDecision - ap.appetiteThreshold})</span>}
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Risk Category</span>
                      <span>{risk?.cat || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Status</span>
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', STATUS_COLORS[ap.status]||'')}>{ap.status}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Rationale</span>
                    <p className="text-xs text-gray-700 leading-relaxed">{ap.rationale}</p>
                  </div>
                  {ap.conditions?.length > 0 && (
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Conditions</span>
                      <ul className="space-y-1">
                        {ap.conditions.map((c,i) => <li key={i} className="flex gap-2 text-xs text-gray-700"><span className="text-blue-400 mt-0.5 shrink-0">·</span>{c}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => navigate('/risks',{state:{openRiskId:ap.riskId}})} className="text-xs text-blue-500 hover:underline">View risk →</button>
                    <button onClick={() => navigate('/appetite')} className="text-xs text-blue-500 hover:underline">View appetite →</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Record Decision</h3>
              <button onClick={()=>setModal(null)}><X className="w-4 h-4 text-gray-400"/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label:'Risk', key:'riskId', type:'select', opts: RISKS_REF.map(r=>({val:r.id,label:r.name.slice(0,45)})), span:2 },
                  { label:'Decision Type', key:'decisionType', type:'select', opts: DECISION_TYPES.map(d=>({val:d,label:d})) },
                  { label:'Decision', key:'decision', type:'select', opts:['Accepted','Approved','Rejected','Pending'].map(d=>({val:d,label:d})) },
                  { label:'Approver (role)', key:'approver', type:'select', opts: APPROVERS.map(a=>({val:a,label:a})) },
                  { label:'Signed off by (name)', key:'approvedBy', type:'text' },
                  { label:'Decision Date', key:'decisionDate', type:'date' },
                  { label:'Review Date', key:'reviewDate', type:'date' },
                  { label:'Residual Score at Decision', key:'residualAtDecision', type:'number' },
                  { label:'Appetite Threshold', key:'appetiteThreshold', type:'number' },
                  { label:'Status', key:'status', type:'select', opts:['Active','Pending','Closed'].map(s=>({val:s,label:s})) },
                  { label:'Rationale', key:'rationale', type:'textarea', span:2 },
                  { label:'Conditions (one per line)', key:'conditions', type:'textarea', span:2 },
                ].map(f => (
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
