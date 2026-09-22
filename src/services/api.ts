import {
  Personnel,
  VoluntaryCheckIn,
  WelfareGrievance,
  InterventionRecord,
  CaseHistoryEvent,
  AuditLogEntry,
  UnitAnalytics,
  DemoScenarioId,
} from '../types';
import {
  INITIAL_PERSONNEL,
  INITIAL_CHECKINS,
  INITIAL_GRIEVANCES,
  INITIAL_INTERVENTIONS,
  INITIAL_CASE_HISTORY,
  INITIAL_AUDIT_LOGS,
  UNIT_ANALYTICS_DATA,
} from '../data/mockData';
import {
  classifyWelfareTextLocally,
  calculateWelfareRisk,
} from '../engines/welfareEngine';
import { synthesizeUnifiedRisk } from '../engines/unifiedRiskEngine';

// Local storage fallback cache for true offline operations
let localPersonnelCache: Personnel[] = JSON.parse(JSON.stringify(INITIAL_PERSONNEL));
let localCheckinsCache: VoluntaryCheckIn[] = JSON.parse(JSON.stringify(INITIAL_CHECKINS));
let localGrievancesCache: WelfareGrievance[] = JSON.parse(JSON.stringify(INITIAL_GRIEVANCES));
let localInterventionsCache: InterventionRecord[] = JSON.parse(JSON.stringify(INITIAL_INTERVENTIONS));
let localCaseHistoryCache: CaseHistoryEvent[] = JSON.parse(JSON.stringify(INITIAL_CASE_HISTORY));
let localAuditCache: AuditLogEntry[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
let forceOffline = false;

// Safe fetch helper to ensure response is valid JSON and not an HTML SPA fallback
async function safeFetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return (await res.json()) as T;
    }
  } catch {
    // Network failure or offline
  }
  return null;
}

export const ApiService = {
  setOfflineMode(offline: boolean) {
    forceOffline = offline;
  },

  isOfflineMode(): boolean {
    return forceOffline;
  },

  // Check health / backend connection
  async checkHealth(): Promise<boolean> {
    if (forceOffline) return false;
    try {
      const res = await fetch('/api/health');
      const contentType = res.headers.get('content-type') || '';
      return res.ok && contentType.includes('application/json');
    } catch {
      return false;
    }
  },

  // Fetch all or filtered personnel cases
  async getCases(filter?: { posting?: string; risk?: string; search?: string }): Promise<Personnel[]> {
    if (!forceOffline) {
      const query = new URLSearchParams();
      if (filter?.posting) query.set('posting', filter.posting);
      if (filter?.risk) query.set('risk', filter.risk);
      if (filter?.search) query.set('search', filter.search);

      const data = await safeFetchJson<{ cases: Personnel[] }>(`/api/sajag/officer/cases?${query.toString()}`);
      if (data && Array.isArray(data.cases)) {
        localPersonnelCache = data.cases;
        return data.cases;
      }
    }

    // Offline fallback
    let list = [...localPersonnelCache];
    if (filter?.posting && filter.posting !== 'All') {
      list = list.filter((p) => p.posting.toLowerCase() === filter.posting?.toLowerCase());
    }
    if (filter?.risk && filter.risk !== 'All') {
      list = list.filter((p) => p.unified.state.toLowerCase() === filter.risk?.toLowerCase());
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((p) => p.id.toLowerCase().includes(q) || p.unit.toLowerCase().includes(q));
    }
    return list;
  },

  // Fetch single personnel details
  async getPersonnel(id: string): Promise<Personnel> {
    if (!forceOffline) {
      const data = await safeFetchJson<Personnel>(`/api/sajag/profile?id=${encodeURIComponent(id)}`);
      if (data && data.id) {
        return data;
      }
    }

    const found = localPersonnelCache.find((p) => p.id.toUpperCase() === id.toUpperCase());
    if (found) return found;
    return localPersonnelCache[0];
  },

  // Fetch interventions for personnel or all
  async getInterventions(personnelId?: string): Promise<InterventionRecord[]> {
    if (!forceOffline) {
      const url = personnelId
        ? `/api/sajag/interventions?personnelId=${encodeURIComponent(personnelId)}`
        : `/api/sajag/interventions`;
      const data = await safeFetchJson<InterventionRecord[]>(url);
      if (data && Array.isArray(data)) {
        return data;
      }
    }

    if (personnelId) {
      return localInterventionsCache.filter((i) => i.personnelId === personnelId);
    }
    return localInterventionsCache;
  },

  // Record a new intervention
  async recordIntervention(payload: {
    personnelId: string;
    officerId: string;
    officerRole: string;
    actionType: InterventionRecord['actionType'];
    notes: string;
    followUpDate: string;
  }): Promise<InterventionRecord> {
    const record: InterventionRecord = {
      id: `int-${Date.now()}`,
      personnelId: payload.personnelId,
      officerId: payload.officerId || 'WO-102',
      officerRole: payload.officerRole || 'Welfare Officer',
      actionType: payload.actionType,
      notes: payload.notes,
      followUpDate: payload.followUpDate || 'Within 48 hours',
      timestamp: 'Today (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')',
    };

    if (!forceOffline) {
      const data = await safeFetchJson<{ record?: InterventionRecord }>('/api/sajag/officer/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (data && data.record) {
        return data.record;
      }
    }

    // Local fallback update
    localInterventionsCache.unshift(record);

    // Update target person review status in local cache
    const target = localPersonnelCache.find((p) => p.id === payload.personnelId);
    if (target) {
      target.reviewStatus = 'Reviewed';
      target.lastReviewDate = 'Today';
    }

    localCaseHistoryCache.unshift({
      id: `evt-${Date.now()}`,
      personnelId: payload.personnelId,
      timestamp: 'Today, Just now',
      relativeTime: 'Just now',
      title: `Human Intervention: ${payload.actionType}`,
      description: `${payload.officerRole} recorded action: ${payload.actionType}. Next review: ${payload.followUpDate}`,
      type: 'intervention',
    });

    localAuditCache.unshift({
      id: `aud-${Date.now()}`,
      officerId: payload.officerId || 'WO-102',
      officerRole: payload.officerRole || 'Welfare Officer',
      action: 'Recorded Human Intervention',
      caseId: payload.personnelId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      result: 'Authorized',
      details: `Action: ${payload.actionType}. Follow-up: ${payload.followUpDate}`,
    });

    return record;
  },

  // Fetch case history
  async getCaseHistory(personnelId: string): Promise<CaseHistoryEvent[]> {
    if (!forceOffline) {
      const data = await safeFetchJson<CaseHistoryEvent[]>(`/api/sajag/case-history?personnelId=${encodeURIComponent(personnelId)}`);
      if (data && Array.isArray(data)) {
        return data;
      }
    }

    return localCaseHistoryCache.filter((c) => c.personnelId === personnelId);
  },

  // Fetch grievances
  async getGrievances(personnelId?: string): Promise<WelfareGrievance[]> {
    if (!forceOffline) {
      const url = personnelId
        ? `/api/sajag/grievances?personnelId=${encodeURIComponent(personnelId)}`
        : `/api/sajag/grievances`;
      const data = await safeFetchJson<WelfareGrievance[]>(url);
      if (data && Array.isArray(data)) {
        return data;
      }
    }

    if (personnelId) {
      return localGrievancesCache.filter((g) => g.personnelId === personnelId);
    }
    return localGrievancesCache;
  },

  // Fetch check-ins
  async getCheckins(personnelId?: string): Promise<VoluntaryCheckIn[]> {
    if (!forceOffline) {
      const url = personnelId
        ? `/api/sajag/checkins?personnelId=${encodeURIComponent(personnelId)}`
        : `/api/sajag/checkins`;
      const data = await safeFetchJson<VoluntaryCheckIn[]>(url);
      if (data && Array.isArray(data)) {
        return data;
      }
    }

    if (personnelId) {
      return localCheckinsCache.filter((c) => c.personnelId === personnelId);
    }
    return localCheckinsCache;
  },

  // Fetch Unit Analytics
  async getUnitAnalytics(): Promise<UnitAnalytics> {
    if (!forceOffline) {
      const data = await safeFetchJson<UnitAnalytics>('/api/sajag/unit-analytics');
      if (data) {
        return data;
      }
    }
    return UNIT_ANALYTICS_DATA;
  },

  // Fetch Audit Logs
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    if (!forceOffline) {
      const data = await safeFetchJson<{ logs: AuditLogEntry[] }>('/api/sajag/audit');
      if (data && Array.isArray(data.logs)) {
        return data.logs;
      }
    }
    return localAuditCache;
  },

  // Load deterministic demo scenario (A, B, C, D)
  async loadScenario(scenarioId: DemoScenarioId): Promise<{
    targetPersonnel: Personnel;
    allCases: Personnel[];
    description: string;
  }> {
    if (!forceOffline) {
      const data = await safeFetchJson<{
        personnel: Personnel;
        allPersonnel: Personnel[];
        description: string;
      }>(`/api/sajag/demo/scenario/${scenarioId}`);
      if (data && data.personnel) {
        return {
          targetPersonnel: data.personnel,
          allCases: data.allPersonnel,
          description: data.description,
        };
      }
    }

    let targetId = 'PX-1042';
    if (scenarioId === 'A') targetId = 'PX-1091';
    else if (scenarioId === 'B') targetId = 'PX-1042';
    else if (scenarioId === 'C') targetId = 'PX-1148';
    else if (scenarioId === 'D') targetId = 'PX-1205';

    const target = localPersonnelCache.find((p) => p.id === targetId) || localPersonnelCache[0];

    const description =
      scenarioId === 'A'
        ? 'Scenario A: High Physiological Stress + Low Welfare Risk -> Rest / Recovery Recommendation'
        : scenarioId === 'B'
        ? 'Scenario B: Normal Biometrics + High Operational & Welfare Risk -> Human Review Required (Killer Demo)'
        : scenarioId === 'C'
        ? 'Scenario C: Recovering Personnel -> Decreasing Risk Trajectory'
        : 'Scenario D: Data Sparsity -> Low Confidence due to incomplete signals';

    return {
      targetPersonnel: target,
      allCases: localPersonnelCache,
      description,
    };
  },

  // Submit confidential welfare grievance
  async submitGrievance(payload: {
    personnelId: string;
    category: string;
    text: string;
    urgency?: string;
  }): Promise<WelfareGrievance> {
    if (!forceOffline) {
      const data = await safeFetchJson<{ grievance?: WelfareGrievance }>('/api/sajag/grievance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (data && data.grievance) {
        localGrievancesCache.unshift(data.grievance);
        return data.grievance;
      }
    }

    // Air-gapped local fallback processing
    const nlp = classifyWelfareTextLocally(payload.text);
    const newGrv: WelfareGrievance = {
      id: `grv-${Date.now()}`,
      personnelId: payload.personnelId,
      timestamp: 'Today, Just now',
      category: (payload.category || nlp.primaryCategory) as any,
      urgency: (payload.urgency || nlp.urgency) as any,
      status: 'Open',
      humanReviewRequired: true,
      sourceTextMasked: nlp.maskedSummary,
      fullSourceText: payload.text,
      localNLPClassification: {
        primaryCategory: `${nlp.primaryCategory} / Welfare Support`,
        urgency: nlp.urgency,
        confidenceScore: nlp.confidenceScore,
        model: nlp.modelIdentifier,
        externalTransmission: false as const,
      },
    };

    localGrievancesCache.unshift(newGrv);

    // Update target person local risk
    const person = localPersonnelCache.find((p) => p.id === payload.personnelId);
    if (person) {
      const personGrievances = localGrievancesCache.filter((g) => g.personnelId === payload.personnelId);
      const personCheckins = localCheckinsCache.filter((c) => c.personnelId === payload.personnelId);
      const updatedWelfare = calculateWelfareRisk({
        grievances: personGrievances,
        checkIns: personCheckins,
        supportRequested: person.welfare.supportRequested,
      });
      person.welfare.score = updatedWelfare.score;
      person.welfare.state = updatedWelfare.state;
      person.welfare.unresolvedSignalsCount = updatedWelfare.unresolvedSignalsCount;
      person.welfare.contributors = updatedWelfare.contributors;

      const updatedUnified = synthesizeUnifiedRisk({
        physiologicalScore: person.physiological.score,
        physiologicalConfidence: person.physiological.confidence,
        operationalScore: person.operational.score,
        welfareScore: person.welfare.score,
        history7d: person.unified.trajectoryHistory,
        baselineCalibrated: person.unified.confidence !== 'LOW',
        unresolvedGrievancesCount: updatedWelfare.unresolvedSignalsCount,
        consecutiveDutyDays: person.operational.consecutiveDutyDays,
      });
      person.unified.score = updatedUnified.score;
      person.unified.state = updatedUnified.state;
      person.unified.whyFlagged = updatedUnified.whyFlagged;
    }

    localAuditCache.unshift({
      id: `aud-${Date.now()}`,
      officerId: 'PERSONNEL',
      officerRole: 'Personnel',
      action: 'Submitted Welfare Grievance',
      caseId: payload.personnelId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      result: 'Authorized',
      details: 'Air-gapped confidential intake processed locally',
    });

    return newGrv;
  },

  // Submit voluntary check-in
  async submitCheckin(payload: {
    personnelId: string;
    mood: VoluntaryCheckIn['mood'];
    notePreview?: string;
  }): Promise<VoluntaryCheckIn> {
    if (!forceOffline) {
      const data = await safeFetchJson<{ checkIn?: VoluntaryCheckIn }>('/api/sajag/welfare-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (data && data.checkIn) {
        localCheckinsCache.unshift(data.checkIn);
        return data.checkIn;
      }
    }

    const newCheckIn: VoluntaryCheckIn = {
      id: `chk-${Date.now()}`,
      personnelId: payload.personnelId,
      timestamp: 'Today, Just now',
      mood: payload.mood,
      notePreview: payload.notePreview || 'Voluntary mood check-in',
      isFlaggedChange: payload.mood === 'Struggling' || payload.mood === 'Need Support',
    };

    localCheckinsCache.unshift(newCheckIn);

    const person = localPersonnelCache.find((p) => p.id === payload.personnelId);
    if (person && newCheckIn.isFlaggedChange) {
      person.welfare.recentCheckInChangeDetected = true;
      person.welfare.supportRequested = true;
    }

    return newCheckIn;
  },

  // Audited reveal of grievance narrative
  async revealGrievance(grievanceId: string): Promise<{ success: boolean; fullSourceText?: string }> {
    if (!forceOffline) {
      const data = await safeFetchJson<{ success: boolean; fullSourceText?: string }>(
        `/api/sajag/grievance/${encodeURIComponent(grievanceId)}/reveal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-officer-role': 'Welfare Officer',
            'x-officer-id': 'WO-102',
          },
        }
      );
      if (data) {
        return data;
      }
    }

    const g = localGrievancesCache.find((item) => item.id === grievanceId);
    localAuditCache.unshift({
      id: `audit-${Date.now()}`,
      officerId: 'WO-102',
      officerRole: 'Welfare Officer',
      action: 'Unmasked Sensitive Grievance Text',
      caseId: g ? g.personnelId : 'Unknown',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      result: 'Authorized',
      details: `Local audited unmasking for grievance ${grievanceId}`,
    });

    return { success: true, fullSourceText: g?.fullSourceText };
  },
};
