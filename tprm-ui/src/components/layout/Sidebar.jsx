import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, AlertTriangle, Wrench, Building2, ClipboardList,
  Radio, BarChart2, Landmark, Search, Newspaper, FileText, MessageSquare, GitBranch, Siren, FolderCheck, LogOut, Scale, Layers, ScrollText, Gauge, Stamp, Activity, Package, Handshake, ClipboardCheck, ArrowDownToLine, DoorOpen, Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { section: 'Overview',            items: [
    { to: '/',          label: 'Dashboard',          icon: LayoutDashboard },
  ]},
  { section: 'Risk',                items: [
    { to: '/risks',     label: 'Risk Register',       icon: AlertTriangle },
    { to: '/issues',    label: 'Issue Tracker',        icon: Wrench },
    { to: '/appetite',  label: 'Risk Appetite',        icon: Gauge },
    { to: '/approvals', label: 'Approvals',            icon: Stamp },
  ]},
  { section: 'Vendors',             items: [
    { to: '/vendors',      label: 'Vendor Criticality',  icon: Building2 },
    { to: '/irq',          label: 'IRQ Scoring',          icon: ClipboardList },
    { to: '/fourthparty',  label: 'Fourth-Party Registry',icon: GitBranch },
    { to: '/bia',          label: 'BIA / Criticality',    icon: Activity },
    { to: '/engagements',  label: 'Engagement Risk',       icon: Handshake },
    { to: '/assessments',     label: 'Assessments',           icon: ClipboardCheck },
    { to: '/questionnaires',  label: 'Questionnaires',         icon: Shield },
  ]},
  { section: 'Incidents',            items: [
    { to: '/incidents',   label: 'Vendor Incidents',      icon: Siren },
    { to: '/evidence',    label: 'Evidence Register',     icon: FolderCheck },
    { to: '/offboarding',     label: 'Offboarding Checklist', icon: LogOut },
    { to: '/exit-plan',       label: 'Exit Planning',          icon: DoorOpen },
  ]},
  { section: 'Compliance',           items: [
    { to: '/regulatory',     label: 'Regulatory Mapping',   icon: Scale },
    { to: '/concentration',  label: 'Concentration Risk',   icon: Layers },
    { to: '/audittrail',     label: 'Audit Trail',          icon: ScrollText },
  ]},
  { section: 'Monitoring',          items: [
    { to: '/monitoring',label: 'Continuous Monitoring',  icon: Radio },
    { to: '/kri',       label: 'KRI Monitor',           icon: BarChart2 },
    { to: '/reports',   label: 'Reports',               icon: FileText },
  ]},
  { section: 'Audits',              items: [
    { to: '/sca',       label: 'Supplier Compliance',   icon: Landmark },
    { to: '/irqdash',   label: 'IRQ Dashboard',         icon: Search },
  ]},
  { section: 'Intelligence',        items: [
    { to: '/intelligence', label: 'TPRM Intelligence',  icon: Newspaper },
  ]},
  { section: 'Supplier Performance',items: [
    { to: '/sbr',       label: 'SBR Scores',            icon: FileText },
  ]},
  { section: 'Reporting',            items: [
    { to: '/boardpack', label: 'Board Pack',             icon: Package },
  ]},
  { section: 'AI Assistant',        items: [
    { to: '/chat',      label: 'Ask TPRM AI',           icon: MessageSquare },
  ]},
  { section: 'Integrations',        items: [
    { to: '/pu-import', label: 'ProcessUnity Import',   icon: ArrowDownToLine },
  ]},
]

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="px-4 py-5 border-b border-gray-200">
        <div className="font-bold text-[#0176d3] text-sm tracking-wide">TPRM Platform</div>
        <div className="text-[10px] text-gray-400 mt-0.5">Third-Party Risk Management</div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map(({ section, items }) => (
          <div key={section} className="mb-1">
            <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {section}
            </div>
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => cn(
                  'flex items-center gap-2.5 px-4 py-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-[#0176d3] border-r-2 border-[#0176d3]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-gray-200 text-[10px] text-gray-400">
        TPRM v4.0 · 2026
      </div>
    </aside>
  )
}
