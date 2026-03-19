import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';

const MOCK_JOB = {
  id: '1',
  address: '14 Oak Avenue, Bristol BS1 4LG',
  postcode: 'BS1 4LG',
  propertyType: 'Detached House',
  accessNotes: 'Easy access via driveway. Neighbour has agreed to allow parking.',
  status: 'QUOTE_PENDING',
  location: { latitude: 51.4545, longitude: -2.5879 },
  photos: ['https://picsum.photos/400/300', 'https://picsum.photos/400/301', 'https://picsum.photos/400/302'],
  quote: null,
};

export default function ScaffolderJobDetailScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property</Text>
          <View style={styles.card}>
            <Text style={styles.address}>{MOCK_JOB.address}</Text>
            <Text style={styles.detail}>Postcode: {MOCK_JOB.postcode}</Text>
            <Text style={styles.detail}>Type: {MOCK_JOB.propertyType}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Access Notes</Text>
          <View style={styles.card}>
            <Text style={styles.detail}>{MOCK_JOB.accessNotes}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.card}>
            <Text style={styles.detail}>Lat: {MOCK_JOB.location.latitude.toFixed(6)}</Text>
            <Text style={styles.detail}>Lng: {MOCK_JOB.location.longitude.toFixed(6)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <View style={styles.photoGrid}>
            {MOCK_JOB.photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.photo} />
            ))}
          </View>
        </View>

        {MOCK_JOB.quote && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Quote</Text>
            <View style={styles.quoteCard}>
              <Text style={styles.quoteAmount}>£{MOCK_JOB.quote.amount}</Text>
              <Text style={styles.quoteStatus}>{MOCK_JOB.quote.status}</Text>
              <Text style={styles.quoteDate}>Start: {MOCK_JOB.quote.startDate}</Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          {MOCK_JOB.status === 'QUOTE_PENDING' && (
            <Pressable style={styles.primaryButton} onPress={() => router.push('/scaffolder/quote')}>
              <Text style={styles.primaryButtonText}>Submit Quote</Text>
            </Pressable>
          )}
          {MOCK_JOB.status === 'QUOTE_APPROVED' && (
            <Pressable style={styles.primaryButton} onPress={() => router.push('/scaffolder/schedule')}>
              <Text style={styles.primaryButtonText}>View Schedule</Text>
            </Pressable>
          )}
          {MOCK_JOB.status === 'SCHEDULED' && (
            <Pressable style={styles.primaryButton} onPress={() => router.push('/scaffolder/complete')}>
              <Text style={styles.primaryButtonText}>Mark Work Complete</Text>
            </Pressable>
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
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 16 },
  address: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
  detail: { fontSize: 14, color: '#64748b', marginTop: 4 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { width: '31%', aspectRatio: 1, borderRadius: 8 },
  quoteCard: { backgroundColor: '#ecfdf5', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#a7f3d0' },
  quoteAmount: { fontSize: 24, fontWeight: 'bold', color: '#059669' },
  quoteStatus: { fontSize: 14, color: '#059669', fontWeight: '600', marginTop: 4 },
  quoteDate: { fontSize: 14, color: '#374151', marginTop: 4 },
  actions: { marginTop: 24, gap: 12 },
  primaryButton: { backgroundColor: '#059669', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
