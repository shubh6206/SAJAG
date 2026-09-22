import React from 'react';
import {
  ShieldCheck,
  Lock,
  FileSpreadsheet,
  AlertCircle,
  Key,
  Server,
  UserCheck,
  CheckCircle2,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { AuditLogEntry, UserRole } from '../types';

interface AuditViewProps {
  auditLogs: AuditLogEntry[];
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const AuditView: React.FC<AuditViewProps> = ({
  auditLogs,
  currentRole,
  onRoleChange,
}) => {
  return (
    <div id="security-audit" className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 font-mono">
              SECURITY &amp; AUDIT LOGGING
            </h2>
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Tamper-Evident Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable audit record of all case accesses, grievance decrypts, and human interventions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500">Active Identity:</span>
          <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-bold">
            {currentRole} (WO-102)
          </span>
        </div>
      </div>

      {/* 6 KEY PRIVACY & SECURITY ASSURANCE PILLARS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 font-mono">
            <Cpu className="w-3.5 h-3.5" />
            <span>Local NLP</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Air-gapped local model</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>No Cloud LLM</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Zero external transmission</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 font-mono">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Encrypted Data</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">At-rest container storage</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 font-mono">
            <Key className="w-3.5 h-3.5" />
            <span>RBAC Enforced</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Role-authorized views</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 font-mono">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Audit Logged</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Every access recorded</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 font-mono">
            <Server className="w-3.5 h-3.5" />
            <span>Offline Capable</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Local edge execution</p>
        </div>
      </div>

      {/* ROLE-BASED ACCESS CONTROL (RBAC) MATRIX */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
              ROLE-BASED ACCESS CONTROL (RBAC) &amp; DATA MINIMIZATION MATRIX
            </h3>
            <p className="text-xs text-slate-500">
              Granular access permissions strictly limit exposure of personal biometrics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">Simulate Role:</span>
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as any)}
              className="text-xs font-bold bg-slate-100 border border-slate-300 rounded px-2 py-1 text-slate-800"
            >
              <option value="Welfare Officer">Welfare Officer</option>
              <option value="Medical Officer">Medical Officer</option>
              <option value="Commander">Commander</option>
              <option value="Personnel">Personnel</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
            <thead className="bg-slate-100 font-mono text-slate-700">
              <tr>
                <th className="p-2.5">Access Scope</th>
                <th className="p-2.5 text-center">Welfare Officer</th>
                <th className="p-2.5 text-center">Medical Officer</th>
                <th className="p-2.5 text-center">Commander</th>
                <th className="p-2.5 text-center">Personnel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-sans">
              <tr>
                <td className="p-2.5 font-medium">Own Telemetry &amp; Check-ins</td>
                <td className="p-2.5 text-center text-slate-400">&mdash;</td>
                <td className="p-2.5 text-center text-slate-400">&mdash;</td>
                <td className="p-2.5 text-center text-slate-400">&mdash;</td>
                <td className="p-2.5 text-center text-emerald-700 font-bold">✓ Full Access</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Assigned Personnel Tri-Pillar Risk</td>
                <td className="p-2.5 text-center text-emerald-700 font-bold">✓ Full Access</td>
                <td className="p-2.5 text-center text-emerald-700 font-bold">✓ Full Access</td>
                <td className="p-2.5 text-center text-slate-400">Aggregated Only</td>
                <td className="p-2.5 text-center text-slate-400">&mdash;</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Clinical Physiological Baseline</td>
                <td className="p-2.5 text-center text-slate-600">Deviation % Only</td>
                <td className="p-2.5 text-center text-emerald-700 font-bold">✓ Full Clinical Details</td>
                <td className="p-2.5 text-center text-slate-400">Restricted</td>
                <td className="p-2.5 text-center text-slate-400">Restricted</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Welfare Grievance Source Text</td>
                <td className="p-2.5 text-center text-emerald-700 font-bold">✓ Authorized Click-to-View</td>
                <td className="p-2.5 text-center text-slate-400">Restricted</td>
                <td className="p-2.5 text-center text-slate-400">Restricted</td>
                <td className="p-2.5 text-center text-slate-600">Own Only</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Record Human Intervention</td>
                <td className="p-2.5 text-center text-emerald-700 font-bold">✓ Permitted</td>
                <td className="p-2.5 text-center text-emerald-700 font-bold">✓ Permitted (Medical)</td>
                <td className="p-2.5 text-center text-slate-400">Advisory</td>
                <td className="p-2.5 text-center text-slate-400">&mdash;</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* LIVE AUDIT LOG TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
            ACCESS AUDIT EVENT STREAM ({auditLogs.length} EVENTS)
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            Auto-Generated on User Actions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-mono text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-3 py-2.5">Officer ID</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="px-3 py-2.5">Action</th>
                <th className="px-3 py-2.5">Target Case</th>
                <th className="px-4 py-2.5">Result</th>
                <th className="px-4 py-2.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-900">
                    {log.officerId}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 text-[11px]">
                    {log.officerRole}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">
                    {log.action}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-teal-700">
                    {log.caseId || '&mdash;'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {log.result}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 text-[11px]">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
