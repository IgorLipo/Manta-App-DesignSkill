import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { jobsApi, getErrorMessage } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/authStore';
import { Job, JobStatus } from '../../src/stores/jobStore';

const STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: 'Draft',
  AWAITING_OWNER_SUBMISSION: 'Awaiting Your Photos',
  SUBMITTED: 'Submitted',
  NEEDS_MORE_INFO: 'More Info Needed',
  VALIDATED: 'Validated',
  ASSIGNED_TO_SCAFFOLDER: 'Scaffolder Assigned',
  QUOTE_PENDING: 'Quote Pending',
  QUOTE_SUBMITTED: 'Quote Submitted',
  QUOTE_REVISION_REQUESTED: 'Revision Requested',
  QUOTE_APPROVED: 'Quote Approved',
  QUOTE_REJECTED: 'Quote Rejected',
  SCHEDULING_IN_PROGRESS: 'Scheduling',
  SCHEDULED: 'Scheduled',
  SCAFFOLD_WORK_IN_PROGRESS: 'Scaffold in Progress',
  SCAFFOLD_COMPLETE: 'Scaffold Complete',
  INSTALLER_ASSIGNED: 'Installer Assigned',
  SITE_REPORT_PENDING: 'Report Pending',
  SITE_REPORT_IN_PROGRESS: 'Report In Progress',
  SITE_REPORT_SUBMITTED: 'Report Submitted',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ON_HOLD: 'On Hold',
};

const STATUS_COLORS: Record<string, string> = {
  AWAITING_OWNER_SUBMISSION: '#f59e0b',
  QUOTE_APPROVED: '#059669',
  SCHEDULED: '#0284c7',
  NEEDS_MORE_INFO: '#f97316',
  QUOTE_PENDING: '#4f46e5',
  VALIDATED: '#0d9488',
  ASSIGNED_TO_SCAFFOLDER: '#9333ea',
  SUBMITTED: '#2563eb',
  SCHEDULING_IN_PROGRESS: '#0891b2',
  SCAFFOLD_WORK_IN_PROGRESS: '#ca8a04',
  SCAFFOLD_COMPLETE: '#059669',
  INSTALLER_ASSIGNED: '#7c3aed',
  SITE_REPORT_PENDING: '#db2777',
  SITE_REPORT_IN_PROGRESS: '#e11d48',
  SITE_REPORT_SUBMITTED: '#059669',
  COMPLETED: '#059669',
  CANCELLED: '#64748b',
  ON_HOLD: '#9333ea',
  DRAFT: '#64748b',
};

interface JobListItem {
  id: string;
  address: string;
  postcode?: string;
  status: JobStatus;
  priority: 'high' | 'medium' | 'normal';
  updatedAt: string;
}

export default function OwnerJobsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setError(null);
      const { data } = await jobsApi.list({ limit: 50 });
      // API returns { data: jobs[], total, page, limit }
      const jobList = Array.isArray(data) ? data : (data.data || []);
      setJobs(jobList);
    } catch (err: any) {
      const message = getErrorMessage(err);
      setError(message);
      // If 401, redirect to login
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

  const getNameInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderJobCard = ({ item }: { item: JobListItem }) => (
    <Pressable
      style={styles.jobCard}
      onPress={() => router.push({ pathname: '/owner/job-detail', params: { jobId: item.id } })}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobAddress}>{item.address}</Text>
        <Text style={styles.jobArrow}>›</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || '#64748b') + '20' }]}>
        <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || '#64748b' }]}>
          {STATUS_LABELS[item.status] || item.status}
        </Text>
      </View>
      <Text style={styles.updated}>Updated {new Date(item.updatedAt).toLocaleDateString()}</Text>
    </Pressable>
  );

  const renderSkeleton = () => (
    <>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.jobCard, { opacity: 0.6 }]}>
          <View style={styles.jobHeader}>
            <View style={{ height: 16, backgroundColor: '#e2e8f0', borderRadius: 4, width: '70%' }} />
            <View style={{ width: 20, height: 20, backgroundColor: '#e2e8f0', borderRadius: 10 }} />
          </View>
          <View style={{ height: 24, width: 100, backgroundColor: '#e2e8f0', borderRadius: 12, marginTop: 10 }} />
          <View style={{ height: 12, width: 60, backgroundColor: '#e2e8f0', borderRadius: 4, marginTop: 8 }} />
        </View>
      ))}
    </>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name ? getNameInitials(user.name) : 'U'}</Text></View>
            <View>
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.name}>{user?.name || 'User'}</Text>
            </View>
          </View>
          <View style={styles.badge}><Text style={styles.badgeText}>Owner</Text></View>
        </View>
        <View style={{ padding: 16 }}>
          <Text style={styles.sectionTitle}>My Properties</Text>
          {renderSkeleton()}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name ? getNameInitials(user.name) : 'U'}</Text></View>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.name}>{user?.name || 'User'}</Text>
          </View>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>Owner</Text></View>
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
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        ListHeaderComponent={<Text style={styles.sectionTitle}>My Properties ({jobs.length})</Text>}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No jobs yet</Text>
            <Text style={styles.emptySubtext}>Submit your property to get started</Text>
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
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, backgroundColor: '#d1fae5', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#059669' },
  greeting: { fontSize: 12, color: '#64748b' },
  name: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  badge: { backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, color: '#059669', fontWeight: '500' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  jobCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginBottom: 10 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  jobAddress: { fontSize: 15, fontWeight: '600', color: '#1e293b', flex: 1 },
  jobArrow: { fontSize: 20, color: '#cbd5e1' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  updated: { fontSize: 12, color: '#94a3b8' },
  errorContainer: { backgroundColor: '#fee2e2', padding: 12, marginHorizontal: 16, marginTop: 8, borderRadius: 8 },
  errorText: { color: '#dc2626', fontSize: 14 },
  retryText: { color: '#dc2626', fontSize: 12, marginTop: 4, fontWeight: '600', textDecorationLine: 'underline' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#64748b', fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
});
