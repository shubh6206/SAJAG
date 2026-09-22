import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Activity,
  Calendar,
  Clock,
  ArrowRight,
  HelpCircle,
  X,
  Filter,
  Search,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Eye,
  UserCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Personnel, RiskLevel } from '../types';

interface RiskCasesViewProps {
  personnelList: Personnel[];
  onSelectPersonnel: (id: string) => void;
  initialFilter?: string | null;
  initialCategoryFilter?: string | null;
}

type CaseFilterTab = 'ALL' | 'HUMAN REVIEW' | 'HIGH' | 'ELEVATED' | 'WATCH' | 'STABLE';

export const RiskCasesView: React.FC<RiskCasesViewProps> = ({
  personnelList,
  onSelectPersonnel,
  initialFilter,
  initialCategoryFilter,
}) => {
  const effectiveInitial = initialCategoryFilter || initialFilter || 'ALL';
  const [activeTab, setActiveTab] = useState<CaseFilterTab>(
    (effectiveInitial.toUpperCase() as CaseFilterTab) || 'ALL'
  );

  useEffect(() => {
    if (initialCategoryFilter || initialFilter) {
      const val = (initialCategoryFilter || initialFilter || 'ALL').toUpperCase();
      setActiveTab(val as CaseFilterTab);
    }
  }, [initialCategoryFilter, initialFilter]);
  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('All');
  const [selectedAttributionPerson, setSelectedAttributionPerson] = useState<Personnel | null>(null);

  // Tab counts
  const counts = useMemo(() => {
    return {
      ALL: personnelList.length,
      'HUMAN REVIEW': personnelList.filter((p) => p.unified.state === 'Human Review').length,
      HIGH: personnelList.filter((p) => p.unified.state === 'High').length,
      ELEVATED: personnelList.filter((p) => p.unified.state === 'Elevated').length,
      WATCH: personnelList.filter((p) => p.unified.state === 'Watch').length,
      STABLE: personnelList.filter((p) => p.unified.state === 'Stable').length,
    };
  }, [personnelList]);

  // Filtered cases
  const filteredCases = useMemo(() => {
    return personnelList.filter((person) => {
      // Tab filter
      if (activeTab === 'HUMAN REVIEW' && person.unified.state !== 'Human Review') return false;
      if (activeTab === 'HIGH' && person.unified.state !== 'High') return false;
      if (activeTab === 'ELEVATED' && person.unified.state !== 'Elevated') return false;
      if (activeTab === 'WATCH' && person.unified.state !== 'Watch') return false;
      if (activeTab === 'STABLE' && person.unified.state !== 'Stable') return false;

      // Unit filter
      if (unitFilter !== 'All' && person.unit !== unitFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = person.id.toLowerCase().includes(q);
        const rankMatch = person.rank.toLowerCase().includes(q);
        const unitMatch = person.unit.toLowerCase().includes(q);
        const nameMatch = person.maskedName.toLowerCase().includes(q);
        if (!idMatch && !rankMatch && !unitMatch && !nameMatch) return false;
      }

      return true;
    });
  }, [personnelList, activeTab, unitFilter, searchQuery]);

  const getRiskBadge = (state: RiskLevel) => {
    switch (state) {
      case 'Human Review':
        return 'bg-red-600 text-white border-red-500 ring-1 ring-red-400';
      case 'High':
        return 'bg-rose-500 text-white border-rose-400';
      case 'Elevated':
        return 'bg-amber-500 text-white border-amber-400';
      case 'Watch':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Stable':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getPrimaryContributor = (person: Personnel) => {
    const { physiological, operational, welfare } = person.unified.waterfallContributions;
    if (operational >= physiological && operational >= welfare) {
      return {
        label: 'Operational Burden',
        pts: operational,
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        detail: `${person.operational.consecutiveDutyDays} consecutive duty days, ${person.operational.nightShiftsLast7d} night shifts`,
      };
    }
    if (welfare >= physiological && welfare >= operational) {
      return {
        label: 'Welfare / Family Support',
        pts: welfare,
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        detail: `${person.welfare.unresolvedSignalsCount} open grievance, voluntary mood shift`,
      };
    }
    return {
      label: 'Physiological Strain',
      pts: physiological,
      color: 'text-teal-700 bg-teal-50 border-teal-200',
      detail: `Resting HR +${person.physiological.hrDeviationPct}%, HRV ${person.physiological.hrvMs}ms`,
    };
  };

  const getRecommendedAction = (person: Personnel) => {
    if (person.unified.state === 'Human Review') {
      return person.welfare.unresolvedSignalsCount > 0
        ? 'Review Compassionate Leave & Welfare Counseling'
        : 'Mandatory 48-hour Rest Cycle & Roster Relief';
    }
    if (person.unified.state === 'High') {
      return person.operational.consecutiveDutyDays > 12
        ? 'Immediate Roster Rotation & 24h Sleep Opportunity'
        : 'Clinical Baseline Review & Rest Protocol';
    }
    if (person.unified.state === 'Elevated') {
      return 'Operational Workload Review & Supportive Check-In';
    }
    if (person.unified.state === 'Watch') {
      return 'Maintain Observation & Standard Roster Cycle';
    }
    return 'Normal Duty Routine & Regular Hydration';
  };

  return (
    <section id="risk-cases" className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 font-mono tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              Prioritized Risk Cases
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-semibold border border-slate-200">
              Active Triage Queue
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Multi-pillar triage prioritizes personnel requiring institutional review. Cases combine physiological recovery, duty load, and voluntary welfare signals with explainable attribution.
          </p>
        </div>

        {/* Quick Triage Counters */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-800 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>{counts['HUMAN REVIEW']} Human Review</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-bold">
            <span>{counts.HIGH} High</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold">
            <span>{counts.ELEVATED} Elevated</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Sub-Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            {(['ALL', 'HUMAN REVIEW', 'HIGH', 'ELEVATED', 'WATCH', 'STABLE'] as CaseFilterTab[]).map(
              (tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold font-mono transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>{tab}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {counts[tab]}
                    </span>
                  </button>
                );
              }
            )}
          </div>

          {/* Controls: Unit & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
              >
                <option value="All">All Units</option>
                <option value="14th Bn BSF">14th Bn BSF</option>
                <option value="8th Bn CRPF">8th Bn CRPF</option>
                <option value="ITBP High Altitude Wing">ITBP High Altitude Wing</option>
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search ID, rank, unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-slate-700 w-48 sm:w-56 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Case Grid / Cards */}
      {filteredCases.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 font-mono">No Personnel Cases Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No personnel match the current filter criteria ({activeTab}, {unitFilter}). Try changing the tab or clearing the search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCases.map((person) => {
            const primary = getPrimaryContributor(person);
            const action = getRecommendedAction(person);
            const isPriority = person.unified.state === 'Human Review';

            return (
              <div
                key={person.id}
                className={`bg-white rounded-xl border transition-all duration-150 p-4 shadow-xs flex flex-col justify-between hover:shadow-md ${
                  isPriority
                    ? 'border-red-300 ring-1 ring-red-200/60 bg-red-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900 font-mono">
                          {person.id}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {person.rank}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        <span>{person.unit}</span> &bull; <span>{person.posting}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border inline-block shadow-2xs ${getRiskBadge(
                          person.unified.state
                        )}`}
                      >
                        {person.unified.score}/100 {person.unified.state.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="py-3 space-y-2.5 text-xs">
                    {/* Primary Contributor */}
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">
                        Primary Contributor
                      </span>
                      <div className="flex items-center justify-between mt-1">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded border text-[11px] ${primary.color}`}
                        >
                          {primary.label} (+{primary.pts} pts)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                        {primary.detail}
                      </p>
                    </div>

                    {/* Persistence & Confidence */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">
                          Persistence
                        </span>
                        <span className="font-mono text-slate-800 font-semibold text-[11px] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {person.unified.persistenceDays}d sustained
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">
                          Signal Confidence
                        </span>
                        <span
                          className={`font-mono font-semibold text-[11px] flex items-center gap-1 mt-0.5 ${
                            person.unified.confidence === 'LOW'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              person.unified.confidence === 'LOW'
                                ? 'bg-amber-500 animate-pulse'
                                : 'bg-emerald-500'
                            }`}
                          ></span>
                          {person.unified.confidence}
                        </span>
                      </div>
                    </div>

                    {/* Recommended Action */}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">
                        Next Recommended Action
                      </span>
                      <p className="text-[11px] text-slate-800 font-medium mt-0.5 leading-snug">
                        {action}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedAttributionPerson(person)}
                    className="px-2.5 py-1.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    <span>Why flagged?</span>
                  </button>

                  <button
                    onClick={() => onSelectPersonnel(person.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Open Case Review</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* "Why Flagged?" Attribution Explanation Modal */}
      {selectedAttributionPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-teal-300">
                    {selectedAttributionPerson.id}
                  </span>
                  <span className="text-xs text-slate-300">
                    ({selectedAttributionPerson.rank} &bull; {selectedAttributionPerson.unit})
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Explainable Risk Attribution &amp; Multi-Pillar Driver Breakdown
                </p>
              </div>
              <button
                onClick={() => setSelectedAttributionPerson(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Overall Score Banner */}
              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">
                    Composite Unified Risk
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-2xl font-bold font-mono text-slate-900">
                      {selectedAttributionPerson.unified.score}/100
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${getRiskBadge(
                        selectedAttributionPerson.unified.state
                      )}`}
                    >
                      {selectedAttributionPerson.unified.state}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">
                    Confidence
                  </span>
                  <span className="font-mono font-bold text-xs text-slate-800">
                    {selectedAttributionPerson.unified.confidence}
                  </span>
                </div>
              </div>

              {/* Waterfall Point Attribution */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider mb-2">
                  Point Attribution Waterfall
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-2.5">
                    <span className="text-[10px] text-teal-700 font-mono block">Physiological</span>
                    <span className="text-lg font-bold font-mono text-teal-900 block mt-0.5">
                      +{selectedAttributionPerson.unified.waterfallContributions.physiological}
                    </span>
                    <span className="text-[10px] text-teal-700">pts</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                    <span className="text-[10px] text-amber-700 font-mono block">Operational</span>
                    <span className="text-lg font-bold font-mono text-amber-900 block mt-0.5">
                      +{selectedAttributionPerson.unified.waterfallContributions.operational}
                    </span>
                    <span className="text-[10px] text-amber-700">pts</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                    <span className="text-[10px] text-blue-700 font-mono block">Welfare</span>
                    <span className="text-lg font-bold font-mono text-blue-900 block mt-0.5">
                      +{selectedAttributionPerson.unified.waterfallContributions.welfare}
                    </span>
                    <span className="text-[10px] text-blue-700">pts</span>
                  </div>
                </div>
              </div>

              {/* Specific Trigger Factors */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider mb-1.5">
                  Primary Trigger Drivers
                </h4>
                <ul className="space-y-1 text-xs text-slate-700 pl-4 list-disc">
                  {selectedAttributionPerson.unified.whyFlagged.map((reason, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Non-Diagnostic Disclaimer */}
              <div className="p-3 bg-slate-100/80 rounded-lg border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                <strong>Attribution Notice:</strong> SAJAG attributes operational fatigue and baseline deviation for decision support. It does not diagnose clinical or psychiatric disorders.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setSelectedAttributionPerson(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const pid = selectedAttributionPerson.id;
                  setSelectedAttributionPerson(null);
                  onSelectPersonnel(pid);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Open Full Case Review</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
