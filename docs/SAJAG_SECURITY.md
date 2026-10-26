# SAJAG Security & Privacy-by-Design Specification
**Project**: SAJAG (SIH26186) | **Organization**: Ministry of Home Affairs

---

## 1. Zero External LLM Data Egress Guarantee
- **Strict Network Isolation**: Raw biometrics (heart rate, SpO2, sleep), duty rosters, voluntary check-ins, and grievance text are processed strictly within the local host/on-premise boundary.
- **External AI Invalidation**: All cloud LLM endpoints (OpenAI, Gemini cloud API) are prohibited from handling personnel data.
- **Local Inference Engine**: Text classification and summarization run via local heuristic pipelines or local Ollama / GGUF model runtimes.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Resource / Data Field | `PERSONNEL` | `WELFARE_OFFICER` | `MEDICAL_REVIEWER` | `AUTHORIZED_ADMIN` |
|---|:---:|:---:|:---:|:---:|
| **Own Biometrics & Baseline** | Read / Write | No Access | Read (Referral Only) | No Access |
| **Own Shift & Duty History** | Read | Read (Assigned Unit) | No Access | Aggregated Only |
| **Own Welfare Check-ins** | Read / Write | Read (Prioritized Case) | No Access | Aggregated Only |
| **Grievance Submissions** | Read / Write | Read & Action | No Access | No Access |
| **Unit Risk Prioritization Queue** | No Access | Read / Update | Read (Triage) | No Access |
| **Battalion Readiness Aggregates** | No Access | Read (Unit) | Read (Unit) | Full Read |
| **Local Data Sovereignty Purge** | Execute (Self) | No Access | No Access | No Access |

---

## 3. Data Sovereignty & Cryptographic Erase
- Personnel can execute one-touch local database wipe (`purgeAllHealthData()`), which immediately zeroes SQLite tables, sync state tokens, and baseline statistics on device.
- All database connections enforce TLS in transit and local file-level encryption at rest.
