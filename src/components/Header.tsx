import React, { useState } from 'react';
import {
  Shield,
  Wifi,
  WifiOff,
  ChevronDown,
  Sparkles,
  Activity,
  CheckCircle2,
  Lock,
  UserCheck,
} from 'lucide-react';
import { PostingType, UserRole, DemoScenarioId } from '../types';
import { SystemHealthModal } from './SystemHealthModal';

interface HeaderProps {
  currentUnit: string;
  onUnitChange: (unit: string) => void;
  currentPosting: PostingType | 'All';
  onPostingChange: (posting: PostingType | 'All') => void;
  currentPeriod: string;
  onPeriodChange: (period: string) => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentScenario: DemoScenarioId;
  onSelectScenario: (scenarioId: DemoScenarioId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUnit,
  onUnitChange,
  currentPosting,
  onPostingChange,
  currentPeriod,
  onPeriodChange,
  isOffline,
  onToggleOffline,
  currentRole,
  onRoleChange,
  currentScenario,
  onSelectScenario,
}) => {
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40">
      {/* 1. TOP BAR: National Identity, Air-Gapped Status & System Health */}
      <div className="bg-slate-950 px-4 sm:px-6 py-1.5 border-b border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-3 font-mono">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <span className="font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            MHA &bull; Govt of India
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">SIH Problem Statement: <strong>SIH26186</strong></span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold tracking-wider uppercase font-mono">
            ANONYMIZED / SYNTHETIC DEMO DATA
          </span>
          <span className="text-teal-400 font-medium hidden md:inline">
            CAPF Personnel Stress &amp; Welfare Monitoring
          </span>
        </div>

        {/* System Health Status vs Data Sync Status */}
        <div className="flex items-center gap-3">
          {/* System Health (Verification / Tests) */}
          <button
            onClick={() => setIsHealthModalOpen(true)}
            title="Inspect system verification & 32/32 tests"
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors bg-teal-950/90 text-teal-300 border border-teal-800/80 hover:bg-teal-900 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            <span>● SYSTEM HEALTHY (32/32 TESTS)</span>
          </button>

          {/* Local Sync / Air-Gapped Mode */}
          <button
            onClick={onToggleOffline}
            title="Toggle offline air-gap simulation"
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
              isOffline
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
            }`}
          >
            {isOffline ? <WifiOff className="w-3 h-3 text-amber-400" /> : <Wifi className="w-3 h-3 text-emerald-400" />}
            <span>{isOffline ? '● OFFLINE / LOCAL' : '● SECURE LOCAL'}</span>
          </button>

          <span className="text-slate-400 text-[11px] hidden lg:inline">
            Sync: 4 min ago
          </span>
        </div>
      </div>

      {/* 2. PRODUCT HEADER: Identity & Active Role Badge */}
      <div className="px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-slate-900 border border-teal-400/40 flex items-center justify-center shadow-inner shrink-0">
            <Shield className="w-5 h-5 text-teal-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                SAJAG
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono">
                Personnel Welfare Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Early Signals. Better Welfare. Human Action.
            </p>
          </div>
        </div>

        {/* Prominent Active Role Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Active Access Boundary</span>
            <span className="text-xs font-bold font-mono text-teal-300">
              {currentRole} &bull; WO-102
            </span>
          </div>
          <span className="px-2.5 py-1 rounded bg-teal-900/60 border border-teal-700/60 text-teal-200 text-xs font-mono font-semibold flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>{currentRole} Access</span>
          </span>
        </div>
      </div>

      {/* 3. CONTEXT BAR: Unit | Posting | Period | Demo Scenario | RBAC Role */}
      <div className="px-4 sm:px-6 py-2 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Operational Scope Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Unit Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] text-slate-400 uppercase font-mono">Unit:</label>
            <div className="relative">
              <select
                value={currentUnit}
                onChange={(e) => onUnitChange(e.target.value)}
                className="appearance-none bg-slate-800 text-slate-200 text-xs pl-2 pr-6 py-1 rounded border border-slate-700 hover:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-medium"
              >
                <option value="14th Bn BSF">14th Bn BSF (Border)</option>
                <option value="8th Bn CRPF">8th Bn CRPF (Field)</option>
                <option value="ITBP High Altitude Wing">ITBP High Altitude Wing</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Posting Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] text-slate-400 uppercase font-mono">Posting:</label>
            <div className="relative">
              <select
                value={currentPosting}
                onChange={(e) => onPostingChange(e.target.value as any)}
                className="appearance-none bg-slate-800 text-slate-200 text-xs pl-2 pr-6 py-1 rounded border border-slate-700 hover:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-medium"
              >
                <option value="All">All Postings</option>
                <option value="Border">Border</option>
                <option value="Field">Field</option>
                <option value="High Altitude">High Altitude</option>
                <option value="Peace">Peace Station</option>
                <option value="Training">Training</option>
                <option value="Emergency Deployment">Emergency Deployment</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] text-slate-400 uppercase font-mono">Period:</label>
            <div className="relative">
              <select
                value={currentPeriod}
                onChange={(e) => onPeriodChange(e.target.value)}
                className="appearance-none bg-slate-800 text-slate-200 text-xs pl-2 pr-6 py-1 rounded border border-slate-700 hover:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-medium"
              >
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 14 Days">Last 14 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Demo Scenario Switcher (Clear and Unmistakable) & Role Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Scenarios */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] font-mono text-teal-400 font-bold px-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>SCENARIO:</span>
            </span>

            {/* Scenario B (Hero) */}
            <button
              onClick={() => onSelectScenario('B')}
              title="Scenario B (SIH Hero): Normal biometrics but High Operational & Welfare Risk -> Human Review"
              className={`px-2 py-1 text-xs font-bold rounded font-mono transition-all cursor-pointer ${
                currentScenario === 'B'
                  ? 'bg-red-600 text-white shadow-xs ring-1 ring-red-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Scenario B <span className="text-[10px] font-normal opacity-90">(Hero: Ops/Welfare)</span>
            </button>

            {/* Scenario A */}
            <button
              onClick={() => onSelectScenario('A')}
              title="Scenario A: High Physiological Stress + Low Welfare Risk -> Rest/Recovery"
              className={`px-2 py-1 text-xs font-bold rounded font-mono transition-all cursor-pointer ${
                currentScenario === 'A'
                  ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Scenario A <span className="text-[10px] font-normal opacity-90">(Physio)</span>
            </button>

            {/* Scenario C */}
            <button
              onClick={() => onSelectScenario('C')}
              title="Scenario C: Recovering Personnel -> Decreasing Risk Trajectory"
              className={`px-2 py-1 text-xs font-bold rounded font-mono transition-all cursor-pointer ${
                currentScenario === 'C'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Scenario C <span className="text-[10px] font-normal opacity-90">(Recovery)</span>
            </button>

            {/* Scenario D */}
            <button
              onClick={() => onSelectScenario('D')}
              title="Scenario D: Data Sparsity -> Low Confidence calibration pending"
              className={`px-2 py-1 text-xs font-bold rounded font-mono transition-all cursor-pointer ${
                currentScenario === 'D'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Scenario D <span className="text-[10px] font-normal opacity-90">(Sparse)</span>
            </button>
          </div>

          {/* RBAC Role Selector */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <label className="text-[10px] text-slate-400 uppercase font-mono">Role:</label>
            <div className="relative">
              <select
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="appearance-none bg-slate-800 text-slate-200 text-xs pl-2 pr-6 py-1 rounded border border-slate-700 hover:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-medium"
              >
                <option value="Welfare Officer">Welfare Officer (Full Review)</option>
                <option value="Medical Officer">Medical Officer (Clinical)</option>
                <option value="Commander">Commander (Unit Aggregate)</option>
                <option value="Personnel">Personnel (Own Welfare)</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* System Health Modal */}
      <SystemHealthModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        isOffline={isOffline}
      />
    </header>
  );
};
