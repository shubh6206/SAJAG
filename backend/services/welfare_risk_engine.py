from typing import Dict, Any, List, Optional
from sajag_models import (
    WelfareRiskOutput, RiskTier, WelfareStatusRating, GrievanceRecord, WelfareNLPResult
)

class WelfareRiskEngine:
    """
    SAJAG Personnel Welfare Risk Engine.
    Processes voluntary check-in signals, confidential grievance states, and administrative support status.
    
    PRINCIPLE: A grievance is NOT proof of pathology; it is an administrative & human welfare friction signal.
    """

    @staticmethod
    def evaluate(
        latest_checkin_status: Optional[WelfareStatusRating] = None,
        checkin_notes: Optional[str] = None,
        active_grievances: Optional[List[GrievanceRecord]] = None,
        consecutive_struggling_days: int = 0
    ) -> WelfareRiskOutput:
        
        contributors: List[str] = []
        base_score = 20.0  # Stable / Normal
        
        # 1. Voluntary Check-in Contribution
        if latest_checkin_status == WelfareStatusRating.NEED_SUPPORT:
            base_score += 45.0
            contributors.append("Voluntary check-in indicated 'Need Support'.")
        elif latest_checkin_status == WelfareStatusRating.STRUGGLING:
            base_score += 30.0
            contributors.append("Voluntary check-in indicated 'Struggling'.")
        elif latest_checkin_status == WelfareStatusRating.OKAY:
            base_score += 10.0
        elif latest_checkin_status == WelfareStatusRating.GOOD:
            base_score += 0.0
            
        if consecutive_struggling_days >= 3:
            base_score += 15.0
            contributors.append(f"Persistence: {consecutive_struggling_days} consecutive days of self-reported distress.")

        # 2. Active Grievance & Urgency Contribution
        grievance_count = len(active_grievances) if active_grievances else 0
        if grievance_count > 0:
            for g in (active_grievances or []):
                if g.urgency.value in ["Urgent", "Urgent / Priority"]:
                    base_score += 25.0
                    contributors.append(f"Urgent grievance recorded under category '{g.category.value}'.")
                elif g.urgency.value == "High":
                    base_score += 15.0
                    contributors.append(f"High-priority grievance recorded under category '{g.category.value}'.")
                else:
                    base_score += 8.0
                    contributors.append(f"Active grievance open in category '{g.category.value}'.")

        final_score = round(min(100.0, max(0.0, base_score)), 1)
        
        # 3. Risk Tier & Explanation
        if final_score >= 75.0:
            risk_level = RiskTier.ELEVATED
            explanation = "Elevated welfare friction: combined self-reported support request and active high-urgency welfare concern."
        elif final_score >= 50.0:
            risk_level = RiskTier.NORMAL_VARIATION
            explanation = "Moderate welfare concern requiring routine officer follow-up."
        else:
            risk_level = RiskTier.STABLE
            explanation = "Personnel welfare indicators remain balanced with no urgent friction signals."

        if not contributors:
            contributors.append("No active welfare grievances or self-reported distress signals.")

        return WelfareRiskOutput(
            welfare_risk_score=final_score,
            risk_level=risk_level,
            recent_checkin_status=latest_checkin_status,
            active_grievance_count=grievance_count,
            confidence=0.90 if latest_checkin_status is not None else 0.60,
            contributors=contributors,
            explanation=explanation
        )
