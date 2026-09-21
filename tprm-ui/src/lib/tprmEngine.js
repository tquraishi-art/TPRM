// Deterministic TPRM query engine — all answers computed from live localStorage data.
// No external API calls. Answers are always current and accurate.

import { VENDORS_INIT, RISKS_SEED, IRQ_INIT } from './seedData'

// ─── Scoring helpers ──────────────────────────────────────────────────────────

const CTRL_REDUCTION = [0, 0.25, 0.50, 0.75, 0.90]

function computeResidual(r) {
  if (r.residual != null) return r.residual
  return Math.max(1, Math.round(r.lik * r.imp * (1 - (CTRL_REDUCTION[r.ctrl] || 0))))
}

function level(s) {
  if (s >= 20) return 'Very High'
  if (s >= 12) return 'High'
  if (s >= 6)  return 'Moderate'
  if (s >= 2)  return 'Low'
  return 'Very Low'
}

function irqComposite(q) {
  return +(q.sec * 0.4 + q.priv * 0.2 + q.bcm * 0.3 + q.fin * 0.1).toFixed(2)
}

function irqLevel(c) {
  if (c >= 4.5) return 'Very High'
  if (c >= 3.5) return 'High'
  if (c >= 2.5) return 'Moderate'
  if (c >= 1.5) return 'Low'
  return 'Very Low'
}

function isOverdue(due) {
  if (!due) return false
  return new Date(due) < new Date()
}

function fmt$(n) { return n ? '$' + Number(n).toLocaleString() : '—' }

// ─── Static SBR summary (SBR page does not use localStorage) ─────────────────

const SBR_STATIC = [
  { name:'Amazon Web Services',    pf:'Cloud / Infrastructure',  score:4.20, risk:'Low'       },
  { name:'Google',                 pf:'Cloud / SaaS',            score:4.05, risk:'Low'       },
  { name:'Microsoft',              pf:'Cloud / SaaS',            score:3.90, risk:'Low'       },
  { name:'OpenAI',                 pf:'AI / Technology',         score:2.80, risk:'High'      },
  { name:'Okta',                   pf:'Identity & Access',       score:3.70, risk:'Moderate'  },
  { name:'Cloudflare',             pf:'Cybersecurity',           score:4.15, risk:'Low'       },
  { name:'Akamai',                 pf:'Cybersecurity',           score:4.00, risk:'Low'       },
  { name:'CrowdStrike',            pf:'Cybersecurity',           score:3.85, risk:'Moderate'  },
  { name:'DigiCert',               pf:'Cybersecurity',           score:4.50, risk:'Very Low'  },
  { name:'DocuSign',               pf:'Cloud / SaaS',            score:3.60, risk:'Moderate'  },
  { name:'AppExtremes / Conga',    pf:'Cloud / SaaS',            score:3.40, risk:'Moderate'  },
  { name:'Sumo Logic',             pf:'Cloud / SaaS',            score:3.55, risk:'Moderate'  },
  { name:'Atlassian',              pf:'Cloud / SaaS',            score:3.95, risk:'Low'       },
  { name:'MongoDB',                pf:'AI / Technology',         score:3.75, risk:'Moderate'  },
  { name:'GitHub',                 pf:'AI / Technology',         score:3.50, risk:'Moderate'  },
  { name:'NTT DATA INTELLILINK',   pf:'Technology Services',     score:3.20, risk:'High'      },
  { name:'Switch',                 pf:'Data Center / Facilities',score:4.10, risk:'Low'       },
  { name:'American Express',       pf:'Financial Services',      score:3.80, risk:'Moderate'  },
  { name:'ZAYO GROUP',             pf:'Network / Connectivity',  score:3.65, risk:'Moderate'  },
  { name:'Dentsu',                 pf:'Marketing / Consulting',  score:2.90, risk:'High'      },
]

// ─── Read from localStorage ───────────────────────────────────────────────────

function readStore(key, fallback) {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : fallback
  } catch { return fallback }
}

// ─── Build context from all live data stores ──────────────────────────────────

export function buildContext() {
  const vendors     = readStore('tprm:vendors',     VENDORS_INIT)
  const rawRisks    = readStore('tprm:risks',       RISKS_SEED)
  const rawIRQ      = readStore('tprm:irq',         IRQ_INIT)
  const issues      = readStore('tprm:issues',      [])
  const kris        = readStore('tprm:kri',         [])
  const assessments = readStore('tprm:assessments', [])
  const appetite    = readStore('tprm:appetite',    [])
  const incidents   = readStore('tprm:incidents',   [])

  const today = new Date().toISOString().split('T')[0]

  // Enrich risks
  const risks = rawRisks.map(r => {
    const res = computeResidual(r)
    const st  = r.status || r.st || 'Open'
    return {
      ...r,
      _res:  res,
      _inh:  r.inherent ?? (r.lik * r.imp),
      _lv:   level(res),
      _st:   st,
      _esc:  r.escalate || r.esc || false,
      _vname: r.vendor,
      _overdue: isOverdue(r.due) && st !== 'Mitigated' && st !== 'Closed' && st !== 'Accepted',
    }
  })

  // Vendor lookup maps
  const vendorByName = Object.fromEntries(vendors.map(v => [v.name.toLowerCase(), v]))
  const vendorById   = Object.fromEntries(vendors.map(v => [v.id, v]))

  // Per-vendor aggregation
  const byVendor = {}
  for (const v of vendors) {
    const vr = risks.filter(r => r._vname === v.name || r._vname === v.id)
    const maxRes = vr.length ? Math.max(...vr.map(r => r._res)) : 0
    byVendor[v.name] = {
      vendor: v,
      risks: vr,
      maxRes,
      maxLv: level(maxRes),
      open: vr.filter(r => r._st === 'Open' || r._st === 'In Progress'),
      esc:  vr.filter(r => r._esc),
      vh:   vr.filter(r => r._lv === 'Very High'),
      h:    vr.filter(r => r._lv === 'High'),
      overdue: vr.filter(r => r._overdue),
    }
  }

  // IRQ enriched
  const irq = rawIRQ.map(q => {
    const comp = irqComposite(q)
    const vname = vendors.find(v => v.id === q.vendor)?.name || q.vendor
    return { ...q, composite: comp, lv: irqLevel(comp), vname }
  })

  // Issues enriched
  const issuesEnriched = issues.map(i => {
    const vname = vendorById[i.vendor]?.name || i.vendor || ''
    return { ...i, _vname: vname, _overdue: isOverdue(i.due) && i.st !== 'Closed' }
  })

  // KRI status
  const krisEnriched = kris.map(k => ({
    ...k,
    _status: k.val >= k.crit ? 'Breached' : k.val >= k.warn ? 'Warning' : 'Normal',
  }))

  // Appetite breaches
  const LEVEL_ORDER = { 'Very High': 5, 'High': 4, 'Moderate': 3, 'Low': 2, 'Very Low': 1 }
  const appetiteBreaches = appetite.map(a => {
    const catRisks = risks.filter(r => r.cat === a.cat && (r._st === 'Open' || r._st === 'In Progress'))
    const maxActual = catRisks.length ? Math.max(...catRisks.map(r => r._res)) : 0
    const actualLv  = level(maxActual)
    const breach    = (LEVEL_ORDER[actualLv] || 0) > (LEVEL_ORDER[a.resMax] || 0)
    return { ...a, actualLv, maxActual, breach, catRisks }
  }).filter(a => a.cat)

  return {
    vendors, risks, irq, issues: issuesEnriched, kris: krisEnriched,
    assessments, appetite: appetiteBreaches, incidents,
    byVendor, vendorByName, vendorById, today,
  }
}

// ─── Answer builders ──────────────────────────────────────────────────────────

function b(s)  { return `**${s}**` }  // bold
function li(s) { return `• ${s}` }
function num(n, singular, plural) { return `${b(n)} ${n === 1 ? singular : plural}` }

function levelEmoji(lv) {
  return { 'Very High':'🔴', 'High':'🟠', 'Moderate':'🟡', 'Low':'🔵', 'Very Low':'🟢' }[lv] || '⚪'
}

// ── Overall risk register summary ─────────────────────────────────────────────
function riskRegisterSummary({ risks, vendors }) {
  const total   = risks.length
  const open    = risks.filter(r => r._st === 'Open').length
  const inProg  = risks.filter(r => r._st === 'In Progress').length
  const mitig   = risks.filter(r => r._st === 'Mitigated' || r._st === 'Closed').length
  const vh      = risks.filter(r => r._lv === 'Very High').length
  const h       = risks.filter(r => r._lv === 'High').length
  const esc     = risks.filter(r => r._esc).length
  const overdue = risks.filter(r => r._overdue).length

  const topRisks = [...risks].sort((a, b) => b._res - a._res).slice(0, 3)

  return [
    `${b('Risk Register Summary')} — ${total} risks across ${vendors.length} vendors`,
    '',
    `By level: 🔴 Very High: ${vh}  🟠 High: ${h}  🟡 Moderate: ${risks.filter(r=>r._lv==='Moderate').length}  🔵 Low: ${risks.filter(r=>r._lv==='Low').length}  🟢 Very Low: ${risks.filter(r=>r._lv==='Very Low').length}`,
    `By status: Open: ${open}  In Progress: ${inProg}  Mitigated/Closed: ${mitig}  Accepted: ${risks.filter(r=>r._st==='Accepted').length}`,
    '',
    esc > 0 ? `⚠️  ${b(esc + ' risk(s)')} flagged for escalation · ${b(overdue + ' risk(s)')} past due date` : `✅ No risks currently flagged for escalation`,
    '',
    `${b('Top 3 by residual score:')}`,
    ...topRisks.map(r => li(`${b(r.name)} — ${r._vname} · ${r._lv} (${r._res}/25) · ${r._st}`)),
  ].join('\n')
}

// ── Very High risks ───────────────────────────────────────────────────────────
function veryHighRisks({ risks, vendors }) {
  const vh = risks.filter(r => r._lv === 'Very High').sort((a,b) => b._res - a._res)
  if (!vh.length) {
    return `✅ ${b('No Very High residual risks')} are currently in the register. All risks are rated High or below.\n\nHighest current risk: ${(() => { const top = risks.slice().sort((a,b) => b._res - a._res)[0]; return top ? `${b(top.name)} — ${top._lv} (${top._res}/25)` : 'None' })()}`
  }
  const lines = [
    `🔴 ${num(vh.length, 'Very High residual risk', 'Very High residual risks')} in the register:`,
    '',
    ...vh.map(r => li(`${b(r.name)}\n   Vendor: ${r._vname} · Residual: ${r._res}/25 · Status: ${r._st}${r._esc ? ' · ⚠️ ESCALATED' : ''}`)),
    '',
    `These require ${b('immediate executive review')}. TPRM leadership should be briefed within 5 business days.`,
  ]
  return lines.join('\n')
}

// ── Escalated risks ───────────────────────────────────────────────────────────
function escalatedRisks({ risks, vendors, vendorByName }) {
  const esc = risks.filter(r => r._esc).sort((a,b) => b._res - a._res)
  // Also include Very High + Tier 1 High risks not already flagged
  const autoEsc = risks.filter(r => {
    if (r._esc) return false
    if (r._lv === 'Very High') return true
    const v = vendorByName[r._vname?.toLowerCase()]
    return v?.tier === 'Tier 1' && r._lv === 'High'
  })

  if (!esc.length && !autoEsc.length) {
    return `✅ No risks are currently flagged for escalation.`
  }

  const lines = [`${b('Escalation Report')} — ${esc.length + autoEsc.length} risk(s) require senior attention\n`]
  if (esc.length) {
    lines.push(`${b('Explicitly Escalated:')}`)
    esc.forEach((r, i) => {
      lines.push(`${i+1}. ${b(r.name)}\n   ${r._vname} · ${r._lv} (${r._res}/25) · ${r._st} · Due: ${r.due || '—'}`)
    })
  }
  if (autoEsc.length) {
    lines.push(`\n${b('Auto-escalated (Very High or Tier-1 High):')}`)
    autoEsc.forEach((r, i) => {
      lines.push(`${i+1}. ${b(r.name)}\n   ${r._vname} · ${r._lv} (${r._res}/25) · ${r._st}`)
    })
  }
  lines.push('\nAll escalated risks must be reviewed at the next TPRM leadership meeting and signed off by the appropriate risk owner.')
  return lines.join('\n')
}

// ── IRQ summary ───────────────────────────────────────────────────────────────
function irqSummary({ irq, vendors }) {
  const scored = irq.filter(q => q.st === 'Scored').sort((a,b) => b.composite - a.composite)
  if (!scored.length) return `No IRQ assessments have been scored yet.`
  const avg = (scored.reduce((s,q) => s + q.composite, 0) / scored.length).toFixed(2)
  const high = scored.filter(q => q.composite >= 3.5).length
  const lines = [
    `${b('IRQ Composite Scores')} — ${scored.length} vendors scored · Portfolio average: ${b(avg)} (${irqLevel(+avg)})`,
    high > 0 ? `⚠️  ${b(high)} vendor(s) rated High or above on intrinsic risk` : '',
    '',
    ...scored.map(q => {
      const em = levelEmoji(q.lv)
      return li(`${em} ${b(q.vname)} — ${b(q.composite.toFixed(2))} (${q.lv}) · Sec ${q.sec}/5 · Priv ${q.priv}/5 · BCM ${q.bcm}/5 · Fin ${q.fin}/5`)
    }),
  ]
  return lines.filter(l => l !== '').join('\n')
}

// ── Issues summary ────────────────────────────────────────────────────────────
function issuesSummary({ issues }) {
  if (!issues.length) return `No issues have been logged in the Issue Tracker yet.`
  const byPri = { Critical:[], High:[], Medium:[], Low:[] }
  for (const i of issues) { (byPri[i.pr] || byPri.Low).push(i) }
  const overdue = issues.filter(i => i._overdue)
  const open    = issues.filter(i => i.st !== 'Closed')

  const lines = [
    `${b('Issue Tracker')} — ${num(open.length, 'open issue', 'open issues')} · ${issues.length} total`,
    '',
  ]
  for (const [pri, items] of Object.entries(byPri)) {
    if (!items.length) continue
    const em = { Critical:'🔴', High:'🟠', Medium:'🟡', Low:'🔵' }[pri] || '⚪'
    lines.push(`${em} ${b(pri + ':')} ${items.length}`)
    items.slice(0, 2).forEach(i => lines.push(`   • ${i.name} — ${i._vname || i.vendor} · ${i.st}${isOverdue(i.due) && i.st !== 'Closed' ? ' · ⚠️ OVERDUE' : ''}`))
    if (items.length > 2) lines.push(`   + ${items.length - 2} more`)
  }
  if (overdue.length) {
    lines.push(`\n⚠️  ${b(overdue.length + ' issue(s) overdue:')}`)
    overdue.forEach(i => lines.push(li(`${i.name} — due ${i.due} · ${i._vname || i.vendor}`)))
    lines.push('\nImmediate escalation recommended for overdue Critical items.')
  } else {
    lines.push('\n✅ No issues are currently overdue.')
  }
  return lines.join('\n')
}

// ── KRI summary ───────────────────────────────────────────────────────────────
function kriSummary({ kris }) {
  if (!kris.length) return `No KRIs have been configured yet.`
  const breached = kris.filter(k => k._status === 'Breached')
  const warning  = kris.filter(k => k._status === 'Warning')
  const normal   = kris.filter(k => k._status === 'Normal')

  const lines = [
    `${b('KRI Monitor')} — ${kris.length} indicators · ${breached.length} breached · ${warning.length} at warning`,
    '',
  ]
  if (breached.length) {
    lines.push(`🔴 ${b('Breached (≥ critical threshold):')}`)
    breached.forEach(k => lines.push(li(`${b(k.name)} — ${k.val}${k.unit} (critical: ${k.crit}${k.unit}) · ${k.trend}`)))
  }
  if (warning.length) {
    lines.push(`\n🟡 ${b('At Warning Level:')}`)
    warning.forEach(k => lines.push(li(`${b(k.name)} — ${k.val}${k.unit} (warn: ${k.warn}${k.unit}) · ${k.trend}`)))
  }
  if (normal.length) {
    lines.push(`\n✅ ${b('Within Threshold:')}`)
    normal.forEach(k => lines.push(li(`${k.name} — ${k.val}${k.unit}`)))
  }
  return lines.join('\n')
}

// ── Assessment summary ────────────────────────────────────────────────────────
function assessmentSummary({ assessments }) {
  if (!assessments.length) {
    return `No assessments have been created yet. Use the Assessments page to set up vendor questionnaires.`
  }
  const STAGES = ['Not Started','Questionnaire Sent','In Progress','Under Review','Approved','Overdue']
  const bySt = {}
  STAGES.forEach(s => { bySt[s] = assessments.filter(a => a.stage === s) })
  const overdue = assessments.filter(a => a.stage === 'Overdue' || isOverdue(a.due) && a.stage !== 'Approved')
  const lines = [
    `${b('Assessment Pipeline')} — ${assessments.length} active assessments`,
    '',
    ...STAGES.filter(s => bySt[s]?.length).map(s => {
      const em = { 'Not Started':'⚪','Questionnaire Sent':'🔵','In Progress':'🟡','Under Review':'🟠','Approved':'✅','Overdue':'🔴' }[s]
      const items = bySt[s]
      return `${em} ${b(s + ':')} ${items.length} — ${items.slice(0,3).map(a => a.vendor).join(', ')}${items.length > 3 ? `, +${items.length-3}` : ''}`
    }),
  ]
  if (overdue.length) {
    lines.push(`\n⚠️  ${b(overdue.length + ' overdue:')} ${overdue.map(a => a.vendor).join(', ')}`)
  }
  return lines.join('\n')
}

// ── Risk appetite ─────────────────────────────────────────────────────────────
function appetiteSummary({ appetite }) {
  if (!appetite.length) return `No risk appetite thresholds have been configured.`
  const breached = appetite.filter(a => a.breach)
  const lines = [
    `${b('Risk Appetite Status')} — ${appetite.length} categories · ${b(breached.length + ' breach(es)')}`,
    '',
    ...appetite.map(a => {
      const em = a.breach ? '🔴' : '✅'
      return `${em} ${b(a.cat || a.category || a.label || 'Category')} — Limit: ${a.resMax} · Actual: ${a.actualLv}${a.breach ? ' ⚠️ BREACH' : ''}`
    }),
  ]
  if (breached.length) {
    lines.push(`\n⚠️  Appetite breaches require a risk owner response and documented acceptance or remediation plan.`)
  }
  return lines.join('\n')
}

// ── Tier 1 vendors ────────────────────────────────────────────────────────────
function tier1Summary({ vendors, byVendor, irq }) {
  const t1 = vendors.filter(v => v.tier === 'Tier 1')
  if (!t1.length) return `No Tier 1 vendors are currently in the register.`
  const lines = [
    `${b('Tier 1 Vendor Profile')} — ${t1.length} critical vendors`,
    '',
    ...t1.map(v => {
      const vd  = byVendor[v.name]
      const iq  = irq.find(q => q.vendor === v.id)
      const lv  = vd.maxLv
      const em  = levelEmoji(lv)
      return [
        `${em} ${b(v.name)} — ${v.cat} · ${v.st}`,
        `   Risks: ${vd.risks.length} total · Open: ${vd.open.length} · Escalated: ${vd.esc.length}`,
        `   Max residual: ${lv} (${vd.maxRes}/25) · IRQ: ${iq ? iq.composite.toFixed(2) + ' (' + iq.lv + ')' : 'Pending'}`,
      ].join('\n')
    }),
  ]
  return lines.join('\n')
}

// ── Vendor-specific deep-dive ─────────────────────────────────────────────────
function vendorDetail(v, { byVendor, irq, issues, assessments }) {
  const vd  = byVendor[v.name]
  const iq  = irq.find(q => q.vendor === v.id)
  const vis = issues.filter(i => i._vname === v.name || i.vendor === v.id)
  const va  = assessments.filter(a => a.vendor === v.name)

  const lines = [
    `${b(v.name)} — ${v.cat} · ${v.tier} · ${v.st}`,
    `Service: ${v.svc || '—'} · Data class: ${v.dc} · Contract: ${v.cs || '—'} to ${v.ce || '—'} · Spend: ${fmt$(v.sp)}`,
    '',
    `${b('Risk Profile')} (${vd.risks.length} risks)`,
    `Max residual: ${vd.maxLv} (${vd.maxRes}/25) · Open: ${vd.open.length} · Escalated: ${vd.esc.length}`,
  ]
  if (vd.open.length) {
    lines.push('')
    vd.open.slice(0, 4).forEach(r => {
      lines.push(li(`${r._lv === 'Very High' || r._lv === 'High' ? levelEmoji(r._lv) + ' ' : ''}${b(r.name)} — ${r._lv} (${r._res}/25) · ${r._st}${r._overdue ? ' · ⚠️ OVERDUE' : ''}`))
    })
    if (vd.open.length > 4) lines.push(`  + ${vd.open.length - 4} more open risks`)
  } else {
    lines.push('✅ No open risks.')
  }

  if (iq) {
    lines.push('')
    lines.push(`${b('IRQ Score:')} ${iq.composite.toFixed(2)} (${iq.lv}) — Sec ${iq.sec}/5 · Priv ${iq.priv}/5 · BCM ${iq.bcm}/5 · Fin ${iq.fin}/5`)
    if (iq.notes) lines.push(`Notes: ${iq.notes}`)
  } else {
    lines.push('\nIRQ: Pending / Not in scope')
  }

  if (vis.length) {
    lines.push('')
    const openVis = vis.filter(i => i.st !== 'Closed')
    lines.push(`${b('Issues:')} ${openVis.length} open · ${vis.filter(i => i._overdue).length} overdue`)
    openVis.slice(0, 3).forEach(i => lines.push(li(`${i.name} — ${i.pr} · ${i.st}${i._overdue ? ' ⚠️' : ''}`)))
  }

  if (va.length) {
    lines.push('')
    const latest = va[va.length - 1]
    lines.push(`${b('Latest Assessment:')} ${latest.type || 'Annual'} · ${latest.stage} · Due: ${latest.due || '—'}`)
  }

  return lines.join('\n')
}

// ── Risks by category ─────────────────────────────────────────────────────────
function catRisks(cat, { risks }) {
  const cr = risks.filter(r => r.cat === cat || r.cat?.includes(cat)).sort((a,b) => b._res - a._res)
  if (!cr.length) return `No ${b(cat)} risks are currently in the register.`
  const open = cr.filter(r => r._st === 'Open' || r._st === 'In Progress')
  const vh   = cr.filter(r => r._lv === 'Very High')
  const h    = cr.filter(r => r._lv === 'High')

  const lines = [
    `${b(cat + ' Risks')} — ${cr.length} total · ${open.length} active · 🔴 ${vh.length} Very High · 🟠 ${h.length} High`,
    '',
    ...cr.map(r => li(`${levelEmoji(r._lv)} ${b(r.name)}\n   ${r._vname} · ${r._lv} (${r._res}/25) · ${r._st} · ${r.treat}${r._overdue ? ' · ⚠️ OVERDUE' : ''}`)),
  ]
  return lines.join('\n')
}

// ── Overdue items across all modules ─────────────────────────────────────────
function overdueItems({ risks, issues, assessments, today }) {
  const overdueRisks  = risks.filter(r => r._overdue)
  const overdueIssues = issues.filter(i => i._overdue)
  const overdueAssess = assessments.filter(a => isOverdue(a.due) && a.stage !== 'Approved')

  const total = overdueRisks.length + overdueIssues.length + overdueAssess.length
  if (!total) return `✅ ${b('No overdue items')} across the platform as of ${today}.`

  const lines = [
    `⚠️  ${b(total + ' overdue items')} across the platform as of ${today}`,
    '',
  ]
  if (overdueRisks.length) {
    lines.push(`🔴 ${b('Risks (' + overdueRisks.length + '):')}`)
    overdueRisks.forEach(r => lines.push(li(`${r.name} — ${r._vname} · due ${r.due}`)))
  }
  if (overdueIssues.length) {
    lines.push(`\n🟠 ${b('Issues (' + overdueIssues.length + '):')}`)
    overdueIssues.forEach(i => lines.push(li(`${i.name} — ${i._vname || i.vendor} · due ${i.due}`)))
  }
  if (overdueAssess.length) {
    lines.push(`\n🟡 ${b('Assessments (' + overdueAssess.length + '):')}`)
    overdueAssess.forEach(a => lines.push(li(`${a.vendor} — ${a.stage} · due ${a.due}`)))
  }
  return lines.join('\n')
}

// ── SBR performance summary ────────────────────────────────────────────────────
function sbrSummary() {
  const sorted  = [...SBR_STATIC].sort((a,b) => a.score - b.score)
  const below3  = sorted.filter(s => s.score < 3.0)
  const high    = sorted.filter(s => s.risk === 'High' || s.risk === 'Very High')
  const avg     = (SBR_STATIC.reduce((s,x) => s + x.score, 0) / SBR_STATIC.length).toFixed(2)

  const lines = [
    `${b('Supplier Business Review')} — ${SBR_STATIC.length} suppliers scored · Portfolio average: ${b(avg + '/5.0')}`,
    '',
    `${b('Rated High / Very High risk:')} ${high.length}`,
    ...high.map(s => li(`${s.risk === 'Very High' ? '🔴' : '🟠'} ${b(s.name)} — ${s.score.toFixed(2)}/5.0 · ${s.pf} · ${s.risk}`)),
    '',
    `${b('Below 3.0 (performance concern):')} ${below3.length}`,
    ...below3.map(s => li(`${b(s.name)} — ${s.score.toFixed(2)}/5.0 · ${s.pf}`)),
    '',
    below3.length > 0
      ? `Recommend issuing ${b('Performance Improvement Plans')} for all suppliers below 3.0 within 30 days.`
      : `✅ All suppliers are performing at 3.0 or above.`
  ]
  return lines.join('\n')
}

// ── Vendor summary ────────────────────────────────────────────────────────────
function vendorSummary({ vendors, byVendor }) {
  const active      = vendors.filter(v => v.st === 'Active')
  const review      = vendors.filter(v => v.st === 'Under Review')
  const tier1       = vendors.filter(v => v.tier === 'Tier 1')
  const highRisk    = vendors.filter(v => byVendor[v.name]?.maxLv === 'Very High' || byVendor[v.name]?.maxLv === 'High')

  const byTier = ['Tier 1','Tier 2','Tier 3','Tier 4'].map(t => ({
    t, count: vendors.filter(v => v.tier === t).length
  })).filter(t => t.count)

  const lines = [
    `${b('Vendor Portfolio')} — ${vendors.length} vendors across ${[...new Set(vendors.map(v=>v.cat))].length} categories`,
    '',
    `${b('By Tier:')} ${byTier.map(t => `${t.t}: ${t.count}`).join(' · ')}`,
    `${b('By Status:')} Active: ${active.length} · Under Review: ${review.length} · Inactive: ${vendors.length - active.length - review.length}`,
    '',
    highRisk.length
      ? `⚠️  ${b(highRisk.length + ' vendor(s)')} carry High or Very High max residual risk:`
      : `✅ No vendors carry High or Very High max residual risk.`,
    ...highRisk.map(v => {
      const vd = byVendor[v.name]
      return li(`${levelEmoji(vd.maxLv)} ${b(v.name)} — ${v.tier} · ${v.cat} · Max: ${vd.maxLv} (${vd.maxRes}/25)`)
    }),
  ]
  if (review.length) {
    lines.push(`\n${b('Under Review:')} ${review.map(v => v.name).join(', ')}`)
  }
  return lines.join('\n')
}

// ── Concentration summary ─────────────────────────────────────────────────────
function concentrationSummary({ vendors }) {
  const cats = {}
  for (const v of vendors.filter(v => v.st === 'Active')) {
    cats[v.cat] = (cats[v.cat] || 0) + 1
  }
  const total   = vendors.filter(v => v.st === 'Active').length
  const sorted  = Object.entries(cats).sort((a,b) => b[1] - a[1])
  const top     = sorted.filter(([,n]) => n / total >= 0.25)
  const lines   = [
    `${b('Vendor Concentration')} — ${total} active vendors across ${sorted.length} categories`,
    '',
    ...sorted.map(([cat, n]) => {
      const pct  = Math.round(n / total * 100)
      const flag = pct >= 40 ? ' ⚠️ HIGH CONCENTRATION' : pct >= 25 ? ' · Note' : ''
      return li(`${b(cat)}: ${n} vendors (${pct}%)${flag}`)
    }),
  ]
  if (top.length) {
    lines.push(`\n⚠️  Categories exceeding 25% concentration may pose business continuity risk if a major vendor in that category fails.`)
  }
  return lines.join('\n')
}

// ── Default / capabilities ────────────────────────────────────────────────────
function defaultAnswer({ risks, vendors, issues, kris, assessments }) {
  const vh      = risks.filter(r => r._lv === 'Very High').length
  const esc     = risks.filter(r => r._esc).length
  const openIss = issues.filter(i => i.st !== 'Closed').length
  const kriWarn = kris.filter(k => k._status !== 'Normal').length

  return [
    `I'm your TPRM AI assistant with live access to your platform data. Here's a quick snapshot:`,
    '',
    `🔴 ${b(vh)} Very High residual risk(s)  ·  ⚠️ ${b(esc)} escalated  ·  🛠 ${b(openIss)} open issue(s)  ·  📊 ${b(kriWarn)} KRI(s) at warning`,
    `📁 ${b(vendors.length)} vendors  ·  ${b(risks.length)} risks in register  ·  ${b(assessments.length)} active assessments`,
    '',
    `${b('You can ask me:')}`,
    `• "Which vendors have Very High residual risk?"`,
    `• "Show me all escalated risks"`,
    `• "Give me a summary of open issues"`,
    `• "What are the KRI breaches?"`,
    `• "Tell me about Amazon Web Services"`,
    `• "Summarize Cybersecurity risks"`,
    `• "Which suppliers scored below 3.0 on SBR?"`,
    `• "What's overdue across the platform?"`,
    `• "Show me Tier 1 vendors"`,
    `• "Is there a risk appetite breach?"`,
  ].join('\n')
}

// ─── Main query dispatcher ────────────────────────────────────────────────────

export function query(question, ctx) {
  const q = question.toLowerCase().trim()

  // Vendor-specific — check if a vendor name appears in the question
  const matchedVendor = ctx.vendors.find(v =>
    q.includes(v.name.toLowerCase()) ||
    v.name.toLowerCase().split(' ').slice(0, 2).some(word => word.length > 4 && q.includes(word))
  )
  if (matchedVendor) return vendorDetail(matchedVendor, ctx)

  // Intent matching — ordered by specificity
  if (/very high|most critical|highest risk|top risk/.test(q))                               return veryHighRisks(ctx)
  if (/escalat|above threshold|immediate/.test(q))                                           return escalatedRisks(ctx)
  if (/irq|intrinsic risk quotient|questionnaire score|composite score/.test(q))             return irqSummary(ctx)
  if (/kri|key risk indicator|indicator breach|kri breach/.test(q))                          return kriSummary(ctx)
  if (/appetite|risk tolerance|threshold breach|above appetite/.test(q))                     return appetiteSummary(ctx)
  if (/assessment|questionnaire due|pending questionnaire/.test(q))                          return assessmentSummary(ctx)
  if (/sbr|supplier performance|performance score|below 3|below 3\.0|supplier score/.test(q)) return sbrSummary(ctx)
  if (/overdue|past due|late item/.test(q))                                                  return overdueItems(ctx)
  if (/tier.?1|critical vendor/.test(q))                                                     return tier1Summary(ctx)
  if (/issue|remediat|action item/.test(q))                                                  return issuesSummary(ctx)
  if (/cyber|encryption|patch|cve|vulnerability/.test(q))                                   return catRisks('Cybersecurity', ctx)
  if (/pci|compliance risk|regulatory gap|gdpr compliance|dora|audit finding/.test(q))      return catRisks('Compliance', ctx)
  if (/financial risk|credit risk|insolvency|payment risk/.test(q))                         return catRisks('Financial', ctx)
  if (/privacy|data protection|personal data|data risk/.test(q))                            return catRisks('Privacy & Data', ctx)
  if (/continuity|disaster recovery|bcm|resilience|availability/.test(q))                   return catRisks('Business Continuity', ctx)
  if (/operational|sla|delivery|service risk/.test(q))                                      return catRisks('Operational', ctx)
  if (/concentration|single vendor|vendor depend/.test(q))                                  return concentrationSummary(ctx)
  if (/vendor|supplier|third.?party|portfolio/.test(q))                                     return vendorSummary(ctx)
  if (/risk register|open risk|all risk|risk summary|how many risk|risk count/.test(q))     return riskRegisterSummary(ctx)

  return defaultAnswer(ctx)
}
