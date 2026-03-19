import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable } from 'react-native';

const MOCK_REPORTS = [
  { id: '1', address: '14 Oak Avenue, Bristol', status: 'Draft', updated: 'Today' },
  { id: '2', address: '7 Pine Road, Exeter', status: 'Submitted', updated: '3 days ago' },
];

export default function EngineerReportsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>Site Engineer</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>⚡ Engineer</Text></View>
      </View>
      <FlatList
        data={MOCK_REPORTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Text style={styles.sectionTitle}>My Site Reports</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.reportCard}>
            <Text style={styles.reportAddress}>{item.address}</Text>
            <View style={styles.reportRow}>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'Draft' ? '#fef3c7' : '#d1fae5' }]}>
                <Text style={[styles.statusText, { color: item.status === 'Draft' ? '#d97706' : '#059669' }]}>{item.status}</Text>
              </View>
              <Text style={styles.updated}>{item.updated}</Text>
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
});
