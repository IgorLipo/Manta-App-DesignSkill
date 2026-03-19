import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable } from 'react-native';

const MOCK_JOBS = [
  { id: '1', address: '14 Oak Avenue, Bristol BS1', status: 'Assigned - Quote Needed', priority: 'high', updated: 'Today' },
  { id: '2', address: '22 Birch Lane, Exeter EX2', status: 'Quote Approved', priority: 'medium', updated: '2 days ago' },
  { id: '3', address: '8 Cedar Drive, Cardiff CF5', status: 'Work Scheduled', priority: 'normal', updated: '1 week ago' },
];

const PRIORITY_COLORS = { high: '#dc2626', medium: '#f59e0b', normal: '#64748b' };

export default function ScaffolderJobsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.name}>Apex Scaffolding Ltd</Text>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>🏗️ Scaffolder</Text></View>
      </View>

      <FlatList
        data={MOCK_JOBS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Assigned Jobs ({MOCK_JOBS.length})</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.jobCard}>
            <View style={styles.jobTop}>
              <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS] }]} />
              <Text style={styles.jobAddress}>{item.address}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: '#dbeafe20' }]}>
              <Text style={[styles.statusText, { color: '#2563eb' }]}>{item.status}</Text>
            </View>
            <View style={styles.jobFooter}>
              <Text style={styles.updated}>Updated {item.updated}</Text>
              <Pressable style={styles.actionButton}>
                <Text style={styles.actionButtonText}>View Details</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 12, color: '#64748b' },
  name: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  badge: { backgroundColor: '#fff7ed', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, color: '#ea580c', fontWeight: '500' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  jobCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginBottom: 10 },
  jobTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  jobAddress: { fontSize: 15, fontWeight: '600', color: '#1e293b', flex: 1 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  updated: { fontSize: 12, color: '#94a3b8' },
  actionButton: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
