from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    PERSONNEL = "PERSONNEL"
    WELFARE_OFFICER = "WELFARE_OFFICER"
    COMMANDING_OFFICER = "COMMANDING_OFFICER"
    MEDICAL_REVIEWER = "MEDICAL_REVIEWER"
    AUTHORIZED_ADMIN = "AUTHORIZED_ADMIN"

class PostingType(str, Enum):
    PEACE = "Peace Station"
    FIELD = "Field Deployment"
    BORDER = "Border Outpost"
    HIGH_ALTITUDE = "High Altitude Area"
    URBAN_TRANSIT = "Urban Transit / Law & Order"

class ShiftType(str, Enum):
    DAY = "Day Shift"
    NIGHT = "Night Shift"
    EXTENDED = "Extended 16h Duty"
    PATROL = "Continuous Patrol"
    REST = "Rest / Off-Duty"

class WelfareStatusRating(str, Enum):
    GOOD = "Good"
    OKAY = "Okay"
    STRUGGLING = "Struggling"
    NEED_SUPPORT = "Need Support"

class RiskTier(str, Enum):
    STABLE = "Stable"
    NORMAL_VARIATION = "Normal Variation"
    ELEVATED = "Elevated"
    PERSISTENT_ELEVATED = "Persistent Elevated"
    REQUIRES_HUMAN_REVIEW = "Requires Human Review"

class TrendDirection(str, Enum):
    IMPROVING = "Improving"
    STABLE = "Stable"
    DETERIORATING = "Deteriorating"
    ACUTE_SPIKE = "Acute Spike"

class GrievanceCategory(str, Enum):
    HOUSING = "Housing & Accommodation"
    LEAVE = "Leave & Recovery Access"
    WORKLOAD = "Duty Hours & Workload"
    FAMILY_SUPPORT = "Family & Dependent Support"
    ADMINISTRATIVE = "Administrative / Pay / Allowances"
    FACILITIES = "Outpost Facilities & Rations"
    MEDICAL = "Medical & Health Care Access"
    OTHER = "General Welfare Concern"

class GrievanceUrgency(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    URGENT = "Urgent / Priority"

# --- Models ---

class PersonnelProfile(BaseModel):
    id: str
    service_id: str
    name: str
    rank: str = "Constable"
    unit_battalion: str = "42nd Bn CRPF / Sector 4"
    posting_type: PostingType = PostingType.FIELD
    deployment_zone: str = "Forward Sector Alpha"
    role: UserRole = UserRole.PERSONNEL
    days_in_current_posting: int = 45
    days_since_last_sanctioned_leave: int = 78
    created_at: datetime = Field(default_factory=datetime.utcnow)

class OperationalShiftRecord(BaseModel):
    id: str
    personnel_id: str
    shift_date: str
    shift_type: ShiftType
    duty_hours: float
    consecutive_duty_days: int
    days_since_last_leave: int
    recovery_hours_granted: float
    posting_type: PostingType = PostingType.FIELD
    notes: Optional[str] = None
    recorded_at: datetime = Field(default_factory=datetime.utcnow)

class OperationalContextPayload(BaseModel):
    personnel_id: str = "usr_personnel_001"
    daily_shifts: List[OperationalShiftRecord] = []
    consecutive_duty_days: int = 6
    days_since_last_leave: int = 78
    average_daily_duty_hours_7d: float = 12.5
    night_shifts_last_7d: int = 4
    posting_type: PostingType = PostingType.FIELD
    denied_leave_count_last_6m: int = 1

class WelfareCheckinPayload(BaseModel):
    personnel_id: str = "usr_personnel_001"
    status_rating: WelfareStatusRating = WelfareStatusRating.OKAY
    voluntary_notes: Optional[str] = None
    share_with_welfare_officer: bool = True

class WelfareCheckinRecord(BaseModel):
    id: str
    personnel_id: str
    checkin_date: str
    status_rating: WelfareStatusRating
    voluntary_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GrievancePayload(BaseModel):
    personnel_id: str = "usr_personnel_001"
    category: GrievanceCategory = GrievanceCategory.LEAVE
    description: str
    urgency: GrievanceUrgency = GrievanceUrgency.MEDIUM
    contact_preference: str = "Confidential Welfare Officer Outreach"

class WelfareNLPResult(BaseModel):
    detected_category: GrievanceCategory
    urgency: GrievanceUrgency
    distress_indicator: str  # "Normal", "Mild Concern", "High Distress Language"
    keywords: List[str]
    summary: str
    requires_human_review: bool
    confidence: float

class GrievanceRecord(BaseModel):
    id: str
    personnel_id: str
    category: GrievanceCategory
    raw_text: str
    urgency: GrievanceUrgency
    nlp_result: Optional[WelfareNLPResult] = None
    status: str = "PENDING_HUMAN_REVIEW"  # PENDING_HUMAN_REVIEW, UNDER_REVIEW, RESOLVED
    assigned_officer_id: Optional[str] = None
    officer_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- Engine Outputs ---

class MetricDeviation(BaseModel):
    metric_name: str
    observed_value: float
    baseline_value: float
    standard_deviation: float
    z_score: float
    deviation_direction: str  # "Elevated", "Suppressed", "Within Baseline"
    unit: str

class PhysiologicalStressOutput(BaseModel):
    stress_score: float = Field(..., ge=0.0, le=100.0)  # 0 (calm/optimal) to 100 (acute strain)
    risk_level: RiskTier
    recovery_index: float = Field(..., ge=0.0, le=100.0)  # 0 to 100
    confidence: float = Field(..., ge=0.0, le=1.0)
    signal_quality: str  # "High", "Moderate", "Sparse / Missing"
    deviations: List[MetricDeviation] = []
    contributors: List[str] = []
    explanation: str

class OperationalFatigueOutput(BaseModel):
    fatigue_score: float = Field(..., ge=0.0, le=100.0)
    risk_level: RiskTier
    shift_load_index: float = Field(..., ge=0.0, le=100.0)
    leave_deficit_index: float = Field(..., ge=0.0, le=100.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    contributors: List[str] = []
    explanation: str

class WelfareRiskOutput(BaseModel):
    welfare_risk_score: float = Field(..., ge=0.0, le=100.0)
    risk_level: RiskTier
    recent_checkin_status: Optional[WelfareStatusRating] = None
    active_grievance_count: int = 0
    confidence: float = Field(..., ge=0.0, le=1.0)
    contributors: List[str] = []
    explanation: str

class SAJAGRiskAssessment(BaseModel):
    assessment_id: str
    personnel_id: str
    service_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Tri-Pillar Components
    physiological: PhysiologicalStressOutput
    operational: OperationalFatigueOutput
    welfare: WelfareRiskOutput
    
    # Synthesized State
    overall_state: RiskTier
    composite_risk_score: float = Field(..., ge=0.0, le=100.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    temporal_trend: TrendDirection
    persistence_days: int = 0
    requires_human_review: bool
    recommended_action: str
    detailed_explanation: str
    prototype_disclaimer: str = (
        "SAJAG is an operational wellbeing and decision-support prototype. "
        "It provides early indicators and does not constitute a clinical psychiatric diagnosis."
    )

class OfficerCaseItem(BaseModel):
    case_id: str
    personnel_id: str
    service_id: str
    name: str
    rank: str
    unit_battalion: str
    posting_type: str
    overall_state: RiskTier
    physiological_tier: RiskTier
    operational_tier: RiskTier
    welfare_tier: RiskTier
    persistence_days: int
    temporal_trend: TrendDirection
    confidence: float
    primary_contributor: str
    recommended_action: str
    requires_human_review: bool
    status: str  # "NEW_SIGNAL", "TOUCHPOINT_SCHEDULED", "RESOLVED"
    last_assessment_time: datetime

class OfficerInterventionLog(BaseModel):
    intervention_id: str
    case_id: str
    personnel_id: str
    officer_id: str
    officer_name: str
    intervention_type: str  # "Welfare Touchpoint", "Sanctioned Rest", "Leave Facilitation", "Peer Support", "Medical Consult"
    notes: str
    action_date: datetime = Field(default_factory=datetime.utcnow)
    next_followup_date: Optional[str] = None

class UnitReadinessSummary(BaseModel):
    unit_battalion: str
    total_personnel_monitored: int
    stable_count: int
    normal_variation_count: int
    elevated_count: int
    persistent_elevated_count: int
    operational_load_average_hours: float
    average_recovery_index: float
    high_urgency_welfare_cases_count: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
