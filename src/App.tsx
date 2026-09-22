import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, NavTab, HASH_TO_TAB } from './components/Navigation';
import { CommandOverview } from './components/CommandOverview';
import { PersonnelDirectory } from './components/PersonnelDirectory';
import { RiskCasesView } from './components/RiskCasesView';
import { PersonnelReview } from './components/PersonnelReview';
import { AnalyticsView } from './components/AnalyticsView';
import { WelfareSignalsView } from './components/WelfareSignalsView';
import { InterventionsView } from './components/InterventionsView';
import { ReportsView } from './components/ReportsView';
import { AuditView } from './components/AuditView';
import { ApiService } from './services/api';
import {
  Personnel,
  VoluntaryCheckIn,
  WelfareGrievance,
  InterventionRecord,
  CaseHistoryEvent,
  AuditLogEntry,
  UnitAnalytics,
  UserRole,
  PostingType,
  DemoScenarioId,
} from './types';
import {
  INITIAL_PERSONNEL,
  INITIAL_CHECKINS,
  INITIAL_GRIEVANCES,
  INITIAL_INTERVENTIONS,
  INITIAL_CASE_HISTORY,
  INITIAL_AUDIT_LOGS,
  UNIT_ANALYTICS_DATA,
} from './data/mockData';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string | null>(null);

  // Operational Filters
  const [currentUnit, setCurrentUnit] = useState<string>('14th Bn BSF');
  const [currentPosting, setCurrentPosting] = useState<PostingType | 'All'>('All');
  const [currentPeriod, setCurrentPeriod] = useState<string>('Last 7 Days');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('Welfare Officer');
  const [currentScenario, setCurrentScenario] = useState<DemoScenarioId>('B');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Data Collections
  const [personnelList, setPersonnelList] = useState<Personnel[]>(INITIAL_PERSONNEL);
  const [checkins, setCheckins] = useState<VoluntaryCheckIn[]>(INITIAL_CHECKINS);
  const [grievances, setGrievances] = useState<WelfareGrievance[]>(INITIAL_GRIEVANCES);
  const [interventions, setInterventions] = useState<InterventionRecord[]>(INITIAL_INTERVENTIONS);
  const [caseHistory, setCaseHistory] = useState<CaseHistoryEvent[]>(INITIAL_CASE_HISTORY);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [analytics, setAnalytics] = useState<UnitAnalytics>(UNIT_ANALYTICS_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scenarioToast, setScenarioToast] = useState<string | null>(null);

  // Sync offline mode with ApiService
  useEffect(() => {
    ApiService.setOfflineMode(isOffline);
  }, [isOffline]);

  // Synchronize hash routing with active tab and clear individual case drill-down on tab switch
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash && HASH_TO_TAB[hash]) {
        setActiveTab(HASH_TO_TAB[hash]);
        setSelectedPersonnelId(null);
      }
    };

    const initialHash = window.location.hash.replace(/^#/, '');
    if (initialHash && HASH_TO_TAB[initialHash]) {
      setActiveTab(HASH_TO_TAB[initialHash]);
    }

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Load initial data from backend or local fallback
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const cases = await ApiService.getCases({
          posting: currentPosting,
        });
        if (cases && cases.length > 0) {
          setPersonnelList(cases);
        }

        const audit = await ApiService.getAuditLogs();
        if (audit) setAuditLogs(audit);

        const unitStats = await ApiService.getUnitAnalytics();
        if (unitStats) setAnalytics(unitStats);

        const chks = await ApiService.getCheckins();
        if (chks) setCheckins(chks);

        const grvs = await ApiService.getGrievances();
        if (grvs) setGrievances(grvs);

        const ints = await ApiService.getInterventions();
        if (ints) setInterventions(ints);
      } catch (err) {
        console.warn('Backend sync failed, relying on offline local database', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [currentPosting]);

  // Handle Scenario switching - automatically navigate immediately to respected personnel review screen
  const handleSelectScenario = async (scenarioId: DemoScenarioId) => {
    setCurrentScenario(scenarioId);
    setIsLoading(true);
    try {
      const data = await ApiService.loadScenario(scenarioId);
      setPersonnelList([...data.allCases]);

      // CRITICAL: Automatically navigate immediately to that respected personnel review screen
      setSelectedPersonnelId(data.targetPersonnel.id);
      setActiveTab('risk-cases');

      setScenarioToast(data.description);
      setTimeout(() => setScenarioToast(null), 7000);

      // Concurrently refresh auxiliary data for target personnel
      const [chks, grvs, ints, hist] = await Promise.all([
        ApiService.getCheckins(data.targetPersonnel.id),
        ApiService.getGrievances(data.targetPersonnel.id),
        ApiService.getInterventions(data.targetPersonnel.id),
        ApiService.getCaseHistory(data.targetPersonnel.id),
      ]);

      setCheckins(chks);
      setGrievances(grvs);
      setInterventions(ints);
      setCaseHistory(hist);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Select personnel to view detailed centerpiece review
  const handleSelectPersonnel = async (id: string) => {
    setSelectedPersonnelId(id);
    try {
      const [hist, grvs, chks, ints] = await Promise.all([
        ApiService.getCaseHistory(id),
        ApiService.getGrievances(id),
        ApiService.getCheckins(id),
        ApiService.getInterventions(id),
      ]);
      setCaseHistory(hist);
      setGrievances(grvs);
      setCheckins(chks);
      setInterventions(ints);
    } catch (e) {
      console.warn(e);
    }
  };

  // Save intervention handler
  const handleSaveIntervention = async (
    actionType: InterventionRecord['actionType'],
    notes: string,
    followUpDate: string
  ) => {
    if (!selectedPersonnelId) return;
    const newRecord = await ApiService.recordIntervention({
      personnelId: selectedPersonnelId,
      officerId: 'WO-102',
      officerRole: currentRole,
      actionType,
      notes,
      followUpDate,
    });

    setInterventions((prev) => [newRecord, ...prev]);

    // Update personnel state locally
    setPersonnelList((prev) =>
      prev.map((p) =>
        p.id === selectedPersonnelId
          ? { ...p, reviewStatus: 'Reviewed', lastReviewDate: 'Today' }
          : p
      )
    );

    // Refresh case history & audit logs
    const hist = await ApiService.getCaseHistory(selectedPersonnelId);
    setCaseHistory(hist);
    const audit = await ApiService.getAuditLogs();
    setAuditLogs(audit);
  };

  // Submit Grievance handler
  const handleSubmitGrievance = async (
    personnelId: string,
    category: string,
    text: string,
    urgency: string
  ) => {
    try {
      const newGrv = await ApiService.submitGrievance({
        personnelId,
        category,
        text,
        urgency,
      });
      setGrievances((prev) => [newGrv, ...prev]);

      // Refresh personnel and audit logs
      const updatedCases = await ApiService.getCases({ posting: currentPosting });
      setPersonnelList(updatedCases);
      const audit = await ApiService.getAuditLogs();
      setAuditLogs(audit);
    } catch (e) {
      console.warn('Grievance submission error', e);
    }
  };

  // Submit Check-in handler
  const handleSubmitCheckin = async (
    personnelId: string,
    mood: VoluntaryCheckIn['mood'],
    note: string
  ) => {
    try {
      const newChk = await ApiService.submitCheckin({
        personnelId,
        mood,
        notePreview: note,
      });
      setCheckins((prev) => [newChk, ...prev]);

      // Refresh personnel list
      const updatedCases = await ApiService.getCases({ posting: currentPosting });
      setPersonnelList(updatedCases);
    } catch (e) {
      console.warn('Checkin submission error', e);
    }
  };

  // Active personnel being reviewed
  const selectedPersonnel = selectedPersonnelId
    ? personnelList.find((p) => p.id === selectedPersonnelId) || personnelList[0]
    : null;

  // Counts for navigation badges
  const priorityCasesCount = personnelList.filter((p) => p.unified.state === 'Human Review').length;
  const unresolvedGrievancesCount = grievances.filter((g) => g.status === 'Open').length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentUnit={currentUnit}
        onUnitChange={setCurrentUnit}
        currentPosting={currentPosting}
        onPostingChange={setCurrentPosting}
        currentPeriod={currentPeriod}
        onPeriodChange={setCurrentPeriod}
        isOffline={isOffline}
        onToggleOffline={() => setIsOffline(!isOffline)}
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        currentScenario={currentScenario}
        onSelectScenario={handleSelectScenario}
      />

      {/* Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedPersonnelId(null); // CRITICAL: Ensures clicking any nav button immediately switches view in all scenarios
          if (tab === 'risk-cases') {
            setSelectedCategoryFilter(null);
          }
        }}
        priorityCount={priorityCasesCount}
        unresolvedWelfareCount={unresolvedGrievancesCount}
        isViewingPersonnel={Boolean(selectedPersonnel)}
        selectedPersonnelId={selectedPersonnel?.id || null}
        onReturnFromPersonnel={() => setSelectedPersonnelId(null)}
      />

      {/* Scenario Banner Notification */}
      {scenarioToast && (
        <div className="bg-slate-900 text-white px-4 py-2 text-xs border-b border-teal-500/40 flex flex-wrap items-center justify-between gap-3 font-mono animate-in fade-in slide-in-from-top-2 duration-200 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping shrink-0"></span>
            <span className="font-bold text-teal-300 shrink-0">SCENARIO {currentScenario}:</span>
            <span className="text-slate-200">{scenarioToast}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {selectedPersonnel && (
              <span className="bg-teal-950/80 border border-teal-500/40 text-teal-300 px-2 py-0.5 rounded text-[11px] font-bold">
                Navigated to {selectedPersonnel.id} ({selectedPersonnel.rank})
              </span>
            )}
            <button
              onClick={() => setScenarioToast(null)}
              className="text-slate-400 hover:text-white text-base leading-none px-1 cursor-pointer"
              title="Dismiss"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* If an individual personnel is selected, show the centerpiece PERSONNEL REVIEW view */}
        {selectedPersonnel ? (
          <PersonnelReview
            person={selectedPersonnel}
            onBack={() => setSelectedPersonnelId(null)}
            currentRole={currentRole}
            grievances={grievances.filter((g) => g.personnelId === selectedPersonnel.id)}
            checkins={checkins.filter((c) => c.personnelId === selectedPersonnel.id)}
            interventions={interventions.filter((i) => i.personnelId === selectedPersonnel.id)}
            caseHistory={caseHistory.filter((c) => c.personnelId === selectedPersonnel.id)}
            onSaveIntervention={handleSaveIntervention}
          />
        ) : (
          <>
            {activeTab === 'overview' && (
              <CommandOverview
                personnelList={personnelList}
                onSelectPersonnel={handleSelectPersonnel}
                selectedCategoryFilter={selectedCategoryFilter}
                onSelectCategoryFilter={setSelectedCategoryFilter}
                onLoadScenario={handleSelectScenario}
              />
            )}

            {activeTab === 'personnel' && (
              <PersonnelDirectory
                personnelList={personnelList}
                onSelectPersonnel={handleSelectPersonnel}
              />
            )}

            {activeTab === 'risk-cases' && (
              <RiskCasesView
                personnelList={personnelList}
                onSelectPersonnel={handleSelectPersonnel}
                initialCategoryFilter={selectedCategoryFilter}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView
                analytics={analytics}
                onSelectPersonnel={handleSelectPersonnel}
              />
            )}

            {activeTab === 'welfare' && (
              <WelfareSignalsView
                grievances={grievances}
                checkins={checkins}
                currentRole={currentRole}
                onSubmitGrievance={handleSubmitGrievance}
                onSubmitCheckin={handleSubmitCheckin}
                onSelectPersonnel={handleSelectPersonnel}
              />
            )}

            {activeTab === 'interventions' && (
              <InterventionsView
                interventions={interventions}
                onSelectPersonnel={handleSelectPersonnel}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                analytics={analytics}
                personnelList={personnelList}
                onSelectPersonnel={handleSelectPersonnel}
              />
            )}

            {activeTab === 'audit' && (
              <AuditView
                auditLogs={auditLogs}
                currentRole={currentRole}
                onRoleChange={setCurrentRole}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-6 text-slate-400 text-xs flex flex-wrap items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200">SAJAG &bull; SIH26186</span>
          <span>&bull;</span>
          <span>Ministry of Home Affairs, Govt. of India</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Data Minimization Standard: Active</span>
          <span>&bull;</span>
          <span className="text-emerald-400">Air-Gapped Container: Verified</span>
          <span>&bull;</span>
          <span>Local Latency: 12ms</span>
        </div>
      </footer>
    </div>
  );
}
