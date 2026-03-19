import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { reportsApi, jobsApi, getErrorMessage } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/authStore';

interface Report {
  id: string;
  jobId: string;
  jobAddress?: string;
  status: 'DRAFT' | 'SUBMITTED';
  updatedAt: string;
}

export default function EngineerReportsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setError(null);
      const { data } = await reportsApi.list();
      const reportList = Array.isArray(data) ? data : (data.data || []);

      // Enrich reports with job addresses
      const enrichedReports = await Promise.all(
        reportList.map(async (report: Report) => {
          try {
            const { data: job } = await jobsApi.get(report.jobId);
            return { ...report, jobAddress: job.address };
          } catch {
            return { ...report, jobAddress: 'Unknown Address' };
          }
        })
      );

      setReports(enrichedReports);
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
    await fetchReports();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getStatusBadge = (status: string) => {
    const isDraft = status === 'DRAFT';
    return {
      backgroundColor: isDraft ? '#fef3c7' : '#d1fae5',
      textColor: isDraft ? '#d97706' : '#059669',
      label: isDraft ? 'Draft' : 'Submitted',
    };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const renderReportCard = ({ item }: { item: Report }) => {
    const statusBadge = getStatusBadge(item.status);

    return (
      <Pressable
        style={styles.reportCard}
        onPress={() => router.push({ pathname: '/engineer/report', params: { reportId: item.id, jobId: item.jobId } })}
      >
        <Text style={styles.reportAddress}>{item.jobAddress || `Job #${item.jobId}`}</Text>
        <View style={styles.reportRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusBadge.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusBadge.textColor }]}>{statusBadge.label}</Text>
          </View>
          <Text style={styles.updated}>{formatDate(item.updatedAt)}</Text>
        </View>
      </Pressable>
    );
  };

  const renderSkeleton = () => (
    <>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.reportCard, { opacity: 0.6 }]}>
          <View style={{ height: 16, backgroundColor: '#e2e8f0', borderRadius: 4, width: '60%', marginBottom: 10 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ height: 24, width: 70, backgroundColor: '#e2e8f0', borderRadius: 12 }} />
            <View style={{ height: 12, width: 60, backgroundColor: '#e2e8f0', borderRadius: 4 }} />
          </View>
        </View>
      ))}
    </>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.name}>{user?.name || 'Engineer'}</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>Engineer</Text></View>
        </View>
        <View style={{ padding: 16 }}>
          <Text style={styles.sectionTitle}>My Site Reports</Text>
          {renderSkeleton()}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{user?.name || 'Engineer'}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>Engineer</Text></View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={fetchReports}><Text style={styles.retryText}>Tap to retry</Text></Pressable>
        </View>
      )}

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Text style={styles.sectionTitle}>My Site Reports ({reports.length})</Text>}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reports yet</Text>
            <Text style={styles.emptySubtext}>Reports assigned to you will appear here</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
        renderItem={renderReportCard}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  badge: { backgroundColor: '#fdf4ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, color: '#7c3aed', fontWeight: '500' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  reportCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginBottom: 10 },
  reportAddress: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 10 },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  updated: { fontSize: 12, color: '#94a3b8' },
  errorContainer: { backgroundColor: '#fee2e2', padding: 12, marginHorizontal: 16, marginTop: 8, borderRadius: 8 },
  errorText: { color: '#dc2626', fontSize: 14 },
  retryText: { color: '#dc2626', fontSize: 12, marginTop: 4, fontWeight: '600', textDecorationLine: 'underline' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#64748b', fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
});
