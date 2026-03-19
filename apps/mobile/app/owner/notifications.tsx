import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { notificationsApi, getErrorMessage } from '../../src/lib/api';

interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const { data } = await notificationsApi.list();
      const notifList = Array.isArray(data) ? data : (data.data || []);
      setNotifications(notifList);
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
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err: any) {
      // Silently fail - notification will still be shown
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <Pressable
      style={[styles.notifCard, !item.isRead && styles.unreadCard]}
      onPress={() => {
        if (!item.isRead) {
          markAsRead(item.id);
        }
      }}
    >
      <View style={styles.notifHeader}>
        <Text style={[styles.notifTitle, !item.isRead && styles.unreadTitle]}>{item.title}</Text>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
      <Text style={styles.notifBody}>{item.body}</Text>
      <Text style={styles.notifTime}>{formatDate(item.createdAt)}</Text>
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Notifications</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={fetchNotifications}><Text style={styles.retryText}>Tap to retry</Text></Pressable>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>You'll receive updates about your jobs here</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
        renderItem={renderNotification}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  notifCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  unreadCard: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 4, flex: 1 },
  unreadTitle: { color: '#059669' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#059669', marginLeft: 8 },
  notifBody: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  notifTime: { fontSize: 11, color: '#94a3b8' },
  errorContainer: { backgroundColor: '#fee2e2', padding: 12, marginHorizontal: 16, marginTop: 8, borderRadius: 8 },
  errorText: { color: '#dc2626', fontSize: 14 },
  retryText: { color: '#dc2626', fontSize: 12, marginTop: 4, fontWeight: '600', textDecorationLine: 'underline' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#64748b', fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
});
