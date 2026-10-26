from typing import Dict, Any, List, Optional
from datetime import datetime
from sajag_models import (
    PhysiologicalStressOutput, RiskTier, MetricDeviation
)
from services.physiological_stress_engine import PhysiologicalStressEngine

class DatasetAdapter:
    """
    SAJAG Research Dataset Adapter.
    Adapts public multimodal stress datasets (WESAD, SWELL-KW) for laboratory bench testing.
    
    RESEARCH PROVENANCE NOTICE:
    Public datasets (WESAD/SWELL) are non-military academic research benchmarks.
    They are utilized strictly for sensor signal validation and feature extraction calibration.
    """

    @staticmethod
    def adapt_wesad_sample(
        subject_id: str,
        condition_label: str,  # "baseline", "stress", "amusement", "meditation"
        bvp_hr: float,
        temp_c: float,
        eda_microsiemens: float,
        resp_rate: float
    ) -> Dict[str, Any]:
        """
        Normalizes a WESAD (Wearable Stress and Affect Detection) chest/wrist sensor window.
        """
        # Map condition to simulated sleep & HRV proxies for SAJAG engine test
        is_stress_condition = (condition_label.lower() == "stress")
        hrv_proxy = 18.0 if is_stress_condition else 45.0
        sleep_proxy = 4.5 if is_stress_condition else 7.8
        
        output = PhysiologicalStressEngine.evaluate(
            resting_hr=bvp_hr,
            hrv_rmssd=hrv_proxy,
            sleep_hours=sleep_proxy,
            hr_baseline=65.0,
            hr_baseline_std=4.5
        )
        
        return {
            "dataset_name": "WESAD (University of Siegen / ACM ISWC)",
            "provenance_tag": "Synthetic / Public Research Dataset (Laboratory Ground Truth)",
            "subject_id": subject_id,
            "ground_truth_label": condition_label,
            "raw_sensors": {
                "heart_rate_bpm": bvp_hr,
                "skin_temp_c": temp_c,
                "eda_us": eda_microsiemens,
                "respiration_rpm": resp_rate
            },
            "sajag_physiological_output": output.model_dump()
        }

    @staticmethod
    def adapt_swell_sample(
        participant_id: str,
        condition: str,  # "neutral", "time_pressure", "interruptions"
        hr_bpm: float,
        rmssd_ms: float
    ) -> Dict[str, Any]:
        """
        Normalizes a SWELL-KW (Stress and Workload in Knowledge Work) window.
        """
        is_high_load = condition.lower() in ["time_pressure", "interruptions"]
        
        output = PhysiologicalStressEngine.evaluate(
            resting_hr=hr_bpm,
            hrv_rmssd=rmssd_ms,
            sleep_hours=6.0 if is_high_load else 7.5,
            hr_baseline=68.0,
            hr_baseline_std=5.0
        )

        return {
            "dataset_name": "SWELL-KW (Radboud University)",
            "provenance_tag": "Synthetic / Public Research Dataset (Cognitive Load Ground Truth)",
            "participant_id": participant_id,
            "ground_truth_condition": condition,
            "raw_sensors": {
                "heart_rate_bpm": hr_bpm,
                "rmssd_ms": rmssd_ms
            },
            "sajag_physiological_output": output.model_dump()
        }
