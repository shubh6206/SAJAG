/**
 * SAJAG - Unified Risk & Temporal Intelligence Engine (SIH26186)
 * Ministry of Home Affairs - CAPF Personnel Stress & Welfare Monitoring System
 * 
 * Synthesizes Physiological Stress, Operational Load, and Welfare Signals.
 * Computes temporal persistence, trajectory categorization, confidence scores,
 * and transparent waterfall attribution with non-punitive supportive recommendations.
 */

import { RiskLevel, TrajectoryState, UnifiedAssessment } from '../types';

export interface UnifiedEngineInput {
  physiologicalScore: number; // 0-100
  physiologicalConfidence: 'HIGH' | 'MODERATE' | 'LOW';
  operationalScore: number; // 0-100
  welfareScore: number; // 0-100
  history7d?: {
    overall: number;
    physiological: number;
    operational: number;
    welfare: number;
  }[];
  baselineCalibrated: boolean;
  unresolvedGrievancesCount: number;
  consecutiveDutyDays: number;
  hrvDeviationPct?: number;
}

export interface UnifiedEngineOutput {
  score: number; // 0-100
  state: RiskLevel;
  confidence: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT_DATA';
  persistenceDays: number;
  trajectoryState: TrajectoryState;
  waterfallContributions: {
    physiological: number;
    operational: number;
    welfare: number;
    base: number;
  };
  whyFlagged: string[];
  recommendedAction: string;
  isPriorityCase: boolean;
}

/**
 * Synthesizes the Tri-Pillar Assessment into an explainable unified decision score
 */
export function synthesizeUnifiedRisk(input: UnifiedEngineInput): UnifiedEngineOutput {
  const {
    physiologicalScore,
    physiologicalConfidence,
    operationalScore,
    welfareScore,
    history7d = [],
    baselineCalibrated,
    unresolvedGrievancesCount,
    consecutiveDutyDays,
    hrvDeviationPct = 0,
  } = input;

  // 1. Core Weights: Physiological (35%), Operational (35%), Welfare (30%)
  // Adjusted by dynamic convergence: if Operational + Welfare are both High (>65),
  // they compound even if Physiological is normal (the classic Scenario B "Killer Demo" pattern)
  const isMultiPillarConvergence = operationalScore >= 65 && welfareScore >= 65;

  let weightedPhys = physiologicalScore * 0.35;
  let weightedOps = operationalScore * 0.35;
  let weightedWelfare = welfareScore * 0.30;

  let compoundBonus = 0;
  if (isMultiPillarConvergence) {
    compoundBonus = 8; // Convergence penalty for operational burn combined with unresolved welfare
  }

  const rawScore = Math.min(100, Math.round(weightedPhys + weightedOps + weightedWelfare + compoundBonus));

  // 2. Trajectory & Persistence Evaluation
  let persistenceDays = 1;
  let trajectoryState: TrajectoryState = 'Acute spike';

  if (!baselineCalibrated && history7d.length < 3) {
    trajectoryState = 'Data sparse';
  } else if (history7d.length >= 3) {
    const recentScores = history7d.map((h) => h.overall);
    const last3 = recentScores.slice(-3);
    const isImproving = last3[2] < last3[1] && last3[1] < last3[0] && (last3[0] - last3[2] >= 6);
    const isPersistent = last3.every((s) => s >= 55);

    if (isImproving) {
      trajectoryState = 'Improving';
    } else if (isPersistent) {
      trajectoryState = 'Persistent elevation';
      // Calculate consecutive days above 55 threshold
      let count = 0;
      for (let i = recentScores.length - 1; i >= 0; i--) {
        if (recentScores[i] >= 55) count++;
        else break;
      }
      persistenceDays = Math.max(3, count);
    } else if (recentScores.length >= 2 && recentScores[recentScores.length - 1] - recentScores[recentScores.length - 2] >= 12) {
      trajectoryState = 'Acute spike';
      persistenceDays = 1;
    } else {
      trajectoryState = 'Persistent elevation';
      persistenceDays = 2;
    }
  }

  // 3. Risk State Assignment
  let state: RiskLevel = 'Stable';
  // Human Review trigger: Persistent elevated multi-pillar risk OR critical welfare + high operational load
  if (rawScore >= 78 || (rawScore >= 70 && persistenceDays >= 3) || (isMultiPillarConvergence && persistenceDays >= 2)) {
    state = 'Human Review';
  } else if (rawScore >= 70) {
    state = 'High';
  } else if (rawScore >= 52) {
    state = 'Elevated';
  } else if (rawScore >= 38) {
    state = 'Watch';
  } else {
    state = 'Stable';
  }

  // 4. Waterfall Decomposition
  // Explains exact point contribution to the final score
  const totalWeight = weightedPhys + weightedOps + weightedWelfare + compoundBonus;
  const scaleRatio = totalWeight > 0 ? rawScore / totalWeight : 1;

  const physPoints = Math.round(weightedPhys * scaleRatio);
  const opsPoints = Math.round((weightedOps + (compoundBonus / 2)) * scaleRatio);
  const welfarePoints = Math.max(0, rawScore - physPoints - opsPoints);

  // 5. Why Flagged Statements
  const whyFlagged: string[] = [];

  if (isMultiPillarConvergence) {
    whyFlagged.push(
      'Multi-pillar convergence: High operational fatigue compounded by acute unresolved welfare grievance, despite normal/near-normal baseline biometrics.'
    );
  }

  if (operationalScore >= 65) {
    whyFlagged.push(
      `Operational fatigue high (${operationalScore}/100): ${consecutiveDutyDays} consecutive duty days without scheduled 24h rest interval.`
    );
  }

  if (welfareScore >= 65) {
    whyFlagged.push(
      `Welfare signal elevated (${welfareScore}/100): ${unresolvedGrievancesCount} urgent grievance(s) pending officer review.`
    );
  }

  if (physiologicalScore >= 65) {
    whyFlagged.push(
      `Physiological strain elevated (${physiologicalScore}/100): Significant baseline deviation detected in autonomic resting HR/HRV.`
    );
  } else if (physiologicalScore <= 40 && operationalScore >= 65) {
    whyFlagged.push(
      'Compensated biometrics: Normal cardiovascular readings observed, which would cause single-pillar systems to miss critical operational burnout.'
    );
  }

  if (persistenceDays >= 3) {
    whyFlagged.push(`Temporal persistence: Risk state sustained over ${persistenceDays} consecutive days without adequate recovery.`);
  }

  if (whyFlagged.length === 0) {
    whyFlagged.push('Indicators operating within standard baseline tolerances across all three pillars.');
  }

  // 6. Supportive Non-Punitive Recommendations
  let recommendedAction = 'Continue routine monitoring. No immediate command intervention required.';
  if (state === 'Human Review') {
    if (isMultiPillarConvergence || welfareScore >= 65) {
      recommendedAction =
        'Schedule supportive Welfare Officer check-in within 24h. Recommend granting sanctioned leave window or immediate 48-hour operational rest rotation.';
    } else if (physiologicalScore >= 70) {
      recommendedAction =
        'Recommend Medical Officer review of recovery metrics, hydration, and light-duty rotation to facilitate autonomic rest.';
    } else {
      recommendedAction =
        'Prioritize supportive command outreach and duty cycle rescheduling to alleviate consecutive roster strain.';
    }
  } else if (state === 'High') {
    recommendedAction =
      'Flag for Welfare Officer follow-up. Review upcoming night patrol shifts and verify pending leave requests.';
  } else if (state === 'Elevated') {
    recommendedAction =
      'Monitor 48-hour trajectory. Ensure minimum 8-hour rest gap between rotational shift assignments.';
  }

  // Confidence assessment
  let confidence: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT_DATA' = 'HIGH';
  if (!baselineCalibrated) {
    confidence = 'LOW';
  } else if (physiologicalConfidence === 'LOW') {
    confidence = 'MODERATE';
  }

  return {
    score: rawScore,
    state,
    confidence,
    persistenceDays,
    trajectoryState,
    waterfallContributions: {
      physiological: physPoints,
      operational: opsPoints,
      welfare: welfarePoints,
      base: 0,
    },
    whyFlagged,
    recommendedAction,
    isPriorityCase: state === 'Human Review' || state === 'High',
  };
}
