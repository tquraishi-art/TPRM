import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── PwC SFDC Supplier Compliance Assessment — September 2026 ─────────────────
// Source: SFDC Supplier Compliance Assessment 09-17-2026.pdf
// 23 suppliers · 115 T&C terms · 62 compliant · 53 non-compliant
// Assessment types: Self Certification (9) · Detailed Assessment (14)

const ALL_TERMS = [
  // ── American Express — Very High — Self Certification ─────────────────────
  { id:'ax1', vendor:'American Express', type:'Self Certification', risk:'Very High', term:'Data protection and privacy', area:'Data Privacy and Information Security', compliant:true, comment:'' },
  { id:'ax2', vendor:'American Express', type:'Self Certification', risk:'Very High', term:'Protection of confidential information', area:'Data Privacy and Information Security', compliant:false, comment:'Supplier compliance statement mentioned, but did not include evidence to support:\n• Employee training or communication of training material on data protection;\n• Employee confidentiality agreements; and\n• Guidelines that outline steps taken during unauthorized disclosures, including client notification mechanics.' },
  { id:'ax3', vendor:'American Express', type:'Self Certification', risk:'Very High', term:'Protection of personal information', area:'Data Privacy and Information Security', compliant:false, comment:'Supplier compliance statement mentioned, but did not include evidence to support:\n• Certifications obtained that evidence information security program;\n• Descriptions of data protection mechanisms (e.g. encryption, access restrictions, retention policies); and\n• Steps taken including notifications in the event of a data breach involving personal information.' },
  { id:'ax4', vendor:'American Express', type:'Self Certification', risk:'Very High', term:'Compliance with data protection laws', area:'Data Privacy and Information Security', compliant:false, comment:'Supplier compliance statement mentioned, but did not include evidence to support:\n• Procedures outlining how and when SFDC would be notified of non-compliance or data processing issues;\n• Third party audits that assess American Express data protection.' },
  { id:'ax5', vendor:'American Express', type:'Self Certification', risk:'Very High', term:'SFDC approval required to subcontract', area:'Subcontractor and Third-Party Management', compliant:false, comment:'American Express did not confirm they verify subcontractors are not SFDC competitors nor did they provide supporting evidence. American Express did not confirm they notify SFDC in writing and 30 days in advance if subcontractors will work at SFDC facilities or handle confidential or personal information.' },
  // ── Bandwidth — High — Self Certification ─────────────────────────────────
  { id:'bw1', vendor:'Bandwidth', type:'Self Certification', risk:'High', term:'Confidentiality of protected information', area:'Data Privacy and Information Security', compliant:false, comment:'Supplier compliance statement mentioned, but did not include evidence to support:\n• Documentation or examples of training programs provided to personnel and third parties;\n• Restrictions on access to protected information; and\n• Evidence of employees and third parties committing to confidentiality obligations.' },
  { id:'bw2', vendor:'Bandwidth', type:'Self Certification', risk:'High', term:'Implementation of technical and organizational measures', area:'Data Privacy and Information Security', compliant:true, comment:'' },
  { id:'bw3', vendor:'Bandwidth', type:'Self Certification', risk:'High', term:'SFDC consent required to sub-process obligations', area:'Subcontractor and Third-Party Management', compliant:true, comment:'' },
  { id:'bw4', vendor:'Bandwidth', type:'Self Certification', risk:'High', term:'Supplier due diligence of sub-processors', area:'Subcontractor and Third-Party Management', compliant:true, comment:'' },
  { id:'bw5', vendor:'Bandwidth', type:'Self Certification', risk:'High', term:'Monthly service level reporting', area:'Operational and Service Standards', compliant:false, comment:'Supplier does not provide the required monthly service level reporting to SFDC.' },
  // ── Box — Low — Self Certification ────────────────────────────────────────
  { id:'bx1', vendor:'Box', type:'Self Certification', risk:'Low', term:'Protection of confidential information', area:'Data Privacy and Information Security', compliant:true, comment:'' },
  { id:'bx2', vendor:'Box', type:'Self Certification', risk:'Low', term:'Export controls', area:'Export Controls and Sanctions', compliant:true, comment:'' },
  { id:'bx3', vendor:'Box', type:'Self Certification', risk:'Low', term:'Anti-corruption', area:'Anti-Corruption and Ethics', compliant:true, comment:'' },
  { id:'bx4', vendor:'Box', type:'Self Certification', risk:'Low', term:'Insurer requirements', area:'Insurance and Liability', compliant:false, comment:'Supplier compliance statement mentioned but did not include evidence to support required AM Best rating of insurance providers.' },
  { id:'bx5', vendor:'Box', type:'Self Certification', risk:'Low', term:'Privacy requirements', area:'Data Privacy and Information Security', compliant:true, comment:'' },
  // ── CBRE — Low — Detailed Assessment ──────────────────────────────────────
  { id:'cb1', vendor:'CBRE', type:'Detailed Assessment', risk:'Low', term:'Code of Conduct', area:'Anti-Corruption and Ethics', compliant:false, comment:'Supplier provides current SFDC code of conduct to new joiners, but does not provide code of conduct updates to employees when made by SFDC.' },
  { id:'cb2', vendor:'CBRE', type:'Detailed Assessment', risk:'Low', term:'Subcontracting', area:'Subcontractor and Third-Party Management', compliant:true, comment:'' },
  { id:'cb3', vendor:'CBRE', type:'Detailed Assessment', risk:'Low', term:'Supplier conflict of interest', area:'Anti-Corruption and Ethics', compliant:true, comment:'' },
  { id:'cb4', vendor:'CBRE', type:'Detailed Assessment', risk:'Low', term:'Immigration compliance', area:'Immigration and Labor Laws', compliant:true, comment:'' },
  { id:'cb5', vendor:'CBRE', type:'Detailed Assessment', risk:'Low', term:'Compliance with equal opportunity laws', area:'Immigration and Labor Laws', compliant:true, comment:'' },
  // ── Cognizant — No Risk — Detailed Assessment ─────────────────────────────
  { id:'cg1', vendor:'Cognizant', type:'Detailed Assessment', risk:'No Risk', term:'Supplier self-review of policies and procedures', area:'Internal Governance and Auditing', compliant:true, comment:'' },
  { id:'cg2', vendor:'Cognizant', type:'Detailed Assessment', risk:'No Risk', term:'Supplier required to perform annual security audit', area:'Internal Governance and Auditing', compliant:true, comment:'' },
  { id:'cg3', vendor:'Cognizant', type:'Detailed Assessment', risk:'No Risk', term:'Protection of sensitive information', area:'Data Privacy and Information Security', compliant:true, comment:'' },
  { id:'cg4', vendor:'Cognizant', type:'Detailed Assessment', risk:'No Risk', term:'Confidentiality agreements', area:'Data Privacy and Information Security', compliant:true, comment:'' },
  { id:'cg5', vendor:'Cognizant', type:'Detailed Assessment', risk:'No Risk', term:'SFDC approval required to subcontract', area:'Subcontractor and Third-Party Management', compliant:true, comment:'' },
  // ── CrowdStrike — Moderate — Detailed Assessment ──────────────────────────
  { id:'cs1', vendor:'CrowdStrike', type:'Detailed Assessment', risk:'Moderate', term:'Protection of confidential information', area:'Data Privacy and Information Security', compliant:false, comment:'Supplier compliance statement mentioned, but did not include evidence to support:\n• Employee certification handbook excerpts; and\n• Incident notification policy.' },
  { id:'cs2', vendor:'CrowdStrike', type:'Detailed Assessment', risk:'Moderate', term:'Protection of customer data', area:'Data Privacy and Information Security', compliant:true, comment:'' },
  { id:'cs3', vendor:'CrowdStrike', type:'Detailed Assessment', risk:'Moderate', term:'Immigration compliance', area:'Immigration and Labor Laws', compliant:false, comment:'Supplier compliance statement mentioned, but did not include evidence to support:\n• Employment eligibility or IRCA compliance policy referencing Form I-9 and E-Verify requirements; and\n• Description or evidence of the control/process ensuring only legally authorized U.S. personnel are assigned to Salesforce work (e.g., role-based assignment control or attestation).' },
  { id:'cs4', vendor:'CrowdStrike', type:'Detailed Assessment', risk:'Moderate', term:'Insurance coverage', area:'Insurance and Liability', compliant:false, comment:"SFDC and its affiliates are not included as additional insureds on CrowdStrike's commercial general liability policy. Supplier did not provide evidence to support cyber liability or technology errors & omissions coverage, including required limits, scope, activation timing, or post-termination tail coverage." },
  { id:'cs5', vendor:'CrowdStrike', type:'Detailed Assessment', risk:'Moderate', term:'Insurance terms and conditions', area:'Insurance and Liability', compliant:true, comment:'' },
  // ── Forrester — Moderate — Self Certification ─────────────────────────────
  { id:'fo1', vendor:'Forrester', type:'Self Certification', risk:'Moderate', term:'Protection of confidential information', area:'Data Privacy and Information Security', compliant:false, comment:'Supplier compliance statement mentioned but did not include evidence to support protocols for notifying SFDC in the event of unauthorized access or disclosure of information.' },
  { id:'fo2', vendor:'Forrester', type:'Self Certification', risk:'Moderate', term:'Compliance with export control and sanctions', area:'Export Controls and Sanctions', compliant:true, comment:'' },
  { id:'fo3', vendor:'Forrester', type:'Self Certification', risk:'Moderate', term:'Compliance with immigration laws', area:'Immigration and Labor Laws', compliant:false, comment:'Supplier compliance statement mentioned but did not include evidence to support only authorized personnel are assigned to U.S. based services.' },
  { id:'fo4', vendor:'Forrester', type:'Self Certification', risk:'Moderate', term:'Compliance with equal opportunity laws', area:'Immigration and Labor Laws', compliant:true, comment:'' },
  { id:'fo5', vendor:'Forrester', type:'Self Certification', risk:'Moderate', term:'Compliance with anti-corruption laws', area:'Anti-Corruption and Ethics', compliant:true, comment:'' },
  // ── Hakuhodo — Low — Self Certification ───────────────────────────────────
  { id:'hk1', vendor:'Hakuhodo', type:'Self Certification', risk:'Low', term:'Safety and security', area:'Data Privacy and Information Security', compliant:true, comment:'' },
  { id:'hk2', vendor:'Hakuhodo', type:'Self Certification', risk:'Low', term:'Subcontractor requirements', area:'Subcontractor and Third-Party Management', compliant:false, comment:'Supplier compliance statement mentioned but did not include evidence to support flow down of SFDC required terms to subcontractors.' },
  { id:'hk3', vendor:'Hakuhodo', type:'Self Certification', risk:'Low', term:'Insurance requirements', area:'Insurance and Liability', compliant:false, comment:'Supplier could not provide evidence to support the requirement to maintain Industrial Accident Compensation Insurance.' },
  { id:'hk4', vendor:'Hakuhodo', type:'Self Certification', risk:'Low', term:'Code of conduct', area:'Anti-Corruption and Ethics', compliant:true, comment:'' },
  { id:'hk5', vendor:'Hakuhodo', type:'Self Certification', risk:'Low', term:'Immigration requirements', area:'Immigration and Labor Laws', compliant:true, comment:'' },
  // ── HERE — Low — Self Certification ───────────────────────────────────────
  { id:'he1', vendor:'HERE', type:'Self Certification', risk:'Low', term:'Subcontractor insurance requirement', area:'Insurance and Liability', compliant:false, comment:'Supplier did not provide evidence to demonstrate its subcontractors maintain the required insurance coverages and limits.' },
  { id:'he2', vendor:'HERE', type:'Self Certification', risk:'Low', term:"Worker's compensation and employers' liability insurance", area:'Insurance and Liability', compliant:true, comment:'' },
  { id:'he3', vendor:'HERE', type:'Self Certification', risk:'Low', term:'Commercial general or public liability insurance', area:'Insurance and Liability', compliant:true, comment:'' },
  { id:'he4', vendor:'HERE', type:'Self Certification', risk:'Low', term:'Professional liability insurance', area:'Insurance and Liability', compliant:true, comment:'' },
  { id:'he5', vendor:'HERE', type:'Self Certification', risk:'Low', term:'Insurer requirements', area:'Insurance and Liability', compliant:false, comment:'Supplier did not evidence the insurance provider has the appropriate AM Best rating.' },
  // ── Illumio — No Risk — Detailed Assessment ───────────────────────────────
  { id:'il1', vendor:'Illumio', type:'Detailed Assessment', risk:'No Risk', term:'Maintain required insurance coverage levels', area:'Insurance and Liability', compliant:true, comment:'' },
  { id:'il2', vendor:'Illumio', type:'Detailed Assessment', risk:'No Risk', term:'Follow all additional insurance standards', area:'Insurance and Liability', compliant:true, comment:'' },
  { id:'il3', vendor:'Illumio', type:'Detailed Assessment', risk:'No Risk', term:'Protect and restrict confidential information', area:'Data Privacy and Information Security', compliant:true, comment:'' },
  { id:'il4', vendor:'Illumio', type:'Detailed Assessment', risk:'No Risk', term:'Avoid bribery and follow anti-corruption laws', area:'Anti-Corruption and Ethics', compliant:true, comment:'' },
  { id:'il5', vendor:'Illumio', type:'Detailed Assessment', risk:'No Risk', term:'Provide regular software maintenance updates', area:'Operational and Service Standards', compliant:true, comment:'' },
  // ── Incredible Management — High — Self Certification ─────────────────────
  { id:'im1', vendor:'Incredible Management', type:'Self Certification', risk:'High', term:'Protection of confidential information', area:'Data Privacy and Information Security', compliant:false, comment:'Supplier lacks policy and process for notifying customers of unauthorized access or disclosure.' },
  { id:'im2', vendor:'Incredible Management', type:'Self Certification', risk:'High', term:'Abide by service guidelines for sensitive information', area:'Data Privacy and Information Security', compliant:false, comment:'Supplier failed to demonstrate that its processes for protecting sensitive information align with SFDC privacy, security and data integrity requirements in the Service Guidelines.' },
  { id:'im3', vendor:'Incredible Management', type:'Self Certification', risk:'High', term:'Use of subcontractors', area:'Subcontractor and Third-Party Management', compliant:false, comment:'Supplier does not have a policy requiring three bids for contracts exceeding $25,000. Supplier does not have a mechanism to flow down SFDC requirements to subcontractors.' },
  { id:'im4', vendor:'Incredible Management', type:'Self Certification', risk:'High', term:'Immigration law compliance', area:'Immigration and Labor Laws', compliant:false, comment:'Supplier was unable to provide evidence (policies, procedures, etc.) to support compliance with the immigration law.' },
  { id:'im5', vendor:'Incredible Management', type:'Self Certification', risk:'High', term:'Protection of sensitive information', area:'Data Privacy and Information Security', compliant:false, comment:'Supplier unable to provide evidence their personnel receive training on handling sensitive information and that access is revoked when no longer needed.' },
  // ── Infosys — High — Detailed Assessment ──────────────────────────────────
  { id:'in1', vendor:'Infosys', type:'Detailed Assessment', risk:'High', term:'Use SFDC equipment only for work', area:'Legal and Regulatory Compliance (General)', compliant:true, comment:'' },
  { id:'in2', vendor:'Infosys', type:'Detailed Assessment', risk:'High', term:'Background checks for non-US staff', area:'Personnel and Background Checks', compliant:true, comment:'' },
  { id:'in3', vendor:'Infosys', type:'Detailed Assessment', risk:'High', term:'Background check consent', area:'Personnel and Background Checks', compliant:true, comment:'' },
  { id:'in4', vendor:'Infosys', type:'Detailed Assessment', risk:'High', term:'Protection of sensitive information', area:'Data Privacy and Information Security', compliant:false, comment:'Supplier compliance statement mentioned, but did not include evidence to support:\n• Safeguards used to protect sensitive information;\n• Controls to prevent use/disclosure beyond agreement scope;\n• Compliance approach for applicable data protection and privacy laws;\n• Least-privilege access provisioning and data protection training; and\n• Defined 48-hour incident notification commitment and procedure.' },
  { id:'in5', vendor:'Infosys', type:'Detailed Assessment', risk:'High', term:'SFDC approval required to subcontract', area:'Subcontractor and Third-Party Management', compliant:false, comment:'Supplier compliance statement mentioned, but did not include evidence to support:\n• Explicit acknowledgment that the supplier retains primary responsibility for services and subcontractor performance;\n• Description or records of subcontractor due diligence;\n• Confirmation that subcontractors are treated as supplier (not SFDC) personnel;\n• Contractual flow-down evidence covering confidentiality, data protection, tax/legal, record retention, SFDC audit/review rights, and further subcontracting consent; and\n• Ability to monitor for instances where subcontractors may be used.' },
  // ── Insight Direct — Low — Detailed Assessment ────────────────────────────
  { id:'id1', vendor:'Insight Direct', type:'Detailed Assessment', risk:'Low', term:'Third party provider management', area:'Subcontractor and Third-Party Management', compliant:true, comment:'' },
  { id:'id2', vendor:'Insight Direct', type:'Detailed Assessment', risk:'Low', term:'VAR requirements', area:'Legal and Regulatory Compliance (General)', compliant:true, comment:'' },
  { id:'id3', vendor:'Insight Direct', type:'Detailed Assessment', risk:'Low', term:'Environment laws', area:'Legal and Regulatory Compliance (General)', compliant:true, comment:'' },
  { id:'id4', vendor:'Insight Direct', type:'Detailed Assessment', risk:'Low', term:'Export controls', area:'Export Controls and Sanctions', compliant:false, comment:'Supplier stated that C-TPAT certification and related security procedures do not apply to its business because it operates as a solutions integrator and reseller, not as a carrier or importer of record.' },
  { id:'id5', vendor:'Insight Direct', type:'Detailed Assessment', risk:'Low', term:'Conflict minerals', area:'Export Controls and Sanctions', compliant:true, comment:'' },
  // ── JFrog — High — Detailed Assessment ────────────────────────────────────
  { id:'jf1', vendor:'JFrog', type:'Detailed Assessment', risk:'High', term:'Protection of customer data', area:'Data Privacy and Information Security', compliant:true, comment:'' },
  { id:'jf2', vendor:'JFrog', type:'Detailed Assessment', risk:'High', term:'Export Administration Regulations', area:'Export Controls and Sanctions', compliant:false, comment:'Supplier failed to demonstrate that it has policies and processes for complying with export administration regulations.' },
  { id:'jf3', vendor:'JFrog', type:'Detailed Assessment', risk:'High', term:'Immigration', area:'Immigration and Labor Laws', compliant:false, comment:'Supplier failed to demonstrate that it has policies and processes for complying with immigration regulations.' },
  { id:'jf4', vendor:'JFrog', type:'Detailed Assessment', risk:'High', term:'Equal opportunity', area:'Immigration and Labor Laws', compliant:false, comment:'Supplier failed to demonstrate that it has policies and processes for complying with equal opportunity requirements.' },
  { id:'jf5', vendor:'JFrog', type:'Detailed Assessment', risk:'High', term:'Anti-corruption', area:'Anti-Corruption and Ethics', compliant:false, comment:'Supplier failed to demonstrate that it has policies and processes for complying with anti-corruption requirements.' },
  // ── Nihon Keizai Advertising — Low — Self Certification ───────────────────
  { id:'nk1', vendor:'Nihon Keizai Advertising', type:'Self Certification', risk:'Low', term:'Protection of confidential information', area:'Data Privacy and Information Security', compliant:true, comment:'' },
  { id:'nk2', vendor:'Nihon Keizai Advertising', type:'Self Certification', risk:'Low', term:'Export controls', area:'Export Controls and Sanctions', compliant:true, comment:'' },
  { id:'nk3', vendor:'Nihon Keizai Advertising', type:'Self Certification', risk:'Low', term:'Anti-corruption', area:'Anti-Corruption and Ethics', compliant:true, comment:'' },
  { id:'nk4', vendor:'Nihon Keizai Advertising', type:'Self Certification', risk:'Low', term:'Insurer requirements', area:'Insurance and Liability', compliant:false, comment:'Supplier compliance statement mentioned but did not include evidence to support required AM Best rating of insurance providers.' },
  { id:'nk5', vendor:'Nihon Keizai Advertising', type:'Self Certification', risk:'Low', term:'Privacy requirements', area:'Data Privacy and Information Security', compliant:true, comment:'' },
  // ── Palo Alto Networks — High — Detailed Assessment ───────────────────────
  { id:'pa1', vendor:'Palo Alto Networks', type:'Detailed Assessment', risk:'High', term:'Protection of confidential information', area:'Data Privacy and Information Security', compliant:false, comment:"Supplier compliance statement mentioned, but did not include evidence to support:\n• Care used for SFDC data matches internal practices or exceeds reasonable care;\n• Data use is restricted to activities within the scope of the agreement;\n• Protective language used with employees/agents who access SFDC data;\n• Enforcement of limited access via regular audits or privilege reviews; and\n• Steps followed to detect, escalate, and promptly notify SFDC if data is accessed or disclosed improperly and historical incidents and evidence of notification timeline and customer cooperation." },
  { id:'pa2', vendor:'Palo Alto Networks', type:'Detailed Assessment', risk:'High', term:'Compliance with immigration laws', area:'Immigration and Labor Laws', compliant:false, comment:'Supplier compliance statement mentioned, but did not include evidence to support:\n• Process to monitor eligibility to work in the U.S.;\n• Participation in the federal program used to validate work authorization; and\n• Immigration Reform and Control Act compliance is built into onboarding protocols.' },
  { id:'pa3', vendor:'Palo Alto Networks', type:'Detailed Assessment', risk:'High', term:'Maintain required privacy certifications consistently', area:'Data Privacy and Information Security', compliant:false, comment:"Supplier compliance statement mentioned, but did not include evidence to support:\n• SSAE 18 SOC 2, Type 2 attestation to supplier's information security obligations;\n• Confirmation reporting was provided upon SFDC's request; and\n• Certificate attesting to information security management system in accordance with ISO 27001." },
  { id:'pa4', vendor:'Palo Alto Networks', type:'Detailed Assessment', risk:'High', term:'Prohibit bribery and unlawful payments', area:'Anti-Corruption and Ethics', compliant:false, comment:'Supplier compliance statement mentioned, but did not include evidence to support:\n• Policy addressing bribery, kickbacks, or improper advantage referencing FCPA and other applicable laws;\n• Anti-bribery and ethics training;\n• Reporting channels for suspected corruption, including anonymity, escalation paths, and protection policies; and\n• Managing offers or exchanges of items of value, especially in sales, procurement, or government interactions.' },
  { id:'pa5', vendor:'Palo Alto Networks', type:'Detailed Assessment', risk:'High', term:'Only authorized personnel process protected information', area:'Data Privacy and Information Security', compliant:false, comment:'Supplier compliance statement mentioned, but did not include evidence to support:\n• Policy or contractual language stating Protected Information is treated as Confidential;\n• Classification protocols showing alignment with confidentiality standards;\n• Data handling logs proving access/disclosure only when service-related;\n• Role-based access controls that enforce strict need-to-know permissions;\n• Documentation of authorization approvals and justification process;\n• Agreement templates confirming confidentiality obligations;\n• Training materials and guidance sheets communicating the sensitive nature of the data; and\n• Email or onboarding templates used to notify recipients of confidentiality obligations.' },
  // ── Red Hat — Moderate — Detailed Assessment ──────────────────────────────
  { id:'rh1', vendor:'Red Hat', type:'Detailed Assessment', risk:'Moderate', term:'Protection of confidential information', area:'Data Privacy and Information Security', compliant:false, comment:'Supplier compliance statement mentioned but did not include evidence to support protocols for notifying SFDC in the event of unauthorized access or disclosure of information.' },
  { id:'rh2', vendor:'Red Hat', type:'Detailed Assessment', risk:'Moderate', term:'Compliance with export control and sanctions', area:'Export Controls and Sanctions', compliant:true, comment:'' },
  { id:'rh3', vendor:'Red Hat', type:'Detailed Assessment', risk:'Moderate', term:'Compliance with immigration laws', area:'Immigration and Labor Laws', compliant:false, comment:'Supplier compliance statement mentioned but did not include evidence to support only authorized personnel are assigned to U.S. based services and E-Verify is used to verify employee immigration status.' },
  { id:'rh4', vendor:'Red Hat', type:'Detailed Assessment', risk:'Moderate', term:'Compliance with equal opportunity laws', area:'Immigration and Labor Laws', compliant:true, comment:'' },
  { id:'rh5', vendor:'Red Hat', type:'Detailed Assessment', risk:'Moderate', term:'Compliance with anti-corruption laws', area:'Anti-Corruption and Ethics', compliant:true, comment:'' },
  // ── Sinch Interconnect — High — Self Certification ────────────────────────
  { id:'si1', vendor:'Sinch Interconnect', type:'Self Certification', risk:'High', term:'Compliance with export control regulations', area:'Export Controls and Sanctions', compliant:false, comment:'Supplier did not provide evidence of systems or controls to prevent using of SFDC in violation of export restrictions.' },
  { id:'si2', vendor:'Sinch Interconnect', type:'Self Certification', risk:'High', term:'Protection of confidential information', area:'Data Privacy and Information Security', compliant:false, comment:'Supplier did not confirm that employees, affiliates, contractors, and agents have signed confidentiality agreements with equal or greater stringency than SFDC requires from supplier.' },
  { id:'si3', vendor:'Sinch Interconnect', type:'Self Certification', risk:'High', term:'Protection of customer data', area:'Data Privacy and Information Security', compliant:false, comment:'Supplier compliance statement mentioned, but did not include evidence to support:\n• Policy confirming no modification of customer data and related integrity controls;\n• Details on disclosure handling and customer notification process;\n• Evidence of purpose-limited access (support access SOP, audit logs); and\n• Proof of 90-day deletion including backups and verification logs.' },
  { id:'si4', vendor:'Sinch Interconnect', type:'Self Certification', risk:'High', term:'Compliance with equal opportunity laws', area:'Immigration and Labor Laws', compliant:true, comment:'' },
  { id:'si5', vendor:'Sinch Interconnect', type:'Self Certification', risk:'High', term:'Compliance with anti-corruption laws', area:'Anti-Corruption and Ethics', compliant:true, comment:'' },
  // ── Sinch Sweden — High — Detailed Assessment ────────────────────────────
  { id:'ss1', vendor:'Sinch Sweden', type:'Detailed Assessment', risk:'High', term:'Compliance with export control regulations', area:'Export Controls and Sanctions', compliant:false, comment:'Supplier did not provide evidence of systems or controls to prevent using of SFDC in violation of export restrictions.' },
  { id:'ss2', vendor:'Sinch Sweden', type:'Detailed Assessment', risk:'High', term:'Protection of confidential information', area:'Data Privacy and Information Security', compliant:false, comment:'Supplier did not confirm that employees, affiliates, contractors, and agents have signed confidentiality agreements with equal or greater stringency than SFDC requires from supplier.' },
  { id:'ss3', vendor:'Sinch Sweden', type:'Detailed Assessment', risk:'High', term:'Protection of customer data', area:'Data Privacy and Information Security', compliant:false, comment:'Supplier compliance statement mentioned, but did not include evidence to support:\n• Modification of customer data and related integrity controls;\n• Disclosure handling and customer notification process;\n• Purpose-limited access (support access SOP, audit logs); and\n• 90-day deletion including backups and verification logs.' },
  { id:'ss4', vendor:'Sinch Sweden', type:'Detailed Assessment', risk:'High', term:'Compliance with equal opportunity laws', area:'Immigration and Labor Laws', compliant:false, comment:'Supplier compliance statement mentioned, but did not include evidence to support:\n• Employee training or distribution of EEO and ADA policies; and\n• Procedures for addressing and resolving workplace discrimination or ADA violations.' },
  { id:'ss5', vendor:'Sinch Sweden', type:'Detailed Assessment', risk:'High', term:'Compliance with anti-corruption laws', area:'Anti-Corruption and Ethics', compliant:false, comment:'Supplier compliance statement mentioned but did not include evidence to support employee training or distribution of anti-corruption policies.' },
  // ── Sparks Exhibits and Environments — High — Detailed Assessment ─────────
  { id:'sp1', vendor:'Sparks Exhibits and Environments', type:'Detailed Assessment', risk:'High', term:'Protection of confidential information', area:'Data Privacy and Information Security', compliant:false, comment:'Supplier compliance statement mentioned, but did not include evidence to support:\n• Policy document outlining access control practices for SFDC confidential information; and\n• How secure storage and reasonable care standards are implemented (e.g., information security policy).' },
  { id:'sp2', vendor:'Sparks Exhibits and Environments', type:'Detailed Assessment', risk:'High', term:'Protection of sensitive information', area:'Data Privacy and Information Security', compliant:true, comment:'' },
  { id:'sp3', vendor:'Sparks Exhibits and Environments', type:'Detailed Assessment', risk:'High', term:'Code of conduct', area:'Anti-Corruption and Ethics', compliant:true, comment:'' },
  { id:'sp4', vendor:'Sparks Exhibits and Environments', type:'Detailed Assessment', risk:'High', term:'Use of subcontractors', area:'Subcontractor and Third-Party Management', compliant:true, comment:'' },
  { id:'sp5', vendor:'Sparks Exhibits and Environments', type:'Detailed Assessment', risk:'High', term:'Supplier conflict of interest', area:'Anti-Corruption and Ethics', compliant:false, comment:'Supplier lacks a documented policy to monitor employees being assigned to the account of a SFDC competitor.' },
  // ── Tech Mahindra — Low — Detailed Assessment ────────────────────────────
  { id:'tm1', vendor:'Tech Mahindra', type:'Detailed Assessment', risk:'Low', term:'Supplier background checks', area:'Personnel and Background Checks', compliant:true, comment:'' },
  { id:'tm2', vendor:'Tech Mahindra', type:'Detailed Assessment', risk:'Low', term:'U.S. background check requirements', area:'Personnel and Background Checks', compliant:true, comment:'' },
  { id:'tm3', vendor:'Tech Mahindra', type:'Detailed Assessment', risk:'Low', term:'Foreign background check requirements', area:'Personnel and Background Checks', compliant:true, comment:'' },
  { id:'tm4', vendor:'Tech Mahindra', type:'Detailed Assessment', risk:'Low', term:'Background check consent', area:'Personnel and Background Checks', compliant:true, comment:'' },
  { id:'tm5', vendor:'Tech Mahindra', type:'Detailed Assessment', risk:'Low', term:'Supplier conflict of interest', area:'Anti-Corruption and Ethics', compliant:false, comment:'Supplier compliance statement mentioned, but did not include evidence to support:\n• Records showing conflict check verification prior to reassignment; and\n• Supplier maintained SFDC competitor list used for screening.' },
  // ── Zuora — Low — Detailed Assessment ────────────────────────────────────
  { id:'zu1', vendor:'Zuora', type:'Detailed Assessment', risk:'Low', term:'Data protection', area:'Data Privacy and Information Security', compliant:true, comment:'' },
  { id:'zu2', vendor:'Zuora', type:'Detailed Assessment', risk:'Low', term:'Export controls', area:'Export Controls and Sanctions', compliant:true, comment:'' },
  { id:'zu3', vendor:'Zuora', type:'Detailed Assessment', risk:'Low', term:'Immigration compliance', area:'Immigration and Labor Laws', compliant:false, comment:'Supplier compliance statement mentioned, but did not include evidence to support:\n• Hiring and onboarding process requirements; and\n• Only U.S. work authorized personnel are assigned to SFDC.' },
  { id:'zu4', vendor:'Zuora', type:'Detailed Assessment', risk:'Low', term:'Equal opportunity', area:'Immigration and Labor Laws', compliant:false, comment:'Supplier compliance statement mentioned but did not include evidence to support compliance with all applicable provisions of the Americans with Disabilities Act.' },
  { id:'zu5', vendor:'Zuora', type:'Detailed Assessment', risk:'Low', term:'Anti-corruption', area:'Anti-Corruption and Ethics', compliant:true, comment:'' },
  // ── Zscaler — Low — Detailed Assessment ──────────────────────────────────
  { id:'zs1', vendor:'Zscaler', type:'Detailed Assessment', risk:'Low', term:'Subcontractor insurance requirement', area:'Insurance and Liability', compliant:false, comment:'Supplier did not provide evidence to demonstrate its subcontractors maintain the required insurance coverages and limits.' },
  { id:'zs2', vendor:'Zscaler', type:'Detailed Assessment', risk:'Low', term:"Worker's compensation and employers' liability insurance", area:'Insurance and Liability', compliant:true, comment:'' },
  { id:'zs3', vendor:'Zscaler', type:'Detailed Assessment', risk:'Low', term:'Commercial general or public liability insurance', area:'Insurance and Liability', compliant:true, comment:'' },
  { id:'zs4', vendor:'Zscaler', type:'Detailed Assessment', risk:'Low', term:'Professional liability insurance', area:'Insurance and Liability', compliant:true, comment:'' },
  { id:'zs5', vendor:'Zscaler', type:'Detailed Assessment', risk:'Low', term:'Insurer requirements', area:'Insurance and Liability', compliant:false, comment:'Supplier did not evidence the insurance provider has the appropriate AM Best rating.' },
]

const RISK_ORDER = { 'Very High':0, 'High':1, 'Moderate':2, 'Low':3, 'No Risk':4 }

const SUPPLIERS = [...new Set(ALL_TERMS.map(t => t.vendor))].map(vendor => {
  const terms = ALL_TERMS.filter(t => t.vendor === vendor)
  const nc    = terms.filter(t => !t.compliant).length
  return { vendor, risk: terms[0].risk, type: terms[0].type, total: terms.length, ncCount: nc, compliant: terms.length - nc }
}).sort((a, b) => (RISK_ORDER[a.risk] ?? 99) - (RISK_ORDER[b.risk] ?? 99))

const OFFICIAL_AREAS = [
  'Anti-Corruption and Ethics','Data Privacy and Information Security','Export Controls and Sanctions',
  'Immigration and Labor Laws','Insurance and Liability','Internal Governance and Auditing',
  'Legal and Regulatory Compliance (General)','Operational and Service Standards',
  'Personnel and Background Checks','Subcontractor and Third-Party Management',
]

const SCA_AREAS = OFFICIAL_AREAS.map(a => {
  const terms     = ALL_TERMS.filter(t => t.area === a)
  const compliant = terms.filter(t => t.compliant).length
  return { area: a, total: terms.length, compliant, nonCompliant: terms.length - compliant }
}).filter(a => a.total > 0)

const TOTAL_NC    = ALL_TERMS.filter(t => !t.compliant).length
const TOTAL_TERMS = ALL_TERMS.length

const RISK_BADGE = {
  'Very High':'bg-red-100 text-red-700 border-red-200','High':'bg-orange-100 text-orange-700 border-orange-200',
  'Moderate':'bg-yellow-100 text-yellow-700 border-yellow-200','Low':'bg-green-100 text-green-700 border-green-200',
  'No Risk':'bg-gray-100 text-gray-500 border-gray-200',
}
const RISK_KPI_BG = {
  'Very High':'bg-red-50 border-red-200 hover:bg-red-100','High':'bg-orange-50 border-orange-200 hover:bg-orange-100',
  'Moderate':'bg-yellow-50 border-yellow-200 hover:bg-yellow-100','Low':'bg-green-50 border-green-200 hover:bg-green-100',
  'No Risk':'bg-gray-50 border-gray-200 hover:bg-gray-100',
}
const RISK_KPI_TEXT = {
  'Very High':'text-red-600','High':'text-orange-500','Moderate':'text-yellow-600','Low':'text-green-600','No Risk':'text-gray-500',
}

function RiskBadge({ risk }) {
  return <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap', RISK_BADGE[risk] ?? 'bg-gray-100 text-gray-500 border-gray-200')}>{risk}</span>
}
function TypeBadge({ type }) {
  return <span className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap', type === 'Detailed Assessment' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600')}>{type === 'Detailed Assessment' ? 'Detailed' : 'Self Cert'}</span>
}


export default function SCA() {
  const [filterRisk,      setFilterRisk]      = useState('')
  const [filterArea,      setFilterArea]      = useState('')
  const [filterVendor,    setFilterVendor]    = useState('')
  const [filterCompliant, setFilterCompliant] = useState('all')
  const [filterType,      setFilterType]      = useState('')
  const [search,          setSearch]          = useState('')
  const [expandedId,      setExpandedId]      = useState(null)
  const [expandedVendor,  setExpandedVendor]  = useState(null)
  const [tab,             setTab]             = useState('findings')

  const findings = ALL_TERMS
    .filter(t => !filterRisk    || t.risk === filterRisk)
    .filter(t => !filterArea    || t.area === filterArea)
    .filter(t => !filterVendor  || t.vendor === filterVendor)
    .filter(t => !filterType    || t.type === filterType)
    .filter(t => filterCompliant === 'nc' ? !t.compliant : filterCompliant === 'c' ? t.compliant : true)
    .filter(t => !search || t.vendor.toLowerCase().includes(search.toLowerCase()) || t.term.toLowerCase().includes(search.toLowerCase()) || t.comment.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const rd = (RISK_ORDER[a.risk] ?? 99) - (RISK_ORDER[b.risk] ?? 99)
      if (rd !== 0) return rd
      if (!a.compliant && b.compliant) return -1
      if (a.compliant && !b.compliant) return 1
      return 0
    })

  const hasFilters = filterRisk || filterArea || filterVendor || filterCompliant !== 'all' || filterType || search

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h1 className="text-lg font-semibold text-gray-800">Supplier Compliance Audit</h1>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">PwC · September 2026 · 23 suppliers · 115 T&C terms · 9 self-certifications · 14 detailed assessments</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Non-Compliant Terms</div>
          <div className="text-2xl font-bold text-red-600">{TOTAL_NC} <span className="text-base font-normal text-gray-400">/ {TOTAL_TERMS}</span></div>
          <div className="text-[10px] text-gray-400">{Math.round((TOTAL_NC / TOTAL_TERMS) * 100)}% non-compliant rate</div>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {['Very High','High','Moderate','Low','No Risk'].map(r => {
          const count = SUPPLIERS.filter(s => s.risk === r).length
          return (
            <button key={r} onClick={() => setFilterRisk(filterRisk === r ? '' : r)}
              className={cn('border rounded-lg p-3 text-left transition-all', RISK_KPI_BG[r], filterRisk === r && 'ring-2 ring-blue-400')}>
              <div className={cn('text-2xl font-bold', RISK_KPI_TEXT[r])}>{count}</div>
              <div className="text-[10px] text-gray-600 mt-0.5 font-medium">{r}</div>
              <div className="text-[10px] text-gray-400">supplier{count !== 1 ? 's' : ''}</div>
            </button>
          )
        })}
      </div>

      {/* Alert */}
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-gray-700 flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
        <span>
          <strong className="text-red-700">American Express rated Very High</strong> — 4/5 terms non-compliant including data protection laws, confidential information, personal information, and subcontract approval.{' '}
          <strong className="text-orange-700">8 suppliers rated High</strong>: Bandwidth, Incredible Management, Infosys, JFrog, Palo Alto Networks, Sinch Interconnect, Sinch Sweden, Sparks Exhibits and Environments.{' '}
          PwC recommends in-depth audits and corrective remediation plans for all Very High and High rated suppliers.
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[['findings','All Terms (115)'],['suppliers','By Supplier (23)'],['areas','By Area (10)']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('text-xs px-4 py-2 font-medium border-b-2 transition-colors -mb-px', tab === key ? 'border-[#0176d3] text-[#0176d3]' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            {label}
          </button>
        ))}
      </div>

      {/* ── By Supplier ── */}
      {tab === 'suppliers' && (
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400">
              <option value="">All Risk Levels</option>
              {['Very High','High','Moderate','Low','No Risk'].map(r => <option key={r}>{r}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400">
              <option value="">All Types</option>
              <option value="Detailed Assessment">Detailed Assessment</option>
              <option value="Self Certification">Self Certification</option>
            </select>
          </div>
          {SUPPLIERS.filter(s => (!filterRisk || s.risk === filterRisk) && (!filterType || s.type === filterType)).map(s => {
            const terms   = ALL_TERMS.filter(t => t.vendor === s.vendor)
            const ncTerms = terms.filter(t => !t.compliant)
            const open    = expandedVendor === s.vendor
            const pct     = Math.round((s.compliant / s.total) * 100)
            return (
              <div key={s.vendor} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <button className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedVendor(v => v === s.vendor ? null : s.vendor)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-800">{s.vendor}</span>
                      <RiskBadge risk={s.risk} />
                      <TypeBadge type={s.type} />
                      {ncTerms.length > 0
                        ? <span className="text-[10px] text-red-600 font-semibold">{ncTerms.length} non-compliant</span>
                        : <span className="text-[10px] text-green-600 font-semibold">Fully compliant</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 max-w-[200px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${pct}%`, background: pct===100?'#22c55e':pct>=60?'#eab308':'#ef4444' }} />
                      </div>
                      <span className="text-[10px] text-gray-500">{s.compliant}/{s.total} compliant ({pct}%)</span>
                    </div>
                  </div>
                  {open ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>
                {open && (
                  <div className="border-t border-gray-100">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-100">
                          <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">T&C Term</th>
                          <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Area</th>
                          <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {terms.map(t => (
                          <tr key={t.id} className={cn('border-b border-gray-50', !t.compliant && 'bg-red-50/40')}>
                            <td className="px-4 py-2 text-gray-700 font-medium">{t.term}</td>
                            <td className="px-4 py-2 text-gray-500 text-[10px]">{t.area}</td>
                            <td className="px-4 py-2">
                              <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', t.compliant ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                                {t.compliant ? 'Compliant' : 'Non-Compliant'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {ncTerms.length > 0 && (
                      <div className="px-4 py-3 space-y-3 bg-gray-50/30">
                        {ncTerms.map(t => t.comment && (
                          <div key={t.id} className="bg-white border border-red-100 rounded p-3">
                            <p className="text-[10px] font-semibold text-red-700 mb-1">{t.term}</p>
                            <p className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-line">{t.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── By Area ── */}
      {tab === 'areas' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Area','Total','Compliant','Non-Compliant','Compliance %',''].map((h,i) => (
                  <th key={i} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {SCA_AREAS.map(a => {
                const pct = Math.round((a.compliant / a.total) * 100)
                const selected = filterArea === a.area
                return (
                  <tr key={a.area} onClick={() => { setFilterArea(selected ? '' : a.area); setTab('findings') }}
                    className={cn('cursor-pointer hover:bg-blue-50 transition-colors', selected && 'bg-blue-50 border-l-2 border-l-blue-500')}>
                    <td className="px-4 py-3 font-medium text-gray-800">{a.area}</td>
                    <td className="px-4 py-3 text-gray-600">{a.total}</td>
                    <td className="px-4 py-3 text-green-600 font-semibold">{a.compliant}</td>
                    <td className="px-4 py-3 text-red-500 font-semibold">{a.nonCompliant}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{pct}%</td>
                    <td className="px-4 py-3 w-40">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${pct}%`, background: pct>=80?'#22c55e':pct>=50?'#eab308':'#ef4444' }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
              <tr className="bg-gray-50 font-semibold text-gray-700 border-t-2 border-gray-200">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3">115</td>
                <td className="px-4 py-3 text-green-600">62</td>
                <td className="px-4 py-3 text-red-500">53</td>
                <td className="px-4 py-3">54%</td>
                <td className="px-4 py-3"><div className="h-2 bg-blue-200 rounded-full"><div className="h-full bg-blue-400 rounded-full" style={{width:'54%'}} /></div></td>
              </tr>
            </tbody>
          </table>
          <div className="px-4 py-2 text-[10px] text-gray-400 bg-gray-50 border-t border-gray-100">Click a row to filter All Terms by that area</div>
        </div>
      )}

      {/* ── All Terms ── */}
      {tab === 'findings' && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                placeholder="Search vendor, term, finding…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400">
              <option value="">All Risk Levels</option>
              {['Very High','High','Moderate','Low','No Risk'].map(r => <option key={r}>{r}</option>)}
            </select>
            <select value={filterArea} onChange={e => setFilterArea(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400">
              <option value="">All Areas</option>
              {OFFICIAL_AREAS.map(a => <option key={a}>{a}</option>)}
            </select>
            <select value={filterVendor} onChange={e => setFilterVendor(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400">
              <option value="">All Suppliers</option>
              {SUPPLIERS.map(s => <option key={s.vendor}>{s.vendor}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-400">
              <option value="">All Types</option>
              <option value="Detailed Assessment">Detailed Assessment</option>
              <option value="Self Certification">Self Certification</option>
            </select>
            <div className="flex rounded border border-gray-200 overflow-hidden text-xs">
              {[['all','All'],['nc','Non-Compliant'],['c','Compliant']].map(([v,label]) => (
                <button key={v} onClick={() => setFilterCompliant(v)}
                  className={cn('px-2.5 py-1.5 transition-colors', filterCompliant===v?'bg-[#0176d3] text-white font-semibold':'text-gray-500 hover:bg-gray-50')}>{label}</button>
              ))}
            </div>
            {hasFilters && <button onClick={() => { setFilterRisk(''); setFilterArea(''); setFilterVendor(''); setFilterCompliant('all'); setFilterType(''); setSearch('') }} className="text-xs text-gray-400 hover:text-gray-600 underline">Clear</button>}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[960px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Supplier','Risk','Type','T&C Term','Area','Status'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {findings.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No terms match the current filters.</td></tr>}
                  {findings.map(t => {
                    const open = expandedId === t.id
                    return (
                      <>
                        <tr key={t.id}
                          onClick={() => t.comment && setExpandedId(expandedId === t.id ? null : t.id)}
                          className={cn('border-b border-gray-50 transition-colors', !t.compliant?'hover:bg-red-50/30 bg-red-50/20':'hover:bg-gray-50', open&&'bg-blue-50/30', t.comment&&'cursor-pointer')}>
                          <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">
                            <button onClick={e => { e.stopPropagation(); setFilterVendor(filterVendor===t.vendor?'':t.vendor) }} className="hover:text-blue-600 hover:underline text-left">{t.vendor}</button>
                          </td>
                          <td className="px-3 py-2.5"><RiskBadge risk={t.risk} /></td>
                          <td className="px-3 py-2.5"><TypeBadge type={t.type} /></td>
                          <td className="px-3 py-2.5 text-gray-700 max-w-[220px] leading-snug">
                            {t.term}
                            {t.comment && (open ? <ChevronDown className="inline-block w-3 h-3 text-gray-400 ml-1" /> : <ChevronRight className="inline-block w-3 h-3 text-gray-400 ml-1" />)}
                          </td>
                          <td className="px-3 py-2.5 text-gray-500 text-[10px] whitespace-nowrap">{t.area}</td>
                          <td className="px-3 py-2.5">
                            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap', t.compliant?'bg-green-100 text-green-700':'bg-red-100 text-red-700')}>
                              {t.compliant ? 'Compliant' : 'Non-Compliant'}
                            </span>
                          </td>
                        </tr>
                        {open && t.comment && (
                          <tr key={`${t.id}-d`} className="bg-blue-50/20 border-b border-blue-100">
                            <td colSpan={6} className="px-5 py-4">
                              <div className="bg-white border border-blue-100 rounded-lg p-3 max-w-3xl">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 mb-1.5">PwC Assessment Comment</p>
                                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{t.comment}</p>
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
              Showing {findings.length} of {ALL_TERMS.length} terms · {findings.filter(t => !t.compliant).length} non-compliant in view · Click a row with ▶ to expand PwC comments
            </div>
          </div>
        </>
      )}
    </div>
  )
}
