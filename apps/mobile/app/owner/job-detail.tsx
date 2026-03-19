import { View, Text, StyleSheet, ScrollView, Pressable, Image, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { Timeline, getJobTimeline } from '../../src/components/ui/Timeline';

const MOCK_JOB = {
  id: '1',
  address: '14 Oak Avenue, Bristol BS1 4LG',
  postcode: 'BS1 4LG',
  propertyType: 'Detached House',
  status: 'SCHEDULED',
  priority: 'medium',
  updatedAt: new Date().toISOString(),
  adminNotes: 'Scaffolding scheduled for March 25th',
  scheduleDate: '2026-03-25',
  photos: ['https://picsum.photos/400/300', 'https://picsum.photos/400/301', 'https://picsum.photos/400/302'],
};

export default function JobDetailScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const timeline = getJobTimeline(MOCK_JOB.status);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}>
      <View style={styles.content}>
        <StatusBadge status={MOCK_JOB.status as any} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineCard}>
            <Timeline steps={timeline} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property</Text>
          <View style={styles.card}>
            <Text style={styles.address}>{MOCK_JOB.address}</Text>
            <Text style={styles.detail}>Postcode: {MOCK_JOB.postcode}</Text>
            <Text style={styles.detail}>Type: {MOCK_JOB.propertyType}</Text>
          </View>
        </View>

        {MOCK_JOB.photos && MOCK_JOB.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <View style={styles.photoGrid}>
              {MOCK_JOB.photos.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.photo} />
              ))}
            </View>
          </View>
        )}

        {MOCK_JOB.adminNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{MOCK_JOB.adminNotes}</Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          {MOCK_JOB.status === 'AWAITING_OWNER_SUBMISSION' && (
            <Pressable style={styles.primaryButton} onPress={() => router.push('/owner/submit')}>
              <Text style={styles.primaryButtonText}>Submit Photos</Text>
            </Pressable>
          )}
          {MOCK_JOB.status === 'SCHEDULED' && (
            <Pressable style={styles.primaryButton} onPress={() => router.push('/owner/schedule')}>
              <Text style={styles.primaryButtonText}>View Schedule</Text>
            </Pressable>
          )}
          {MOCK_JOB.status === 'NEEDS_MORE_INFO' && (
            <>
              <Pressable style={styles.primaryButton} onPress={() => router.push('/owner/submit')}>
                <Text style={styles.primaryButtonText}>Resubmit Photos</Text>
              </Pressable>
              <View style={styles.notesCard}>
                <Text style={styles.notesLabel}>Admin Notes:</Text>
                <Text style={styles.notesText}>{MOCK_JOB.adminNotes}</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16 },
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
