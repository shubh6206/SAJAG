# SAJAG Automated Test & Verification Report
**Project**: SAJAG – AI-Powered Personnel Stress & Welfare Monitoring System  
**SIH Problem Statement**: SIH26186 (Ministry of Home Affairs)  
**Execution Timestamp**: September 14, 2026  
**Test Suite**: `src/tests/engines.test.ts`  
**Result**: 32 / 32 Passed (100% Success Rate)  

---

## 1. Test Summary

| Test Module | Tests Executed | Passed | Failed | Status |
|---|---|---|---|---|
| **1. Personal Baseline Engine** | 6 | 6 | 0 | **PASSED** |
| **2. Physiological Stress Engine** | 5 | 5 | 0 | **PASSED** |
| **3. Operational Fatigue Engine** | 3 | 3 | 0 | **PASSED** |
| **4. Welfare & Local NLP Engine** | 6 | 6 | 0 | **PASSED** |
| **5. Unified Risk & Attribution Synthesis** | 4 | 4 | 0 | **PASSED** |
| **6. RBAC & Data Minimization Security** | 8 | 8 | 0 | **PASSED** |
| **Total** | **32** | **32** | **0** | **ALL PASSED** |

---

## 2. Test Execution Details

### 2.1 Baseline Engine Tests
- `✓ PASS`: 10 clean samples establish valid personal baseline
- `✓ PASS`: 10 days yields HIGH confidence rating
- `✓ PASS`: Mean HR matches expected range
- `✓ PASS`: Sparse data (<5 days) does not claim established baseline
- `✓ PASS`: Sparse data yields explicit LOW confidence
- `✓ PASS`: IQR outlier filter successfully strips sensor spike (185 bpm)

### 2.2 Physiological Stress Engine Tests
- `✓ PASS`: Normal biometrics evaluated as Stable (Score: 20)
- `✓ PASS`: Normal biometrics produce low physiological strain score
- `✓ PASS`: Strictly non-diagnostic language enforced (no clinical terms)
- `✓ PASS`: Cardiovascular deviation evaluated as Elevated/High
- `✓ PASS`: Sleep debt correctly quantified (>= 2.0 hrs)

### 2.3 Operational Fatigue Engine Tests
- `✓ PASS`: 18 duty days + leave deficit produces High operational score (Score: 100)
- `✓ PASS`: Consecutive duty driver transparently identified
- `✓ PASS`: Leave deficit driver transparently identified

### 2.4 Welfare & Local NLP Engine Tests
- `✓ PASS`: Emergency text classified as Leave / Family Support
- `✓ PASS`: ICU distress classified as CRITICAL urgency
- `✓ PASS`: Classification explicitly marked as air-gapped local model
- `✓ PASS`: Sensitive raw text automatically masked in summary
- `✓ PASS`: Critical open grievance + Need Support checkin yields High welfare risk (Score: 100)
- `✓ PASS`: 1 unresolved grievance tracked

### 2.5 Unified Risk Engine Tests (Scenario B Verification)
- `✓ PASS`: Scenario B correctly flags HUMAN REVIEW despite normal biometrics!
- `✓ PASS`: Flagged as priority case for officer intervention
- `✓ PASS`: Multi-pillar convergence detected
- `✓ PASS`: Operational load contribution dominates physiological score in waterfall

### 2.6 RBAC Security Tests
- `✓ PASS`: Personnel cannot view another soldier's case (IDOR blocked)
- `✓ PASS`: Personnel can view own case profile
- `✓ PASS`: Welfare Officer authorized for institutional review
- `✓ PASS`: Commander cannot view sensitive raw grievance narrative
- `✓ PASS`: Commander has no unmask capability
- `✓ PASS`: Narrative masked by default for Welfare Officer
- `✓ PASS`: Welfare Officer permitted to reveal narrative with audit
- `✓ PASS`: Welfare Officer can view full source text upon explicit audited reveal

---

## 3. Build & Linter Verification
- **TypeScript Static Analysis (`tsc --noEmit`)**: 0 errors.
- **Production Bundle (`vite build && esbuild`)**: Compiled successfully. Single self-contained backend bundle `dist/server.cjs` and static client assets in `dist/`.
- **Port Ingress**: Verified binding to `0.0.0.0:3000`.
