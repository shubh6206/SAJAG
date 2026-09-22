export type RiskLevel = 'Stable' | 'Watch' | 'Elevated' | 'High' | 'Human Review';

export type PostingType = 'Border' | 'Field' | 'High Altitude' | 'Peace' | 'Training' | 'Emergency Deployment';

export type DutyStatus = 'Active' | 'On Leave' | 'Standby' | 'Rest Recovery';

export type UserRole = 'Welfare Officer' | 'Medical Officer' | 'Commander' | 'Personnel';

export type DemoScenarioId = 'A' | 'B' | 'C' | 'D';

export type BiometricTelemetryStatus = 'BIOMETRIC AVAILABLE' | 'BIOMETRIC UNAVAILABLE' | 'PARTIAL TELEMETRY';

export interface PhysiologicalPillar {
  score: number; // 0-100
  state: RiskLevel;
  telemetryStatus?: BiometricTelemetryStatus;
  telemetryNote?: string; // e.g. "Insufficient physiological data"
  baselinePeriodDays?: number; // e.g. 14 days
  restingHrBpm: number;
  baselineHrBpm: number;
  hrDeviationPct: number;
  hrvMs: number;
  baselineHrvMs: number;
  hrvDeviationPct: number;
  sleepDurationHrs: number;
  baselineSleepDurationHrs: number;
  sleepDeviationPct: number;
  sleepDebtHrs: number;
  recoveryIndex: number; // 0-100
  sleepConsistencyPct: number;
  activityExertionLoad: 'Low' | 'Moderate' | 'High' | 'Severe';
  confidence: 'HIGH' | 'MODERATE' | 'LOW';
  confidenceReason?: string;
  contributors: string[];
  trend7d: number[]; // e.g. 7 points
}

export interface OperationalPillar {
  score: number; // 0-100
  state: RiskLevel;
  shiftDensityPct: number;
  consecutiveDutyDays: number;
  nightShiftsLast7d: number;
  dailyDutyHours?: number;
  weeklyDutyHours?: number;
  patrolFrequencyPerWeek?: number;
  emergencyCalloutsLast30d?: number;
  doubleSentryAssignments?: number;
  restPeriodDeficitHours?: number;
  deploymentDays: number;
  lastSanctionedLeaveDaysAgo: number;
  loadCategory: 'Low' | 'Moderate' | 'High' | 'Severe';
  contributors: string[];
  dutyTimeline38d: { day: number; shiftHours: number; isNight: boolean; isRecovery: boolean }[];
}

export interface WelfareCategoryBreakdown {
  leave: number;
  workload: number;
  familySupport: number;
  housing: number;
  facilities: number;
  administrative: number;
  medical: number;
}

export interface WelfarePillar {
  score: number; // 0-100
  state: RiskLevel;
  unresolvedSignalsCount: number;
  supportRequested: boolean;
  recentCheckInChangeDetected: boolean;
  categoryBreakdown: WelfareCategoryBreakdown;
  checkInSummary: {
    good: number;
    okay: number;
    struggling: number;
    needSupport: number;
  };
  contributors: string[];
}

export type TrajectoryState = 'Persistent elevation' | 'Improving' | 'Acute spike' | 'Data sparse';

export interface UnifiedAssessment {
  score: number; // 0-100
  state: RiskLevel;
  persistenceDays: number;
  confidence: 'HIGH' | 'MODERATE' | 'LOW';
  confidenceFactors: {
    hrAvailable: boolean;
    sleepAvailable: boolean;
    dutyRecordsAvailable: boolean;
    welfareCheckInAvailable: boolean;
    notes?: string;
  };
  trajectoryState: TrajectoryState;
  trajectoryHistory: {
    dayLabel: string;
    overall: number;
    physiological: number;
    operational: number;
    welfare: number;
  }[];
  waterfallContributions: {
    physiological: number;
    operational: number;
    welfare: number;
    details: {
      physiologicalReasons: string[];
      operationalReasons: string[];
      welfareReasons: string[];
    };
  };
  whyFlagged: string[];
  recommendedActions: string[];
}

export interface Personnel {
  id: string; // e.g. "PX-1042"
  maskedName: string; // "Sepoy R. Kumar" or masked
  rank: string; // "Constable", "Head Constable", "Sub-Inspector"
  unit: string; // "14th Bn BSF"
  posting: PostingType;
  dutyStatus: DutyStatus;
  deploymentDays: number;
  lastSanctionedLeaveDaysAgo: number;
  // HR & Service Data (SIH Section 3 & 5)
  transferCount?: number;
  trainingDaysThisYear?: number;
  serviceDurationYears?: number;
  leaveEntitlementDays?: number;
  leaveTakenDays?: number;
  leaveSanctionedDays?: number;
  leaveDeniedDays?: number;
  emergencyLeaveRequested?: boolean;
  recoveryOpportunityScore?: number; // 0-100
  lastAssessmentTime: string;
  physiological: PhysiologicalPillar;
  operational: OperationalPillar;
  welfare: WelfarePillar;
  unified: UnifiedAssessment;
  lastReviewDate?: string;
  reviewStatus: 'Pending Review' | 'In Progress' | 'Reviewed' | 'Scheduled Follow-up';
}

export interface VoluntaryCheckIn {
  id: string;
  personnelId: string;
  timestamp: string;
  mood: 'Good' | 'Okay' | 'Struggling' | 'Need Support' | 'Prefer Not to Answer';
  sleepQuality?: 'Good' | 'Fair' | 'Poor';
  fatigueLevel?: 'Low' | 'Moderate' | 'High';
  workStress?: 'Low' | 'Moderate' | 'High';
  familyConcern?: boolean;
  supportRequest?: boolean;
  generalWellbeingScore?: number; // 1-5
  notePreview?: string;
  isFlaggedChange: boolean;
  provenanceTag?: string; // 'WELLNESS DATA (VOLUNTARY)'
}

export interface WelfareGrievance {
  id: string;
  personnelId: string;
  timestamp: string;
  category: 'Leave' | 'Housing' | 'Workload' | 'Family Support' | 'Administration' | 'Facilities' | 'Medical';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'Open' | 'In Review' | 'Resolved';
  humanReviewRequired: boolean;
  sourceTextMasked: string;
  fullSourceText?: string;
  localNLPClassification: {
    primaryCategory: string;
    urgency: string;
    confidenceScore: number;
    model: string;
    externalTransmission: false;
  };
}

export interface InterventionRecord {
  id: string;
  personnelId: string;
  officerId: string;
  officerRole: string;
  actionType:
    | 'Welfare conversation'
    | 'Rest / recovery adjustment'
    | 'Leave review'
    | 'Medical referral'
    | 'Family support'
    | 'Administrative escalation'
    | 'Follow-up scheduled';
  notes: string;
  followUpDate: string;
  timestamp: string;
}

export interface CaseHistoryEvent {
  id: string;
  personnelId: string;
  timestamp: string;
  relativeTime: string;
  title: string;
  description: string;
  type: 'risk_change' | 'welfare_signal' | 'operational_alert' | 'officer_review' | 'intervention';
}

export interface AuditLogEntry {
  id: string;
  officerId: string;
  officerRole: string;
  action: string;
  caseId?: string;
  timestamp: string;
  result: 'Authorized' | 'Restricted';
  details: string;
}

export interface UnitAnalytics {
  unitId: string;
  unitName: string;
  totalMonitored: number;
  normalCount: number;
  elevatedCount: number;
  humanReviewCount: number;
  watchCount: number;
  highCount: number;
  byPosting: {
    border: number;
    field: number;
    highAltitude: number;
    peace: number;
  };
  welfareSignalsSummary: WelfareCategoryBreakdown;
  heatmapMatrix: {
    operationalTier: 'Low' | 'Medium' | 'High';
    physiologicalTier: 'Low' | 'Medium' | 'High';
    count: number;
    severityColor: 'green' | 'yellow' | 'orange' | 'red';
    personnelIds: string[];
  }[];
}
