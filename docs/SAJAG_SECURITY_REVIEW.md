# SAJAG Security Review & Data Minimization Report
**Project**: SAJAG – AI-Powered Personnel Stress & Welfare Monitoring System  
**SIH Problem Statement**: SIH26186 (Ministry of Home Affairs)  
**Security Standard**: Strict Data Minimization, RBAC, and Air-Gapped Operation  
**Review Date**: September 14, 2026  

---

## 1. Security Architecture & Threat Model

SAJAG handles sensitive personnel telemetry, operational rosters, and voluntary welfare grievances. The system enforces strict defense-in-depth:

```
[ Personnel Data Input ]
         │
         ▼
[ RBAC Enforcement Gateway (Server-Side Headers & Policies) ]
         │
    ┌────┴──────────────────────────┬──────────────────────────┐
    ▼                               ▼                          ▼
[ Commander Scope ]         [ Medical Officer Scope ]   [ Welfare Officer Scope ]
- Operational Readiness     - Physiological Telemetry   - Unresolved Grievances
- Aggregated Unit Risk      - Baseline Deviations       - Audited Narrative Reveal
- NO Raw Biometrics         - NO Family Grievance Text  - Supportive Interventions
```

---

## 2. Key Security Verification Items

### 2.1 Server-Side RBAC Enforcement
- **Header Authentication**: Requests pass `x-officer-role` and `x-officer-id` headers.
- **Insecure Direct Object References (IDOR)**: Tested and blocked in `src/engines/rbacEngine.ts` and `server.ts`. A soldier (`Personnel`) attempting to access another soldier's profile is met with HTTP 403 Forbidden.
- **Sensitive Narrative Unmasking**: The `/api/sajag/grievance/:id/reveal` endpoint restricts unmasking strictly to `Welfare Officer` or the grievance author. Unauthorized roles (e.g. Commander) receive HTTP 403.

### 2.2 Data Minimization & De-Identification
- **Commanders**: Never receive raw continuous cardiovascular telemetry or personal diagnostic notes. The `sanitizePersonnelForRole()` function sanitizes the record before serving it to Commander sessions.
- **Medical Officers**: Receive physiological baseline deviations and sleep recovery metrics, but are partitioned away from domestic/family support grievance texts.
- **Welfare Officers**: See categorized issues and masked summaries. Source text is only revealed through an audited, deliberate click.

### 2.3 Immutable Audit Logging
- Every sensitive operation generates an audit entry containing:
  - `timestamp`: UTC ISO-8601 string
  - `actorId` / `actorRole`: Identification of the querying officer
  - `action`: E.g., `Viewed Case Review Profile`, `Unmasked Sensitive Grievance Text`
  - `caseId`: Target personnel ID
  - `result`: `Authorized` or `Unauthorized Access Blocked`
- **Zero Raw Data Duplication**: Audit logs strictly log metadata and case identifiers. Raw grievance text and medical notes are never written into audit logs.

### 2.4 Air-Gapped Operation & Zero Cloud Transmission
- **No External LLM Calls**: Welfare text classification is executed via local regex and lexicon-based models (`classifyWelfareTextLocally`). No data packets leave the local server boundary.
- **Zero Hardcoded Secrets**: Codebase contains no hardcoded API keys, bearer tokens, or external cloud database credentials.

---

## 3. Vulnerability Assessment Summary

| Threat Category | Status | Mitigation in Code |
|---|---|---|
| IDOR / Profile Snooping | **MITIGATED** | `authorizeCaseAccess()` enforces actor-to-target mapping. |
| Narrative Data Leakage | **MITIGATED** | Masked summaries generated at ingestion; reveal audited. |
| Biometric Over-surveillance | **MITIGATED** | Individual baselines rather than comparative tracking; Commander sanitization. |
| External Egress Risk | **MITIGATED** | 100% local execution; Edge mode verification. |
| Stale Audit Manipulation | **MITIGATED** | Append-only audit store with timestamp recording. |
