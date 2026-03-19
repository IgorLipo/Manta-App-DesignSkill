import { View, Text, StyleSheet, ScrollView, Pressable, Image, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { jobsApi, getErrorMessage } from '../../src/lib/api';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { Timeline, getJobTimeline } from '../../src/components/ui/Timeline';
import { JobStatus } from '../../src/stores/jobStore';

interface JobDetail {
  id: string;
  address: string;
  postcode: string;
  propertyType?: string;
  status: JobStatus;
  priority: 'high' | 'medium' | 'normal';
  updatedAt: string;
  adminNotes?: string;
  scheduleDate?: string;
  photos?: { id: string; url: string; category: string }[];
  location?: { latitude: number; longitude: number };
}

export default function JobDetailScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) {
      setError('No job ID provided');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data } = await jobsApi.get(jobId);
      setJob(data);
    } catch (err: any) {
      const message = getErrorMessage(err);
      setError(message);
      if (err.response?.status === 401) {
        router.replace('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJob();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Failed to load job details'}</Text>
          <Pressable style={styles.retryButton} onPress={fetchJob}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const timeline = getJobTimeline(job.status);

  const getActionButton = () => {
    switch (job.status) {
      case 'AWAITING_OWNER_SUBMISSION':
        return (
          <Pressable style={styles.primaryButton} onPress={() => router.push('/owner/submit')}>
            <Text style={styles.primaryButtonText}>Submit Photos</Text>
          </Pressable>
        );
      case 'SCHEDULED':
        return (
          <Pressable style={styles.primaryButton} onPress={() => router.push('/owner/schedule')}>
            <Text style={styles.primaryButtonText}>View Schedule</Text>
          </Pressable>
        );
      case 'NEEDS_MORE_INFO':
        return (
          <>
            <Pressable style={styles.primaryButton} onPress={() => router.push('/owner/submit')}>
              <Text style={styles.primaryButtonText}>Resubmit Photos</Text>
            </Pressable>
            {job.adminNotes && (
              <View style={styles.notesCard}>
                <Text style={styles.notesLabel}>Admin Notes:</Text>
                <Text style={styles.notesText}>{job.adminNotes}</Text>
              </View>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
    >
      <View style={styles.content}>
        <StatusBadge status={job.status} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineCard}>
            <Timeline steps={timeline} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property</Text>
          <View style={styles.card}>
            <Text style={styles.address}>{job.address}</Text>
            <Text style={styles.detail}>Postcode: {job.postcode}</Text>
            {job.propertyType && <Text style={styles.detail}>Type: {job.propertyType}</Text>}
          </View>
        </View>

        {job.photos && job.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <View style={styles.photoGrid}>
              {job.photos.map((photo, i) => (
                <Image key={photo.id || i} source={{ uri: photo.url }} style={styles.photo} />
              ))}
            </View>
          </View>
        )}

        {job.adminNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{job.adminNotes}</Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          {getActionButton()}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#dc2626', textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#059669', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  timelineCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 16 },
  address: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
  detail: { fontSize: 14, color: '#64748b', marginTop: 4 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { width: '31%', aspectRatio: 1, borderRadius: 8 },
  notesCard: { backgroundColor: '#fff7ed', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#fed7aa' },
  notesLabel: { fontSize: 12, fontWeight: '600', color: '#f97316', marginBottom: 4 },
  notesText: { fontSize: 14, color: '#1e293b' },
  actions: { marginTop: 24, gap: 12 },
  primaryButton: { backgroundColor: '#059669', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
