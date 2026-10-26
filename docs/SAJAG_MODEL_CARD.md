# SAJAG Model Card & Scientific Specification
**Model**: SAJAG Tri-Pillar Early Warning & Welfare Intelligence  
**Version**: 2.0.0-Prototype (SIH26186) | **Organization**: Ministry of Home Affairs  

---

## 1. Intended Use
- **Primary Use Case**: Early-warning decision support for personnel welfare officers and uniformed personnel.
- **Intended Population**: Police, Central Armed Police Forces (CAPF), and security personnel under rigorous shift rotations.
- **Out of Scope & Prohibited Uses**:
  - Autonomous clinical psychiatric diagnosis (e.g. PTSD, depression, bipolar disorder, suicidality).
  - Autonomous disciplinary or punitive personnel actions.
  - Workplace surveillance or unauthorized administrative monitoring.

---

## 2. Model Architecture & Formulations
1. **Physiological Stress Engine**: Computes normalized deviation $Z_{\text{RHR}}$ and sleep deficit against individual historical baselines.
2. **Operational Fatigue Engine**: Deterministic calculation of shift load, night duty frequency, and elapsed leave days.
3. **Welfare NLP Engine**: Local keyword and distress indicator parser for grievance classification into 7 operational domains.
4. **Synthesis Engine**: Weighted tri-pillar integration with temporal persistence thresholding ($\ge 4$ consecutive elevated days triggers human review).

---

## 3. Benchmark Datasets & Validation
- **Laboratory Benchmarks**: WESAD (Wearable Stress and Affect Detection) and SWELL-KW (Stress and Workload in Knowledge Work).
- **Provenance Statement**: Public research datasets are used strictly for sensor algorithm calibration and laboratory bench testing. They are NOT claimed to represent military or tactical field operations.
