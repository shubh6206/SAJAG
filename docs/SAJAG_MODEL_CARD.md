# SAJAG Model Card & Technical Specifications
**System**: SAJAG Decision-Support Intelligence Engine  
**Version**: 2.1 (Edge Production Release)  
**Organization**: Ministry of Home Affairs / CAPF Support Framework  
**Scope**: Operational Stress & Welfare Multi-Pillar Early Warning  

---

## 1. Intended Purpose & Non-Purpose

### 1.1 Intended Purpose
- Provide **non-clinical, non-diagnostic** early warning indicators of elevated operational strain, autonomic recovery suppression, and unresolved family/administrative friction.
- Support unit commanders and welfare officers in scheduling timely rest intervals, adjusting duty rosters, and providing supportive outreach before exhaustion leads to critical failure.

### 1.2 Explicit Non-Purpose & Prohibitions
- **NOT a Diagnostic Tool**: SAJAG does not diagnose psychiatric conditions, depression, PTSD, anxiety disorders, or medical cardiac ailments.
- **NOT an Automated Decision Maker**: SAJAG never initiates disciplinary action, involuntary relief, or career-impacting reassignments without authorized human review.
- **NOT a Black-Box Classifier**: Output is strictly decomposable into explicit mathematical contributions (Resting HR deviation, sleep debt, consecutive duty days, leave overdue days, grievance category).

---

## 2. Model Architecture & Pipeline

```
                    ┌─────────────────────────┐
                    │ RAW PERSONNEL TELEMETRY │
                    └────────────┬────────────┘
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     ▼                           ▼                           ▼
[ 14-Day Baseline ]     [ Operational Fatigue ]     [ Local NLP Engine ]
- 1.5x IQR Filter       - Consecutive Days          - Lexicon & Theme Extraction
- Confidence State      - Night Shift Density       - Category & Urgency Matrix
- Z-score Deviation     - Leave Overdue Deficit     - Sensitive Narrative Masking
     │                           │                           │
     └───────────────────────────┼───────────────────────────┘
                                 │
                                 ▼
                     [ Unified Risk Synthesis ]
                     - Tri-Pillar Weighted Base (35/35/30)
                     - Multi-Pillar Convergence Multiplier
                     - 7-Day Temporal Trajectory Tracking
                                 │
                                 ▼
                    [ Human Review & Attribution ]
                    - Waterfall Point Decomposition
                    - Non-Punitive Recommendations
```

---

## 3. Pillar Methodologies

### 3.1 Personal Baseline Engine
- **Window**: 14-day rolling observation window.
- **Outlier Rejection**: 1.5x Interquartile Range (IQR) filter applied to Resting HR, HRV, and Sleep Duration to prevent sensor detachment or acute exertion spikes from biasing the resting baseline.
- **Calibration Threshold**: Minimum 5 valid daily samples required. If samples < 5, confidence is marked `LOW` and state set to `Calibration Pending`.
- **Individual-Referenced Deviation**: Deviations are evaluated against the soldier's *own* median/mean rather than arbitrary universal cutoffs (e.g. comparing a naturally low-HR endurance soldier against their personal 52 bpm baseline).

### 3.2 Operational Fatigue Engine
- **Consecutive Duty Load**: Scaled exponentially past 6, 10, and 16 consecutive duty days without a 24-hour recovery interval.
- **Circadian Disruption**: Night patrol density during the preceding 7 days.
- **Leave Deficit**: Number of days elapsed past sanctioned annual leave entitlement.
- **Environmental Multipliers**: Border (High alert), High Altitude (>3,500m hypoxia factor), Field (Counter-insurgency).

### 3.3 Welfare & Local NLP Engine
- **Architecture**: Simulated Edge DistilBERT running 100% locally with zero external network connectivity.
- **Categories**: Leave, Family Support, Housing, Facilities, Workload, Medical, Administration.
- **Urgency Levels**: `CRITICAL` (ICU/family emergencies), `HIGH` (leave denial, high duty fatigue), `MEDIUM` (administrative/facilities), `LOW` (routine inquiries).
- **Masking Protocol**: Replaces raw text with privacy-compliant structural summaries (`[CONFIDENTIAL DETAILS MASKED]`).

### 3.4 Unified Risk Synthesis & Attribution
- **Convergence Rule**: If Operational Load ≥ 65 AND Welfare Risk ≥ 65, a multi-pillar compounding factor (+8 points) is triggered, even if physiological biometrics are completely normal (the Scenario B paradigm).
- **Temporal Trajectory**: Tracks rolling 7-day risk slope to classify into:
  - `Persistent elevation` (sustained ≥ 3 days)
  - `Acute spike` (single-day event)
  - `Improving` (consecutive negative slope)
  - `Data sparse` (< 3 historical observations)

---

## 4. Evaluation Data & Limitations

- **Dataset Grounding**: Models are evaluated on synthetic cohorts modeled on CAPF deployment parameters across Border Outposts (BOP), High Altitude Sectors (Ladakh/Sikkim), and Field Units (Chhattisgarh/J&K).
- **Synthetic Limitations**: Synthetic datasets reflect simulated telemetry; real-world field telemetry may exhibit higher packet drop rates in remote valleys.
- **Data Sparsity Handling**: When telemetry is interrupted by tactical radio silence or sensor damage, the engine explicitly reduces confidence to `LOW` rather than assuming stability.
