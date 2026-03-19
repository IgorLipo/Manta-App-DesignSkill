import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { Job } from '../../stores/jobStore';
import { StatusBadge } from './StatusBadge';

interface JobCardProps {
  job: Job;
  onPress: () => void;
}

const PRIORITY_COLORS = {
  high: '#dc2626',
  medium: '#f59e0b',
  normal: '#64748b',
};

export function JobCard({ job, onPress }: JobCardProps) {
  const formatDate = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return date;
    }
  };

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        {job.priority === 'high' && (
          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS.high }]} />
        )}
        {job.priority === 'medium' && (
          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS.medium }]} />
        )}
        <Text style={styles.address} numberOfLines={1}>{job.address}</Text>
        <Text style={styles.arrow}>›</Text>
      </View>

      <View style={styles.statusRow}>
        <StatusBadge status={job.status} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.updated}>Updated {formatDate(job.updatedAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  address: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  arrow: {
    fontSize: 20,
    color: '#cbd5e1',
  },
  statusRow: {
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  updated: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
