import React, { useState } from 'react';
import {
  TrendingUp,
  MapPin,
  Flame,
  Shield,
  Layers,
  BarChart3,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { UnitAnalytics } from '../types';

interface AnalyticsViewProps {
  analytics: UnitAnalytics;
  onSelectPersonnel: (personnelId: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  analytics,
  onSelectPersonnel,
}) => {
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<string | null>(null);

  // Helper for heatmap cell selection
  const selectedCellData = analytics.heatmapMatrix.find(
    (cell) => `${cell.operationalTier}-${cell.physiologicalTier}` === selectedHeatmapCell
  );

  return (
    <div id="trends-analytics" className="space-y-6 pb-12">
      {/* Unit Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 font-mono">
              UNIT-LEVEL WELLBEING ANALYTICS
            </h2>
            <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded font-mono">
              {analytics.unitName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated, privacy-preserving risk trends across deployments. Individual medical telemetry remains strictly protected.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <span>Active Monitored: <strong className="text-slate-900">{analytics.totalMonitored}</strong></span>
          <span>&bull;</span>
          <span>Readiness: <strong className="text-emerald-700">91.4% Operational</strong></span>
        </div>
      </div>

      {/* 2D WELFARE RISK HEATMAP (CRUCIAL SIH REQUIREMENT) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              2D WELFARE RISK HEATMAP &bull; OPERATIONAL VS. PHYSIOLOGICAL
            </h3>
            <p className="text-xs text-slate-500">
              Interactive distribution matrix. Click any cell to inspect filtered cohort personnel.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Axes: Operational Load (Vertical) &times; Physiological Strain (Horizontal)
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* 3x3 Matrix Grid */}
          <div className="lg:col-span-2 bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div className="text-center font-mono text-xs font-bold text-slate-700 mb-2">
              PHYSIOLOGICAL STRAIN &rarr;
            </div>

            <div className="flex items-stretch">
              {/* Vertical Label */}
              <div className="w-8 flex items-center justify-center">
                <span className="font-mono text-xs font-bold text-slate-700 -rotate-90 whitespace-nowrap">
                  &larr; OPERATIONAL LOAD
                </span>
              </div>

              {/* Grid content */}
              <div className="flex-1 space-y-2">
                {/* Column Headers */}
                <div className="grid grid-cols-3 text-center text-xs font-mono text-slate-500 pb-1">
                  <div>Low Strain</div>
                  <div>Medium Strain</div>
                  <div>High Strain</div>
                </div>

                {/* Row 1: Operational High */}
                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Medium', 'High'].map((physTier) => {
                    const cell = analytics.heatmapMatrix.find(
                      (c) => c.operationalTier === 'High' && c.physiologicalTier === physTier
                    );
                    const cellKey = `High-${physTier}`;
                    const isSelected = selectedHeatmapCell === cellKey;
                    return (
                      <button
                        key={cellKey}
                        onClick={() => setSelectedHeatmapCell(isSelected ? null : cellKey)}
                        className={`h-20 rounded-lg p-2 flex flex-col justify-between text-left transition-all border ${
                          physTier === 'High'
                            ? 'bg-red-500 hover:bg-red-600 text-white border-red-600'
                            : 'bg-orange-400 hover:bg-orange-500 text-slate-900 border-orange-500'
                        } ${isSelected ? 'ring-3 ring-slate-900 scale-102 shadow-md' : 'shadow-xs'}`}
                      >
                        <div className="flex justify-between items-start text-[10px] font-mono">
                          <span className="font-bold opacity-90">Ops High &bull; Phys {physTier}</span>
                          {physTier === 'Low' && (
                            <span className="bg-slate-900/40 text-white text-[9px] px-1 rounded">
                              PX-1042
                            </span>
                          )}
                        </div>
                        <div className="text-xl font-bold font-mono text-right">
                          {cell?.count || 0}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Row 2: Operational Medium */}
                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Medium', 'High'].map((physTier) => {
                    const cell = analytics.heatmapMatrix.find(
                      (c) => c.operationalTier === 'Medium' && c.physiologicalTier === physTier
                    );
                    const cellKey = `Medium-${physTier}`;
                    const isSelected = selectedHeatmapCell === cellKey;
                    return (
                      <button
                        key={cellKey}
                        onClick={() => setSelectedHeatmapCell(isSelected ? null : cellKey)}
                        className={`h-20 rounded-lg p-2 flex flex-col justify-between text-left transition-all border ${
                          physTier === 'High'
                            ? 'bg-orange-400 hover:bg-orange-500 text-slate-900 border-orange-500'
                            : 'bg-amber-200 hover:bg-amber-300 text-slate-900 border-amber-300'
                        } ${isSelected ? 'ring-3 ring-slate-900 scale-102 shadow-md' : 'shadow-xs'}`}
                      >
                        <div className="flex justify-between items-start text-[10px] font-mono">
                          <span className="font-bold opacity-80">Ops Med &bull; Phys {physTier}</span>
                          {physTier === 'High' && (
                            <span className="bg-slate-900/40 text-white text-[9px] px-1 rounded">
                              PX-1091
                            </span>
                          )}
                        </div>
                        <div className="text-xl font-bold font-mono text-right">
                          {cell?.count || 0}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Row 3: Operational Low */}
                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Medium', 'High'].map((physTier) => {
                    const cell = analytics.heatmapMatrix.find(
                      (c) => c.operationalTier === 'Low' && c.physiologicalTier === physTier
                    );
                    const cellKey = `Low-${physTier}`;
                    const isSelected = selectedHeatmapCell === cellKey;
                    return (
                      <button
                        key={cellKey}
                        onClick={() => setSelectedHeatmapCell(isSelected ? null : cellKey)}
                        className={`h-20 rounded-lg p-2 flex flex-col justify-between text-left transition-all border ${
                          physTier === 'High'
                            ? 'bg-amber-200 hover:bg-amber-300 text-slate-900 border-amber-300'
                            : 'bg-emerald-400 hover:bg-emerald-500 text-slate-900 border-emerald-500'
                        } ${isSelected ? 'ring-3 ring-slate-900 scale-102 shadow-md' : 'shadow-xs'}`}
                      >
                        <div className="flex justify-between items-start text-[10px] font-mono">
                          <span className="font-bold opacity-80">Ops Low &bull; Phys {physTier}</span>
                        </div>
                        <div className="text-xl font-bold font-mono text-right">
                          {cell?.count || 0}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Cell Drill-down Panel */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 h-full">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono mb-2">
              Heatmap Cohort Inspection
            </h4>
            {selectedCellData ? (
              <div className="space-y-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Selected Cohort:</span>
                  <strong className="text-slate-900 text-sm font-mono">
                    Ops: {selectedCellData.operationalTier} &bull; Phys: {selectedCellData.physiologicalTier}
                  </strong>
                  <div className="mt-1 text-slate-600">
                    Personnel Count: <strong>{selectedCellData.count} soldiers</strong>
                  </div>
                </div>

                {selectedCellData.personnelIds.length > 0 ? (
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      Personnel in this Cell:
                    </span>
                    <div className="space-y-1.5">
                      {selectedCellData.personnelIds.map((id) => (
                        <button
                          key={id}
                          onClick={() => onSelectPersonnel(id)}
                          className="w-full text-left p-2 rounded bg-white hover:bg-teal-50 border border-slate-200 text-slate-800 text-xs font-mono font-bold flex items-center justify-between transition-colors"
                        >
                          <span>{id}</span>
                          <span className="text-[10px] text-teal-700 font-sans font-medium">Review &rarr;</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px]">
                    All {selectedCellData.count} personnel in this cell are operating without critical escalations.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-xs py-8 text-center leading-relaxed">
                Click any heatmap cell to view cohort statistics and launch personnel review.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* POSTING RISK & WELFARE CATEGORIES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Posting Environment Analytics */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            RISK BY POSTING ENVIRONMENT
          </h3>
          <div className="space-y-3 text-xs">
            {/* Border */}
            <div>
              <div className="flex justify-between font-mono mb-1">
                <span className="font-semibold text-slate-800">Border Deployment (112 pers)</span>
                <span className="font-bold text-orange-600">High Duty Density</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full" style={{ width: '75%' }}></div>
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Average deployment: 38 days &bull; 4 night patrols / 7d
              </span>
            </div>

            {/* Field */}
            <div>
              <div className="flex justify-between font-mono mb-1">
                <span className="font-semibold text-slate-800">Field Movement (64 pers)</span>
                <span className="font-bold text-amber-600">Moderate Exertion</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: '52%' }}></div>
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Average deployment: 19 days &bull; Patrol mobility
              </span>
            </div>

            {/* High Altitude */}
            <div>
              <div className="flex justify-between font-mono mb-1">
                <span className="font-semibold text-slate-800">High Altitude Sector (48 pers)</span>
                <span className="font-bold text-red-600">Hypoxic Strain</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full" style={{ width: '68%' }}></div>
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Elevated resting HR adaptation & cold weather vigilance
              </span>
            </div>

            {/* Peace */}
            <div>
              <div className="flex justify-between font-mono mb-1">
                <span className="font-semibold text-slate-800">Peace Station (24 pers)</span>
                <span className="font-bold text-emerald-600">Baseline Optimal</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: '22%' }}></div>
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Standard shift rotation & full recovery intervals
              </span>
            </div>
          </div>
        </div>

        {/* Welfare Categories Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            UNIT WELFARE GRIEVANCE CATEGORIES
          </h3>
          <div className="space-y-2.5 text-xs">
            {Object.entries(analytics.welfareSignalsSummary).map(([cat, rawCount]) => {
              const count = Number(rawCount);
              const maxCount = 45;
              const pct = Math.min(100, Math.round((count / maxCount) * 100));
              return (
                <div key={cat}>
                  <div className="flex justify-between font-mono mb-0.5 text-slate-700">
                    <span className="capitalize font-semibold">{cat.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-bold">{count} cases</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        cat === 'leave'
                          ? 'bg-red-500'
                          : cat === 'workload'
                          ? 'bg-amber-500'
                          : 'bg-teal-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
