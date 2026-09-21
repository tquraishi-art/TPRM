import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense, useEffect, Component } from 'react'
import Layout from '@/components/layout/Layout'

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
const Dashboard           = lazy(() => import('@/pages/Dashboard'))
const Risks               = lazy(() => import('@/pages/Risks'))
const Issues              = lazy(() => import('@/pages/Issues'))
const Vendors             = lazy(() => import('@/pages/Vendors'))
const IRQ                 = lazy(() => import('@/pages/IRQ'))
const KRI                 = lazy(() => import('@/pages/KRI'))
const Reports             = lazy(() => import('@/pages/Reports'))
const SCA                 = lazy(() => import('@/pages/SCA'))
const IRQDash             = lazy(() => import('@/pages/IRQDash'))
const Intelligence        = lazy(() => import('@/pages/Intelligence'))
const SBR                 = lazy(() => import('@/pages/SBR'))
const Chat                = lazy(() => import('@/pages/Chat'))
const FourthParty         = lazy(() => import('@/pages/FourthParty'))
const VendorIncidents     = lazy(() => import('@/pages/VendorIncidents'))
const EvidenceRegister    = lazy(() => import('@/pages/EvidenceRegister'))
const OffboardingChecklist= lazy(() => import('@/pages/OffboardingChecklist'))
const RegulatoryMapping   = lazy(() => import('@/pages/RegulatoryMapping'))
const ConcentrationRisk   = lazy(() => import('@/pages/ConcentrationRisk'))
const AuditTrail          = lazy(() => import('@/pages/AuditTrail'))
const RiskAppetite        = lazy(() => import('@/pages/RiskAppetite'))
const Approvals           = lazy(() => import('@/pages/Approvals'))
const BIA                 = lazy(() => import('@/pages/BIA'))
const BoardPack           = lazy(() => import('@/pages/BoardPack'))
const ContinuousMonitoring= lazy(() => import('@/pages/ContinuousMonitoring'))
const EngagementRisk      = lazy(() => import('@/pages/EngagementRisk'))
const Assessments         = lazy(() => import('@/pages/Assessments'))
const ProcessUnityImport  = lazy(() => import('@/pages/ProcessUnityImport'))

// ─── Page loading fallback ────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#0176d3] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ─── 404 page ─────────────────────────────────────────────────────────────────
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
      <div className="text-5xl font-bold text-gray-200">404</div>
      <div className="text-sm font-medium">Page not found</div>
      <a href="/tprm/" className="text-xs text-[#0176d3] hover:underline">← Back to Dashboard</a>
    </div>
  )
}

// ─── Error boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500 p-8">
          <div className="text-4xl font-bold text-gray-200">!</div>
          <div className="text-sm font-semibold text-gray-700">Something went wrong</div>
          <div className="text-xs text-gray-400 max-w-sm text-center">{this.state.error.message}</div>
          <button
            onClick={() => this.setState({ error: null })}
            className="text-xs text-[#0176d3] border border-[#0176d3] rounded px-3 py-1.5 hover:bg-blue-50"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Seed reset ───────────────────────────────────────────────────────────────
// Bump this version string whenever seed data changes to reset stale localStorage
const SEED_VERSION = 'v2026-09-17'

function useSeedReset() {
  useEffect(() => {
    if (localStorage.getItem('tprm:seedVersion') !== SEED_VERSION) {
      ;['tprm:vendors', 'tprm:risks', 'tprm:irq'].forEach(k => localStorage.removeItem(k))
      localStorage.setItem('tprm:seedVersion', SEED_VERSION)
    }
  }, [])
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  useSeedReset()
  return (
    <BrowserRouter basename="/tprm">
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index              element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Dashboard /></ErrorBoundary></Suspense>} />
            <Route path="risks"       element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Risks /></ErrorBoundary></Suspense>} />
            <Route path="issues"      element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Issues /></ErrorBoundary></Suspense>} />
            <Route path="vendors"     element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Vendors /></ErrorBoundary></Suspense>} />
            <Route path="irq"         element={<Suspense fallback={<PageLoader />}><ErrorBoundary><IRQ /></ErrorBoundary></Suspense>} />
            <Route path="kri"         element={<Suspense fallback={<PageLoader />}><ErrorBoundary><KRI /></ErrorBoundary></Suspense>} />
            <Route path="reports"     element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Reports /></ErrorBoundary></Suspense>} />
            <Route path="sca"         element={<Suspense fallback={<PageLoader />}><ErrorBoundary><SCA /></ErrorBoundary></Suspense>} />
            <Route path="irqdash"     element={<Suspense fallback={<PageLoader />}><ErrorBoundary><IRQDash /></ErrorBoundary></Suspense>} />
            <Route path="intelligence"element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Intelligence /></ErrorBoundary></Suspense>} />
            <Route path="sbr"         element={<Suspense fallback={<PageLoader />}><ErrorBoundary><SBR /></ErrorBoundary></Suspense>} />
            <Route path="chat"        element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Chat /></ErrorBoundary></Suspense>} />
            <Route path="fourthparty" element={<Suspense fallback={<PageLoader />}><ErrorBoundary><FourthParty /></ErrorBoundary></Suspense>} />
            <Route path="incidents"   element={<Suspense fallback={<PageLoader />}><ErrorBoundary><VendorIncidents /></ErrorBoundary></Suspense>} />
            <Route path="evidence"    element={<Suspense fallback={<PageLoader />}><ErrorBoundary><EvidenceRegister /></ErrorBoundary></Suspense>} />
            <Route path="offboarding" element={<Suspense fallback={<PageLoader />}><ErrorBoundary><OffboardingChecklist /></ErrorBoundary></Suspense>} />
            <Route path="regulatory"  element={<Suspense fallback={<PageLoader />}><ErrorBoundary><RegulatoryMapping /></ErrorBoundary></Suspense>} />
            <Route path="concentration" element={<Suspense fallback={<PageLoader />}><ErrorBoundary><ConcentrationRisk /></ErrorBoundary></Suspense>} />
            <Route path="audittrail"  element={<Suspense fallback={<PageLoader />}><ErrorBoundary><AuditTrail /></ErrorBoundary></Suspense>} />
            <Route path="appetite"    element={<Suspense fallback={<PageLoader />}><ErrorBoundary><RiskAppetite /></ErrorBoundary></Suspense>} />
            <Route path="approvals"   element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Approvals /></ErrorBoundary></Suspense>} />
            <Route path="bia"         element={<Suspense fallback={<PageLoader />}><ErrorBoundary><BIA /></ErrorBoundary></Suspense>} />
            <Route path="boardpack"   element={<Suspense fallback={<PageLoader />}><ErrorBoundary><BoardPack /></ErrorBoundary></Suspense>} />
            <Route path="monitoring"  element={<Suspense fallback={<PageLoader />}><ErrorBoundary><ContinuousMonitoring /></ErrorBoundary></Suspense>} />
            <Route path="engagements" element={<Suspense fallback={<PageLoader />}><ErrorBoundary><EngagementRisk /></ErrorBoundary></Suspense>} />
            <Route path="assessments" element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Assessments /></ErrorBoundary></Suspense>} />
            <Route path="pu-import"   element={<Suspense fallback={<PageLoader />}><ErrorBoundary><ProcessUnityImport /></ErrorBoundary></Suspense>} />
            <Route path="*"           element={<NotFound />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
