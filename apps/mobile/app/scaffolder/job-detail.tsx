import { View, Text, StyleSheet, ScrollView, Pressable, Image, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { jobsApi, getErrorMessage } from '../../src/lib/api';
import { JobStatus } from '../../src/stores/jobStore';

interface JobDetail {
  id: string;
  address: string;
  postcode: string;
  propertyType?: string;
  accessNotes?: string;
  status: JobStatus;
  location?: { latitude: number; longitude: number };
  photos?: { id: string; url: string; category: string }[];
  quote?: {
    amount: number;
    status: string;
    startDate: string;
    endDate: string;
    notes?: string;
  };
}

export default function ScaffolderJobDetailScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) {
      // Demo/mock data
      setJob({
        id: '1',
        address: '14 Oak Avenue, Bristol BS1 4LG',
        postcode: 'BS1 4LG',
        propertyType: 'Detached House',
        accessNotes: 'Easy access via driveway. Neighbour has agreed to allow parking.',
        status: 'QUOTE_PENDING',
        location: { latitude: 51.4545, longitude: -2.5879 },
        photos: [
          { id: '1', url: 'https://picsum.photos/400/300', category: 'EXTERIOR_FRONT' },
          { id: '2', url: 'https://picsum.photos/400/301', category: 'EXTERIOR_REAR' },
          { id: '3', url: 'https://picsum.photos/400/302', category: 'ROOF_OVERVIEW' },
        ],
        quote: null,
      });
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

  const getActionButton = () => {
    switch (job.status) {
      case 'QUOTE_PENDING':
      case 'QUOTE_REVISION_REQUESTED':
        return (
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push({ pathname: '/scaffolder/quote', params: { jobId: job.id } })}
          >
            <Text style={styles.primaryButtonText}>
              {job.status === 'QUOTE_REVISION_REQUESTED' ? 'Submit Revised Quote' : 'Submit Quote'}
            </Text>
          </Pressable>
        );
      case 'QUOTE_APPROVED':
        return (
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push({ pathname: '/scaffolder/schedule', params: { jobId: job.id } })}
          >
            <Text style={styles.primaryButtonText}>View Schedule</Text>
          </Pressable>
        );
      case 'SCHEDULED':
      case 'SCAFFOLD_WORK_IN_PROGRESS':
        return (
          <Pressable style={styles.primaryButton} onPress={() => Alert.alert('Coming Soon', 'Mark work complete feature coming soon.')}>
            <Text style={styles.primaryButtonText}>Mark Work Complete</Text>
          </Pressable>
        );
      default:
        return null;
    }
  };

  const getQuoteStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pending Review',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      REVISION_REQUESTED: 'Revision Requested',
    };
    return labels[status] || status;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
    >
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property</Text>
          <View style={styles.card}>
            <Text style={styles.address}>{job.address}</Text>
            <Text style={styles.detail}>Postcode: {job.postcode}</Text>
            {job.propertyType && <Text style={styles.detail}>Type: {job.propertyType}</Text>}
          </View>
        </View>

        {job.accessNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Access Notes</Text>
            <View style={styles.card}>
              <Text style={styles.detail}>{job.accessNotes}</Text>
            </View>
          </View>
        )}

        {job.location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.card}>
              <Text style={styles.detail}>Lat: {job.location.latitude.toFixed(6)}</Text>
              <Text style={styles.detail}>Lng: {job.location.longitude.toFixed(6)}</Text>
            </View>
          </View>
        )}

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

        {job.quote && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Quote</Text>
            <View style={styles.quoteCard}>
              <Text style={styles.quoteAmount}>GBP {job.quote.amount.toLocaleString()}</Text>
              <Text style={styles.quoteStatus}>{getQuoteStatusLabel(job.quote.status)}</Text>
              {job.quote.startDate && <Text style={styles.quoteDate}>Start: {job.quote.startDate}</Text>}
              {job.quote.endDate && <Text style={styles.quoteDate}>End: {job.quote.endDate}</Text>}
              {job.quote.notes && <Text style={styles.quoteNotes}>{job.quote.notes}</Text>}
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
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 16 },
  address: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
  detail: { fontSize: 14, color: '#64748b', marginTop: 4 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { width: '31%', aspectRatio: 1, borderRadius: 8 },
  quoteCard: { backgroundColor: '#ecfdf5', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#a7f3d0' },
  quoteAmount: { fontSize: 24, fontWeight: 'bold', color: '#059669' },
  quoteStatus: { fontSize: 14, color: '#059669', fontWeight: '600', marginTop: 4 },
  quoteDate: { fontSize: 14, color: '#374151', marginTop: 4 },
  quoteNotes: { fontSize: 13, color: '#64748b', marginTop: 8, fontStyle: 'italic' },
  actions: { marginTop: 24, gap: 12 },
  primaryButton: { backgroundColor: '#059669', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
