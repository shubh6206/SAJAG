# SAJAG SIH Judge Demonstration Guide (3-Minute Walkthrough)
**Problem Statement**: SIH26186 (Ministry of Home Affairs)  
**Target Audience**: Technical & Domain Evaluators  
**Execution Time**: 180 Seconds  

---

## The Core Thesis
> *"Commercial health trackers measure heartbeats. SAJAG understands the armed forces. A soldier's stress is not just physiological—it is shaped by operational load, leave deficits, and family welfare. SAJAG unifies all three without black-box opacity or external cloud leakage."*

---

## Step-by-Step Demonstration Script

### [00:00 - 00:30] STEP 1: Command Overview & The Multi-Pillar Problem
1. Open the SAJAG dashboard on the **Command Overview** tab.
2. Direct the judges' attention to the **2D Operational vs. Physiological Heatmap** and summary KPI cards (`Watch`, `Elevated`, `Human Review`).
3. **Say**:
   > *"Existing solutions attempt to monitor soldiers using a single fitness score. In high-altitude or border deployments, biometrics alone can produce dangerous false positives or fatal false negatives. SAJAG monitors three distinct streams: Physiological State, Operational Burden, and Confidential Welfare."*

### [00:30 - 01:15] STEP 2 & 3: The "Killer Scenario" — Scenario B (PX-1042)
1. In the top bar scenario selector, click **"Scenario B: Normal Biometrics / High Welfare Friction (PX-1042)"**.
2. Click **"View Case Review"** to enter the **Personnel Review** screen.
3. Point out the physiological metrics:
   - Resting Heart Rate: **64 bpm** (Within normal baseline)
   - HRV: **58 ms** (Calibrated)
   - Sleep: **7.0 hrs**
4. **Say**:
   > *"If a commander looked only at a fitness tracker or smartwatch dashboard, Constable Rajesh Kumar looks completely healthy and fit. But look at the Operational and Welfare pillars:"*
   - Operational Load: **18 consecutive duty days**, **5 night patrols in 7 days**, **43-day leave deficit**.
   - Welfare Signal: An open, critical family emergency grievance regarding a hospitalized parent.
5. Highlight the system output:
   - System flags: **HUMAN REVIEW REQUIRED** with a multi-pillar convergence alert.
   - Signal confidence: **HIGH (Multi-source verified)**.

### [01:15 - 01:45] STEP 4: Explainable Waterfall Attribution
1. Point to the **Risk Contribution Waterfall** breakdown on the screen:
   - Operational Load: **45% of total score** (+37 pts)
   - Welfare Friction: **35% of total score** (+29 pts)
   - Convergence Bonus: **+8 pts**
   - Physiological Strain: **20% of total score** (+12 pts)
2. **Say**:
   > *"SAJAG never produces an unexplainable AI score. Every recommendation has a mathematically transparent attribution trail explaining exactly why this soldier needs support."*

### [01:45 - 02:15] STEP 5 & 6: Welfare Officer Review & Supportive Intervention
1. Switch the role selector in the top bar to **"Welfare Officer"**.
2. Scroll to the **Confidential Welfare & Grievance Stream**:
   - Point out that the sensitive narrative is **masked by default** (`[CONFIDENTIAL DETAILS MASKED]`) via our local air-gapped NLP engine.
   - Click **"View Source Text (Audited)"**. Explain that this deliberate reveal is recorded in the security audit ledger.
3. Scroll down to **"Log Supportive Action / Intervention"**:
   - Select Action Type: **"Duty Roster Adjustment"** or **"Sanction Emergency Earned Leave"**.
   - Add note: *"Recommended 7-day compassionate leave with operational replacement assigned."*
   - Click **"Log Intervention"**.
4. **Say**:
   > *"SAJAG is non-punitive. It recommends roster adjustments and leave reviews rather than disciplinary tags."*

### [02:15 - 02:45] STEP 7: Security & Audit Trail
1. Click the **"Audit Ledger"** tab in the main navigation.
2. Point out the newly recorded audit entry:
   - Actor: `WO-102 (Welfare Officer)`
   - Action: `Unmasked Sensitive Grievance Text` / `Created Supportive Intervention`
   - Target: `PX-1042`
   - Result: `Authorized`
3. **Say**:
   > *"Every view of sensitive data is logged into an append-only audit trail to protect soldier privacy and institutional integrity."*

### [02:45 - 03:00] STEP 8: Edge & Air-Gapped Status
1. Click the **"System Health"** indicator in the header.
2. Toggle **"EDGE / OFFLINE MODE"**.
3. Note that all scoring, baselines, and local NLP continue executing with **zero external cloud network dependencies**.
4. **Conclude**:
   > *"SAJAG does not replace human judgement. It ensures the right officer sees the right signal at the right time. Thank you."*
