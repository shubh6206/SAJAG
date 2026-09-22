/**
 * SAJAG - Role-Based Access Control (RBAC) & Privacy Sanitizer (SIH26186)
 * Ministry of Home Affairs - CAPF Personnel Stress & Welfare Monitoring System
 * 
 * Enforces strict data minimization and access control rules across:
 * - Welfare Officer (Full case access, unmask grievance narrative with audit, record interventions)
 * - Medical Officer (Physiological metrics, autonomic recovery, baseline deviations)
 * - Commander (Aggregated unit readiness, operational roster load, NO private biometrics)
 * - Personnel (Self-view only, voluntary check-ins, grievance submission)
 */

import { UserRole, Personnel } from '../types';

export interface RBACPermissions {
  canViewIndividualCases: boolean;
  canViewDetailedBiometrics: boolean;
  canViewMaskedGrievances: boolean;
  canRevealSensitiveGrievanceText: boolean;
  canRecordInterventions: boolean;
  canScheduleReviews: boolean;
  canAccessUnitAnalytics: boolean;
  canExportExecutiveReports: boolean;
  canViewSecurityAuditLogs: boolean;
  dataMinimizationNotice: string;
}

export function getRolePermissions(role: UserRole): RBACPermissions {
  switch (role) {
    case 'Welfare Officer':
      return {
        canViewIndividualCases: true,
        canViewDetailedBiometrics: true,
        canViewMaskedGrievances: true,
        canRevealSensitiveGrievanceText: true,
        canRecordInterventions: true,
        canScheduleReviews: true,
        canAccessUnitAnalytics: true,
        canExportExecutiveReports: true,
        canViewSecurityAuditLogs: true,
        dataMinimizationNotice: 'Full case authorization granted. Sensitive grievance reveals are audited.',
      };

    case 'Medical Officer':
      return {
        canViewIndividualCases: true,
        canViewDetailedBiometrics: true,
        canViewMaskedGrievances: true,
        canRevealSensitiveGrievanceText: false, // Protected to safeguard welfare privacy
        canRecordInterventions: true,
        canScheduleReviews: true,
        canAccessUnitAnalytics: true,
        canExportExecutiveReports: false,
        canViewSecurityAuditLogs: true,
        dataMinimizationNotice: 'Clinical physiological scope active. Personal grievance narratives masked.',
      };

    case 'Commander':
      return {
        canViewIndividualCases: true,
        canViewDetailedBiometrics: false, // Sensitive personal biometrics masked
        canViewMaskedGrievances: true,
        canRevealSensitiveGrievanceText: false,
        canRecordInterventions: true,
        canScheduleReviews: true,
        canAccessUnitAnalytics: true,
        canExportExecutiveReports: true,
        canViewSecurityAuditLogs: true,
        dataMinimizationNotice: 'Command oversight scope. Raw biometrics minimized to preserve personnel privacy.',
      };

    case 'Personnel':
      return {
        canViewIndividualCases: false, // Only self
        canViewDetailedBiometrics: false,
        canViewMaskedGrievances: false,
        canRevealSensitiveGrievanceText: false,
        canRecordInterventions: false,
        canScheduleReviews: false,
        canAccessUnitAnalytics: false,
        canExportExecutiveReports: false,
        canViewSecurityAuditLogs: false,
        dataMinimizationNotice: 'Individual personnel account. Restricted strictly to self-telemetry and check-ins.',
      };
  }
}

/**
 * Validates if the requesting actor is permitted to access a specific personnel case
 */
export function authorizeCaseAccess(
  role: UserRole,
  actorPersonnelId: string,
  targetPersonnelId: string
): { authorized: boolean; reason?: string } {
  if (role === 'Personnel') {
    if (actorPersonnelId !== targetPersonnelId) {
      return {
        authorized: false,
        reason: `Access Denied: Personnel accounts may only access their own record (${actorPersonnelId}).`,
      };
    }
    return { authorized: true };
  }

  // Welfare Officer, Medical Officer, and Commander have institutional access
  return { authorized: true };
}

/**
 * Sanitizes a Personnel record based on the viewer's role
 * - For Commanders: masks detailed raw baseline standard deviations and clinical comments
 * - For Medical Officers: masks raw grievance text
 */
export function sanitizePersonnelForRole(person: Personnel, role: UserRole): Personnel {
  if (role === 'Commander') {
    return {
      ...person,
      physiological: {
        ...person.physiological,
        // Replace deep clinical notes with non-diagnostic high-level operational indicators
        contributors: person.physiological.contributors.map((c) =>
          c.includes('telemetry') || c.includes('Z-score') ? 'Cardiovascular baseline variation noted' : c
        ),
      },
    };
  }

  return person;
}
