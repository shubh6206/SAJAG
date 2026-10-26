import os
from datetime import datetime, timezone
from typing import Generator
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

# Environment-driven database configuration (defaults to local SQLite for development)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sajag.db")

# connect_args={"check_same_thread": False} is required for SQLite in FastAPI
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db() -> Generator:
    """FastAPI database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- SQLAlchemy ORM Models ---

class DBUser(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class DBVital(Base):
    __tablename__ = "vitals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1) # Defaulting to 1 for testing
    type = Column(String, index=True)
    value = Column(Float)
    unit = Column(String)
    recorded_at = Column(DateTime, index=True)

class DBBloodPressure(Base):
    __tablename__ = "blood_pressure_readings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    systolic = Column(Float)
    diastolic = Column(Float)
    recorded_at = Column(DateTime, index=True)

class DBSleepSession(Base):
    __tablename__ = "sleep_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    stage = Column(String)
    duration_minutes = Column(Integer)
    start_time = Column(DateTime, index=True)
    end_time = Column(DateTime)

class DBChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1, index=True)
    session_id = Column(String, index=True) # Groups messages into specific conversations
    role = Column(String) # Will be either "user" or "model"
    text = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class DBUserGoal(Base):
    __tablename__ = "user_goals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1, index=True)
    goal_type = Column(String) # e.g., "Water Intake"
    target_value = Column(Float)
    updated_at = Column(DateTime, default=datetime.utcnow)

class DBMedicalHistory(Base):
    __tablename__ = "medical_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1, index=True)
    condition = Column(String)
    recorded_at = Column(DateTime, default=datetime.utcnow)


# =====================================================================
# SAJAG — Persistent ORM Models (SIH26186 Personnel Welfare System)
# =====================================================================

class DBPersonnel(Base):
    """
    Personnel profile record for uniformed personnel (CAPF, Police, etc.).
    Uses synthetic demonstration IDs by default (e.g., 'usr_personnel_001', 'CRPF-98421').
    """
    __tablename__ = "sajag_personnel"

    id = Column(String, primary_key=True, index=True)
    service_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    rank = Column(String, default="Constable")
    unit_battalion = Column(String, nullable=False)
    posting_type = Column(String, default="Field Deployment")
    deployment_zone = Column(String, nullable=True)
    role = Column(String, default="PERSONNEL")  # PERSONNEL, WELFARE_OFFICER, MEDICAL_REVIEWER, AUTHORIZED_ADMIN
    days_in_current_posting = Column(Integer, default=0)
    days_since_last_sanctioned_leave = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    shifts = relationship("DBOperationalShift", back_populates="personnel", cascade="all, delete-orphan")
    checkins = relationship("DBWelfareCheckin", back_populates="personnel", cascade="all, delete-orphan")
    grievances = relationship("DBGrievance", back_populates="personnel", cascade="all, delete-orphan")
    risk_assessments = relationship("DBRiskAssessment", back_populates="personnel", cascade="all, delete-orphan")
    interventions = relationship("DBOfficerIntervention", back_populates="personnel", cascade="all, delete-orphan")


class DBOperationalShift(Base):
    """
    Operational shift and duty logs used by OperationalFatigueEngine.
    Tracks duty density, night shifts, and consecutive duty days.
    """
    __tablename__ = "sajag_operational_shifts"

    id = Column(String, primary_key=True, index=True)
    personnel_id = Column(String, ForeignKey("sajag_personnel.id"), nullable=False, index=True)
    shift_date = Column(String, nullable=False, index=True)  # Format: "YYYY-MM-DD"
    shift_type = Column(String, nullable=False)              # "Day Shift", "Night Shift", "Extended 16h Duty", etc.
    duty_hours = Column(Float, nullable=False)
    consecutive_duty_days = Column(Integer, default=1)
    days_since_last_leave = Column(Integer, default=0)
    recovery_hours_granted = Column(Float, default=0.0)
    posting_type = Column(String, default="Field Deployment")
    notes = Column(String, nullable=True)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    personnel = relationship("DBPersonnel", back_populates="shifts")


class DBWelfareCheckin(Base):
    """
    Voluntary personnel daily check-in touchpoints.
    Captures subjective welfare state without psychiatric diagnostic labeling.
    """
    __tablename__ = "sajag_welfare_checkins"

    id = Column(String, primary_key=True, index=True)
    personnel_id = Column(String, ForeignKey("sajag_personnel.id"), nullable=False, index=True)
    checkin_date = Column(String, nullable=False, index=True)  # Format: "YYYY-MM-DD"
    status_rating = Column(String, nullable=False)             # "Good", "Okay", "Struggling", "Need Support"
    voluntary_notes = Column(Text, nullable=True)              # Optional voluntary brief notes
    share_with_welfare_officer = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    personnel = relationship("DBPersonnel", back_populates="checkins")


class DBGrievance(Base):
    """
    Confidential welfare grievances and administrative concerns.
    Implements data minimization: raw text is preserved under strict access,
    and a redacted operational summary is exposed for welfare officer triage.
    """
    __tablename__ = "sajag_grievances"

    id = Column(String, primary_key=True, index=True)
    personnel_id = Column(String, ForeignKey("sajag_personnel.id"), nullable=False, index=True)
    category = Column(String, nullable=False)                  # Housing, Leave, Workload, Family Support, etc.
    urgency = Column(String, default="Medium")                 # Low, Medium, High, Urgent / Priority
    contact_preference = Column(String, default="Confidential Welfare Officer Outreach")
    
    # Confidential personnel grievance input
    raw_text = Column(Text, nullable=False)
    # Data-minimized operational extraction (populated by local NLP)
    redacted_summary = Column(String, nullable=True)
    detected_category = Column(String, nullable=True)
    distress_indicator = Column(String, nullable=True)        # "Normal", "Mild Concern", "High Distress Language"
    nlp_confidence = Column(Float, nullable=True)
    requires_human_review = Column(Boolean, default=True)

    status = Column(String, default="PENDING_HUMAN_REVIEW")   # PENDING_HUMAN_REVIEW, UNDER_REVIEW, RESOLVED
    assigned_officer_id = Column(String, nullable=True)
    officer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    personnel = relationship("DBPersonnel", back_populates="grievances")


class DBRiskAssessment(Base):
    """
    Synthesized multi-pillar assessment history.
    Stores aggregated scores, persistence tracking, and human-interpretable rationale.
    Data minimization: does NOT persist raw continuous high-frequency sensor streams.
    """
    __tablename__ = "sajag_risk_assessments"

    id = Column(String, primary_key=True, index=True)
    personnel_id = Column(String, ForeignKey("sajag_personnel.id"), nullable=False, index=True)
    service_id = Column(String, index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Tri-Pillar Component Scores & Tiers
    physiological_score = Column(Float, nullable=False)
    physiological_tier = Column(String, nullable=False)
    recovery_index = Column(Float, nullable=False)

    operational_score = Column(Float, nullable=False)
    operational_tier = Column(String, nullable=False)

    welfare_score = Column(Float, nullable=False)
    welfare_tier = Column(String, nullable=False)

    # Synthesized Decision-Support State
    overall_state = Column(String, nullable=False)            # "Stable", "Normal Variation", "Elevated", "Persistent Elevated"
    composite_risk_score = Column(Float, nullable=False)
    confidence = Column(Float, default=1.0)
    temporal_trend = Column(String, default="Stable")         # "Improving", "Stable", "Deteriorating", "Acute Spike"
    persistence_days = Column(Integer, default=0)
    requires_human_review = Column(Boolean, default=False)

    # Explanation Layer & Actions (Non-diagnostic)
    primary_contributor = Column(String, nullable=True)
    recommended_action = Column(String, nullable=True)
    detailed_explanation = Column(Text, nullable=True)

    personnel = relationship("DBPersonnel", back_populates="risk_assessments")


class DBOfficerIntervention(Base):
    """
    Welfare Officer action and intervention logs.
    Ensures accountability and closing the feedback loop for flagged cases.
    """
    __tablename__ = "sajag_officer_interventions"

    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, index=True, nullable=False)
    personnel_id = Column(String, ForeignKey("sajag_personnel.id"), nullable=False, index=True)
    officer_id = Column(String, index=True, nullable=False)
    officer_name = Column(String, nullable=False)
    intervention_type = Column(String, nullable=False)        # "Welfare Touchpoint", "Sanctioned Rest", "Leave Facilitation", "Peer Support", "Medical Consult"
    notes = Column(Text, nullable=False)
    action_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    next_followup_date = Column(String, nullable=True)         # "YYYY-MM-DD"

    personnel = relationship("DBPersonnel", back_populates="interventions")


class DBAuditLog(Base):
    """
    Cryptographically verifiable audit log for officer case access and sensitive actions.
    Maintains accountability and prevents unauthorized welfare record snooping.
    """
    __tablename__ = "sajag_audit_logs"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    actor_id = Column(String, index=True, nullable=False)     # Officer or Service ID
    actor_role = Column(String, nullable=False)               # "WELFARE_OFFICER", "AUTHORIZED_ADMIN"
    action = Column(String, nullable=False)                   # "VIEW_CASE", "LOG_INTERVENTION", "PURGE_REQUEST"
    target_id = Column(String, nullable=True)                 # Affected Personnel or Case ID
    details = Column(String, nullable=True)
    tamper_hash = Column(String, nullable=True)               # SHA-256 integrity hash of entry
