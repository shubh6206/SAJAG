import React from 'react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  HeartPulse,
  Clock,
  MessageSquareHeart,
  ArrowUpRight,
  ShieldAlert,
  Flame,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { Personnel, RiskLevel } from '../types';

interface CommandOverviewProps {
  personnelList: Personnel[];
  onSelectPersonnel: (personnelId: string) => void;
  selectedCategoryFilter: string | null;
  onSelectCategoryFilter: (category: string | null) => void;
  onLoadScenario: (scenario: 'A' | 'B' | 'C' | 'D') => void;
}

export const CommandOverview: React.FC<CommandOverviewProps> = ({
  personnelList,
  onSelectPersonnel,
  selectedCategoryFilter,
  onSelectCategoryFilter,
  onLoadScenario,
}) => {
  // Aggregate stats (248 monitored standard from SIH prompt)
  const totalMonitored = 248;
  const normalCount = 184; // 74.2%
  const elevatedCount = 41; // 16.5%
  const humanReviewCount = 23; // Priority cases

  // Risk distribution counts
  const distributionData = [
    { label: 'Stable', count: 184, pct: '74.2%', color: 'bg-emerald-500', barColor: 'bg-emerald-500' },
    { label: 'Watch', count: 32, pct: '12.9%', color: 'bg-blue-500', barColor: 'bg-blue-500' },
    { label: 'Elevated', count: 41, pct: '16.5%', color: 'bg-amber-500', barColor: 'bg-amber-500' },
    { label: 'High', count: 15, pct: '6.0%', color: 'bg-orange-500', barColor: 'bg-orange-500' },
    { label: 'Human Review', count: 23, pct: '9.3%', color: 'bg-red-500', barColor: 'bg-red-500' },
  ];

  // Filtered priority cases (focusing on Human Review and High)
  const priorityCases = personnelList
    .filter((p) => {
      if (selectedCategoryFilter) {
        return p.unified.state.toLowerCase() === selectedCategoryFilter.toLowerCase();
      }
      return p.unified.state === 'Human Review' || p.unified.state === 'High' || p.unified.state === 'Elevated';
    })
    .slice(0, 6);

  return (
    <div id="command-overview" className="space-y-6 pb-12">
      {/* SIH Innovation Notice & Tri-Pillar Architecture Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-xl p-4 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[11px] font-mono font-bold px-2 py-0.5 rounded">
              SIH26186 ARCHITECTURE
            </span>
            <span className="text-xs text-slate-300 font-medium">Early Signals &bull; Better Welfare &bull; Human Action</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            SAJAG integrates <span className="text-teal-300 font-medium">Physiological Stress</span>,{' '}
            <span className="text-amber-300 font-medium">Operational Fatigue</span>, and{' '}
            <span className="text-blue-300 font-medium">Welfare Signals</span> with temporal trajectory modeling to alert authorized officers before acute crises occur.
          </p>
        </div>

        {/* Quick Scenario Launch Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 self-stretch md:self-auto bg-slate-950/60 p-2 rounded-lg border border-slate-700/60">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mr-1">Demo Scenarios:</span>
          <button
            onClick={() => onLoadScenario('B')}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-red-600 hover:bg-red-500 text-white transition-all shadow-xs cursor-pointer"
            title="Demonstrate Scenario B (Hero): Normal Biometrics + High Operational & Welfare Risk"
          >
            Scenario B (Hero)
          </button>
          <button
            onClick={() => onLoadScenario('A')}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-xs cursor-pointer"
            title="Demonstrate Scenario A: High Physiological Stress"
          >
            Scenario A (Physio)
          </button>
          <button
            onClick={() => onLoadScenario('C')}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs cursor-pointer"
            title="Demonstrate Scenario C: Decreasing Risk Trajectory / Recovery"
          >
            Scenario C (Recovery)
          </button>
          <button
            onClick={() => onLoadScenario('D')}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-xs cursor-pointer"
            title="Demonstrate Scenario D: Data Sparsity Calibration"
          >
            Scenario D (Sparse)
          </button>
        </div>
      </div>

      {/* 4 Standard Government KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Monitored Personnel */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">PERSONNEL</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{totalMonitored}</span>
            <span className="text-xs font-medium text-slate-500">Monitored</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% telemetry synched across 3 Battalions</span>
          </div>
        </div>

        {/* KPI 2: Normal Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">NORMAL / STABLE</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{normalCount}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              74.2%
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Within healthy personal baselines
          </div>
        </div>

        {/* KPI 3: Elevated Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">ELEVATED</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{elevatedCount}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              16.5%
            </span>
          </div>
          <div className="mt-3 text-xs text-amber-700 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            <span>Early duty fatigue or sleep deficit</span>
          </div>
        </div>

        {/* KPI 4: Priority Human Review */}
        <div className="bg-white rounded-xl border-2 border-red-200 p-5 shadow-xs bg-red-50/20 hover:border-red-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-red-700">
              HUMAN REVIEW
            </span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-red-700">{humanReviewCount}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
              Priority cases
            </span>
          </div>
          <div className="mt-3 text-xs text-red-700 font-medium flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            <span>Requires officer review / intervention</span>
          </div>
        </div>
      </div>

      {/* PERSONNEL RISK DISTRIBUTION (Horizontal Stacked Bar) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
              PERSONNEL RISK DISTRIBUTION
            </h2>
            <p className="text-xs text-slate-500">
              Composite tri-pillar classification across unit roster. Click a category to filter.
            </p>
          </div>
          {selectedCategoryFilter && (
            <button
              onClick={() => onSelectCategoryFilter(null)}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium underline"
            >
              Clear Filter ({selectedCategoryFilter})
            </button>
          )}
        </div>

        {/* Multi-segment horizontal stacked bar */}
        <div className="h-6 w-full rounded-md bg-slate-100 flex overflow-hidden border border-slate-200">
          <div
            onClick={() => onSelectCategoryFilter(selectedCategoryFilter === 'Stable' ? null : 'Stable')}
            style={{ width: '74.2%' }}
            className="bg-emerald-500 hover:opacity-90 cursor-pointer transition-all flex items-center justify-center text-[11px] text-white font-medium"
            title="Stable: 184 (74.2%)"
          >
            184
          </div>
          <div
            onClick={() => onSelectCategoryFilter(selectedCategoryFilter === 'Watch' ? null : 'Watch')}
            style={{ width: '12.9%' }}
            className="bg-blue-500 hover:opacity-90 cursor-pointer transition-all flex items-center justify-center text-[11px] text-white font-medium"
            title="Watch: 32 (12.9%)"
          >
            32
          </div>
          <div
            onClick={() => onSelectCategoryFilter(selectedCategoryFilter === 'Elevated' ? null : 'Elevated')}
            style={{ width: '16.5%' }}
            className="bg-amber-500 hover:opacity-90 cursor-pointer transition-all flex items-center justify-center text-[11px] text-white font-medium"
            title="Elevated: 41 (16.5%)"
          >
            41
          </div>
          <div
            onClick={() => onSelectCategoryFilter(selectedCategoryFilter === 'High' ? null : 'High')}
            style={{ width: '6.0%' }}
            className="bg-orange-500 hover:opacity-90 cursor-pointer transition-all flex items-center justify-center text-[11px] text-white font-medium"
            title="High: 15 (6.0%)"
          >
            15
          </div>
          <div
            onClick={() => onSelectCategoryFilter(selectedCategoryFilter === 'Human Review' ? null : 'Human Review')}
            style={{ width: '9.3%' }}
            className="bg-red-500 hover:opacity-90 cursor-pointer transition-all flex items-center justify-center text-[11px] text-white font-medium"
            title="Human Review: 23 (9.3%)"
          >
            23
          </div>
        </div>

        {/* Category Legend with Interactive Filter Chips */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {distributionData.map((item) => {
            const isSelected = selectedCategoryFilter?.toLowerCase() === item.label.toLowerCase();
            return (
              <button
                key={item.label}
                onClick={() => onSelectCategoryFilter(isSelected ? null : item.label)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-slate-800 bg-slate-100 ring-2 ring-slate-400'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                  <span className="text-xs font-semibold text-slate-800">{item.label}</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between text-xs text-slate-600">
                  <span className="font-bold font-mono text-sm text-slate-900">{item.count}</span>
                  <span className="text-[11px] text-slate-500">{item.pct}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TRI-PILLAR RISK VISUALIZATION (Three Large Informative Cards) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
            SAJAG TRI-PILLAR PROFILE &bull; UNIT HEALTH MATRIX
          </h2>
          <span className="text-xs text-slate-500">Cross-pillar temporal intelligence</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar 1: Physiological Stress */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Physiological</h3>
                  <span className="text-[10px] text-slate-500 font-mono">Autonomic & Sleep Strain</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Unit Avg: 38
              </span>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Signal Confidence:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> HIGH (92% Coverage)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Resting HR Deviations:</span>
                <span className="font-semibold text-slate-800">14 personnel &gt; +15%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Recovery Deficits:</span>
                <span className="font-semibold text-slate-800">22 personnel &lt; 40 index</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Primary Contributors:</span>
                <span className="font-semibold text-slate-700">Sleep debt &bull; HRV drop</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Baseline referenced (14-day window)</span>
              <span className="text-teal-700 font-medium">Non-diagnostic</span>
            </div>
          </div>

          {/* Pillar 2: Operational Fatigue */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Operational Load</h3>
                  <span className="text-[10px] text-slate-500 font-mono">Duty Roster & Leave Deficit</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                Unit Avg: 58
              </span>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Consecutive Duty (&gt;14d):</span>
                <span className="font-semibold text-red-600">19 personnel</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Night Duty Density:</span>
                <span className="font-semibold text-slate-800">Avg 2.8 shifts / 7d</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Border Deployment:</span>
                <span className="font-semibold text-slate-800">112 personnel active</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Leave Backlog:</span>
                <span className="font-semibold text-slate-700">31 overdue &gt; 30 days</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Automatic duty telemetry</span>
              <span className="text-amber-700 font-medium">Context Driver</span>
            </div>
          </div>

          {/* Pillar 3: Welfare Signals */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <MessageSquareHeart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Welfare Signals</h3>
                  <span className="text-[10px] text-slate-500 font-mono">Confidential Local NLP</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                12 Active Signals
              </span>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">High-Urgency Grievances:</span>
                <span className="font-semibold text-red-600">4 open (Leave / Family)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Voluntary Check-In Shifts:</span>
                <span className="font-semibold text-slate-800">7 flagged changes</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Support Requests:</span>
                <span className="font-semibold text-slate-800">5 pending review</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Confidential Processing:</span>
                <span className="font-semibold text-emerald-700">Air-gapped local model</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Zero external LLM calls</span>
              <span className="text-blue-700 font-medium">Privacy Preserving</span>
            </div>
          </div>
        </div>
      </div>

      {/* PRIORITY CASE QUEUE (Table/Card Hybrid) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
                PRIORITY PERSONNEL REQUIRING REVIEW
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                {priorityCases.length} Cases Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by human review urgency, cross-pillar persistence, confidence score, and operational context.
            </p>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Sorted by: <span className="font-bold text-slate-700">Multi-Factor Persistence & Severity</span>
          </div>
        </div>

        {/* Priority Case Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {priorityCases.map((person) => {
            const isHumanReview = person.unified.state === 'Human Review';
            return (
              <div
                key={person.id}
                className={`rounded-xl border p-4 transition-all hover:shadow-md ${
                  isHumanReview
                    ? 'border-red-300 bg-red-50/10'
                    : person.unified.state === 'High'
                    ? 'border-orange-300 bg-orange-50/10'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-slate-900">
                        {person.id}
                      </span>
                      <span className="text-xs font-medium text-slate-600">
                        &bull; {person.posting} Posting
                      </span>
                      <span className="text-xs text-slate-400">
                        &bull; {person.deploymentDays} days deployed
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {person.rank} &bull; {person.unit}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                      person.unified.state === 'Human Review'
                        ? 'bg-red-600 text-white'
                        : person.unified.state === 'High'
                        ? 'bg-orange-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {person.unified.state}
                  </span>
                </div>

                {/* Tri-Pillar Mini Bars */}
                <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {/* Physiological */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                      <span>Physiological</span>
                      <span className="font-bold text-slate-700">{person.physiological.score}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          person.physiological.score > 70
                            ? 'bg-red-500'
                            : person.physiological.score > 40
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${person.physiological.score}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {person.physiological.state}
                    </span>
                  </div>

                  {/* Operational */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                      <span>Operational</span>
                      <span className="font-bold text-slate-700">{person.operational.score}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          person.operational.score > 70
                            ? 'bg-orange-500'
                            : person.operational.score > 40
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${person.operational.score}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {person.operational.state}
                    </span>
                  </div>

                  {/* Welfare */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                      <span>Welfare</span>
                      <span className="font-bold text-slate-700">{person.welfare.score}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          person.welfare.score > 70
                            ? 'bg-red-500'
                            : person.welfare.score > 40
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${person.welfare.score}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {person.welfare.state}
                    </span>
                  </div>
                </div>

                {/* Key Contextual Factors & Persistence */}
                <div className="mt-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono">
                    <span>Persistence: <strong className="text-slate-900">{person.unified.persistenceDays} days</strong></span>
                    <span>Confidence: <strong className="text-teal-700">{person.unified.confidence}</strong></span>
                  </div>

                  <div className="pt-1.5">
                    <span className="text-[11px] font-semibold text-slate-700 block mb-1">Key Factors:</span>
                    <ul className="text-[11px] text-slate-600 space-y-0.5 pl-3 list-disc">
                      {person.unified.whyFlagged.slice(0, 3).map((factor, idx) => (
                        <li key={idx} className="line-clamp-1">{factor}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action button to open detailed case review */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Status: <strong className="text-slate-700">{person.reviewStatus}</strong>
                  </span>
                  <button
                    onClick={() => onSelectPersonnel(person.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-teal-700 text-white text-xs font-semibold transition-all shadow-xs"
                  >
                    <span>REVIEW CASE</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
