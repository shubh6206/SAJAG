import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_PERSONNEL,
  INITIAL_CHECKINS,
  INITIAL_GRIEVANCES,
  INITIAL_INTERVENTIONS,
  INITIAL_CASE_HISTORY,
  INITIAL_AUDIT_LOGS,
  UNIT_ANALYTICS_DATA,
} from './src/data/mockData';
import {
  Personnel,
  VoluntaryCheckIn,
  WelfareGrievance,
  InterventionRecord,
  CaseHistoryEvent,
  AuditLogEntry,
  UserRole,
} from './src/types';
import {
  classifyWelfareTextLocally,
  calculateWelfareRisk,
  getMaskedGrievanceContent,
} from './src/engines/welfareEngine';
import { synthesizeUnifiedRisk } from './src/engines/unifiedRiskEngine';
import { authorizeCaseAccess, sanitizePersonnelForRole } from './src/engines/rbacEngine';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory data store for state updates during review sessions
  let personnelStore: Personnel[] = JSON.parse(JSON.stringify(INITIAL_PERSONNEL));
  let checkinStore: VoluntaryCheckIn[] = JSON.parse(JSON.stringify(INITIAL_CHECKINS));
  let grievanceStore: WelfareGrievance[] = JSON.parse(JSON.stringify(INITIAL_GRIEVANCES));
  let interventionStore: InterventionRecord[] = JSON.parse(JSON.stringify(INITIAL_INTERVENTIONS));
  let caseHistoryStore: CaseHistoryEvent[] = JSON.parse(JSON.stringify(INITIAL_CASE_HISTORY));
  let auditLogsStore: AuditLogEntry[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));

  // Helper to log audit event
  const logAudit = (officerId: string, officerRole: string, action: string, caseId?: string, details: string = '') => {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      officerId: officerId || 'WO-102',
      officerRole: officerRole || 'Welfare Officer',
      action,
      caseId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      result: 'Authorized',
      details,
    };
    auditLogsStore.unshift(entry);
    return entry;
  };

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      system: 'SAJAG Personnel Stress & Welfare Monitoring System',
      version: 'SIH26186-v2.4',
      privacyStandard: 'Data-Minimization-CAPF',
      localNLP: 'Online (Air-gapped)',
      timestamp: new Date().toISOString(),
    });
  });

  // 2. GET /api/sajag/profile?id=PX-1042
  app.get('/api/sajag/profile', (req, res) => {
    const id = (req.query.id as string) || 'PX-1042';
    const callerRole = (req.headers['x-officer-role'] as UserRole) || 'Welfare Officer';
    const callerId = (req.headers['x-officer-id'] as string) || 'WO-102';

    // RBAC Authorization Gate
    const auth = authorizeCaseAccess(callerRole, callerId, id);
    if (!auth.authorized) {
      logAudit(callerId, callerRole, 'Unauthorized Case Access Blocked', id, auth.reason || 'RBAC check failed');
      return res.status(403).json({ error: auth.reason });
    }

    const person = personnelStore.find((p) => p.id.toUpperCase() === id.toUpperCase());
    if (!person) {
      return res.status(404).json({ error: `Personnel ID ${id} not found` });
    }

    logAudit(callerId, callerRole, 'Viewed Case Review Profile', person.id, `Authorized access for role: ${callerRole}`);
    
    // Sanitize medical vs command metrics
    const sanitized = sanitizePersonnelForRole(person, callerRole);
    res.json(sanitized);
  });

  // 3. GET /api/sajag/physiological-risk?id=PX-1042
  app.get('/api/sajag/physiological-risk', (req, res) => {
    const id = (req.query.id as string) || 'PX-1042';
    const person = personnelStore.find((p) => p.id.toUpperCase() === id.toUpperCase());
    if (!person) {
      return res.status(404).json({ error: 'Personnel not found' });
    }
    res.json(person.physiological);
  });

  // 4. GET /api/sajag/operational-risk?id=PX-1042
  app.get('/api/sajag/operational-risk', (req, res) => {
    const id = (req.query.id as string) || 'PX-1042';
    const person = personnelStore.find((p) => p.id.toUpperCase() === id.toUpperCase());
    if (!person) {
      return res.status(404).json({ error: 'Personnel not found' });
    }
    res.json(person.operational);
  });

  // 5. GET /api/sajag/welfare-risk?id=PX-1042
  app.get('/api/sajag/welfare-risk', (req, res) => {
    const id = (req.query.id as string) || 'PX-1042';
    const person = personnelStore.find((p) => p.id.toUpperCase() === id.toUpperCase());
    if (!person) {
      return res.status(404).json({ error: 'Personnel not found' });
    }
    res.json(person.welfare);
  });

  // 6. GET /api/sajag/risk-assessment?id=PX-1042
  app.get('/api/sajag/risk-assessment', (req, res) => {
    const id = (req.query.id as string) || 'PX-1042';
    const person = personnelStore.find((p) => p.id.toUpperCase() === id.toUpperCase());
    if (!person) {
      return res.status(404).json({ error: 'Personnel not found' });
    }
    res.json(person.unified);
  });

  // 7. GET /api/sajag/trends?id=PX-1042
  app.get('/api/sajag/trends', (req, res) => {
    const id = (req.query.id as string) || 'PX-1042';
    const person = personnelStore.find((p) => p.id.toUpperCase() === id.toUpperCase());
    if (!person) {
      return res.status(404).json({ error: 'Personnel not found' });
    }
    res.json({
      personnelId: person.id,
      trajectoryState: person.unified.trajectoryState,
      trajectoryHistory: person.unified.trajectoryHistory,
      physiologicalTrend7d: person.physiological.trend7d,
    });
  });

  // 8. GET /api/sajag/officer/cases (Priority Case Queue & Directory)
  app.get('/api/sajag/officer/cases', (req, res) => {
    const posting = req.query.posting as string;
    const risk = req.query.risk as string;
    const search = req.query.search as string;

    let results = [...personnelStore];

    if (posting && posting !== 'All') {
      results = results.filter((p) => p.posting.toLowerCase() === posting.toLowerCase());
    }

    if (risk && risk !== 'All') {
      results = results.filter((p) => p.unified.state.toLowerCase() === risk.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      results = results.filter((p) => p.id.toLowerCase().includes(q) || p.unit.toLowerCase().includes(q));
    }

    // Sort by priority: Human Review first, then High, then Elevated, then Watch, then Stable
    const rankWeights: Record<string, number> = {
      'Human Review': 5,
      High: 4,
      Elevated: 3,
      Watch: 2,
      Stable: 1,
    };

    results.sort((a, b) => {
      const wa = rankWeights[a.unified.state] || 0;
      const wb = rankWeights[b.unified.state] || 0;
      if (wa !== wb) return wb - wa;
      return b.unified.score - a.unified.score;
    });

    res.json({
      cases: results,
      totalCount: results.length,
      priorityCount: results.filter((p) => p.unified.state === 'Human Review').length,
    });
  });

  // 9. POST /api/sajag/officer/interventions
  app.post('/api/sajag/officer/interventions', (req, res) => {
    const { personnelId, officerId, officerRole, actionType, notes, followUpDate } = req.body;

    if (!personnelId || !actionType) {
      return res.status(400).json({ error: 'personnelId and actionType are required' });
    }

    const record: InterventionRecord = {
      id: `int-${Date.now()}`,
      personnelId,
      officerId: officerId || 'WO-102',
      officerRole: officerRole || 'Welfare Officer',
      actionType,
      notes: notes || 'Welfare review conducted and follow-up scheduled.',
      followUpDate: followUpDate || 'Within 48 hours',
      timestamp: 'Just now (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')',
    };

    interventionStore.unshift(record);

    // Update personnel review status
    const targetPerson = personnelStore.find((p) => p.id === personnelId);
    if (targetPerson) {
      targetPerson.reviewStatus = 'Reviewed';
      targetPerson.lastReviewDate = 'Today';
    }

    // Add to case history
    caseHistoryStore.unshift({
      id: `evt-${Date.now()}`,
      personnelId,
      timestamp: 'Today, Just now',
      relativeTime: 'Just now',
      title: `Human Intervention: ${actionType}`,
      description: `${officerRole || 'Officer'} recorded intervention. Action: ${actionType}. Next review: ${followUpDate || 'Pending'}`,
      type: 'intervention',
    });

    logAudit(
      officerId || 'WO-102',
      officerRole || 'Welfare Officer',
      'Recorded Human Intervention',
      personnelId,
      `Action: ${actionType}. Follow-up: ${followUpDate}`
    );

    res.json({
      success: true,
      message: 'INTERVENTION RECORDED ✓',
      record,
    });
  });

  // 10. POST /api/sajag/welfare-checkin
  app.post('/api/sajag/welfare-checkin', (req, res) => {
    const { personnelId, mood, notePreview } = req.body;
    if (!personnelId || !mood) {
      return res.status(400).json({ error: 'personnelId and mood are required' });
    }

    const newCheckIn: VoluntaryCheckIn = {
      id: `chk-${Date.now()}`,
      personnelId,
      timestamp: 'Today, Just now',
      mood,
      notePreview: notePreview || 'Voluntary mood check-in',
      isFlaggedChange: mood === 'Struggling' || mood === 'Need Support',
    };

    checkinStore.unshift(newCheckIn);

    // Dynamic Welfare & Unified Risk Recalculation
    const person = personnelStore.find((p) => p.id === personnelId);
    if (person) {
      if (newCheckIn.isFlaggedChange) {
        person.welfare.recentCheckInChangeDetected = true;
        person.welfare.supportRequested = true;
      }
      const personCheckins = checkinStore.filter((c) => c.personnelId === personnelId);
      const personGrievances = grievanceStore.filter((g) => g.personnelId === personnelId);
      const updatedWelfare = calculateWelfareRisk({
        grievances: personGrievances,
        checkIns: personCheckins,
        supportRequested: person.welfare.supportRequested,
      });
      person.welfare.score = updatedWelfare.score;
      person.welfare.state = updatedWelfare.state;
      person.welfare.contributors = updatedWelfare.contributors;

      // Re-synthesize unified risk
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
      person.unified.recommendedActions = [updatedUnified.recommendedAction];
    }

    res.json({ success: true, checkIn: newCheckIn });
  });

  // 11. POST /api/sajag/grievance
  app.post('/api/sajag/grievance', (req, res) => {
    const { personnelId, category, text, urgency } = req.body;
    if (!personnelId || !category || !text) {
      return res.status(400).json({ error: 'personnelId, category and text required' });
    }

    // Local NLP classification (100% Air-gapped, zero external cloud LLM)
    const nlpResult = classifyWelfareTextLocally(text);

    const newGrv: WelfareGrievance = {
      id: `grv-${Date.now()}`,
      personnelId,
      timestamp: 'Today, Just now',
      category: (category || nlpResult.primaryCategory) as any,
      urgency: (urgency || nlpResult.urgency) as any,
      status: 'Open',
      humanReviewRequired: true,
      sourceTextMasked: nlpResult.maskedSummary,
      fullSourceText: text,
      localNLPClassification: {
        primaryCategory: `${nlpResult.primaryCategory} / Welfare Support`,
        urgency: nlpResult.urgency,
        confidenceScore: nlpResult.confidenceScore,
        model: nlpResult.modelIdentifier,
        externalTransmission: false as const,
      },
    };

    grievanceStore.unshift(newGrv);
    logAudit('PERSONNEL', 'Personnel', 'Submitted Welfare Grievance', personnelId, 'Confidential intake processed by air-gapped local NLP model');

    // Dynamic Welfare & Unified Risk Recalculation
    const person = personnelStore.find((p) => p.id === personnelId);
    if (person) {
      const personCheckins = checkinStore.filter((c) => c.personnelId === personnelId);
      const personGrievances = grievanceStore.filter((g) => g.personnelId === personnelId);
      const updatedWelfare = calculateWelfareRisk({
        grievances: personGrievances,
        checkIns: personCheckins,
        supportRequested: person.welfare.supportRequested,
      });
      person.welfare.score = updatedWelfare.score;
      person.welfare.state = updatedWelfare.state;
      person.welfare.unresolvedSignalsCount = updatedWelfare.unresolvedSignalsCount;
      person.welfare.contributors = updatedWelfare.contributors;

      // Re-synthesize unified risk
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
      person.unified.recommendedActions = [updatedUnified.recommendedAction];
    }

    res.json({ success: true, grievance: newGrv });
  });

  // 11b. POST /api/sajag/grievance/:id/reveal (Audited unmasking of sensitive grievance narrative)
  app.post('/api/sajag/grievance/:id/reveal', (req, res) => {
    const { id } = req.params;
    const callerRole = (req.headers['x-officer-role'] as UserRole) || 'Welfare Officer';
    const callerId = (req.headers['x-officer-id'] as string) || 'WO-102';

    const grievance = grievanceStore.find((g) => g.id === id);
    if (!grievance) {
      return res.status(404).json({ error: 'Grievance not found' });
    }

    // Only Welfare Officer or the author personnel can unmask
    if (callerRole !== 'Welfare Officer' && !(callerRole === 'Personnel' && callerId === grievance.personnelId)) {
      logAudit(callerId, callerRole, 'Unauthorized Grievance Unmask Blocked', grievance.personnelId, `Attempted unmasking by unauthorized role: ${callerRole}`);
      return res.status(403).json({ error: 'Permission Denied: Only authorized Welfare Officers may view sensitive source text.' });
    }

    logAudit(
      callerId,
      callerRole,
      'Unmasked Sensitive Grievance Text',
      grievance.personnelId,
      `Audited reveal for case review. Grievance ID: ${id}`
    );

    res.json({
      success: true,
      fullSourceText: grievance.fullSourceText,
    });
  });

  // 12. GET /api/sajag/demo/scenario/:id
  app.get('/api/sajag/demo/scenario/:id', (req, res) => {
    const id = req.params.id.toUpperCase();
    let targetId = 'PX-1042';

    if (id === 'A') targetId = 'PX-1091'; // High Phys, Low Welfare
    else if (id === 'B') targetId = 'PX-1042'; // Normal Biometrics, High Ops/Welfare (Killer Demo)
    else if (id === 'C') targetId = 'PX-1148'; // Recovering
    else if (id === 'D') targetId = 'PX-1205'; // Data Sparsity

    const targetPerson = personnelStore.find((p) => p.id === targetId) || personnelStore[0];

    logAudit('SYSTEM', 'Demo Engine', `Loaded Demo Scenario ${id}`, targetPerson.id, `Loaded preset scenario ${id}`);

    res.json({
      scenarioId: id,
      targetPersonnelId: targetPerson.id,
      personnel: targetPerson,
      allPersonnel: personnelStore,
      description:
        id === 'A'
          ? 'Scenario A: High Physiological Stress + Low Welfare Risk -> Rest / Recovery Recommendation'
          : id === 'B'
          ? 'Scenario B: Normal Biometrics + High Operational & Welfare Risk -> Human Review Required (Killer Demo)'
          : id === 'C'
          ? 'Scenario C: Recovering Personnel -> Decreasing Risk Trajectory'
          : 'Scenario D: Data Sparsity -> Low Confidence due to incomplete signals',
    });
  });

  // 13. GET /api/sajag/audit
  app.get('/api/sajag/audit', (req, res) => {
    res.json({
      logs: auditLogsStore,
      totalCount: auditLogsStore.length,
      securityStatus: {
        airGappedNLP: true,
        dataMinimizationActive: true,
        encryptedLocalStore: true,
        activeOfficer: 'WO-102 (Welfare Officer)',
      },
    });
  });

  // 14. GET /api/sajag/unit-analytics
  app.get('/api/sajag/unit-analytics', (req, res) => {
    res.json(UNIT_ANALYTICS_DATA);
  });

  // 15. GET /api/sajag/checkins
  app.get('/api/sajag/checkins', (req, res) => {
    const personnelId = req.query.personnelId as string;
    if (personnelId) {
      return res.json(checkinStore.filter((c) => c.personnelId === personnelId));
    }
    res.json(checkinStore);
  });

  // 16. GET /api/sajag/grievances
  app.get('/api/sajag/grievances', (req, res) => {
    const personnelId = req.query.personnelId as string;
    if (personnelId) {
      return res.json(grievanceStore.filter((g) => g.personnelId === personnelId));
    }
    res.json(grievanceStore);
  });

  // 17. GET /api/sajag/interventions
  app.get('/api/sajag/interventions', (req, res) => {
    const personnelId = req.query.personnelId as string;
    if (personnelId) {
      return res.json(interventionStore.filter((i) => i.personnelId === personnelId));
    }
    res.json(interventionStore);
  });

  // 18. GET /api/sajag/case-history
  app.get('/api/sajag/case-history', (req, res) => {
    const personnelId = (req.query.personnelId as string) || 'PX-1042';
    res.json(caseHistoryStore.filter((c) => c.personnelId === personnelId));
  });

  // Vite middleware in development or static serve in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SAJAG Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
