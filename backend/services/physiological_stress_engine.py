import math
from typing import Dict, Any, List, Optional
from sajag_models import (
    PhysiologicalStressOutput, RiskTier, MetricDeviation
)

class PhysiologicalStressEngine:
    """
    SAJAG Physiological Stress Engine.
    Evaluates autonomic strain, resting heart rate deviations against personal baseline,
    sleep architecture deficits, and recovery status.
    
    NON-DIAGNOSTIC: Outputs early risk indicators and evidence explanations.
    """

    @staticmethod
    def evaluate(
        heart_rate: Optional[float] = None,
        resting_hr: Optional[float] = None,
        hrv_rmssd: Optional[float] = None,
        sleep_hours: Optional[float] = None,
        spo2: Optional[float] = None,
        active_calories: Optional[float] = None,
        hr_baseline: Optional[float] = 68.0,
        hr_baseline_std: Optional[float] = 4.5,
        sleep_baseline: Optional[float] = 7.5,
        sleep_baseline_std: Optional[float] = 0.8,
        hrv_baseline: Optional[float] = 42.0,
        hrv_baseline_std: Optional[float] = 8.0,
        days_of_baseline_data: int = 14,
    ) -> PhysiologicalStressOutput:
        
        effective_rhr = resting_hr if (resting_hr is not None and resting_hr > 0) else heart_rate
        deviations: List[MetricDeviation] = []
        contributors: List[str] = []
        
        # 1. Missing Data & Signal Quality Assessment
        available_signals = 0
        total_signals = 4  # RHR, Sleep, HRV, SpO2
        
        if effective_rhr is not None: available_signals += 1
        if sleep_hours is not None: available_signals += 1
        if hrv_rmssd is not None: available_signals += 1
        if spo2 is not None: available_signals += 1
        
        if available_signals == 0:
            return PhysiologicalStressOutput(
                stress_score=20.0,
                risk_level=RiskTier.NORMAL_VARIATION,
                recovery_index=50.0,
                confidence=0.1,
                signal_quality="Sparse / Missing",
                deviations=[],
                contributors=["Insufficient physiological telemetry recorded."],
                explanation="No active wearable or manual vitals data available to compute physiological stress."
            )
            
        signal_quality = "High" if available_signals >= 3 else "Moderate" if available_signals == 2 else "Sparse / Missing"
        base_confidence = (available_signals / total_signals) * min(1.0, max(0.4, days_of_baseline_data / 14.0))

        # 2. Resting Heart Rate Analysis
        rhr_score = 25.0  # baseline calm
        if effective_rhr is not None:
            baseline_val = hr_baseline or 68.0
            std_val = hr_baseline_std or 4.5
            z_score = (effective_rhr - baseline_val) / max(1.0, std_val)
            
            direction = "Within Baseline"
            if z_score >= 2.0:
                direction = "Elevated"
                rhr_score = 85.0
                contributors.append(f"Resting HR ({effective_rhr:.0f} bpm) elevated +{z_score:.1f}σ above personal baseline ({baseline_val:.0f} bpm).")
            elif z_score >= 1.0:
                direction = "Elevated"
                rhr_score = 60.0
                contributors.append(f"Resting HR ({effective_rhr:.0f} bpm) moderately elevated (+{z_score:.1f}σ above baseline).")
            elif z_score <= -1.5:
                direction = "Suppressed"
                rhr_score = 45.0
            else:
                rhr_score = 20.0
                
            deviations.append(MetricDeviation(
                metric_name="Resting Heart Rate",
                observed_value=effective_rhr,
                baseline_value=baseline_val,
                standard_deviation=std_val,
                z_score=round(z_score, 2),
                deviation_direction=direction,
                unit="bpm"
            ))

        # 3. Sleep Debt & Architecture
        sleep_score = 25.0
        if sleep_hours is not None:
            b_sleep = sleep_baseline or 7.5
            sleep_deficit = b_sleep - sleep_hours
            if sleep_hours < 4.5:
                sleep_score = 90.0
                contributors.append(f"Critical acute sleep deficit ({sleep_hours:.1f} hrs vs {b_sleep:.1f} hrs baseline).")
            elif sleep_hours < 6.0:
                sleep_score = 70.0
                contributors.append(f"Restricted sleep duration ({sleep_hours:.1f} hrs vs {b_sleep:.1f} hrs baseline).")
            elif sleep_hours > 9.5:
                sleep_score = 40.0
            else:
                sleep_score = 15.0
                
            deviations.append(MetricDeviation(
                metric_name="Sleep Duration",
                observed_value=sleep_hours,
                baseline_value=b_sleep,
                standard_deviation=sleep_baseline_std or 0.8,
                z_score=round(-sleep_deficit / max(0.5, sleep_baseline_std or 0.8), 2),
                deviation_direction="Suppressed" if sleep_deficit > 1.0 else "Within Baseline",
                unit="hrs"
            ))

        # 4. HRV Autonomic Tone (if available)
        hrv_score = 25.0
        if hrv_rmssd is not None:
            b_hrv = hrv_baseline or 42.0
            b_hrv_std = hrv_baseline_std or 8.0
            hrv_z = (hrv_rmssd - b_hrv) / max(1.0, b_hrv_std)
            if hrv_z <= -2.0:
                hrv_score = 85.0
                contributors.append(f"Significant HRV RMSSD suppression ({hrv_rmssd:.0f} ms vs {b_hrv:.0f} ms baseline), signaling parasympathetic withdrawal.")
            elif hrv_z <= -1.0:
                hrv_score = 60.0
                contributors.append(f"Moderate HRV suppression ({hrv_rmssd:.0f} ms).")
            else:
                hrv_score = 15.0
                
            deviations.append(MetricDeviation(
                metric_name="Heart Rate Variability (RMSSD)",
                observed_value=hrv_rmssd,
                baseline_value=b_hrv,
                standard_deviation=b_hrv_std,
                z_score=round(hrv_z, 2),
                deviation_direction="Suppressed" if hrv_z <= -1.0 else "Within Baseline",
                unit="ms"
            ))

        # 5. Composite Stress Calculation (Dynamic Weighting)
        weights = {}
        if effective_rhr is not None: weights["rhr"] = 0.35
        if sleep_hours is not None: weights["sleep"] = 0.35
        if hrv_rmssd is not None: weights["hrv"] = 0.30
        
        weight_sum = sum(weights.values())
        if weight_sum > 0:
            weighted_stress = (
                (rhr_score * weights.get("rhr", 0)) +
                (sleep_score * weights.get("sleep", 0)) +
                (hrv_score * weights.get("hrv", 0))
            ) / weight_sum
        else:
            weighted_stress = 30.0

        # SpO2 hypoxia modifier
        if spo2 is not None and spo2 < 93.0:
            weighted_stress = min(100.0, weighted_stress + 15.0)
            contributors.append(f"Peripheral SpO2 dip ({spo2:.1f}%), potential high-altitude or exertion hypoxia.")

        final_stress_score = round(min(100.0, max(0.0, weighted_stress)), 1)
        
        # Recovery Index is the inverse of stress adjusted for sleep quality
        recovery_val = max(0.0, min(100.0, 100.0 - (final_stress_score * 0.8) + (10.0 if (sleep_hours or 7.0) >= 7.0 else -10.0)))
        recovery_index = round(recovery_val, 1)

        # Risk Tier Classification
        if final_stress_score >= 75.0:
            risk_level = RiskTier.ELEVATED
            explanation = "Elevated physiological stress observed: acute sympathetic arousal accompanied by recovery deficit."
        elif final_stress_score >= 50.0:
            risk_level = RiskTier.NORMAL_VARIATION
            explanation = "Moderate autonomic variation observed within acceptable operational physiological tolerance."
        else:
            risk_level = RiskTier.STABLE
            explanation = "Physiological markers and autonomic tone remain stable within personalized baseline limits."

        return PhysiologicalStressOutput(
            stress_score=final_stress_score,
            risk_level=risk_level,
            recovery_index=recovery_index,
            confidence=round(base_confidence, 2),
            signal_quality=signal_quality,
            deviations=deviations,
            contributors=contributors,
            explanation=explanation
        )
