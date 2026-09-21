// Shared seed data — single source of truth for all pages
// Vendors sourced from TPRM Active Agreements (Salesforce)
// Risks use vendor full names (not IDs) for cross-page consistency

export const CTRL_REDUCTION = [0, 0.25, 0.50, 0.75, 0.90]

export function residualScore(r) {
  if (r.residual != null) return r.residual
  return Math.max(1, Math.round(r.lik * r.imp * (1 - (CTRL_REDUCTION[r.ctrl] || 0))))
}

export function levelFromScore(s) {
  if (s >= 20) return 'Very High'
  if (s >= 12) return 'High'
  if (s >= 6)  return 'Moderate'
  if (s >= 2)  return 'Low'
  return 'Very Low'
}

// 20 vendors derived from TPRM_Active_Agreements CSV
// sp = total contract value (USD); dc = highest data classification from access flags
export const VENDORS_INIT = [
  // Cloud / Infrastructure
  {id:'v1',  name:'Amazon Web Services',    tier:'Tier 1', cat:'Cloud / Infrastructure',  st:'Active', con:'Srinivas Tallapragada',       email:'srinivas.t@sfdc-vendor.com', cs:'2015-09-21', ce:'2031-10-31', sp:15300000000, dc:'Restricted / PII', svc:'Primary cloud infrastructure – compute, storage, AI, and platform services (AMER/EMEA)'},
  // Cloud / SaaS
  {id:'v2',  name:'Google',                 tier:'Tier 1', cat:'Cloud / SaaS',             st:'Active', con:'Nishant Gupta',               email:'nishant.g@sfdc-vendor.com',  cs:'2009-02-13', ce:'2031-12-31', sp:2760000000,  dc:'Restricted / PII', svc:'Workspace productivity, GCP, advertising platform, and data analytics'},
  {id:'v3',  name:'Microsoft',              tier:'Tier 1', cat:'Cloud / SaaS',             st:'Active', con:'Shau Phang',                  email:'shau.p@sfdc-vendor.com',     cs:'2013-07-30', ce:'2029-06-30', sp:336000000,   dc:'Confidential',     svc:'Enterprise software, Azure cloud, and Microsoft 365 productivity'},
  {id:'v10', name:'DocuSign',               tier:'Tier 2', cat:'Cloud / SaaS',             st:'Active', con:'Andy White',                  email:'andy.w@sfdc-vendor.com',     cs:'2010-04-30', ce:'2029-07-30', sp:20260000,    dc:'Restricted / PII', svc:'Electronic signature and contract lifecycle management'},
  {id:'v11', name:'AppExtremes / Conga',    tier:'Tier 2', cat:'Cloud / SaaS',             st:'Active', con:'Peeyush Khatri',              email:'peeyush.k@sfdc-vendor.com',  cs:'2009-12-18', ce:'2027-12-31', sp:8050000,     dc:'Confidential',     svc:'Document automation, CLM, and contract operations platform'},
  {id:'v12', name:'Sumo Logic',             tier:'Tier 3', cat:'Cloud / SaaS',             st:'Active', con:'Coby Randquist',              email:'coby.r@sfdc-vendor.com',     cs:'2018-11-14', ce:'2027-04-01', sp:2000000,     dc:'Confidential',     svc:'Log management, SIEM, and cloud observability platform'},
  {id:'v13', name:'Atlassian',              tier:'Tier 3', cat:'Cloud / SaaS',             st:'Active', con:'Cesar Arreola',               email:'cesar.a@sfdc-vendor.com',     cs:'2015-12-01', ce:'2099-12-31', sp:0,           dc:'Confidential',     svc:'Project management and collaboration tools (Jira, Confluence)'},
  // AI / Technology
  {id:'v4',  name:'OpenAI',                 tier:'Tier 1', cat:'AI / Technology',          st:'Active', con:'Indira Iyer',                 email:'indira.i@sfdc-vendor.com',   cs:'2023-06-09', ce:'2027-10-31', sp:65000000,    dc:'Internal',         svc:'Large language model APIs and AI platform services'},
  {id:'v14', name:'MongoDB',                tier:'Tier 2', cat:'AI / Technology',          st:'Active', con:'Jeff Layton',                 email:'jeff.l@sfdc-vendor.com',     cs:'2014-01-30', ce:'2099-01-01', sp:3520000,     dc:'Internal',         svc:'NoSQL database platform – Atlas cloud and on-premise deployments'},
  {id:'v15', name:'GitHub',                 tier:'Tier 2', cat:'AI / Technology',          st:'Active', con:'Ravinder Ramchandani',        email:'ravinder.r@sfdc-vendor.com', cs:'2018-04-17', ce:'2026-12-29', sp:1190000,     dc:'Confidential',     svc:'Source code hosting, CI/CD pipelines, and developer collaboration'},
  // Identity & Access / Cybersecurity
  {id:'v5',  name:'Okta',                   tier:'Tier 1', cat:'Identity & Access',        st:'Active', con:'Michael Gonella',            email:'michael.g@sfdc-vendor.com',  cs:'2016-10-31', ce:'2028-07-01', sp:7980000,     dc:'Restricted / PII', svc:'Identity and access management, SSO, and MFA platform'},
  {id:'v6',  name:'Cloudflare',             tier:'Tier 2', cat:'Cybersecurity',            st:'Active', con:'Marcus Groff',               email:'marcus.g@sfdc-vendor.com',   cs:'2016-09-30', ce:'2099-01-01', sp:4000000,     dc:'Internal',         svc:'CDN, DDoS protection, and Zero Trust network security'},
  {id:'v7',  name:'Akamai',                 tier:'Tier 2', cat:'Cybersecurity',            st:'Active', con:'Barry Kusumo',               email:'barry.k@sfdc-vendor.com',    cs:'2011-10-21', ce:'2099-08-04', sp:8200000,     dc:'Internal',         svc:'Content delivery network, web security, and bot management'},
  {id:'v8',  name:'CrowdStrike',            tier:'Tier 2', cat:'Cybersecurity',            st:'Active', con:'Mor Levi',                   email:'mor.l@sfdc-vendor.com',      cs:'2012-12-17', ce:'2028-10-28', sp:547000,      dc:'Internal',         svc:'Endpoint detection and response, threat intelligence platform'},
  {id:'v9',  name:'DigiCert',               tier:'Tier 4', cat:'Cybersecurity',            st:'Active', con:'Sujith Kumar B',             email:'sujith.k@sfdc-vendor.com',   cs:'2013-08-06', ce:'2027-09-01', sp:1700,        dc:'Internal',         svc:'Digital certificate management and PKI services'},
  // Technology Services
  {id:'v16', name:'NTT DATA INTELLILINK',   tier:'Tier 2', cat:'Technology Services',      st:'Active', con:'Cherise Brown',              email:'cherise.b@sfdc-vendor.com',  cs:'2015-01-01', ce:'2027-01-31', sp:8100000,     dc:'Restricted / PII', svc:'IT consulting, managed services, and application development (multi-region)'},
  // Data Center / Facilities
  {id:'v17', name:'Switch',                 tier:'Tier 3', cat:'Data Center / Facilities', st:'Active', con:'Alsontra Daniels',           email:'alsontra.d@sfdc-vendor.com', cs:'2008-12-30', ce:'2099-01-01', sp:4800000,     dc:'Internal',         svc:'Data centre colocation, power, cooling, and network infrastructure'},
  // Financial Services
  {id:'v18', name:'American Express',       tier:'Tier 3', cat:'Financial Services',       st:'Active', con:'Eva Backer',                 email:'eva.b@sfdc-vendor.com',      cs:'2015-02-19', ce:'2099-01-01', sp:49000,       dc:'Restricted / PII', svc:'Corporate travel cards, expense management, and GBT services'},
  // Network / Connectivity
  {id:'v19', name:'ZAYO GROUP',             tier:'Tier 3', cat:'Network / Connectivity',   st:'Active', con:'Abhinash Balachandran Pillai',email:'abhinash.b@sfdc-vendor.com', cs:'2005-05-01', ce:'2030-01-30', sp:725000,     dc:'Confidential',     svc:'Dark fiber, wavelength, and Ethernet connectivity – AMER and EMEA'},
  // Marketing / Consulting
  {id:'v20', name:'Dentsu',                 tier:'Tier 3', cat:'Marketing / Consulting',   st:'Active', con:'Shiho Nishizuka',            email:'shiho.n@sfdc-vendor.com',    cs:'2018-12-19', ce:'2027-01-31', sp:1310000,     dc:'Restricted / PII', svc:'Marketing services, digital advertising, and media planning (Japan)'},
]

export const RISKS_SEED = [
  // Amazon Web Services
  {id:'r1',  name:'Unpatched vulnerabilities in core AWS platform services',         vendor:'Amazon Web Services',    tier:'Tier 1', cat:'Cybersecurity',       lik:4, imp:5, ctrl:1, treat:'Mitigate', st:'Open',        owner:'S. Kim',    due:'2026-09-15', escalate:true,  desc:'Unpatched CVEs in core API and container infrastructure.',                           plan:'Require patch schedule; emergency review within 30 days.',              ev:''},
  {id:'r5',  name:'Cloud provider concentration and single-vendor dependency',       vendor:'Amazon Web Services',    tier:'Tier 1', cat:'Business Continuity', lik:2, imp:5, ctrl:2, treat:'Mitigate', st:'In Progress', owner:'S. Kim',    due:'2026-12-01', escalate:false, desc:'Critical workloads concentrated on AWS with no cloud fallback.',             plan:'Evaluate multi-cloud strategy.',                                         ev:'DR project initiated'},
  {id:'r8',  name:'GDPR right-to-erasure non-compliance in AWS data stores',        vendor:'Amazon Web Services',    tier:'Tier 1', cat:'Privacy & Data',      lik:2, imp:4, ctrl:4, treat:'Mitigate', st:'Mitigated',   owner:'L. Park',   due:'2026-06-30', escalate:false, desc:'Data erasure requests not processed within regulatory window.',              plan:'Automated deletion workflow deployed.',                                  ev:'Deletion workflow audit log'},
  {id:'r10', name:'AWS contract renewal pricing escalation risk',                    vendor:'Amazon Web Services',    tier:'Tier 1', cat:'Financial',           lik:4, imp:3, ctrl:1, treat:'Accept',   st:'Open',        owner:'R. Brown',  due:'2026-10-15', escalate:false, desc:'Anticipated 20–30% price increase at $15B contract renewal.',               plan:'Begin renegotiation 6 months early.',                                    ev:''},
  // Google
  {id:'r14', name:'Google Workspace data sovereignty and residency gap',             vendor:'Google',                 tier:'Tier 1', cat:'Privacy & Data',      lik:3, imp:4, ctrl:1, treat:'Mitigate', st:'Open',        owner:'L. Park',   due:'2026-10-01', escalate:false, desc:'GDPR/CCPA compliance risk from Workspace data residency gaps.',              plan:'Enforce EU region controls and DPA review.',                             ev:''},
  {id:'r30', name:'Google Gemini AI data leakage from confidential prompts',         vendor:'Google',                 tier:'Tier 1', cat:'Cybersecurity',       lik:3, imp:5, ctrl:1, treat:'Mitigate', st:'Open',        owner:'S. Kim',    due:'2026-10-20', escalate:true,  desc:'Confidential data submitted to Gemini may be used for model training.',     plan:'Implement usage policy; disable model improvement opt-in.',             ev:''},
  // Microsoft
  {id:'r2',  name:'Microsoft Copilot AI oversharing confidential documents',         vendor:'Microsoft',              tier:'Tier 1', cat:'Privacy & Data',      lik:3, imp:5, ctrl:1, treat:'Mitigate', st:'In Progress', owner:'L. Park',   due:'2026-09-30', escalate:true,  desc:'Copilot can surface restricted documents to users without need-to-know.',   plan:'Enforce sensitivity labels; restrict Copilot to labelled content.',     ev:'Ticket #SEC-1205'},
  {id:'r11', name:'Microsoft E5 licensing compliance audit exposure',                vendor:'Microsoft',              tier:'Tier 1', cat:'Compliance',          lik:3, imp:4, ctrl:2, treat:'Mitigate', st:'In Progress', owner:'R. Brown',  due:'2026-11-01', escalate:false, desc:'Potential under-licensing of E5 and Azure services identified in audit.',   plan:'Conduct licence reconciliation and remediate gaps.',                    ev:''},
  // OpenAI
  {id:'r29', name:'OpenAI model training on submitted confidential prompts',         vendor:'OpenAI',                 tier:'Tier 1', cat:'Privacy & Data',      lik:4, imp:5, ctrl:1, treat:'Mitigate', st:'Open',        owner:'S. Kim',    due:'2026-09-01', escalate:true,  desc:'Enterprise contract may not fully prevent prompt data entering training pipelines.', plan:'Contractual audit; require explicit opt-out confirmation.',          ev:''},
  {id:'r13', name:'OpenAI API availability – no SLA for production workloads',       vendor:'OpenAI',                 tier:'Tier 1', cat:'Business Continuity', lik:3, imp:4, ctrl:1, treat:'Mitigate', st:'Open',        owner:'T. Wilson', due:'2026-10-15', escalate:false, desc:'No formal uptime SLA; outages affect production AI features.',              plan:'Negotiate SLA addendum; build circuit-breaker fallback.',               ev:''},
  // Okta
  {id:'r3',  name:'Okta SSO outage disabling access to all authenticated systems',   vendor:'Okta',                   tier:'Tier 1', cat:'Business Continuity', lik:3, imp:5, ctrl:1, treat:'Mitigate', st:'Open',        owner:'M. Davis',  due:'2026-09-15', escalate:true,  desc:'Okta is sole SSO provider; any outage disables all system access.',         plan:'Implement break-glass procedures; evaluate secondary IdP.',             ev:''},
  {id:'r4',  name:'Okta admin console credential compromise via phishing',           vendor:'Okta',                   tier:'Tier 1', cat:'Cybersecurity',       lik:3, imp:5, ctrl:2, treat:'Mitigate', st:'In Progress', owner:'S. Kim',    due:'2026-10-01', escalate:false, desc:'Phishing campaigns targeting Okta admin accounts are escalating.',          plan:'Enforce FIDO2/phishing-resistant MFA for all admins.',                 ev:''},
  // DocuSign
  {id:'r26', name:'DocuSign PII exposure in e-signature workflows',                  vendor:'DocuSign',               tier:'Tier 2', cat:'Privacy & Data',      lik:3, imp:4, ctrl:2, treat:'Mitigate', st:'Open',        owner:'L. Park',   due:'2026-10-01', escalate:false, desc:'Contracts containing PII and financial terms in DocuSign without field masking.', plan:'Review DPA and enforce field-level encryption standards.',          ev:''},
  // AppExtremes / Conga
  {id:'r22', name:'AppExtremes/Conga contract data shared with analytics subprocessors', vendor:'AppExtremes / Conga', tier:'Tier 2', cat:'Privacy & Data',   lik:3, imp:3, ctrl:2, treat:'Mitigate', st:'Open',        owner:'L. Park',   due:'2026-10-15', escalate:false, desc:'Contract data containing financial terms shared with Conga analytics pipeline.', plan:'Review DPA; restrict analytics data sharing.',                    ev:''},
  // NTT DATA INTELLILINK
  {id:'r6',  name:'NTT DATA contractor source-code access without PAM controls',    vendor:'NTT DATA INTELLILINK',   tier:'Tier 2', cat:'Cybersecurity',       lik:3, imp:4, ctrl:2, treat:'Mitigate', st:'In Progress', owner:'S. Kim',    due:'2026-08-30', escalate:false, desc:'Multiple SOWs with broad codebase access; PAM not consistently enforced.',  plan:'Enforce least-privilege and PAM for all contractor sessions.',         ev:'Ticket #SEC-1042'},
  {id:'r9',  name:'NTT DATA subcontractor data disclosure without DPA coverage',    vendor:'NTT DATA INTELLILINK',   tier:'Tier 2', cat:'Privacy & Data',      lik:3, imp:3, ctrl:2, treat:'Mitigate', st:'Open',        owner:'L. Park',   due:'2026-11-01', escalate:false, desc:'Data shared with NTT subcontractors in LATAM and EMEA without full DPA coverage.', plan:'Require full subcontractor disclosure in master DPA.',             ev:''},
  // Cloudflare
  {id:'r16', name:'Cloudflare WAF misconfiguration exposing internal services',      vendor:'Cloudflare',             tier:'Tier 2', cat:'Cybersecurity',       lik:3, imp:4, ctrl:1, treat:'Mitigate', st:'Open',        owner:'M. Davis',  due:'2026-10-01', escalate:false, desc:'WAF rules and access policies misconfigured; overly broad traffic permitted.', plan:'Conduct WAF rule audit; restrict internal service exposure.',        ev:''},
  // Akamai
  {id:'r18', name:'Akamai CDN cache poisoning risk on static content',              vendor:'Akamai',                 tier:'Tier 2', cat:'Cybersecurity',       lik:2, imp:4, ctrl:2, treat:'Mitigate', st:'In Progress', owner:'T. Wilson', due:'2026-11-01', escalate:false, desc:'Cache poisoning or misconfiguration could serve malicious content to end-users.', plan:'Enable cache validation and origin server integrity checks.',       ev:''},
  // GitHub
  {id:'r19', name:'GitHub repository accidental public exposure of source code',    vendor:'GitHub',                 tier:'Tier 2', cat:'Cybersecurity',       lik:4, imp:5, ctrl:1, treat:'Mitigate', st:'Open',        owner:'S. Kim',    due:'2026-10-01', escalate:true,  desc:'Developer misconfiguration risk of making private repos public; secrets in commits.', plan:'Enforce repo visibility governance, secret scanning, and branch rules.', ev:''},
  // MongoDB
  {id:'r21', name:'MongoDB Atlas cluster misconfiguration – insufficient IP controls', vendor:'MongoDB',             tier:'Tier 2', cat:'Cybersecurity',       lik:3, imp:4, ctrl:2, treat:'Mitigate', st:'In Progress', owner:'M. Davis',  due:'2026-11-01', escalate:false, desc:'Atlas clusters with overly permissive IP allowlists, bypassing private endpoints.', plan:'Enforce private endpoints; harden network access restrictions.', ev:''},
  // CrowdStrike
  {id:'r25', name:'CrowdStrike sensor update causing system-wide instability',       vendor:'CrowdStrike',            tier:'Tier 3', cat:'Business Continuity', lik:3, imp:4, ctrl:2, treat:'Mitigate', st:'In Progress', owner:'T. Wilson', due:'2026-10-15', escalate:false, desc:'Faulty sensor update risk that could cause OS kernel panics across the fleet.', plan:'Enforce staged rollout and automated rollback for sensor updates.',    ev:''},
  // Sumo Logic
  {id:'r24', name:'Sumo Logic log retention and cross-tenant data isolation risk',  vendor:'Sumo Logic',             tier:'Tier 3', cat:'Cybersecurity',       lik:3, imp:3, ctrl:1, treat:'Mitigate', st:'Open',        owner:'S. Kim',    due:'2026-11-01', escalate:false, desc:'Sensitive system logs retained beyond policy; cross-tenant isolation not independently verified.', plan:'Set log purge policies; request SOC 2 cross-tenant isolation report.', ev:''},
  // Switch
  {id:'r23', name:'Switch data centre physical access control findings',            vendor:'Switch',                 tier:'Tier 3', cat:'Operational',         lik:2, imp:4, ctrl:2, treat:'Mitigate', st:'Open',        owner:'T. Wilson', due:'2026-12-01', escalate:false, desc:'Access logs show unescorted vendor entry events in server rooms.',          plan:'Enforce escort policy; require badge log review for all vendor visits.', ev:''},
  // ZAYO GROUP
  {id:'r7',  name:'ZAYO network single-path failure for critical connectivity',     vendor:'ZAYO GROUP',             tier:'Tier 3', cat:'Business Continuity', lik:3, imp:3, ctrl:1, treat:'Mitigate', st:'Open',        owner:'T. Wilson', due:'2026-10-30', escalate:false, desc:'Critical fibre routes lack path redundancy in key AMER and EMEA locations.',  plan:'Map all ZAYO circuits; require diverse routing for critical sites.',    ev:''},
  // American Express
  {id:'r27', name:'American Express GBT platform travel PII retention risk',        vendor:'American Express',       tier:'Tier 3', cat:'Privacy & Data',      lik:3, imp:3, ctrl:1, treat:'Mitigate', st:'Open',        owner:'L. Park',   due:'2026-11-15', escalate:false, desc:'GBT platform stores employee PII including passport and travel itinerary data.', plan:'Review DPA; enforce data retention limits in GBT system.',           ev:''},
  // Dentsu
  {id:'r28', name:'Dentsu multi-entity processing of Salesforce CD/PII data (Japan)', vendor:'Dentsu',              tier:'Tier 3', cat:'Privacy & Data',      lik:3, imp:3, ctrl:2, treat:'Mitigate', st:'In Progress', owner:'L. Park',   due:'2026-10-31', escalate:false, desc:'Multiple Dentsu entities (Inc, Runway, Souken) with CD/PII flags processing Salesforce marketing data in Japan.', plan:'Execute updated DPA covering all active Dentsu entities.', ev:''},
  // DigiCert
  {id:'r15', name:'DigiCert certificate expiry causing service outages',            vendor:'DigiCert',               tier:'Tier 4', cat:'Operational',         lik:3, imp:3, ctrl:1, treat:'Mitigate', st:'Open',        owner:'M. Davis',  due:'2026-11-01', escalate:false, desc:'Manual certificate renewal process risks undetected expiry causing HTTPS failures.', plan:'Implement automated certificate lifecycle monitoring.',              ev:''},
]

export const IRQ_INIT = [
  {id:'q1',  vendor:'Amazon Web Services',   sec:5, priv:4, bcm:3, fin:3, st:'Scored',       notes:'Largest infrastructure provider; strong security posture but concentration and pricing risk significant.'},
  {id:'q2',  vendor:'Google',               sec:4, priv:4, bcm:3, fin:3, st:'Scored',       notes:'Strong security; AI data training risk and cross-product data sharing under active review.'},
  {id:'q3',  vendor:'Microsoft',            sec:4, priv:3, bcm:3, fin:3, st:'Scored',       notes:'Copilot AI data access risk noted; licensing compliance gap in remediation.'},
  {id:'q4',  vendor:'OpenAI',               sec:4, priv:5, bcm:2, fin:2, st:'Scored',       notes:'Privacy risk elevated – contract training opt-out not fully confirmed. BCM risk low as non-critical fallback possible.'},
  {id:'q5',  vendor:'Okta',                 sec:4, priv:4, bcm:5, fin:2, st:'Scored',       notes:'BCM risk very high – sole SSO provider. Phishing risk to admin accounts noted and in remediation.'},
  {id:'q6',  vendor:'Cloudflare',           sec:3, priv:2, bcm:3, fin:2, st:'Scored',       notes:'WAF misconfiguration risk noted. No data access flags; moderate security risk overall.'},
  {id:'q7',  vendor:'Akamai',               sec:3, priv:2, bcm:3, fin:2, st:'Scored',       notes:'CDN security adequate; cache poisoning risk under remediation. Long-term contract (2099).'},
  {id:'q8',  vendor:'CrowdStrike',          sec:3, priv:2, bcm:4, fin:2, st:'Scored',       notes:'BCM risk elevated from sensor update pattern. Security posture as an EDR vendor is strong.'},
  {id:'q9',  vendor:'DigiCert',             sec:2, priv:1, bcm:3, fin:1, st:'Scored',       notes:'Low risk profile; operational risk from manual certificate renewal process.'},
  {id:'q10', vendor:'DocuSign',             sec:3, priv:4, bcm:2, fin:2, st:'Scored',       notes:'PII in transit risk present; DPA field-level encryption review in progress.'},
  {id:'q11', vendor:'AppExtremes / Conga',  sec:3, priv:3, bcm:2, fin:2, st:'Scored',       notes:'Contract data sharing with analytics subprocessors under review.'},
  {id:'q12', vendor:'Sumo Logic',           sec:3, priv:3, bcm:2, fin:2, st:'Scored',       notes:'Log data cross-tenant isolation and over-retention risks noted.'},
  {id:'q13', vendor:'Atlassian',            sec:3, priv:2, bcm:3, fin:2, st:'Scored',       notes:'Network and IT access flags; collaboration tool data governance requires strengthening.'},
  {id:'q14', vendor:'MongoDB',              sec:3, priv:2, bcm:2, fin:2, st:'Scored',       notes:'Atlas misconfiguration risk; private endpoint controls being enforced.'},
  {id:'q15', vendor:'GitHub',               sec:4, priv:2, bcm:2, fin:2, st:'Scored',       notes:'Source code (Src) access flag; repo visibility governance and secret scanning required urgently.'},
  {id:'q16', vendor:'NTT DATA INTELLILINK', sec:3, priv:3, bcm:2, fin:2, st:'Scored',       notes:'Contractor access controls and subcontractor DPA disclosure risks across multi-region SOWs.'},
  {id:'q17', vendor:'Switch',               sec:2, priv:1, bcm:3, fin:2, st:'Scored',       notes:'Physical security findings from access log audit; escort policy enforcement required.'},
  {id:'q18', vendor:'American Express',     sec:2, priv:4, bcm:2, fin:3, st:'Scored',       notes:'Travel PII including passport data in GBT; financial platform controls adequate.'},
  {id:'q19', vendor:'ZAYO GROUP',           sec:2, priv:1, bcm:3, fin:2, st:'Scored',       notes:'Network path redundancy risk in AMER and EMEA; auto-renew contracts require monitoring.'},
  {id:'q20', vendor:'Dentsu',               sec:3, priv:4, bcm:2, fin:2, st:'Scored',       notes:'Multiple Dentsu entities in Japan with CD/PII flags; DPA consolidation update urgently needed.'},
]
