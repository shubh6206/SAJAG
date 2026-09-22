import {
  Personnel,
  VoluntaryCheckIn,
  WelfareGrievance,
  InterventionRecord,
  CaseHistoryEvent,
  AuditLogEntry,
  UnitAnalytics,
} from '../types';

export const INITIAL_PERSONNEL: Personnel[] = [
  // Scenario B: THE KILLER DEMONSTRATION (PX-1042 or PX-1091)
  // Let's make PX-1042 match Scenario B: NORMAL BIOMETRICS + HIGH OPERATIONAL / WELFARE RISK -> HUMAN REVIEW REQUIRED!
  {
    id: 'PX-1042',
    maskedName: 'Constable R. Kumar',
    rank: 'Constable (GD)',
    unit: '14th Bn BSF',
    posting: 'Border',
    dutyStatus: 'Active',
    deploymentDays: 38,
    lastSanctionedLeaveDaysAgo: 43,
    transferCount: 2,
    trainingDaysThisYear: 4,
    serviceDurationYears: 7.5,
    leaveEntitlementDays: 60,
    leaveTakenDays: 12,
    leaveSanctionedDays: 12,
    leaveDeniedDays: 2,
    emergencyLeaveRequested: true,
    recoveryOpportunityScore: 22,
    lastAssessmentTime: 'Today, 18:42',
    reviewStatus: 'Pending Review',
    lastReviewDate: '5 days ago',
    physiological: {
      score: 32,
      state: 'Stable',
      telemetryStatus: 'BIOMETRIC AVAILABLE',
      baselinePeriodDays: 14,
      restingHrBpm: 69,
      baselineHrBpm: 68,
      hrDeviationPct: 1.5,
      hrvMs: 51,
      baselineHrvMs: 53,
      hrvDeviationPct: -3.7,
      sleepDurationHrs: 6.9,
      baselineSleepDurationHrs: 7.1,
      sleepDeviationPct: -2.8,
      sleepDebtHrs: 1.2,
      recoveryIndex: 78,
      sleepConsistencyPct: 86,
      activityExertionLoad: 'Moderate',
      confidence: 'HIGH',
      contributors: [
        'Resting HR within baseline threshold (±2%)',
        'HRV recovery stable',
        'Minor sleep debt accumulation (1.2h)'
      ],
      trend7d: [30, 29, 31, 33, 30, 31, 32]
    },
    operational: {
      score: 84,
      state: 'High',
      shiftDensityPct: 88,
      consecutiveDutyDays: 18,
      nightShiftsLast7d: 4,
      dailyDutyHours: 12,
      weeklyDutyHours: 78,
      patrolFrequencyPerWeek: 6,
      emergencyCalloutsLast30d: 4,
      doubleSentryAssignments: 5,
      restPeriodDeficitHours: 16,
      deploymentDays: 38,
      lastSanctionedLeaveDaysAgo: 43,
      loadCategory: 'Severe',
      contributors: [
        '18 consecutive duty days without full recovery interval',
        '12h+ rotational shifts in border terrain',
        '4 night patrols during past 7 days',
        'Sanctioned leave overdue by 43 days'
      ],
      dutyTimeline38d: Array.from({ length: 38 }, (_, i) => ({
        day: i + 1,
        shiftHours: i > 20 ? 12 : 10,
        isNight: (i % 3 === 0),
        isRecovery: i === 6 || i === 13 // only 2 recovery days in 38 days
      }))
    },
    welfare: {
      score: 81,
      state: 'High',
      unresolvedSignalsCount: 2,
      supportRequested: true,
      recentCheckInChangeDetected: true,
      categoryBreakdown: {
        leave: 5,
        workload: 4,
        familySupport: 3,
        housing: 1,
        facilities: 1,
        administrative: 2,
        medical: 0
      },
      checkInSummary: {
        good: 1,
        okay: 2,
        struggling: 3,
        needSupport: 1
      },
      contributors: [
        '2 unresolved high-urgency welfare signals (Emergency Leave pending)',
        'Check-in dropped from "Good" to "Need Support" in last 72 hours',
        'Family support requirement flagged via confidential intake'
      ]
    },
    unified: {
      score: 78,
      state: 'Human Review',
      persistenceDays: 6,
      confidence: 'HIGH',
      confidenceFactors: {
        hrAvailable: true,
        sleepAvailable: true,
        dutyRecordsAvailable: true,
        welfareCheckInAvailable: true,
        notes: 'Full multi-source telemetry available with high signal coverage.'
      },
      trajectoryState: 'Persistent elevation',
      trajectoryHistory: [
        { dayLabel: 'D-6', overall: 42, physiological: 30, operational: 55, welfare: 40 },
        { dayLabel: 'D-5', overall: 54, physiological: 29, operational: 68, welfare: 55 },
        { dayLabel: 'D-4', overall: 65, physiological: 31, operational: 75, welfare: 68 },
        { dayLabel: 'D-3', overall: 72, physiological: 30, operational: 80, welfare: 74 },
        { dayLabel: 'D-2', overall: 76, physiological: 32, operational: 82, welfare: 79 },
        { dayLabel: 'D-1', overall: 77, physiological: 31, operational: 84, welfare: 80 },
        { dayLabel: 'Today', overall: 78, physiological: 32, operational: 84, welfare: 81 }
      ],
      waterfallContributions: {
        physiological: 12,
        operational: 34,
        welfare: 32,
        details: {
          physiologicalReasons: ['Normal baseline maintenance (+12 base)'],
          operationalReasons: ['18 consecutive duty days (+18)', 'Night shift density (+9)', 'Deployment duration (+7)'],
          welfareReasons: ['Urgent leave grievance unresolved (+16)', 'Check-in sentiment drop (+10)', 'Family support alert (+6)']
        }
      },
      whyFlagged: [
        'Normal biometrics coexist with acute operational fatigue and urgent family welfare distress',
        '18 consecutive duty days without designated 24h rest interval',
        'Leave sanction overdue by 43 days with active unresolved request',
        'Voluntary check-in trajectory shifted sharply to "Need Support"',
        '6 consecutive days of composite elevated risk threshold'
      ],
      recommendedActions: [
        'Conduct confidential welfare officer conversation within 24 hours',
        'Review duty roster for immediate 24h rest/recovery rotation',
        'Expedite pending emergency leave sanction review',
        'Check family welfare outreach cell status'
      ]
    }
  },

  // Scenario A: HIGH PHYSIOLOGICAL STRESS + LOW WELFARE RISK (PX-1091)
  {
    id: 'PX-1091',
    maskedName: 'Head Constable V. Singh',
    rank: 'Head Constable',
    unit: '14th Bn BSF',
    posting: 'Field',
    dutyStatus: 'Active',
    deploymentDays: 14,
    lastSanctionedLeaveDaysAgo: 12,
    transferCount: 1,
    trainingDaysThisYear: 12,
    serviceDurationYears: 11.2,
    leaveEntitlementDays: 60,
    leaveTakenDays: 20,
    leaveSanctionedDays: 20,
    leaveDeniedDays: 0,
    emergencyLeaveRequested: false,
    recoveryOpportunityScore: 35,
    lastAssessmentTime: 'Today, 17:15',
    reviewStatus: 'Pending Review',
    lastReviewDate: '10 days ago',
    physiological: {
      score: 82,
      state: 'High',
      telemetryStatus: 'BIOMETRIC AVAILABLE',
      baselinePeriodDays: 14,
      restingHrBpm: 84,
      baselineHrBpm: 66,
      hrDeviationPct: 27.2,
      hrvMs: 32,
      baselineHrvMs: 56,
      hrvDeviationPct: -42.8,
      sleepDurationHrs: 4.6,
      baselineSleepDurationHrs: 7.2,
      sleepDeviationPct: -36.1,
      sleepDebtHrs: 7.8,
      recoveryIndex: 31,
      sleepConsistencyPct: 54,
      activityExertionLoad: 'Severe',
      confidence: 'HIGH',
      contributors: [
        'Resting HR elevated +27% above personal 14-day baseline',
        'Severe HRV suppression (-43%) indicating autonomic strain',
        'Sleep debt of 7.8 hours accumulated over 5 consecutive cycles',
        'Recovery index dropped below critical 35 threshold'
      ],
      trend7d: [48, 55, 63, 71, 76, 80, 82]
    },
    operational: {
      score: 42,
      state: 'Watch',
      shiftDensityPct: 62,
      consecutiveDutyDays: 4,
      nightShiftsLast7d: 1,
      dailyDutyHours: 8,
      weeklyDutyHours: 56,
      patrolFrequencyPerWeek: 4,
      emergencyCalloutsLast30d: 1,
      doubleSentryAssignments: 1,
      restPeriodDeficitHours: 4,
      deploymentDays: 14,
      lastSanctionedLeaveDaysAgo: 12,
      loadCategory: 'Moderate',
      contributors: [
        '4 consecutive field patrol shifts',
        'Standard 8-hour shift structure',
        'Recent leave availed 12 days ago'
      ],
      dutyTimeline38d: Array.from({ length: 14 }, (_, i) => ({
        day: i + 1,
        shiftHours: 8,
        isNight: i === 3,
        isRecovery: i === 0 || i === 7
      }))
    },
    welfare: {
      score: 22,
      state: 'Stable',
      unresolvedSignalsCount: 0,
      supportRequested: false,
      recentCheckInChangeDetected: false,
      categoryBreakdown: {
        leave: 0,
        workload: 1,
        familySupport: 0,
        housing: 0,
        facilities: 1,
        administrative: 0,
        medical: 0
      },
      checkInSummary: {
        good: 5,
        okay: 2,
        struggling: 0,
        needSupport: 0
      },
      contributors: [
        'Voluntary check-ins consistent with "Good"',
        'Zero active grievances or support escalations',
        'Welfare support networks reported healthy'
      ]
    },
    unified: {
      score: 72,
      state: 'High',
      persistenceDays: 4,
      confidence: 'HIGH',
      confidenceFactors: {
        hrAvailable: true,
        sleepAvailable: true,
        dutyRecordsAvailable: true,
        welfareCheckInAvailable: true,
        notes: 'Consistent biometric telemetry. Medical/recovery protocol recommended.'
      },
      trajectoryState: 'Acute spike',
      trajectoryHistory: [
        { dayLabel: 'D-6', overall: 28, physiological: 32, operational: 38, welfare: 20 },
        { dayLabel: 'D-5', overall: 36, physiological: 44, operational: 40, welfare: 21 },
        { dayLabel: 'D-4', overall: 51, physiological: 62, operational: 42, welfare: 22 },
        { dayLabel: 'D-3', overall: 64, physiological: 74, operational: 43, welfare: 21 },
        { dayLabel: 'D-2', overall: 68, physiological: 78, operational: 41, welfare: 23 },
        { dayLabel: 'D-1', overall: 70, physiological: 80, operational: 42, welfare: 22 },
        { dayLabel: 'Today', overall: 72, physiological: 82, operational: 42, welfare: 22 }
      ],
      waterfallContributions: {
        physiological: 48,
        operational: 16,
        welfare: 8,
        details: {
          physiologicalReasons: ['Resting HR surge (+22)', 'HRV collapse (+16)', 'Sleep deficit (+10)'],
          operationalReasons: ['Field exposure (+10)', 'Standard shift rotation (+6)'],
          welfareReasons: ['Minimal welfare baseline (+8)']
        }
      },
      whyFlagged: [
        'Acute physiological strain spike across resting HR and autonomic recovery',
        'Accumulated 7.8 hours sleep debt during field deployment',
        'Autonomous physical exertion without adequate recovery intervals',
        'Welfare signals remain stable and unburdened'
      ],
      recommendedActions: [
        'Primary: Rest / recovery monitoring and temporary shift adjustment',
        'Check for sub-clinical infection, dehydration, or altitude exertion',
        'Schedule medical officer review to rule out acute physical illness',
        'Maintain 48h sleep hygiene and hydration recheck'
      ]
    }
  },

  // Scenario C: RECOVERING PERSONNEL (PX-1148)
  {
    id: 'PX-1148',
    maskedName: 'Sub-Inspector M. Sharma',
    rank: 'Sub-Inspector',
    unit: '8th Bn CRPF',
    posting: 'Peace',
    dutyStatus: 'Standby',
    deploymentDays: 60,
    lastSanctionedLeaveDaysAgo: 5,
    transferCount: 3,
    trainingDaysThisYear: 8,
    serviceDurationYears: 9.0,
    leaveEntitlementDays: 60,
    leaveTakenDays: 25,
    leaveSanctionedDays: 25,
    leaveDeniedDays: 0,
    emergencyLeaveRequested: false,
    recoveryOpportunityScore: 86,
    lastAssessmentTime: 'Today, 14:20',
    reviewStatus: 'In Progress',
    lastReviewDate: 'Yesterday',
    physiological: {
      score: 34,
      state: 'Stable',
      telemetryStatus: 'BIOMETRIC AVAILABLE',
      baselinePeriodDays: 14,
      restingHrBpm: 67,
      baselineHrBpm: 65,
      hrDeviationPct: 3.1,
      hrvMs: 49,
      baselineHrvMs: 50,
      hrvDeviationPct: -2.0,
      sleepDurationHrs: 7.4,
      baselineSleepDurationHrs: 7.2,
      sleepDeviationPct: 2.7,
      sleepDebtHrs: 0.4,
      recoveryIndex: 82,
      sleepConsistencyPct: 91,
      activityExertionLoad: 'Low',
      confidence: 'HIGH',
      contributors: [
        'Recovery index normalized from 34 to 82',
        'HRV restored to within 2% of personal baseline',
        'Sleep debt cleared following sanctioned leave period'
      ],
      trend7d: [78, 66, 52, 44, 38, 35, 34]
    },
    operational: {
      score: 28,
      state: 'Stable',
      shiftDensityPct: 40,
      consecutiveDutyDays: 2,
      nightShiftsLast7d: 0,
      dailyDutyHours: 6,
      weeklyDutyHours: 36,
      patrolFrequencyPerWeek: 1,
      emergencyCalloutsLast30d: 0,
      doubleSentryAssignments: 0,
      restPeriodDeficitHours: 0,
      deploymentDays: 60,
      lastSanctionedLeaveDaysAgo: 5,
      loadCategory: 'Low',
      contributors: [
        'Reassigned to administrative standby post recovery intervention',
        '0 night shifts in last 7 days',
        'Returned from sanctioned leave 5 days ago'
      ],
      dutyTimeline38d: Array.from({ length: 20 }, (_, i) => ({
        day: i + 1,
        shiftHours: 6,
        isNight: false,
        isRecovery: true
      }))
    },
    welfare: {
      score: 26,
      state: 'Stable',
      unresolvedSignalsCount: 0,
      supportRequested: false,
      recentCheckInChangeDetected: false,
      categoryBreakdown: {
        leave: 1,
        workload: 0,
        familySupport: 0,
        housing: 0,
        facilities: 0,
        administrative: 0,
        medical: 0
      },
      checkInSummary: {
        good: 6,
        okay: 1,
        struggling: 0,
        needSupport: 0
      },
      contributors: [
        'Previous leave grievance resolved successfully by Welfare Cell',
        'Check-ins sustained at "Good" across past 5 days',
        'Officer follow-up logged on 12 Sep 2026'
      ]
    },
    unified: {
      score: 30,
      state: 'Stable',
      persistenceDays: 0,
      confidence: 'HIGH',
      confidenceFactors: {
        hrAvailable: true,
        sleepAvailable: true,
        dutyRecordsAvailable: true,
        welfareCheckInAvailable: true,
        notes: 'Positive post-intervention trajectory confirmed.'
      },
      trajectoryState: 'Improving',
      trajectoryHistory: [
        { dayLabel: 'D-6', overall: 82, physiological: 78, operational: 80, welfare: 84 },
        { dayLabel: 'D-5', overall: 68, physiological: 66, operational: 65, welfare: 70 },
        { dayLabel: 'D-4', overall: 55, physiological: 52, operational: 50, welfare: 60 },
        { dayLabel: 'D-3', overall: 44, physiological: 44, operational: 40, welfare: 45 },
        { dayLabel: 'D-2', overall: 36, physiological: 38, operational: 32, welfare: 35 },
        { dayLabel: 'D-1', overall: 32, physiological: 35, operational: 30, welfare: 28 },
        { dayLabel: 'Today', overall: 30, physiological: 34, operational: 28, welfare: 26 }
      ],
      waterfallContributions: {
        physiological: 10,
        operational: 10,
        welfare: 10,
        details: {
          physiologicalReasons: ['Stabilized biometrics (+10)'],
          operationalReasons: ['Reduced workload rotation (+10)'],
          welfareReasons: ['Resolved grievance (+10)']
        }
      },
      whyFlagged: [
        'Case previously flagged for High Risk, currently demonstrating strong recovery trajectory',
        'Intervention on 10 Sep successfully relieved duty overload and granted pending leave',
        'All three pillars have safely transitioned to Stable thresholds'
      ],
      recommendedActions: [
        'Record final post-intervention verification note',
        'Gradual phased transition back to standard duty cycle',
        'Routine welfare follow-up in 14 days'
      ]
    }
  },

  // Scenario D: DATA SPARSITY / INCOMPLETE SIGNALS (PX-1205)
  {
    id: 'PX-1205',
    maskedName: 'Constable S. Pathak',
    rank: 'Constable',
    unit: 'ITBP High Altitude Wing',
    posting: 'High Altitude',
    dutyStatus: 'Active',
    deploymentDays: 24,
    lastSanctionedLeaveDaysAgo: 31,
    transferCount: 1,
    trainingDaysThisYear: 6,
    serviceDurationYears: 4.2,
    leaveEntitlementDays: 60,
    leaveTakenDays: 15,
    leaveSanctionedDays: 15,
    leaveDeniedDays: 1,
    emergencyLeaveRequested: false,
    recoveryOpportunityScore: 40,
    lastAssessmentTime: 'Today, 11:05',
    reviewStatus: 'Pending Review',
    lastReviewDate: 'None',
    physiological: {
      score: 48,
      state: 'Watch',
      telemetryStatus: 'PARTIAL TELEMETRY',
      telemetryNote: 'Insufficient physiological data — HRV/Sleep uncalibrated',
      baselinePeriodDays: 14,
      restingHrBpm: 76,
      baselineHrBpm: 72,
      hrDeviationPct: 5.5,
      hrvMs: 0, // Missing
      baselineHrvMs: 44,
      hrvDeviationPct: 0,
      sleepDurationHrs: 0, // Missing
      baselineSleepDurationHrs: 6.8,
      sleepDeviationPct: 0,
      sleepDebtHrs: 0,
      recoveryIndex: 50,
      sleepConsistencyPct: 20,
      activityExertionLoad: 'Moderate',
      confidence: 'LOW',
      confidenceReason: 'Assessment confidence reduced due to sparse telemetry. Missing data is never treated as elevated risk.',
      contributors: [
        'Insufficient physiological data (HRV sensor telemetry uncalibrated)',
        'Sleep log incomplete due to sub-zero charging constraints',
        'Sparse resting HR sample points (only 2 readings captured today)'
      ],
      trend7d: [40, 42, 45, 48, 48, 48, 48]
    },
    operational: {
      score: 52,
      state: 'Elevated',
      shiftDensityPct: 70,
      consecutiveDutyDays: 9,
      nightShiftsLast7d: 2,
      dailyDutyHours: 10,
      weeklyDutyHours: 68,
      patrolFrequencyPerWeek: 5,
      emergencyCalloutsLast30d: 2,
      doubleSentryAssignments: 3,
      restPeriodDeficitHours: 8,
      deploymentDays: 24,
      lastSanctionedLeaveDaysAgo: 31,
      loadCategory: 'High',
      contributors: [
        'High altitude forward outpost posting (3,800m)',
        '9 consecutive days cold weather perimeter watch',
        'Duty log partially synchronized via satellite link'
      ],
      dutyTimeline38d: Array.from({ length: 24 }, (_, i) => ({
        day: i + 1,
        shiftHours: 8,
        isNight: i % 4 === 0,
        isRecovery: false
      }))
    },
    welfare: {
      score: 45,
      state: 'Watch',
      unresolvedSignalsCount: 0,
      supportRequested: false,
      recentCheckInChangeDetected: false,
      categoryBreakdown: {
        leave: 1,
        workload: 1,
        familySupport: 0,
        housing: 1,
        facilities: 2,
        administrative: 0,
        medical: 1
      },
      checkInSummary: {
        good: 1,
        okay: 1,
        struggling: 0,
        needSupport: 0
      },
      contributors: [
        'Sparse voluntary check-ins (1 check-in in last 5 days)',
        'Cold-weather equipment inquiry logged at base depot',
        'Communication link latency in high-altitude sector'
      ]
    },
    unified: {
      score: 54,
      state: 'Watch',
      persistenceDays: 2,
      confidence: 'LOW',
      confidenceFactors: {
        hrAvailable: true,
        sleepAvailable: false,
        dutyRecordsAvailable: true,
        welfareCheckInAvailable: false,
        notes: 'LOW CONFIDENCE: HRV unavailable, sleep records missing, check-in sparse. Interpretation limited.'
      },
      trajectoryState: 'Data sparse',
      trajectoryHistory: [
        { dayLabel: 'D-6', overall: 45, physiological: 40, operational: 50, welfare: 42 },
        { dayLabel: 'D-5', overall: 48, physiological: 42, operational: 51, welfare: 44 },
        { dayLabel: 'D-4', overall: 50, physiological: 45, operational: 52, welfare: 45 },
        { dayLabel: 'D-3', overall: 52, physiological: 48, operational: 52, welfare: 45 },
        { dayLabel: 'D-2', overall: 53, physiological: 48, operational: 52, welfare: 45 },
        { dayLabel: 'D-1', overall: 54, physiological: 48, operational: 52, welfare: 45 },
        { dayLabel: 'Today', overall: 54, physiological: 48, operational: 52, welfare: 45 }
      ],
      waterfallContributions: {
        physiological: 18,
        operational: 22,
        welfare: 14,
        details: {
          physiologicalReasons: ['Sparse HR sample (+18)', 'HRV/Sleep telemetry unverified'],
          operationalReasons: ['High altitude forward post (+14)', 'Consecutive days (+8)'],
          welfareReasons: ['Infrequent check-in link (+14)']
        }
      },
      whyFlagged: [
        'Signal confidence marked LOW due to incomplete wearable sensor sync',
        'High altitude forward post environment increases operational fatigue exposure',
        'System adheres to strict policy: Never manufacture synthetic metrics when real data is missing'
      ],
      recommendedActions: [
        'Prompt forward station commander to inspect personnel wearable and battery recharge unit',
        'Conduct direct in-person radio welfare roll-call',
        'Verify high-altitude shelter heating and facility logistics',
        'Re-evaluate risk score once complete 48h signal packet is synchronized'
      ]
    }
  },

  // Additional realistic personnel to round out the 248-monitored unit
  {
    id: 'PX-1319',
    maskedName: 'Naik T. Roy',
    rank: 'Naik',
    unit: '14th Bn BSF',
    posting: 'Border',
    dutyStatus: 'Active',
    deploymentDays: 45,
    lastSanctionedLeaveDaysAgo: 52,
    lastAssessmentTime: 'Today, 16:10',
    reviewStatus: 'Pending Review',
    physiological: {
      score: 68,
      state: 'Elevated',
      restingHrBpm: 78,
      baselineHrBpm: 65,
      hrDeviationPct: 20.0,
      hrvMs: 38,
      baselineHrvMs: 52,
      hrvDeviationPct: -26.9,
      sleepDurationHrs: 5.1,
      baselineSleepDurationHrs: 7.0,
      sleepDeviationPct: -27.1,
      sleepDebtHrs: 5.5,
      recoveryIndex: 42,
      sleepConsistencyPct: 62,
      activityExertionLoad: 'High',
      confidence: 'HIGH',
      contributors: ['Resting HR +20% above baseline', 'HRV decline of 27%', '5.5h accumulated sleep debt'],
      trend7d: [55, 58, 62, 64, 66, 67, 68]
    },
    operational: {
      score: 75,
      state: 'High',
      shiftDensityPct: 82,
      consecutiveDutyDays: 14,
      nightShiftsLast7d: 3,
      deploymentDays: 45,
      lastSanctionedLeaveDaysAgo: 52,
      loadCategory: 'High',
      contributors: ['14 consecutive duty days', '52 days since last leave', '3 night patrols'],
      dutyTimeline38d: []
    },
    welfare: {
      score: 64,
      state: 'Elevated',
      unresolvedSignalsCount: 1,
      supportRequested: true,
      recentCheckInChangeDetected: true,
      categoryBreakdown: { leave: 3, workload: 2, familySupport: 2, housing: 0, facilities: 1, administrative: 1, medical: 0 },
      checkInSummary: { good: 1, okay: 2, struggling: 3, needSupport: 1 },
      contributors: ['Housing repair grievance pending at home village', 'Check-in state shifted to Struggling']
    },
    unified: {
      score: 71,
      state: 'High',
      persistenceDays: 5,
      confidence: 'HIGH',
      confidenceFactors: { hrAvailable: true, sleepAvailable: true, dutyRecordsAvailable: true, welfareCheckInAvailable: true },
      trajectoryState: 'Persistent elevation',
      trajectoryHistory: [
        { dayLabel: 'D-6', overall: 52, physiological: 50, operational: 58, welfare: 48 },
        { dayLabel: 'D-5', overall: 58, physiological: 55, operational: 62, welfare: 52 },
        { dayLabel: 'D-4', overall: 62, physiological: 60, operational: 68, welfare: 58 },
        { dayLabel: 'D-3', overall: 66, physiological: 63, operational: 70, welfare: 60 },
        { dayLabel: 'D-2', overall: 68, physiological: 65, operational: 72, welfare: 62 },
        { dayLabel: 'D-1', overall: 70, physiological: 67, operational: 74, welfare: 63 },
        { dayLabel: 'Today', overall: 71, physiological: 68, operational: 75, welfare: 64 }
      ],
      waterfallContributions: {
        physiological: 24,
        operational: 26,
        welfare: 21,
        details: {
          physiologicalReasons: ['Sleep debt (+14)', 'HR elevation (+10)'],
          operationalReasons: ['14 consecutive duty days (+16)', 'Leave backlog (+10)'],
          welfareReasons: ['Housing repair grievance (+12)', 'Struggling check-in (+9)']
        }
      },
      whyFlagged: ['Multi-pillar strain with 5 days persistent elevation', 'Consecutive duty load + family housing request pending'],
      recommendedActions: ['Conduct welfare officer check-in', 'Arrange home village welfare cell liaison', 'Schedule 36h recovery rest']
    }
  },

  {
    id: 'PX-1420',
    maskedName: 'Constable A. Yadav',
    rank: 'Constable',
    unit: '8th Bn CRPF',
    posting: 'Field',
    dutyStatus: 'Active',
    deploymentDays: 19,
    lastSanctionedLeaveDaysAgo: 22,
    lastAssessmentTime: 'Today, 15:30',
    reviewStatus: 'Pending Review',
    physiological: {
      score: 55,
      state: 'Elevated',
      restingHrBpm: 74,
      baselineHrBpm: 67,
      hrDeviationPct: 10.4,
      hrvMs: 42,
      baselineHrvMs: 48,
      hrvDeviationPct: -12.5,
      sleepDurationHrs: 5.8,
      baselineSleepDurationHrs: 6.9,
      sleepDeviationPct: -15.9,
      sleepDebtHrs: 3.2,
      recoveryIndex: 58,
      sleepConsistencyPct: 74,
      activityExertionLoad: 'Moderate',
      confidence: 'HIGH',
      contributors: ['Sleep deficit 3.2h', 'Slight autonomic recovery reduction'],
      trend7d: [48, 50, 52, 53, 54, 55, 55]
    },
    operational: {
      score: 58,
      state: 'Elevated',
      shiftDensityPct: 72,
      consecutiveDutyDays: 8,
      nightShiftsLast7d: 2,
      deploymentDays: 19,
      lastSanctionedLeaveDaysAgo: 22,
      loadCategory: 'High',
      contributors: ['8 days consecutive duty', 'Regular field mobility'],
      dutyTimeline38d: []
    },
    welfare: {
      score: 42,
      state: 'Watch',
      unresolvedSignalsCount: 0,
      supportRequested: false,
      recentCheckInChangeDetected: false,
      categoryBreakdown: { leave: 1, workload: 1, familySupport: 0, housing: 0, facilities: 0, administrative: 0, medical: 0 },
      checkInSummary: { good: 3, okay: 3, struggling: 1, needSupport: 0 },
      contributors: ['Check-ins mostly Okay', 'Leave requested for next month']
    },
    unified: {
      score: 53,
      state: 'Elevated',
      persistenceDays: 3,
      confidence: 'HIGH',
      confidenceFactors: { hrAvailable: true, sleepAvailable: true, dutyRecordsAvailable: true, welfareCheckInAvailable: true },
      trajectoryState: 'Persistent elevation',
      trajectoryHistory: [
        { dayLabel: 'D-6', overall: 46, physiological: 48, operational: 50, welfare: 38 },
        { dayLabel: 'D-5', overall: 48, physiological: 50, operational: 52, welfare: 39 },
        { dayLabel: 'D-4', overall: 50, physiological: 51, operational: 54, welfare: 40 },
        { dayLabel: 'D-3', overall: 51, physiological: 52, operational: 55, welfare: 41 },
        { dayLabel: 'D-2', overall: 52, physiological: 53, operational: 56, welfare: 41 },
        { dayLabel: 'D-1', overall: 52, physiological: 54, operational: 57, welfare: 42 },
        { dayLabel: 'Today', overall: 53, physiological: 55, operational: 58, welfare: 42 }
      ],
      waterfallContributions: {
        physiological: 19,
        operational: 22,
        welfare: 12,
        details: {
          physiologicalReasons: ['Sleep deficit (+12)', 'HR elevation (+7)'],
          operationalReasons: ['8 days consecutive duty (+15)', 'Field patrol (+7)'],
          welfareReasons: ['Upcoming leave query (+12)']
        }
      },
      whyFlagged: ['Moderate operational fatigue combined with minor sleep debt'],
      recommendedActions: ['Monitor during weekly welfare muster', 'Ensure rest interval at 10-day mark']
    }
  },

  {
    id: 'PX-1502',
    maskedName: 'Head Constable K. Dev',
    rank: 'Head Constable',
    unit: 'ITBP High Altitude Wing',
    posting: 'High Altitude',
    dutyStatus: 'Active',
    deploymentDays: 30,
    lastSanctionedLeaveDaysAgo: 38,
    lastAssessmentTime: 'Today, 13:00',
    reviewStatus: 'Reviewed',
    physiological: {
      score: 62,
      state: 'Elevated',
      restingHrBpm: 75,
      baselineHrBpm: 68,
      hrDeviationPct: 10.2,
      hrvMs: 40,
      baselineHrvMs: 50,
      hrvDeviationPct: -20.0,
      sleepDurationHrs: 5.5,
      baselineSleepDurationHrs: 7.0,
      sleepDeviationPct: -21.4,
      sleepDebtHrs: 4.5,
      recoveryIndex: 52,
      sleepConsistencyPct: 68,
      activityExertionLoad: 'High',
      confidence: 'HIGH',
      contributors: ['High-altitude hypoxic strain', 'Resting HR adaptation +10%'],
      trend7d: [56, 58, 60, 61, 62, 62, 62]
    },
    operational: {
      score: 65,
      state: 'Elevated',
      shiftDensityPct: 78,
      consecutiveDutyDays: 11,
      nightShiftsLast7d: 3,
      deploymentDays: 30,
      lastSanctionedLeaveDaysAgo: 38,
      loadCategory: 'High',
      contributors: ['High altitude watch', 'Cold weather night vigilance'],
      dutyTimeline38d: []
    },
    welfare: {
      score: 38,
      state: 'Watch',
      unresolvedSignalsCount: 0,
      supportRequested: false,
      recentCheckInChangeDetected: false,
      categoryBreakdown: { leave: 0, workload: 1, familySupport: 0, housing: 0, facilities: 2, administrative: 0, medical: 0 },
      checkInSummary: { good: 4, okay: 2, struggling: 1, needSupport: 0 },
      contributors: ['Facilities inquiry on winter gear', 'Check-ins steady']
    },
    unified: {
      score: 58,
      state: 'Elevated',
      persistenceDays: 4,
      confidence: 'HIGH',
      confidenceFactors: { hrAvailable: true, sleepAvailable: true, dutyRecordsAvailable: true, welfareCheckInAvailable: true },
      trajectoryState: 'Persistent elevation',
      trajectoryHistory: [
        { dayLabel: 'D-6', overall: 52, physiological: 56, operational: 60, welfare: 35 },
        { dayLabel: 'D-5', overall: 54, physiological: 58, operational: 61, welfare: 36 },
        { dayLabel: 'D-4', overall: 56, physiological: 60, operational: 62, welfare: 37 },
        { dayLabel: 'D-3', overall: 57, physiological: 61, operational: 64, welfare: 38 },
        { dayLabel: 'D-2', overall: 57, physiological: 62, operational: 64, welfare: 38 },
        { dayLabel: 'D-1', overall: 58, physiological: 62, operational: 65, welfare: 38 },
        { dayLabel: 'Today', overall: 58, physiological: 62, operational: 65, welfare: 38 }
      ],
      waterfallContributions: {
        physiological: 22,
        operational: 24,
        welfare: 12,
        details: {
          physiologicalReasons: ['Hypoxia acclimation (+14)', 'Sleep debt (+8)'],
          operationalReasons: ['High altitude night shifts (+16)', '11 days duty (+8)'],
          welfareReasons: ['Facilities query (+12)']
        }
      },
      whyFlagged: ['High-altitude duty fatigue with hypoxic physiological adaptation'],
      recommendedActions: ['O2 saturation routine monitoring', 'Rotate off ridge watch in 48h']
    }
  },

  {
    id: 'PX-1633',
    maskedName: 'Constable N. Joshi',
    rank: 'Constable',
    unit: '14th Bn BSF',
    posting: 'Peace',
    dutyStatus: 'Active',
    deploymentDays: 10,
    lastSanctionedLeaveDaysAgo: 8,
    lastAssessmentTime: 'Today, 09:15',
    reviewStatus: 'Reviewed',
    physiological: {
      score: 22,
      state: 'Stable',
      restingHrBpm: 64,
      baselineHrBpm: 65,
      hrDeviationPct: -1.5,
      hrvMs: 54,
      baselineHrvMs: 53,
      hrvDeviationPct: 1.8,
      sleepDurationHrs: 7.5,
      baselineSleepDurationHrs: 7.2,
      sleepDeviationPct: 4.1,
      sleepDebtHrs: 0,
      recoveryIndex: 88,
      sleepConsistencyPct: 92,
      activityExertionLoad: 'Low',
      confidence: 'HIGH',
      contributors: ['Healthy recovery metrics', 'No sleep debt'],
      trend7d: [24, 23, 22, 22, 23, 22, 22]
    },
    operational: {
      score: 24,
      state: 'Stable',
      shiftDensityPct: 45,
      consecutiveDutyDays: 3,
      nightShiftsLast7d: 0,
      deploymentDays: 10,
      lastSanctionedLeaveDaysAgo: 8,
      loadCategory: 'Low',
      contributors: ['Standard peace station duties', 'Regular rest periods'],
      dutyTimeline38d: []
    },
    welfare: {
      score: 18,
      state: 'Stable',
      unresolvedSignalsCount: 0,
      supportRequested: false,
      recentCheckInChangeDetected: false,
      categoryBreakdown: { leave: 0, workload: 0, familySupport: 0, housing: 0, facilities: 0, administrative: 0, medical: 0 },
      checkInSummary: { good: 7, okay: 0, struggling: 0, needSupport: 0 },
      contributors: ['All check-ins positive', 'Zero grievances']
    },
    unified: {
      score: 21,
      state: 'Stable',
      persistenceDays: 0,
      confidence: 'HIGH',
      confidenceFactors: { hrAvailable: true, sleepAvailable: true, dutyRecordsAvailable: true, welfareCheckInAvailable: true },
      trajectoryState: 'Improving',
      trajectoryHistory: [
        { dayLabel: 'D-6', overall: 24, physiological: 24, operational: 25, welfare: 20 },
        { dayLabel: 'D-5', overall: 23, physiological: 23, operational: 24, welfare: 19 },
        { dayLabel: 'D-4', overall: 22, physiological: 22, operational: 24, welfare: 18 },
        { dayLabel: 'D-3', overall: 22, physiological: 22, operational: 23, welfare: 18 },
        { dayLabel: 'D-2', overall: 22, physiological: 23, operational: 24, welfare: 18 },
        { dayLabel: 'D-1', overall: 21, physiological: 22, operational: 24, welfare: 18 },
        { dayLabel: 'Today', overall: 21, physiological: 22, operational: 24, welfare: 18 }
      ],
      waterfallContributions: {
        physiological: 7,
        operational: 8,
        welfare: 6,
        details: { physiologicalReasons: ['Normal baseline'], operationalReasons: ['Normal duties'], welfareReasons: ['Satisfied'] }
      },
      whyFlagged: ['No flags. Operating in optimal baseline parameter zone.'],
      recommendedActions: ['Continue standard routine']
    }
  }
];

// Ensure all personnel records conform to comprehensive SIH dataset standards
INITIAL_PERSONNEL.forEach((p) => {
  if (p.transferCount === undefined) p.transferCount = 2;
  if (p.trainingDaysThisYear === undefined) p.trainingDaysThisYear = 8;
  if (p.serviceDurationYears === undefined) p.serviceDurationYears = 8.5;
  if (p.leaveEntitlementDays === undefined) p.leaveEntitlementDays = 60;
  if (p.leaveTakenDays === undefined) p.leaveTakenDays = 15;
  if (p.leaveSanctionedDays === undefined) p.leaveSanctionedDays = 15;
  if (p.leaveDeniedDays === undefined) p.leaveDeniedDays = 0;
  if (p.emergencyLeaveRequested === undefined) p.emergencyLeaveRequested = false;
  if (p.recoveryOpportunityScore === undefined) p.recoveryOpportunityScore = 55;
  if (!p.physiological.telemetryStatus) p.physiological.telemetryStatus = 'BIOMETRIC AVAILABLE';
  if (!p.physiological.baselinePeriodDays) p.physiological.baselinePeriodDays = 14;
  if (p.operational.dailyDutyHours === undefined) p.operational.dailyDutyHours = 8;
  if (p.operational.weeklyDutyHours === undefined) p.operational.weeklyDutyHours = 56;
  if (p.operational.patrolFrequencyPerWeek === undefined) p.operational.patrolFrequencyPerWeek = 4;
  if (p.operational.emergencyCalloutsLast30d === undefined) p.operational.emergencyCalloutsLast30d = 1;
  if (p.operational.doubleSentryAssignments === undefined) p.operational.doubleSentryAssignments = 2;
  if (p.operational.restPeriodDeficitHours === undefined) p.operational.restPeriodDeficitHours = 6;
});

export const INITIAL_CHECKINS: VoluntaryCheckIn[] = [
  {
    id: 'chk-1',
    personnelId: 'PX-1042',
    timestamp: 'Today, 16:15',
    mood: 'Need Support',
    sleepQuality: 'Poor',
    fatigueLevel: 'High',
    workStress: 'High',
    familyConcern: true,
    supportRequest: true,
    generalWellbeingScore: 2,
    notePreview: 'Wife admitted for emergency surgery; leave sanctioned status still unverified by battalion HQ.',
    isFlaggedChange: true,
    provenanceTag: 'WELLNESS DATA (VOLUNTARY)'
  },
  {
    id: 'chk-2',
    personnelId: 'PX-1042',
    timestamp: 'Yesterday, 18:00',
    mood: 'Struggling',
    sleepQuality: 'Fair',
    fatigueLevel: 'High',
    workStress: 'High',
    familyConcern: true,
    supportRequest: false,
    generalWellbeingScore: 2,
    notePreview: 'Night shifts back to back, fatigue setting in.',
    isFlaggedChange: true,
    provenanceTag: 'WELLNESS DATA (VOLUNTARY)'
  },
  {
    id: 'chk-3',
    personnelId: 'PX-1042',
    timestamp: '3 days ago',
    mood: 'Okay',
    sleepQuality: 'Good',
    fatigueLevel: 'Moderate',
    workStress: 'Moderate',
    familyConcern: false,
    supportRequest: false,
    generalWellbeingScore: 3,
    notePreview: 'Managing duties normally.',
    isFlaggedChange: false,
    provenanceTag: 'WELLNESS DATA (VOLUNTARY)'
  },
  {
    id: 'chk-4',
    personnelId: 'PX-1091',
    timestamp: 'Today, 11:20',
    mood: 'Good',
    sleepQuality: 'Poor',
    fatigueLevel: 'High',
    workStress: 'Moderate',
    familyConcern: false,
    supportRequest: false,
    generalWellbeingScore: 4,
    notePreview: 'Feeling high physical exertion from patrol, morale is fine.',
    isFlaggedChange: false,
    provenanceTag: 'WELLNESS DATA (VOLUNTARY)'
  },
  {
    id: 'chk-5',
    personnelId: 'PX-1148',
    timestamp: 'Yesterday, 14:00',
    mood: 'Good',
    sleepQuality: 'Good',
    fatigueLevel: 'Low',
    workStress: 'Low',
    familyConcern: false,
    supportRequest: false,
    generalWellbeingScore: 5,
    notePreview: 'Recovery leave helped significantly, grateful for the officer assistance.',
    isFlaggedChange: false,
    provenanceTag: 'WELLNESS DATA (VOLUNTARY)'
  },
  {
    id: 'chk-6',
    personnelId: 'PX-1319',
    timestamp: 'Today, 08:30',
    mood: 'Struggling',
    sleepQuality: 'Fair',
    fatigueLevel: 'Moderate',
    workStress: 'Moderate',
    familyConcern: true,
    supportRequest: true,
    generalWellbeingScore: 2,
    notePreview: 'Heavy rains damaged family homestead, seeking welfare loan advice.',
    isFlaggedChange: true,
    provenanceTag: 'WELLNESS DATA (VOLUNTARY)'
  }
];

export const INITIAL_GRIEVANCES: WelfareGrievance[] = [
  {
    id: 'grv-1',
    personnelId: 'PX-1042',
    timestamp: 'Today, 16:20',
    category: 'Leave',
    urgency: 'HIGH',
    status: 'Open',
    humanReviewRequired: true,
    sourceTextMasked: 'Emergency domestic leave request pending review [Confidential welfare record]',
    fullSourceText: 'Wife undergoing emergency gallbladder surgery in native district hospital. Requesting 14 days emergency casual leave.',
    localNLPClassification: {
      primaryCategory: 'Leave / Family Emergency',
      urgency: 'HIGH',
      confidenceScore: 0.94,
      model: 'SAJAG Local DistilBERT v2 (Air-gapped)',
      externalTransmission: false
    }
  },
  {
    id: 'grv-2',
    personnelId: 'PX-1042',
    timestamp: '2 days ago',
    category: 'Family Support',
    urgency: 'MEDIUM',
    status: 'Open',
    humanReviewRequired: true,
    sourceTextMasked: 'Assistance requested with district collectorate medical welfare reimbursement',
    fullSourceText: 'Medical claim for dependent child under CAPF CGHS scheme pending at regional office.',
    localNLPClassification: {
      primaryCategory: 'Family Support / Medical Administrative',
      urgency: 'MEDIUM',
      confidenceScore: 0.89,
      model: 'SAJAG Local DistilBERT v2 (Air-gapped)',
      externalTransmission: false
    }
  },
  {
    id: 'grv-3',
    personnelId: 'PX-1319',
    timestamp: 'Today, 09:00',
    category: 'Housing',
    urgency: 'HIGH',
    status: 'Open',
    humanReviewRequired: true,
    sourceTextMasked: 'Homestead flood repair welfare advance application',
    fullSourceText: 'Monsoon flooding damaged roof of village home. Seeking welfare loan from battalion regimental fund.',
    localNLPClassification: {
      primaryCategory: 'Housing / Welfare Assistance',
      urgency: 'HIGH',
      confidenceScore: 0.92,
      model: 'SAJAG Local DistilBERT v2 (Air-gapped)',
      externalTransmission: false
    }
  },
  {
    id: 'grv-4',
    personnelId: 'PX-1148',
    timestamp: '6 days ago',
    category: 'Workload',
    urgency: 'MEDIUM',
    status: 'Resolved',
    humanReviewRequired: false,
    sourceTextMasked: 'Shift duty roster rotation adjustment [Resolved by Welfare Officer]',
    fullSourceText: 'Excessive consecutive guard shifts without rest day. Resolved via rotation to standby post.',
    localNLPClassification: {
      primaryCategory: 'Workload / Shift Balance',
      urgency: 'MEDIUM',
      confidenceScore: 0.96,
      model: 'SAJAG Local DistilBERT v2 (Air-gapped)',
      externalTransmission: false
    }
  }
];

export const INITIAL_INTERVENTIONS: InterventionRecord[] = [
  {
    id: 'int-101',
    personnelId: 'PX-1148',
    officerId: 'WO-402',
    officerRole: 'Welfare Officer',
    actionType: 'Leave review',
    notes: 'Granted 7 days compassionate leave and adjusted roster to avoid night duties during rehabilitation.',
    followUpDate: '18 Sep 2026',
    timestamp: '6 days ago (09 Sep 2026, 11:30)'
  },
  {
    id: 'int-102',
    personnelId: 'PX-1502',
    officerId: 'MO-108',
    officerRole: 'Medical Officer',
    actionType: 'Rest / recovery adjustment',
    notes: 'Prescribed hydration electrolytes and temporary descent from high-altitude outpost for 48 hours.',
    followUpDate: '16 Sep 2026',
    timestamp: '3 days ago (11 Sep 2026, 15:45)'
  }
];

export const INITIAL_CASE_HISTORY: CaseHistoryEvent[] = [
  {
    id: 'evt-1',
    personnelId: 'PX-1042',
    timestamp: 'Today, 18:42',
    relativeTime: 'Today, 18:42',
    title: 'Risk assessment elevated to HUMAN REVIEW REQUIRED',
    description: 'Unified risk index touched 78/100 due to 6-day persistent elevation across operational load and unresolved welfare signal.',
    type: 'risk_change'
  },
  {
    id: 'evt-2',
    personnelId: 'PX-1042',
    timestamp: 'Today, 16:20',
    relativeTime: 'Today, 16:20',
    title: 'Welfare signal received & classified via Local NLP',
    description: 'High-urgency emergency leave application ingested. No external transmission occurred.',
    type: 'welfare_signal'
  },
  {
    id: 'evt-3',
    personnelId: 'PX-1042',
    timestamp: 'Yesterday, 22:10',
    relativeTime: 'Yesterday, 22:10',
    title: 'Operational fatigue warning: 18 consecutive duty cycles',
    description: 'Roster telemetry exceeded 14-day threshold without 24h rest interval in border sector.',
    type: 'operational_alert'
  },
  {
    id: 'evt-4',
    personnelId: 'PX-1042',
    timestamp: '2 days ago',
    relativeTime: '2 days ago, 08:30',
    title: 'Voluntary check-in trajectory shift detected',
    description: 'Personnel status shifted from "Okay" to "Struggling".',
    type: 'welfare_signal'
  },
  {
    id: 'evt-5',
    personnelId: 'PX-1042',
    timestamp: '5 days ago',
    relativeTime: '5 days ago, 09:00',
    title: 'Previous routine welfare review',
    description: 'Routine quarterly muster check completed by Assistant Commandant Welfare.',
    type: 'officer_review'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-1',
    officerId: 'WO-102',
    officerRole: 'Welfare Officer',
    action: 'Viewed Case Profile',
    caseId: 'PX-1042',
    timestamp: '14 Sep 2026 18:42:10',
    result: 'Authorized',
    details: 'Accessed authorized welfare tri-pillar summary and risk explainability factors.'
  },
  {
    id: 'aud-2',
    officerId: 'WO-102',
    officerRole: 'Welfare Officer',
    action: 'Accessed Grievance Intelligence',
    caseId: 'PX-1042',
    timestamp: '14 Sep 2026 18:44:02',
    result: 'Authorized',
    details: 'Viewed masked grievance classification and local NLP category output.'
  },
  {
    id: 'aud-3',
    officerId: 'CMD-01',
    officerRole: 'Commander',
    action: 'Accessed Unit Aggregates',
    caseId: undefined,
    timestamp: '14 Sep 2026 18:30:15',
    result: 'Authorized',
    details: 'Generated 14th Bn BSF unit readiness distribution (Data minimization enforced).'
  },
  {
    id: 'aud-4',
    officerId: 'MO-205',
    officerRole: 'Medical Officer',
    action: 'Viewed Physiological Baseline',
    caseId: 'PX-1091',
    timestamp: '14 Sep 2026 17:22:40',
    result: 'Authorized',
    details: 'Clinical review of resting HR deviation (+27%) and HRV autonomic suppression.'
  },
  {
    id: 'aud-5',
    officerId: 'WO-102',
    officerRole: 'Welfare Officer',
    action: 'Recorded Human Intervention',
    caseId: 'PX-1148',
    timestamp: '12 Sep 2026 11:30:00',
    result: 'Authorized',
    details: 'Logged duty/recovery schedule adjustment and granted rest period.'
  }
];

export const UNIT_ANALYTICS_DATA: UnitAnalytics = {
  unitId: 'unit-bsf-14',
  unitName: '14th Bn Border Security Force',
  totalMonitored: 248,
  normalCount: 184,
  elevatedCount: 41,
  humanReviewCount: 23,
  watchCount: 32,
  highCount: 15,
  byPosting: {
    border: 112,
    field: 64,
    highAltitude: 48,
    peace: 24
  },
  welfareSignalsSummary: {
    leave: 42,
    workload: 31,
    familySupport: 24,
    housing: 12,
    facilities: 9,
    administrative: 14,
    medical: 6
  },
  heatmapMatrix: [
    { operationalTier: 'High', physiologicalTier: 'Low', count: 18, severityColor: 'orange', personnelIds: ['PX-1042'] },
    { operationalTier: 'High', physiologicalTier: 'Medium', count: 14, severityColor: 'orange', personnelIds: ['PX-1319'] },
    { operationalTier: 'High', physiologicalTier: 'High', count: 9, severityColor: 'red', personnelIds: ['PX-1502'] },
    { operationalTier: 'Medium', physiologicalTier: 'Low', count: 32, severityColor: 'yellow', personnelIds: [] },
    { operationalTier: 'Medium', physiologicalTier: 'Medium', count: 24, severityColor: 'yellow', personnelIds: ['PX-1420'] },
    { operationalTier: 'Medium', physiologicalTier: 'High', count: 8, severityColor: 'orange', personnelIds: ['PX-1091'] },
    { operationalTier: 'Low', physiologicalTier: 'Low', count: 114, severityColor: 'green', personnelIds: ['PX-1148', 'PX-1633'] },
    { operationalTier: 'Low', physiologicalTier: 'Medium', count: 22, severityColor: 'green', personnelIds: [] },
    { operationalTier: 'Low', physiologicalTier: 'High', count: 7, severityColor: 'yellow', personnelIds: [] }
  ]
};
