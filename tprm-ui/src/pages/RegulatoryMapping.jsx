import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Framework definitions ────────────────────────────────────────────────────

const FRAMEWORKS = [
  {
    id:'dora', name:'DORA', fullName:'Digital Operational Resilience Act',
    jurisdiction:'EU', effectiveDate:'2025-01-17', status:'In Force',
    summary:'Mandatory ICT risk management, incident reporting, resilience testing, and third-party risk requirements for EU financial entities.',
    color:'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id:'gdpr', name:'GDPR', fullName:'General Data Protection Regulation',
    jurisdiction:'EU', effectiveDate:'2018-05-25', status:'In Force',
    summary:'Governs processing of personal data of EU data subjects. Imposes obligations on controllers and processors including third-party DPAs.',
    color:'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id:'pci', name:'PCI-DSS', fullName:'Payment Card Industry Data Security Standard v4.0',
    jurisdiction:'Global', effectiveDate:'2024-03-31', status:'In Force',
    summary:'Security standard for organisations that handle cardholder data. Req. 12.8 mandates third-party service provider management.',
    color:'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    id:'nis2', name:'NIS2', fullName:'Network and Information Security Directive 2',
    jurisdiction:'EU', effectiveDate:'2024-10-17', status:'In Force',
    summary:'Cyber and supply chain security obligations for essential and important entities across 18 sectors. Supersedes original NIS.',
    color:'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  {
    id:'sox', name:'SOX', fullName:'Sarbanes-Oxley Act (Section 404)',
    jurisdiction:'US', effectiveDate:'2002-07-30', status:'In Force',
    summary:'Internal controls over financial reporting for US-listed companies; applies to outsourced processes that affect financial statements.',
    color:'bg-green-100 text-green-800 border-green-200',
  },
  {
    id:'ccpa', name:'CCPA/CPRA', fullName:'California Consumer Privacy Act / California Privacy Rights Act',
    jurisdiction:'US-CA', effectiveDate:'2023-01-01', status:'In Force',
    summary:'Consumer privacy rights for California residents. Requires contracts with service providers processing personal information.',
    color:'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
]

// ─── Mapping: risk category → obligations ─────────────────────────────────────

const MAPPINGS = [
  // ── Cybersecurity ────────────────────────────────────────────────────────────
  {
    riskCategory:'Cybersecurity',
    framework:'dora',
    obligation:'ICT Third-Party Risk Management (Art. 28–30)',
    articleRef:'Art. 28',
    requirementSummary:'Maintain a register of ICT third-party service providers. Conduct pre-engagement risk assessment. Ensure contractual provisions on security, audit rights, sub-contractor disclosure.',
    keyControls:['Vendor contract review (DORA clauses)','Sub-processor register','Annual TLPT for critical vendors'],
    evidenceRequired:['Signed ICT contract with DORA clauses','Pre-engagement risk assessment report','Sub-processor register'],
    tprmPage:'fourthparty',
    tprmLabel:'Fourth-Party Registry',
  },
  {
    riskCategory:'Cybersecurity',
    framework:'nis2',
    obligation:'Supply Chain Security (Art. 21)',
    articleRef:'Art. 21(2)(d)',
    requirementSummary:'Entities must address supply chain security including security-related aspects of relationships between each entity and its direct suppliers and service providers.',
    keyControls:['Supplier security assessment','Contractual security clauses','Vulnerability disclosure process'],
    evidenceRequired:['Supplier security questionnaire','Penetration test reports','Patch management evidence'],
    tprmPage:'sca',
    tprmLabel:'Supplier Compliance',
  },
  {
    riskCategory:'Cybersecurity',
    framework:'pci',
    obligation:'Third-Party Service Provider Management (Req. 12.8)',
    articleRef:'Req. 12.8',
    requirementSummary:'Maintain list of all TPSPs with whom cardholder data is shared. Have a written agreement that includes acknowledgement of PCI-DSS responsibility.',
    keyControls:['TPSP register','Annual PCI-DSS status confirmation','Responsibility matrix (PCI DSS 3.2.1 Appendix B)'],
    evidenceRequired:['TPSP agreement with PCI acknowledgement','Annual PCI confirmation letter','RoC or SAQ from vendor'],
    tprmPage:'vendors',
    tprmLabel:'Vendor Criticality',
  },
  // ── Data Privacy ─────────────────────────────────────────────────────────────
  {
    riskCategory:'Data Privacy',
    framework:'gdpr',
    obligation:'Controller–Processor Agreement (Art. 28)',
    articleRef:'Art. 28',
    requirementSummary:'Processing by a processor shall be governed by a contract. Processor must not engage sub-processors without prior written authorisation. DPA must contain 8 minimum clauses.',
    keyControls:['Signed DPA with all Art.28 clauses','Sub-processor approval process','Data deletion / return process on termination'],
    evidenceRequired:['Signed DPA','Sub-processor list','Data deletion certificate'],
    tprmPage:'evidence',
    tprmLabel:'Evidence Register',
  },
  {
    riskCategory:'Data Privacy',
    framework:'gdpr',
    obligation:'Personal Data Breach Notification (Art. 33–34)',
    articleRef:'Art. 33',
    requirementSummary:'Controller must notify supervisory authority within 72 hours of becoming aware of a breach. Processor must notify controller without undue delay.',
    keyControls:['Vendor breach notification SLA (≤24h)','Incident intake process','Regulatory clock tracking'],
    evidenceRequired:['Vendor breach notification clause in contract','Incident log','Regulator notification record'],
    tprmPage:'incidents',
    tprmLabel:'Vendor Incidents',
  },
  {
    riskCategory:'Data Privacy',
    framework:'ccpa',
    obligation:'Service Provider Contract Requirements',
    articleRef:'§1798.140(ag)',
    requirementSummary:'Business must have a written contract with service providers prohibiting them from retaining, using, or disclosing personal information for any purpose other than the specified business purpose.',
    keyControls:['Service provider agreement with CCPA clauses','Opt-out mechanism for data sale','Annual review of service provider contracts'],
    evidenceRequired:['CCPA-compliant service provider agreement','Data inventory showing California resident data','Privacy notice'],
    tprmPage:'evidence',
    tprmLabel:'Evidence Register',
  },
  // ── Business Continuity ───────────────────────────────────────────────────────
  {
    riskCategory:'Business Continuity',
    framework:'dora',
    obligation:'ICT Business Continuity for Third Parties (Art. 28(5))',
    articleRef:'Art. 28(5)(c)',
    requirementSummary:'Contracts must include provisions on ICT service continuity, including RTO/RPO objectives. CIs must ensure exit strategies exist for critical ICT third parties.',
    keyControls:['BCP/DRP evidence collection from vendors','RTO/RPO clauses in contracts','Exit strategy documentation'],
    evidenceRequired:['Vendor BCP document','DRP test evidence','Contract RTO/RPO clauses'],
    tprmPage:'vendors',
    tprmLabel:'Vendor Criticality',
  },
  {
    riskCategory:'Business Continuity',
    framework:'nis2',
    obligation:'Business Continuity Management (Art. 21(2)(c))',
    articleRef:'Art. 21(2)(c)',
    requirementSummary:'Entities must implement business continuity management measures including backup management, disaster recovery, and crisis management for ICT suppliers.',
    keyControls:['Supplier BCP assessment','Annual BCP test exercise','Backup verification for outsourced systems'],
    evidenceRequired:['Supplier BCP/DRP documents','Test exercise report','Backup and recovery evidence'],
    tprmPage:'sca',
    tprmLabel:'Supplier Compliance',
  },
  // ── Financial Risk ────────────────────────────────────────────────────────────
  {
    riskCategory:'Financial Risk',
    framework:'sox',
    obligation:'SOX 404 — Outsourced Controls',
    articleRef:'Section 404',
    requirementSummary:'Where a company outsources a process that is relevant to its internal controls over financial reporting, the company must ensure those controls remain reliable (often via SOC 1 Type II report from vendor).',
    keyControls:['Annual SOC 1 Type II review','Complementary user entity controls (CUECs)','Control deficiency tracking'],
    evidenceRequired:['SOC 1 Type II report','CUEC matrix','Management assertion letter'],
    tprmPage:'evidence',
    tprmLabel:'Evidence Register',
  },
  {
    riskCategory:'Financial Risk',
    framework:'pci',
    obligation:'Annual PCI-DSS Compliance Confirmation (Req. 12.8.4)',
    articleRef:'Req. 12.8.4',
    requirementSummary:'Monitor the PCI-DSS compliance status of service providers at least annually. Document the monitoring process.',
    keyControls:['Annual PCI status letter from vendor','PCI compliance dashboard tracking','Contractual right to audit'],
    evidenceRequired:['Annual PCI status letter','Vendor RoC or SAQ','Monitoring log'],
    tprmPage:'evidence',
    tprmLabel:'Evidence Register',
  },
  // ── Concentration Risk ────────────────────────────────────────────────────────
  {
    riskCategory:'Concentration Risk',
    framework:'dora',
    obligation:'ICT Concentration Risk (Art. 29 + RTS)',
    articleRef:'Art. 29',
    requirementSummary:'Financial entities must identify and manage ICT concentration risk at both entity level and at EU system level. Regulators may deem certain ICT third parties critical.',
    keyControls:['Concentration risk assessment','Identification of Critical ICT Third-Party Providers (CITPPs)','Exit plans for concentrated dependencies'],
    evidenceRequired:['Concentration risk register','Dependency mapping','Exit strategy for critical ICT providers'],
    tprmPage:'fourthparty',
    tprmLabel:'Fourth-Party Registry',
  },
  // ── Operational Resilience ────────────────────────────────────────────────────
  {
    riskCategory:'Operational Resilience',
    framework:'dora',
    obligation:'TLPT / Penetration Testing (Art. 26)',
    articleRef:'Art. 26',
    requirementSummary:'Significant financial entities must conduct threat-led penetration testing (TLPT) at least every 3 years. Testing should cover critical ICT third-party providers where relevant.',
    keyControls:['TLPT programme for critical vendors','Annual penetration testing','Red team exercises'],
    evidenceRequired:['TLPT report','Penetration test report','Remediation evidence'],
    tprmPage:'sca',
    tprmLabel:'Supplier Compliance',
  },
  {
    riskCategory:'Operational Resilience',
    framework:'nis2',
    obligation:'Incident Reporting (Art. 23)',
    articleRef:'Art. 23',
    requirementSummary:'Significant incidents must be notified to authority within 24h (early warning) and 72h (full notification). Vendors who are NIS2 entities must report to their own authority; TPRM must track vendor incidents.',
    keyControls:['Vendor incident intake','72h regulatory clock tracking','Contractual incident notification SLA'],
    evidenceRequired:['Incident log','Regulator notification records','Vendor incident report'],
    tprmPage:'incidents',
    tprmLabel:'Vendor Incidents',
  },
]

const RISK_CATEGORIES = [...new Set(MAPPINGS.map(m => m.riskCategory))]
const FRAMEWORK_IDS   = FRAMEWORKS.map(f => f.id)

const FW_COLOR = Object.fromEntries(FRAMEWORKS.map(f => [f.id, f.color]))

export default function RegulatoryMapping() {
  const navigate = useNavigate()
  const [q, setQ]                     = useState('')
  const [filterCat, setFilterCat]     = useState('')
  const [filterFw, setFilterFw]       = useState('')
  const [expandedKey, setExpandedKey] = useState(null)
  const [view, setView]               = useState('list') // 'list' | 'matrix'

  const filtered = MAPPINGS.filter(m => {
    if (filterCat && m.riskCategory !== filterCat) return false
    if (filterFw  && m.framework    !== filterFw)  return false
    if (q) {
      const s = q.toLowerCase()
      if (!m.riskCategory.toLowerCase().includes(s) && !m.obligation.toLowerCase().includes(s) && !m.requirementSummary.toLowerCase().includes(s)) return false
    }
    return true
  })

  const byCategory = RISK_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = filtered.filter(m => m.riskCategory === cat)
    return acc
  }, {})

  // Matrix: rows = risk categories, cols = frameworks
  const matrixCoverage = (cat, fwId) => MAPPINGS.filter(m => m.riskCategory === cat && m.framework === fwId).length

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Regulatory Framework Mapping</h1>
          <p className="text-xs text-gray-400 mt-0.5">Risk category → regulatory obligation crosswalk — DORA · GDPR · PCI-DSS · NIS2 · SOX · CCPA</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('list')}   className={cn('text-xs px-3 py-1.5 rounded border', view==='list'   ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>List</button>
          <button onClick={() => setView('matrix')} className={cn('text-xs px-3 py-1.5 rounded border', view==='matrix' ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>Coverage Matrix</button>
        </div>
      </div>

      {/* Framework summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {FRAMEWORKS.map(fw => (
          <button
            key={fw.id}
            onClick={() => setFilterFw(v => v === fw.id ? '' : fw.id)}
            className={cn('rounded-lg border p-3 text-left transition-all hover:shadow-sm', filterFw === fw.id ? 'ring-2 ring-blue-400' : '', fw.color)}
          >
            <div className="text-xs font-bold">{fw.name}</div>
            <div className="text-[10px] opacity-75 mt-0.5 leading-tight">{fw.jurisdiction} · {fw.status}</div>
            <div className="text-[10px] mt-1.5 opacity-60">{MAPPINGS.filter(m => m.framework === fw.id).length} obligations mapped</div>
          </button>
        ))}
      </div>

      {view === 'matrix' ? (
        /* ── Coverage matrix ── */
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-40">Risk Category</th>
                {FRAMEWORKS.map(fw => (
                  <th key={fw.id} className="px-3 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    <span className={cn('px-2 py-0.5 rounded border text-[9px]', fw.color)}>{fw.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RISK_CATEGORIES.map(cat => (
                <tr key={cat} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-700">{cat}</td>
                  {FRAMEWORKS.map(fw => {
                    const count = matrixCoverage(cat, fw.id)
                    return (
                      <td key={fw.id} className="px-3 py-3 text-center">
                        {count > 0
                          ? <button
                              onClick={() => { setFilterCat(cat); setFilterFw(fw.id); setView('list') }}
                              className={cn('w-7 h-7 rounded-full text-xs font-bold inline-flex items-center justify-center', fw.color, 'hover:opacity-80')}
                            >{count}</button>
                          : <span className="text-gray-200">—</span>
                        }
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-gray-50 text-[10px] text-gray-400">Click a number to jump to that category + framework in list view</div>
        </div>
      ) : (
        /* ── List view ── */
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400" placeholder="Search obligations…" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">All Risk Categories</option>
              {RISK_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400" value={filterFw} onChange={e => setFilterFw(e.target.value)}>
              <option value="">All Frameworks</option>
              {FRAMEWORKS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            {(q || filterCat || filterFw) && <button onClick={() => { setQ(''); setFilterCat(''); setFilterFw('') }} className="text-xs text-blue-500 hover:text-blue-700 px-2">Clear</button>}
          </div>

          {/* Grouped by risk category */}
          <div className="space-y-3">
            {RISK_CATEGORIES.filter(cat => (byCategory[cat]?.length || 0) > 0).map(cat => (
              <div key={cat} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Category header */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">{cat}</span>
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{byCategory[cat].length} obligation{byCategory[cat].length > 1 ? 's' : ''}</span>
                  </div>
                  <button onClick={() => navigate('/risks', { state: { filterCat: cat } })} className="text-[10px] text-blue-500 hover:underline">View risks →</button>
                </div>

                {/* Obligations */}
                <div className="divide-y divide-gray-50">
                  {byCategory[cat].map(m => {
                    const fw    = FRAMEWORKS.find(f => f.id === m.framework)
                    const key   = `${cat}-${m.framework}-${m.articleRef}`
                    const isOpen = expandedKey === key
                    return (
                      <div key={key}>
                        <button
                          className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
                          onClick={() => setExpandedKey(v => v === key ? null : key)}
                        >
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 mt-0.5', fw?.color || 'bg-gray-100 text-gray-500 border-gray-200')}>{fw?.name}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-gray-800">{m.obligation}</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">{m.articleRef}</div>
                          </div>
                          {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />}
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-4 bg-gray-50/50">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                              <div className="lg:col-span-2">
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Requirement</p>
                                <p className="text-gray-700 leading-relaxed mb-3">{m.requirementSummary}</p>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Key Controls</p>
                                <ul className="space-y-0.5 mb-3">
                                  {m.keyControls.map(c => <li key={c} className="flex gap-1.5 text-gray-700"><span className="text-green-500 mt-0.5">✓</span>{c}</li>)}
                                </ul>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Evidence Required</p>
                                <ul className="space-y-0.5">
                                  {m.evidenceRequired.map(e => <li key={e} className="flex gap-1.5 text-gray-700"><span className="text-blue-400 mt-0.5">·</span>{e}</li>)}
                                </ul>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Framework</p>
                                  <div className={cn('text-xs px-2 py-1 rounded border inline-block font-semibold', fw?.color || '')}>{fw?.name} — {fw?.fullName}</div>
                                  <p className="text-[11px] text-gray-500 mt-1">{fw?.summary}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Platform Link</p>
                                  <button
                                    onClick={() => navigate('/' + m.tprmPage)}
                                    className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline"
                                  >
                                    <ExternalLink className="w-3 h-3" />{m.tprmLabel}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-8 text-center text-xs text-gray-400">No obligations match filters</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
