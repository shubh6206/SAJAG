# SAJAG SIH26186 Demonstration Guide
**Theme**: MedTech / BioTech / HealthTech | **Ministry of Home Affairs**

---

## 1. Step-by-Step Demonstration Flow

### Step 1: Start Backend API
```powershell
cd myapp/nirogx_api
..\nirogx_api\venv_win\Scripts\python.exe -m uvicorn main:app --port 8000 --reload
```
- Open `http://localhost:8000/docs` to inspect the live OpenAPI interactive documentation.

### Step 2: Launch Mobile Application
```powershell
cd myapp/nirogx_app
flutter run
```

### Step 3: Demonstrate Scenario A — Physiological Overload
1. Navigate to **Profile** tab in the mobile app.
2. Select **Scenario A: Physiological Overload**.
3. Switch to **Overview** tab:
   - Observe **Physiological Stress Card** spike to `84/100 (Elevated)`.
   - Resting HR deviation is `+3.2σ (88 bpm)` vs `64 bpm baseline`. Sleep debt shows `3.8 hrs`.
   - Observe **Recommended Action**: *"Priority Rest: Schedule off-duty recovery hours."*

### Step 4: Demonstrate Scenario B — Hidden Welfare Risk
1. In **Profile** tab, select **Scenario B: Hidden Welfare Risk**.
2. Switch to **Overview** tab:
   - Notice Resting HR and sleep are *nominal* (`35/100 Stable`).
   - Notice **Operational Fatigue** is `85/100 (Elevated)` (11 consecutive duty days, 92 days without leave).
   - Notice **Welfare Risk** is `88/100 (Elevated)` (Self-reported *"Need Support"* + family emergency grievance).
   - Demonstrates that biometric sensors alone would miss this critical risk, but SAJAG captures it!

### Step 5: Demonstrate Scenario C — Recovering Personnel
1. Select **Scenario C** in **Profile** tab.
2. Observe down-trending risk curve, restorative sleep (`8.2 hrs`), and normalized heart rate (`63 bpm`).

### Step 6: Demonstrate Scenario D — Data Sparsity & Discipline
1. Select **Scenario D**.
2. Observe that confidence drops to `25%` and the system abstains from triggering false alarms, proving scientific rigor.

### Step 7: Authorized Welfare Officer Workflow
1. Navigate to **Officer** tab.
2. Review prioritized case queue (CRPF-98421, BSF-74102).
3. Click **Touchpoint** and **Log Action** to demonstrate supportive human intervention.
