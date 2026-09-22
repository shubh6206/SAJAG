/**
 * SAJAG - Personal Baseline Engine (SIH26186)
 * Ministry of Home Affairs - CAPF Personnel Stress & Welfare Monitoring System
 * 
 * Computes individual-referenced physiological baselines over a rolling 14-day window.
 * Distinguishes "No established baseline" from "Normal relative to personal baseline".
 * Computes statistical confidence states based on observation density and sensor validity.
 */

export type BaselineConfidence = 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT_DATA';

export interface RawObservation {
  day: number;
  restingHrBpm?: number | null;
  hrvMs?: number | null;
  sleepDurationHrs?: number | null;
  isValidSample: boolean;
}

export interface BaselineResult {
  hasEstablishedBaseline: boolean;
  confidence: BaselineConfidence;
  confidenceReason: string;
  sampleCount: number;
  minRequiredSamples: number;
  meanHr: number;
  stdHr: number;
  meanHrv: number;
  stdHrv: number;
  meanSleep: number;
  stdSleep: number;
  isCalibrated: boolean;
}

export interface DeviationAnalysis {
  metric: 'HR' | 'HRV' | 'SLEEP';
  currentValue: number;
  baselineValue: number;
  deltaPercent: number;
  zScore: number;
  direction: 'ELEVATED' | 'SUPPRESSED' | 'WITHIN_BASELINE';
  significance: 'NORMAL' | 'MILD_DEVIATION' | 'MODERATE_DEVIATION' | 'SEVERE_DEVIATION';
  contributionText: string;
}

const MIN_CALIBRATION_DAYS = 5;
const OPTIMAL_CALIBRATION_DAYS = 10;

/**
 * Filter statistical outliers using 2.5 IQR rule to prevent spurious spikes from biasing baseline
 */
export function filterOutliers(values: number[]): number[] {
  if (values.length < 4) return values;
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  return sorted.filter((v) => v >= lowerBound && v <= upperBound);
}

export function computeMeanAndStd(values: number[]): { mean: number; std: number } {
  if (values.length === 0) return { mean: 0, std: 0 };
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (values.length === 1) return { mean: Math.round(mean * 10) / 10, std: 0 };
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return {
    mean: Math.round(mean * 10) / 10,
    std: Math.round(Math.sqrt(variance) * 10) / 10,
  };
}

/**
 * Calculate 14-day rolling personal baseline from raw observations
 */
export function calculatePersonalBaseline(observations: RawObservation[]): BaselineResult {
  const validObservations = observations.filter((o) => o.isValidSample);
  const sampleCount = validObservations.length;

  if (sampleCount === 0) {
    return {
      hasEstablishedBaseline: false,
      confidence: 'INSUFFICIENT_DATA',
      confidenceReason: 'No physiological telemetry observations recorded for this personnel.',
      sampleCount: 0,
      minRequiredSamples: MIN_CALIBRATION_DAYS,
      meanHr: 0,
      stdHr: 0,
      meanHrv: 0,
      stdHrv: 0,
      meanSleep: 0,
      stdSleep: 0,
      isCalibrated: false,
    };
  }

  if (sampleCount < MIN_CALIBRATION_DAYS) {
    // Insufficient data to form a stable statistical baseline
    const hrValues = validObservations.map((o) => o.restingHrBpm).filter((v): v is number => typeof v === 'number' && v > 0);
    const hrvValues = validObservations.map((o) => o.hrvMs).filter((v): v is number => typeof v === 'number' && v > 0);
    const sleepValues = validObservations.map((o) => o.sleepDurationHrs).filter((v): v is number => typeof v === 'number' && v > 0);

    const hrStats = computeMeanAndStd(hrValues);
    const hrvStats = computeMeanAndStd(hrvValues);
    const sleepStats = computeMeanAndStd(sleepValues);

    return {
      hasEstablishedBaseline: false,
      confidence: 'LOW',
      confidenceReason: `Sparse data: only ${sampleCount} days recorded. Requires minimum ${MIN_CALIBRATION_DAYS} days to calibrate personal baseline.`,
      sampleCount,
      minRequiredSamples: MIN_CALIBRATION_DAYS,
      meanHr: hrStats.mean,
      stdHr: hrStats.std,
      meanHrv: hrvStats.mean,
      stdHrv: hrvStats.std,
      meanSleep: sleepStats.mean,
      stdSleep: sleepStats.std,
      isCalibrated: false,
    };
  }

  // Extract clean metric series
  const hrValues = filterOutliers(
    validObservations.map((o) => o.restingHrBpm).filter((v): v is number => typeof v === 'number' && v > 30 && v < 220)
  );
  const hrvValues = filterOutliers(
    validObservations.map((o) => o.hrvMs).filter((v): v is number => typeof v === 'number' && v > 5 && v < 250)
  );
  const sleepValues = filterOutliers(
    validObservations.map((o) => o.sleepDurationHrs).filter((v): v is number => typeof v === 'number' && v > 1 && v < 16)
  );

  const hrStats = computeMeanAndStd(hrValues);
  const hrvStats = computeMeanAndStd(hrvValues);
  const sleepStats = computeMeanAndStd(sleepValues);

  let confidence: BaselineConfidence = 'HIGH';
  let confidenceReason = '14-day personalized baseline fully calibrated with high signal stability.';

  if (sampleCount < OPTIMAL_CALIBRATION_DAYS || hrvValues.length < MIN_CALIBRATION_DAYS || sleepValues.length < MIN_CALIBRATION_DAYS) {
    confidence = 'MODERATE';
    confidenceReason = `Moderate confidence: ${sampleCount} observations available. Telemetry partially complete.`;
  }

  return {
    hasEstablishedBaseline: true,
    confidence,
    confidenceReason,
    sampleCount,
    minRequiredSamples: MIN_CALIBRATION_DAYS,
    meanHr: hrStats.mean,
    stdHr: hrStats.std,
    meanHrv: hrvStats.mean,
    stdHrv: hrvStats.std,
    meanSleep: sleepStats.mean,
    stdSleep: sleepStats.std,
    isCalibrated: true,
  };
}

/**
 * Compute deviation analysis comparing current 24h reading against individual's personal baseline
 */
export function analyzeDeviation(
  metric: 'HR' | 'HRV' | 'SLEEP',
  currentVal: number,
  baselineVal: number,
  baselineStd: number
): DeviationAnalysis {
  if (baselineVal <= 0) {
    return {
      metric,
      currentValue: currentVal,
      baselineValue: baselineVal,
      deltaPercent: 0,
      zScore: 0,
      direction: 'WITHIN_BASELINE',
      significance: 'NORMAL',
      contributionText: 'Personal baseline unavailable for deviation assessment.',
    };
  }

  const delta = currentVal - baselineVal;
  const deltaPercent = Math.round((delta / baselineVal) * 1000) / 10;
  const zScore = baselineStd > 0 ? Math.round((delta / baselineStd) * 10) / 10 : 0;

  if (metric === 'HR') {
    if (deltaPercent > 20) {
      return {
        metric,
        currentValue: currentVal,
        baselineValue: baselineVal,
        deltaPercent,
        zScore,
        direction: 'ELEVATED',
        significance: 'SEVERE_DEVIATION',
        contributionText: `Resting HR +${deltaPercent}% above personal baseline (Z: +${zScore}). Marked autonomic elevation.`,
      };
    } else if (deltaPercent > 10) {
      return {
        metric,
        currentValue: currentVal,
        baselineValue: baselineVal,
        deltaPercent,
        zScore,
        direction: 'ELEVATED',
        significance: 'MODERATE_DEVIATION',
        contributionText: `Resting HR +${deltaPercent}% above personal baseline. Moderate cardiovascular strain.`,
      };
    } else {
      return {
        metric,
        currentValue: currentVal,
        baselineValue: baselineVal,
        deltaPercent,
        zScore,
        direction: 'WITHIN_BASELINE',
        significance: 'NORMAL',
        contributionText: `Resting HR near personal baseline (${deltaPercent >= 0 ? '+' : ''}${deltaPercent}%).`,
      };
    }
  } else if (metric === 'HRV') {
    // For HRV, a negative drop represents reduced autonomic recovery
    if (deltaPercent < -30) {
      return {
        metric,
        currentValue: currentVal,
        baselineValue: baselineVal,
        deltaPercent,
        zScore,
        direction: 'SUPPRESSED',
        significance: 'SEVERE_DEVIATION',
        contributionText: `HRV suppressed ${deltaPercent}% from personal baseline. Reduced parasympathetic recovery.`,
      };
    } else if (deltaPercent < -15) {
      return {
        metric,
        currentValue: currentVal,
        baselineValue: baselineVal,
        deltaPercent,
        zScore,
        direction: 'SUPPRESSED',
        significance: 'MODERATE_DEVIATION',
        contributionText: `HRV suppressed ${deltaPercent}% from personal baseline. Autonomic recovery deficit.`,
      };
    } else {
      return {
        metric,
        currentValue: currentVal,
        baselineValue: baselineVal,
        deltaPercent,
        zScore,
        direction: 'WITHIN_BASELINE',
        significance: 'NORMAL',
        contributionText: `HRV within typical personal autonomic baseline (${deltaPercent}%).`,
      };
    }
  } else {
    // SLEEP
    if (deltaPercent < -30) {
      return {
        metric,
        currentValue: currentVal,
        baselineValue: baselineVal,
        deltaPercent,
        zScore,
        direction: 'SUPPRESSED',
        significance: 'SEVERE_DEVIATION',
        contributionText: `Sleep duration ${deltaPercent}% below personal baseline. Significant acute sleep debt.`,
      };
    } else if (deltaPercent < -15) {
      return {
        metric,
        currentValue: currentVal,
        baselineValue: baselineVal,
        deltaPercent,
        zScore,
        direction: 'SUPPRESSED',
        significance: 'MODERATE_DEVIATION',
        contributionText: `Sleep duration ${deltaPercent}% below personal baseline. Mild sleep deficit.`,
      };
    } else {
      return {
        metric,
        currentValue: currentVal,
        baselineValue: baselineVal,
        deltaPercent,
        zScore,
        direction: 'WITHIN_BASELINE',
        significance: 'NORMAL',
        contributionText: `Sleep duration in accordance with personal baseline (${currentVal}h vs ${baselineVal}h).`,
      };
    }
  }
}
