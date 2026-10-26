from typing import Dict, Any
from sajag_models import (
    SAJAGRiskAssessment, PhysiologicalStressOutput, OperationalFatigueOutput,
    WelfareRiskOutput, RiskTier, TrendDirection, MetricDeviation, PostingType,
    WelfareStatusRating
)
from services.physiological_stress_engine import PhysiologicalStressEngine
from services.operational_fatigue_engine import OperationalFatigueEngine
from services.welfare_risk_engine import WelfareRiskEngine
from services.sajag_risk_engine import SAJAGRiskEngine

class SAJAGDemoScenarios:
    """
    Deterministic SIH26186 Prototype Evaluation Scenarios.
    
    Provides 4 reproducible case studies showcasing multi-dimensional intelligence,
    temporal reasoning, and scientific data quality handling.
    """

    @classmethod
    def get_scenario_a(cls) -> SAJAGRiskAssessment:
        """
        Scenario A: PHYSIOLOGICAL OVERLOAD
        - High resting HR (88 bpm vs 64 bpm baseline), acute sleep debt (3.8 hrs), suppressed recovery (22/100).
        - Operational context is moderate, welfare is nominal.
        - Demonstrates physiological early warning before operational exhaustion.
        """
        phys = PhysiologicalStressEngine.evaluate(
            resting_hr=88.0,
            sleep_hours=3.8,
            hrv_rmssd=18.0,
            spo2=96.0,
            hr_baseline=64.0,
            hr_baseline_std=4.0,
            sleep_baseline=7.6,
            sleep_baseline_std=0.7,
            hrv_baseline=45.0,
            hrv_baseline_std=7.0,
            days_of_baseline_data=21
        )
        op = OperationalFatigueEngine.evaluate(
            consecutive_duty_days=3,
            days_since_last_leave=28,
            average_daily_duty_hours_7d=8.5,
            night_shifts_last_7d=1,
            posting_type=PostingType.FIELD
        )
        wel = WelfareRiskEngine.evaluate(
            latest_checkin_status=WelfareStatusRating.OKAY
        )
        return SAJAGRiskEngine.synthesize_assessment(
            personnel_id="demo_scenario_a",
            service_id="CRPF-98421",
            physiological=phys,
            operational=op,
            welfare=wel,
            historical_stress_scores_7d=[45.0, 52.0, 68.0, 84.0],
            consecutive_elevated_days=2
        )

    @classmethod
    def get_scenario_b(cls) -> SAJAGRiskAssessment:
        """
        Scenario B: HIDDEN WELFARE RISK
        - Normal resting vitals (HR 66 bpm, sleep 7.2h).
        - Prolonged operational load (13.5 hrs/day, 11 consecutive days, 92 days since last leave).
        - Urgent self-reported distress ('Need Support' + family grievance).
        - Demonstrates capturing welfare friction that biometric sensors alone cannot see.
        """
        phys = PhysiologicalStressEngine.evaluate(
            resting_hr=66.0,
            sleep_hours=7.2,
            hrv_rmssd=40.0,
            spo2=98.0,
            hr_baseline=65.0,
            days_of_baseline_data=30
        )
        op = OperationalFatigueEngine.evaluate(
            consecutive_duty_days=11,
            days_since_last_leave=92,
            average_daily_duty_hours_7d=13.5,
            night_shifts_last_7d=4,
            posting_type=PostingType.BORDER,
            denied_leave_count_last_6m=2
        )
        wel = WelfareRiskEngine.evaluate(
            latest_checkin_status=WelfareStatusRating.NEED_SUPPORT,
            consecutive_struggling_days=4
        )
        return SAJAGRiskEngine.synthesize_assessment(
            personnel_id="demo_scenario_b",
            service_id="BSF-74102",
            physiological=phys,
            operational=op,
            welfare=wel,
            historical_stress_scores_7d=[55.0, 62.0, 74.0, 82.0],
            consecutive_elevated_days=6
        )

    @classmethod
    def get_scenario_c(cls) -> SAJAGRiskAssessment:
        """
        Scenario C: RECOVERING PERSONNEL
        - Previously elevated stress now resolving: restorative sleep (8.2 hrs), HR normalized (63 bpm).
        - Reduced operational schedule after rest period.
        - Demonstrates positive trend tracking and recovery detection.
        """
        phys = PhysiologicalStressEngine.evaluate(
            resting_hr=63.0,
            sleep_hours=8.2,
            hrv_rmssd=48.0,
            spo2=98.5,
            hr_baseline=64.0,
            days_of_baseline_data=28
        )
        op = OperationalFatigueEngine.evaluate(
            consecutive_duty_days=1,
            days_since_last_leave=14,
            average_daily_duty_hours_7d=7.0,
            night_shifts_last_7d=0,
            posting_type=PostingType.PEACE
        )
        wel = WelfareRiskEngine.evaluate(
            latest_checkin_status=WelfareStatusRating.GOOD
        )
        return SAJAGRiskEngine.synthesize_assessment(
            personnel_id="demo_scenario_c",
            service_id="CISF-31950",
            physiological=phys,
            operational=op,
            welfare=wel,
            historical_stress_scores_7d=[78.0, 65.0, 48.0, 26.0],
            consecutive_elevated_days=0
        )

    @classmethod
    def get_scenario_d(cls) -> SAJAGRiskAssessment:
        """
        Scenario D: DATA QUALITY & SPARSITY
        - Wearable disconnected for 4 days, only 1 sporadic step count reading, no HRV or sleep.
        - Low confidence (0.25) with transparent explanation.
        - Demonstrates scientific discipline by abstaining from false-positive alarms on missing data.
        """
        phys = PhysiologicalStressEngine.evaluate(
            resting_hr=None,
            sleep_hours=None,
            hrv_rmssd=None,
            spo2=None,
            days_of_baseline_data=1
        )
        op = OperationalFatigueEngine.evaluate(
            consecutive_duty_days=2,
            days_since_last_leave=20,
            average_daily_duty_hours_7d=8.0,
            posting_type=PostingType.PEACE
        )
        wel = WelfareRiskEngine.evaluate(
            latest_checkin_status=None
        )
        return SAJAGRiskEngine.synthesize_assessment(
            personnel_id="demo_scenario_d",
            service_id="ITBP-55209",
            physiological=phys,
            operational=op,
            welfare=wel,
            consecutive_elevated_days=0
        )
