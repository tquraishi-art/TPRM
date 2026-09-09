import { useState, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Calendar, BookOpen, ChevronDown, ChevronUp, Newspaper, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Data ─────────────────────────────────────────────────────────────────────

const ARTICLES = [
  {id:1, date:'2026-08-22', source:'Gartner Research', tag:'Emerging Tech', title:'AI-Driven Third-Party Risk: How GenAI is Reshaping TPRM Programs in 2026', summary:'Organizations are integrating AI into supplier due diligence workflows, reducing assessment cycle times by 40% while expanding continuous monitoring coverage to long-tail suppliers previously reviewed only annually.', body:'Full analysis: GenAI is being deployed across three key TPRM workflows: (1) automated questionnaire analysis that cross-references vendor responses against known risk patterns, (2) continuous news monitoring that flags adverse media about suppliers in near-real-time, and (3) AI-assisted contract review identifying non-standard risk clauses. Gartner estimates 60% of Fortune 500 TPRM teams will use at least one GenAI capability by Q2 2027.'},
  {id:2, date:'2026-08-18', source:'Regulatory Update', tag:'Regulatory', title:'SEC Updates Cybersecurity Disclosure Requirements for Third-Party Incidents', summary:'New SEC guidance requires material third-party cyber events to be disclosed within 4 business days, expanding scope beyond direct breaches to include incidents at critical service providers.', body:'The updated guidance clarifies that a "material" third-party incident includes ransomware at a critical IT provider, data breach at a data processor, and prolonged outages at cloud infrastructure providers. Companies must now maintain documented criteria for materiality assessment and evidence of board-level notification.'},
  {id:3, date:'2026-08-14', source:'Gartner Research', tag:'Market Insight', title:'TPRM Market Guide 2026: Consolidation and Platform Convergence Accelerate', summary:'Gartner identifies 12 leading TPRM platforms converging toward integrated GRC suites, with AI-assisted risk scoring now a baseline expectation rather than a differentiator.', body:'The market is bifurcating: large GRC platforms (ServiceNow, OneTrust, Archer) are absorbing point solutions, while a new tier of AI-native TPRM startups is targeting mid-market. Key evaluation criteria now include: continuous monitoring breadth, 4th-party visibility, AI accuracy in scoring, and native integration with procurement systems.'},
  {id:4, date:'2026-08-08', source:'Industry Alert', tag:'Concentration Risk', title:'Critical Infrastructure Sector Reports Rise in Supplier Concentration Risk', summary:'Four critical technology categories now have single-vendor concentration exceeding 60% across surveyed enterprise clients, raising systemic risk concerns.', body:'The categories of highest concern are: cloud hyperscalers (AWS/Azure/GCP dominating 94% of enterprise workloads), CDN providers, payment processors, and identity management platforms. CISA recommends enterprises document concentration ratios annually and maintain tested contingency plans for top-3 critical suppliers.'},
  {id:5, date:'2026-07-30', source:'Gartner Research', tag:'Best Practice', title:'Continuous Control Monitoring Replaces Point-in-Time Assessments for Tier-1 Suppliers', summary:'Leading TPRM programs have shifted to automated, continuous monitoring for their top 50 suppliers, flagging risk events within hours vs. the previous annual questionnaire cycle.', body:'The shift involves three capabilities working together: external attack surface scanning (detecting exposed credentials, unpatched CVEs), news and adverse media monitoring, and contractual KPI dashboards updated in real-time from vendor systems. The annual questionnaire is retained but repositioned as a deep-dive for new suppliers and triggered reassessments.'},
  {id:6, date:'2026-07-21', source:'Industry Alert', tag:'Regulatory', title:'EU DORA Enforcement Begins: Financial Sector Third-Party ICT Risk Scrutiny Intensifies', summary:"European regulators begin formal audits of DORA compliance for financial institutions' critical ICT third-party providers, with penalties up to 2% of global annual turnover.", body:'DORA Article 28-30 requires financial entities to maintain a register of all ICT third-party service providers, conduct concentration risk assessments, and test incident response for critical providers annually. The first wave of enforcement actions is expected to focus on cloud providers and core banking software vendors.'},
  {id:7, date:'2026-07-15', source:'Research Report', tag:'Best Practice', title:'Third-Party Breach Statistics 2026: Supply Chain Attacks Account for 28% of All Breaches', summary:'New industry data shows supply chain and third-party breaches are now the second-leading attack vector after social engineering, up from 19% in 2024.', body:'The increase is attributed to: greater reliance on SaaS and cloud services, inadequate vetting of open-source dependencies, and attackers pivoting to target smaller tier-2 and tier-3 vendors as a gateway to larger enterprises. Average cost of a supply chain breach is $4.8M, 23% higher than direct breaches.'},
  {id:8, date:'2026-07-08', source:'Regulatory Update', tag:'Regulatory', title:'NIST Updates Cybersecurity Framework: Third-Party Risk Gets Dedicated Function', summary:'NIST CSF 3.0 draft introduces a dedicated "Supply Chain Security" function with 8 subcategories covering vendor identification, continuous monitoring, and incident response coordination.', body:'The new SC function recognizes that supply chain risk cannot be adequately addressed within the existing Identify/Protect/Detect/Respond/Recover structure. Key subcategories include: SC.ID-1 (maintain authorized supplier list), SC.PR-2 (include security requirements in contracts), SC.DE-1 (monitor supplier security posture continuously), SC.RS-1 (coordinate incident response with critical suppliers).'},
]

const TAG_STYLES = {
  'Emerging Tech':      { chip: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500', active: 'ring-purple-400' },
  'Regulatory':         { chip: 'bg-red-100 text-red-700 border-red-200',          dot: 'bg-red-500',    active: 'ring-red-400' },
  'Market Insight':     { chip: 'bg-blue-100 text-blue-700 border-blue-200',        dot: 'bg-blue-500',   active: 'ring-blue-400' },
  'Concentration Risk': { chip: 'bg-orange-100 text-orange-700 border-orange-200',  dot: 'bg-orange-500', active: 'ring-orange-400' },
  'Best Practice':      { chip: 'bg-green-100 text-green-700 border-green-200',     dot: 'bg-green-500',  active: 'ring-green-400' },
}

const ALL_TAGS = [...new Set(ARTICLES.map(a => a.tag))]
const ALL_SOURCES = [...new Set(ARTICLES.map(a => a.source))]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TagBadge({ tag, size = 'sm' }) {
  const style = TAG_STYLES[tag] || { chip: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' }
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 border font-medium rounded-full',
      size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      style.chip
    )}>
      <span className={cn('rounded-full flex-shrink-0', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', style.dot)} />
      {tag}
    </span>
  )
}

function formatDate(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Featured Card ────────────────────────────────────────────────────────────

function FeaturedCard({ article }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600" />
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <TagBadge tag={article.tag} size="md" />
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(article.date)}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <BookOpen className="w-3.5 h-3.5" />
            {article.source}
          </span>
          <span className="ml-auto text-xs font-semibold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            Featured
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug mb-3">
          {article.title}
        </h2>
        <p className="text-gray-600 leading-relaxed text-base mb-4">
          {article.summary}
        </p>
        {expanded && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-sm text-gray-700 leading-relaxed">
            {article.body}
          </div>
        )}
        <button
          onClick={() => setExpanded(v => !v)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          {expanded
            ? <><ChevronUp className="w-4 h-4" /> Show Less</>
            : <><ChevronDown className="w-4 h-4" /> Read More</>}
        </button>
      </div>
    </div>
  )
}

// ─── Article Card ─────────────────────────────────────────────────────────────

function ArticleCard({ article }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col hover:shadow-md transition-shadow">
      <div className="p-5 flex flex-col flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <TagBadge tag={article.tag} />
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(article.date)}
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1 truncate">
            <BookOpen className="w-3 h-3 flex-shrink-0" />
            {article.source}
          </span>
        </div>
        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 flex-1 mb-4">
          {article.summary}
        </p>
        {expanded && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 text-xs text-gray-700 leading-relaxed">
            {article.body}
          </div>
        )}
        <button
          onClick={() => setExpanded(v => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          {expanded
            ? <><ChevronUp className="w-3.5 h-3.5" /> Show Less</>
            : <><ChevronDown className="w-3.5 h-3.5" /> Read More</>}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Intelligence() {
  const { state } = useLocation()
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('All')
  const [source, setSource] = useState('All')
  const [highlightId, setHighlightId] = useState(null)

  useEffect(() => {
    if (state?.openArticleId) setHighlightId(state.openArticleId)
  }, [state])

  const totalSources = useMemo(() => new Set(ARTICLES.map(a => a.source)).size, [])
  const totalTopics = useMemo(() => new Set(ARTICLES.map(a => a.tag)).size, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return ARTICLES.filter(a => {
      if (activeTag !== 'All' && a.tag !== activeTag) return false
      if (source !== 'All' && a.source !== source) return false
      if (q && !a.title.toLowerCase().includes(q) && !a.summary.toLowerCase().includes(q)) return false
      return true
    })
  }, [search, activeTag, source])

  const featured = filtered[0] ?? null
  const rest = filtered.slice(1)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Newspaper className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Intelligence Hub</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                TPRM Intelligence Briefing
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Latest research, regulatory updates &amp; market insights
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-1.5 self-start sm:self-auto">
              <Calendar className="w-4 h-4 text-gray-400" />
              August 2026
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap gap-4 mb-6 px-4 py-3 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold text-gray-900 text-base">{ARTICLES.length}</span>
            <span>Articles</span>
          </div>
          <span className="text-gray-300 self-center">·</span>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold text-gray-900 text-base">{totalSources}</span>
            <span>Sources</span>
          </div>
          <span className="text-gray-300 self-center">·</span>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold text-gray-900 text-base">{totalTopics}</span>
            <span>Topics</span>
          </div>
          <span className="text-gray-300 self-center">·</span>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold text-gray-900 text-base">{filtered.length}</span>
            <span>Showing</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or summary..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
            </div>
            {/* Source dropdown */}
            <div className="relative flex items-center">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={source}
                onChange={e => setSource(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="All">All Sources</option>
                {ALL_SOURCES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Tag chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTag('All')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                activeTag === 'All'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              )}
            >
              All Topics
            </button>
            {ALL_TAGS.map(tag => {
              const style = TAG_STYLES[tag] || { chip: 'bg-gray-100 text-gray-600 border-gray-200', active: 'ring-gray-400' }
              const isActive = activeTag === tag
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(isActive ? 'All' : tag)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                    isActive
                      ? cn(style.chip, 'ring-2 ring-offset-1', style.active)
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  )}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No articles match your filters.</p>
            <button
              onClick={() => { setSearch(''); setActiveTag('All'); setSource('All') }}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {featured && (
              <div className={cn('mb-8 rounded-xl transition-all', highlightId === featured.id && 'ring-2 ring-blue-400 ring-offset-2')}>
                <FeaturedCard article={featured} />
              </div>
            )}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {rest.map(article => (
                  <div key={article.id} className={cn('rounded-xl transition-all', highlightId === article.id && 'ring-2 ring-blue-400 ring-offset-2')}>
                    <ArticleCard article={article} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
