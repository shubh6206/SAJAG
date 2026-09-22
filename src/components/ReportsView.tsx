import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { Personnel, UnitAnalytics } from '../types';

interface ReportsViewProps {
  analytics: UnitAnalytics;
  personnelList: Personnel[];
  onSelectPersonnel: (id: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  analytics,
  personnelList,
  onSelectPersonnel,
}) => {
  const [reportDate, setReportDate] = useState('14 Sep 2026');
  const [copied, setCopied] = useState(false);

  const humanReviewCases = personnelList.filter((p) => p.unified.state === 'Human Review');

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `SAJAG EXECUTIVE WELFARE BRIEFING (SIH26186)
Ministry of Home Affairs - CAPF Personnel Stress & Welfare Monitoring System
Unit: ${analytics.unitName}
Date: ${reportDate}

1. UNIT READINESS SUMMARY:
- Monitored: ${analytics.totalMonitored}
- Stable/Normal: ${analytics.normalCount} (74.2%)
- Elevated: ${analytics.elevatedCount} (16.5%)
- Human Review Priority: ${analytics.humanReviewCount} (9.3%)

2. PRIMARY OPERATIONAL CONCERNS:
- Border deployment consecutive duty cycles (>14d): 19 personnel
- Sanctioned leave deficit backlog: 31 personnel
- Top welfare grievances: Leave (42), Workload (31), Family Support (24)

3. DATA PRIVACY & COMPLIANCE:
- Data minimization strictly enforced.
- Zero raw personal biometrics transmitted to cloud.
- Air-gapped local NLP classification verified.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div id="reports" className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 font-mono">
            EXECUTIVE WELFARE BRIEFINGS &amp; REPORTS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Formatted welfare summaries for Battalion Commanders and MHA Welfare Directorate.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY BRIEFING TEXT'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT REPORT</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white rounded-xl border border-slate-300 p-8 shadow-sm max-w-4xl mx-auto space-y-6 text-slate-900 font-sans">
        {/* Document Header */}
        <div className="border-b-2 border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
              CONFIDENTIAL &bull; MINISTRY OF HOME AFFAIRS
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 font-mono mt-1">
              SAJAG WELFARE OFFICER SITUATION REPORT
            </h1>
            <p className="text-xs text-slate-600">
              Smart India Hackathon SIH26186 &bull; Operational Welfare Intelligence
            </p>
          </div>

          <div className="text-right font-mono text-xs text-slate-600">
            <div>Unit: <strong>{analytics.unitName}</strong></div>
            <div>Date: <strong>{reportDate}</strong></div>
            <div>Security: <strong className="text-emerald-700">Air-Gapped Local Store</strong></div>
          </div>
        </div>

        {/* Executive Summary */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono mb-2">
            1. Unit Wellbeing KPI Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-mono">PERSONNEL</span>
              <strong className="text-base font-mono text-slate-900">{analytics.totalMonitored}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-mono">NORMAL (STABLE)</span>
              <strong className="text-base font-mono text-emerald-700">{analytics.normalCount} (74.2%)</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-mono">ELEVATED</span>
              <strong className="text-base font-mono text-amber-700">{analytics.elevatedCount} (16.5%)</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-red-200 bg-red-50/20">
              <span className="text-red-700 block text-[10px] font-mono font-bold">HUMAN REVIEW</span>
              <strong className="text-base font-mono text-red-700">{analytics.humanReviewCount} Cases</strong>
            </div>
          </div>
        </div>

        {/* Priority Case Review Table in Report */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono mb-2">
            2. High-Priority Case Review Docket
          </h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 font-mono text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Personnel ID</th>
                  <th className="p-2.5">Posting / Load</th>
                  <th className="p-2.5">Composite Risk</th>
                  <th className="p-2.5">Primary Contributing Factor</th>
                  <th className="p-2.5">Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {humanReviewCases.map((p) => (
                  <tr key={p.id}>
                    <td className="p-2.5 font-mono font-bold">{p.id}</td>
                    <td className="p-2.5">{p.posting} ({p.operational.consecutiveDutyDays}d consecutive)</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                        {p.unified.score} / 100
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-700">{p.unified.whyFlagged[0]}</td>
                    <td className="p-2.5 text-teal-800 font-medium">{p.unified.recommendedActions[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Privacy & Governance Assurance Signoff */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>MHA DATA MINIMIZATION &amp; ETHICS MANDATE</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            In compliance with Smart India Hackathon guidelines and military privacy protocols, raw continuous ECG/HR telemetry, biometric recordings, and private personal diary entries are <strong>neither logged nor presented</strong> in this report. Officers act solely upon aggregated risk indicators, baseline deviations, and verified operational duty rosters.
          </p>
        </div>

        {/* Signatures */}
        <div className="pt-8 border-t border-slate-300 flex justify-between text-xs font-mono text-slate-700">
          <div>
            <div className="border-b border-slate-400 w-48 pb-1">Welfare Officer (WO-102)</div>
            <div className="text-[10px] text-slate-500 mt-1">Authorized Reviewer Signature</div>
          </div>
          <div className="text-right">
            <div className="border-b border-slate-400 w-48 pb-1">Commanding Officer</div>
            <div className="text-[10px] text-slate-500 mt-1">14th Bn BSF Headquarters</div>
          </div>
        </div>
      </div>
    </div>
  );
};
