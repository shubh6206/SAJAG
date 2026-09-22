/**
 * SAJAG - Operational Fatigue Engine (SIH26186)
 * Ministry of Home Affairs - CAPF Personnel Stress & Welfare Monitoring System
 * 
 * Quantifies duty roster fatigue, night patrol density, consecutive deployment days,
 * leave deficits, and environmental terrain multipliers with transparent driver attribution.
 */

import { RiskLevel, PostingType } from '../types';

export interface OperationalInput {
  consecutiveDutyDays: number;
  nightShiftsLast7d: number;
  averageShiftHours?: number;
  lastSanctionedLeaveDaysAgo: number;
  deploymentDays: number;
  posting: PostingType;
  shiftDensityPct?: number;
}

export interface OperationalOutput {
  score: number; // 0-100
  state: RiskLevel;
  loadCategory: 'Low' | 'Moderate' | 'High' | 'Severe';
  contributors: string[];
  driverAttributions: {
    driver: string;
    weight: number;
    description: string;
  }[];
}

/**
 * Computes operational load score and transparent driver breakdown
 */
export function calculateOperationalLoad(input: OperationalInput): OperationalOutput {
  const {
    consecutiveDutyDays,
    nightShiftsLast7d,
    averageShiftHours = 10,
    lastSanctionedLeaveDaysAgo,
    deploymentDays,
    posting,
    shiftDensityPct = 75,
  } = input;

  const drivers: { driver: string; weight: number; description: string }[] = [];
  const contributors: string[] = [];

  // Base score
  let totalScore = 15; // baseline standby

  // 1. Consecutive duty days without 24h rest
  let consecutiveWeight = 0;
  if (consecutiveDutyDays >= 16) {
    consecutiveWeight = 32;
    drivers.push({
      driver: 'Consecutive Duty Overload',
      weight: consecutiveWeight,
      description: `${consecutiveDutyDays} consecutive duty days without mandatory 24h rest cycle`,
    });
    contributors.push(`${consecutiveDutyDays} consecutive duty days without full 24h recovery interval`);
  } else if (consecutiveDutyDays >= 10) {
    consecutiveWeight = 22;
    drivers.push({
      driver: 'Prolonged Consecutive Duty',
      weight: consecutiveWeight,
      description: `${consecutiveDutyDays} consecutive days deployed on roster`,
    });
    contributors.push(`${consecutiveDutyDays} consecutive duty days`);
  } else if (consecutiveDutyDays >= 6) {
    consecutiveWeight = 12;
    drivers.push({
      driver: 'Standard Duty Run',
      weight: consecutiveWeight,
      description: `${consecutiveDutyDays} consecutive days on duty`,
    });
    contributors.push(`${consecutiveDutyDays} consecutive duty days`);
  } else {
    consecutiveWeight = 4;
    contributors.push(`${consecutiveDutyDays} duty days within standard rotation cycle`);
  }
  totalScore += consecutiveWeight;

  // 2. Night Patrol Density (last 7 days)
  let nightWeight = 0;
  if (nightShiftsLast7d >= 4) {
    nightWeight = 20;
    drivers.push({
      driver: 'High Night Shift Density',
      weight: nightWeight,
      description: `${nightShiftsLast7d} night patrols during the past 7 days (circadian disruption)`,
    });
    contributors.push(`${nightShiftsLast7d} night patrols during past 7 days`);
  } else if (nightShiftsLast7d >= 2) {
    nightWeight = 10;
    drivers.push({
      driver: 'Moderate Night Shifts',
      weight: nightWeight,
      description: `${nightShiftsLast7d} night shifts logged in 7 days`,
    });
    contributors.push(`${nightShiftsLast7d} night shifts in last 7 days`);
  } else {
    nightWeight = 2;
    contributors.push(`${nightShiftsLast7d} night shifts within standard allowance`);
  }
  totalScore += nightWeight;

  // 3. Shift Duration
  let shiftHourWeight = 0;
  if (averageShiftHours >= 12) {
    shiftHourWeight = 12;
    drivers.push({
      driver: 'Extended Shift Length',
      weight: shiftHourWeight,
      description: `${averageShiftHours}h+ average rotational shift duration`,
    });
    contributors.push(`${averageShiftHours}h+ average rotational shift structure`);
  } else if (averageShiftHours >= 9) {
    shiftHourWeight = 6;
  }
  totalScore += shiftHourWeight;

  // 4. Sanctioned Leave Deficit
  let leaveWeight = 0;
  if (lastSanctionedLeaveDaysAgo >= 40) {
    leaveWeight = 18;
    drivers.push({
      driver: 'Acute Leave Deficit',
      weight: leaveWeight,
      description: `Sanctioned leave overdue by ${lastSanctionedLeaveDaysAgo} days`,
    });
    contributors.push(`Sanctioned leave overdue by ${lastSanctionedLeaveDaysAgo} days`);
  } else if (lastSanctionedLeaveDaysAgo >= 25) {
    leaveWeight = 10;
    drivers.push({
      driver: 'Moderate Leave Deficit',
      weight: leaveWeight,
      description: `${lastSanctionedLeaveDaysAgo} days since last sanctioned leave`,
    });
    contributors.push(`${lastSanctionedLeaveDaysAgo} days elapsed since last leave period`);
  } else {
    leaveWeight = 2;
    contributors.push(`Recent leave availed ${lastSanctionedLeaveDaysAgo} days ago`);
  }
  totalScore += leaveWeight;

  // 5. Posting Environment Multiplier
  let environmentWeight = 0;
  if (posting === 'Border') {
    environmentWeight = 8;
    drivers.push({
      driver: 'Border Sector Burden',
      weight: environmentWeight,
      description: 'Border posting with high security readiness requirements',
    });
    contributors.push('Border outpost active deployment');
  } else if (posting === 'High Altitude') {
    environmentWeight = 10;
    drivers.push({
      driver: 'High Altitude Environmental Strain',
      weight: environmentWeight,
      description: 'Extreme cold and low-oxygen terrain conditions (>3,500m)',
    });
    contributors.push('High-altitude perimeter outpost exposure');
  } else if (posting === 'Field') {
    environmentWeight = 5;
    drivers.push({
      driver: 'Active Field Posting',
      weight: environmentWeight,
      description: 'Counter-insurgency / active field deployment zone',
    });
  }
  totalScore += environmentWeight;

  // Cap score at 100
  const finalScore = Math.min(100, Math.max(10, totalScore));

  // Load category and state
  let loadCategory: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Moderate';
  let state: RiskLevel = 'Stable';

  if (finalScore >= 75) {
    loadCategory = 'Severe';
    state = 'High';
  } else if (finalScore >= 55) {
    loadCategory = 'High';
    state = 'Elevated';
  } else if (finalScore >= 38) {
    loadCategory = 'Moderate';
    state = 'Watch';
  } else {
    loadCategory = 'Low';
    state = 'Stable';
  }

  return {
    score: finalScore,
    state,
    loadCategory,
    contributors,
    driverAttributions: drivers,
  };
}
