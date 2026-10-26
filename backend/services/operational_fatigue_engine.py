from typing import Dict, Any, List, Optional
from sajag_models import (
    OperationalFatigueOutput, RiskTier, PostingType, OperationalShiftRecord
)

class OperationalFatigueEngine:
    """
    SAJAG Operational Fatigue Engine.
    Estimates cumulative duty strain, shift density, circadian rhythm disruption from night duties,
    deployment fatigue, and leave access deficit.
    
    TRANSPARENT & DETERMINISTIC: Does not use black-box inference for duty context.
    """

    @staticmethod
    def evaluate(
        consecutive_duty_days: int = 1,
        days_since_last_leave: int = 30,
        average_daily_duty_hours_7d: float = 8.0,
        night_shifts_last_7d: int = 0,
        posting_type: PostingType = PostingType.PEACE,
        denied_leave_count_last_6m: int = 0,
        recent_shifts: Optional[List[OperationalShiftRecord]] = None
    ) -> OperationalFatigueOutput:
        
        contributors: List[str] = []

        # 1. Shift Load Index (0-100)
        # Based on average duty hours and consecutive days
        hours_factor = max(0.0, (average_daily_duty_hours_7d - 8.0) * 12.0)  # +12 per hour above 8h
        consecutive_factor = max(0.0, (consecutive_duty_days - 5) * 8.0)     # +8 per day above 5 consecutive
        night_factor = night_shifts_last_7d * 10.0                          # +10 per night shift in 7d

        raw_shift_load = hours_factor + consecutive_factor + night_factor + 20.0
        shift_load_index = round(min(100.0, max(0.0, raw_shift_load)), 1)

        if average_daily_duty_hours_7d >= 12.0:
            contributors.append(f"Extended duty cycle averaging {average_daily_duty_hours_7d:.1f} hours/day over last 7 days.")
        elif average_daily_duty_hours_7d >= 10.0:
            contributors.append(f"Elevated shift duration ({average_daily_duty_hours_7d:.1f} hrs/day average).")

        if consecutive_duty_days >= 10:
            contributors.append(f"Prolonged unbroken duty duration ({consecutive_duty_days} consecutive days without rest).")
        elif consecutive_duty_days >= 6:
            contributors.append(f"{consecutive_duty_days} consecutive operational duty days.")

        if night_shifts_last_7d >= 3:
            contributors.append(f"High night-shift density ({night_shifts_last_7d} night shifts in 7 days), potential circadian fatigue.")

        # 2. Leave & Recovery Access Deficit Index (0-100)
        leave_days_factor = max(0.0, (days_since_last_leave - 45) * 0.7)  # accrues strain past 45 days
        denial_factor = denied_leave_count_last_6m * 18.0

        raw_leave_deficit = leave_days_factor + denial_factor + 15.0
        leave_deficit_index = round(min(100.0, max(0.0, raw_leave_deficit)), 1)

        if days_since_last_leave >= 90:
            contributors.append(f"Significant leave interval ({days_since_last_leave} days since last sanctioned leave).")
        elif days_since_last_leave >= 60:
            contributors.append(f"{days_since_last_leave} days since last sanctioned leave period.")

        if denied_leave_count_last_6m > 0:
            contributors.append(f"{denied_leave_count_last_6m} administrative leave postponement(s) recorded in past 6 months.")

        # 3. Environmental / Posting Type Multiplier
        posting_multipliers = {
            PostingType.PEACE: 1.0,
            PostingType.URBAN_TRANSIT: 1.1,
            PostingType.FIELD: 1.15,
            PostingType.BORDER: 1.25,
            PostingType.HIGH_ALTITUDE: 1.30,
        }
        mult = posting_multipliers.get(posting_type, 1.0)
        if mult > 1.1:
            contributors.append(f"Environmental deployment factor active ({posting_type.value} context).")

        # 4. Composite Operational Fatigue Score
        # 60% Shift Load, 40% Leave Deficit, scaled by posting multiplier
        composite_raw = ((shift_load_index * 0.60) + (leave_deficit_index * 0.40)) * mult
        fatigue_score = round(min(100.0, max(0.0, composite_raw)), 1)

        # Risk Tier Classification
        if fatigue_score >= 75.0:
            risk_level = RiskTier.ELEVATED
            explanation = "Elevated operational fatigue: continuous duty hours, high shift density, and accumulated recovery deficit."
        elif fatigue_score >= 50.0:
            risk_level = RiskTier.NORMAL_VARIATION
            explanation = "Moderate operational load manageable under standard deployment rotations."
        else:
            risk_level = RiskTier.STABLE
            explanation = "Operational schedule is within balanced duty and recovery thresholds."

        if not contributors:
            contributors.append("Standard duty hours and adequate rest intervals maintained.")

        return OperationalFatigueOutput(
            fatigue_score=fatigue_score,
            risk_level=risk_level,
            shift_load_index=shift_load_index,
            leave_deficit_index=leave_deficit_index,
            confidence=0.95,  # High confidence as admin data is structured
            contributors=contributors,
            explanation=explanation
        )
