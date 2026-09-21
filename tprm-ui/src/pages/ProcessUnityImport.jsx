import { useState, useRef, useCallback } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { VENDORS_INIT, RISKS_SEED } from '@/lib/seedData'
import { cn } from '@/lib/utils'
import {
  Upload, FileText, Check, X, ChevronRight, Download, RefreshCcw,
  AlertTriangle, ArrowRight, Database, Link2
} from 'lucide-react'

// ─── Import schemas ──────────────────────────────────────────────────────────

const IMPORT_SCHEMAS = {
  vendors: {
    label: 'Vendor Profiles',
    icon: Database,
    desc: 'Import or update vendor records including tier, category, contact, and contract data.',
    storageKey: 'tprm:vendors',
    matchKey: r => r.name?.trim().toLowerCase(),
    idPrefix: 'pu_v_',
    fields: [
      { key:'name',  label:'Vendor Name',         required:true,  hints:['vendor name','name','company','supplier','organization'] },
      { key:'tier',  label:'Tier',                required:false, hints:['tier','criticality','risk tier','vendor tier'] },
      { key:'cat',   label:'Category',            required:false, hints:['category','type','industry','segment','vendor category'] },
      { key:'st',    label:'Status',              required:false, hints:['status','vendor status','relationship status'] },
      { key:'con',   label:'Contact Name',        required:false, hints:['contact','contact name','relationship manager','primary contact'] },
      { key:'email', label:'Contact Email',       required:false, hints:['email','contact email','email address'] },
      { key:'cs',    label:'Contract Start',      required:false, hints:['contract start','start date','engagement start','contract from'] },
      { key:'ce',    label:'Contract End',        required:false, hints:['contract end','end date','expiry','contract expiry','contract to'] },
      { key:'sp',    label:'Annual Spend ($)',    required:false, hints:['spend','annual spend','contract value','value','amount'] },
      { key:'dc',    label:'Data Classification', required:false, hints:['data classification','data class','classification','data type'] },
      { key:'svc',   label:'Services',            required:false, hints:['services','service description','description','scope'] },
    ],
    sample: `Vendor Name,Category,Tier,Status,Contact Name,Contact Email,Contract Start,Contract End,Annual Spend,Data Classification,Services
CloudSystems Inc,Cloud / SaaS,Tier 1,Active,Alice Nguyen,alice@cloudsystems.io,2024-01-15,2026-12-31,250000,Restricted,Primary cloud infrastructure
DataSecure LLC,Technology,Tier 1,Active,Bob Martinez,bob@datasecure.com,2023-06-01,2026-05-31,120000,Confidential,Data security monitoring`,
  },

  risks: {
    label: 'Risks & Findings',
    icon: AlertTriangle,
    desc: 'Import risk register entries and assessment findings with likelihood, impact, and treatment data.',
    storageKey: 'tprm:risks',
    matchKey: r => `${r.name?.trim().toLowerCase()}|${r.vendor?.trim().toLowerCase()}`,
    idPrefix: 'pu_r_',
    fields: [
      { key:'name',  label:'Risk / Finding Name', required:true,  hints:['risk name','finding','issue','name','title','risk title'] },
      { key:'vendor',label:'Vendor',              required:true,  hints:['vendor','supplier','vendor name','third party'] },
      { key:'cat',   label:'Category / Domain',  required:false, hints:['category','domain','risk type','risk domain','risk category'] },
      { key:'lik',   label:'Likelihood (1–5)',    required:false, hints:['likelihood','probability','lik','likelihood score'] },
      { key:'imp',   label:'Impact (1–5)',        required:false, hints:['impact','severity','imp','impact score'] },
      { key:'ctrl',  label:'Controls (0–4)',      required:false, hints:['controls','control effectiveness','ctrl','control score'] },
      { key:'treat', label:'Treatment',           required:false, hints:['treatment','response','risk response','risk treatment'] },
      { key:'st',    label:'Status',              required:false, hints:['status','risk status','remediation status'] },
      { key:'owner', label:'Owner',               required:false, hints:['owner','risk owner','assigned to','assignee','responsible'] },
      { key:'due',   label:'Due Date',            required:false, hints:['due','due date','target date','remediation date','target'] },
      { key:'desc',  label:'Description',         required:false, hints:['description','detail','details','notes','risk description'] },
      { key:'plan',  label:'Remediation Plan',    required:false, hints:['remediation','plan','remediation plan','action plan','mitigation plan'] },
    ],
    sample: `Risk Name,Vendor,Category,Likelihood,Impact,Controls,Treatment,Status,Owner,Due Date,Description,Remediation Plan
Unpatched software vulnerabilities,CloudSystems Inc,Cybersecurity,4,5,1,Mitigate,Open,S. Kim,2026-09-15,Unpatched CVEs in core API infrastructure,Require patch schedule within 30 days
PCI-DSS compliance gap,GlobalPay Corp,Compliance,4,4,0,Mitigate,Open,R. Brown,2026-09-01,Failed last PCI audit on network segmentation,Issue remediation notice`,
  },

  assessments: {
    label: 'Assessments',
    icon: FileText,
    desc: 'Import assessment lifecycle data — stages, due dates, assignees, and completion status.',
    storageKey: 'tprm:assessments',
    matchKey: r => `${r.vendor?.trim().toLowerCase()}|${r.type?.trim().toLowerCase()}`,
    idPrefix: 'pu_a_',
    fields: [
      { key:'vendor',   label:'Vendor',          required:true,  hints:['vendor','supplier','vendor name','third party'] },
      { key:'type',     label:'Assessment Type', required:false, hints:['type','assessment type','questionnaire type','assessment'] },
      { key:'stage',    label:'Stage / Status',  required:false, hints:['stage','status','assessment status','workflow stage','phase'] },
      { key:'due',      label:'Due Date',        required:false, hints:['due','due date','target date','completion date'] },
      { key:'assignee', label:'Assigned To',     required:false, hints:['assigned to','assignee','analyst','owner','responsible'] },
      { key:'notes',    label:'Notes',           required:false, hints:['notes','comments','description','remarks'] },
    ],
    sample: `Vendor,Assessment Type,Stage,Due Date,Assigned To,Notes
CloudSystems Inc,Annual Security Review,In Progress,2026-10-01,S. Kim,BCM gaps to address
GlobalPay Corp,PCI Compliance Assessment,Questionnaire Sent,2026-09-20,R. Brown,Awaiting network segmentation evidence`,
  },

}

// ─── Normalisers ─────────────────────────────────────────────────────────────

function normTier(v) {
  if (!v) return 'Tier 3'
  const s = String(v).toLowerCase().trim()
  if (s.includes('1') || s === 'critical') return 'Tier 1'
  if (s.includes('2') || s === 'high')     return 'Tier 2'
  if (s.includes('3') || s === 'medium')   return 'Tier 3'
  if (s.includes('4') || s === 'low')      return 'Tier 4'
  return 'Tier 3'
}
function normVendorSt(v) {
  if (!v) return 'Active'
  const s = String(v).toLowerCase().trim()
  if (s.includes('review')) return 'Under Review'
  if (s.includes('inactiv') || s.includes('offboard') || s.includes('terminated')) return 'Inactive'
  return 'Active'
}
function normRiskSt(v) {
  if (!v) return 'Open'
  const s = String(v).toLowerCase().trim()
  if (s.includes('progress') || s.includes('ongoing') || s.includes('remediat')) return 'In Progress'
  if (s.includes('mitigat') || s.includes('resolv') || s.includes('clos') || s.includes('complet')) return 'Mitigated'
  if (s.includes('accept')) return 'Accepted'
  return 'Open'
}
function normTreat(v) {
  if (!v) return 'Mitigate'
  const s = String(v).toLowerCase().trim()
  if (s.includes('transfer') || s.includes('insur') || s.includes('share')) return 'Transfer'
  if (s.includes('accept'))                                                   return 'Accept'
  if (s.includes('avoid') || s.includes('terminat'))                         return 'Avoid'
  return 'Mitigate'
}
function normStage(v) {
  if (!v) return 'Not Started'
  const s = String(v).toLowerCase().trim()
  if (s.includes('sent') || s.includes('dispatch') || s.includes('issued'))           return 'Questionnaire Sent'
  if (s.includes('progress') || s.includes('ongoing') || s.includes('started'))       return 'In Progress'
  if (s.includes('review') || s.includes('under review'))                             return 'Under Review'
  if (s.includes('approv') || s.includes('complet') || s.includes('clos') || s.includes('done')) return 'Approved'
  if (s.includes('overdue') || s.includes('late'))                                    return 'Overdue'
  return 'Not Started'
}
function normInt(v, fallback = 3) {
  const n = parseInt(v)
  return isNaN(n) ? fallback : Math.min(5, Math.max(0, n))
}

function normaliseRow(type, raw) {
  if (type === 'vendors') {
    return {
      ...raw,
      tier: normTier(raw.tier),
      st:   normVendorSt(raw.st),
      sp:   raw.sp ? Number(String(raw.sp).replace(/[^0-9.]/g, '')) || '' : '',
    }
  }
  if (type === 'risks') {
    return {
      ...raw,
      lik:  normInt(raw.lik, 3),
      imp:  normInt(raw.imp, 3),
      ctrl: normInt(raw.ctrl, 0),
      treat: normTreat(raw.treat),
      st:    normRiskSt(raw.st),
      escalate: false,
      desc: raw.desc || '',
      plan: raw.plan || '',
      ev:   '',
    }
  }
  if (type === 'assessments') {
    return { ...raw, stage: normStage(raw.stage), history: [] }
  }
  return raw
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  if (lines.length < 2) return { headers: [], rows: [] }
  function parseLine(line) {
    const result = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
        else inQ = !inQ
      } else if (ch === ',' && !inQ) {
        result.push(cur.trim()); cur = ''
      } else cur += ch
    }
    result.push(cur.trim())
    return result
  }
  const headers = parseLine(lines[0])
  const rows = lines.slice(1).filter(l => l.trim()).map(l => {
    const vals = parseLine(l)
    const obj = {}
    headers.forEach((h, i) => { obj[h] = vals[i] ?? '' })
    return obj
  })
  return { headers, rows }
}

// ─── Auto-detect column mapping ───────────────────────────────────────────────

function autoDetect(csvHeaders, hints) {
  const norm = h => h.toLowerCase().trim()
  for (const hint of hints) {
    const exact = csvHeaders.find(h => norm(h) === hint)
    if (exact) return exact
  }
  for (const hint of hints) {
    const partial = csvHeaders.find(h => norm(h).includes(hint) || hint.includes(norm(h)))
    if (partial) return partial
  }
  return ''
}

// ─── Merge helpers ────────────────────────────────────────────────────────────

function mergeData(type, existing, mapped, schema) {
  const inserted = [], updated = [], skipped = []
  const existingMap = new Map(existing.map(r => [schema.matchKey(r), r]))

  for (const raw of mapped) {
    if (schema.fields.filter(f => f.required).some(f => !raw[f.key]?.trim())) {
      skipped.push(raw); continue
    }
    const normalised = normaliseRow(type, raw)
    const key = schema.matchKey(normalised)
    if (existingMap.has(key)) {
      const old = existingMap.get(key)
      // For assessments: append history entry if stage changed
      if (type === 'assessments' && old.stage !== normalised.stage) {
        normalised.history = [...(old.history || []), {
          date: new Date().toISOString().split('T')[0],
          note: 'Stage updated via ProcessUnity import',
          from: old.stage,
          to:   normalised.stage,
        }]
      }
      existingMap.set(key, { ...old, ...normalised, id: old.id })
      updated.push(normalised)
    } else {
      const newId = schema.idPrefix + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
      existingMap.set(key, { ...normalised, id: newId })
      inserted.push(normalised)
    }
  }
  return { result: [...existingMap.values()], inserted, updated, skipped }
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ['Upload', 'Map Columns', 'Preview', 'Import']

function StepBar({ step }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors',
            i < step  && 'bg-green-100 text-green-700',
            i === step && 'bg-[#0176d3] text-white',
            i > step  && 'bg-gray-100 text-gray-400',
          )}>
            {i < step ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
            {s}
          </div>
          {i < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 mx-0.5" />}
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProcessUnityImport() {
  const [importType, setImportType] = useState('vendors')
  const [step, setStep]             = useState(0)
  const [file, setFile]             = useState(null)
  const [csvHeaders, setCsvHeaders] = useState([])
  const [csvRows, setCsvRows]       = useState([])
  const [mapping, setMapping]       = useState({})
  const [results, setResults]       = useState(null)
  const [dragging, setDragging]     = useState(false)
  const fileRef = useRef()

  const [vendors,     setVendors]     = useLocalStorage('tprm:vendors',     VENDORS_INIT)
  const [risks,       setRisks]       = useLocalStorage('tprm:risks',       RISKS_SEED)
  const [assessments, setAssessments] = useLocalStorage('tprm:assessments', [])
  const [importLog,   setImportLog]   = useLocalStorage('tprm:import_log',  [])

  const schema = IMPORT_SCHEMAS[importType]

  function resetWizard(newType) {
    setImportType(newType)
    setStep(0); setFile(null); setCsvHeaders([]); setCsvRows([])
    setMapping({}); setResults(null)
  }

  function processFile(f) {
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = e => {
      const { headers, rows } = parseCSV(e.target.result)
      setCsvHeaders(headers)
      setCsvRows(rows)
      const auto = {}
      schema.fields.forEach(field => {
        auto[field.key] = autoDetect(headers, field.hints)
      })
      setMapping(auto)
      setStep(1)
    }
    reader.readAsText(f)
  }

  const onDrop = useCallback(e => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.csv')) processFile(f)
  }, [schema])

  function getMapped() {
    return csvRows.map(raw => {
      const row = {}
      schema.fields.forEach(f => {
        const col = mapping[f.key]
        row[f.key] = col ? (raw[col] || '') : ''
      })
      return row
    })
  }

  function doImport() {
    const mapped = getMapped()
    const getStore = () => {
      if (importType === 'vendors')     return vendors
      if (importType === 'risks')       return risks
      return assessments
    }
    const { result, inserted, updated, skipped } = mergeData(importType, getStore(), mapped, schema)
    if (importType === 'vendors')     setVendors(result)
    if (importType === 'risks')       setRisks(result)
    if (importType === 'assessments') setAssessments(result)

    const entry = {
      id:       'log_' + Date.now(),
      date:     new Date().toISOString().split('T')[0],
      type:     importType,
      label:    schema.label,
      filename: file?.name || 'unknown.csv',
      inserted: inserted.length,
      updated:  updated.length,
      skipped:  skipped.length,
    }
    setImportLog(prev => [entry, ...prev.slice(0, 49)])
    setResults({ inserted: inserted.length, updated: updated.length, skipped: skipped.length })
    setStep(3)
  }

  function downloadTemplate() {
    const blob = new Blob([schema.sample], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `processunity_${importType}_template.csv`
    a.click()
  }

  const mapped    = step >= 2 ? getMapped() : []
  const preview   = mapped.slice(0, 5)
  const hasRequired = schema.fields
    .filter(f => f.required)
    .every(f => mapping[f.key])

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[#0176d3]" />
            <h1 className="text-lg font-semibold text-gray-800">ProcessUnity Import</h1>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Upload a CSV export from ProcessUnity to sync data into the platform</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 text-xs border border-gray-200 rounded px-3 py-2 hover:bg-gray-50 text-gray-600"
        >
          <Download className="w-3.5 h-3.5" /> Download Template
        </button>
      </div>

      {/* Type selector */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(IMPORT_SCHEMAS).map(([key, s]) => {
          const Icon = s.icon
          return (
            <button
              key={key}
              onClick={() => resetWizard(key)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                importType === key
                  ? 'bg-[#0176d3] text-white border-[#0176d3]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Step bar */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
        <StepBar step={step} />
      </div>

      {/* ── Step 0: Upload ── */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700">
            <strong>{schema.label}:</strong> {schema.desc}
          </div>

          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileRef.current.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-3 cursor-pointer transition-all',
              dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            )}
          >
            <Upload className={cn('w-8 h-8', dragging ? 'text-blue-500' : 'text-gray-300')} />
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-700">Drop your CSV file here</div>
              <div className="text-xs text-gray-400 mt-0.5">or click to browse · CSV files only</div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => processFile(e.target.files[0])}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 mb-2">How to export from ProcessUnity</div>
            <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
              <li>Log in to ProcessUnity and navigate to the relevant module ({schema.label})</li>
              <li>Use the <strong>Export</strong> or <strong>Download</strong> button in the grid view</li>
              <li>Select <strong>CSV / Excel</strong> format and export all columns</li>
              <li>Upload the file here — column names are auto-detected</li>
            </ol>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
              <span className="text-[10px] text-gray-400">Don't have a file yet?</span>
              <button onClick={downloadTemplate} className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5">
                <Download className="w-3 h-3" /> Download sample template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Map Columns ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-semibold text-gray-700">Column Mapping</div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  File: <strong>{file?.name}</strong> · {csvRows.length} rows · {csvHeaders.length} columns detected
                </div>
              </div>
              <button onClick={() => resetWizard(importType)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <RefreshCcw className="w-3 h-3" /> Change file
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {schema.fields.map(field => (
                <div key={field.key} className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={mapping[field.key] || ''}
                    onChange={e => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className={cn(
                      'text-xs border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400',
                      mapping[field.key] ? 'border-green-300 bg-green-50/50' : 'border-gray-200'
                    )}
                  >
                    <option value="">— skip this field —</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {!hasRequired && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Map all required fields (*) before proceeding.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => { setStep(0); setFile(null) }} className="text-xs border border-gray-200 rounded px-4 py-2 hover:bg-gray-50">Back</button>
            <button
              disabled={!hasRequired}
              onClick={() => setStep(2)}
              className="text-xs bg-[#0176d3] text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              Preview <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Preview ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="text-xs font-semibold text-gray-700">Preview — first {Math.min(preview.length, 5)} of {csvRows.length} rows</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Review the mapped data before importing. Normalisations (e.g. tier format, status names) will be applied on import.</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {schema.fields.filter(f => mapping[f.key]).map(f => (
                      <th key={f.key} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className={cn('border-b border-gray-100', i % 2 === 1 && 'bg-gray-50/50')}>
                      {schema.fields.filter(f => mapping[f.key]).map(f => (
                        <td key={f.key} className="px-3 py-2 text-gray-700 max-w-[180px] truncate" title={row[f.key]}>
                          {row[f.key] || <span className="text-gray-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {csvRows.length > 5 && (
              <div className="px-4 py-2 text-[10px] text-gray-400 border-t border-gray-100">
                + {csvRows.length - 5} more rows not shown
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setStep(1)} className="text-xs border border-gray-200 rounded px-4 py-2 hover:bg-gray-50">Back</button>
            <button
              onClick={doImport}
              className="text-xs bg-[#0176d3] text-white rounded px-4 py-2 hover:bg-blue-700 flex items-center gap-1.5"
            >
              Import {csvRows.length} rows <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Results ── */}
      {step === 3 && results && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Import complete</div>
                <div className="text-xs text-gray-400">{schema.label} · {file?.name}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label:'Records Added',    value: results.inserted, color:'text-green-600',  bg:'bg-green-50'  },
                { label:'Records Updated',  value: results.updated,  color:'text-blue-600',   bg:'bg-blue-50'   },
                { label:'Rows Skipped',     value: results.skipped,  color:'text-amber-600',  bg:'bg-amber-50'  },
              ].map(s => (
                <div key={s.label} className={cn('rounded-lg p-4 text-center', s.bg)}>
                  <div className={cn('text-2xl font-bold', s.color)}>{s.value}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            {results.skipped > 0 && (
              <div className="mt-4 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                {results.skipped} rows were skipped because required fields (marked *) were missing or empty.
              </div>
            )}
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => resetWizard(importType)}
                className="text-xs bg-[#0176d3] text-white rounded px-4 py-2 hover:bg-blue-700"
              >
                Import Another File
              </button>
              {Object.entries(IMPORT_SCHEMAS)
                .filter(([k]) => k !== importType)
                .map(([k, s]) => (
                  <button key={k} onClick={() => resetWizard(k)} className="text-xs border border-gray-200 rounded px-3 py-2 hover:bg-gray-50 text-gray-600">
                    Import {s.label}
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Import History */}
      {importLog.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-[13px] font-semibold text-gray-700">Import History</h3>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Date','Type','File','Added','Updated','Skipped'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {importLog.slice(0, 10).map((log, i) => (
                <tr key={log.id} className={cn('border-b border-gray-100', i % 2 === 1 && 'bg-gray-50/40')}>
                  <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{log.date}</td>
                  <td className="px-3 py-2 font-medium text-gray-700">{log.label}</td>
                  <td className="px-3 py-2 text-gray-500 max-w-[200px] truncate">{log.filename}</td>
                  <td className="px-3 py-2 text-green-600 font-semibold">{log.inserted}</td>
                  <td className="px-3 py-2 text-blue-600 font-semibold">{log.updated}</td>
                  <td className="px-3 py-2 text-amber-600 font-semibold">{log.skipped}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
