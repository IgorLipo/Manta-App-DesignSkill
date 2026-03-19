import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { JobStatus } from '../../stores/jobStore';

interface StatusBadgeProps {
  status: JobStatus;
}

const STATUS_CONFIG: Record<JobStatus, { label: string; bgColor: string; textColor: string }> = {
  DRAFT: { label: 'Draft', bgColor: '#f1f5f9', textColor: '#64748b' },
  AWAITING_OWNER_SUBMISSION: { label: 'Awaiting Photos', bgColor: '#fef3c7', textColor: '#d97706' },
  SUBMITTED: { label: 'Submitted', bgColor: '#dbeafe', textColor: '#2563eb' },
  NEEDS_MORE_INFO: { label: 'More Info Needed', bgColor: '#ffedd5', textColor: '#f97316' },
  VALIDATED: { label: 'Validated', bgColor: '#ccfbf1', textColor: '#0d9488' },
  ASSIGNED_TO_SCAFFOLDER: { label: 'Scaffolder Assigned', bgColor: '#f3e8ff', textColor: '#9333ea' },
  QUOTE_PENDING: { label: 'Quote Pending', bgColor: '#e0e7ff', textColor: '#4f46e5' },
  QUOTE_SUBMITTED: { label: 'Quote Submitted', bgColor: '#dbeafe', textColor: '#2563eb' },
  QUOTE_REVISION_REQUESTED: { label: 'Revision Requested', bgColor: '#ffedd5', textColor: '#f97316' },
  QUOTE_APPROVED: { label: 'Quote Approved', bgColor: '#dcfce7', textColor: '#16a34a' },
  QUOTE_REJECTED: { label: 'Quote Rejected', bgColor: '#fee2e2', textColor: '#dc2626' },
  SCHEDULING_IN_PROGRESS: { label: 'Scheduling', bgColor: '#cffafe', textColor: '#0891b2' },
  SCHEDULED: { label: 'Scheduled', bgColor: '#e0f2fe', textColor: '#0284c7' },
  SCAFFOLD_WORK_IN_PROGRESS: { label: 'Scaffold in Progress', bgColor: '#fef9c3', textColor: '#ca8a04' },
  SCAFFOLD_COMPLETE: { label: 'Scaffold Complete', bgColor: '#d1fae5', textColor: '#059669' },
  INSTALLER_ASSIGNED: { label: 'Installer Assigned', bgColor: '#ede9fe', textColor: '#7c3aed' },
  SITE_REPORT_PENDING: { label: 'Report Pending', bgColor: '#fce7f3', textColor: '#db2777' },
  SITE_REPORT_IN_PROGRESS: { label: 'Report In Progress', bgColor: '#ffe4e6', textColor: '#e11d48' },
  SITE_REPORT_SUBMITTED: { label: 'Report Submitted', bgColor: '#dcfce7', textColor: '#059669' },
  COMPLETED: { label: 'Completed', bgColor: '#dcfce7', textColor: '#059669' },
  CANCELLED: { label: 'Cancelled', bgColor: '#f1f5f9', textColor: '#64748b' },
  ON_HOLD: { label: 'On Hold', bgColor: '#f3e8ff', textColor: '#9333ea' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
      <Text style={[styles.text, { color: config.textColor }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
