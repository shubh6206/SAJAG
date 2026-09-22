import React, { useState } from 'react';
import {
  ArrowLeft,
  Shield,
  Clock,
  HeartPulse,
  MessageSquareHeart,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Send,
  Sparkles,
  Info,
  HelpCircle,
  FileCheck2,
  ChevronRight,
  TrendingUp,
  Activity,
  User,
  X,
  Layers,
} from 'lucide-react';
import {
  Personnel,
  UserRole,
  InterventionRecord,
  WelfareGrievance,
  VoluntaryCheckIn,
  CaseHistoryEvent,
} from '../types';
import { ApiService } from '../services/api';

interface PersonnelReviewProps {
  person: Personnel;
  onBack: () => void;
  currentRole: UserRole;
  grievances: WelfareGrievance[];
  checkins: VoluntaryCheckIn[];
  interventions: InterventionRecord[];
  caseHistory: CaseHistoryEvent[];
  onSaveIntervention: (actionType: InterventionRecord['actionType'], notes: string, followUpDate: string) => Promise<void>;
}

interface AttributionModalData {
  title: string;
  metric: string;
  observedValue: string;
  personalBaseline: string;
  deviation: string;
  confidence: string;
  timeWindow: string;
  source: string;
  explanation: string;
  colorTheme: 'teal' | 'amber' | 'blue' | 'emerald';
}

export const PersonnelReview: React.FC<PersonnelReviewProps> = ({
  person,
  onBack,
  currentRole,
  grievances,
  checkins,
  interventions,
  caseHistory,
  onSaveIntervention,
}) => {
  // Local state for intervention form
  const [selectedAction, setSelectedAction] = useState<InterventionRecord['actionType']>('Welfare conversation');
  const [interventionNotes, setInterventionNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('18 Sep 2026');
  const [isSavingIntervention, setIsSavingIntervention] = useState(false);
  const [interventionSuccessMsg, setInterventionSuccessMsg] = useState<string | null>(null);

  // Privacy toggles (Data Minimization)
  const [revealedGrievanceId, setRevealedGrievanceId] = useState<string | null>(null);
  const [revealNotification, setRevealNotification] = useState<string | null>(null);

  const handleToggleRevealGrievance = async (grievanceId: string) => {
    if (revealedGrievanceId === grievanceId) {
      setRevealedGrievanceId(null);
    } else {
      setRevealedGrievanceId(grievanceId);
      try {
        await ApiService.revealGrievance(grievanceId);
        setRevealNotification(`AUDITED REVEAL: Logged in immutable audit trail for Welfare Officer WO-102 (${new Date().toLocaleTimeString()})`);
        setTimeout(() => setRevealNotification(null), 5000);
      } catch (e) {
        console.warn('Audit reveal logging error', e);
      }
    }
  };

  // Attribution modal state
  const [activeAttribution, setActiveAttribution] = useState<AttributionModalData | null>(null);

  // 7-day trajectory line toggles
  const [showUnifiedLine, setShowUnifiedLine] = useState(true);
  const [showPhysLine, setShowPhysLine] = useState(true);
  const [showOpsLine, setShowOpsLine] = useState(true);
  const [showWelfareLine, setShowWelfareLine] = useState(true);

  const handleInterventionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interventionNotes.trim()) return;
    setIsSavingIntervention(true);
    try {
      await onSaveIntervention(selectedAction, interventionNotes, followUpDate);
      setInterventionSuccessMsg(`INTERVENTION RECORDED ✓ Next review scheduled: ${followUpDate}`);
      setInterventionNotes('');
      setTimeout(() => setInterventionSuccessMsg(null), 6000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingIntervention(false);
    }
  };

  const isHumanReviewRequired = person.unified.state === 'Human Review';
  const isPersistent = person.unified.persistenceDays >= 3;

  // Click handlers for the Waterfall contributions
  const handlePhysiologicalClick = () => {
    setActiveAttribution({
      title: 'Physiological Strain Contribution',
      metric: 'Resting Heart Rate & Autonomic HRV',
      observedValue: `${person.physiological.restingHrBpm} BPM (HRV: ${person.physiological.hrvMs} ms)`,
      personalBaseline: `${person.physiological.baselineHrBpm} BPM (HRV: ${person.physiological.baselineHrvMs} ms)`,
      deviation: `${person.physiological.hrDeviationPct > 0 ? '+' : ''}${person.physiological.hrDeviationPct}% from 14d baseline`,
      confidence: person.unified.confidence === 'LOW' ? 'LOW (Calibration Pending)' : 'HIGH (Multi-sensor verified)',
      timeWindow: 'Rolling 14-day window with 1.5x IQR outlier rejection',
      source: 'Edge PPG Wearable Sensor (Offline / Local Storage)',
      explanation:
        'Calculated by comparing current resting biometrics against the individual rolling baseline envelope. Deviations beyond personal variance contribute proportionally to physical strain.',
      colorTheme: 'teal',
    });
  };

  const handleOperationalClick = () => {
    setActiveAttribution({
      title: 'Operational Load Contribution',
      metric: 'Consecutive Duty & Night Shift Density',
      observedValue: `${person.operational.consecutiveDutyDays} consecutive days, ${person.operational.nightShiftsLast7d} night shifts`,
      personalBaseline: 'Standard roster: 6 days on, 1 day rest cycle',
      deviation: `+${Math.max(0, person.operational.consecutiveDutyDays - 6)} days beyond sanctioned rest cycle`,
      confidence: 'HIGH (Quartermaster Duty Logs)',
      timeWindow: 'Past 14 to 38 operational days in current sector',
      source: 'Unit Daily Order Part-II (Automated Roster Synchronization)',
      explanation:
        'Operational fatigue accumulates non-linearly with uninterrupted duty shifts and nocturnal patrol frequency, independently of physical fitness.',
      colorTheme: 'amber',
    });
  };

  const handleWelfareClick = () => {
    setActiveAttribution({
      title: 'Welfare Signals Contribution',
      metric: 'Voluntary Check-ins & Grievance Urgency',
      observedValue: `${person.welfare.unresolvedSignalsCount} unresolved grievance, sentiment shift`,
      personalBaseline: 'Zero unresolved domestic or administrative grievances',
      deviation: 'High-urgency family emergency request pending review',
      confidence: 'HIGH (Personnel Direct Submission)',
      timeWindow: 'Past 7 days',
      source: 'Confidential Local Welfare Portal (Air-Gapped Container)',
      explanation:
        'Local NLP classifies voluntary text for distress and urgency without cloud transmission. Grievances in Leave or Family categories compound operational stress.',
      colorTheme: 'blue',
    });
  };

  const handleRecoveryClick = () => {
    setActiveAttribution({
      title: 'Protective Factors & Recovery Offset',
      metric: 'Autonomic Recovery Index & Hydration',
      observedValue: `${person.physiological.recoveryIndex} / 100 Recovery Score`,
      personalBaseline: '65 / 100 standard recovery index',
      deviation: `${person.physiological.recoveryIndex >= 50 ? 'Adequate physiological buffering' : 'Reduced resilience reserve'}`,
      confidence: 'MEDIUM',
      timeWindow: 'Last 24 hours',
      source: 'Edge Wearable Sleep & Autonomic Analysis',
      explanation:
        'Protective factors (sound restorative sleep, hydration, and peer support) act as positive offsets, mitigating raw strain before final risk synthesis.',
      colorTheme: 'emerald',
    });
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-150">
      {/* 0. PROVENANCE BANNER */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 font-mono">
        <span className="font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          ANONYMIZED / SYNTHETIC DEMONSTRATION DATA &bull; SIH PROBLEM STATEMENT SIH26186
        </span>
        <span className="text-[11px] text-amber-800">
          Edge-Processed &bull; Local-First Architecture &bull; Non-Punitive Welfare Monitoring
        </span>
      </div>

      {revealNotification && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-lg px-4 py-2.5 text-xs text-emerald-900 font-mono flex items-center justify-between animate-in fade-in">
          <span className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {revealNotification}
          </span>
          <button
            onClick={() => setRevealNotification(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* 5-SECOND CASE HEADER (Sections 6 & 7) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* WHO is this? */}
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              title="Return to Directory / Overview"
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer shrink-0 mt-0.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Directory</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  PERSONNEL CASE
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Authorized Welfare Review
                </span>
              </div>

              <div className="flex items-baseline gap-2.5 mt-0.5">
                <h1 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                  {person.id}
                </h1>
                <span className="text-base text-slate-700 font-medium">
                  {person.rank}
                </span>
              </div>

              {/* Service & HR Data Chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1.5 font-mono">
                <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{person.unit}</span>
                <span>&bull;</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">{person.posting} Posting</span>
                <span>&bull;</span>
                <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{person.deploymentDays} days deployed</span>
                <span>&bull;</span>
                <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{person.serviceDurationYears ?? 7.5} yrs service</span>
                <span>&bull;</span>
                <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{person.transferCount ?? 2} transfers</span>
                <span>&bull;</span>
                <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{person.trainingDaysThisYear ?? 8}d training</span>
              </div>

              {/* Leave & Recovery Deficit Highlight */}
              <div className="flex flex-wrap items-center gap-2 text-xs mt-2 font-mono">
                <span className="bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 rounded font-semibold">
                  Leave Deficit: {person.lastSanctionedLeaveDaysAgo} days since last sanctioned leave
                </span>
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  Leave Record: {person.leaveSanctionedDays ?? 12}d sanctioned / {person.leaveDeniedDays ?? 0}d denied
                </span>
                <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                  Recovery Opportunity Score: {person.recoveryOpportunityScore ?? 55}/100
                </span>
              </div>
            </div>
          </div>

          {/* HOW serious is it? (Unified Risk & Review State) */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">
                UNIFIED RISK
              </span>
              <div className="flex items-baseline gap-1.5 justify-end mt-0.5">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {person.unified.score}
                </span>
                <span className="text-xs text-slate-500 font-mono">/ 100</span>
              </div>
            </div>

            <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>

            <div>
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs ${
                  isHumanReviewRequired
                    ? 'bg-red-600 text-white ring-1 ring-red-400'
                    : person.unified.state === 'High'
                    ? 'bg-rose-600 text-white'
                    : person.unified.state === 'Elevated'
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {isHumanReviewRequired && <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />}
                <span>
                  {isHumanReviewRequired ? 'HIGH · HUMAN REVIEW REQUIRED' : person.unified.state}
                </span>
              </span>
              <div className="text-[11px] text-slate-500 font-mono mt-1 flex items-center gap-2">
                <span>Last assessment: <strong>Today &bull; 17:15</strong></span>
                <span>&bull;</span>
                <span>Confidence: <strong className={person.unified.confidence === 'LOW' ? 'text-amber-700' : 'text-emerald-700'}>{person.unified.confidence}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Answer: WHY was this person flagged? & WHAT to do next? */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/80 text-amber-900">
            <strong className="font-mono text-[11px] uppercase tracking-wider text-amber-950 block">
              PRIMARY TRIGGER DRIVERS
            </strong>
            <p className="mt-0.5 leading-relaxed text-[11px]">
              {person.unified.whyFlagged.join(' · ')}
            </p>
          </div>

          <div className="bg-teal-50/70 p-2.5 rounded-lg border border-teal-200/80 text-teal-900 flex items-center justify-between">
            <div>
              <strong className="font-mono text-[11px] uppercase tracking-wider text-teal-950 block">
                RECOMMENDED ACTION
              </strong>
              <p className="mt-0.5 font-medium text-[11px]">
                {person.unified.recommendedAction}
              </p>
            </div>
            <a
              href="#record-intervention"
              className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded text-[11px] font-semibold transition-colors shrink-0 cursor-pointer"
            >
              Take Action &darr;
            </a>
          </div>
        </div>
      </div>

      {/* HERO SCENARIO B DEMONSTRATION BANNER */}
      {person.id === 'PX-1042' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center shrink-0 text-amber-800">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  DEMO SCENARIO B (KILLER DEMO)
                </span>
                <h2 className="text-sm font-bold tracking-tight">
                  Normal Biometrics with High Operational &amp; Welfare Risk
                </h2>
              </div>
              <p className="text-xs text-amber-800 mt-1.5 leading-relaxed">
                Notice that <strong>PX-1042's physiological biometrics are completely normal</strong> (Resting HR 69 BPM, HRV 51ms, Sleep 6.9h). Wearable fitness sensors alone would declare this person perfectly healthy! Yet <strong>SAJAG correctly escalates to HUMAN REVIEW REQUIRED (Score 78)</strong> because of 18 consecutive duty days, night shift overload, an overdue 43-day leave deficit, and 2 high-urgency unresolved family welfare grievances.
              </p>
              <div className="mt-2 text-[11px] font-mono text-amber-900 flex items-center gap-2">
                <span className="bg-amber-200/80 px-2 py-0.5 rounded font-bold">Key Insight:</span>
                <span>Normal biometrics do NOT equal normal welfare. Early Signals &bull; Better Welfare &bull; Human Action.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCENARIO A DEMONSTRATION BANNER */}
      {person.id === 'PX-1091' && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 text-rose-950 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-200 flex items-center justify-center shrink-0 text-rose-800">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-rose-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  DEMO SCENARIO A
                </span>
                <h2 className="text-sm font-bold tracking-tight">
                  High Physiological Strain with Low Welfare Risk &rarr; Rest &amp; Recovery Protocol
                </h2>
              </div>
              <p className="text-xs text-rose-900 mt-1.5 leading-relaxed">
                <strong>PX-1091</strong> exhibits severe acute physical strain: elevated resting heart rate (+28% above baseline), suppressed HRV autonomic tone (29ms), and accumulated sleep debt (4.2h sleep/night). However, welfare signals remain clean with no unresolved family grievances. The system prescribes targeted operational rest and recovery leave rather than psychiatric or punitive escalation.
              </p>
              <div className="mt-2 text-[11px] font-mono text-rose-900 flex items-center gap-2">
                <span className="bg-rose-200 px-2 py-0.5 rounded font-bold">Key Insight:</span>
                <span>Physiological fatigue is decoupled from psychological distress, enabling targeted restorative rest.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCENARIO C DEMONSTRATION BANNER */}
      {person.id === 'PX-1148' && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 text-emerald-950 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center shrink-0 text-emerald-800">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  DEMO SCENARIO C
                </span>
                <h2 className="text-sm font-bold tracking-tight">
                  Recovering Personnel &rarr; Decreasing Risk Trajectory
                </h2>
              </div>
              <p className="text-xs text-emerald-900 mt-1.5 leading-relaxed">
                <strong>PX-1148</strong> illustrates positive temporal trajectory response. Following a commander-sanctioned 72-hour rest cycle and grievance resolution, the unified risk score dropped from 74 down to 32. The 7-day trajectory chart below clearly captures this downward trend, validating successful intervention impact.
              </p>
              <div className="mt-2 text-[11px] font-mono text-emerald-900 flex items-center gap-2">
                <span className="bg-emerald-200 px-2 py-0.5 rounded font-bold">Key Insight:</span>
                <span>Temporal trajectory distinguishes sustained chronic burden from successful post-intervention recovery.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCENARIO D DEMONSTRATION BANNER */}
      {person.id === 'PX-1205' && (
        <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-4 text-indigo-950 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center shrink-0 text-indigo-800">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  DEMO SCENARIO D
                </span>
                <h2 className="text-sm font-bold tracking-tight">
                  Data Sparsity &bull; Low Confidence Handling (Non-Punitive Rule)
                </h2>
              </div>
              <p className="text-xs text-indigo-900 mt-1.5 leading-relaxed">
                <strong>PX-1205</strong> has partial telemetry (wearable worn irregularly, baseline calibration pending &lt;5 days). In SAJAG, <strong>missing physiological data is NEVER manufactured or penalized as high risk</strong>. The confidence score is transparently marked <strong>LOW</strong>, preventing false automated escalations.
              </p>
              <div className="mt-2 text-[11px] font-mono text-indigo-900 flex items-center gap-2">
                <span className="bg-indigo-200 px-2 py-0.5 rounded font-bold">Key Insight:</span>
                <span>Uncertainty is surfaced transparently. Absence of data is treated as low confidence, never as high risk.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* THREE TRI-PILLAR CARDS (Section 8) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Physiological Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    PHYSIOLOGICAL
                  </h3>
                  <span className="text-sm font-bold text-slate-900">
                    {person.physiological.score} / 100 &bull; {person.physiological.state}
                  </span>
                </div>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${
                  person.physiological.telemetryStatus === 'PARTIAL TELEMETRY'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : person.physiological.state === 'Stable'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {person.physiological.telemetryStatus || (person.physiological.hrDeviationPct > 10 ? '↑ From baseline' : 'Near baseline')}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 font-mono mt-1">
              Compared with this person's recent baseline (14-day rolling window)
            </p>

            {person.physiological.telemetryStatus === 'PARTIAL TELEMETRY' && (
              <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                <strong>Data Sparsity Notice:</strong> Insufficient physiological telemetry. Missing signals are NEVER manufactured or scored as elevated risk.
              </div>
            )}

            <div className="mt-3.5 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Resting HR:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {person.physiological.restingHrBpm} BPM (Base: {person.physiological.baselineHrBpm})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">HRV Autonomic:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {person.physiological.hrvMs > 0 ? `${person.physiological.hrvMs} ms` : 'Telemetry missing'} (Base: {person.physiological.baselineHrvMs} ms)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Sleep Duration:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {person.physiological.sleepDurationHrs > 0 ? `${person.physiological.sleepDurationHrs}h` : 'Telemetry missing'} (Typical: {person.physiological.baselineSleepDurationHrs}h)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Sleep Debt:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {person.physiological.sleepDebtHrs}h accumulated
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Recovery Index:</span>
                <span className="font-mono font-bold text-teal-700">
                  {person.physiological.recoveryIndex} / 100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    OPERATIONAL
                  </h3>
                  <span className="text-sm font-bold text-slate-900">
                    {person.operational.score} / 100 &bull; {person.operational.state}
                  </span>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  person.operational.score > 70
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {person.operational.loadCategory} Load
              </span>
            </div>

            <p className="text-[10px] text-slate-400 font-mono mt-1">
              Duty roster, shift density &amp; leave deficit analytics
            </p>

            <div className="mt-3.5 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Duty Workload:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {person.operational.dailyDutyHours ?? 10}h/day &bull; {person.operational.weeklyDutyHours ?? 68}h/week
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Consecutive Duty:</span>
                <span className="font-semibold text-red-600 font-mono">
                  {person.operational.consecutiveDutyDays} days without 24h rest
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Night Patrols (7d):</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {person.operational.nightShiftsLast7d} nights ({person.operational.patrolFrequencyPerWeek ?? 5} patrols/wk)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Rest Deficit:</span>
                <span className="font-semibold text-amber-700 font-mono">
                  {person.operational.restPeriodDeficitHours ?? 12}h deficit below standard rest
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Leave Sanction:</span>
                <span className="font-semibold text-amber-700 font-mono">
                  {person.lastSanctionedLeaveDaysAgo} days since last leave
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Welfare Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <MessageSquareHeart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    WELFARE
                  </h3>
                  <span className="text-sm font-bold text-slate-900">
                    {person.welfare.score} / 100 &bull; {person.welfare.state}
                  </span>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  person.welfare.score > 70
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {person.welfare.supportRequested ? 'Support Requested' : 'Standard'}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 font-mono mt-1">
              Confidential grievances &amp; voluntary wellness check-ins
            </p>

            <div className="mt-3.5 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Unresolved Signals:</span>
                <span className="font-bold text-red-600 font-mono">
                  {person.welfare.unresolvedSignalsCount} active grievances
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Check-In Trajectory:</span>
                <span className="font-semibold text-slate-800">
                  {person.welfare.recentCheckInChangeDetected ? 'Dropped to "Need Support"' : 'Stable sentiment'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Top Grievance Category:</span>
                <span className="font-semibold text-slate-800">Emergency Leave / Family</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Local NLP Status:</span>
                <span className="font-semibold text-emerald-700">Air-gapped (Local)</span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
              Voluntary participation respected &bull; Missing check-in never increases risk
            </div>
          </div>
        </div>
      </div>

      {/* CLICKABLE RISK CONTRIBUTION WATERFALL (Section 9) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-teal-600" />
              RISK CONTRIBUTION WATERFALL &bull; WHY WAS THIS PERSON FLAGGED?
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any contributing pillar below to inspect its mathematical baseline deviation, source telemetry, and explainability reasoning.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Unified Risk Score</span>
            <span className="text-xl font-extrabold font-mono text-slate-900">
              {person.unified.score} / 100
            </span>
          </div>
        </div>

        {/* Visual Waterfall Layout */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Branch 1: Physiological */}
            <button
              onClick={handlePhysiologicalClick}
              className="text-left bg-white p-3.5 rounded-lg border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">Physiological Strain</span>
                <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  +{person.unified.waterfallContributions.physiological} pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 line-clamp-2">
                Resting HR deviation, sleep debt, and autonomic HRV reduction.
              </p>
              <span className="text-[10px] text-teal-700 font-semibold mt-2 inline-flex items-center gap-1 group-hover:underline">
                <span>Click for metric details</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </button>

            {/* Branch 2: Operational */}
            <button
              onClick={handleOperationalClick}
              className="text-left bg-white p-3.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">Operational Load</span>
                <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  +{person.unified.waterfallContributions.operational} pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 line-clamp-2">
                {person.operational.consecutiveDutyDays} consecutive duty shifts &amp; night patrol density.
              </p>
              <span className="text-[10px] text-amber-700 font-semibold mt-2 inline-flex items-center gap-1 group-hover:underline">
                <span>Click for metric details</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </button>

            {/* Branch 3: Welfare */}
            <button
              onClick={handleWelfareClick}
              className="text-left bg-white p-3.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">Welfare Signals</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  +{person.unified.waterfallContributions.welfare} pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 line-clamp-2">
                {person.welfare.unresolvedSignalsCount} open grievance classified locally by NLP.
              </p>
              <span className="text-[10px] text-blue-700 font-semibold mt-2 inline-flex items-center gap-1 group-hover:underline">
                <span>Click for metric details</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </button>

            {/* Branch 4: Recovery / Protective */}
            <button
              onClick={handleRecoveryClick}
              className="text-left bg-white p-3.5 rounded-lg border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">Recovery Offset</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  -6 pts (Offset)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 line-clamp-2">
                Protective physiological recovery and peer support buffering.
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold mt-2 inline-flex items-center gap-1 group-hover:underline">
                <span>Click for metric details</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </button>
          </div>

          {/* Equation summary bar */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 flex-wrap text-slate-700">
              <span className="font-bold text-slate-900">FORMULA:</span>
              <span className="text-teal-700 font-semibold">+{person.unified.waterfallContributions.physiological} (Phys)</span>
              <span>+</span>
              <span className="text-amber-700 font-semibold">+{person.unified.waterfallContributions.operational} (Ops)</span>
              <span>+</span>
              <span className="text-blue-700 font-semibold">+{person.unified.waterfallContributions.welfare} (Welf)</span>
              <span>-</span>
              <span className="text-emerald-700 font-semibold">6 (Buffer)</span>
              <span>=</span>
              <span className="font-bold text-slate-950 bg-white px-2 py-0.5 rounded border border-slate-300">
                {person.unified.score} Unified Index
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Temporal Persistence: <strong>{person.unified.persistenceDays} days sustained</strong>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: WATERFALL EXPLAINABILITY INSPECTOR */}
      {activeAttribution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-mono font-bold text-base text-teal-300">
                  {activeAttribution.title}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {activeAttribution.metric}
                </span>
              </div>
              <button
                onClick={() => setActiveAttribution(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Observed Value</span>
                  <strong className="text-slate-900 text-sm font-mono block mt-0.5">
                    {activeAttribution.observedValue}
                  </strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Personal Baseline</span>
                  <strong className="text-slate-900 text-sm font-mono block mt-0.5">
                    {activeAttribution.personalBaseline}
                  </strong>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900">
                <span className="text-[10px] uppercase font-mono font-bold text-amber-800 block">Deviation</span>
                <span className="font-mono font-bold text-sm text-amber-950 mt-0.5 block">
                  {activeAttribution.deviation}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block">Signal Confidence:</span>
                  <span className="font-bold text-slate-800">{activeAttribution.confidence}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Time Window:</span>
                  <span className="font-bold text-slate-800">{activeAttribution.timeWindow}</span>
                </div>
              </div>

              <div className="text-[11px] font-mono">
                <span className="text-slate-500 block">Data Source:</span>
                <span className="font-bold text-slate-800">{activeAttribution.source}</span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
                  Explainability Reasoning
                </span>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                  {activeAttribution.explanation}
                </p>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveAttribution(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERSONAL BASELINE VISUALIZATION (Section 10) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              PERSONAL BASELINE ENVELOPE (14-DAY CALIBRATION)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual-referenced variance vs universal cutoffs: Normal range, Personal baseline, and Current 24-hour reading.
            </p>
          </div>
          <span
            className={`text-xs font-mono font-semibold px-2.5 py-1 rounded border ${
              person.unified.confidence === 'LOW'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {person.unified.confidence === 'LOW' ? 'Calibration Pending (<5 Days)' : 'Calibrated (14-Day Rolling)'}
          </span>
        </div>

        {/* Baseline Metric Rows */}
        <div className="space-y-4">
          {/* Metric 1: Resting Heart Rate */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex flex-wrap items-center justify-between text-xs gap-2 mb-2">
              <div>
                <span className="font-bold text-slate-800">Resting Heart Rate</span>
                <span className="text-slate-500 ml-2 font-mono">
                  Base: <strong>{person.physiological.baselineHrBpm} BPM</strong> &bull; Current: <strong>{person.physiological.restingHrBpm} BPM</strong>
                </span>
              </div>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                  person.physiological.hrDeviationPct > 15
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {person.physiological.hrDeviationPct > 15 ? 'ELEVATED DEVIATION' : 'NORMAL ENVELOPE'} ({person.physiological.hrDeviationPct > 0 ? '+' : ''}{person.physiological.hrDeviationPct}%)
              </span>
            </div>

            {/* Visual range bar */}
            <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
              <div className="absolute left-[30%] right-[30%] top-0 bottom-0 bg-emerald-200/70" title="Normal 14d Envelope"></div>
              <div
                className={`absolute top-0 bottom-0 w-2.5 rounded-full ${
                  person.physiological.hrDeviationPct > 15 ? 'bg-red-500' : 'bg-teal-600'
                }`}
                style={{
                  left: `${Math.min(92, Math.max(8, (person.physiological.restingHrBpm / 120) * 100))}%`,
                }}
                title={`Current: ${person.physiological.restingHrBpm} BPM`}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>50 BPM (Low)</span>
              <span className="text-emerald-700 font-bold">Personal Baseline Range ({person.physiological.baselineHrBpm} BPM)</span>
              <span>120 BPM (High)</span>
            </div>
          </div>

          {/* Metric 2: HRV Autonomic */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex flex-wrap items-center justify-between text-xs gap-2 mb-2">
              <div>
                <span className="font-bold text-slate-800">Heart Rate Variability (HRV Autonomic Tone)</span>
                <span className="text-slate-500 ml-2 font-mono">
                  Base: <strong>{person.physiological.baselineHrvMs} ms</strong> &bull; Current: <strong>{person.physiological.hrvMs} ms</strong>
                </span>
              </div>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                  person.physiological.hrvDeviationPct < -20
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {person.physiological.hrvDeviationPct < -20 ? 'AUTONOMIC SUPPRESSION' : 'NORMAL RANGE'} ({person.physiological.hrvDeviationPct}%)
              </span>
            </div>

            <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
              <div className="absolute left-[35%] right-[25%] top-0 bottom-0 bg-emerald-200/70" title="Normal 14d Envelope"></div>
              <div
                className={`absolute top-0 bottom-0 w-2.5 rounded-full ${
                  person.physiological.hrvDeviationPct < -20 ? 'bg-red-500' : 'bg-teal-600'
                }`}
                style={{
                  left: `${Math.min(92, Math.max(8, (person.physiological.hrvMs / 90) * 100))}%`,
                }}
                title={`Current: ${person.physiological.hrvMs} ms`}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>20 ms (Suppressed)</span>
              <span className="text-emerald-700 font-bold">Personal Baseline Range ({person.physiological.baselineHrvMs} ms)</span>
              <span>90 ms (Robust)</span>
            </div>
          </div>

          {/* Metric 3: Sleep Duration & Debt */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex flex-wrap items-center justify-between text-xs gap-2 mb-2">
              <div>
                <span className="font-bold text-slate-800">Sleep Duration &amp; Recovery</span>
                <span className="text-slate-500 ml-2 font-mono">
                  Base: <strong>{person.physiological.baselineSleepDurationHrs}h</strong> &bull; Current: <strong>{person.physiological.sleepDurationHrs}h</strong> &bull; Debt: <strong>{person.physiological.sleepDebtHrs}h</strong>
                </span>
              </div>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                  person.physiological.sleepDebtHrs > 2
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {person.physiological.sleepDebtHrs > 2 ? 'SLEEP DEBT DETECTED' : 'REST ADEQUATE'}
              </span>
            </div>

            <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
              <div className="absolute left-[40%] right-[20%] top-0 bottom-0 bg-emerald-200/70" title="Restorative Sleep Range (6-8h)"></div>
              <div
                className="absolute top-0 bottom-0 w-2.5 rounded-full bg-teal-600"
                style={{
                  left: `${Math.min(92, Math.max(8, (person.physiological.sleepDurationHrs / 10) * 100))}%`,
                }}
                title={`Current: ${person.physiological.sleepDurationHrs}h`}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>3h (Severe Deficit)</span>
              <span className="text-emerald-700 font-bold">Recommended Rest Window (7-8h)</span>
              <span>10h (Sufficient)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7-DAY RISK TRAJECTORY (Section 11) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                7-DAY MULTI-PILLAR RISK TRAJECTORY
              </h2>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  isPersistent
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {isPersistent ? 'PERSISTENT ELEVATION' : 'ACUTE SPIKE / MONITOR'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Trajectory distinguishes sustained cumulative burden ({person.unified.persistenceDays} days) from transient 1-day physiological spikes.
            </p>
          </div>

          {/* Line Toggles */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setShowUnifiedLine(!showUnifiedLine)}
              className={`px-2 py-1 rounded border text-[11px] font-semibold transition-colors cursor-pointer ${
                showUnifiedLine ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-500 border-slate-300'
              }`}
            >
              Unified Risk
            </button>
            <button
              onClick={() => setShowPhysLine(!showPhysLine)}
              className={`px-2 py-1 rounded border text-[11px] font-semibold transition-colors cursor-pointer ${
                showPhysLine ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-100 text-slate-500 border-slate-300'
              }`}
            >
              Physiological
            </button>
            <button
              onClick={() => setShowOpsLine(!showOpsLine)}
              className={`px-2 py-1 rounded border text-[11px] font-semibold transition-colors cursor-pointer ${
                showOpsLine ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-100 text-slate-500 border-slate-300'
              }`}
            >
              Operational
            </button>
            <button
              onClick={() => setShowWelfareLine(!showWelfareLine)}
              className={`px-2 py-1 rounded border text-[11px] font-semibold transition-colors cursor-pointer ${
                showWelfareLine ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-500 border-slate-300'
              }`}
            >
              Welfare
            </button>
          </div>
        </div>

        {/* SVG Multi-line Graph */}
        <div className="h-52 w-full bg-slate-50 rounded-lg p-3 border border-slate-100 relative">
          <svg viewBox="0 0 420 150" className="w-full h-full">
            {/* Escalation threshold line (75) */}
            <line x1="30" y1="35" x2="410" y2="35" stroke="#f87171" strokeDasharray="3,3" strokeWidth="1" />
            <text x="32" y="30" fontSize="8" fill="#dc2626" fontFamily="monospace">Human Review Threshold (75)</text>

            {/* Elevated threshold line (50) */}
            <line x1="30" y1="75" x2="410" y2="75" stroke="#fbbf24" strokeDasharray="3,3" strokeWidth="1" />
            <text x="32" y="70" fontSize="8" fill="#d97706" fontFamily="monospace">Elevated Threshold (50)</text>

            {/* Multi-line series rendering */}
            {(() => {
              const history = person.unified.trajectoryHistory;
              const stepX = 54;
              const startX = 50;

              const getPoints = (getValue: (item: any) => number) => {
                return history
                  .map((item, idx) => {
                    const x = startX + idx * stepX;
                    const val = getValue(item);
                    const y = 135 - (val / 100) * 115;
                    return `${x},${y}`;
                  })
                  .join(' ');
              };

              return (
                <>
                  {/* Unified Line */}
                  {showUnifiedLine && (
                    <polyline
                      fill="none"
                      stroke={person.unified.state === 'Human Review' ? '#ef4444' : '#0f172a'}
                      strokeWidth="3"
                      points={getPoints((item) => item.overall)}
                    />
                  )}

                  {/* Physiological Line */}
                  {showPhysLine && (
                    <polyline
                      fill="none"
                      stroke="#0d9488"
                      strokeWidth="2"
                      strokeDasharray="4,2"
                      points={getPoints((item) => item.physiological)}
                    />
                  )}

                  {/* Operational Line */}
                  {showOpsLine && (
                    <polyline
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="2"
                      strokeDasharray="4,2"
                      points={getPoints((item) => item.operational)}
                    />
                  )}

                  {/* Welfare Line */}
                  {showWelfareLine && (
                    <polyline
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2"
                      strokeDasharray="2,2"
                      points={getPoints((item) => item.welfare)}
                    />
                  )}

                  {/* Node Circles & Day Labels */}
                  {history.map((item, idx) => {
                    const x = startX + idx * stepX;
                    const yUnified = 135 - (item.overall / 100) * 115;

                    return (
                      <g key={idx}>
                        {showUnifiedLine && (
                          <>
                            <circle
                              cx={x}
                              cy={yUnified}
                              r="4"
                              fill={person.unified.state === 'Human Review' ? '#ef4444' : '#0f172a'}
                              stroke="#fff"
                              strokeWidth="1.5"
                            />
                            <text
                              x={x}
                              y={yUnified - 7}
                              fontSize="8.5"
                              textAnchor="middle"
                              fill="#0f172a"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {item.overall}
                            </text>
                          </>
                        )}
                        <text
                          x={x}
                          y="146"
                          fontSize="8.5"
                          textAnchor="middle"
                          fill="#64748b"
                          fontFamily="monospace"
                        >
                          {item.dayLabel}
                        </text>
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* CONFIDENTIAL WELFARE GRIEVANCE INTELLIGENCE (Air-gapped) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-600" />
              CONFIDENTIAL WELFARE GRIEVANCES (DATA MINIMIZATION)
            </h3>
            <p className="text-xs text-slate-500">
              Raw text is masked by default. Revealing source narratives requires authorized Welfare Officer RBAC and generates an audited ledger entry.
            </p>
          </div>
          <span className="text-xs font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
            Air-Gapped NLP Pipeline
          </span>
        </div>

        <div className="space-y-3">
          {grievances.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-mono">
              No active welfare grievances recorded for {person.id}.
            </div>
          ) : (
            grievances.map((g) => {
              const isRevealed = revealedGrievanceId === g.id;
              const canReveal = currentRole === 'Welfare Officer';

              return (
                <div key={g.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/80">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{g.category}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold font-mono">
                        Urgency: {g.urgency}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{g.timestamp}</span>
                    </div>

                    {canReveal && (
                      <button
                        onClick={() => handleToggleRevealGrievance(g.id)}
                        className="text-xs font-medium text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{isRevealed ? 'Mask Narrative' : 'Audited Reveal'}</span>
                      </button>
                    )}
                  </div>

                  <div className="mt-2 text-xs">
                    {isRevealed && g.fullSourceText ? (
                      <div className="bg-white p-2.5 rounded border border-teal-300 text-slate-900 font-sans shadow-2xs">
                        <span className="text-[10px] font-mono text-teal-700 block font-bold mb-0.5">
                          REVEALED UNDER WELFARE OFFICER AUTHORITY (LOGGED IN AUDIT TRAIL):
                        </span>
                        {g.fullSourceText}
                      </div>
                    ) : (
                      <div className="font-mono text-slate-600 text-[11px] bg-white/60 p-2 rounded border border-slate-200">
                        {g.sourceTextMasked}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* HUMAN INTERVENTION FORM (Section 17) */}
      <div id="record-intervention" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              RECORD SUPPORTIVE HUMAN INTERVENTION
            </h3>
            <p className="text-xs text-slate-500">
              Select supportive action, log confidential notes, and assign a mandatory follow-up date.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Human-in-the-Loop
          </span>
        </div>

        {interventionSuccessMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{interventionSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleInterventionSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-slate-600 uppercase font-mono tracking-wider block mb-1">
                Intervention Action Type
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
              >
                <option value="Welfare conversation">Welfare conversation</option>
                <option value="Duty adjustment">Duty adjustment / Roster relief</option>
                <option value="Rest / recovery adjustment">Rest / recovery adjustment (48h)</option>
                <option value="Leave review">Leave review / Sanction recommendation</option>
                <option value="Medical referral">Medical referral (Clinical officer)</option>
                <option value="Follow-up required">Follow-up monitoring</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-600 uppercase font-mono tracking-wider block mb-1">
                Mandatory Follow-Up Review Date
              </label>
              <input
                type="text"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                placeholder="e.g. 18 Sep 2026"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-600 uppercase font-mono tracking-wider block mb-1">
              Confidential Officer Notes
            </label>
            <textarea
              rows={2}
              value={interventionNotes}
              onChange={(e) => setInterventionNotes(e.target.value)}
              placeholder="Record non-punitive supportive steps taken (e.g., rotated from border night duty, recommended compassionate leave, arranged family contact)..."
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingIntervention || !interventionNotes.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSavingIntervention ? 'Recording...' : 'Commit Intervention to Audit Trail'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
