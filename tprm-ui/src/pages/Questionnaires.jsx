import { useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, X, Check, ChevronDown, ChevronRight, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VENDORS_INIT } from '@/lib/seedData'

// ─── Questionnaire domains and questions (CAIQ/SIG-aligned) ──────────────────

const DOMAINS = [
  {
    id: 'gov', label: 'Governance', weight: 0.10,
    questions: [
      { id: 'gov1', text: 'Does the vendor have an ISO 27001 or SOC 2 Type II certification?' },
      { id: 'gov2', text: 'Is there a named CISO or equivalent information security officer?' },
      { id: 'gov3', text: 'Is there a written information security policy reviewed annually?' },
      { id: 'gov4', text: 'Does the vendor have a board-level security committee or equivalent?' },
    ],
  },
  {
    id: 'risk', label: 'Risk Management', weight: 0.10,
    questions: [
      { id: 'risk1', text: 'Does the vendor conduct annual risk assessments against a recognised framework (NIST, ISO)?' },
      { id: 'risk2', text: 'Are risk findings tracked in a formal risk register?' },
      { id: 'risk3', text: 'Is there a documented risk treatment process with owners and due dates?' },
    ],
  },
  {
    id: 'comp', label: 'Compliance', weight: 0.10,
    questions: [
      { id: 'comp1', text: 'Is the vendor compliant with all applicable data protection laws (GDPR, CCPA, APPI)?' },
      { id: 'comp2', text: 'Does the vendor have a process for monitoring regulatory changes?' },
      { id: 'comp3', text: 'Has the vendor undergone an external compliance audit in the past 12 months?' },
    ],
  },
  {
    id: 'hr', label: 'Human Resources', weight: 0.05,
    questions: [
      { id: 'hr1', text: 'Are background checks conducted on all personnel with access to Salesforce data?' },
      { id: 'hr2', text: 'Is security awareness training mandatory for all staff annually?' },
      { id: 'hr3', text: 'Is there a defined process for revoking access on employee termination?' },
    ],
  },
  {
    id: 'phys', label: 'Physical Security', weight: 0.05,
    questions: [
      { id: 'phys1', text: 'Are data centre or office facilities secured with physical access controls (badge, biometric)?' },
      { id: 'phys2', text: 'Is physical access logged and reviewed regularly?' },
      { id: 'phys3', text: 'Are visitors to sensitive areas escorted at all times?' },
    ],
  },
  {
    id: 'tech', label: 'Technology Controls', weight: 0.25,
    questions: [
      { id: 'tech1', text: 'Is data encrypted at rest using AES-256 or equivalent?' },
      { id: 'tech2', text: 'Is data encrypted in transit using TLS 1.2 or above?' },
      { id: 'tech3', text: 'Is multi-factor authentication enforced for all privileged access?' },
      { id: 'tech4', text: 'Is there a vulnerability management programme with defined SLAs for patching critical CVEs?' },
      { id: 'tech5', text: 'Is penetration testing conducted at least annually?' },
      { id: 'tech6', text: 'Are SIEM/log management tools in place for security event monitoring?' },
    ],
  },
  {
    id: 'chg', label: 'Change Management', weight: 0.10,
    questions: [
      { id: 'chg1', text: 'Is there a formal change management process with approval gates?' },
      { id: 'chg2', text: 'Are changes tested in a non-production environment before deployment?' },
      { id: 'chg3', text: 'Is there a rollback capability for failed deployments?' },
    ],
  },
  {
    id: 'bcm', label: 'Business Continuity', weight: 0.15,
    questions: [
      { id: 'bcm1', text: 'Is there a documented Business Continuity Plan (BCP) reviewed annually?' },
      { id: 'bcm2', text: 'Has the BCP been tested in the past 12 months?' },
      { id: 'bcm3', text: 'Are defined RTO/RPO targets included in service agreements?' },
      { id: 'bcm4', text: 'Is there a Disaster Recovery Plan (DRP) with documented failover procedures?' },
    ],
  },
  {
    id: 'priv', label: 'Privacy', weight: 0.10,
    questions: [
      { id: 'priv1', text: 'Is there a signed Data Processing Agreement (DPA) covering all data shared?' },
      { id: 'priv2', text: 'Does the vendor have a documented process for handling data subject requests (DSARs)?' },
      { id: 'priv3', text: 'Are sub-processors disclosed and covered by equivalent data protection obligations?' },
      { id: 'priv4', text: 'Is cross-border data transfer covered by appropriate transfer mechanisms (SCCs, BCRs)?' },
    ],
  },
]

const ANSWER_VALUES = { 'Yes': 1, 'Partial': 0.5, 'No': 0, '': null }
const ANSWER_OPTS   = ['', 'Yes', 'Partial', 'No']
const ANSWER_COLORS = {
  'Yes':     'bg-green-100 text-green-700',
  'Partial': 'bg-yellow-100 text-yellow-700',
  'No':      'bg-red-100 text-red-700',
  '':        'bg-gray-100 text-gray-400',
}

function scoreQuestionnaire(responses) {
  let total = 0, weight = 0
  for (const domain of DOMAINS) {
    const qs = domain.questions
    const answered = qs.filter(q => responses[q.id] !== '' && responses[q.id] !== undefined)
    if (answered.length === 0) continue
    const domScore = answered.reduce((s, q) => s + (ANSWER_VALUES[responses[q.id]] ?? 0), 0) / answered.length
    total  += domScore * domain.weight
    weight += domain.weight
  }
  return weight > 0 ? +(total / weight * 100).toFixed(1) : null
}

function scoreLevel(score) {
  if (score === null) return 'Incomplete'
  if (score >= 80) return 'Strong'
  if (score >= 60) return 'Adequate'
  if (score >= 40) return 'Needs Improvement'
  return 'Critical Gap'
}

const SCORE_COLORS = {
  'Strong':           'text-green-600',
  'Adequate':         'text-blue-600',
  'Needs Improvement':'text-orange-500',
  'Critical Gap':     'text-red-600',
  'Incomplete':       'text-gray-400',
}
const SCORE_BG = {
  'Strong':           'bg-green-50 border-green-200',
  'Adequate':         'bg-blue-50 border-blue-200',
  'Needs Improvement':'bg-orange-50 border-orange-200',
  'Critical Gap':     'bg-red-50 border-red-200',
  'Incomplete':       'bg-gray-50 border-gray-200',
}

function blankResponses() {
  const r = {}
  DOMAINS.forEach(d => d.questions.forEach(q => { r[q.id] = '' }))
  return r
}

const INIT_QUESTIONNAIRES = [
  {
    id: 'qs1', vendor: 'Amazon Web Services', year: '2026', completedDate: '2026-08-15', status: 'Completed', reviewer: 'S. Kim',
    responses: {
      gov1:'Yes', gov2:'Yes', gov3:'Yes', gov4:'Yes',
      risk1:'Yes', risk2:'Yes', risk3:'Yes',
      comp1:'Yes', comp2:'Yes', comp3:'Yes',
      hr1:'Yes', hr2:'Yes', hr3:'Yes',
      phys1:'Yes', phys2:'Yes', phys3:'Yes',
      tech1:'Yes', tech2:'Yes', tech3:'Yes', tech4:'Yes', tech5:'Yes', tech6:'Yes',
      chg1:'Yes', chg2:'Yes', chg3:'Yes',
      bcm1:'Yes', bcm2:'Yes', bcm3:'Yes', bcm4:'Yes',
      priv1:'Yes', priv2:'Yes', priv3:'Yes', priv4:'Yes',
    },
    notes: 'AWS has SOC 2 Type II and ISO 27001. Shared responsibility model means Salesforce retains responsibility for data-layer controls.',
  },
  {
    id: 'qs2', vendor: 'Okta', year: '2026', completedDate: '2026-08-20', status: 'Completed', reviewer: 'M. Davis',
    responses: {
      gov1:'Yes', gov2:'Yes', gov3:'Yes', gov4:'Partial',
      risk1:'Yes', risk2:'Yes', risk3:'Yes',
      comp1:'Yes', comp2:'Yes', comp3:'Yes',
      hr1:'Yes', hr2:'Yes', hr3:'Yes',
      phys1:'Yes', phys2:'Yes', phys3:'Yes',
      tech1:'Yes', tech2:'Yes', tech3:'Yes', tech4:'Partial', tech5:'Yes', tech6:'Yes',
      chg1:'Yes', chg2:'Yes', chg3:'Yes',
      bcm1:'Yes', bcm2:'Partial', bcm3:'Yes', bcm4:'Yes',
      priv1:'Yes', priv2:'Yes', priv3:'Yes', priv4:'Yes',
    },
    notes: 'Okta SOC 2 Type II confirmed. BCP test evidence not yet received for 2026 cycle. Phishing-resistant MFA rollout for admins in progress.',
  },
  {
    id: 'qs3', vendor: 'NTT DATA INTELLILINK', year: '2026', completedDate: '2026-09-01', status: 'Completed', reviewer: 'S. Kim',
    responses: {
      gov1:'Partial', gov2:'Yes', gov3:'Yes', gov4:'No',
      risk1:'Yes', risk2:'Partial', risk3:'Partial',
      comp1:'Yes', comp2:'Partial', comp3:'Partial',
      hr1:'Yes', hr2:'Yes', hr3:'Yes',
      phys1:'Yes', phys2:'Yes', phys3:'Yes',
      tech1:'Yes', tech2:'Yes', tech3:'Partial', tech4:'Partial', tech5:'Partial', tech6:'Partial',
      chg1:'Yes', chg2:'Yes', chg3:'Partial',
      bcm1:'Yes', bcm2:'Partial', bcm3:'Partial', bcm4:'Partial',
      priv1:'Partial', priv2:'Partial', priv3:'No', priv4:'Partial',
    },
    notes: 'Sub-processor disclosure gap is the most significant finding. PAM controls not consistently enforced across all SOWs. Follow-up required.',
  },
  {
    id: 'qs4', vendor: 'Dentsu', year: '2026', completedDate: '', status: 'In Progress', reviewer: 'L. Park',
    responses: {
      gov1:'', gov2:'Yes', gov3:'Yes', gov4:'',
      risk1:'Yes', risk2:'', risk3:'',
      comp1:'', comp2:'', comp3:'',
      hr1:'Yes', hr2:'Yes', hr3:'Yes',
      phys1:'Yes', phys2:'', phys3:'',
      tech1:'', tech2:'Yes', tech3:'', tech4:'', tech5:'', tech6:'',
      chg1:'', chg2:'', chg3:'',
      bcm1:'', bcm2:'', bcm3:'', bcm4:'',
      priv1:'', priv2:'', priv3:'', priv4:'',
    },
    notes: 'Questionnaire in progress. Priority domain is Privacy given Japan APPI and CD/PII data access flags.',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Questionnaires() {
  const navigate = useNavigate()
  const [questionnaires, setQuestionnaires] = useLocalStorage('tprm:questionnaires', INIT_QUESTIONNAIRES)
  const [search, setSearch]                 = useState('')
  const [filterSt, setFilterSt]             = useState('')
  const [expandedId, setExpandedId]         = useState(null)
  const [activeTab, setActiveTab]           = useState({}) // id -> domain id
  const [modalOpen, setModalOpen]           = useState(false)
  const [editQs, setEditQs]                 = useState(null)
  const [form, setForm]                     = useState({ id:'', vendor:'Amazon Web Services', year:'2026', completedDate:'', status:'In Progress', reviewer:'', notes:'', responses: blankResponses() })

  const filtered = questionnaires.filter(q => {
    if (search && !q.vendor.toLowerCase().includes(search.toLowerCase())) return false
    if (filterSt && q.status !== filterSt) return false
    return true
  })

  function openAdd() {
    setEditQs(null)
    setForm({ id:'qs'+Date.now(), vendor:'Amazon Web Services', year:'2026', completedDate:'', status:'In Progress', reviewer:'', notes:'', responses: blankResponses() })
    setModalOpen(true)
  }
  function openEdit(q, e) {
    e.stopPropagation()
    setEditQs(q)
    setForm({ ...q, responses: { ...blankResponses(), ...(q.responses||{}) } })
    setModalOpen(true)
  }
  function save() {
    if (editQs) {
      setQuestionnaires(prev => prev.map(q => q.id === form.id ? { ...form } : q))
    } else {
      setQuestionnaires(prev => [...prev, { ...form }])
    }
    setModalOpen(false)
  }
  function setResponse(qid, val) {
    setForm(f => ({ ...f, responses: { ...f.responses, [qid]: val } }))
  }

  function domainScore(qs, domainId) {
    const domain = DOMAINS.find(d => d.id === domainId)
    if (!domain) return null
    const answered = domain.questions.filter(q => qs.responses?.[q.id] !== '' && qs.responses?.[q.id] !== undefined)
    if (answered.length === 0) return null
    return +(answered.reduce((s, q) => s + (ANSWER_VALUES[qs.responses[q.id]] ?? 0), 0) / answered.length * 100).toFixed(0)
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Vendor Security Questionnaires</h1>
          <p className="text-xs text-gray-400 mt-0.5">CAIQ/SIG-aligned questionnaire scoring — 9 domains, weighted composite score</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New Assessment
        </button>
      </div>

      {/* Domain legend */}
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        {DOMAINS.map(d => (
          <span key={d.id} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
            {d.label} ({Math.round(d.weight * 100)}%)
          </span>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
            placeholder="Search vendor…" value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterSt} onChange={e => setFilterSt(e.target.value)}>
          <option value="">All Statuses</option>
          {['In Progress','Completed','Overdue'].map(s => <option key={s}>{s}</option>)}
        </select>
        {(search || filterSt) && (
          <button onClick={() => { setSearch(''); setFilterSt('') }} className="text-xs text-gray-400 hover:text-gray-600 underline">Clear</button>
        )}
      </div>

      {/* Questionnaire cards */}
      <div className="space-y-3">
        {filtered.map(qs => {
          const score = scoreQuestionnaire(qs.responses || {})
          const level = scoreLevel(score)
          const open  = expandedId === qs.id
          const activeDom = activeTab[qs.id] || DOMAINS[0].id
          return (
            <div key={qs.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                className="w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(v => v === qs.id ? null : qs.id)}
              >
                <ClipboardList className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-800">{qs.vendor}</span>
                    <span className="text-[10px] text-gray-400">{qs.year}</span>
                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded',
                      qs.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      qs.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    )}>{qs.status}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {score !== null ? (
                      <span className={cn('text-lg font-bold leading-none', SCORE_COLORS[level])}>{score}%</span>
                    ) : (
                      <span className="text-sm text-gray-400 font-medium">Incomplete</span>
                    )}
                    <span className={cn('text-[10px] font-semibold', SCORE_COLORS[level])}>{level}</span>
                    <span className="text-[11px] text-gray-400">
                      Reviewer: {qs.reviewer || '—'}{qs.completedDate && ` · ${qs.completedDate}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={e => openEdit(qs, e)} className="text-gray-300 hover:text-blue-500 p-1 rounded hover:bg-gray-100 transition-colors text-[10px]">Edit</button>
                  {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {open && (
                <div className="border-t border-gray-100 bg-gray-50/40">
                  {/* Domain score summary bar */}
                  <div className="px-5 py-3 flex gap-2 flex-wrap border-b border-gray-100">
                    {DOMAINS.map(d => {
                      const ds = domainScore(qs, d.id)
                      return (
                        <button
                          key={d.id}
                          onClick={() => setActiveTab(t => ({ ...t, [qs.id]: d.id }))}
                          className={cn(
                            'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border text-[10px] transition-all min-w-[72px]',
                            activeDom === d.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-100 hover:border-gray-300'
                          )}
                        >
                          <span className="font-semibold text-gray-700">{d.label}</span>
                          {ds !== null ? (
                            <span className={cn('font-bold', ds >= 80 ? 'text-green-600' : ds >= 60 ? 'text-blue-600' : ds >= 40 ? 'text-orange-500' : 'text-red-600')}>{ds}%</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Active domain questions */}
                  {(() => {
                    const domain = DOMAINS.find(d => d.id === activeDom)
                    if (!domain) return null
                    return (
                      <div className="px-5 py-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-semibold text-gray-700">{domain.label}</span>
                          <span className="text-[10px] text-gray-400">— Weight: {Math.round(domain.weight * 100)}%</span>
                        </div>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="pb-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Question</th>
                              <th className="pb-2 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-24">Response</th>
                            </tr>
                          </thead>
                          <tbody>
                            {domain.questions.map(q => {
                              const ans = qs.responses?.[q.id] || ''
                              return (
                                <tr key={q.id} className="border-b border-gray-50">
                                  <td className="py-2 text-gray-700 leading-snug pr-4">{q.text}</td>
                                  <td className="py-2 text-center">
                                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded', ANSWER_COLORS[ans])}>
                                      {ans || 'N/A'}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                        {qs.notes && (
                          <div className="mt-3 text-[11px] text-gray-500 bg-white border border-gray-100 rounded px-3 py-2">
                            <span className="font-semibold text-gray-500">Notes: </span>{qs.notes}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-8 text-center text-xs text-gray-400">No questionnaires found</div>
        )}
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setModalOpen(false)} />
          <div className="w-[640px] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-sm font-semibold text-gray-800">{editQs ? 'Edit Questionnaire' : 'New Security Questionnaire'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
            </div>

            <div className="shrink-0 px-5 pt-4 pb-3 grid grid-cols-2 gap-3 text-xs border-b border-gray-100">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Vendor</label>
                <select value={form.vendor} onChange={e => setForm(f => ({...f, vendor: e.target.value}))} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
                  {VENDORS_INIT.map(v => <option key={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Assessment Year</label>
                <input value={form.year} onChange={e => setForm(f => ({...f, year: e.target.value}))} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
                  {['In Progress','Completed','Overdue'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Reviewer</label>
                <input value={form.reviewer} onChange={e => setForm(f => ({...f, reviewer: e.target.value}))} placeholder="e.g. S. Kim" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-xs">
              {DOMAINS.map(domain => (
                <div key={domain.id}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-2">{domain.label} ({Math.round(domain.weight * 100)}%)</p>
                  <div className="space-y-1.5">
                    {domain.questions.map(q => (
                      <div key={q.id} className="flex items-start gap-3">
                        <span className="flex-1 text-gray-700 leading-snug">{q.text}</span>
                        <div className="flex gap-1 shrink-0">
                          {ANSWER_OPTS.filter(a => a !== '').map(ans => (
                            <button
                              key={ans}
                              onClick={() => setResponse(q.id, ans)}
                              className={cn(
                                'text-[10px] font-semibold px-2 py-0.5 rounded transition-all border',
                                form.responses[q.id] === ans
                                  ? ANSWER_COLORS[ans] + ' border-transparent ring-1 ring-offset-0 ring-blue-400'
                                  : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                              )}
                            >{ans}</button>
                          ))}
                          <button
                            onClick={() => setResponse(q.id, '')}
                            className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded border transition-all',
                              form.responses[q.id] === ''
                                ? 'bg-gray-100 text-gray-500 border-transparent ring-1 ring-blue-400'
                                : 'bg-white border-gray-200 text-gray-300 hover:border-gray-300'
                            )}
                          >N/A</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Notes</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white resize-none" placeholder="Key observations, exceptions, follow-up items…" />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-100 text-[11px] text-gray-500 bg-gray-50 shrink-0">
              Live score: {(() => {
                const s = scoreQuestionnaire(form.responses)
                const l = scoreLevel(s)
                return s !== null ? <span className={cn('font-bold', SCORE_COLORS[l])}>{s}% — {l}</span> : <span className="text-gray-400">Incomplete</span>
              })()}
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2 shrink-0">
              <button onClick={() => setModalOpen(false)} className="text-xs px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={save} className="flex items-center gap-1.5 text-xs px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Check className="w-3 h-3" />{editQs ? 'Save Changes' : 'Save Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
