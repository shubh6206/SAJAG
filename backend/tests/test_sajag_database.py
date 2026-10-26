import pytest
import hashlib
from datetime import datetime, timezone
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

from database import (
    Base,
    DBUser,
    DBVital,
    DBPersonnel,
    DBOperationalShift,
    DBWelfareCheckin,
    DBGrievance,
    DBRiskAssessment,
    DBOfficerIntervention,
    DBAuditLog,
)


@pytest.fixture
def test_db():
    """
    Isolated in-memory SQLite database session fixture.
    Guarantees that test data is never persisted to the real application database.
    """
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False}
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    # Initialize all schemas in memory
    Base.metadata.create_all(bind=test_engine)

    session = TestingSessionLocal()
    try:
        yield session, test_engine
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)
        test_engine.dispose()


def test_schema_creation_and_table_inventory(test_db):
    """
    Verifies that all legacy NirogX tables and new SAJAG tables
    are properly registered and initialized in the database schema.
    """
    _, test_engine = test_db
    inspector = inspect(test_engine)
    table_names = set(inspector.get_table_names())

    # NirogX legacy tables preserved
    expected_legacy = {
        "users",
        "vitals",
        "blood_pressure_readings",
        "sleep_sessions",
        "chat_messages",
        "user_goals",
        "medical_history",
    }
    for t in expected_legacy:
        assert t in table_names, f"Legacy table '{t}' must be preserved."

    # SAJAG persistent tables
    expected_sajag = {
        "sajag_personnel",
        "sajag_operational_shifts",
        "sajag_welfare_checkins",
        "sajag_grievances",
        "sajag_risk_assessments",
        "sajag_officer_interventions",
        "sajag_audit_logs",
    }
    for t in expected_sajag:
        assert t in table_names, f"SAJAG table '{t}' must be created."


def test_personnel_crud(test_db):
    """
    Verifies CRUD operations on DBPersonnel with synthetic identifiers.
    """
    session, _ = test_db

    personnel = DBPersonnel(
        id="usr_demo_001",
        service_id="CRPF-SYN-001",
        name="Constable Demo Test",
        rank="Constable (GD)",
        unit_battalion="42nd Bn CRPF",
        posting_type="Field Deployment",
        deployment_zone="Forward Sector A",
        role="PERSONNEL",
        days_in_current_posting=30,
        days_since_last_sanctioned_leave=45,
    )
    session.add(personnel)
    session.commit()

    queried = session.query(DBPersonnel).filter_by(service_id="CRPF-SYN-001").first()
    assert queried is not None
    assert queried.id == "usr_demo_001"
    assert queried.name == "Constable Demo Test"
    assert queried.days_since_last_sanctioned_leave == 45
    assert queried.is_active is True

    # Update
    queried.days_since_last_sanctioned_leave = 46
    session.commit()
    updated = session.query(DBPersonnel).filter_by(id="usr_demo_001").first()
    assert updated.days_since_last_sanctioned_leave == 46


def test_operational_shift_relationship(test_db):
    """
    Verifies that operational shift records are persisted and linked
    to the correct personnel profile.
    """
    session, _ = test_db

    personnel = DBPersonnel(
        id="usr_demo_002",
        service_id="BSF-SYN-002",
        name="Head Constable Demo",
        unit_battalion="118th Bn BSF",
    )
    session.add(personnel)
    session.commit()

    shift1 = DBOperationalShift(
        id="shift_001",
        personnel_id="usr_demo_002",
        shift_date="2026-10-25",
        shift_type="Night Shift",
        duty_hours=12.0,
        consecutive_duty_days=5,
        days_since_last_leave=60,
        recovery_hours_granted=6.0,
        posting_type="Border Outpost",
    )
    shift2 = DBOperationalShift(
        id="shift_002",
        personnel_id="usr_demo_002",
        shift_date="2026-10-26",
        shift_type="Day Shift",
        duty_hours=8.0,
        consecutive_duty_days=6,
        days_since_last_leave=61,
        recovery_hours_granted=10.0,
        posting_type="Border Outpost",
    )
    session.add_all([shift1, shift2])
    session.commit()

    queried = session.query(DBPersonnel).filter_by(id="usr_demo_002").first()
    assert len(queried.shifts) == 2
    total_hours = sum(s.duty_hours for s in queried.shifts)
    assert total_hours == 20.0


def test_welfare_checkin_and_grievance_data_minimization(test_db):
    """
    Verifies daily check-in and grievance storage, verifying
    non-diagnostic ratings and data minimization fields.
    """
    session, _ = test_db

    personnel = DBPersonnel(
        id="usr_demo_003",
        service_id="CISF-SYN-003",
        name="Sub-Inspector Demo",
        unit_battalion="CISF Unit Metro",
    )
    session.add(personnel)
    session.commit()

    # Daily Check-in
    checkin = DBWelfareCheckin(
        id="chk_001",
        personnel_id="usr_demo_003",
        checkin_date="2026-10-26",
        status_rating="Struggling",
        voluntary_notes="Consecutive extended shifts, feeling fatigue.",
        share_with_welfare_officer=True,
    )
    session.add(checkin)

    # Grievance with data minimization fields
    grievance = DBGrievance(
        id="grv_001",
        personnel_id="usr_demo_003",
        category="Leave & Recovery Access",
        urgency="High",
        raw_text="Applied for emergency family support leave 3 weeks ago, no approval received.",
        redacted_summary="Family support leave request delay of 3+ weeks.",
        detected_category="Leave & Recovery Access",
        distress_indicator="Mild Concern",
        nlp_confidence=0.88,
        requires_human_review=True,
        status="PENDING_HUMAN_REVIEW",
    )
    session.add(grievance)
    session.commit()

    queried = session.query(DBPersonnel).filter_by(id="usr_demo_003").first()
    assert len(queried.checkins) == 1
    assert queried.checkins[0].status_rating == "Struggling"
    assert len(queried.grievances) == 1
    assert queried.grievances[0].urgency == "High"
    assert queried.grievances[0].requires_human_review is True


def test_risk_assessment_persistence(test_db):
    """
    Verifies that multi-pillar risk assessment records are persisted
    without storing raw continuous sensor telemetry.
    """
    session, _ = test_db

    personnel = DBPersonnel(
        id="usr_demo_004",
        service_id="CRPF-SYN-004",
        name="Constable Alex Demo",
        unit_battalion="42nd Bn CRPF",
    )
    session.add(personnel)
    session.commit()

    assessment = DBRiskAssessment(
        id="assess_001",
        personnel_id="usr_demo_004",
        service_id="CRPF-SYN-004",
        physiological_score=72.5,
        physiological_tier="Elevated",
        recovery_index=35.0,
        operational_score=68.0,
        operational_tier="Elevated",
        welfare_score=40.0,
        welfare_tier="Normal Variation",
        overall_state="Elevated",
        composite_risk_score=63.2,
        confidence=0.91,
        temporal_trend="Deteriorating",
        persistence_days=3,
        requires_human_review=True,
        primary_contributor="Elevated RHR (+2.4σ) and 78 consecutive days without leave.",
        recommended_action="Initiate welfare officer touchpoint and duty rest.",
        detailed_explanation="Personnel demonstrates continuous physiological strain across 3 recording days.",
    )
    session.add(assessment)
    session.commit()

    queried_assessment = session.query(DBRiskAssessment).filter_by(id="assess_001").first()
    assert queried_assessment is not None
    assert queried_assessment.composite_risk_score == 63.2
    assert queried_assessment.overall_state == "Elevated"
    assert queried_assessment.requires_human_review is True


def test_officer_intervention_and_audit_log(test_db):
    """
    Verifies officer intervention recording and tamper-evident audit logging.
    """
    session, _ = test_db

    personnel = DBPersonnel(
        id="usr_demo_005",
        service_id="ITBP-SYN-005",
        name="Constable ITBP Demo",
        unit_battalion="3rd Bn ITBP",
    )
    session.add(personnel)
    session.commit()

    intervention = DBOfficerIntervention(
        id="intv_001",
        case_id="case_101",
        personnel_id="usr_demo_005",
        officer_id="off_welfare_01",
        officer_name="Welfare Officer Sharma",
        intervention_type="Sanctioned Rest",
        notes="Approved 48h operational stand-down and scheduled welfare touchpoint.",
        next_followup_date="2026-10-30",
    )
    session.add(intervention)

    # Generate SHA-256 tamper hash for audit log
    audit_data = "VIEW_CASE:case_101:off_welfare_01:2026-10-26"
    tamper_hash = hashlib.sha256(audit_data.encode("utf-8")).hexdigest()

    audit_entry = DBAuditLog(
        id="audit_001",
        actor_id="off_welfare_01",
        actor_role="WELFARE_OFFICER",
        action="VIEW_CASE",
        target_id="case_101",
        details="Authorized case review in response to Elevated persistence alert.",
        tamper_hash=tamper_hash,
    )
    session.add(audit_entry)
    session.commit()

    queried_intv = session.query(DBOfficerIntervention).filter_by(id="intv_001").first()
    assert queried_intv is not None
    assert queried_intv.intervention_type == "Sanctioned Rest"

    queried_audit = session.query(DBAuditLog).filter_by(id="audit_001").first()
    assert queried_audit is not None
    assert len(queried_audit.tamper_hash) == 64


def test_cascade_delete_integrity(test_db):
    """
    Verifies that deleting a personnel profile cascades to clean up
    associated shift logs, check-ins, and grievances without leaving orphans.
    """
    session, _ = test_db

    personnel = DBPersonnel(
        id="usr_demo_purge",
        service_id="TEST-PURGE-01",
        name="Purge Candidate",
        unit_battalion="Test Bn",
    )
    session.add(personnel)
    session.commit()

    shift = DBOperationalShift(
        id="shift_purge_1",
        personnel_id="usr_demo_purge",
        shift_date="2026-10-26",
        shift_type="Day Shift",
        duty_hours=8.0,
    )
    checkin = DBWelfareCheckin(
        id="chk_purge_1",
        personnel_id="usr_demo_purge",
        checkin_date="2026-10-26",
        status_rating="Good",
    )
    session.add_all([shift, checkin])
    session.commit()

    # Confirm created
    assert session.query(DBOperationalShift).filter_by(personnel_id="usr_demo_purge").count() == 1
    assert session.query(DBWelfareCheckin).filter_by(personnel_id="usr_demo_purge").count() == 1

    # Delete personnel
    session.delete(personnel)
    session.commit()

    # Confirm cascaded cleanup
    assert session.query(DBOperationalShift).filter_by(personnel_id="usr_demo_purge").count() == 0
    assert session.query(DBWelfareCheckin).filter_by(personnel_id="usr_demo_purge").count() == 0


def test_get_db_session_lifecycle():
    """
    Verifies that get_db() dependency opens a session, yields it for route usage,
    and reliably closes it in the finally block.
    """
    from database import get_db
    from sqlalchemy.orm import Session

    db_gen = get_db()
    session = next(db_gen)
    try:
        assert isinstance(session, Session)
        assert session.is_active
    finally:
        # Simulate route completion by closing generator
        try:
            next(db_gen)
        except StopIteration:
            pass  # Expected when generator completes


def test_app_startup_table_creation_isolated(tmp_path):
    """
    Step 1.3: Verifies that application startup initializes all tables cleanly
    on an isolated database without seeding demo data into application startup.
    """
    import os
    from main import app, init_database
    from database import Base
    import database

    # Set up an isolated temporary database file
    test_db_file = tmp_path / "startup_isolated_test.db"
    test_db_url = f"sqlite:///{test_db_file}"

    isolated_engine = create_engine(test_db_url, connect_args={"check_same_thread": False})
    original_engine = database.engine

    try:
        # Redirect database engine for isolated startup test
        database.engine = isolated_engine

        # Execute application startup table creation handler
        init_database()

        # Verify all tables exist in the newly created isolated database
        inspector = inspect(isolated_engine)
        created_tables = set(inspector.get_table_names())

        assert "sajag_personnel" in created_tables
        assert "sajag_operational_shifts" in created_tables
        assert "sajag_welfare_checkins" in created_tables
        assert "sajag_grievances" in created_tables
        assert "sajag_risk_assessments" in created_tables
        assert "sajag_officer_interventions" in created_tables
        assert "sajag_audit_logs" in created_tables
        assert "users" in created_tables
        assert "vitals" in created_tables

        # Verify no demo data is seeded upon startup (tables must be pristine and empty)
        with isolated_engine.connect() as conn:
            from sqlalchemy import text
            personnel_count = conn.execute(text("SELECT COUNT(*) FROM sajag_personnel")).scalar()
            shifts_count = conn.execute(text("SELECT COUNT(*) FROM sajag_operational_shifts")).scalar()
            checkins_count = conn.execute(text("SELECT COUNT(*) FROM sajag_welfare_checkins")).scalar()
            assert personnel_count == 0, "Application startup must not seed demo personnel automatically."
            assert shifts_count == 0, "Application startup must not seed shifts automatically."
            assert checkins_count == 0, "Application startup must not seed check-ins automatically."
    finally:
        database.engine = original_engine
        isolated_engine.dispose()
