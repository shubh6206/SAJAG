# SAJAG Safe Migration Plan (SIH26186)
**Project**: SAJAG — AI-Powered Personnel Stress & Welfare Monitoring System  
**Problem Statement**: SIH26186 | **Target Entity**: Ministry of Home Affairs / CAPF / Police  
**Branch**: `feature/sajag-sih26186`  
**Date**: September 2026  

---

## 1. Current Architecture Baseline

### 1.1 Backend (`myapp/nirogx_api` & `nirogx_api`)
- **Framework**: FastAPI (Python 3.10+) with Pydantic v2 schemas and SQLAlchemy ORM.
- **Database**: SQLite (`nirogx.db`) / PostgreSQL support. Tables: `users`, `vitals`, `blood_pressure_readings`, `sleep_sessions`, `chat_messages`, `user_goals`, `medical_history`.
- **Inference Layer**: Deterministic rule engines + Local AI hooks + safety gates.
- **Security**: JWT bearer token auth, Bcrypt hashing, dual-layer safety defusal.

### 1.2 Mobile Client (`myapp/nirogx_app`)
- **Framework**: Flutter 3.x with Dart 3.x, Material 3 design system.
- **State Management**: `Provider` (`AuthProvider`, `HealthProvider`).
- **Data Persistence**: `sqflite` with SQLite transactional batching and content hashing.
- **Wearable/Device Ingestion**: Android Health Connect (API 34+) and iOS HealthKit.

---

## 2. Core Dependencies & Build Environment
- **Python**: `fastapi`, `uvicorn`, `pydantic`, `sqlalchemy`, `python-jose`, `passlib[bcrypt]`, `pytest`, `pandas`, `numpy`, `scikit-learn`
- **Flutter/Dart**: `provider`, `sqflite`, `path`, `http`, `intl`, `flutter_svg`, `fl_chart` (where needed)
- **Local AI**: Ollama / Local GGUF / local regex + heuristic NLP pipeline fallback.

---

## 3. Database Schema Extensions (Reversible Migrations)

```sql
-- 1. Personnel Profile Extension
CREATE TABLE IF NOT EXISTS personnel_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    service_id TEXT UNIQUE NOT NULL,
    unit_battalion TEXT NOT NULL,
    posting_type TEXT NOT NULL, -- Field, Peace, Border, High Altitude
    deployment_zone TEXT,
    role TEXT NOT NULL DEFAULT 'PERSONNEL', -- PERSONNEL, WELFARE_OFFICER, MEDICAL_REVIEWER, AUTHORIZED_ADMIN
    created_at TEXT NOT NULL
);

-- 2. Operational & Duty Records
CREATE TABLE IF NOT EXISTS operational_records (
    id TEXT PRIMARY KEY,
    personnel_id TEXT NOT NULL,
    shift_date TEXT NOT NULL,
    shift_type TEXT NOT NULL, -- Day, Night, Extended, Patrol
    duty_hours REAL NOT NULL,
    consecutive_duty_days INTEGER NOT NULL DEFAULT 1,
    days_since_last_leave INTEGER NOT NULL DEFAULT 0,
    recovery_hours_granted REAL NOT NULL DEFAULT 8.0,
    notes TEXT,
    created_at TEXT NOT NULL
);

-- 3. Voluntary Welfare Check-ins
CREATE TABLE IF NOT EXISTS welfare_records (
    id TEXT PRIMARY KEY,
    personnel_id TEXT NOT NULL,
    checkin_date TEXT NOT NULL,
    status_rating TEXT NOT NULL, -- Good, Okay, Struggling, Need Support
    voluntary_notes TEXT,
    privacy_consent_level TEXT NOT NULL DEFAULT 'CONFIDENTIAL_WELFARE_OFFICER',
    created_at TEXT NOT NULL
);

-- 4. Confidential Grievance & NLP Analysis
CREATE TABLE IF NOT EXISTS grievances (
    id TEXT PRIMARY KEY,
    personnel_id TEXT NOT NULL,
    category TEXT NOT NULL, -- Housing, Leave, Workload, Family Support, Admin, Facilities, Medical
    raw_text TEXT NOT NULL,
    urgency_level TEXT NOT NULL, -- Low, Medium, High, Urgent
    nlp_sentiment_score REAL,
    nlp_extracted_topics TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING_HUMAN_REVIEW', -- PENDING_HUMAN_REVIEW, UNDER_REVIEW, RESOLVED
    assigned_officer_id TEXT,
    officer_notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 5. Multi-Dimensional Risk Assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
    id TEXT PRIMARY KEY,
    personnel_id TEXT NOT NULL,
    assessment_timestamp TEXT NOT NULL,
    physiological_stress_score REAL NOT NULL,
    physiological_risk_level TEXT NOT NULL,
    operational_fatigue_score REAL NOT NULL,
    operational_risk_level TEXT NOT NULL,
    welfare_risk_score REAL NOT NULL,
    welfare_risk_level TEXT NOT NULL,
    recovery_status_score REAL NOT NULL,
    overall_state TEXT NOT NULL, -- Stable, Normal Variation, Elevated, Persistent Elevated, Requires Human Review
    confidence_score REAL NOT NULL,
    temporal_trend TEXT NOT NULL, -- Improving, Stable, Deteriorating, Acute Spike
    persistence_days INTEGER NOT NULL DEFAULT 0,
    requires_human_review INTEGER NOT NULL DEFAULT 0,
    recommended_action TEXT NOT NULL,
    contributors_json TEXT NOT NULL
);

-- 6. Encrypted Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action_type TEXT NOT NULL, -- VIEW_CASE, SUBMIT_GRIEVANCE, UPDATE_INTERVENTION, EXPORT_ANONYMIZED
    target_personnel_id TEXT,
    ip_address TEXT,
    timestamp TEXT NOT NULL,
    details_json TEXT
);
```

---

## 4. API Endpoints Plan (`/api/sajag/*`)

| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `GET` | `/api/sajag/profile` | `PERSONNEL` | Fetch active personnel profile & deployment info |
| `GET` | `/api/sajag/physiological-risk` | `PERSONNEL`, `MEDICAL_REVIEWER` | Get physiological stress score & baseline deviations |
| `GET` | `/api/sajag/operational-risk` | `PERSONNEL`, `WELFARE_OFFICER` | Get operational fatigue index, shift load & leave stats |
| `GET` | `/api/sajag/welfare-risk` | `PERSONNEL`, `WELFARE_OFFICER` | Get welfare score & status of submitted check-ins |
| `GET` | `/api/sajag/risk-assessment` | `PERSONNEL`, `WELFARE_OFFICER` | Unified tri-pillar risk state with full explainability |
| `GET` | `/api/sajag/trends` | `PERSONNEL` | Multi-day longitudinal trend curves |
| `POST` | `/api/sajag/welfare-checkin` | `PERSONNEL` | Submit voluntary daily welfare check-in |
| `POST` | `/api/sajag/grievance` | `PERSONNEL` | Submit confidential grievance for local NLP & review |
| `GET` | `/api/sajag/officer/cases` | `WELFARE_OFFICER` | Get prioritized case list requiring human review |
| `POST` | `/api/sajag/officer/interventions` | `WELFARE_OFFICER` | Record officer welfare touchpoint / action taken |
| `GET` | `/api/sajag/demo/scenario/{id}` | All (Demo) | Load deterministic SIH evaluation scenario (A, B, C, D) |

---

## 5. Rollback and Safety Strategy
1. All changes branch from `feature/sajag-sih26186`.
2. Existing `/api/health`, `/api/auth/*`, and `/api/vitals` remain intact for backwards compatibility.
3. Local SQLite database automatically upgrades tables using `CREATE TABLE IF NOT EXISTS` and non-destructive migrations.
4. If a regression occurs, switching the active router back to legacy NirogX mode takes < 1 minute.
