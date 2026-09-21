import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import Risks from '@/pages/Risks'
import Issues from '@/pages/Issues'
import Vendors from '@/pages/Vendors'
import IRQ from '@/pages/IRQ'
import KRI from '@/pages/KRI'
import Reports from '@/pages/Reports'
import SCA from '@/pages/SCA'
import IRQDash from '@/pages/IRQDash'
import Intelligence from '@/pages/Intelligence'
import SBR from '@/pages/SBR'
import Chat from '@/pages/Chat'
import FourthParty from '@/pages/FourthParty'
import VendorIncidents from '@/pages/VendorIncidents'
import EvidenceRegister from '@/pages/EvidenceRegister'
import OffboardingChecklist from '@/pages/OffboardingChecklist'
import RegulatoryMapping from '@/pages/RegulatoryMapping'
import ConcentrationRisk from '@/pages/ConcentrationRisk'
import AuditTrail from '@/pages/AuditTrail'
import RiskAppetite from '@/pages/RiskAppetite'
import Approvals from '@/pages/Approvals'
import BIA from '@/pages/BIA'
import BoardPack from '@/pages/BoardPack'
import ContinuousMonitoring from '@/pages/ContinuousMonitoring'
import EngagementRisk from '@/pages/EngagementRisk'
import Assessments from '@/pages/Assessments'
import ProcessUnityImport from '@/pages/ProcessUnityImport'

// Bump this version string whenever seed data changes to reset stale localStorage
const SEED_VERSION = 'v2026-09-17'

function useSeedReset() {
  useEffect(() => {
    if (localStorage.getItem('tprm:seedVersion') !== SEED_VERSION) {
      // Clear seed-derived stores so new defaults load on next render
      ;['tprm:vendors','tprm:risks','tprm:irq'].forEach(k => localStorage.removeItem(k))
      localStorage.setItem('tprm:seedVersion', SEED_VERSION)
    }
  }, [])
}

export default function App() {
  useSeedReset()
  return (
    <BrowserRouter basename="/tprm">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index          element={<Dashboard />} />
          <Route path="risks"   element={<Risks />} />
          <Route path="issues"  element={<Issues />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="irq"     element={<IRQ />} />
          <Route path="kri"     element={<KRI />} />
          <Route path="reports" element={<Reports />} />
          <Route path="sca"     element={<SCA />} />
          <Route path="irqdash" element={<IRQDash />} />
          <Route path="intelligence" element={<Intelligence />} />
          <Route path="sbr"     element={<SBR />} />
          <Route path="chat"         element={<Chat />} />
          <Route path="fourthparty" element={<FourthParty />} />
          <Route path="incidents" element={<VendorIncidents />} />
          <Route path="evidence" element={<EvidenceRegister />} />
          <Route path="offboarding" element={<OffboardingChecklist />} />
          <Route path="regulatory" element={<RegulatoryMapping />} />
          <Route path="concentration" element={<ConcentrationRisk />} />
          <Route path="audittrail" element={<AuditTrail />} />
          <Route path="appetite" element={<RiskAppetite />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="bia" element={<BIA />} />
          <Route path="boardpack" element={<BoardPack />} />
          <Route path="monitoring" element={<ContinuousMonitoring />} />
          <Route path="engagements" element={<EngagementRisk />} />
          <Route path="assessments" element={<Assessments />} />
          <Route path="pu-import"   element={<ProcessUnityImport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
