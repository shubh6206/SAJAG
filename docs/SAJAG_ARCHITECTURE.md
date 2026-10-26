# SAJAG System Architecture Specification (SIH26186)
**Project**: SAJAG — AI-Powered Personnel Stress & Welfare Monitoring System  
**Organization**: Ministry of Home Affairs  
**Theme**: MedTech / BioTech / HealthTech  

---

## 1. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                              DATA INGESTION LAYER                                 |
|  +---------------------------+  +------------------------+  +------------------+  |
|  | Android Health Connect 34+|  | iOS HealthKit (Apple)  |  | Operational Shift|  |
|  | (RHR, Sleep, HRV, Steps)  |  | (Heart, Energy, Sleep) |  | Logs & Rosters   |  |
|  +-------------+-------------+  +-----------+------------+  +--------+---------+  |
+----------------|----------------------------|------------------------|------------+
                 |                            |                        |
                 +----------------------------+                        |
                                              |                        |
+---------------------------------------------v------------------------v------------+
|                       LOCAL PERSISTENCE & PRIVACY LAYER                           |
|  - SQLite In-Memory / Production DB with SHA-256 Content-Hash Deduplication       |
|  - Data Sovereignty Purge Controls & On-Device Storage                            |
+---------------------------------------------+-------------------------------------+
                                              |
+---------------------------------------------v-------------------------------------+
|                      TRI-PILLAR INTELLIGENCE ENGINES                              |
|  +-------------------------+  +------------------------+  +--------------------+  |
|  | 1. Physiological Engine |  | 2. Operational Fatigue |  | 3. Welfare Engine  |  |
|  | - Autonomic Tone (RHR)  |  | - 7d Shift Density     |  | - Daily Check-ins  |  |
|  | - Personalized Baseline |  | - Unbroken Duty Days   |  | - Grievance NLP    |  |
|  | - Recovery Index        |  | - Leave Interval       |  | - Distress Filter  |  |
|  +------------+------------+  +-----------+------------+  +---------+----------+  |
+---------------|---------------------------|-------------------------|-------------+
                |                           |                         |
                +---------------------------+-------------------------+
                                            |
+-------------------------------------------v---------------------------------------+
|                    TEMPORAL PERSISTENCE & UNIFIED RISK ENGINE                     |
|  - Multi-Pillar Synthesis (35% Phys, 35% Operational, 30% Welfare)                |
|  - Temporal Persistence Check (Distinguishes acute spikes from chronic decline)   |
|  - Dynamic Confidence Calibration & Signal Sparsity Handling                      |
+-------------------------------------------+---------------------------------------+
                                            |
+-------------------------------------------v---------------------------------------+
|                    LOCAL AI & EXPLANATION LAYER (OFFLINE)                         |
|  - Local NLP Categorization & Urgency Flagging                                    |
|  - Human-Interpretable Evidence Summarization                                     |
|  - Zero Cloud LLM Egress (No OpenAI / Cloud Gemini for sensitive data)            |
+-------------------------------------------+---------------------------------------+
                                            |
+-------------------------------------------v---------------------------------------+
|                     ROLE-BASED ACCESS CONTROL (RBAC) PRESENTATION                 |
|  +--------------------------+  +-------------------------+  +------------------+  |
|  | Personnel Dashboard      |  | Welfare Officer Queue   |  | Unit Readiness   |  |
|  | - Own Trends & Check-in  |  | - Prioritized Triage    |  | - Anonymized     |  |
|  | - Personal Action Guidance| | - Intervention Logger   |  |   Battalion Stat |  |
|  +--------------------------+  +-------------------------+  +------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Component Pipeline Details

### 2.1 Physiological Stress Engine
- **Mathematical Model**:
  $$\text{Z-Score}_{\text{RHR}} = \frac{\text{RHR}_{\text{observed}} - \mu_{\text{baseline}}}{\sigma_{\text{baseline}}}$$
- Evaluates autonomic strain against personalized 30-day sliding median and variance.
- Computes Recovery Index $R \in [0, 100]$ incorporating sleep architecture and autonomic tone.

### 2.2 Operational Fatigue Engine
- **Mathematical Model**:
  $$\text{ShiftLoad} = 12 \cdot \max(0, \overline{\text{Hours}}_{7d} - 8) + 8 \cdot \max(0, \text{ConsecutiveDays} - 5) + 10 \cdot \text{NightShifts}_{7d}$$
  $$\text{FatigueScore} = \left( 0.60 \cdot \text{ShiftLoad} + 0.40 \cdot \text{LeaveDeficit} \right) \cdot \text{PostingMultiplier}$$
- Multipliers: Peace ($1.0$), Urban ($1.1$), Field ($1.15$), Border ($1.25$), High Altitude ($1.30$).

### 2.3 Welfare Intelligence & Local NLP
- Local keyword taxonomy matcher and regex sentiment parser.
- Categorizes submissions into 7 operational domains: Housing, Leave, Family Support, Workload, Administrative, Facilities, Medical.
- Classifies distress levels without psychiatric diagnostic labeling.

### 2.4 Unified Risk Engine & Temporal Persistence
- Overall Risk Tiers: `Stable`, `Normal Variation`, `Elevated`, `Persistent Elevated`.
- Persistence Trigger: An individual signal requires $\ge 4$ consecutive elevated days or $\ge 2$ elevated pillars to escalate to `Persistent Elevated` and flag `requires_human_review = True`.
