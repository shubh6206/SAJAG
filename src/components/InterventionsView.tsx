import React, { useState } from 'react';
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  Clock,
  UserCheck,
  Filter,
  ArrowRight,
  Shield,
  FileText,
} from 'lucide-react';
import { InterventionRecord } from '../types';

interface InterventionsViewProps {
  interventions: InterventionRecord[];
  onSelectPersonnel: (personnelId: string) => void;
}

export const InterventionsView: React.FC<InterventionsViewProps> = ({
  interventions,
  onSelectPersonnel,
}) => {
  const [filterType, setFilterType] = useState<string>('All');

  const filtered = interventions.filter((item) => {
    if (filterType === 'All') return true;
    return item.actionType === filterType;
  });

  return (
    <div id="interventions" className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 font-mono">
              HUMAN INTERVENTION REGISTRY
            </h2>
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono">
              Human-in-the-Loop Decisions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of confidential officer conversations, duty adjustments, and welfare follow-ups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">Filter by Action:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="All">All Actions</option>
            <option value="Welfare conversation">Welfare conversation</option>
            <option value="Rest / recovery adjustment">Rest / recovery adjustment</option>
            <option value="Leave review">Leave review</option>
            <option value="Medical referral">Medical referral</option>
            <option value="Family support">Family support</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-mono uppercase text-slate-500">Total Interventions</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{interventions.length} logged</div>
          <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 100% human authorized
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-mono uppercase text-slate-500">Scheduled Follow-Ups</div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {interventions.filter((i) => i.followUpDate).length} pending
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Review dates assigned</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-mono uppercase text-slate-500">Duty Roster Adjustments</div>
          <div className="text-2xl font-bold font-mono text-teal-700 mt-1">
            {interventions.filter((i) => i.actionType.includes('Rest') || i.actionType.includes('Leave')).length} completed
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Fatigue mitigation recorded</div>
        </div>
      </div>

      {/* Interventions Stream Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
            Recorded Officer Actions ({filtered.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            Chronological Sequence
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No interventions match the selected filter.
            </div>
          ) : (
            filtered.map((inv) => (
              <div key={inv.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onSelectPersonnel(inv.personnelId)}
                      className="font-mono font-bold text-slate-900 text-sm hover:text-teal-700 underline"
                    >
                      {inv.personnelId}
                    </button>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-200">
                      {inv.actionType}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      By: <strong>{inv.officerRole} ({inv.officerId})</strong>
                    </span>
                  </div>

                  <span className="text-slate-400 font-mono text-[11px]">{inv.timestamp}</span>
                </div>

                <div className="mt-2 text-slate-700 font-sans leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                  {inv.notes}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1 text-slate-700 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Scheduled Follow-Up: <strong className="text-teal-800">{inv.followUpDate}</strong></span>
                  </div>

                  <button
                    onClick={() => onSelectPersonnel(inv.personnelId)}
                    className="text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
                  >
                    <span>View Case File</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
