import pytest
from fastapi.testclient import TestClient

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from sajag_models import (
    RiskTier, TrendDirection, WelfareStatusRating, GrievanceCategory, GrievanceUrgency, PostingType, UserRole
)
from services.physiological_stress_engine import PhysiologicalStressEngine
from services.operational_fatigue_engine import OperationalFatigueEngine
from services.welfare_risk_engine import WelfareRiskEngine
from services.welfare_nlp_service import WelfareNLPService
from services.sajag_risk_engine import SAJAGRiskEngine
from services.demo_scenarios import SAJAGDemoScenarios
from services.dataset_adapters import DatasetAdapter

client = TestClient(app)

# --- 1. Physiological Stress Engine Unit Tests ---

def test_physiological_stress_optimal():
    out = PhysiologicalStressEngine.evaluate(
        resting_hr=64.0,
        sleep_hours=7.8,
        hrv_rmssd=45.0,
        spo2=98.5,
        hr_baseline=65.0,
        days_of_baseline_data=14
    )
    assert out.stress_score < 40.0
    assert out.risk_level == RiskTier.STABLE
    assert out.recovery_index > 75.0
    assert out.signal_quality == "High"
    assert out.confidence >= 0.8

def test_physiological_stress_elevated():
    out = PhysiologicalStressEngine.evaluate(
        resting_hr=88.0,
        sleep_hours=4.0,
        hrv_rmssd=16.0,
        hr_baseline=64.0,
        hr_baseline_std=4.0
    )
    assert out.stress_score >= 70.0
    assert out.risk_level == RiskTier.ELEVATED
    assert out.recovery_index < 40.0
    assert len(out.contributors) >= 2
    assert any("Resting HR" in c for c in out.contributors)

def test_physiological_stress_missing_data():
    out = PhysiologicalStressEngine.evaluate(
        resting_hr=None,
        sleep_hours=None,
        hrv_rmssd=None,
        spo2=None
    )
    assert out.signal_quality == "Sparse / Missing"
    assert out.confidence <= 0.2
    assert "No active wearable" in out.explanation

# --- 2. Operational Fatigue Engine Unit Tests ---

def test_operational_fatigue_nominal():
    out = OperationalFatigueEngine.evaluate(
        consecutive_duty_days=3,
        days_since_last_leave=20,
        average_daily_duty_hours_7d=8.0,
        posting_type=PostingType.PEACE
    )
    assert out.fatigue_score < 40.0
    assert out.risk_level == RiskTier.STABLE

def test_operational_fatigue_elevated():
    out = OperationalFatigueEngine.evaluate(
        consecutive_duty_days=12,
        days_since_last_leave=85,
        average_daily_duty_hours_7d=14.0,
        night_shifts_last_7d=4,
        posting_type=PostingType.BORDER,
        denied_leave_count_last_6m=1
    )
    assert out.fatigue_score >= 75.0
    assert out.risk_level == RiskTier.ELEVATED
    assert len(out.contributors) >= 3

# --- 3. Welfare NLP Service Unit Tests ---

def test_welfare_nlp_categorization():
    text = "My quarter in the barrack has heavy water leakage and no heating."
    res = WelfareNLPService.analyze_welfare_text(text)
    assert res.detected_category == GrievanceCategory.HOUSING
    assert res.distress_indicator in ["Normal", "Detailed Welfare Context"]
    assert not res.requires_human_review

def test_welfare_nlp_high_distress():
    text = "Immediate emergency leave required. Mother is critically ill at home and my leave was denied. I am feeling helpless and in extreme stress."
    res = WelfareNLPService.analyze_welfare_text(text)
    assert res.detected_category in [GrievanceCategory.LEAVE, GrievanceCategory.FAMILY_SUPPORT]
    assert res.urgency in [GrievanceUrgency.HIGH, GrievanceUrgency.URGENT]
    assert res.requires_human_review is True
    assert "High Distress Language" in res.distress_indicator or "Urgent Welfare Concern" in res.distress_indicator

# --- 4. Welfare Risk Engine Unit Tests ---

def test_welfare_risk_evaluation():
    out_good = WelfareRiskEngine.evaluate(latest_checkin_status=WelfareStatusRating.GOOD)
    assert out_good.risk_level == RiskTier.STABLE

    out_need_support = WelfareRiskEngine.evaluate(
        latest_checkin_status=WelfareStatusRating.NEED_SUPPORT,
        consecutive_struggling_days=3
    )
    assert out_need_support.welfare_risk_score >= 70.0
    assert out_need_support.risk_level == RiskTier.ELEVATED

# --- 5. Unified SAJAG Risk Engine Unit Tests ---

def test_sajag_risk_synthesis():
    phys = PhysiologicalStressEngine.evaluate(resting_hr=64.0, sleep_hours=7.5)
    op = OperationalFatigueEngine.evaluate(consecutive_duty_days=2, days_since_last_leave=15)
    wel = WelfareRiskEngine.evaluate(latest_checkin_status=WelfareStatusRating.GOOD)

    asmt = SAJAGRiskEngine.synthesize_assessment(
        personnel_id="p1",
        service_id="CRPF-001",
        physiological=phys,
        operational=op,
        welfare=wel,
        consecutive_elevated_days=0
    )
    assert asmt.overall_state == RiskTier.STABLE
    assert asmt.requires_human_review is False
    assert "Nominal State" in asmt.recommended_action

def test_sajag_risk_persistence():
    phys = PhysiologicalStressEngine.evaluate(resting_hr=85.0, sleep_hours=4.0)
    op = OperationalFatigueEngine.evaluate(consecutive_duty_days=10, days_since_last_leave=80)
    wel = WelfareRiskEngine.evaluate(latest_checkin_status=WelfareStatusRating.STRUGGLING)

    asmt = SAJAGRiskEngine.synthesize_assessment(
        personnel_id="p2",
        service_id="CRPF-002",
        physiological=phys,
        operational=op,
        welfare=wel,
        historical_stress_scores_7d=[50, 60, 75, 82],
        consecutive_elevated_days=6
    )
    assert asmt.overall_state in [RiskTier.ELEVATED, RiskTier.PERSISTENT_ELEVATED]
    assert asmt.requires_human_review is True
    assert "Priority Human Review" in asmt.recommended_action

# --- 6. Deterministic Demo Scenarios Tests ---

def test_demo_scenarios():
    scen_a = SAJAGDemoScenarios.get_scenario_a()
    assert scen_a.physiological.risk_level == RiskTier.ELEVATED
    assert scen_a.welfare.risk_level == RiskTier.STABLE

    scen_b = SAJAGDemoScenarios.get_scenario_b()
    assert scen_b.welfare.risk_level == RiskTier.ELEVATED
    assert scen_b.operational.risk_level == RiskTier.ELEVATED
    assert scen_b.requires_human_review is True

    scen_c = SAJAGDemoScenarios.get_scenario_c()
    assert scen_c.overall_state == RiskTier.STABLE
    assert scen_c.temporal_trend == TrendDirection.IMPROVING

    scen_d = SAJAGDemoScenarios.get_scenario_d()
    assert scen_d.physiological.confidence <= 0.3
    assert scen_d.physiological.signal_quality == "Sparse / Missing"

# --- 7. Dataset Adapters Laboratory Bench Tests ---

def test_dataset_adapters():
    wesad = DatasetAdapter.adapt_wesad_sample("S2", "stress", 88.0, 34.5, 6.5, 21.0)
    assert wesad["dataset_name"].startswith("WESAD")
    assert "Synthetic / Public Research Dataset" in wesad["provenance_tag"]
    assert wesad["sajag_physiological_output"]["stress_score"] > 60.0

    swell = DatasetAdapter.adapt_swell_sample("PP1", "neutral", 66.0, 42.0)
    assert swell["dataset_name"].startswith("SWELL-KW")
    assert swell["sajag_physiological_output"]["stress_score"] < 40.0

# --- 8. FastAPI SAJAG Endpoints Integration Tests ---
from sajag_auth import create_sajag_token

PERSONNEL_TOKEN = create_sajag_token(
    user_id="usr_personnel_001",
    service_id="CRPF-98421",
    role=UserRole.PERSONNEL,
    unit="42nd Bn CRPF",
    name="Constable Alex Mercer"
)
OFFICER_TOKEN = create_sajag_token(
    user_id="usr_officer_001",
    service_id="CRPF-OFF-01",
    role=UserRole.WELFARE_OFFICER,
    unit="42nd Bn CRPF",
    name="Welfare Officer Sharma"
)
PERSONNEL_AUTH = {"Authorization": f"Bearer {PERSONNEL_TOKEN}"}
OFFICER_AUTH = {"Authorization": f"Bearer {OFFICER_TOKEN}"}

def test_api_sajag_profile():
    res = client.get("/api/sajag/profile", headers=PERSONNEL_AUTH)
    assert res.status_code == 200
    data = res.json()
    assert data["service_id"] == "CRPF-98421"
    assert "Constable" in data["rank"]

def test_api_sajag_risk_assessment():
    res = client.get("/api/sajag/risk-assessment", headers=PERSONNEL_AUTH)
    assert res.status_code == 200
    data = res.json()
    assert "physiological" in data
    assert "operational" in data
    assert "welfare" in data
    assert "composite_risk_score" in data

def test_api_sajag_trends():
    res = client.get("/api/sajag/trends", headers=PERSONNEL_AUTH)
    assert res.status_code == 200
    data = res.json()
    assert len(data["days"]) == 7
    assert len(data["recovery_index"]) == 7

def test_api_sajag_welfare_checkin():
    payload = {
        "personnel_id": "usr_personnel_001",
        "status_rating": "Okay",
        "voluntary_notes": "Completed patrol shift smoothly."
    }
    res = client.post("/api/sajag/welfare-checkin", json=payload, headers=PERSONNEL_AUTH)
    assert res.status_code == 200
    data = res.json()
    assert "recorded successfully" in data["message"]

def test_api_sajag_grievance():
    payload = {
        "personnel_id": "usr_personnel_001",
        "category": "Leave & Recovery Access",
        "description": "Requesting leave sanction for daughter's school admission.",
        "urgency": "Medium"
    }
    res = client.post("/api/sajag/grievance", json=payload, headers=PERSONNEL_AUTH)
    assert res.status_code == 200
    data = res.json()
    assert data["category"] == "Leave & Recovery Access"
    assert data["nlp_result"] is not None

def test_api_sajag_officer_cases():
    res = client.get("/api/sajag/officer/cases", headers=OFFICER_AUTH)
    assert res.status_code == 200
    cases = res.json()
    assert len(cases) >= 1

def test_api_sajag_demo_scenarios():
    for sid in ["A", "B", "C", "D"]:
        res = client.get(f"/api/sajag/demo/scenario/{sid}")
        assert res.status_code == 200
        data = res.json()
        assert "composite_risk_score" in data
