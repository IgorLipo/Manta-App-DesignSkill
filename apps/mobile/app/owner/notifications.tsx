import { View, Text, StyleSheet, SafeAreaView, FlatList } from 'react-native';

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <FlatList
        data={[]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.notifCard}>
            <Text style={styles.notifTitle}>{item.title}</Text>
            <Text style={styles.notifBody}>{item.body}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  notifCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  notifTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  notifBody: { fontSize: 13, color: '#64748b' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 60, fontSize: 15 },
});
