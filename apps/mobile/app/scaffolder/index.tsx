import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { jobsApi, getErrorMessage } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/authStore';
import { JobStatus } from '../../src/stores/jobStore';

const STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: 'Draft',
  AWAITING_OWNER_SUBMISSION: 'Awaiting Photos',
  SUBMITTED: 'Submitted',
  NEEDS_MORE_INFO: 'More Info Needed',
  VALIDATED: 'Validated',
  ASSIGNED_TO_SCAFFOLDER: 'Assigned to You',
  QUOTE_PENDING: 'Quote Needed',
  QUOTE_SUBMITTED: 'Quote Submitted',
  QUOTE_REVISION_REQUESTED: 'Revision Requested',
  QUOTE_APPROVED: 'Quote Approved',
  QUOTE_REJECTED: 'Quote Rejected',
  SCHEDULING_IN_PROGRESS: 'Scheduling',
  SCHEDULED: 'Work Scheduled',
  SCAFFOLD_WORK_IN_PROGRESS: 'Work in Progress',
  SCAFFOLD_COMPLETE: 'Complete',
  INSTALLER_ASSIGNED: 'Installer Assigned',
  SITE_REPORT_PENDING: 'Report Pending',
  SITE_REPORT_IN_PROGRESS: 'Report In Progress',
  SITE_REPORT_SUBMITTED: 'Report Submitted',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ON_HOLD: 'On Hold',
};

const STATUS_COLORS: Record<string, string> = {
  QUOTE_PENDING: '#4f46e5',
  QUOTE_APPROVED: '#059669',
  SCHEDULED: '#0284c7',
  ASSIGNED_TO_SCAFFOLDER: '#9333ea',
  QUOTE_SUBMITTED: '#2563eb',
  QUOTE_REVISION_REQUESTED: '#f97316',
  SCHEDULING_IN_PROGRESS: '#0891b2',
  SCAFFOLD_WORK_IN_PROGRESS: '#ca8a04',
  SCAFFOLD_COMPLETE: '#059669',
  VALIDATED: '#0d9488',
  NEEDS_MORE_INFO: '#f97316',
  SUBMITTED: '#2563eb',
  AWAITING_OWNER_SUBMISSION: '#f59e0b',
  COMPLETED: '#059669',
  CANCELLED: '#64748b',
  ON_HOLD: '#9333ea',
  DRAFT: '#64748b',
  INSTALLER_ASSIGNED: '#7c3aed',
  SITE_REPORT_PENDING: '#db2777',
  SITE_REPORT_IN_PROGRESS: '#e11d48',
  SITE_REPORT_SUBMITTED: '#059669',
};

const PRIORITY_COLORS = { high: '#dc2626', medium: '#f59e0b', normal: '#64748b' };

interface JobListItem {
  id: string;
  address: string;
  postcode?: string;
  status: JobStatus;
  priority: 'high' | 'medium' | 'normal';
  updatedAt: string;
}

export default function ScaffolderJobsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setError(null);
      // Fetch jobs - the API will filter by the current user's ID (scaffolder)
      const { data } = await jobsApi.list({ limit: 50 });
      const jobList = Array.isArray(data) ? data : (data.data || []);
      setJobs(jobList);
    } catch (err: any) {
      const message = getErrorMessage(err);
      setError(message);
      if (err.response?.status === 401) {
        router.replace('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const renderJobCard = ({ item }: { item: JobListItem }) => (
    <Pressable
      style={styles.jobCard}
      onPress={() => router.push({ pathname: '/scaffolder/job-detail', params: { jobId: item.id } })}
    >
      <View style={styles.jobTop}>
        <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[item.priority] }]} />
        <Text style={styles.jobAddress}>{item.address}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || '#64748b') + '20' }]}>
        <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || '#64748b' }]}>
          {STATUS_LABELS[item.status] || item.status}
        </Text>
      </View>
      <View style={styles.jobFooter}>
        <Text style={styles.updated}>Updated {new Date(item.updatedAt).toLocaleDateString()}</Text>
        <Pressable style={styles.actionButton}>
          <Text style={styles.actionButtonText}>View Details</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  const renderSkeleton = () => (
    <>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.jobCard, { opacity: 0.6 }]}>
          <View style={styles.jobTop}>
            <View style={{ width: 8, height: 8, backgroundColor: '#e2e8f0', borderRadius: 4 }} />
            <View style={{ height: 16, backgroundColor: '#e2e8f0', borderRadius: 4, width: '60%' }} />
          </View>
          <View style={{ height: 24, width: 120, backgroundColor: '#e2e8f0', borderRadius: 12, marginTop: 10 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <View style={{ height: 12, width: 80, backgroundColor: '#e2e8f0', borderRadius: 4 }} />
            <View style={{ height: 28, width: 100, backgroundColor: '#e2e8f0', borderRadius: 8 }} />
          </View>
        </View>
      ))}
    </>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.name}>{user?.name || 'Scaffolder'}</Text>
          </View>
          <View style={styles.badge}><Text style={styles.badgeText}>Scaffolder</Text></View>
        </View>
        <View style={{ padding: 16 }}>
          <Text style={styles.sectionTitle}>Assigned Jobs</Text>
          {renderSkeleton()}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.name}>{user?.name || 'Scaffolder'}</Text>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>Scaffolder</Text></View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={fetchJobs}><Text style={styles.retryText}>Tap to retry</Text></Pressable>
        </View>
      )}

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Assigned Jobs ({jobs.length})</Text>}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No jobs assigned</Text>
            <Text style={styles.emptySubtext}>Jobs assigned to you will appear here</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
        renderItem={renderJobCard}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 12, color: '#64748b' },
  name: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  badge: { backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, color: '#059669', fontWeight: '500' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  jobCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginBottom: 10 },
  jobTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  jobAddress: { fontSize: 15, fontWeight: '600', color: '#1e293b', flex: 1 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  updated: { fontSize: 12, color: '#94a3b8' },
  actionButton: { backgroundColor: '#059669', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  errorContainer: { backgroundColor: '#fee2e2', padding: 12, marginHorizontal: 16, marginTop: 8, borderRadius: 8 },
  errorText: { color: '#dc2626', fontSize: 14 },
  retryText: { color: '#dc2626', fontSize: 12, marginTop: 4, fontWeight: '600', textDecorationLine: 'underline' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#64748b', fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
});
