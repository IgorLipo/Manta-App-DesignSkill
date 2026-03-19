import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const MOCK_JOBS = [
  { id: '1', address: '14 Oak Avenue, Bristol BS1', status: 'AWAITING_OWNER_SUBMISSION', priority: 'medium', updated: new Date().toISOString() },
  { id: '2', address: '7 Pine Road, Exeter EX2', status: 'QUOTE_APPROVED', priority: 'normal', updated: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: '3', address: '3 Elm Close, Cardiff CF5', status: 'SCHEDULED', priority: 'normal', updated: new Date(Date.now() - 86400000 * 3).toISOString() },
];

const STATUS_LABELS: Record<string, string> = {
  AWAITING_OWNER_SUBMISSION: 'Awaiting Your Photos',
  QUOTE_APPROVED: 'Quote Approved',
  SCHEDULED: 'Scheduled',
};

const STATUS_COLORS: Record<string, string> = {
  AWAITING_OWNER_SUBMISSION: '#f59e0b',
  QUOTE_APPROVED: '#059669',
  SCHEDULED: '#0284c7',
};

export default function OwnerJobsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>JS</Text></View>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.name}>John Smith</Text>
          </View>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>Owner</Text></View>
      </View>

      <FlatList
        data={MOCK_JOBS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        ListHeaderComponent={<Text style={styles.sectionTitle}>My Properties</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
        renderItem={({ item }) => (
          <Pressable style={styles.jobCard} onPress={() => router.push('/owner/job-detail')}>
            <View style={styles.jobHeader}>
              <Text style={styles.jobAddress}>{item.address}</Text>
              <Text style={styles.jobArrow}>›</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
              <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{STATUS_LABELS[item.status]}</Text>
            </View>
            <Text style={styles.updated}>Updated {new Date(item.updated).toLocaleDateString()}</Text>
          </Pressable>
        )}
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
});
