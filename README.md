# SAJAG — Personnel Stress & Welfare Monitoring System
**Problem Statement**: SIH26186 | **Organization**: Ministry of Home Affairs / CAPF / Armed Forces  
**Theme**: MedTech / BioTech / Defense HealthTech  
**Tagline**: *"Early Signals. Better Welfare. Human Action."*

---

## 1. Executive Overview

**SAJAG** is a mission-critical, privacy-first decision support system designed to monitor and mitigate physiological strain, cumulative operational fatigue, and welfare distress across defense and paramilitary personnel (CRPF, BSF, CISF, ITBP, SSB, State Police).

Unlike civilian fitness applications or black-box diagnostic models, SAJAG operates on strict **non-diagnostic decision support**:
1. **Tri-Pillar Analytics**: Synthesizes Physiological Stress (35%), Operational Workload (35%), and Personnel Welfare (30%).
2. **Temporal Persistence**: Distinguishes acute transient exertion (e.g., a single arduous night patrol) from chronic baseline decline (e.g., weeks of consecutive shifts without leave).
3. **Data Sovereignty & Zero Egress**: All biometric data, operational duty logs, and grievance texts are processed locally without cloud LLM dependencies.
4. **Role-Based Access Control (RBAC)**: Enforces cryptographic separation between Personnel, Welfare Officers, Medical Reviewers, and Unit Commanders.

---

## 2. System Architecture

```
+-----------------------------------------------------------------------------------+
|                              DATA INGESTION LAYER                                 |
|  - Biometric Wearables (Resting Heart Rate, Sleep Architecture, Steps, HRV)       |
|  - Operational Rosters (Shift Density, Duty Hours, Leave Gap, Consecutive Days)   |
|  - Voluntary Check-ins & Confidential Welfare Grievances                          |
+----------------------------------------+------------------------------------------+
                                         |
+----------------------------------------v------------------------------------------+
|                        TRI-PILLAR INTELLIGENCE ENGINES                            |
|  1. Physiological Stress Engine  -> Autonomic tone, personalized rolling baseline |
|  2. Operational Fatigue Engine   -> 7d shift density, night shifts, leave debt    |
|  3. Welfare Sentiment Engine     -> Distress keywords, urgency classification     |
+----------------------------------------+------------------------------------------+
                                         |
+----------------------------------------v------------------------------------------+
|                    TEMPORAL PERSISTENCE & UNIFIED RISK SYNTHESIS                  |
|  Composite Score = (0.35 * Phys) + (0.35 * Ops) + (0.30 * Welfare)               |
|  States: Stable | Normal Variation | Elevated | Persistent Elevated | Review Req. |
+----------------------------------------+------------------------------------------+
                                         |
            +----------------------------+----------------------------+
            |                                                         |
+-----------v----------------------------+       +--------------------v-------------+
|    COMMAND DASHBOARD (WEB CLIENT)      |       |      FASTAPI PERSISTENT BACKEND   |
|  - React 19 + Tailwind v4 + Vite       |       |  - SQLAlchemy ORM (SQLite/Postgres)|
|  - Battalion heatmaps & unmasking logs |       |  - Cryptographic JWT RBAC Auth    |
|  - Express API with air-gap fallback   |       |  - Automated 34-test verify suite |
+----------------------------------------+       +----------------------------------+
```

---

## 3. Repository Structure

```
SAJAG/
├── backend/                       # Python FastAPI Persistent Backend
│   ├── main.py                    # Application entrypoint & startup initialization
│   ├── database.py                # SQLAlchemy ORM models & session management
│   ├── config.py                  # Pydantic settings configuration
│   ├── sajag_auth.py              # Cryptographic JWT & RBAC enforcement
│   ├── sajag_models.py            # Pydantic data schemas & contracts
│   ├── sajag_router.py            # Core REST endpoints (/api/sajag/*)
│   ├── requirements.txt           # Python dependencies
│   ├── services/                  # Tri-pillar intelligence engines
│   │   ├── physiological_stress_engine.py
│   │   ├── operational_fatigue_engine.py
│   │   ├── welfare_nlp_service.py
│   │   ├── welfare_risk_engine.py
│   │   ├── sajag_risk_engine.py
│   │   ├── dataset_adapters.py
│   │   └── demo_scenarios.py
│   └── tests/                     # 34-case automated test suite
│       ├── test_sajag_database.py
│       ├── test_sajag_rbac.py
│       └── test_sajag_engines.py
├── src/                           # Vite + React 19 Web Command Dashboard
│   ├── components/                # Command Overview, Risk Cases, Audit Ledger
│   ├── engines/                   # Client-side tri-pillar fallback engines
│   ├── data/                      # Baseline unit datasets
│   └── types.ts                   # Domain types and data contracts
├── docs/                          # Comprehensive technical blueprints & audits
│   ├── SAJAG_ARCHITECTURE.md
│   ├── SAJAG_DATA_MODEL.md
│   ├── SAJAG_DEMO.md
│   ├── SAJAG_LIMITATIONS.md
│   ├── SAJAG_MIGRATION_AUDIT.md
│   ├── SAJAG_MIGRATION_PLAN.md
│   ├── SAJAG_MODEL_CARD.md
│   ├── SAJAG_SECURITY.md
│   └── SAJAG_VALIDATION_REPORT.md
├── server.ts                      # Express API server with JWT & audit logs
├── package.json                   # Web application dependencies & scripts
├── vite.config.ts                 # Vite bundler configuration
└── pytest.ini                     # Pytest environment configuration
```

---

## 4. Getting Started

### 4.1 Python FastAPI Backend
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API Documentation will be live at `http://localhost:8000/docs`.

### 4.2 Web Command Dashboard
```bash
# In project root
npm install
npm run dev
```
Access the command center at `http://localhost:3000`.

### 4.3 Running Test Suite
```bash
# Python Backend Tests (34 test cases)
pytest

# Client Engines Test
npm run test
```

---

## 5. Security & Compliance
- **Zero Cloud LLM Egress**: Confidential duty rosters and personnel grievances are never transmitted to external APIs.
- **Audited Unmasking**: Personnel identification is masked by default for commanders; de-anonymization generates an immutable entry in `audit_logs`.
- **Role-Based Least Privilege**: Distinct authorization barriers for `PERSONNEL`, `WELFARE_OFFICER`, `MEDICAL_REVIEWER`, and `COMMANDER`.
