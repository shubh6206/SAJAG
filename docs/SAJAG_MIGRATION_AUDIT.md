# SAJAG Migration Audit: NirogX Codebase Analysis (SIH26186)
**Project Title**: SAJAG — AI-Powered Personnel Stress & Welfare Monitoring System  
**Problem Statement**: SIH26186 | **Organization**: Ministry of Home Affairs | **Category**: Software / HealthTech  
**Tagline**: *"Early Signals. Better Welfare. Human Action."*  
**Audit Date**: September 2026  
**Auditor**: Senior Software Architect, Flutter/FastAPI Engineer, ML/Privacy Engineer  

---

## Executive Summary & Guiding Principles

This document presents a rigorous, component-by-component architectural audit of the existing NirogX codebase to plan its transformation into **SAJAG**.

### Core Transformation Philosophy
1. **No Blind Deletion**: NirogX's production-grade Health Connect/HealthKit ingestion, local SQLite transactional architecture, deduplication, deterministic scoring pipelines, and test suites are solid technical foundations.
2. **Tri-Pillar Intelligence Re-Architecture**: NirogX focused primarily on individual physiological wellness. SAJAG elevates this into three distinct, non-opaque intelligence dimensions:
   - **Physiological Stress** (Autonomic tone, resting HR deviations, sleep debt, recovery index)
   - **Operational Fatigue** (Shift density, duty cycles, deployment durations, leave deficits)
   - **Personnel Welfare** (Voluntary check-ins, grievance sentiment, family support, administrative wellbeing)
3. **Strict Privacy & Non-Diagnostic Safety**: Total decoupling from external third-party LLM APIs (e.g. cloud Gemini/OpenAI) for sensitive health and grievance data. All inference is deterministic or executed locally (Ollama / Local NLP / GGUF / BioMistral), operating strictly as an early-warning decision-support tool rather than an autonomous psychiatric diagnostic system.

---

## Comprehensive Component Classification Table

| # | Existing NirogX Component | Location / Artifact | Classification | Justification & Architectural Strategy |
|---|---|---|---|---|
| **1** | **Repository Structure & Monorepo** | Root, `/myapp/nirogx_app`, `/myapp/nirogx_api` | **REUSE WITH MODIFICATION** | Clean split between Flutter app and FastAPI backend. Rebrand root documentation, harmonize directory structure, and add dedicated SAJAG modules. |
| **2** | **Flutter Mobile Client** | `myapp/nirogx_app` | **REUSE WITH MODIFICATION** | Preserves Material 3 design system, state providers, and offline caching. Reframe UI from generic clinic/patient theme to SAJAG personnel & welfare monitoring platform. |
| **3** | **Android Health Connect Integration** | `android/`, `AndroidManifest.xml`, Health Connect API 34+ permissions | **REUSE AS-IS** | Complete, compliant Health Connect permissions, background read rationale, and intent filters for Android 14+. Ingestion pipeline will feed SAJAG Physiological Data Layer. |
| **4** | **iOS HealthKit Integration** | `ios/Runner/Info.plist`, HealthKit schemas | **REUSE AS-IS** | Granular health permissions (Heart Rate, Sleep, Active Energy, Steps) preserved for Apple ecosystem personnel devices. |
| **5** | **FastAPI Backend Server** | `myapp/nirogx_api/main.py`, `config.py` | **REUSE WITH MODIFICATION** | Core FastAPI asynchronous server, CORS, middleware, and dependency injection are production-ready. Extend with SAJAG routes (`/api/sajag/*`) and RBAC guards. |
| **6** | **PostgreSQL & Database Layer** | `myapp/nirogx_api/database.py` | **REUSE WITH MODIFICATION** | Existing SQLAlchemy models (`DBUser`, `DBVital`, `DBSleepSession`). Extend with SAJAG tables: `operational_records`, `welfare_records`, `grievances`, `risk_assessments`, `audit_logs`. |
| **7** | **SQLite / Local Storage** | `myapp/nirogx_app/lib/services/local_health_db.dart` | **REUSE WITH MODIFICATION** | Rock-solid transactional batch inserts, content-hash deduplication, and data-sovereignty purge. Add tables for local duty logs, offline welfare check-ins, and risk event logs. |
| **8** | **Authentication & Session State** | `auth_provider.dart`, JWT handlers in FastAPI | **REUSE WITH MODIFICATION** | JWT bearer auth and password hashing are operational. Add Role-Based Access Control (RBAC) claims (`PERSONNEL`, `WELFARE_OFFICER`, `MEDICAL_REVIEWER`, `AUTHORIZED_ADMIN`). |
| **9** | **User & Profile Models** | `user_model.dart`, `models.py` | **REUSE WITH MODIFICATION** | Adapt civilian demographic profiles into personnel profiles (Service ID, Unit/Battalion, Posting Type, Current Deployment Zone, Role). |
| **10** | **Health Connect / HealthKit Ingestion** | `health_sync_service.dart` | **REUSE AS-IS** | Robust polling, incremental cursor sync tokens, platform error handling, and background fetch. Directly re-routed into SAJAG Physiological Layer. |
| **11** | **Incremental Sync & Deduplication** | `local_health_db.dart` (content_hash, sync_generation) | **REUSE AS-IS** | Deterministic SHA-256 content hashing guarantees zero duplicate vital records across multi-device ingest. |
| **12** | **Data Sovereignty & Purge Controls** | `purgeAllHealthData()` in `local_health_db.dart` | **REUSE AS-IS** | Meets strict government privacy requirements allowing personnel to purge local cache or execute cryptographic erasure. |
| **13** | **Baseline Computation Engine** | `baseline_engine.dart` | **REUSE WITH MODIFICATION** | Current 30-day median + variance algorithm is solid. Upgrade to `SAJAGPersonalBaselineEngine` with rolling deviation, trend detection, confidence decay, and missing-data handlers. |
| **14** | **HealthScoreEngine (Flutter & Python)** | `health_score_engine.dart`, `health_score_engine.py` | **REUSE WITH MODIFICATION** | Re-architect the single composite wellness score into 3 discrete engines: `PhysiologicalStressEngine`, `OperationalFatigueEngine`, and `WelfareRiskEngine`. |
| **15** | **Cloud Gemini LLM Calls** | `services/gemini_service.py`, `medical_ai_service.py` | **DEPRECATE / ISOLATE** | Sensitive health, personnel duty, and grievance text must NEVER egress to external commercial APIs. Route through local offline LLM / deterministic NLP pipeline. |
| **16** | **Local AI / Ollama / BioMistral Engine** | `training/`, `models/`, local inference wrappers | **REUSE WITH MODIFICATION** | Shift local model tasks from clinical differential diagnosis to: (1) Welfare text categorization, (2) Grievance urgency scoring, (3) Risk factor summarization, (4) Recommendation drafting. |
| **17** | **Clinical Symptom Analysis API** | `/api/analyze-symptoms` | **REPLACE** | Replace diagnostic symptom checker with `/api/sajag/welfare-checkin` and `/api/sajag/grievance` endpoints. |
| **18** | **API Contracts & Pydantic Models** | `models.py` | **REUSE WITH MODIFICATION** | Add Pydantic schemas for `OperationalContextPayload`, `WelfareCheckinPayload`, `GrievancePayload`, `SAJAGRiskAssessment`, and `RBACContext`. |
| **19** | **Database Schemas** | `database.py` | **REUSE WITH MODIFICATION** | Add schema definitions for operational shifts, deployment history, grievance tracking, and encrypted audit logs. |
| **20** | **Mobile Dashboards & Screens** | `screens/home_screen.dart`, `insights_screen.dart` | **REUSE WITH MODIFICATION** | Transform from civilian fitness UI into SAJAG Personnel Dashboard: Physiological Stress card, Operational Load card, Welfare Status card, Recovery gauge, and Trend sparklines. |
| **21** | **Interactive Charts & Vitals Display** | `widgets/vital_summary_card.dart`, `health_score_card.dart` | **REUSE WITH MODIFICATION** | Refactor charts to display multi-day autonomic stress curves, shift workload bars, and recovery index vs. baseline bands. |
| **22** | **Risk Scoring Semantics** | `Optimal`, `Good`, `Caution`, `Alert` | **REUSE WITH MODIFICATION** | Adopt non-alarmist, scientifically defensible tiers: `Stable`, `Normal Variation`, `Elevated`, `Persistent Elevated`, `Requires Human Review`. |
| **23** | **Existing Pytest & Flutter Test Suite** | `nirogx_api/tests/`, `myapp/test/` | **REUSE WITH MODIFICATION** | Preserve schema, score, and baseline unit tests. Add test coverage for Operational Fatigue Engine, Welfare NLP, RBAC enforcement, and Temporal Persistence. |
| **24** | **Configuration & Environment Settings** | `config.py`, `.env` | **REUSE WITH MODIFICATION** | Add SAJAG specific flags: `SAJAG_OFFLINE_MODE=true`, `SAJAG_DEMO_SCENARIO=A`, `LOCAL_LLM_BACKEND=ollama`, `RBAC_ENFORCE=true`. |
| **25** | **Demo Mode Infrastructure** | Existing mock endpoints & mock data | **REUSE WITH MODIFICATION** | Replace random mock data with 4 deterministic SIH evaluation scenarios (Scenarios A, B, C, D) representing distinct personnel conditions. |
| **26** | **Navigation & Routing Flow** | `main_navigation_screen.dart` | **REUSE WITH MODIFICATION** | Reorganize tabs: 1. Overview, 2. Stress, 3. Operations, 4. Welfare, 5. Check-in, 6. Profile / Admin Switcher. |
| **27** | **Security Controls & Audit Trails** | `test_audit_logger.py`, `test_safety_engine.py` | **REUSE WITH MODIFICATION** | Adapt dual safety gates to intercept diagnostic over-claims, enforce least privilege, and cryptographically log all officer-level case reviews. |
| **28** | **Documentation & Reports** | `/docs/*` | **REUSE WITH MODIFICATION** | Archive technical reports as background provenance. Produce new official SAJAG architecture, model cards, security audits, and SIH demonstration guides. |
| **29** | **Dataset Adapters (WESAD / SWELL-KW)** | `datasets/`, `training/` | **NEW SAJAG COMPONENT** | Implement clean data adapters for benchmark stress datasets (WESAD, SWELL-KW), explicitly annotated as public prototype research benchmarks. |

---

## Detailed Component Analyses

### A. Core Biometric & Health Ingestion (Preserve 100%)
- **HealthSyncService & LocalHealthDatabase**: Implements resilient mobile sync with SQLite, supporting Android Health Connect (API 34+) and iOS HealthKit.
- **Deduplication Engine**: Uses deterministic SHA-256 hashing across `(metricType, startTimeUtc, sourceId, value)`. This prevents duplicate records during frequent app restarts or background syncs.
- **Data Sovereignty**: The existing `purgeAllHealthData()` allows complete local erasure in compliance with defense/police data handling standards.

### B. Personal Baseline Engine (`SAJAGPersonalBaselineEngine`)
- **Current State**: `baseline_engine.dart` computes median and standard deviation across a 30-day sliding window for resting heart rate, sleep duration, and daily steps.
- **SAJAG Evolution**: Incorporate exponential smoothing, confidence decay when sensors are disconnected, and persistent deviation tracking to distinguish acute physiological exertion from chronic baseline deterioration.

### C. The Three Intelligence Engines (SAJAG Triad)
1. **Physiological Stress Engine**:
   - Calculates autonomic strain index from resting HR deviation, HRV suppression (RMSSD/SDNN when available), sleep architecture deficit, and recovery index.
   - Non-diagnostic outputs with explicit confidence intervals.
2. **Operational Fatigue Engine** (*New*):
   - Computes operational load from shift density over 7/14 days, consecutive night duties, deployment duration, and time elapsed since last sanctioned leave.
   - Rule-based, fully explainable scoring without black-box opacity.
3. **Personnel Welfare Engine & Local NLP** (*New*):
   - Ingests voluntary check-ins (`Good`, `Okay`, `Struggling`, `Need Support`) and confidential welfare text/grievances.
   - Categorizes text locally into Housing, Leave, Workload, Family Support, Administrative, Facilities, or Medical concerns.
   - Strictly prohibits psychological labelling (e.g. no "depressed" or "unstable" tags); flags urgency and requests human welfare officer review.

### D. Unified Risk Engine & Temporal Persistence
- Computes multi-dimensional risk matrix:
  $$\text{SAJAG State} = f(\text{Physiological Stress}, \text{Operational Load}, \text{Welfare Signal}, \text{Temporal Persistence})$$
- Differentiates single transient anomalies (e.g., one acute night shift) from multi-week systemic exhaustion (`Persistent Elevated`).

### E. Privacy & Role-Based Access Control (RBAC)
- **Personnel Role**: Access only to own biometrics, duty history, personal baselines, and submitted welfare requests.
- **Welfare Officer Role**: Access to prioritized case list, aggregated stress/workload flags, and grievance categories requiring welfare intervention. Raw private health telemetry is masked to prevent intrusive surveillance.
- **Medical Reviewer Role**: Access to physiological trend analysis upon authorized referral.
- **Authorized Administrator Role**: Aggregated battalion/unit-level operational readiness metrics only. Zero individual surveillance.

---

## Conclusion & Readiness for Migration Plan

The NirogX codebase is in excellent technical health, with robust foundational plumbing, modular Dart and Python architectures, and strict typing. Transitioning to SAJAG is clean, structured, and does not require destructive re-writes.
