import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── PwC Supplier Compliance Assessment — Salesforce · August 2026 ────────────
// Source: Supplier Compliance Assessment Comments 08-12-2026.xlsx
// 18 suppliers · 91 T&C terms assessed · 42 non-compliant · 49 compliant

const AREA_MAP = {
  'Protection of confidential info':      'Data Protection & Privacy',
  'Protection of personal info':          'Data Protection & Privacy',
  'Data protection laws':                 'Data Protection & Privacy',
  'Confidentiality of protected info':    'Data Protection & Privacy',
  'Data security standards':              'Data Protection & Privacy',
  'Data privacy compliance':              'Data Protection & Privacy',
  'Data privacy & security':              'Data Protection & Privacy',
  'Data processing standards':            'Data Protection & Privacy',
  'Data privacy standards':               'Data Protection & Privacy',
  'Protection of customer data':          'Data Protection & Privacy',
  'Confidentiality obligations':          'Data Protection & Privacy',
  'Sensitive info guidelines':            'Data Protection & Privacy',
  'Protection of sensitive info':         'Data Protection & Privacy',
  'Data retention & destruction':         'Data Protection & Privacy',
  'Authorized processing':                'Data Protection & Privacy',
  'Maintain privacy certifications':      'Data Protection & Privacy',
  'SFDC consent to subcontract':          'Subcontractor Management',
  'Subcontractor management':             'Subcontractor Management',
  'Subcontractor flow-down terms':        'Subcontractor Management',
  'Subcontractor requirements':           'Subcontractor Management',
  'Subcontractor oversight':              'Subcontractor Management',
  'Subcontractor approval':               'Subcontractor Management',
  'Subcontractor privacy flow-down':      'Subcontractor Management',
  'Immigration compliance':               'Immigration & Labor',
  'Immigration law compliance':           'Immigration & Labor',
  'Equal opportunity compliance':         'Immigration & Labor',
  'Equal opportunity laws':               'Immigration & Labor',
  'Code of Conduct adherence':            'Immigration & Labor',
  'Insurer AM Best ratings':              'Insurance & Liability',
  'Insurance coverage':                   'Insurance & Liability',
  'Insurance requirements':               'Insurance & Liability',
  'Subcontractor insurance':              'Insurance & Liability',
  'Anti-corruption compliance':           'Anti-Corruption & Ethics',
  'Anti-bribery compliance':              'Anti-Corruption & Ethics',
  'Anti-bribery & unlawful payments':     'Anti-Corruption & Ethics',
  'Supplier conflict of interest':        'Anti-Corruption & Ethics',
  'Telecom laws compliance':              'Regulatory & Standards',
  'Telecom regulations':                  'Regulatory & Standards',
  'Export control compliance':            'Regulatory & Standards',
  'Export control regulations':           'Regulatory & Standards',
  'C-TPAT security standards':            'Regulatory & Standards',
  'Disaster recovery / BC plan':          'Business Continuity',
  'Emergency obligations':                'Business Continuity',
  'Service performance metrics':          'Business Continuity',
  'Sustainability policy':                'Sustainability & Conduct',
  'SOC 2 / ISO certifications':           'Data Protection & Privacy',
}

function area(term) { return AREA_MAP[term] || 'Other' }

// All 91 assessment rows. compliant: true = Compliant, false = Non-compliant
const ALL_TERMS = [
  // American Express — Very High
  {id:'a1',  vendor:'American Express',      risk:'Very High', term:'Protection of confidential info',   compliant:false, finding:'Missing supporting evidence/documentation.',                    sfdc:'Is this Very High because there was no supporting evidence or as per the Risk rating this is Very High because, it has a Critical Impact, defined as below:\nIf the risk is exploited, this would cause catastrophic adverse effects on organizational operations, brand value, market share, market cap, profitability, and/or individuals', pwc:'Suppliers were requested to substantiate the policies, processes, controls, etc. they have in place to demonstrate compliance with the term being tested. If they were unable to provide evidence or did not provide evidence they were scored as non-compliant because their representations could not be validated. Amex\'s lack of evidence resulted in non-compliance being assessed for all terms tested.\n\nAt the onset of the assessment Salesforce discussed that supplier protection of confidential information was of particular concern due to the impact leakage of information could have on the company. Amex was assessed as very high because Salesforce considers protection of confidential information to be of concern and there was non-compliance with multiple other terms that could have a noteworthy impact on Salesforce.'},
  {id:'a2',  vendor:'American Express',      risk:'Very High', term:'Protection of personal info',       compliant:false, finding:'Missing supporting evidence/documentation.',                    sfdc:'', pwc:''},
  {id:'a3',  vendor:'American Express',      risk:'Very High', term:'Data protection laws',              compliant:false, finding:'Missing supporting evidence/documentation.',                    sfdc:'', pwc:''},
  {id:'a4',  vendor:'American Express',      risk:'Very High', term:'SFDC consent to subcontract',       compliant:false, finding:'Missing subcontractor approval documentation.',                 sfdc:'', pwc:''},
  // Bandwidth — High
  {id:'b1',  vendor:'Bandwidth',             risk:'High',      term:'Confidentiality of protected info', compliant:false, finding:'Missing supporting evidence.',                                 sfdc:'Again here trying to understand the logic of risk rating being High. Trying to rationalize this with the ratings in Appendix. Because missing evidence does not mean its at risk or not at risk, but non compliance definitely is a risk.', pwc:'Suppliers were requested to substantiate the policies, processes, controls, etc. they have in place to demonstrate compliance with the term being tested. If they were unable to provide evidence or did not provide evidence they were scored as non-compliant because their representations could not be validated. Bandwidth failed to provide supporting evidence for confidentiality of protected information which is why it was assessed as non-compliant.\n\nBandwidth was assessed as high because they were not compliant with one area significant to Salesforce (confidentiality of protected information) and they were not delivering the required SLA/performance reports so Salesforce was unable to monitor the metrics it sought.'},
  {id:'b2',  vendor:'Bandwidth',             risk:'High',      term:'Service performance metrics',       compliant:false, finding:'Failed to deliver monthly SLA/performance reports.',            sfdc:'', pwc:''},
  {id:'b3',  vendor:'Bandwidth',             risk:'High',      term:'Telecom laws compliance',           compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'b4',  vendor:'Bandwidth',             risk:'High',      term:'Data security standards',           compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'b5',  vendor:'Bandwidth',             risk:'High',      term:'Emergency obligations',             compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  // Box — Low
  {id:'bx1', vendor:'Box',                   risk:'Low',       term:'Insurer AM Best ratings',           compliant:false, finding:'Missing proof of required AM Best insurance ratings.',         sfdc:'', pwc:''},
  {id:'bx2', vendor:'Box',                   risk:'Low',       term:'Protection of confidential info',   compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'bx3', vendor:'Box',                   risk:'Low',       term:'Data privacy compliance',           compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'bx4', vendor:'Box',                   risk:'Low',       term:'SOC 2 / ISO certifications',        compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'bx5', vendor:'Box',                   risk:'Low',       term:'Subcontractor management',          compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  // Cognizant — No Risk
  {id:'c1',  vendor:'Cognizant',             risk:'No Risk',   term:'Protection of confidential info',   compliant:true,  finding:'Passed all tested terms.',                                    sfdc:'What do we mean by "No Risk"?? its either "Minimal" as defined by you all or something in the risk ranking, How is this "No Risk"?', pwc:'The rating indicates the risk to Salesforce based on assessed non-compliance. The supplier was found to be compliant with the T&Cs therefore there is no risk to Salesforce resulting from non-compliance.'},
  {id:'c2',  vendor:'Cognizant',             risk:'No Risk',   term:'Data privacy & security',           compliant:true,  finding:'Passed all tested terms.',                                    sfdc:'', pwc:''},
  {id:'c3',  vendor:'Cognizant',             risk:'No Risk',   term:'Subcontractor flow-down terms',     compliant:true,  finding:'Passed all tested terms.',                                    sfdc:'', pwc:''},
  {id:'c4',  vendor:'Cognizant',             risk:'No Risk',   term:'Equal opportunity compliance',      compliant:true,  finding:'Passed all tested terms.',                                    sfdc:'', pwc:''},
  {id:'c5',  vendor:'Cognizant',             risk:'No Risk',   term:'Anti-corruption compliance',        compliant:true,  finding:'Passed all tested terms.',                                    sfdc:'', pwc:''},
  // CrowdStrike — Moderate
  {id:'cs1', vendor:'CrowdStrike',           risk:'Moderate',  term:'Protection of confidential info',   compliant:false, finding:'Missing handbook excerpts & incident policies.',               sfdc:'Same question here, is it moderate of 3 areas of missing information and 2 are in compliance.', pwc:'Suppliers were requested to substantiate the policies, processes, controls, etc. they have in place to demonstrate compliance with the term being tested. If they were unable to provide evidence or did not provide evidence they were scored as non-compliant because their representations could not be validated. CrowdStrike failed to provide supporting evidence for several terms which resulted in non-compliance being assessed.\n\nModerate risk was assessed because one area of importance to Salesforce was assessed as non-compliant and the other two areas of non-compliance were less likely to have a meaningful impact on Salesforce.'},
  {id:'cs2', vendor:'CrowdStrike',           risk:'Moderate',  term:'Immigration compliance',            compliant:false, finding:'Missing Form I-9 / E-Verify documentation.',                  sfdc:'', pwc:''},
  {id:'cs3', vendor:'CrowdStrike',           risk:'Moderate',  term:'Insurance coverage',                compliant:false, finding:'Missing cyber liability / tech E&O insurance proof.',         sfdc:'', pwc:''},
  {id:'cs4', vendor:'CrowdStrike',           risk:'Moderate',  term:'Data processing standards',         compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'cs5', vendor:'CrowdStrike',           risk:'Moderate',  term:'Subcontractor oversight',           compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  // Hakuhodo — Low
  {id:'h1',  vendor:'Hakuhodo',              risk:'Low',       term:'Subcontractor requirements',        compliant:false, finding:'Missing flow-down of SFDC terms to subcontractors.',           sfdc:'Here also 2 areas of missing information by the risk is low. Understand this might be subjective, but for the criteria it is an assumption that the risk is low. So my question is, are you assessing the criteria the vendor was assessed for and Risk needs to be provided for each criteria, so if there are 5 criterias with different risk the average or highest risk is considered the risk of the vendor?', pwc:'Suppliers were requested to substantiate the policies, processes, controls, etc. they have in place to demonstrate compliance with the term being tested. If they were unable to provide evidence or did not provide evidence they were scored as non-compliant because their representations could not be validated. Hakuhodo failed to provide supporting evidence for several terms which resulted in non-compliance being assessed.\n\nThe supplier\'s non-compliance with the two terms were likely to have minimal consequence on Salesforce. If there are multiple areas of non-compliance the risk rating will at a minimum be high risk rating of any one contract terms. Multiple areas of non-compliance with potentially impactful terms will elevate the overall risk rating as in the case with Amex.'},
  {id:'h2',  vendor:'Hakuhodo',              risk:'Low',       term:'Insurance requirements',            compliant:false, finding:'Missing Industrial Accident Compensation Insurance.',          sfdc:'', pwc:''},
  {id:'h3',  vendor:'Hakuhodo',              risk:'Low',       term:'Protection of confidential info',   compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'h4',  vendor:'Hakuhodo',              risk:'Low',       term:'Data privacy standards',            compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'h5',  vendor:'Hakuhodo',              risk:'Low',       term:'Anti-corruption compliance',        compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  // HERE — Low
  {id:'he1', vendor:'HERE',                  risk:'Low',       term:'Subcontractor insurance',           compliant:false, finding:'Missing proof of subcontractor insurance limits.',             sfdc:'', pwc:''},
  {id:'he2', vendor:'HERE',                  risk:'Low',       term:'Insurer AM Best ratings',           compliant:false, finding:'Missing evidence of insurer AM Best rating.',                 sfdc:'', pwc:''},
  {id:'he3', vendor:'HERE',                  risk:'Low',       term:'Protection of confidential info',   compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'he4', vendor:'HERE',                  risk:'Low',       term:'Data protection standards',         compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'he5', vendor:'HERE',                  risk:'Low',       term:'Export control compliance',         compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  // Illumio — No Risk
  {id:'il1', vendor:'Illumio',               risk:'No Risk',   term:'Protection of confidential info',   compliant:true,  finding:'Passed all tested terms.',                                    sfdc:'Same as the question above, seems like someone created this doc and no one reviewed it or paid attention to what was being said.', pwc:'The rating indicates the risk to Salesforce based on assessed non-compliance. The supplier was found to be compliant with the T&Cs therefore there is no risk to Salesforce resulting from non-compliance.'},
  {id:'il2', vendor:'Illumio',               risk:'No Risk',   term:'Data privacy & security',           compliant:true,  finding:'Passed all tested terms.',                                    sfdc:'', pwc:''},
  {id:'il3', vendor:'Illumio',               risk:'No Risk',   term:'Subcontractor management',          compliant:true,  finding:'Passed all tested terms.',                                    sfdc:'', pwc:''},
  {id:'il4', vendor:'Illumio',               risk:'No Risk',   term:'Anti-bribery compliance',           compliant:true,  finding:'Passed all tested terms.',                                    sfdc:'', pwc:''},
  {id:'il5', vendor:'Illumio',               risk:'No Risk',   term:'Immigration compliance',            compliant:true,  finding:'Passed all tested terms.',                                    sfdc:'', pwc:''},
  // Incredible Management — High
  {id:'im1', vendor:'Incredible Management', risk:'High',      term:'Sensitive info guidelines',         compliant:false, finding:'Failed to align with SFDC security requirements.',             sfdc:'', pwc:''},
  {id:'im2', vendor:'Incredible Management', risk:'High',      term:'Immigration law compliance',        compliant:false, finding:'Unable to provide supporting evidence.',                       sfdc:'', pwc:''},
  {id:'im3', vendor:'Incredible Management', risk:'High',      term:'Protection of sensitive info',      compliant:false, finding:'Missing privacy training & access revocation logs.',           sfdc:'', pwc:''},
  {id:'im4', vendor:'Incredible Management', risk:'High',      term:'Confidentiality obligations',       compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'im5', vendor:'Incredible Management', risk:'High',      term:'Subcontractor approval',            compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  // Infosys — High
  {id:'in1', vendor:'Infosys',               risk:'High',      term:'Protection of sensitive info',      compliant:false, finding:'Missing supporting evidence.',                                 sfdc:'', pwc:''},
  {id:'in2', vendor:'Infosys',               risk:'High',      term:'SFDC consent to subcontract',       compliant:false, finding:'Missing supporting evidence.',                                 sfdc:'', pwc:''},
  {id:'in3', vendor:'Infosys',               risk:'High',      term:'Immigration compliance',            compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'in4', vendor:'Infosys',               risk:'High',      term:'Anti-corruption compliance',        compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'in5', vendor:'Infosys',               risk:'High',      term:'Insurance coverage',                compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  // Insight Direct — Low
  {id:'id1', vendor:'Insight Direct',        risk:'Low',       term:'C-TPAT security standards',         compliant:false, finding:'Stated C-TPAT regulations do not apply.',                     sfdc:'', pwc:''},
  {id:'id2', vendor:'Insight Direct',        risk:'Low',       term:'Protection of confidential info',   compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'id3', vendor:'Insight Direct',        risk:'Low',       term:'Data privacy compliance',           compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'id4', vendor:'Insight Direct',        risk:'Low',       term:'Subcontractor management',          compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'id5', vendor:'Insight Direct',        risk:'Low',       term:'Equal opportunity laws',            compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  // Palo Alto Networks — High
  {id:'pa1', vendor:'Palo Alto Networks',    risk:'High',      term:'Protection of confidential info',   compliant:false, finding:'Missing supporting evidence.',                                 sfdc:'This also has all 5 criteria and missing supporting evidence, so how is this only High and Amex is Very High?', pwc:'Suppliers were requested to substantiate the policies, processes, controls, etc. they have in place to demonstrate compliance with the term being tested. If they were unable to provide evidence or did not provide evidence they were scored as non-compliant because their representations could not be validated. Palo Alto Network\'s lack of evidence resulted in non-compliance being assessed for all terms tested.\n\nAt the onset of the assessment Salesforce discussed that supplier protection of confidential information was of particular concern due to the impact information leakage could have on the company. Palo Alto Networks was assessed as high because they had non-compliance with an area significant to Salesforce and the combination of the other four instances of non-compliance some of which could have meaningful impact to Salesforce. Amex had multiple instances of non-compliance with terms similar to protection of confidential information (protection of personal info and data protection laws) which elevated the overall risk to very high.'},
  {id:'pa2', vendor:'Palo Alto Networks',    risk:'High',      term:'Immigration compliance',            compliant:false, finding:'Missing supporting evidence.',                                 sfdc:'', pwc:''},
  {id:'pa3', vendor:'Palo Alto Networks',    risk:'High',      term:'Maintain privacy certifications',   compliant:false, finding:'Missing SOC 2 Type 2 / ISO 27001 audit reports.',              sfdc:'', pwc:''},
  {id:'pa4', vendor:'Palo Alto Networks',    risk:'High',      term:'Anti-bribery & unlawful payments',  compliant:false, finding:'Missing FCPA / anti-bribery policies.',                        sfdc:'', pwc:''},
  {id:'pa5', vendor:'Palo Alto Networks',    risk:'High',      term:'Authorized processing',             compliant:false, finding:'Missing supporting evidence.',                                 sfdc:'', pwc:''},
  // Red Hat — Moderate
  {id:'rh1', vendor:'Red Hat',               risk:'Moderate',  term:'Protection of confidential info',   compliant:false, finding:'Missing security breach notification protocols.',               sfdc:'', pwc:''},
  {id:'rh2', vendor:'Red Hat',               risk:'Moderate',  term:'Immigration compliance',            compliant:false, finding:'Missing process for U.S. service authorization & E-Verify.',  sfdc:'', pwc:''},
  {id:'rh3', vendor:'Red Hat',               risk:'Moderate',  term:'Data privacy standards',            compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'rh4', vendor:'Red Hat',               risk:'Moderate',  term:'Subcontractor oversight',           compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'rh5', vendor:'Red Hat',               risk:'Moderate',  term:'Anti-corruption laws',              compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  // Sinch Interconnect — High
  {id:'si1', vendor:'Sinch Interconnect',    risk:'High',      term:'Export control regulations',        compliant:false, finding:'Missing evidence of export screening systems.',                sfdc:'', pwc:''},
  {id:'si2', vendor:'Sinch Interconnect',    risk:'High',      term:'Protection of customer data',       compliant:false, finding:'Missing supporting evidence.',                                 sfdc:'', pwc:''},
  {id:'si3', vendor:'Sinch Interconnect',    risk:'High',      term:'Telecom regulations',               compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'si4', vendor:'Sinch Interconnect',    risk:'High',      term:'Confidentiality obligations',       compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'si5', vendor:'Sinch Interconnect',    risk:'High',      term:'Insurance requirements',            compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  // Sinch Sweden — High
  {id:'ss1', vendor:'Sinch Sweden',          risk:'High',      term:'Export control regulations',        compliant:false, finding:'Missing evidence of export screening systems.',                sfdc:'', pwc:''},
  {id:'ss2', vendor:'Sinch Sweden',          risk:'High',      term:'Protection of customer data',       compliant:false, finding:'Missing supporting evidence.',                                 sfdc:'', pwc:''},
  {id:'ss3', vendor:'Sinch Sweden',          risk:'High',      term:'Equal opportunity laws',            compliant:false, finding:'Missing supporting evidence.',                                 sfdc:'', pwc:''},
  {id:'ss4', vendor:'Sinch Sweden',          risk:'High',      term:'Anti-corruption laws',              compliant:false, finding:'Missing supporting evidence.',                                 sfdc:'', pwc:''},
  {id:'ss5', vendor:'Sinch Sweden',          risk:'High',      term:'Confidentiality obligations',       compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  // Sparks Exhibits — High
  {id:'sp1', vendor:'Sparks Exhibits',       risk:'High',      term:'Protection of confidential info',   compliant:false, finding:'Missing supporting evidence.',                                 sfdc:'Here 4 areas are compliant and one is missing supporting evidence, how do we rationalize this to a High rating?', pwc:'Suppliers were requested to substantiate the policies, processes, controls, etc. they have in place to demonstrate compliance with the term being tested. If they were unable to provide evidence or did not provide evidence they were scored as non-compliant because their representations could not be validated.\n\nAt the onset of the assessment Salesforce discussed that supplier protection of confidential information was of particular concern due to the impact information leakage could have on the company. Sparks was assessed as high because they had non-compliance with protection of confidential information that Salesforce considers to be of noteworthy concern.'},
  {id:'sp2', vendor:'Sparks Exhibits',       risk:'High',      term:'Data security standards',           compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'sp3', vendor:'Sparks Exhibits',       risk:'High',      term:'Immigration compliance',            compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'sp4', vendor:'Sparks Exhibits',       risk:'High',      term:'Insurance coverage',                compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'sp5', vendor:'Sparks Exhibits',       risk:'High',      term:'Subcontractor management',          compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  // Tech Mahindra — Low
  {id:'tm1', vendor:'Tech Mahindra',         risk:'Low',       term:'Supplier conflict of interest',     compliant:false, finding:'Missing conflict check verification records.',                 sfdc:'', pwc:''},
  {id:'tm2', vendor:'Tech Mahindra',         risk:'Low',       term:'Disaster recovery / BC plan',       compliant:false, finding:'Failed to supply formal DR / BC documentation.',              sfdc:'', pwc:''},
  {id:'tm3', vendor:'Tech Mahindra',         risk:'Low',       term:'Protection of confidential info',   compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'tm4', vendor:'Tech Mahindra',         risk:'Low',       term:'Immigration compliance',            compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  {id:'tm5', vendor:'Tech Mahindra',         risk:'Low',       term:'Insurance requirements',            compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
  // Zuora — Low
  {id:'z1',  vendor:'Zuora',                 risk:'Low',       term:'Immigration compliance',            compliant:false, finding:'Missing hiring process details & work-authorization proof.',   sfdc:'', pwc:''},
  {id:'z2',  vendor:'Zuora',                 risk:'Low',       term:'Equal opportunity laws',            compliant:false, finding:'Missing proof of compliance with ADA provisions.',             sfdc:'', pwc:''},
  {id:'z3',  vendor:'Zuora',                 risk:'Low',       term:'Data retention & destruction',      compliant:false, finding:'Lacks formal data retention policy matching SFDC timelines.',  sfdc:'', pwc:''},
  {id:'z4',  vendor:'Zuora',                 risk:'Low',       term:'Subcontractor privacy flow-down',   compliant:false, finding:'Failed to demonstrate data privacy flow-down.',                sfdc:'', pwc:''},
  {id:'z5',  vendor:'Zuora',                 risk:'Low',       term:'Sustainability policy',             compliant:false, finding:'Lacks written environmental sustainability policy.',            sfdc:'', pwc:''},
  {id:'z6',  vendor:'Zuora',                 risk:'Low',       term:'Code of Conduct adherence',         compliant:false, finding:'Has not signed or adopted SFDC Code of Conduct.',              sfdc:'', pwc:''},
  {id:'z7',  vendor:'Zuora',                 risk:'Low',       term:'Protection of confidential info',   compliant:true,  finding:'Meets contractual compliance requirements.',                   sfdc:'', pwc:''},
]

// ─── Derived aggregates ───────────────────────────────────────────────────────

const RISK_ORDER = { 'Very High':0, 'High':1, 'Moderate':2, 'Low':3, 'No Risk':4 }

const SUPPLIERS = [...new Set(ALL_TERMS.map(t => t.vendor))].map(vendor => {
  const terms     = ALL_TERMS.filter(t => t.vendor === vendor)
  const risk      = terms[0].risk
  const ncCount   = terms.filter(t => !t.compliant).length
  const total     = terms.length
  return { vendor, risk, total, ncCount, compliant: total - ncCount }
}).sort((a, b) => (RISK_ORDER[a.risk] ?? 99) - (RISK_ORDER[b.risk] ?? 99))

const AREAS_ALL = [...new Set(Object.values(AREA_MAP))]
const SCA_AREAS = AREAS_ALL.map(a => {
  const terms     = ALL_TERMS.filter(t => area(t.term) === a)
  const compliant = terms.filter(t => t.compliant).length
  return { area: a, total: terms.length, compliant, nonCompliant: terms.length - compliant }
}).filter(a => a.total > 0).sort((a, b) => b.nonCompliant - a.nonCompliant)

const TOTAL_NC    = ALL_TERMS.filter(t => !t.compliant).length
const TOTAL_TERMS = ALL_TERMS.length

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_BADGE = {
  'Very High': 'bg-red-100 text-red-700 border-red-200',
  'High':      'bg-orange-100 text-orange-700 border-orange-200',
  'Moderate':  'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Low':       'bg-green-100 text-green-700 border-green-200',
  'No Risk':   'bg-gray-100 text-gray-500 border-gray-200',
}
const RISK_KPI_BG = {
  'Very High': 'bg-red-50 border-red-200 hover:bg-red-100',
  'High':      'bg-orange-50 border-orange-200 hover:bg-orange-100',
  'Moderate':  'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  'Low':       'bg-green-50 border-green-200 hover:bg-green-100',
  'No Risk':   'bg-gray-50 border-gray-200 hover:bg-gray-100',
}
const RISK_KPI_TEXT = {
  'Very High': 'text-red-600',
  'High':      'text-orange-500',
  'Moderate':  'text-yellow-600',
  'Low':       'text-green-600',
  'No Risk':   'text-gray-500',
}

function RiskBadge({ risk }) {
  return <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap', RISK_BADGE[risk] ?? 'bg-gray-100 text-gray-500 border-gray-200')}>{risk}</span>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SCA() {
  const navigate = useNavigate()
  const [filterRisk,    setFilterRisk]    = useState('')
  const [filterArea,    setFilterArea]    = useState('')
  const [filterVendor,  setFilterVendor]  = useState('')
  const [filterCompliant, setFilterCompliant] = useState('all') // 'all' | 'nc' | 'c'
  const [search,        setSearch]        = useState('')
  const [expandedId,    setExpandedId]    = useState(null)
  const [expandedVendor, setExpandedVendor] = useState(null)
  const [tab, setTab]                     = useState('findings') // 'findings' | 'suppliers' | 'areas'

  const findings = ALL_TERMS
    .filter(t => !filterRisk    || t.risk === filterRisk)
    .filter(t => !filterArea    || area(t.term) === filterArea)
    .filter(t => !filterVendor  || t.vendor === filterVendor)
    .filter(t => filterCompliant === 'nc' ? !t.compliant : filterCompliant === 'c' ? t.compliant : true)
    .filter(t => !search        || t.vendor.toLowerCase().includes(search.toLowerCase()) || t.term.toLowerCase().includes(search.toLowerCase()) || t.finding.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const rd = (RISK_ORDER[a.risk] ?? 99) - (RISK_ORDER[b.risk] ?? 99)
      if (rd !== 0) return rd
      if (!a.compliant && b.compliant) return -1
      if (a.compliant && !b.compliant) return 1
      return 0
    })

  const hasFilters = filterRisk || filterArea || filterVendor || filterCompliant !== 'all' || search

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h1 className="text-lg font-semibold text-gray-800">Supplier Compliance Audit</h1>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">PwC · August 2026 · 18 suppliers · 91 T&C terms assessed</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Non-Compliant Terms</div>
          <div className="text-2xl font-bold text-red-600">{TOTAL_NC} <span className="text-base font-normal text-gray-400">/ {TOTAL_TERMS}</span></div>
          <div className="text-[10px] text-gray-400">{Math.round((TOTAL_NC / TOTAL_TERMS) * 100)}% non-compliant rate</div>
        </div>
      </div>

      {/* KPI tiles by risk level */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {['Very High','High','Moderate','Low','No Risk'].map(r => {
          const count = SUPPLIERS.filter(s => s.risk === r).length
          return (
            <button
              key={r}
              onClick={() => setFilterRisk(filterRisk === r ? '' : r)}
              className={cn('border rounded-lg p-3 text-left transition-all', RISK_KPI_BG[r], filterRisk === r && 'ring-2 ring-blue-400')}
            >
              <div className={cn('text-2xl font-bold', RISK_KPI_TEXT[r])}>{count}</div>
              <div className="text-[10px] text-gray-600 mt-0.5 font-medium">{r}</div>
              <div className="text-[10px] text-gray-400">supplier{count !== 1 ? 's' : ''}</div>
            </button>
          )
        })}
      </div>

      {/* Alert for Very High */}
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-gray-700 flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
        <span>
          <strong className="text-red-700">American Express rated Very High</strong> — 4 non-compliant terms including protection of confidential info, personal info, data protection laws, and subcontract consent. All evidence requests were unanswered.{' '}
          <strong className="text-orange-700">7 suppliers rated High</strong>: Bandwidth, Incredible Management, Infosys, Palo Alto Networks, Sinch Interconnect, Sinch Sweden, Sparks Exhibits.
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {[['findings','All Terms'], ['suppliers','By Supplier'], ['areas','By Area']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'text-xs px-4 py-2 font-medium border-b-2 transition-colors -mb-px',
              tab === key ? 'border-[#0176d3] text-[#0176d3]' : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >{label}</button>
        ))}
      </div>

      {/* ── By Supplier tab ── */}
      {tab === 'suppliers' && (
        <div className="space-y-2">
          {SUPPLIERS.filter(s => !filterRisk || s.risk === filterRisk).map(s => {
            const terms   = ALL_TERMS.filter(t => t.vendor === s.vendor)
            const ncTerms = terms.filter(t => !t.compliant)
            const open    = expandedVendor === s.vendor
            const pct     = Math.round((s.compliant / s.total) * 100)
            return (
              <div key={s.vendor} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <button
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedVendor(v => v === s.vendor ? null : s.vendor)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-800">{s.vendor}</span>
                      <RiskBadge risk={s.risk} />
                      {ncTerms.length > 0
                        ? <span className="text-[10px] text-red-600 font-semibold">{ncTerms.length} non-compliant term{ncTerms.length !== 1 ? 's' : ''}</span>
                        : <span className="text-[10px] text-green-600 font-semibold">Fully compliant</span>
                      }
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 max-w-[200px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? '#22c55e' : pct >= 60 ? '#eab308' : '#ef4444' }} />
                      </div>
                      <span className="text-[10px] text-gray-500">{s.compliant}/{s.total} compliant ({pct}%)</span>
                    </div>
                  </div>
                  {open ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>

                {open && (
                  <div className="border-t border-gray-100 bg-gray-50/30">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">T&C Term</th>
                          <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Area</th>
                          <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Finding</th>
                          <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {terms.map(t => (
                          <tr key={t.id} className={cn('border-b border-gray-50', !t.compliant && 'bg-red-50/40')}>
                            <td className="px-4 py-2 text-gray-700 font-medium">{t.term}</td>
                            <td className="px-4 py-2 text-gray-500">{area(t.term)}</td>
                            <td className="px-4 py-2 text-gray-600">{t.finding}</td>
                            <td className="px-4 py-2">
                              <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', t.compliant ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                                {t.compliant ? 'Compliant' : 'Non-compliant'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* SFDC / PwC notes for the first term that has them */}
                    {(() => {
                      const noted = terms.find(t => t.sfdc || t.pwc)
                      if (!noted) return null
                      return (
                        <div className="px-4 py-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {noted.sfdc && (
                            <div className="bg-white border border-blue-100 rounded p-3">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 mb-1">SFDC Note</p>
                              <p className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-line">{noted.sfdc}</p>
                            </div>
                          )}
                          {noted.pwc && (
                            <div className="bg-white border border-purple-100 rounded p-3">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-500 mb-1">PwC Comment</p>
                              <p className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-line">{noted.pwc}</p>
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
        </div>
      )}

      {/* ── By Area tab ── */}
      {tab === 'areas' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Area','Total Terms','Compliant','Non-Compliant','Compliance %',''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {SCA_AREAS.map(a => {
                const pct = Math.round((a.compliant / a.total) * 100)
                const selected = filterArea === a.area
                return (
                  <tr
                    key={a.area}
                    onClick={() => { setFilterArea(selected ? '' : a.area); setTab('findings') }}
                    className={cn('cursor-pointer hover:bg-blue-50 transition-colors', selected && 'bg-blue-50 border-l-2 border-l-blue-500')}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">{a.area}</td>
                    <td className="px-4 py-3 text-gray-600">{a.total}</td>
                    <td className="px-4 py-3 text-green-600 font-semibold">{a.compliant}</td>
                    <td className="px-4 py-3 text-red-500 font-semibold">{a.nonCompliant}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{pct}%</td>
                    <td className="px-4 py-3 w-40">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${pct}%`, background: pct >= 80 ? '#22c55e' : pct >= 60 ? '#eab308' : '#ef4444' }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {/* Totals */}
              <tr className="bg-gray-50 font-semibold text-gray-700 border-t border-gray-200">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3">{TOTAL_TERMS}</td>
                <td className="px-4 py-3 text-green-600">{TOTAL_TERMS - TOTAL_NC}</td>
                <td className="px-4 py-3 text-red-500">{TOTAL_NC}</td>
                <td className="px-4 py-3">{Math.round(((TOTAL_TERMS - TOTAL_NC) / TOTAL_TERMS) * 100)}%</td>
                <td className="px-4 py-3">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width:`${Math.round(((TOTAL_TERMS - TOTAL_NC) / TOTAL_TERMS) * 100)}%` }} />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="px-4 py-2 text-[10px] text-gray-400 bg-gray-50">Click a row to filter All Terms by that area</div>
        </div>
      )}

      {/* ── All Terms / Findings tab ── */}
      {tab === 'findings' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                placeholder="Search vendor, term, finding…" value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400">
              <option value="">All Risk Levels</option>
              {['Very High','High','Moderate','Low','No Risk'].map(r => <option key={r}>{r}</option>)}
            </select>
            <select value={filterArea} onChange={e => setFilterArea(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400">
              <option value="">All Areas</option>
              {SCA_AREAS.map(a => <option key={a.area}>{a.area}</option>)}
            </select>
            <select value={filterVendor} onChange={e => setFilterVendor(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400">
              <option value="">All Suppliers</option>
              {SUPPLIERS.map(s => <option key={s.vendor}>{s.vendor}</option>)}
            </select>
            <div className="flex rounded border border-gray-200 overflow-hidden text-xs">
              {[['all','All'], ['nc','Non-Compliant'], ['c','Compliant']].map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setFilterCompliant(v)}
                  className={cn('px-2.5 py-1.5 transition-colors', filterCompliant === v ? 'bg-[#0176d3] text-white font-semibold' : 'text-gray-500 hover:bg-gray-50')}
                >{label}</button>
              ))}
            </div>
            {hasFilters && (
              <button onClick={() => { setFilterRisk(''); setFilterArea(''); setFilterVendor(''); setFilterCompliant('all'); setSearch('') }} className="text-xs text-gray-400 hover:text-gray-600 underline">Clear</button>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Supplier','Risk','T&C Term','Area','Finding','Status'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {findings.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No terms match the current filters.</td></tr>
                  )}
                  {findings.map(t => {
                    const open = expandedId === t.id
                    const hasnotes = t.sfdc || t.pwc
                    return (
                      <>
                        <tr
                          key={t.id}
                          onClick={() => hasnotes && setExpandedId(expandedId === t.id ? null : t.id)}
                          className={cn(
                            'border-b border-gray-50 transition-colors',
                            !t.compliant ? 'hover:bg-red-50/30' : 'hover:bg-gray-50',
                            !t.compliant && 'bg-red-50/20',
                            open && 'bg-blue-50/30',
                            hasnotes && 'cursor-pointer'
                          )}
                        >
                          <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">
                            <button
                              onClick={e => { e.stopPropagation(); setFilterVendor(filterVendor === t.vendor ? '' : t.vendor) }}
                              className="hover:text-blue-600 hover:underline text-left"
                            >{t.vendor}</button>
                          </td>
                          <td className="px-3 py-2.5"><RiskBadge risk={t.risk} /></td>
                          <td className="px-3 py-2.5 text-gray-700 max-w-[200px]">
                            <span className="leading-snug">{t.term}</span>
                            {hasnotes && (
                              open
                                ? <ChevronDown className="inline-block w-3 h-3 text-gray-400 ml-1" />
                                : <ChevronRight className="inline-block w-3 h-3 text-gray-400 ml-1" />
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{area(t.term)}</td>
                          <td className="px-3 py-2.5 text-gray-600 max-w-[260px] leading-snug">{t.finding}</td>
                          <td className="px-3 py-2.5">
                            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap', t.compliant ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                              {t.compliant ? 'Compliant' : 'Non-compliant'}
                            </span>
                          </td>
                        </tr>
                        {open && (t.sfdc || t.pwc) && (
                          <tr key={`${t.id}-detail`} className="bg-blue-50/20 border-b border-blue-100">
                            <td colSpan={6} className="px-5 py-4">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {t.sfdc && (
                                  <div className="bg-white border border-blue-100 rounded-lg p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 mb-1.5">Salesforce Note</p>
                                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{t.sfdc}</p>
                                  </div>
                                )}
                                {t.pwc && (
                                  <div className="bg-white border border-purple-100 rounded-lg p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-500 mb-1.5">PwC Comment</p>
                                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{t.pwc}</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t border-gray-100 text-[10px] text-gray-400">
              Showing {findings.length} of {ALL_TERMS.length} terms · {findings.filter(t => !t.compliant).length} non-compliant in view · Click a row with a ▶ to expand SFDC and PwC notes
            </div>
          </div>
        </>
      )}
    </div>
  )
}
