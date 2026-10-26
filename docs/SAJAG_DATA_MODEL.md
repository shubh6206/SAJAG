# SAJAG Data Model & Schema Specification
**Problem Statement**: SIH26186 | **Target**: Ministry of Home Affairs / CAPF / Police

---

## 1. Core Data Entities

### 1.1 Personnel Profile (`personnel_profiles`)
| Field | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | Internal user UUID |
| `service_id` | `TEXT UNIQUE` | Official service / belt number (e.g. `CRPF-98421`) |
| `name` | `TEXT` | Personnel name |
| `rank` | `TEXT` | Rank / Designation (e.g. Constable, Head Constable, Sub-Inspector) |
| `unit_battalion` | `TEXT` | Assigned battalion or unit |
| `posting_type` | `TEXT` | Peace, Field Deployment, Border Outpost, High Altitude Area |
| `role` | `TEXT` | `PERSONNEL`, `WELFARE_OFFICER`, `MEDICAL_REVIEWER`, `AUTHORIZED_ADMIN` |

### 1.2 Operational Shift Records (`operational_records`)
| Field | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | Shift record identifier |
| `personnel_id` | `TEXT` | Foreign key to `personnel_profiles.id` |
| `shift_date` | `TEXT` | ISO 8601 date string (`YYYY-MM-DD`) |
| `shift_type` | `TEXT` | Day Shift, Night Shift, Extended 16h Duty, Continuous Patrol, Rest |
| `duty_hours` | `REAL` | Total duty duration in hours |
| `consecutive_duty_days` | `INTEGER` | Count of unbroken duty days up to this shift |
| `days_since_last_leave` | `INTEGER` | Days elapsed since last sanctioned leave |

### 1.3 Voluntary Welfare Check-ins (`welfare_records`)
| Field | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | Check-in identifier |
| `personnel_id` | `TEXT` | Foreign key to `personnel_profiles.id` |
| `checkin_date` | `TEXT` | Date of submission |
| `status_rating` | `TEXT` | `Good`, `Okay`, `Struggling`, `Need Support` |
| `voluntary_notes` | `TEXT` | Optional confidential remarks |

### 1.4 Confidential Grievance & NLP (`grievances`)
| Field | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | Grievance ticket identifier |
| `personnel_id` | `TEXT` | Foreign key to `personnel_profiles.id` |
| `category` | `TEXT` | Housing, Leave, Workload, Family Support, Admin, Facilities, Medical |
| `raw_text` | `TEXT` | Personnel submitted text |
| `urgency` | `TEXT` | `Low`, `Medium`, `High`, `Urgent` |
| `nlp_sentiment_score` | `REAL` | Local heuristic distress index |
| `status` | `TEXT` | `PENDING_HUMAN_REVIEW`, `TOUCHPOINT_SCHEDULED`, `RESOLVED` |

### 1.5 Multi-Dimensional Risk Assessment (`risk_assessments`)
| Field | Type | Description |
|---|---|---|
| `assessment_id` | `TEXT PRIMARY KEY` | Assessment UUID |
| `personnel_id` | `TEXT` | Foreign key to `personnel_profiles.id` |
| `physiological_stress_score` | `REAL` | 0.0 to 100.0 score |
| `operational_fatigue_score` | `REAL` | 0.0 to 100.0 score |
| `welfare_risk_score` | `REAL` | 0.0 to 100.0 score |
| `composite_risk_score` | `REAL` | Weighted composite score |
| `overall_state` | `TEXT` | `Stable`, `Normal Variation`, `Elevated`, `Persistent Elevated` |
| `persistence_days` | `INTEGER` | Number of consecutive elevated days |
| `requires_human_review` | `BOOLEAN` | Trigger for welfare officer attention |
