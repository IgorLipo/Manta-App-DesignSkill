import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';

interface TimelineStep {
  id: string;
  label: string;
  timestamp?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface TimelineProps {
  steps: TimelineStep[];
}

export function Timeline({ steps }: TimelineProps) {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={step.id} style={styles.stepContainer}>
          <View style={styles.stepIndicator}>
            <View
              style={[
                styles.circle,
                step.isCompleted && styles.circleCompleted,
                step.isCurrent && styles.circleCurrent,
              ]}
            >
              {step.isCompleted ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    step.isCurrent && styles.stepNumberCurrent,
                  ]}
                >
                  {index + 1}
                </Text>
              )}
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.line,
                  step.isCompleted && styles.lineCompleted,
                ]}
              />
            )}
          </View>

          <View style={styles.stepContent}>
            <Text
              style={[
                styles.stepLabel,
                step.isCurrent && styles.stepLabelCurrent,
              ]}
            >
              {step.label}
            </Text>
            {step.timestamp && (
              <Text style={styles.timestamp}>
                {format(new Date(step.timestamp), 'MMM d, yyyy h:mm a')}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

// Default status timeline for jobs
export function getJobTimeline(status: string): TimelineStep[] {
  const timelineMap: Record<string, TimelineStep[]> = {
    DRAFT: [
      { id: '1', label: 'Started', isCompleted: true, isCurrent: false },
      { id: '2', label: 'Awaiting Photos', isCompleted: false, isCurrent: true },
    ],
    AWAITING_OWNER_SUBMISSION: [
      { id: '1', label: 'Started', isCompleted: true, isCurrent: false },
      { id: '2', label: 'Awaiting Photos', isCompleted: true, isCurrent: true },
    ],
    SUBMITTED: [
      { id: '1', label: 'Started', isCompleted: true, isCurrent: false },
      { id: '2', label: 'Photos Submitted', isCompleted: true, isCurrent: true },
      { id: '3', label: 'In Review', isCompleted: false, isCurrent: false },
    ],
    VALIDATED: [
      { id: '1', label: 'Started', isCompleted: true, isCurrent: false },
      { id: '2', label: 'Photos Submitted', isCompleted: true, isCurrent: false },
      { id: '3', label: 'Validated', isCompleted: true, isCurrent: true },
      { id: '4', label: 'Scaffolder Assigned', isCompleted: false, isCurrent: false },
    ],
    ASSIGNED_TO_SCAFFOLDER: [
      { id: '1', label: 'Started', isCompleted: true, isCurrent: false },
      { id: '2', label: 'Photos Submitted', isCompleted: true, isCurrent: false },
      { id: '3', label: 'Validated', isCompleted: true, isCurrent: false },
      { id: '4', label: 'Scaffolder Assigned', isCompleted: true, isCurrent: true },
      { id: '5', label: 'Quote Submitted', isCompleted: false, isCurrent: false },
    ],
    QUOTE_APPROVED: [
      { id: '1', label: 'Started', isCompleted: true, isCurrent: false },
      { id: '2', label: 'Photos Submitted', isCompleted: true, isCurrent: false },
      { id: '3', label: 'Validated', isCompleted: true, isCurrent: false },
      { id: '4', label: 'Scaffolder Assigned', isCompleted: true, isCurrent: false },
      { id: '5', label: 'Quote Approved', isCompleted: true, isCurrent: true },
      { id: '6', label: 'Scheduled', isCompleted: false, isCurrent: false },
    ],
    SCHEDULED: [
      { id: '1', label: 'Started', isCompleted: true, isCurrent: false },
      { id: '2', label: 'Photos Submitted', isCompleted: true, isCurrent: false },
      { id: '3', label: 'Validated', isCompleted: true, isCurrent: false },
      { id: '4', label: 'Scaffolder Assigned', isCompleted: true, isCurrent: false },
      { id: '5', label: 'Quote Approved', isCompleted: true, isCurrent: false },
      { id: '6', label: 'Scheduled', isCompleted: true, isCurrent: true },
    ],
    SCAFFOLD_COMPLETE: [
      { id: '1', label: 'Started', isCompleted: true, isCurrent: false },
      { id: '2', label: 'Photos Submitted', isCompleted: true, isCurrent: false },
      { id: '3', label: 'Validated', isCompleted: true, isCurrent: false },
      { id: '4', label: 'Scaffolder Assigned', isCompleted: true, isCurrent: false },
      { id: '5', label: 'Quote Approved', isCompleted: true, isCurrent: false },
      { id: '6', label: 'Scheduled', isCompleted: true, isCurrent: false },
      { id: '7', label: 'Scaffold Complete', isCompleted: true, isCurrent: true },
    ],
    COMPLETED: [
      { id: '1', label: 'Started', isCompleted: true, isCurrent: false },
      { id: '2', label: 'Photos Submitted', isCompleted: true, isCurrent: false },
      { id: '3', label: 'Validated', isCompleted: true, isCurrent: false },
      { id: '4', label: 'Scaffolder Assigned', isCompleted: true, isCurrent: false },
      { id: '5', label: 'Quote Approved', isCompleted: true, isCurrent: false },
      { id: '6', label: 'Scheduled', isCompleted: true, isCurrent: false },
      { id: '7', label: 'Scaffold Complete', isCompleted: true, isCurrent: false },
      { id: '8', label: 'Completed', isCompleted: true, isCurrent: true },
    ],
  };

  return timelineMap[status] || timelineMap.DRAFT;
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  stepContainer: {
    flexDirection: 'row',
    minHeight: 60,
  },
  stepIndicator: {
    width: 40,
    alignItems: 'center',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    backgroundColor: '#059669',
  },
  circleCurrent: {
    backgroundColor: '#059669',
    borderWidth: 3,
    borderColor: '#d1fae5',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  stepNumberCurrent: {
    color: '#fff',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  lineCompleted: {
    backgroundColor: '#059669',
  },
  stepContent: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 20,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  stepLabelCurrent: {
    color: '#0f172a',
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
});
