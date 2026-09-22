/**
 * SAJAG - Physiological Stress Engine (SIH26186)
 * Ministry of Home Affairs - CAPF Personnel Stress & Welfare Monitoring System
 * 
 * Non-diagnostic, individual baseline-referenced physiological strain calculator.
 * Evaluates Resting Heart Rate, HRV Autonomic Tone, Sleep Duration, and Sleep Debt.
 * Strictly adheres to non-clinical, decision-support terminology.
 */

import { RiskLevel } from '../types';
import { BaselineResult, analyzeDeviation } from './baselineEngine';

export interface PhysiologicalInput {
  restingHrBpm: number;
  hrvMs: number;
  sleepDurationHrs: number;
  baseline: BaselineResult;
  activityExertionLoad?: 'Low' | 'Moderate' | 'High' | 'Severe';
}

export interface PhysiologicalOutput {
  score: number; // 0-100
  state: RiskLevel;
  hrDeviationPct: number;
  hrvDeviationPct: number;
  sleepDeviationPct: number;
  sleepDebtHrs: number;
  recoveryIndex: number; // 0-100
  confidence: 'HIGH' | 'MODERATE' | 'LOW';
  contributors: string[];
  nonDiagnosticSummary: string;
}

/**
 * Computes physiological strain score strictly based on personal baseline deviations
 */
export function calculatePhysiologicalStrain(input: PhysiologicalInput): PhysiologicalOutput {
  const { restingHrBpm, hrvMs, sleepDurationHrs, baseline, activityExertionLoad = 'Moderate' } = input;

  const contributors: string[] = [];

  // Check if baseline is calibrated
  if (!baseline.hasEstablishedBaseline || baseline.sampleCount < baseline.minRequiredSamples) {
    return {
      score: 45,
      state: 'Watch',
      hrDeviationPct: 0,
      hrvDeviationPct: 0,
      sleepDeviationPct: 0,
      sleepDebtHrs: 0,
      recoveryIndex: 50,
      confidence: 'LOW',
      contributors: [
        'Personal baseline calibration pending (< 5 days telemetry recorded)',
        'Physiological strain index interpreted with reduced confidence',
      ],
      nonDiagnosticSummary: 'Insufficient personal baseline history. Metric is uncalibrated and non-diagnostic.',
    };
  }

  // Calculate deviations
  const hrAnalysis = analyzeDeviation('HR', restingHrBpm, baseline.meanHr, baseline.stdHr);
  const hrvAnalysis = analyzeDeviation('HRV', hrvMs, baseline.meanHrv, baseline.stdHrv);
  const sleepAnalysis = analyzeDeviation('SLEEP', sleepDurationHrs, baseline.meanSleep, baseline.stdSleep);

  const sleepDebt = Math.max(0, Math.round((baseline.meanSleep - sleepDurationHrs) * 10) / 10);

  // Compute component sub-scores (0-100)
  // 1. HR Sub-score (baseline elevation weight = 35%)
  let hrSubScore = 20; // baseline maintenance
  if (hrAnalysis.deltaPercent > 25) hrSubScore = 95;
  else if (hrAnalysis.deltaPercent > 18) hrSubScore = 80;
  else if (hrAnalysis.deltaPercent > 10) hrSubScore = 60;
  else if (hrAnalysis.deltaPercent > 4) hrSubScore = 40;
  else hrSubScore = 20;

  // 2. HRV Sub-score (autonomic suppression weight = 35%)
  let hrvSubScore = 20;
  if (hrvAnalysis.deltaPercent < -35) hrvSubScore = 95;
  else if (hrvAnalysis.deltaPercent < -22) hrvSubScore = 80;
  else if (hrvAnalysis.deltaPercent < -12) hrvSubScore = 60;
  else if (hrvAnalysis.deltaPercent < -5) hrvSubScore = 38;
  else hrvSubScore = 20;

  // 3. Sleep & Recovery Sub-score (weight = 30%)
  let sleepSubScore = 20;
  if (sleepDebt >= 3.0 || sleepAnalysis.deltaPercent < -35) sleepSubScore = 90;
  else if (sleepDebt >= 2.0 || sleepAnalysis.deltaPercent < -20) sleepSubScore = 75;
  else if (sleepDebt >= 1.0 || sleepAnalysis.deltaPercent < -10) sleepSubScore = 50;
  else sleepSubScore = 20;

  // Activity Exertion adjustment (±5 pts)
  let activityModifier = 0;
  if (activityExertionLoad === 'Severe') activityModifier = 6;
  else if (activityExertionLoad === 'High') activityModifier = 3;

  // Composite physiological strain score
  const compositeScore = Math.min(
    100,
    Math.max(10, Math.round(hrSubScore * 0.35 + hrvSubScore * 0.35 + sleepSubScore * 0.3 + activityModifier))
  );

  // Recovery Index calculation (inversely correlated with composite strain)
  const recoveryIndex = Math.min(100, Math.max(15, Math.round(105 - compositeScore * 0.85)));

  // Risk state mapping
  let state: RiskLevel = 'Stable';
  if (compositeScore >= 75) state = 'High';
  else if (compositeScore >= 55) state = 'Elevated';
  else if (compositeScore >= 40) state = 'Watch';
  else state = 'Stable';

  // Attribution building
  if (hrAnalysis.significance === 'SEVERE_DEVIATION' || hrAnalysis.significance === 'MODERATE_DEVIATION') {
    contributors.push(hrAnalysis.contributionText);
  } else {
    contributors.push(`Resting HR maintained within baseline range (${hrAnalysis.deltaPercent >= 0 ? '+' : ''}${hrAnalysis.deltaPercent}%)`);
  }

  if (hrvAnalysis.significance === 'SEVERE_DEVIATION' || hrvAnalysis.significance === 'MODERATE_DEVIATION') {
    contributors.push(hrvAnalysis.contributionText);
  } else {
    contributors.push(`HRV autonomic recovery within normal baseline envelope (${hrvAnalysis.deltaPercent}%)`);
  }

  if (sleepDebt > 1.0) {
    contributors.push(`Sleep debt of ${sleepDebt}h accumulated relative to personal ${baseline.meanSleep}h baseline`);
  }

  if (recoveryIndex < 40) {
    contributors.push(`Reduced autonomic recovery indicator (${recoveryIndex}/100)`);
  }

  const confidence = baseline.confidence === 'HIGH' ? 'HIGH' : baseline.confidence === 'MODERATE' ? 'MODERATE' : 'LOW';

  return {
    score: compositeScore,
    state,
    hrDeviationPct: hrAnalysis.deltaPercent,
    hrvDeviationPct: hrvAnalysis.deltaPercent,
    sleepDeviationPct: sleepAnalysis.deltaPercent,
    sleepDebtHrs: sleepDebt,
    recoveryIndex,
    confidence,
    contributors,
    nonDiagnosticSummary:
      compositeScore >= 75
        ? 'Elevated physiological strain and reduced autonomic recovery. Human review recommended.'
        : compositeScore >= 55
        ? 'Moderate physiological strain observed relative to personal baseline.'
        : 'Physiological indicators stable relative to personal baseline.',
  };
}
