/**
 * SAJAG Engine & Security Automated Verification Suite (SIH26186)
 * Runs independent validation of all mathematical models, baselines,
 * NLP classification, unified risk synthesis, and RBAC security gates.
 */

import { calculatePersonalBaseline, analyzeDeviation, filterOutliers } from '../engines/baselineEngine';
import { calculatePhysiologicalStrain } from '../engines/physiologicalEngine';
import { calculateOperationalLoad } from '../engines/operationalEngine';
import { classifyWelfareTextLocally, calculateWelfareRisk, getMaskedGrievanceContent } from '../engines/welfareEngine';
import { synthesizeUnifiedRisk } from '../engines/unifiedRiskEngine';
import { authorizeCaseAccess, sanitizePersonnelForRole, getRolePermissions } from '../engines/rbacEngine';
import { WelfareGrievance, VoluntaryCheckIn, Personnel } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

console.log('\n==================================================');
console.log('SAJAG AUTOMATED VERIFICATION SUITE - SIH26186');
console.log('==================================================\n');

// ----------------------------------------------------
// 1. BASELINE ENGINE TESTS
// ----------------------------------------------------
console.log('[1] Baseline Engine Verification:');

const cleanSamples = [
  { day: 1, restingHrBpm: 64, hrvMs: 58, sleepDurationHrs: 7.2, isValidSample: true },
  { day: 2, restingHrBpm: 65, hrvMs: 60, sleepDurationHrs: 7.0, isValidSample: true },
  { day: 3, restingHrBpm: 63, hrvMs: 59, sleepDurationHrs: 7.1, isValidSample: true },
  { day: 4, restingHrBpm: 64, hrvMs: 57, sleepDurationHrs: 7.3, isValidSample: true },
  { day: 5, restingHrBpm: 66, hrvMs: 56, sleepDurationHrs: 6.9, isValidSample: true },
  { day: 6, restingHrBpm: 64, hrvMs: 58, sleepDurationHrs: 7.1, isValidSample: true },
  { day: 7, restingHrBpm: 65, hrvMs: 59, sleepDurationHrs: 7.0, isValidSample: true },
  { day: 8, restingHrBpm: 63, hrvMs: 61, sleepDurationHrs: 7.4, isValidSample: true },
  { day: 9, restingHrBpm: 64, hrvMs: 58, sleepDurationHrs: 7.2, isValidSample: true },
  { day: 10, restingHrBpm: 65, hrvMs: 57, sleepDurationHrs: 7.0, isValidSample: true },
];

const calibrated = calculatePersonalBaseline(cleanSamples);
assert(calibrated.hasEstablishedBaseline === true, '10 clean samples establish valid personal baseline');
assert(calibrated.confidence === 'HIGH', '10 days yields HIGH confidence rating');
assert(calibrated.meanHr >= 63 && calibrated.meanHr <= 66, 'Mean HR matches expected range');

// Sparse data test (Scenario D verification)
const sparseSamples = [
  { day: 1, restingHrBpm: 72, hrvMs: 44, sleepDurationHrs: 5.5, isValidSample: true },
  { day: 2, restingHrBpm: 74, hrvMs: 42, sleepDurationHrs: 5.0, isValidSample: true },
];
const sparse = calculatePersonalBaseline(sparseSamples);
assert(sparse.hasEstablishedBaseline === false, 'Sparse data (<5 days) does not claim established baseline');
assert(sparse.confidence === 'LOW', 'Sparse data yields explicit LOW confidence');

// Outlier filtering test
const outlierSeries = [60, 62, 61, 63, 62, 64, 185]; // 185 is a sensor error artifact
const filtered = filterOutliers(outlierSeries);
assert(!filtered.includes(185), 'IQR outlier filter successfully strips sensor spike (185 bpm)');

// ----------------------------------------------------
// 2. PHYSIOLOGICAL STRESS ENGINE TESTS
// ----------------------------------------------------
console.log('\n[2] Physiological Engine Verification:');

// Normal reading relative to baseline (Scenario B)
const normalPhysio = calculatePhysiologicalStrain({
  restingHrBpm: 64,
  hrvMs: 58,
  sleepDurationHrs: 7.0,
  baseline: calibrated,
});
assert(normalPhysio.state === 'Stable', 'Normal biometrics evaluated as Stable (Score: ' + normalPhysio.score + ')');
assert(normalPhysio.score < 35, 'Normal biometrics produce low physiological strain score');
assert(!normalPhysio.nonDiagnosticSummary.toLowerCase().includes('depression'), 'Strictly non-diagnostic language enforced');

// Elevated reading relative to baseline (Scenario A)
const elevatedPhysio = calculatePhysiologicalStrain({
  restingHrBpm: 82, // +28%
  hrvMs: 34,        // -41%
  sleepDurationHrs: 4.8, // 2.3h debt
  baseline: calibrated,
});
assert(elevatedPhysio.state === 'High' || elevatedPhysio.state === 'Elevated', 'Cardiovascular deviation evaluated as Elevated/High');
assert(elevatedPhysio.sleepDebtHrs >= 2.0, 'Sleep debt correctly quantified');

// ----------------------------------------------------
// 3. OPERATIONAL FATIGUE ENGINE TESTS
// ----------------------------------------------------
console.log('\n[3] Operational Fatigue Engine Verification:');

// Scenario B: 18 duty days, 5 night shifts, 43-day leave deficit
const heavyOps = calculateOperationalLoad({
  consecutiveDutyDays: 18,
  nightShiftsLast7d: 5,
  averageShiftHours: 12,
  lastSanctionedLeaveDaysAgo: 43,
  deploymentDays: 18,
  posting: 'Border',
});
assert(heavyOps.score >= 80, '18 duty days + leave deficit produces High operational score (Score: ' + heavyOps.score + ')');
assert(heavyOps.driverAttributions.some(d => d.driver.includes('Consecutive Duty')), 'Consecutive duty driver transparently identified');
assert(heavyOps.driverAttributions.some(d => d.driver.includes('Leave Deficit')), 'Leave deficit driver transparently identified');

// ----------------------------------------------------
// 4. WELFARE & LOCAL NLP ENGINE TESTS
// ----------------------------------------------------
console.log('\n[4] Welfare & Local NLP Engine Verification:');

// Test emergency leave classification
const emergencyGrievanceText = 'Father has been admitted to ICU in critical condition after acute cardiac distress. Urgent earned leave requested.';
const nlpResult = classifyWelfareTextLocally(emergencyGrievanceText);
assert(nlpResult.primaryCategory === 'Leave' || nlpResult.primaryCategory === 'Family Support', 'Emergency text classified as Leave / Family Support');
assert(nlpResult.urgency === 'CRITICAL', 'ICU distress classified as CRITICAL urgency');
assert(nlpResult.isAirGapped === true, 'Classification explicitly marked as air-gapped local model');
assert(nlpResult.maskedSummary.includes('CONFIDENTIAL DETAILS MASKED'), 'Sensitive raw text automatically masked in summary');

// Test Welfare Risk computation
const mockGrievances: WelfareGrievance[] = [
  {
    id: 'grv-01',
    personnelId: 'PX-1042',
    timestamp: '2026-09-12',
    category: 'Family Support',
    urgency: 'CRITICAL',
    status: 'Open',
    humanReviewRequired: true,
    sourceTextMasked: 'Family emergency / urgent leave sanction request [CONFIDENTIAL DETAILS MASKED]',
    fullSourceText: emergencyGrievanceText,
    localNLPClassification: {
      primaryCategory: 'Family Support',
      urgency: 'CRITICAL',
      confidenceScore: 0.94,
      model: 'SAJAG Local DistilBERT v2 (Air-gapped)',
      externalTransmission: false,
    },
  },
];

const mockCheckins: VoluntaryCheckIn[] = [
  {
    id: 'chk-01',
    personnelId: 'PX-1042',
    timestamp: '2026-09-13',
    mood: 'Need Support',
    notePreview: 'Feeling overwhelmed with family health status while on extended duty rotation',
    isFlaggedChange: true,
  },
];

const welfareRisk = calculateWelfareRisk({
  grievances: mockGrievances,
  checkIns: mockCheckins,
  supportRequested: true,
});
assert(welfareRisk.score >= 75, 'Critical open grievance + Need Support checkin yields High welfare risk (Score: ' + welfareRisk.score + ')');
assert(welfareRisk.unresolvedSignalsCount === 1, '1 unresolved grievance tracked');

// ----------------------------------------------------
// 5. UNIFIED RISK & ATTRIBUTION SYNTHESIS (SCENARIO B)
// ----------------------------------------------------
console.log('\n[5] Unified Risk Engine Verification (Killer Scenario B):');

const scenarioBUnified = synthesizeUnifiedRisk({
  physiologicalScore: normalPhysio.score, // 20-30 (NORMAL)
  physiologicalConfidence: 'HIGH',
  operationalScore: heavyOps.score,       // 85+ (HIGH)
  welfareScore: welfareRisk.score,        // 80+ (HIGH)
  history7d: [
    { overall: 68, physiological: 25, operational: 78, welfare: 70 },
    { overall: 74, physiological: 26, operational: 82, welfare: 75 },
    { overall: 81, physiological: 27, operational: 86, welfare: 82 },
  ],
  baselineCalibrated: true,
  unresolvedGrievancesCount: 1,
  consecutiveDutyDays: 18,
});

assert(scenarioBUnified.state === 'Human Review', 'Scenario B correctly flags HUMAN REVIEW despite normal biometrics!');
assert(scenarioBUnified.isPriorityCase === true, 'Flagged as priority case for officer intervention');
assert(scenarioBUnified.whyFlagged.some(r => r.includes('Multi-pillar convergence')), 'Multi-pillar convergence detected');
assert(scenarioBUnified.waterfallContributions.operational > scenarioBUnified.waterfallContributions.physiological, 'Operational load contribution dominates physiological score in waterfall');

// ----------------------------------------------------
// 6. ROLE-BASED ACCESS CONTROL (RBAC) SECURITY TESTS
// ----------------------------------------------------
console.log('\n[6] RBAC Security Verification:');

// Test Unauthorized Case Access (IDOR prevention)
const unauthorizedPersonnelAccess = authorizeCaseAccess('Personnel', 'PX-1042', 'PX-1078');
assert(unauthorizedPersonnelAccess.authorized === false, 'Personnel cannot view another soldier\'s case (IDOR blocked)');

const authorizedSelfAccess = authorizeCaseAccess('Personnel', 'PX-1042', 'PX-1042');
assert(authorizedSelfAccess.authorized === true, 'Personnel can view own case profile');

const authorizedOfficerAccess = authorizeCaseAccess('Welfare Officer', 'WO-102', 'PX-1042');
assert(authorizedOfficerAccess.authorized === true, 'Welfare Officer authorized for institutional review');

// Test Grievance Narrative Masking permissions
const maskedForCommander = getMaskedGrievanceContent(mockGrievances[0], 'Commander', false);
assert(maskedForCommander.isMasked === true, 'Commander cannot view sensitive raw grievance narrative');
assert(maskedForCommander.canReveal === false, 'Commander has no unmask capability');

const maskedForWelfareOfficer = getMaskedGrievanceContent(mockGrievances[0], 'Welfare Officer', false);
assert(maskedForWelfareOfficer.isMasked === true, 'Narrative masked by default for Welfare Officer');
assert(maskedForWelfareOfficer.canReveal === true, 'Welfare Officer permitted to reveal narrative with audit');

const unmaskedForWelfareOfficer = getMaskedGrievanceContent(mockGrievances[0], 'Welfare Officer', true);
assert(unmaskedForWelfareOfficer.isMasked === false, 'Welfare Officer can view full source text upon explicit audited reveal');

// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log('\n==================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('==================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL SAJAG CORE ENGINES VERIFIED SUCCESSFULLY.\n');
}
