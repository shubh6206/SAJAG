import React, { useState } from 'react';
import {
  MessageSquareHeart,
  Lock,
  Sparkles,
  ShieldCheck,
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { WelfareGrievance, VoluntaryCheckIn, UserRole } from '../types';

interface WelfareSignalsViewProps {
  grievances: WelfareGrievance[];
  checkins: VoluntaryCheckIn[];
  currentRole: UserRole;
  onSubmitGrievance: (personnelId: string, category: string, text: string, urgency: string) => Promise<void>;
  onSubmitCheckin: (personnelId: string, mood: VoluntaryCheckIn['mood'], note: string) => Promise<void>;
  onSelectPersonnel: (id: string) => void;
}

export const WelfareSignalsView: React.FC<WelfareSignalsViewProps> = ({
  grievances,
  checkins,
  currentRole,
  onSubmitGrievance,
  onSubmitCheckin,
  onSelectPersonnel,
}) => {
  const [revealedSourceId, setRevealedSourceId] = useState<string | null>(null);

  // New Grievance Intake Form State
  const [testPersonnelId, setTestPersonnelId] = useState('PX-1042');
  const [newCategory, setNewCategory] = useState('Leave');
  const [newUrgency, setNewUrgency] = useState('HIGH');
  const [newText, setNewText] = useState('');
  const [isSubmittingGrievance, setIsSubmittingGrievance] = useState(false);
  const [grievanceSuccess, setGrievanceSuccess] = useState<string | null>(null);

  const handleGrievanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setIsSubmittingGrievance(true);
    try {
      await onSubmitGrievance(testPersonnelId, newCategory, newText, newUrgency);
      setGrievanceSuccess(`Welfare signal processed locally by Air-Gapped NLP model. Added to review queue.`);
      setNewText('');
      setTimeout(() => setGrievanceSuccess(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingGrievance(false);
    }
  };

  return (
    <div id="welfare-signals" className="space-y-6 pb-12">
      {/* Header & Local NLP Architecture Callout */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 font-mono">
              WELFARE SIGNALS &amp; CONFIDENTIAL NLP
            </h2>
            <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded font-mono flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Air-Gapped Local Model
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Voluntary wellness check-ins, grievance classification, and early warning welfare telemetry.
          </p>
        </div>

        <div className="text-xs font-mono text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>No personal journal or grievance text sent to public cloud</span>
        </div>
      </div>

      {/* CONFIDENTIAL WELFARE NLP ARCHITECTURE BOX */}
      <div className="bg-slate-900 text-slate-200 rounded-xl p-5 border border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-teal-400 font-mono flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            CONFIDENTIAL WELFARE NLP PIPELINE ARCHITECTURE (AIR-GAPPED)
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            Model: SAJAG Local DistilBERT v2 &bull; Latency: ~14ms
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs font-mono py-2">
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Step 1</span>
            <strong className="text-white">Personnel Entry</strong>
            <span className="text-[10px] text-slate-400 block mt-0.5">Confidential kiosk/app</span>
          </div>
          <div className="flex items-center justify-center text-teal-400 text-lg">&rarr;</div>
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-teal-700/80 bg-teal-950/20">
            <span className="text-teal-300 block text-[10px]">Step 2</span>
            <strong className="text-teal-300">Local NLP</strong>
            <span className="text-[10px] text-teal-200 block mt-0.5">Zero external API call</span>
          </div>
          <div className="flex items-center justify-center text-teal-400 text-lg">&rarr;</div>
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Step 3</span>
            <strong className="text-white">Category + Urgency</strong>
            <span className="text-[10px] text-slate-400 block mt-0.5">Tri-Pillar Risk Engine</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>&bull; Full Data Minimization: Raw grievance narrative masked from generic views</span>
          <span className="text-emerald-400 font-medium">&bull; Role-authorized officer verification required</span>
        </div>
      </div>

      {/* ACTIVE WELFARE GRIEVANCE INTELLIGENCE TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
              WELFARE SIGNAL CLASSIFICATION &amp; QUEUE
            </h3>
            <p className="text-xs text-slate-500">
              Active intake records processed through local classification engine.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
            {grievances.length} Signals Logged
          </span>
        </div>

        <div className="space-y-3">
          {grievances.map((g) => {
            const isRevealed = revealedSourceId === g.id;
            return (
              <div key={g.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectPersonnel(g.personnelId)}
                      className="font-mono font-bold text-slate-900 text-xs hover:text-teal-700 underline"
                    >
                      {g.personnelId}
                    </button>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-200 text-slate-800">
                      {g.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        g.urgency === 'HIGH' || g.urgency === 'CRITICAL'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      Urgency: {g.urgency}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">{g.timestamp}</span>
                </div>

                <div className="mt-2 text-xs">
                  {isRevealed && g.fullSourceText ? (
                    <div className="bg-white p-3 rounded-lg border border-slate-300 text-slate-900 font-sans">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                        Full Text (Authorized Role Access):
                      </span>
                      {g.fullSourceText}
                    </div>
                  ) : (
                    <div className="bg-slate-100 p-2.5 rounded border border-slate-200 text-slate-600 font-mono text-[11px]">
                      {g.sourceTextMasked}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="text-slate-600 flex items-center gap-2">
                    <span>NLP Classification: <strong className="text-slate-800">{g.localNLPClassification.primaryCategory}</strong></span>
                    <span>&bull;</span>
                    <span>Confidence: <strong className="text-teal-700 font-mono">{Math.round(g.localNLPClassification.confidenceScore * 100)}%</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRevealedSourceId(isRevealed ? null : g.id)}
                      className="text-teal-700 hover:text-teal-800 font-medium flex items-center gap-1"
                    >
                      {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{isRevealed ? 'Mask Source' : 'View Source Text'}</span>
                    </button>
                    <button
                      onClick={() => onSelectPersonnel(g.personnelId)}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-teal-700 text-white font-semibold text-xs transition-colors"
                    >
                      Review Personnel
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VOLUNTARY WELLNESS CHECK-INS & LIVE INTAKE TEST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voluntary Check-Ins Stream */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono mb-3">
            7-DAY VOLUNTARY WELLNESS CHECK-INS
          </h3>
          <div className="space-y-2.5 text-xs">
            {checkins.map((chk) => (
              <div key={chk.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectPersonnel(chk.personnelId)}
                      className="font-mono font-bold text-slate-900 hover:underline"
                    >
                      {chk.personnelId}
                    </button>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        chk.mood === 'Need Support'
                          ? 'bg-red-100 text-red-700'
                          : chk.mood === 'Struggling'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {chk.mood}
                    </span>
                    {chk.isFlaggedChange && (
                      <span className="text-[10px] text-red-600 font-semibold flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" /> Shift Detected
                      </span>
                    )}
                  </div>
                  {chk.notePreview && (
                    <p className="text-slate-600 text-[11px] mt-1 line-clamp-1">{chk.notePreview}</p>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0">{chk.timestamp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Signal Intake Simulator (For Demonstration) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
              CONFIDENTIAL INTAKE SIMULATOR
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              Air-Gapped Test
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Test how a soldier's confidential grievance is analyzed locally without transmitting outside the battalion container.
          </p>

          {grievanceSuccess && (
            <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{grievanceSuccess}</span>
            </div>
          )}

          <form onSubmit={handleGrievanceSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1 font-mono">Personnel ID</label>
                <select
                  value={testPersonnelId}
                  onChange={(e) => setTestPersonnelId(e.target.value)}
                  className="w-full p-2 rounded border border-slate-300 font-mono text-xs"
                >
                  <option value="PX-1042">PX-1042 (Border)</option>
                  <option value="PX-1091">PX-1091 (Field)</option>
                  <option value="PX-1319">PX-1319 (Border)</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1 font-mono">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2 rounded border border-slate-300 text-xs"
                >
                  <option value="Leave">Leave</option>
                  <option value="Family Support">Family Support</option>
                  <option value="Workload">Workload</option>
                  <option value="Housing">Housing</option>
                  <option value="Facilities">Facilities</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 font-mono">
                Confidential Narrative Text
              </label>
              <textarea
                rows={3}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="e.g. Urgent request for leave due to mother hospitalization in home town..."
                className="w-full p-2.5 rounded border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingGrievance || !newText.trim()}
              className="w-full py-2 bg-slate-900 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingGrievance ? 'ANALYZING...' : 'RUN LOCAL NLP INTAKE'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
