import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, checkAuth } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      setChecked(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (!checked || isLoading) return;

    if (isAuthenticated && user) {
      // Role-based redirect
      switch (user.role) {
        case 'OWNER':
          router.replace('/owner');
          break;
        case 'SCAFFOLDER':
          router.replace('/scaffolder');
          break;
        case 'ENGINEER':
          router.replace('/engineer');
          break;
        case 'ADMIN':
          router.replace('/admin');
          break;
        default:
          router.replace('/owner');
      }
    } else {
      router.replace('/auth/login');
    }
  }, [checked, isLoading, isAuthenticated, user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>SO</Text>
          </View>
          <Text style={styles.title}>Solar Ops</Text>
          <Text style={styles.subtitle}>UK Solar Installation Platform</Text>
        </View>
        <ActivityIndicator size="large" color="#059669" style={styles.loader} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 48 },
  logo: { width: 80, height: 80, backgroundColor: '#059669', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  loader: { marginTop: 32 },
});
