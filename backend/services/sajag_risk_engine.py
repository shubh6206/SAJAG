import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sajag_models import (
    SAJAGRiskAssessment, PhysiologicalStressOutput, OperationalFatigueOutput,
    WelfareRiskOutput, RiskTier, TrendDirection
)

class SAJAGRiskEngine:
    """
    SAJAG Unified Multi-Dimensional Risk & Temporal Persistence Engine.
    
    Synthesizes the Three Intelligence Pillars:
    1. Physiological Stress
    2. Operational Fatigue
    3. Personnel Welfare
    
    WITH TEMPORAL REASONING:
    - Distinguishes transient isolated spikes from persistent multi-week deterioration.
    - Explicitly triggers human review when persistence or multi-pillar convergence occurs.
    """

    @staticmethod
    def synthesize_assessment(
        personnel_id: str,
        service_id: str,
        physiological: PhysiologicalStressOutput,
        operational: OperationalFatigueOutput,
        welfare: WelfareRiskOutput,
        historical_stress_scores_7d: Optional[List[float]] = None,
        consecutive_elevated_days: int = 0
    ) -> SAJAGRiskAssessment:
        
        # 1. Pillar Weights
        # 35% Physiological Stress, 35% Operational Load, 30% Welfare Friction
        w_phys = 0.35
        w_op = 0.35
        w_wel = 0.30

        raw_composite = (
            (physiological.stress_score * w_phys) +
            (operational.fatigue_score * w_op) +
            (welfare.welfare_risk_score * w_wel)
        )
        
        # 2. Temporal Persistence & Trend Detection
        trend = TrendDirection.STABLE
        if historical_stress_scores_7d and len(historical_stress_scores_7d) >= 3:
            first_half_avg = sum(historical_stress_scores_7d[:2]) / 2.0
            last_val = historical_stress_scores_7d[-1]
            diff = last_val - first_half_avg
            
            if diff >= 15.0:
                trend = TrendDirection.DETERIORATING
            elif diff <= -15.0:
                trend = TrendDirection.IMPROVING
            elif last_val > 70.0 and first_half_avg < 40.0:
                trend = TrendDirection.ACUTE_SPIKE
            else:
                trend = TrendDirection.STABLE

        # 3. Overall Risk Tier Classification with Persistence
        composite_score = round(min(100.0, max(0.0, raw_composite)), 1)
        
        # Check for multi-pillar convergence
        elevated_pillars_count = 0
        if physiological.risk_level == RiskTier.ELEVATED: elevated_pillars_count += 1
        if operational.risk_level == RiskTier.ELEVATED: elevated_pillars_count += 1
        if welfare.risk_level == RiskTier.ELEVATED: elevated_pillars_count += 1

        requires_human_review = False
        
        if consecutive_elevated_days >= 4 or elevated_pillars_count >= 2 or composite_score >= 70.0:
            overall_state = RiskTier.PERSISTENT_ELEVATED if consecutive_elevated_days >= 4 else RiskTier.ELEVATED
            requires_human_review = True
            recommended_action = "Priority Human Review: Initiate confidential welfare officer check-in and consider scheduled duty rest."
            detailed_explanation = (
                f"Multi-dimensional risk elevation detected ({elevated_pillars_count}/3 pillars elevated). "
                f"Persistence duration: {consecutive_elevated_days} days. "
                f"Primary contributing factors: {'; '.join((physiological.contributors[:1] + operational.contributors[:1] + welfare.contributors[:1]))}."
            )
        elif composite_score >= 50.0 or elevated_pillars_count == 1:
            overall_state = RiskTier.NORMAL_VARIATION
            requires_human_review = (welfare.welfare_risk_score >= 70.0)  # Human review if welfare is high
            recommended_action = "Routine Monitoring: Maintain regular hydration, schedule standard off-duty recovery, and review upcoming shift rotations."
            detailed_explanation = (
                f"Moderate physiological or operational load within manageable bounds. "
                f"Recovery index is at {physiological.recovery_index:.0f}/100. Trend: {trend.value}."
            )
        else:
            overall_state = RiskTier.STABLE
            requires_human_review = False
            recommended_action = "Nominal State: All personnel wellness and operational readiness metrics are within healthy baseline parameters."
            detailed_explanation = "Physiological markers, shift duty loads, and voluntary welfare indicators remain balanced and optimal."

        # Unified Confidence is weighted average of sub-engine confidences
        unified_confidence = round(
            (physiological.confidence * 0.4) + (operational.confidence * 0.3) + (welfare.confidence * 0.3),
            2
        )

        return SAJAGRiskAssessment(
            assessment_id=f"asmt_{uuid.uuid4().hex[:8]}",
            personnel_id=personnel_id,
            service_id=service_id,
            timestamp=datetime.utcnow(),
            physiological=physiological,
            operational=operational,
            welfare=welfare,
            overall_state=overall_state,
            composite_risk_score=composite_score,
            confidence=unified_confidence,
            temporal_trend=trend,
            persistence_days=consecutive_elevated_days,
            requires_human_review=requires_human_review,
            recommended_action=recommended_action,
            detailed_explanation=detailed_explanation
        )
