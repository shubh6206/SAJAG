import React from 'react';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  TrendingUp,
  MessageSquareHeart,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  X,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'personnel'
  | 'risk-cases'
  | 'analytics'
  | 'welfare'
  | 'interventions'
  | 'reports'
  | 'audit';

export const TAB_HASH_MAP: Record<NavTab, string> = {
  'overview': 'command-overview',
  'personnel': 'personnel-directory',
  'risk-cases': 'risk-cases',
  'analytics': 'trends-analytics',
  'welfare': 'welfare-signals',
  'interventions': 'interventions',
  'reports': 'reports',
  'audit': 'security-audit',
};

export const HASH_TO_TAB: Record<string, NavTab> = {
  'command-overview': 'overview',
  'personnel-directory': 'personnel',
  'risk-cases': 'risk-cases',
  'trends-analytics': 'analytics',
  'welfare-signals': 'welfare',
  'interventions': 'interventions',
  'reports': 'reports',
  'security-audit': 'audit',
};

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  priorityCount: number;
  unresolvedWelfareCount: number;
  isViewingPersonnel?: boolean;
  selectedPersonnelId?: string | null;
  onReturnFromPersonnel?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  priorityCount,
  unresolvedWelfareCount,
  isViewingPersonnel = false,
  selectedPersonnelId = null,
  onReturnFromPersonnel,
}) => {
  const navItems: {
    id: NavTab;
    label: string;
    hash: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Command Overview',
      hash: '#command-overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'personnel',
      label: 'Personnel Directory',
      hash: '#personnel-directory',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'risk-cases',
      label: 'Risk Cases',
      hash: '#risk-cases',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: priorityCount,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'analytics',
      label: 'Trends & Analytics',
      hash: '#trends-analytics',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: 'welfare',
      label: 'Welfare Signals',
      hash: '#welfare-signals',
      icon: <MessageSquareHeart className="w-4 h-4" />,
      badge: unresolvedWelfareCount,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'interventions',
      label: 'Interventions',
      hash: '#interventions',
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
    {
      id: 'reports',
      label: 'Reports',
      hash: '#reports',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'audit',
      label: 'Security / Audit',
      hash: '#security-audit',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
  ];

  const handleItemClick = (e: React.MouseEvent, tab: NavTab, hash: string) => {
    e.preventDefault();
    if (window.location.hash !== hash) {
      window.history.pushState(null, '', hash);
    }
    onTabChange(tab);
    // Smooth scroll to top of section or page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav id="main-navigation-bar" aria-label="Main Navigation" className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6">
      <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
        {navItems.map((item) => {
          // If viewing an individual case, none of the standard tabs should falsely appear as active
          const isActive = !isViewingPersonnel && activeTab === item.id;
          return (
            <a
              id={`nav-tab-${item.id}`}
              key={item.id}
              href={item.hash}
              onClick={(e) => handleItemClick(e, item.id, item.hash)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-all focus:outline-hidden focus:ring-2 focus:ring-teal-400 cursor-pointer select-none ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-400/40 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    item.badgeColor || 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}

        {/* Dedicated Active Breadcrumb when viewing an individual personnel case */}
        {isViewingPersonnel && selectedPersonnelId && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700 ml-1">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/50 text-xs font-mono font-bold whitespace-nowrap shadow-xs">
              <UserCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Reviewing Case: {selectedPersonnelId}</span>
              {onReturnFromPersonnel && (
                <button
                  onClick={onReturnFromPersonnel}
                  title="Close Case Review and return to directory"
                  className="ml-1.5 text-slate-400 hover:text-white p-0.5 rounded hover:bg-teal-900/50 cursor-pointer"
                  aria-label="Close Case Review"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
